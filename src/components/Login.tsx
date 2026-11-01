import { useState, type FormEvent } from 'react'
import { BookOpen, Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react'
import { login, setLocalOnly, useSync } from '../lib/sync'
import { Button } from './ui'

export default function Login() {
  const { error: syncError } = useSync()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(syncError)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      await login(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo entrar.')
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-on-accent">
            <BookOpen size={28} strokeWidth={1.75} />
          </span>
          <h1 className="mt-5 font-display text-3xl font-medium tracking-tight">Mi lectura</h1>
          <p className="mt-2 text-sm text-muted">Entra para ver tu progreso en cualquier dispositivo.</p>
        </div>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper py-2.5 pr-10 pl-3 text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-faint hover:text-ink"
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && <p className="text-sm text-accent">{error}</p>}
          <Button type="submit" variant="solid" className="mt-1 py-2.5">
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />}
            Entrar
          </Button>
        </form>

        <button
          onClick={() => setLocalOnly(true)}
          className="mx-auto mt-5 block text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Usar sin cuenta, solo en este dispositivo
        </button>
      </div>
    </div>
  )
}
