import { useMemo, useState } from 'react'
import { BookCheck, ChevronLeft, ChevronRight, ChartColumn, History } from 'lucide-react'
import { useData } from '../lib/store'
import { activeYears, planStats, yearStats } from '../lib/stats'
import { Button, Card, SectionTitle, Stat } from './ui'

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fmtDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

export default function StatsView() {
  const data = useData()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const stats = useMemo(() => yearStats(data, year), [data, year])
  const years = useMemo(() => activeYears(data), [data])
  const plan = planStats(data, year)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Historial</h1>
          <p className="mt-1 text-sm text-muted">Lo que leíste cada año, según la fecha en que marcaste cada capítulo.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          <Button onClick={() => setYear(year - 1)} className="!px-2" title="Año anterior">
            <ChevronLeft size={18} />
          </Button>
          <span className="num w-14 text-center text-lg font-medium">{year}</span>
          <Button onClick={() => setYear(year + 1)} className="!px-2" title="Año siguiente" >
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      <Card>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Stat label="Capítulos" value={stats.chapters} sub={`en ${year}`} />
          <Stat label="Días leyendo" value={stats.activeDays} sub="con alguna lectura" />
          <Stat label="Mejor racha" value={stats.bestStreak} sub={stats.bestStreak === 1 ? 'día' : 'días seguidos'} />
          <Stat label="Plan anual" value={plan.daysDone} sub={`de ${plan.totalDays} días`} />
        </div>
      </Card>

      <Card>
        <SectionTitle icon={<ChartColumn size={16} />}>Capítulos por mes</SectionTitle>
        <MonthChart values={stats.byMonth} year={year} />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={<BookCheck size={16} />} aside={<span className="num text-xs text-faint">{stats.booksFinished.length}</span>}>
            Libros terminados en {year}
          </SectionTitle>
          {stats.booksFinished.length === 0 ? (
            <p className="text-sm text-muted">Todavía ninguno este año.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {stats.booksFinished.map(({ book, date }) => (
                <li key={book.id}>
                  <a href={`#biblia/${book.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-accent">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: book.testament === 'AT' ? 'var(--at)' : 'var(--nt)' }}
                    />
                    <span className="flex-1">{book.name}</span>
                    <span className="text-xs text-muted">{fmtDate.format(new Date(date + 'T12:00'))}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle icon={<History size={16} />}>Por año</SectionTitle>
          {years.length === 0 ? (
            <p className="text-sm text-muted">Aquí verás cada año en cuanto marques tu primer capítulo.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {years.map(([y, chapters]) => (
                <li key={y}>
                  <button
                    onClick={() => setYear(y)}
                    className={`flex w-full items-center justify-between py-2.5 text-sm ${y === year ? 'font-medium text-accent' : 'hover:text-accent'}`}
                  >
                    <span className="num">{y}</span>
                    <span className="num text-muted">{chapters} cap.</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function MonthChart({ values, year }: { values: number[]; year: number }) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(...values)
  const peak = values.indexOf(max)
  const now = new Date()
  const H = 160

  if (max === 0) {
    return <p className="py-10 text-center text-sm text-muted">Sin capítulos marcados en {year}.</p>
  }

  return (
    <div>
      <div className="relative flex items-end gap-[2px] border-b border-line" style={{ height: H + 22 }}>
        {values.map((v, i) => {
          const future = year > now.getFullYear() || (year === now.getFullYear() && i > now.getMonth())
          const showLabel = active === i || (active === null && i === peak)
          return (
            <button
              key={i}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${MONTHS[i]}: ${v} capítulos`}
              className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
            >
              {showLabel && (
                <span className="num pointer-events-none absolute z-10 rounded-md bg-ink px-1.5 py-0.5 text-[11px] whitespace-nowrap text-paper"
                  style={{ bottom: (v / max) * H + 6 }}
                >
                  {v}
                </span>
              )}
              <span
                className={`w-full max-w-7 rounded-t-[4px] transition-opacity ${active !== null && active !== i ? 'opacity-50' : ''}`}
                style={{
                  height: v === 0 ? 0 : Math.max(2, (v / max) * H),
                  background: future ? 'transparent' : 'var(--chart)',
                }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {MONTHS.map((m, i) => (
          <span key={m} className={`flex-1 text-center text-[10px] ${active === i ? 'text-ink' : 'text-faint'}`}>
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
