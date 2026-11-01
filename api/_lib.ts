// Shared helpers for the API functions (files starting with "_" are not routes on Vercel)
import { get, put } from '@vercel/blob'

const PROGRESS_PATH = 'bible-challenge/progress.json'

// `npm run dev` without a Blob token keeps the data in memory (see dev/api-plugin.ts)
const useMemory = () => process.env.DEV_MEMORY_STORE === '1' && !process.env.BLOB_READ_WRITE_TOKEN
const memory = globalThis as { __progress?: string }

export function configError() {
  if (!process.env.APP_PASSWORD) return 'Falta la variable APP_PASSWORD en Vercel.'
  if (!process.env.BLOB_READ_WRITE_TOKEN && !useMemory()) return 'Falta conectar Vercel Blob al proyecto.'
  return null
}

export async function loadProgress(): Promise<unknown> {
  if (useMemory()) return memory.__progress ? JSON.parse(memory.__progress) : null
  const result = await get(PROGRESS_PATH, { access: 'private', useCache: false })
  if (!result) return null
  return JSON.parse(await new Response(result.stream).text())
}

export async function saveProgress(data: unknown) {
  const body = JSON.stringify(data)
  if (useMemory()) {
    memory.__progress = body
    return
  }
  await put(PROGRESS_PATH, body, {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
}

async function hmac(key: string, message: string) {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** The session token is derived from the password, so changing APP_PASSWORD logs out every device */
export const tokenFor = (password: string) => hmac(password, 'bible-challenge-session')

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function isAuthorized(request: Request) {
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  return token !== '' && safeEqual(token, await tokenFor(process.env.APP_PASSWORD!))
}

export const json = (body: unknown, status = 200) => Response.json(body, { status })
