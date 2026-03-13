import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import * as mediaService from '../services/media.js'
import * as library from '../services/library.js'
import { err } from '../lib/response.js'
import { AppError } from '../lib/errors.js'

export const mediaRouter = new Hono()

mediaRouter.post('/upload', requireAuth, async (c) => {
    try {
        const body = await c.req.parseBody()
        const file = body['file'] ?? body['image']
        if (!file || typeof file === 'string') {
            return err(c, 'No file or image field', 400)
        }
        const result = await mediaService.uploadImage(file as File)
        return c.json(result)
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        console.error('[Media] Upload error:', e)
        return err(c, 'Upload failed', 500)
    }
})

mediaRouter.get('/', async (c) => {
    const category = c.req.query('category')
    const items = await library.listMedia(category ? { category } : undefined)
    return c.json({ items })
})

mediaRouter.delete('/:filename', requireAuth, async (c) => {
    const filename = decodeURIComponent(c.req.param('filename'))
    try {
        mediaService.deleteMedia(filename)
        return c.json({ ok: true })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})
