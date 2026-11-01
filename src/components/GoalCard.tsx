import { useState, type FormEvent } from 'react'
import { Goal as GoalIcon, Pencil, Trophy, X } from 'lucide-react'
import { actions, today, useData, type Goal } from '../lib/store'
import { bibleStats, goalStats, pct } from '../lib/stats'
import { Button, Card, Pct, ProgressBar, SectionTitle, Stat } from './ui'

const SCOPES: { id: Goal['scope']; label: string }[] = [
  { id: 'all', label: 'Toda la Biblia' },
  { id: 'AT', label: 'Antiguo Testamento' },
  { id: 'NT', label: 'Nuevo Testamento' },
]

const fmtDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

export default function GoalCard({ stats }: { stats: ReturnType<typeof bibleStats> }) {
  const { goal } = useData()
  const [editing, setEditing] = useState(false)

  if (!goal || editing) {
    return (
      <Card>
        <SectionTitle icon={<GoalIcon size={16} />}>Tu meta</SectionTitle>
        {editing || goal ? (
          <GoalForm stats={stats} initial={goal} onDone={() => setEditing(false)} />
        ) : (
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm leading-relaxed text-muted">
              Ponte una fecha para terminar la Biblia (o un testamento) y te digo cuántos capítulos al día necesitas.
            </p>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <GoalIcon size={16} /> Crear meta
            </Button>
          </div>
        )}
      </Card>
    )
  }

  const g = goalStats(goal, stats)
  const scopeLabel = SCOPES.find((s) => s.id === goal.scope)!.label

  return (
    <Card>
      <SectionTitle
        icon={<GoalIcon size={16} />}
        aside={
          <div className="flex">
            <Button className="!p-1.5" title="Editar meta" onClick={() => setEditing(true)}>
              <Pencil size={15} />
            </Button>
            <Button
              className="!p-1.5"
              title="Quitar meta"
              onClick={() => confirm('¿Quitar tu meta?') && actions.setGoal(null)}
            >
              <X size={15} />
            </Button>
          </div>
        }
      >
        Tu meta
      </SectionTitle>
      <p className="font-display text-xl font-medium tracking-tight">{scopeLabel}</p>
      <p className="mt-0.5 text-sm text-muted">para el {fmtDate.format(new Date(goal.deadline + 'T12:00'))}</p>

      {g.remaining === 0 ? (
        <p className="mt-5 flex items-center gap-2 text-sm font-medium text-accent">
          <Trophy size={18} /> ¡Meta cumplida!
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Stat label="Al día" value={g.perDay} sub={g.perDay === 1 ? 'capítulo' : 'capítulos'} />
            <Stat label="Faltan" value={g.remaining} sub={`en ${g.daysLeft} ${g.daysLeft === 1 ? 'día' : 'días'}`} />
          </div>
          <ProgressBar value={pct(g.read, g.total)} className="mt-5" />
          <p className="mt-2 text-xs text-muted">
            <Pct value={pct(g.read, g.total)} /> ·{' '}
            {g.overdue
              ? 'la fecha ya pasó: puedes moverla'
              : g.ahead > 0
                ? `vas ${g.ahead} capítulos adelante`
                : g.ahead < 0
                  ? `vas ${-g.ahead} capítulos atrás`
                  : 'vas justo a tiempo'}
          </p>
        </>
      )}
    </Card>
  )
}

function GoalForm({
  stats,
  initial,
  onDone,
}: {
  stats: ReturnType<typeof bibleStats>
  initial: Goal | null
  onDone: () => void
}) {
  const [scope, setScope] = useState<Goal['scope']>(initial?.scope ?? 'all')
  const [deadline, setDeadline] = useState(initial?.deadline ?? `${new Date().getFullYear() + 1}-12-31`)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const read = scope === 'all' ? stats.read : stats.byTestament[scope].read
    // Keep the original start when only the date changes, so "ahead/behind" stays meaningful
    const keepStart = initial && initial.scope === scope
    actions.setGoal({
      scope,
      deadline,
      start: keepStart ? initial.start : today(),
      startRead: keepStart ? initial.startRead : read,
    })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-1.5">
        {SCOPES.map((s) => (
          <button
            type="button"
            key={s.id}
            onClick={() => setScope(s.id)}
            className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
              scope === s.id ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:bg-sunken'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-muted">Terminar para el</span>
        <input
          type="date"
          required
          min={today()}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-xl border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="solid">
          Guardar meta
        </Button>
        <Button onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  )
}
