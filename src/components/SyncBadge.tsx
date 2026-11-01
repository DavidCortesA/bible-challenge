import { Cloud, CloudAlert, CloudCheck, CloudOff, HardDrive, RefreshCw } from 'lucide-react'
import { useSync } from '../lib/sync'

export default function SyncBadge({ compact = false }: { compact?: boolean }) {
  const { token, status, error } = useSync()

  const { icon: Icon, label, tone } = !token
    ? { icon: HardDrive, label: 'Solo este dispositivo', tone: 'text-faint' }
    : {
        idle: { icon: Cloud, label: 'Conectado', tone: 'text-muted' },
        syncing: { icon: RefreshCw, label: 'Guardando…', tone: 'text-muted' },
        synced: { icon: CloudCheck, label: 'Sincronizado', tone: 'text-ok' },
        offline: { icon: CloudOff, label: 'Sin conexión', tone: 'text-faint' },
        error: { icon: CloudAlert, label: 'Error al sincronizar', tone: 'text-accent' },
      }[status]

  return (
    <a
      href="#ajustes"
      title={error ?? label}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:bg-sunken ${tone}`}
    >
      <Icon size={15} className={status === 'syncing' && token ? 'animate-spin' : ''} />
      {!compact && label}
    </a>
  )
}
