import { BookCheck, X } from 'lucide-react'
import { actions } from '../lib/store'
import { usePendingRead } from '../lib/pending'
import { Button } from './ui'

/** Asks "did you finish?" after coming back from reading on bible.com */
export default function ReadPrompt() {
  const { pending, dismiss } = usePendingRead()
  if (!pending) return null

  const confirm = () => {
    if (pending.kind === 'chapter') actions.setChapters(pending.book, pending.chapter, pending.chapter, true)
    else actions.setPlanDays(pending.year, [{ key: pending.key, readings: pending.readings }], true)
    dismiss()
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-50 p-3 md:right-6 md:bottom-6 md:left-auto md:w-96 md:p-0">
      <div className="animate-sheet rounded-2xl border border-line bg-surface p-4 shadow-2xl" role="dialog" aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <BookCheck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">¿Terminaste de leer?</p>
            <p className="mt-0.5 font-display text-lg leading-snug font-medium">{pending.label}</p>
          </div>
          <button onClick={dismiss} className="rounded-md p-1 text-faint hover:text-ink" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={dismiss}>
            Todavía no
          </Button>
          <Button variant="solid" onClick={confirm}>
            Sí, marcar
          </Button>
        </div>
      </div>
    </div>
  )
}
