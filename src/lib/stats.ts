import { BOOKS, CATEGORIES, TOTAL_CHAPTERS, type Book, type Category, type Testament } from '../data/books'
import { PLAN, currentWeek, dayKey, dayOfYear, weekDays, yearDays } from '../data/plan'
import { chapterKey, type AppData, type Goal } from './store'

export const pct = (n: number, total: number) => (total === 0 ? 0 : (n / total) * 100)

export const formatPct = (value: number) => {
  if (value === 0 || value === 100) return `${value}%`
  return value < 10 ? `${value.toFixed(1)}%` : `${Math.floor(value)}%`
}

export function readInBook(data: AppData, book: Book) {
  let n = 0
  for (let c = 1; c <= book.chapters; c++) if (chapterKey(book.id, c) in data.chapters) n++
  return n
}

export interface Progress {
  read: number
  total: number
}

export function bibleStats(data: AppData) {
  const byBook = new Map<string, number>()
  const byTestament: Record<Testament, Progress> = { AT: { read: 0, total: 0 }, NT: { read: 0, total: 0 } }
  const byCategory = new Map<Category, Progress>(CATEGORIES.map((c) => [c, { read: 0, total: 0 }]))
  let read = 0
  let booksDone = 0

  for (const book of BOOKS) {
    const n = readInBook(data, book)
    byBook.set(book.id, n)
    read += n
    if (n === book.chapters) booksDone++
    byTestament[book.testament].read += n
    byTestament[book.testament].total += book.chapters
    const cat = byCategory.get(book.category)!
    cat.read += n
    cat.total += book.chapters
  }

  return { read, total: TOTAL_CHAPTERS, booksDone, byBook, byTestament, byCategory }
}

export function planStats(data: AppData, year: number) {
  const done = data.plans[year] ?? {}
  const days = yearDays(year)
  const now = new Date()
  // Days before today should be done to be "on track"
  const expected = year < now.getFullYear() ? days.length : year > now.getFullYear() ? 0 : dayOfYear(now)

  let daysDone = 0
  let doneBefore = 0
  days.forEach((d, i) => {
    if (dayKey(d.week, d.day) in done) {
      daysDone++
      if (i < expected) doneBefore++
    }
  })
  const weeksDone = PLAN.filter((w) => weekDays(year, w.week).every((d) => dayKey(d.week, d.day) in done)).length

  return {
    daysDone,
    totalDays: days.length,
    weeksDone,
    week: currentWeek(year),
    behind: expected - doneBefore,
  }
}

const DAY_MS = 86_400_000
const parseDate = (s: string) => new Date(s + 'T12:00')
const daysBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY_MS)

export function goalStats(goal: Goal, stats: ReturnType<typeof bibleStats>) {
  const { read, total } = goal.scope === 'all' ? stats : stats.byTestament[goal.scope]
  const now = parseDate(dateKey(new Date()))
  const start = parseDate(goal.start)
  const deadline = parseDate(goal.deadline)
  const remaining = total - read
  const daysLeft = Math.max(1, daysBetween(now, deadline) + 1)
  const span = Math.max(1, daysBetween(start, deadline) + 1)
  const elapsed = Math.min(span, Math.max(0, daysBetween(start, now)))
  const expected = goal.startRead + ((total - goal.startRead) * elapsed) / span
  return {
    read,
    total,
    remaining,
    daysLeft,
    overdue: daysBetween(now, deadline) < 0,
    perDay: Math.ceil(remaining / daysLeft),
    ahead: Math.round(read - expected),
  }
}

/** Chapters, active days and finished books for one calendar year */
export function yearStats(data: AppData, year: number) {
  const prefix = `${year}-`
  const byMonth = Array.from({ length: 12 }, () => 0)
  let chapters = 0
  for (const date of Object.values(data.chapters)) {
    if (date.startsWith(prefix)) {
      chapters++
      byMonth[Number(date.slice(5, 7)) - 1]++
    }
  }

  const active = new Set([...activityByDay(data).keys()].filter((d) => d.startsWith(prefix)))
  let bestStreak = 0
  for (const d of active) {
    const prev = parseDate(d)
    prev.setDate(prev.getDate() - 1)
    if (active.has(dateKey(prev))) continue // not the start of a run
    let n = 0
    const cur = parseDate(d)
    while (active.has(dateKey(cur))) {
      n++
      cur.setDate(cur.getDate() + 1)
    }
    bestStreak = Math.max(bestStreak, n)
  }

  const booksFinished: { book: Book; date: string }[] = []
  for (const book of BOOKS) {
    let last = ''
    let complete = true
    for (let c = 1; c <= book.chapters && complete; c++) {
      const d = data.chapters[chapterKey(book.id, c)]
      if (!d) complete = false
      else if (d > last) last = d
    }
    if (complete && last.startsWith(prefix)) booksFinished.push({ book, date: last })
  }
  booksFinished.sort((a, b) => a.date.localeCompare(b.date))

  return { chapters, byMonth, activeDays: active.size, bestStreak, booksFinished }
}

/** Years that have any activity, newest first, with chapters read in each */
export function activeYears(data: AppData) {
  const years = new Map<number, number>()
  for (const d of activityByDay(data).keys()) years.set(Number(d.slice(0, 4)), 0)
  for (const d of Object.values(data.chapters)) {
    const y = Number(d.slice(0, 4))
    years.set(y, (years.get(y) ?? 0) + 1)
  }
  return [...years.entries()].sort((a, b) => b[0] - a[0])
}

/** Every day with any activity (chapters or plan readings), with a count */
export function activityByDay(data: AppData) {
  const days = new Map<string, number>()
  const add = (d: string) => days.set(d, (days.get(d) ?? 0) + 1)
  Object.values(data.chapters).forEach(add)
  Object.values(data.plans).forEach((p) => Object.values(p).forEach(add))
  return days
}

export function dateKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Consecutive days with activity, ending today (or yesterday if today is still empty) */
export function streak(days: Map<string, number>) {
  const d = new Date()
  if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (days.has(dateKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

/** First unread chapter, starting from the book read most recently */
export function nextChapter(data: AppData): { book: Book; chapter: number } | null {
  let latestBook: Book | null = null
  let latest = ''
  for (const [key, date] of Object.entries(data.chapters)) {
    if (date >= latest) {
      latest = date
      latestBook = BOOKS.find((b) => b.id === key.split(':')[0]) ?? null
    }
  }
  const start = latestBook ? BOOKS.indexOf(latestBook) : 0
  for (let i = 0; i < BOOKS.length; i++) {
    const book = BOOKS[(start + i) % BOOKS.length]
    for (let c = 1; c <= book.chapters; c++) {
      if (!(chapterKey(book.id, c) in data.chapters)) return { book, chapter: c }
    }
  }
  return null
}
