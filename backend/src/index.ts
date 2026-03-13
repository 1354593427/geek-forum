import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/serve-static'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '../..', '..')
import { config, validateConfig, isProd } from './config.js'
import { AppError } from './lib/errors.js'
import { safeErrorMessage } from './lib/safeLog.js'
import { health } from './routes/health.js'
import { authRouter } from './routes/auth.js'
import { postsRouter } from './routes/posts.js'
import { mediaRouter } from './routes/media.js'
import { draftsRouter } from './routes/drafts.js'
import { trashRouter } from './routes/trash.js'
import { favoritesRouter } from './routes/favorites.js'
import { categoriesRouter } from './routes/categories.js'
import { initDb, seedAdminIfNeeded, seedCategoriesIfNeeded } from './db/index.js'

validateConfig()

const app = new Hono()

app.onError((err, c) => {
    if (err instanceof AppError) {
        const status = err.statusCode as 400 | 401 | 404 | 409 | 500
        return c.json({ error: err.message }, status)
    }
    console.error('[API] Unhandled error:', safeErrorMessage(err))
    return c.json({ error: 'Internal server error' }, 500)
})

function corsOrigin(origin: string | null): string {
    if (!origin) return config.corsOrigin || '*'
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return origin
    }
    if (config.corsOrigin && origin === config.corsOrigin) return origin
    return isProd ? '' : origin
}

app.use(
    '/api/*',
    cors({
        origin: corsOrigin,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    })
)

await initDb()
await seedAdminIfNeeded()
await seedCategoriesIfNeeded()

app.get('/', (c) => c.text('Geek Forum API is active. Access endpoints at /api/*'))

const uploadsRoot = path.join(projectRoot, 'public')
app.use(
    '/uploads/*',
    serveStatic({
        root: uploadsRoot,
        getContent: async (p) => {
            try {
                const buf = await fs.promises.readFile(p)
                return buf
            } catch {
                return null
            }
        },
        rewriteRequestPath: (p) => (p.startsWith('/uploads/') ? p.slice(1) : p),
    })
)

app.route('/api', health)
app.route('/api/auth', authRouter)
app.route('/api/posts', postsRouter)
app.route('/api/drafts', draftsRouter)
app.route('/api/trash', trashRouter)
app.route('/api/favorites', favoritesRouter)
app.route('/api/media', mediaRouter)
app.route('/api/categories', categoriesRouter)

console.log(`[API] Server running at http://localhost:${config.port}`)
serve({ fetch: app.fetch, port: config.port })
export default app
