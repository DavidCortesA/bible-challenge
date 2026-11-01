import { configError, json, safeEqual, tokenFor } from './_lib.js'

export async function POST(request: Request) {
  const error = configError()
  if (error) return json({ error }, 500)

  const body = (await request.json().catch(() => ({}))) as { password?: unknown }
  const password = typeof body.password === 'string' ? body.password : ''

  if (!safeEqual(await tokenFor(password), await tokenFor(process.env.APP_PASSWORD!))) {
    // Slow down guessing
    await new Promise((r) => setTimeout(r, 1500))
    return json({ error: 'Contraseña incorrecta.' }, 401)
  }

  return json({ token: await tokenFor(password) })
}
