import { createMiddleware } from 'hono/factory'
import { jwtVerify } from 'jose'
import { config } from '../config.js'

const JWT_SECRET = new TextEncoder().encode(config.jwtSecret)

export const requireAuth = createMiddleware(async (c, next) => {
    const auth = c.req.header('Authorization')
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) {
        return c.json({ error: 'Unauthorized: missing token' }, 401)
    }
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        c.set('user', payload)
        await next()
    } catch {
        return c.json({ error: 'Unauthorized: invalid token' }, 401)
    }
})
