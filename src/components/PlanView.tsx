import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleCheck, Crosshair, Link2, RotateCcw } from 'lucide-react'
import { PLAN, readingChapters, readingKey, readingLabel, weekRange } from '../data/plan'
import { actions, useData } from '../lib/store'
import { pct, planStats } from '../lib/stats'
import { Button, Card, Pct, ProgressBar, Stat } from './ui'
import { Checkbox } from './Dashboard'

const fmtShort = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

export default function PlanView() {
  const data = useData()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [onlyPending, setOnlyPending] = useState(false)
  const done = data.plans[year] ?? {}
  const stats = planStats(data, year)

  const scrollToCurrent = () =>
    document.getElementById(`semana-${stats.week}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  useEffect(() => {
    if (year === thisYear && stats.week > 2) setTimeout(scrollToCurrent, 50)
    // only when the year changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  const weeks = PLAN.filter((w) => !onlyPending || w.readings.some((_, i) => !(readingKey(w.week, i) in done)))

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
          <Stat label="Semanas" value={stats.weeksDone} sub="de 52" />
          <Stat label="Lecturas" value={stats.readingsDone} sub={`de ${stats.totalReadings}`} />
          <Stat
            label="Avance"
            value={<Pct value={pct(stats.readingsDone, stats.totalReadings)} />}
            sub={
              year === thisYear
                ? stats.behind > 0
                  ? `${stats.behind} lecturas atrás`
                  : 'al día'
                : year > thisYear
                  ? 'aún no empieza'
                  : 'año pasado'
            }
          />
        </div>
        <ProgressBar value={pct(stats.readingsDone, stats.totalReadings)} className="mt-5" />
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
              <Crosshair size={16} /> Semana actual
            </Button>
          )}
          <Button variant="ghost" onClick={() => setOnlyPending(!onlyPending)}>
            <CircleCheck size={16} /> {onlyPending ? 'Ver todas' : 'Ocultar completas'}
          </Button>
          {stats.readingsDone > 0 && (
            <Button
              variant="danger"
              onClick={() => confirm(`¿Reiniciar el plan ${year}? Se borran sus marcas.`) && actions.resetPlanYear(year)}
            >
              <RotateCcw size={16} /> Reiniciar {year}
            </Button>
          )}
        </div>
      </Card>

      <ol className="mt-6 grid gap-3 md:grid-cols-2">
        {weeks.map((w) => {
          const { start, end } = weekRange(year, w.week)
          const keys = w.readings.map((_, i) => readingKey(w.week, i))
          const n = keys.filter((k) => k in done).length
          const complete = n === keys.length
          const isCurrent = year === thisYear && w.week === stats.week
          const chapters = w.readings.reduce((s, r) => s + readingChapters(r), 0)
          return (
            <li
              key={w.week}
              id={`semana-${w.week}`}
              className={`scroll-mt-24 rounded-2xl border bg-surface p-4 transition-colors ${
                isCurrent ? 'border-accent ring-1 ring-accent' : 'border-line'
              } ${complete ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => actions.setPlanReadings(year, keys, !complete, w.readings)}
                  title={complete ? 'Desmarcar semana' : 'Marcar semana completa'}
                  className={`num grid size-10 shrink-0 place-items-center rounded-xl text-sm font-medium transition-colors ${
                    complete ? 'bg-accent text-on-accent' : isCurrent ? 'bg-accent-soft text-accent' : 'bg-sunken text-muted'
                  }`}
                >
                  {complete ? <CircleCheck size={18} /> : w.week}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Semana {w.week}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-on-accent">
                        esta semana
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    {fmtShort.format(start)} – {fmtShort.format(end)} · <span className="num">{chapters}</span> cap.
                  </div>
                </div>
                <span className="num text-xs text-faint">
                  {n}/{keys.length}
                </span>
              </div>
              <ul className="mt-3 flex flex-col">
                {w.readings.map((r, i) => {
                  const key = keys[i]
                  const checked = key in done
                  return (
                    <li key={key}>
                      <button
                        onClick={() => actions.togglePlanReading(year, key, r)}
                        className="flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left text-sm hover:bg-sunken"
                      >
                        <Checkbox checked={checked} />
                        <span className={`flex-1 ${checked ? 'text-muted line-through decoration-faint' : ''}`}>
                          {readingLabel(r)}
                        </span>
                        <span className="num text-[11px] text-faint">{readingChapters(r)}</span>
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
