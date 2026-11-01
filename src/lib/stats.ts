import { BOOKS, CATEGORIES, TOTAL_CHAPTERS, type Book, type Category, type Testament } from '../data/books'
import { PLAN, currentWeek, readingKey, TOTAL_PLAN_READINGS } from '../data/plan'
import { chapterKey, type AppData } from './store'

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
  let readingsDone = 0
  let weeksDone = 0
  for (const w of PLAN) {
    const n = w.readings.filter((_, i) => readingKey(w.week, i) in done).length
    readingsDone += n
    if (n === w.readings.length) weeksDone++
  }
  const week = currentWeek(year)
  // Weeks fully elapsed before the current one should be done to be "on track"
  const expectedWeeks = Math.max(0, Math.min(52, week - 1))
  const expectedReadings = PLAN.slice(0, expectedWeeks).reduce((s, w) => s + w.readings.length, 0)
  return {
    readingsDone,
    totalReadings: TOTAL_PLAN_READINGS,
    weeksDone,
    week,
    behind: Math.max(0, expectedReadings - readingsDone),
  }
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
