import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.js'
import * as postsService from '../services/posts.js'
import { err } from '../lib/response.js'
import { AppError } from '../lib/errors.js'

export const postsRouter = new Hono()

/** 获取文章列表 */
postsRouter.get('/', async (c) => {
    const category = c.req.query('category')
    const q = c.req.query('q')
    const singleUrl = c.req.query('url')

    try {
        if (singleUrl) {
            const post = await postsService.getPostByQueryUrl(singleUrl)
            return c.json(post)
        }
        const list = await postsService.listPosts(category ?? undefined, q ?? undefined)
        return c.json(list)
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

/** 获取单篇文章 */
postsRouter.get('/:url', async (c) => {
    const url = decodeURIComponent(c.req.param('url'))
    try {
        const post = await postsService.getPostByUrl(url, true)
        return c.json(post)
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

/** 创建/发布新文章 (需鉴权) */
postsRouter.post('/', requireAuth, async (c) => {
    const p = await c.req.json<postsService.PostInput>()
    if (!p.url || !p.title) return err(c, 'title and url required', 400)
    try {
        await postsService.createPost(p)
        return c.json({ ok: true })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

/** 更新文章 (需鉴权) */
postsRouter.put('/', requireAuth, async (c) => {
    const p = await c.req.json<postsService.PostInput>()
    if (!p.url) return err(c, 'url required', 400)
    try {
        await postsService.updatePost(p)
        return c.json({ ok: true })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

/** 删除文章（移入回收站，需鉴权） */
postsRouter.delete('/', requireAuth, async (c) => {
    const url = c.req.query('url')
    if (!url) return err(c, 'url required', 400)
    try {
        await postsService.deletePost(url)
        return c.json({ ok: true })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})

/** 同步：批量 upsert（需鉴权） */
postsRouter.post('/sync', requireAuth, async (c) => {
    const body = await c.req.json<{ posts: postsService.PostInput[] }>()
    const list = body?.posts
    if (!Array.isArray(list) || list.length === 0) {
        return err(c, 'posts array required', 400)
    }
    try {
        const count = await postsService.syncPosts(list)
        return c.json({ count })
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})
