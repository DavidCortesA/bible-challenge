import { useEffect, useState } from 'react'
import { BookOpen, CalendarDays, LayoutDashboard, Settings, type LucideIcon } from 'lucide-react'
import { useData } from './lib/store'
import Dashboard from './components/Dashboard'
import BibleView from './components/BibleView'
import PlanView from './components/PlanView'
import SettingsView from './components/SettingsView'

export type Route = 'inicio' | 'biblia' | 'plan' | 'ajustes'

const NAV: { id: Route; label: string; icon: LucideIcon }[] = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'biblia', label: 'Biblia', icon: BookOpen },
  { id: 'plan', label: 'Plan anual', icon: CalendarDays },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
]

const readRoute = (): Route => {
  const hash = window.location.hash.replace('#', '').split('/')[0]
  return NAV.some((n) => n.id === hash) ? (hash as Route) : 'inicio'
}

export function navigate(route: Route, extra = '') {
  window.location.hash = extra ? `${route}/${extra}` : route
}

function useTheme() {
  const { theme } = useData().settings
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute)
  useTheme()

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <Brand />
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                route === id ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-muted hover:bg-sunken hover:text-ink'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </a>
          ))}
        </nav>
        <p className="mt-auto px-3 text-xs leading-relaxed text-faint">
          “Lámpara es a mis pies tu palabra, y lumbrera a mi camino.”
          <br />
          <span className="text-muted">Salmos 119:105</span>
        </p>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between px-4 pt-5 md:hidden">
          <Brand />
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-16">
          {route === 'inicio' && <Dashboard />}
          {route === 'biblia' && <BibleView />}
          {route === 'plan' && <PlanView />}
          {route === 'ajustes' && <SettingsView />}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="grid grid-cols-4">
          {NAV.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                route === id ? 'text-accent' : 'text-muted'
              }`}
            >
              <Icon size={20} strokeWidth={route === id ? 2.25 : 1.75} />
              {label.split(' ')[0]}
            </a>
          ))}
        </div>
      </nav>
    </div>
  )
}

function Brand() {
  return (
    <a href="#inicio" className="flex items-center gap-2.5 px-1">
      <span className="grid size-8 place-items-center rounded-lg bg-accent text-on-accent">
        <BookOpen size={17} strokeWidth={2} />
      </span>
      <span className="font-display text-lg font-medium tracking-tight">Mi lectura</span>
    </a>
  )
}
