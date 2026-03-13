import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import * as draftsService from '../services/drafts.js'

export const draftsRouter = new Hono()

draftsRouter.use('*', requireAuth)

draftsRouter.post('/sync', async (c) => {
    const body = await c.req.json<{ drafts: Array<Record<string, unknown>> }>()
    const list = body?.drafts ?? []
    const count = await draftsService.syncDrafts(list)
    return c.json({ count })
})

draftsRouter.get('/', async (c) => {
    const list = await draftsService.listDrafts()
    return c.json(list)
})

draftsRouter.post('/', async (c) => {
    const body = await c.req.json<draftsService.DraftInput>()
    const id = await draftsService.createDraft(body)
    return c.json({ id })
})

draftsRouter.put('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json<Partial<draftsService.DraftInput>>()
    await draftsService.updateDraft(id, body)
    return c.json({ ok: true })
})

draftsRouter.delete('/:id', async (c) => {
    const id = c.req.param('id')
    await draftsService.deleteDraft(id)
    return c.json({ ok: true })
})
