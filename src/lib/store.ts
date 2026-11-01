import { useSyncExternalStore } from 'react'
import { BOOK_BY_ID, type Testament } from '../data/books'
import type { Reading } from '../data/plan'

export type Theme = 'system' | 'light' | 'dark'

export interface Goal {
  scope: 'all' | Testament
  /** Day the goal was set, and how many chapters of the scope were read by then */
  start: string
  startRead: number
  deadline: string
}

export interface AppData {
  version: 1
  /** "GEN:1" -> local date (YYYY-MM-DD) the chapter was marked as read */
  chapters: Record<string, string>
  /** year -> plan day key ("d{week}-{day}") -> local date it was completed */
  plans: Record<string, Record<string, string>>
  goal: Goal | null
  settings: {
    /** When a plan day is checked, also mark its chapters in the Bible tracker */
    syncPlanToBible: boolean
    theme: Theme
  }
}

const STORAGE_KEY = 'bible-challenge:v1'

const EMPTY: AppData = {
  version: 1,
  chapters: {},
  plans: {},
  goal: null,
  settings: { syncPlanToBible: false, theme: 'system' },
}

export const chapterKey = (bookId: string, chapter: number) => `${bookId}:${chapter}`

export function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function normalize(raw: unknown): AppData {
  const data = (raw ?? {}) as Partial<AppData>
  return {
    version: 1,
    chapters: data.chapters && typeof data.chapters === 'object' ? data.chapters : {},
    plans: data.plans && typeof data.plans === 'object' ? data.plans : {},
    goal: data.goal && typeof data.goal === 'object' ? data.goal : null,
    settings: { ...EMPTY.settings, ...(data.settings ?? {}) },
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalize(JSON.parse(raw)) : EMPTY
  } catch {
    return EMPTY
  }
}

let state: AppData = load()
const listeners = new Set<() => void>()

function setState(next: AppData) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked: keep working in memory
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Keep several open tabs in sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      state = load()
      listeners.forEach((l) => l())
    }
  })
}

export function useData() {
  return useSyncExternalStore(subscribe, () => state)
}

function withChapters(chapters: Record<string, string>, bookId: string, from: number, to: number, read: boolean) {
  const next = { ...chapters }
  const date = today()
  for (let c = from; c <= to; c++) {
    const key = chapterKey(bookId, c)
    if (read) next[key] ??= date
    else delete next[key]
  }
  return next
}

export const actions = {
  toggleChapter(bookId: string, chapter: number) {
    const key = chapterKey(bookId, chapter)
    const read = !(key in state.chapters)
    setState({ ...state, chapters: withChapters(state.chapters, bookId, chapter, chapter, read) })
  },

  setChapters(bookId: string, from: number, to: number, read: boolean) {
    setState({ ...state, chapters: withChapters(state.chapters, bookId, from, to, read) })
  },

  setBook(bookId: string, read: boolean) {
    actions.setChapters(bookId, 1, BOOK_BY_ID[bookId].chapters, read)
  },

  /** Mark plan days done (or not); with sync on, done days also mark their chapters */
  setPlanDays(year: number, days: { key: string; readings: Reading[] }[], done: boolean) {
    const plan = { ...(state.plans[year] ?? {}) }
    const date = today()
    let chapters = state.chapters
    for (const d of days) {
      if (done) {
        plan[d.key] ??= date
        if (state.settings.syncPlanToBible) {
          d.readings.forEach((r) => (chapters = withChapters(chapters, r.book, r.from, r.to, true)))
        }
      } else {
        delete plan[d.key]
      }
    }
    setState({ ...state, chapters, plans: { ...state.plans, [year]: plan } })
  },

  togglePlanDay(year: number, key: string, readings: Reading[]) {
    actions.setPlanDays(year, [{ key, readings }], !(key in (state.plans[year] ?? {})))
  },

  resetPlanYear(year: number) {
    const plans = { ...state.plans }
    delete plans[year]
    setState({ ...state, plans })
  },

  resetBible() {
    setState({ ...state, chapters: {} })
  },

  setGoal(goal: Goal | null) {
    setState({ ...state, goal })
  },

  updateSettings(patch: Partial<AppData['settings']>) {
    setState({ ...state, settings: { ...state.settings, ...patch } })
  },

  exportJson() {
    return JSON.stringify(state, null, 2)
  },

  importJson(text: string) {
    setState(normalize(JSON.parse(text)))
  },
}
