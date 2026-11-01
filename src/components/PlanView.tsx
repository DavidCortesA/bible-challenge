import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleCheck, Crosshair, ExternalLink, Link2, RotateCcw } from 'lucide-react'
import { PLAN, dayKey, readingsChapters, readingsLabel, weekDays, weekRange } from '../data/plan'
import { actions, useData } from '../lib/store'
import { dateKey, pct, planStats } from '../lib/stats'
import { openReading } from '../lib/pending'
import { Button, Card, Pct, ProgressBar, Stat } from './ui'
import { Checkbox } from './Dashboard'

const fmtShort = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })
const fmtDay = new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric' })

export default function PlanView() {
  const data = useData()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [onlyPending, setOnlyPending] = useState(false)
  const done = data.plans[year] ?? {}
  const stats = planStats(data, year)
  const todayKey = dateKey(new Date())

  const scrollToCurrent = () =>
    document.getElementById(`semana-${stats.week}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  useEffect(() => {
    if (year === thisYear && stats.week > 1) setTimeout(scrollToCurrent, 50)
    // only when the year changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  const weeks = PLAN.map((w) => ({ ...w, days: weekDays(year, w.week) })).filter(
    (w) => !onlyPending || w.days.some((d) => !(dayKey(d.week, d.day) in done)),
  )

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Plan de 52 semanas</h1>
          <p className="mt-1 text-sm text-muted">Empieza de cero cada año. Tu progreso de la Biblia es aparte.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          <Button onClick={() => setYear(year - 1)} className="!px-2" title="Año anterior">
            <ChevronLeft size={18} />
          </Button>
          <span className="num w-14 text-center text-lg font-medium">{year}</span>
          <Button onClick={() => setYear(year + 1)} className="!px-2" title="Año siguiente">
            <ChevronRight size={18} />
          </Button>
        </div>
      </header>

      <Card className="mt-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Días" value={stats.daysDone} sub={`de ${stats.totalDays}`} />
          <Stat label="Semanas" value={stats.weeksDone} sub="de 52" />
          <Stat
            label="Avance"
            value={<Pct value={pct(stats.daysDone, stats.totalDays)} />}
            sub={
              year === thisYear
                ? stats.behind > 0
                  ? `${stats.behind} días pendientes`
                  : 'al día'
                : year > thisYear
                  ? 'aún no empieza'
                  : 'año pasado'
            }
          />
        </div>
        <ProgressBar value={pct(stats.daysDone, stats.totalDays)} className="mt-5" />
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <label className="mr-auto flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={data.settings.syncPlanToBible}
              onChange={(e) => actions.updateSettings({ syncPlanToBible: e.target.checked })}
            />
            <span className="relative h-5 w-9 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-accent after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            <span className="flex items-center gap-1.5 text-muted">
              <Link2 size={14} /> También marcar en mi progreso de la Biblia
            </span>
          </label>
          {year === thisYear && (
            <Button variant="ghost" onClick={scrollToCurrent}>
              <Crosshair size={16} /> Hoy
            </Button>
          )}
          <Button variant="ghost" onClick={() => setOnlyPending(!onlyPending)}>
            <CircleCheck size={16} /> {onlyPending ? 'Ver todas' : 'Ocultar completas'}
          </Button>
          {stats.daysDone > 0 && (
            <Button
              variant="danger"
              onClick={() => confirm(`¿Reiniciar el plan ${year}? Se borran sus marcas.`) && actions.resetPlanYear(year)}
            >
              <RotateCcw size={16} /> Reiniciar {year}
            </Button>
          )}
        </div>
      </Card>

      <ol className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {weeks.map((w) => {
          const { start, end } = weekRange(year, w.week)
          const keys = w.days.map((d) => ({ key: dayKey(d.week, d.day), readings: d.readings }))
          const n = keys.filter((k) => k.key in done).length
          const complete = n === keys.length
          const isCurrent = year === thisYear && w.week === stats.week
          return (
            <li
              key={w.week}
              id={`semana-${w.week}`}
              className={`scroll-mt-4 rounded-2xl border bg-surface p-4 transition-colors ${
                isCurrent ? 'border-accent ring-1 ring-accent' : 'border-line'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => actions.setPlanDays(year, keys, !complete)}
                  title={complete ? 'Desmarcar semana' : 'Marcar semana completa'}
                  className={`num grid size-10 shrink-0 place-items-center rounded-xl text-sm font-medium transition-colors ${
                    complete ? 'bg-accent text-on-accent' : isCurrent ? 'bg-accent-soft text-accent' : 'bg-sunken text-muted'
                  }`}
                >
                  {complete ? <CircleCheck size={18} /> : w.week}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{readingsLabel(w.readings)}</div>
                  <div className="text-xs text-muted">
                    Semana {w.week} · {fmtShort.format(start)} – {fmtShort.format(end)} ·{' '}
                    <span className="num">{readingsChapters(w.readings)}</span> cap.
                  </div>
                </div>
                <span className="num text-xs text-faint">
                  {n}/{keys.length}
                </span>
              </div>
              <ul className={`mt-3 flex flex-col ${complete && !isCurrent ? 'opacity-70' : ''}`}>
                {w.days.map((d) => {
                  const key = dayKey(d.week, d.day)
                  const checked = key in done
                  const isToday = dateKey(d.date) === todayKey
                  const label = readingsLabel(d.readings)
                  return (
                    <li key={key} className={`flex items-center rounded-lg ${isToday ? 'bg-accent-soft' : ''}`}>
                      <button
                        onClick={() => actions.togglePlanDay(year, key, d.readings)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1.5 py-1.5 text-left text-sm hover:bg-sunken"
                      >
                        <Checkbox checked={checked} />
                        <span className={`w-14 shrink-0 text-xs ${isToday ? 'font-medium text-accent' : 'text-faint'}`}>
                          {isToday ? 'Hoy' : fmtDay.format(d.date)}
                        </span>
                        <span className={`truncate ${checked ? 'text-muted line-through decoration-faint' : ''}`}>
                          {label}
                        </span>
                      </button>
                      <button
                        onClick={() => openReading({ kind: 'day', label, year, key, readings: d.readings })}
                        className="rounded-md p-2 text-faint hover:text-ink"
                        title={`Leer ${label}`}
                      >
                        <ExternalLink size={15} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
