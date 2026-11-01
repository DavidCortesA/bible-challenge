import { useRef, useState } from 'react'
import { Download, HardDrive, Monitor, Moon, Palette, Sun, Trash2, Upload } from 'lucide-react'
import { actions, today, useData, type Theme } from '../lib/store'
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

      <Card>
        <SectionTitle icon={<HardDrive size={16} />}>Tus datos</SectionTitle>
        <p className="text-sm leading-relaxed text-muted">
          Tu progreso se guarda en este navegador. Descarga un respaldo de vez en cuando, o úsalo para pasar tu progreso a
          otro dispositivo.
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
