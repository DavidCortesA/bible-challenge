import { configError, json, redis, safeEqual, tokenFor } from './_lib.js'

const MAX_ATTEMPTS = 10
const WINDOW_SECONDS = 15 * 60

export async function POST(request: Request) {
  const error = configError()
  if (error) return json({ error }, 500)

  // Basic brute-force protection: 10 failed attempts per IP every 15 minutes
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const attemptsKey = `bible-challenge:login:${ip}`
  const [, attempts] = await redis(['SET', attemptsKey, 0, 'EX', WINDOW_SECONDS, 'NX'], ['GET', attemptsKey])
  if (Number(attempts) >= MAX_ATTEMPTS) {
    return json({ error: 'Demasiados intentos. Espera 15 minutos.' }, 429)
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown }
  const password = typeof body.password === 'string' ? body.password : ''
  const token = await tokenFor(process.env.APP_PASSWORD!)

  if (!safeEqual(await tokenFor(password), token)) {
    await redis(['INCR', attemptsKey])
    return json({ error: 'Contraseña incorrecta.' }, 401)
  }

  await redis(['DEL', attemptsKey])
  return json({ token })
}
