import { useSyncExternalStore } from 'react'
import { BOOK_BY_ID } from '../data/books'
import type { Reading } from '../data/plan'

export type Theme = 'system' | 'light' | 'dark'

export interface AppData {
  version: 1
  /** Last local edit (ms); the newer copy wins when syncing */
  updatedAt: number
  /** "GEN:1" -> local date (YYYY-MM-DD) the chapter was marked as read */
  chapters: Record<string, string>
  /** year -> plan reading key ("week-index") -> local date it was completed */
  plans: Record<string, Record<string, string>>
  settings: {
    /** When a plan reading is checked, also mark its chapters in the Bible tracker */
    syncPlanToBible: boolean
    theme: Theme
  }
}

const STORAGE_KEY = 'bible-challenge:v1'

const EMPTY: AppData = {
  version: 1,
  updatedAt: 0,
  chapters: {},
  plans: {},
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
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
    chapters: data.chapters && typeof data.chapters === 'object' ? data.chapters : {},
    plans: data.plans && typeof data.plans === 'object' ? data.plans : {},
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

function setState(next: AppData, touch = true) {
  state = touch ? { ...next, updatedAt: Date.now() } : next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked: keep working in memory
  }
  listeners.forEach((l) => l())
}

export const getState = () => state

export function subscribe(listener: () => void) {
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

  togglePlanReading(year: number, key: string, reading: Reading) {
    const plan = { ...(state.plans[year] ?? {}) }
    const done = !(key in plan)
    if (done) plan[key] = today()
    else delete plan[key]

    let chapters = state.chapters
    if (done && state.settings.syncPlanToBible) {
      chapters = withChapters(chapters, reading.book, reading.from, reading.to, true)
    }
    setState({ ...state, chapters, plans: { ...state.plans, [year]: plan } })
  },

  setPlanReadings(year: number, keys: string[], done: boolean, readings: Reading[]) {
    const plan = { ...(state.plans[year] ?? {}) }
    const date = today()
    keys.forEach((k) => (done ? (plan[k] ??= date) : delete plan[k]))

    let chapters = state.chapters
    if (done && state.settings.syncPlanToBible) {
      readings.forEach((r) => (chapters = withChapters(chapters, r.book, r.from, r.to, true)))
    }
    setState({ ...state, chapters, plans: { ...state.plans, [year]: plan } })
  },

  resetPlanYear(year: number) {
    const plans = { ...state.plans }
    delete plans[year]
    setState({ ...state, plans })
  },

  resetBible() {
    setState({ ...state, chapters: {} })
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

  /** Replace everything with a copy from the server, keeping its timestamp */
  replaceFromServer(data: unknown) {
    setState(normalize(data), false)
  },
}
