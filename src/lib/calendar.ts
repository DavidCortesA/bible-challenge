import { readingsLabel, yearDays } from '../data/plan'

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')

/** iCalendar lines must be folded at 75 octets */
function fold(line: string) {
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length
    if (bytes + b > 74) {
      out.push(cur)
      cur = ' '
      bytes = 1
    }
    cur += ch
    bytes += b
  }
  out.push(cur)
  return out.join('\r\n')
}

function event(opts: { uid: string; date: Date; time: string; summary: string; url: string; rrule?: string }) {
  const [hh, mm] = opts.time.split(':')
  const now = new Date()
  return [
    'BEGIN:VEVENT',
    `UID:${opts.uid}@mi-lectura`,
    `DTSTAMP:${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T000000Z`,
    `DTSTART:${stamp(opts.date)}T${hh}${mm}00`,
    'DURATION:PT20M',
    ...(opts.rrule ? [`RRULE:${opts.rrule}`] : []),
    `SUMMARY:${escape(opts.summary)}`,
    `URL:${opts.url}`,
    `DESCRIPTION:${escape(`Abre Mi lectura: ${opts.url}`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escape(opts.summary)}`,
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
  ]
}

/**
 * Build an .ics file: either one daily repeating reminder, or one event per day
 * of the reading plan (from today, or Jan 1 for a future year) with that day's passage.
 */
export function buildCalendar({ time, year, withPlan }: { time: string; year: number; withPlan: boolean }) {
  const url = window.location.origin
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mi lectura//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${withPlan ? `Plan de lectura ${year}` : 'Lectura bíblica'}`,
  ]

  if (withPlan) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (const d of yearDays(year)) {
      if (d.date < today) continue
      lines.push(
        ...event({
          uid: `plan-${year}-${d.week}-${d.day}`,
          date: d.date,
          time,
          summary: `📖 ${readingsLabel(d.readings)}`,
          url,
        }),
      )
    }
  } else {
    lines.push(...event({ uid: 'daily', date: new Date(), time, summary: '📖 Lectura bíblica', url, rrule: 'FREQ=DAILY' }))
  }

  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

export function downloadCalendar(opts: { time: string; year: number; withPlan: boolean }) {
  const blob = new Blob([buildCalendar(opts)], { type: 'text/calendar;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = opts.withPlan ? `plan-lectura-${opts.year}.ics` : 'recordatorio-lectura.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(href), 10_000)
}
