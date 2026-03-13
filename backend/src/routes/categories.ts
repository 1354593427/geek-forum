import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import * as categoriesService from '../services/categories.js'
import { err } from '../lib/response.js'
import { AppError } from '../lib/errors.js'

export const categoriesRouter = new Hono()

categoriesRouter.get('/', async (c) => {
    const list = await categoriesService.listCategories()
    return c.json(list)
})

categoriesRouter.post('/', requireAuth, async (c) => {
    const body = await c.req.json<categoriesService.CategoryInput>()
    try {
        const cat = await categoriesService.createCategory(body)
        return c.json(cat, 201)
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

categoriesRouter.put('/:id', requireAuth, async (c) => {
    const id = Number(c.req.param('id'))
    if (isNaN(id)) return err(c, 'Invalid id', 400)
    const body = await c.req.json<Partial<categoriesService.CategoryInput>>()
    try {
        const cat = await categoriesService.updateCategory(id, body)
        return c.json(cat)
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

categoriesRouter.delete('/:id', requireAuth, async (c) => {
    const id = Number(c.req.param('id'))
    if (isNaN(id)) return err(c, 'Invalid id', 400)
    try {
        await categoriesService.deleteCategory(id)
        return c.json({ ok: true })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})
