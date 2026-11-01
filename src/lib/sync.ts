import { useSyncExternalStore } from 'react'
import { actions, getState, subscribe as subscribeData } from './store'

const TOKEN_KEY = 'bible-challenge:token'
const SYNCED_KEY = 'bible-challenge:synced-at' // local updatedAt last confirmed on the server
const LOCAL_ONLY_KEY = 'bible-challenge:local-only'

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

interface SyncState {
  token: string | null
  localOnly: boolean
  status: SyncStatus
  lastSync: number | null
  error: string | null
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

let sync: SyncState = {
  token: read(TOKEN_KEY),
  localOnly: read(LOCAL_ONLY_KEY) === '1',
  status: 'idle',
  lastSync: null,
  error: null,
}
const listeners = new Set<() => void>()

function set(patch: Partial<SyncState>) {
  sync = { ...sync, ...patch }
  listeners.forEach((l) => l())
}

export function useSync() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => sync,
  )
}

const syncedAt = () => Number(read(SYNCED_KEY) ?? -1)

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`/api/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(sync.token ? { Authorization: `Bearer ${sync.token}` } : {}),
    },
  })
  const body = await res.json().catch(() => null)
  if (!body) throw new Error('No se pudo conectar con el servidor.')
  if (res.status === 401 && sync.token) {
    // Password changed or token invalid: ask to log in again
    write(TOKEN_KEY, null)
    set({ token: null, status: 'idle', error: 'Tu sesión expiró. Vuelve a entrar.' })
  }
  if (!res.ok) throw new Error(body.error ?? `Error ${res.status}`)
  return body
}

function fail(e: unknown) {
  if (!navigator.onLine) set({ status: 'offline', error: null })
  else set({ status: 'error', error: e instanceof Error ? e.message : String(e) })
}

/** Get the server copy; whichever side was edited last wins */
export async function pull() {
  if (!sync.token) return
  set({ status: 'syncing' })
  try {
    const { data } = await api('progress')
    const remoteAt = typeof data?.updatedAt === 'number' ? data.updatedAt : -1
    const local = getState()
    if (data && remoteAt > local.updatedAt) {
      write(SYNCED_KEY, String(remoteAt))
      actions.replaceFromServer(data)
      set({ status: 'synced', lastSync: Date.now(), error: null })
    } else if (local.updatedAt !== remoteAt) {
      await push()
    } else {
      write(SYNCED_KEY, String(remoteAt))
      set({ status: 'synced', lastSync: Date.now(), error: null })
    }
  } catch (e) {
    fail(e)
  }
}

async function push() {
  if (!sync.token) return
  const data = getState()
  set({ status: 'syncing' })
  try {
    await api('progress', { method: 'PUT', body: JSON.stringify({ data }) })
    write(SYNCED_KEY, String(data.updatedAt))
    set({ status: 'synced', lastSync: Date.now(), error: null })
  } catch (e) {
    fail(e)
  }
}

let timer: ReturnType<typeof setTimeout> | undefined

function schedulePush() {
  if (!sync.token || getState().updatedAt === syncedAt()) return
  clearTimeout(timer)
  timer = setTimeout(push, 800)
}

export async function login(password: string) {
  const { token } = await api('login', { method: 'POST', body: JSON.stringify({ password }) })
  write(TOKEN_KEY, token)
  write(LOCAL_ONLY_KEY, null)
  set({ token, localOnly: false, error: null })
  await pull()
}

export function logout() {
  write(TOKEN_KEY, null)
  write(SYNCED_KEY, null)
  set({ token: null, status: 'idle', lastSync: null, error: null })
}

export function setLocalOnly(value: boolean) {
  write(LOCAL_ONLY_KEY, value ? '1' : null)
  set({ localOnly: value })
}

export const syncNow = pull

// Push local edits, and pick up edits from other devices when coming back to the app
if (typeof window !== 'undefined') {
  subscribeData(schedulePush)
  window.addEventListener('online', pull)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pull()
  })
  pull()
}
