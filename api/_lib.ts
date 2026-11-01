// Shared helpers for the API functions (files starting with "_" are not routes on Vercel)

export const PROGRESS_KEY = 'bible-challenge:progress'

const redisUrl = () => process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const redisToken = () => process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

export function configError() {
  if (!process.env.APP_PASSWORD) return 'Falta la variable APP_PASSWORD en Vercel.'
  if (!redisUrl() || !redisToken()) return 'Falta conectar Upstash Redis al proyecto en Vercel.'
  return null
}

/** Run Redis commands through Upstash's REST pipeline endpoint */
export async function redis(...commands: (string | number)[][]): Promise<unknown[]> {
  const res = await fetch(`${redisUrl()}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  if (!res.ok) throw new Error(`Redis ${res.status}`)
  const out = (await res.json()) as { result?: unknown; error?: string }[]
  return out.map((r) => {
    if (r.error) throw new Error(r.error)
    return r.result
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
