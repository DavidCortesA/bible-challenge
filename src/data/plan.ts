import { BOOK_BY_ID } from './books'

export interface Reading {
  book: string // book id
  from: number
  to: number
}

export interface PlanWeek {
  week: number
  readings: Reading[]
}

// Whole book, or a chapter range
const r = (book: string, from?: number, to?: number): Reading => ({
  book,
  from: from ?? 1,
  to: to ?? BOOK_BY_ID[book].chapters,
})

const PAULINE_SHORT = ['EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM']
const HEB_PET = ['HEB', 'JAS', '1PE', '2PE']
const JOHN_REV = ['1JN', '2JN', '3JN', 'JUD', 'REV']

const WEEKS: Reading[][] = [
  [r('GEN', 1, 26)],
  [r('GEN', 27, 50)],
  [r('MAT')],
  [r('MRK')],
  [r('EXO', 1, 21)],
  [r('EXO', 22, 40)],
  [r('LUK')],
  [r('JHN')],
  [r('LEV')],
  [r('ACT')],
  [r('NUM', 1, 18)],
  [r('NUM', 19, 36)],
  [r('ROM'), r('GAL')],
  [r('1CO'), r('2CO')],
  [r('DEU', 1, 17)],
  [r('DEU', 18, 34)],
  PAULINE_SHORT.map((id) => r(id)),
  HEB_PET.map((id) => r(id)),
  [r('JOS')],
  JOHN_REV.map((id) => r(id)),
  [r('JDG'), r('RUT')],
  [r('JOB', 1, 31)],
  [r('JOB', 32, 42), r('ECC'), r('SNG')],
  [r('1SA')],
  [r('2SA')],
  [r('PSA', 1, 50)],
  [r('1KI')],
  [r('2KI')],
  [r('PSA', 51, 100)],
  [r('1CH')],
  [r('2CH')],
  [r('PSA', 101, 150)],
  [r('EZR'), r('NEH'), r('EST')],
  [r('PRO')],
  [r('MAT')],
  [r('ISA', 1, 35)],
  [r('ISA', 36, 66)],
  [r('MRK')],
  [r('LUK')],
  [r('JER', 1, 29)],
  [r('JER', 30, 52), r('LAM')],
  [r('JHN')],
  [r('ACT')],
  [r('EZK', 1, 24)],
  [r('EZK', 25, 48)],
  [r('ROM'), r('GAL')],
  [r('1CO'), r('2CO')],
  [r('DAN'), r('HOS'), r('JOL'), r('AMO')],
  PAULINE_SHORT.map((id) => r(id)),
  ['OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL'].map((id) => r(id)),
  HEB_PET.map((id) => r(id)),
  JOHN_REV.map((id) => r(id)),
]

export const PLAN: PlanWeek[] = WEEKS.map((readings, i) => ({ week: i + 1, readings }))

export const readingKey = (week: number, index: number) => `${week}-${index}`

export const readingLabel = ({ book, from, to }: Reading) => {
  const bk = BOOK_BY_ID[book]
  if (from === 1 && to === bk.chapters) return bk.name
  return `${bk.name} ${from}–${to}`
}

export const readingChapters = ({ from, to }: Reading) => to - from + 1

export const weekTitle = (week: PlanWeek) => week.readings.map(readingLabel).join(' · ')

export const TOTAL_PLAN_READINGS = PLAN.reduce((sum, w) => sum + w.readings.length, 0)

/** Week N starts on Jan 1 + 7·(N-1); week 52 runs to Dec 31. */
export function weekRange(year: number, week: number) {
  const start = new Date(year, 0, 1 + (week - 1) * 7)
  const end = week === 52 ? new Date(year, 11, 31) : new Date(year, 0, week * 7)
  return { start, end }
}

export function currentWeek(year: number, today = new Date()) {
  if (today.getFullYear() < year) return 0
  if (today.getFullYear() > year) return 53
  const dayOfYear = Math.floor(
    (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(year, 0, 1)) / 86_400_000,
  )
  return Math.min(52, Math.floor(dayOfYear / 7) + 1)
}
