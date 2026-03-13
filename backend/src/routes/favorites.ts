import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import * as favoritesService from '../services/favorites.js'
import { err } from '../lib/response.js'
import { AppError } from '../lib/errors.js'

export const favoritesRouter = new Hono()

favoritesRouter.use('*', requireAuth)

favoritesRouter.post('/sync', async (c) => {
    const body = await c.req.json<{ favorites: string[] }>()
    const list = body?.favorites ?? []
    const count = await favoritesService.syncFavorites(list)
    return c.json({ count })
})

favoritesRouter.get('/', async (c) => {
    const list = await favoritesService.listFavorites()
    return c.json(list)
})

favoritesRouter.post('/', async (c) => {
    const body = await c.req.json<{ url: string }>()
    const url = body?.url
    try {
        await favoritesService.addFavorite(url)
        return c.json({ ok: true })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

favoritesRouter.delete('/:url', async (c) => {
    const url = decodeURIComponent(c.req.param('url'))
    await favoritesService.removeFavorite(url)
    return c.json({ ok: true })
})
