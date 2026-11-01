import { useEffect, useState } from 'react'
import { CheckCheck, ChevronLeft, ChevronRight, ExternalLink, MoveHorizontal, RotateCcw, X } from 'lucide-react'
import { BOOKS, BOOK_BY_ID } from '../data/books'
import { openReading } from '../lib/pending'
import { actions, chapterKey, useData } from '../lib/store'
import { pct, readInBook } from '../lib/stats'
import { Button, Pct, ProgressBar } from './ui'

const fmtDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export default function BookSheet({ bookId, onClose }: { bookId: string; onClose: () => void }) {
  const data = useData()
  const [id, setId] = useState(bookId)
  const [rangeMode, setRangeMode] = useState(false)
  const [rangeStart, setRangeStart] = useState<number | null>(null)
  const [lastClicked, setLastClicked] = useState<number | null>(null)

  useEffect(() => setId(bookId), [bookId])

  const book = BOOK_BY_ID[id]
  const index = BOOKS.indexOf(book)
  const read = readInBook(data, book)
  const color = book.testament === 'AT' ? 'var(--at)' : 'var(--nt)'

  const go = (delta: number) => {
    const next = BOOKS[index + delta]
    if (!next) return
    history.replaceState(null, '', `#biblia/${next.id}`)
    setId(next.id)
    setRangeStart(null)
    setLastClicked(null)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  })

  const onChapter = (c: number, shift: boolean) => {
    // Range: shift+click on desktop, or "rango" mode on touch
    if (shift && lastClicked !== null) {
      actions.setChapters(book.id, Math.min(lastClicked, c), Math.max(lastClicked, c), true)
    } else if (rangeMode) {
      if (rangeStart === null) {
        setRangeStart(c)
        return
      }
      actions.setChapters(book.id, Math.min(rangeStart, c), Math.max(rangeStart, c), true)
      setRangeStart(null)
      setRangeMode(false)
    } else {
      actions.toggleChapter(book.id, c)
    }
    setLastClicked(c)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal>
      <div className="animate-fade absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-line p-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-wide uppercase" style={{ color }}>
              {book.testament === 'AT' ? 'Antiguo' : 'Nuevo'} Testamento · {book.category}
            </p>
            <h2 className="mt-1 font-display text-2xl font-medium tracking-tight">{book.name}</h2>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={pct(read, book.chapters)} color={color} className="max-w-56" />
              <span className="num shrink-0 text-xs text-muted">
                {read}/{book.chapters} · <Pct value={pct(read, book.chapters)} />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button onClick={() => go(-1)} className="!px-2" title="Libro anterior">
              <ChevronLeft size={18} />
            </Button>
            <Button onClick={() => go(1)} className="!px-2" title="Libro siguiente">
              <ChevronRight size={18} />
            </Button>
            <Button onClick={onClose} className="!px-2" title="Cerrar">
              <X size={18} />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => {
              const date = data.chapters[chapterKey(book.id, c)]
              const isStart = rangeStart === c
              return (
                <button
                  key={c}
                  onClick={(e) => onChapter(c, e.shiftKey)}
                  title={date ? `Leído el ${fmtDate.format(new Date(date + 'T12:00'))}` : `Capítulo ${c}`}
                  className={`num aspect-square rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    date ? 'text-surface' : 'bg-sunken text-muted hover:text-ink'
                  } ${isStart ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}`}
                  style={date ? { background: color } : undefined}
                >
                  {c}
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-faint">
            {rangeMode
              ? rangeStart === null
                ? 'Toca el primer capítulo del rango.'
                : `Desde el ${rangeStart}… ahora toca el último capítulo.`
              : 'Toca un capítulo para marcarlo. En computadora, Shift + clic marca un rango.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant={rangeMode ? 'solid' : 'outline'}
            onClick={() => {
              setRangeMode(!rangeMode)
              setRangeStart(null)
            }}
          >
            <MoveHorizontal size={16} /> Rango
          </Button>
          {read < book.chapters ? (
            <Button variant="outline" onClick={() => actions.setBook(book.id, true)}>
              <CheckCheck size={16} /> Marcar todo
            </Button>
          ) : null}
          {read > 0 && (
            <Button
              variant="ghost"
              onClick={() => confirm(`¿Desmarcar los ${read} capítulos de ${book.name}?`) && actions.setBook(book.id, false)}
            >
              <RotateCcw size={16} /> Limpiar
            </Button>
          )}
          <Button
            className="ml-auto"
            onClick={() => {
              const chapter = firstUnread(data.chapters, book.id, book.chapters)
              openReading({ kind: 'chapter', label: `${book.name} ${chapter}`, book: book.id, chapter })
            }}
          >
            <ExternalLink size={16} /> Leer
          </Button>
        </div>
      </div>
    </div>
  )
}

function firstUnread(chapters: Record<string, string>, bookId: string, total: number) {
  for (let c = 1; c <= total; c++) if (!(chapterKey(bookId, c) in chapters)) return c
  return 1
}
