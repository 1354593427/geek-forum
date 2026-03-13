import { Hono } from 'hono'
import * as authService from '../services/auth.js'
import { err } from '../lib/response.js'
import { AppError } from '../lib/errors.js'
import { loginRateLimit } from '../middleware/rateLimit.js'

export const authRouter = new Hono()

authRouter.post('/login', loginRateLimit(), async (c) => {
    const body = await c.req.json<{ username?: string; password?: string }>()
    const { username, password } = body || {}
    try {
        const result = await authService.login(username ?? '', password ?? '')
        return c.json(result)
    } catch (e) {
        if (e instanceof AppError) return err(c, e.message, e.statusCode)
        throw e
    }
})
