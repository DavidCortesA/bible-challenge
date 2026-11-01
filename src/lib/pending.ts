import { useEffect, useState } from 'react'
import { readUrl } from '../data/books'
import type { Reading } from '../data/plan'

/** What the user went off to read, so we can ask "did you finish?" when they come back */
export type PendingRead =
  | { kind: 'chapter'; label: string; book: string; chapter: number; at: number }
  | { kind: 'day'; label: string; year: number; key: string; readings: Reading[]; at: number }

const KEY = 'bible-challenge:pending-read'
const MIN_AWAY_MS = 20_000 // ignore quick back-and-forth
const MAX_AWAY_MS = 12 * 3_600_000

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
type NewPending = DistributiveOmit<PendingRead, 'at'>

/** Remember what's being read and open it on bible.com */
export function openReading(pending: NewPending) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...pending, at: Date.now() }))
  } catch {
    // ignore
  }
  const first = pending.kind === 'chapter' ? pending : { book: pending.readings[0].book, chapter: pending.readings[0].from }
  window.open(readUrl(first.book, first.chapter), '_blank', 'noopener')
}

export function clearPending() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

function readPending(): PendingRead | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null') as PendingRead | null
    if (!p) return null
    const away = Date.now() - p.at
    if (away > MAX_AWAY_MS) {
      clearPending()
      return null
    }
    return away >= MIN_AWAY_MS ? p : null
  } catch {
    return null
  }
}

/** The pending reading to ask about, checked whenever the app comes back to the foreground */
export function usePendingRead() {
  const [pending, setPending] = useState<PendingRead | null>(readPending)
  useEffect(() => {
    const check = () => document.visibilityState === 'visible' && setPending(readPending())
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])
  const dismiss = () => {
    clearPending()
    setPending(null)
  }
  return { pending, dismiss }
}
