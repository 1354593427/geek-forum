import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import * as trashService from '../services/trash.js'
import { err } from '../lib/response.js'
import { AppError } from '../lib/errors.js'

export const trashRouter = new Hono()

trashRouter.use('*', requireAuth)

trashRouter.post('/sync', async (c) => {
    const body = await c.req.json<{ trash: Array<Record<string, unknown>> }>()
    const list = body?.trash ?? []
    const count = await trashService.syncTrash(list)
    return c.json({ count })
})

trashRouter.get('/', async (c) => {
    const list = await trashService.listTrash()
    return c.json(list)
})

trashRouter.post('/', async (c) => {
    const body = await c.req.json<trashService.TrashInput>()
    await trashService.addToTrash(body)
    return c.json({ ok: true })
})

trashRouter.post('/restore/:url', async (c) => {
    const url = decodeURIComponent(c.req.param('url'))
    try {
        await trashService.restoreFromTrash(url)
        return c.json({ ok: true })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

trashRouter.delete('/', async (c) => {
    await trashService.clearTrash()
    return c.json({ ok: true })
})
