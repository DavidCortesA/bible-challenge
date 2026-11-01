import { useMemo } from 'react'
import { ArrowRight, BookCheck, CalendarDays, Check, ExternalLink, Flame, Layers, Library, Sparkles } from 'lucide-react'
import { BOOKS, CATEGORIES } from '../data/books'
import { dayKey, planDayFor, readingsChapters, readingsLabel, weekDays } from '../data/plan'
import { actions, useData } from '../lib/store'
import { activityByDay, bibleStats, dateKey, nextChapter, pct, planStats, streak } from '../lib/stats'
import { openReading } from '../lib/pending'
import { Button, Card, Pct, ProgressBar, ProgressRing, SectionTitle, Stat } from './ui'
import GoalCard from './GoalCard'

const fmtDay = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtWeekday = new Intl.DateTimeFormat('es-MX', { weekday: 'narrow' })

export default function Dashboard() {
  const data = useData()
  const stats = useMemo(() => bibleStats(data), [data])
  const days = useMemo(() => activityByDay(data), [data])
  const next = useMemo(() => nextChapter(data), [data])
  const overall = pct(stats.read, stats.total)

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-sm text-muted first-letter:uppercase">{fmtDay.format(new Date())}</p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-tight md:text-4xl">Tu progreso</h1>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <TodayCard />

        <Card className="flex flex-col">
          <SectionTitle icon={<Sparkles size={16} />}>Siguiente capítulo</SectionTitle>
          {next ? (
            <>
              <p className="font-display text-2xl font-medium tracking-tight">
                {next.book.name} {next.chapter}
              </p>
              <p className="mt-1 text-sm text-muted">
                {stats.byBook.get(next.book.id)} de {next.book.chapters} capítulos leídos en este libro
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button variant="outline" onClick={() => actions.toggleChapter(next.book.id, next.chapter)}>
                  <Check size={16} /> Marcar leído
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    openReading({
                      kind: 'chapter',
                      label: `${next.book.name} ${next.chapter}`,
                      book: next.book.id,
                      chapter: next.chapter,
                    })
                  }
                >
                  <ExternalLink size={16} /> Leer
                </Button>
              </div>
            </>
          ) : (
            <p className="font-display text-xl">¡Terminaste toda la Biblia! 🎉</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProgressRing value={overall} size={148} className="mx-auto sm:mx-0">
            <span className="num text-3xl font-medium tracking-tight">
              <Pct value={overall} />
            </span>
            <span className="text-xs text-muted">de la Biblia</span>
          </ProgressRing>
          <div className="flex flex-1 flex-col gap-5">
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Capítulos" value={stats.read} sub={`de ${stats.total}`} />
              <Stat label="Libros" value={stats.booksDone} sub="de 66 completos" />
              <Stat
                label="Racha"
                value={
                  <span className="inline-flex items-center gap-1">
                    {streak(days)}
                    <Flame size={18} className="text-accent" />
                  </span>
                }
                sub="días seguidos"
              />
            </div>
            <div className="flex flex-col gap-3">
              {(['AT', 'NT'] as const).map((t) => {
                const p = stats.byTestament[t]
                return (
                  <div key={t}>
                    <div className="mb-1.5 flex justify-between gap-2 text-xs">
                      <span className="truncate text-muted">{t === 'AT' ? 'Antiguo Testamento' : 'Nuevo Testamento'}</span>
                      <span className="num shrink-0 whitespace-nowrap text-ink">
                        {p.read}/{p.total} · <Pct value={pct(p.read, p.total)} />
                      </span>
                    </div>
                    <ProgressBar value={pct(p.read, p.total)} color={`var(--${t.toLowerCase()})`} />
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <GoalCard stats={stats} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={<Layers size={16} />}>Por sección</SectionTitle>
          <div className="flex flex-col gap-3.5">
            {CATEGORIES.map((c) => {
              const p = stats.byCategory.get(c)!
              const isNT = BOOKS.find((b) => b.category === c)!.testament === 'NT'
              return (
                <div key={c}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span>{c}</span>
                    <span className="num text-muted">
                      {p.read}/{p.total}
                    </span>
                  </div>
                  <ProgressBar value={pct(p.read, p.total)} color={isNT ? 'var(--nt)' : 'var(--at)'} height={5} />
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <SectionTitle icon={<Flame size={16} />} aside={<span className="text-xs text-faint">últimas 20 semanas</span>}>
              Actividad
            </SectionTitle>
            <Heatmap days={days} />
          </Card>
          <Card>
            <SectionTitle
              icon={<Library size={16} />}
              aside={
                <a href="#biblia" className="flex items-center gap-1 text-xs text-muted hover:text-ink">
                  Ver todo <ArrowRight size={14} />
                </a>
              }
            >
              Mapa de libros
            </SectionTitle>
            <BookMap byBook={stats.byBook} />
          </Card>
        </div>
      </div>
    </div>
  )
}

function TodayCard() {
  const data = useData()
  const now = new Date()
  const year = now.getFullYear()
  const today = planDayFor(now)
  const done = data.plans[year] ?? {}
  const key = dayKey(today.week, today.day)
  const checked = key in done
  const plan = planStats(data, year)
  const label = readingsLabel(today.readings)
  const todayKey = dateKey(now)

  return (
    <Card className="flex flex-col">
      <SectionTitle
        icon={<CalendarDays size={16} />}
        aside={
          <a href="#plan" className="flex items-center gap-1 text-xs text-muted hover:text-ink">
            Semana {today.week} <ArrowRight size={14} />
          </a>
        }
      >
        Hoy toca
      </SectionTitle>

      <p className={`font-display text-2xl font-medium tracking-tight ${checked ? 'text-muted' : ''}`}>{label}</p>
      <p className="mt-1 text-sm text-muted">
        <span className="num">{readingsChapters(today.readings)}</span> capítulos · plan de 52 semanas
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant={checked ? 'outline' : 'solid'} onClick={() => actions.togglePlanDay(year, key, today.readings)}>
          <Check size={16} /> {checked ? 'Leído' : 'Marcar leído'}
        </Button>
        <Button variant="ghost" onClick={() => openReading({ kind: 'day', label, year, key, readings: today.readings })}>
          <ExternalLink size={16} /> Leer
        </Button>
      </div>

      <div className="mt-6 flex gap-1.5">
        {weekDays(year, today.week).map((d) => {
          const k = dayKey(d.week, d.day)
          const isDone = k in done
          const isToday = dateKey(d.date) === todayKey
          return (
            <button
              key={k}
              onClick={() => actions.togglePlanDay(year, k, d.readings)}
              title={readingsLabel(d.readings)}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span className={`text-[10px] uppercase ${isToday ? 'font-medium text-accent' : 'text-faint'}`}>
                {fmtWeekday.format(d.date)}
              </span>
              <span
                className={`grid h-7 w-full max-w-9 place-items-center rounded-lg transition-colors ${
                  isDone ? 'bg-accent text-on-accent' : 'bg-sunken'
                } ${isToday ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}
              >
                {isDone && <Check size={13} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-muted">
        <span className="num text-ink">{plan.daysDone}</span> de {plan.totalDays} días del plan {year}
        {plan.behind > 0 ? ` · ${plan.behind} días pendientes, sin presión` : ' · vas al día'}
      </p>
    </Card>
  )
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
        checked ? 'border-accent bg-accent text-on-accent' : 'border-faint bg-surface'
      }`}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </span>
  )
}

function Heatmap({ days }: { days: Map<string, number> }) {
  const WEEKS = 20
  const end = new Date()
  // Start on the Monday WEEKS-1 weeks ago
  const start = new Date(end)
  start.setDate(end.getDate() - ((end.getDay() + 6) % 7) - (WEEKS - 1) * 7)

  const cols: { key: string; count: number; future: boolean }[][] = []
  for (let w = 0; w < WEEKS; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const key = dateKey(date)
      col.push({ key, count: days.get(key) ?? 0, future: date > end })
    }
    cols.push(col)
  }

  const level = (n: number) => (n === 0 ? 0 : n < 2 ? 0.3 : n < 4 ? 0.55 : n < 8 ? 0.8 : 1)

  return (
    <div className="flex gap-[3px]">
      {cols.map((col, i) => (
        <div key={i} className="flex flex-1 flex-col gap-[3px]">
          {col.map((cell) => (
            <div
              key={cell.key}
              title={cell.future ? '' : `${cell.key}: ${cell.count}`}
              className="aspect-square w-full rounded-[3px]"
              style={{
                background: cell.future
                  ? 'transparent'
                  : cell.count === 0
                    ? 'var(--sunken)'
                    : `color-mix(in oklab, var(--accent) ${level(cell.count) * 100}%, var(--sunken))`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function BookMap({ byBook }: { byBook: Map<string, number> }) {
  return (
    <div className="grid grid-cols-11 gap-1">
      {BOOKS.map((b) => {
        const n = byBook.get(b.id) ?? 0
        const p = pct(n, b.chapters)
        const color = b.testament === 'AT' ? 'var(--at)' : 'var(--nt)'
        return (
          <a
            key={b.id}
            href={`#biblia/${b.id}`}
            title={`${b.name}: ${n}/${b.chapters}`}
            className="relative grid aspect-square place-items-center overflow-hidden rounded-md bg-sunken text-[9px] font-medium text-muted hover:ring-1 hover:ring-ink/30"
          >
            <span className="absolute inset-x-0 bottom-0" style={{ height: `${p}%`, background: color, opacity: 0.85 }} />
            <span className={`relative ${p === 100 ? 'text-surface' : ''}`}>
              {p === 100 ? <BookCheck size={12} /> : b.abbr}
            </span>
          </a>
        )
      })}
    </div>
  )
}
