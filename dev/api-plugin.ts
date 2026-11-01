import type { IncomingMessage } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

/**
 * Serves the /api functions during `npm run dev`, like Vercel does in production.
 * Without BLOB_READ_WRITE_TOKEN in .env.local, progress is kept in memory
 * (lost when the dev server restarts).
 */
export function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      process.env.DEV_MEMORY_STORE = '1'

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()

        const origin = `http://${req.headers.host}`

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
