import { configError, isAuthorized, json, loadProgress, saveProgress } from './_lib.js'

async function guard(request: Request) {
  const error = configError()
  if (error) return json({ error }, 500)
  if (!(await isAuthorized(request))) return json({ error: 'Sesión no válida.' }, 401)
  return null
}

export async function GET(request: Request) {
  const denied = await guard(request)
  if (denied) return denied
  return json({ data: await loadProgress() })
}

export async function PUT(request: Request) {
  const denied = await guard(request)
  if (denied) return denied

  const body = (await request.json().catch(() => null)) as { data?: unknown } | null
  if (!body?.data || typeof body.data !== 'object') return json({ error: 'Datos inválidos.' }, 400)

  await saveProgress(body.data)
  return json({ ok: true })
}
