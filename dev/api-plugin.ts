import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

/**
 * Serves the /api functions during `npm run dev`, like Vercel does in production.
 * Without Upstash credentials in .env.local, it uses an in-memory Redis stand-in
 * (data is lost when the dev server restarts).
 */
export function devApi(): Plugin {
  const memory = new Map<string, string>()

  // Minimal Upstash REST pipeline: only the commands the API uses
  const fakeRedis = async (req: IncomingMessage, res: ServerResponse) => {
    const commands = JSON.parse(await readBody(req)) as string[][]
    const results = commands.map(([cmd, key, value, ...rest]) => {
      switch (cmd.toUpperCase()) {
        case 'GET':
          return { result: memory.get(key) ?? null }
        case 'SET':
          if (rest.includes('NX') && memory.has(key)) return { result: null }
          memory.set(key, String(value))
          return { result: 'OK' }
        case 'INCR': {
          const n = Number(memory.get(key) ?? 0) + 1
          memory.set(key, String(n))
          return { result: n }
        }
        case 'DEL':
          return { result: memory.delete(key) ? 1 : 0 }
        default:
          return { error: `Unsupported command ${cmd}` }
      }
    })
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(results))
  }

  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const useFake = !process.env.KV_REST_API_URL && !process.env.UPSTASH_REDIS_REST_URL

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (url.startsWith('/__fake-redis')) return fakeRedis(req, res)
        if (!url.startsWith('/api/')) return next()

        const origin = `http://${req.headers.host}`
        if (useFake) {
          process.env.KV_REST_API_URL = `${origin}/__fake-redis`
          process.env.KV_REST_API_TOKEN = 'dev'
        }

        try {
          const name = url.slice(5).split('?')[0]
          if (!/^[a-z-]+$/.test(name)) return next()
          const mod = await server.ssrLoadModule(`/api/${name}.ts`)
          const handler = mod[req.method ?? 'GET']
          if (typeof handler !== 'function') {
            res.statusCode = 405
            return res.end()
          }
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req)
          const request = new Request(new URL(url, origin), {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body,
          })
          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(await response.text())
        } catch (e) {
          server.config.logger.error(String(e))
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(e) }))
        }
      })
    },
  }
}

function readBody(req: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}
