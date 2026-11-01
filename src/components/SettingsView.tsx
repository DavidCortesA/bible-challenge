import { useEffect, useRef, useState } from 'react'
import {
  BellRing,
  CalendarPlus,
  Download,
  HardDrive,
  Monitor,
  Moon,
  Palette,
  Share,
  Smartphone,
  SquarePlus,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react'
import { actions, today, useData, type Theme } from '../lib/store'
import { downloadCalendar } from '../lib/calendar'
import { Button, Card, SectionTitle } from './ui'

const THEMES: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: 'system', label: 'Sistema', icon: Monitor },
  { id: 'light', label: 'Claro', icon: Sun },
  { id: 'dark', label: 'Oscuro', icon: Moon },
]

export default function SettingsView() {
  const data = useData()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const download = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lectura-biblica-${today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file: File) => {
    try {
      const text = await file.text()
      if (!confirm('Esto reemplaza todo tu progreso actual con el del archivo. ¿Continuar?')) return
      actions.importJson(text)
      setMessage('Respaldo importado.')
    } catch {
      setMessage('No se pudo leer el archivo. ¿Es un respaldo de esta app?')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-3xl font-medium tracking-tight md:text-4xl">Ajustes</h1>

      <Card>
        <SectionTitle icon={<Palette size={16} />}>Apariencia</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => actions.updateSettings({ theme: id })}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-sm transition-colors ${
                data.settings.theme === id ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:bg-sunken'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <InstallCard />
      <ReminderCard />

      <Card>
        <SectionTitle icon={<HardDrive size={16} />}>Tus datos</SectionTitle>
        <p className="text-sm leading-relaxed text-muted">
          Tu progreso se guarda en este dispositivo. Descarga un respaldo de vez en cuando (por ejemplo a iCloud Drive), o
          úsalo para pasar tu progreso a otro dispositivo.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={download}>
            <Download size={16} /> Descargar respaldo
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importar respaldo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importFile(f)
              e.target.value = ''
            }}
          />
        </div>
        {message && <p className="mt-3 text-sm text-accent">{message}</p>}
      </Card>

      <Card>
        <SectionTitle icon={<Trash2 size={16} />}>Zona de cuidado</SectionTitle>
        <p className="text-sm text-muted">
          Borra todos los capítulos marcados de tu progreso de la Biblia. Los planes anuales no se tocan.
        </p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() =>
            confirm('¿Borrar todo tu progreso de la Biblia? Esto no se puede deshacer.') && actions.resetBible()
          }
        >
          <Trash2 size={16} /> Borrar progreso de la Biblia
        </Button>
      </Card>
    </div>
  )
}

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

function InstallCard() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as InstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (standalone) return null

  return (
    <Card>
      <SectionTitle icon={<Smartphone size={16} />}>Instalar en tu celular</SectionTitle>
      {installEvent ? (
        <Button variant="solid" onClick={() => installEvent.prompt()}>
          <Download size={16} /> Instalar app
        </Button>
      ) : (
        <ol className="flex flex-col gap-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <span className="num text-faint">1</span> En Safari, toca <Share size={15} className="text-ink" /> Compartir
          </li>
          <li className="flex items-center gap-2">
            <span className="num text-faint">2</span> Elige <SquarePlus size={15} className="text-ink" /> Agregar a inicio
          </li>
          <li className="flex items-center gap-2">
            <span className="num text-faint">3</span> Ábrela desde tu pantalla de inicio: funciona sin internet
          </li>
        </ol>
      )}
    </Card>
  )
}

function ReminderCard() {
  const thisYear = new Date().getFullYear()
  const [time, setTime] = useState('07:00')
  const [withPlan, setWithPlan] = useState(true)
  // Late in the year, default to next year's plan
  const [year, setYear] = useState(new Date().getMonth() >= 9 ? thisYear + 1 : thisYear)

  return (
    <Card>
      <SectionTitle icon={<BellRing size={16} />}>Recordatorio diario</SectionTitle>
      <p className="text-sm leading-relaxed text-muted">
        Descarga un archivo para tu calendario: te avisa cada día a la hora que elijas, y si quieres, con la lectura del
        plan de ese día.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Hora</span>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value || '07:00')}
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>Incluir la lectura del plan</span>
          <input
            type="checkbox"
            checked={withPlan}
            onChange={(e) => setWithPlan(e.target.checked)}
            className="size-5 accent-[var(--accent)]"
          />
        </label>
        {withPlan && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Plan del año</span>
            <div className="flex gap-1">
              {[thisYear, thisYear + 1].map((y) => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className={`num rounded-lg px-3 py-1.5 text-sm ${
                    year === y ? 'bg-ink text-paper' : 'bg-sunken text-muted hover:text-ink'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <Button variant="outline" className="mt-4" onClick={() => downloadCalendar({ time, year, withPlan })}>
        <CalendarPlus size={16} /> Agregar a mi calendario
      </Button>
    </Card>
  )
}
