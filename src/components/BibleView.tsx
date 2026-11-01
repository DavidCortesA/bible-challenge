import { useEffect, useMemo, useState } from 'react'
import { BookCheck, Search, X } from 'lucide-react'
import { BOOKS, BOOK_BY_ID, CATEGORIES, type Testament } from '../data/books'
import { useData } from '../lib/store'
import { bibleStats, pct } from '../lib/stats'
import { Pct, ProgressBar } from './ui'
import BookSheet from './BookSheet'

type Filter = 'todos' | Testament | 'pendientes' | 'completos'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'AT', label: 'Antiguo' },
  { id: 'NT', label: 'Nuevo' },
  { id: 'pendientes', label: 'En curso' },
  { id: 'completos', label: 'Completos' },
]

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const bookFromHash = () => {
  const id = window.location.hash.split('/')[1]
  return id && BOOK_BY_ID[id] ? id : null
}

export default function BibleView() {
  const data = useData()
  const stats = useMemo(() => bibleStats(data), [data])
  const [filter, setFilter] = useState<Filter>('todos')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(bookFromHash)

  useEffect(() => {
    const onHash = () => setOpenId(bookFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const open = (id: string) => {
    history.replaceState(null, '', `#biblia/${id}`)
    setOpenId(id)
  }
  const close = () => {
    history.replaceState(null, '', '#biblia')
    setOpenId(null)
  }

  const visible = BOOKS.filter((b) => {
    const n = stats.byBook.get(b.id) ?? 0
    if (filter === 'AT' || filter === 'NT') {
      if (b.testament !== filter) return false
    } else if (filter === 'pendientes') {
      if (n === 0 || n === b.chapters) return false
    } else if (filter === 'completos') {
      if (n !== b.chapters) return false
    }
    return !query || normalize(b.name).includes(normalize(query))
  })

  return (
    <div>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-medium tracking-tight md:text-4xl">La Biblia</h1>
        <p className="text-sm text-muted">
          <span className="num text-ink">{stats.read}</span> de <span className="num">{stats.total}</span> capítulos ·{' '}
          <Pct value={pct(stats.read, stats.total)} /> · tu progreso total, sin importar el año
        </p>
      </header>

      <div className="sticky top-0 z-20 -mx-4 mt-5 flex flex-col gap-3 bg-paper/90 px-4 py-3 backdrop-blur-md md:-mx-10 md:px-10">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar libro…"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pr-9 pl-9 text-sm outline-none placeholder:text-faint focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-faint hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f.id ? 'bg-ink text-paper' : 'bg-sunken text-muted hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-8">
        {CATEGORIES.map((cat) => {
          const books = visible.filter((b) => b.category === cat)
          if (books.length === 0) return null
          const c = stats.byCategory.get(cat)!
          return (
            <section key={cat}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="font-display text-lg font-medium">{cat}</h2>
                <span className="num text-xs text-muted">
                  {c.read}/{c.total}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {books.map((b) => {
                  const n = stats.byBook.get(b.id) ?? 0
                  const done = n === b.chapters
                  const color = b.testament === 'AT' ? 'var(--at)' : 'var(--nt)'
                  return (
                    <button
                      key={b.id}
                      onClick={() => open(b.id)}
                      className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition hover:-translate-y-0.5 hover:border-faint hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium leading-tight">{b.name}</span>
                        {done && <BookCheck size={16} className="shrink-0" style={{ color }} />}
                      </div>
                      <div>
                        <ProgressBar value={pct(n, b.chapters)} color={color} height={4} />
                        <div className="num mt-1.5 text-[11px] text-muted">
                          {n}/{b.chapters} cap.
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
        {visible.length === 0 && <p className="py-12 text-center text-sm text-muted">No hay libros con ese filtro.</p>}
      </div>

      {openId && <BookSheet bookId={openId} onClose={close} />}
    </div>
  )
}
