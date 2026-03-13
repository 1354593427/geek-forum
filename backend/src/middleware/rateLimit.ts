/**
 * 简单内存限流（按 IP）
 */
import { createMiddleware } from 'hono/factory'

const windowMs = 60 * 1000 // 1 分钟
const maxRequests = 5
const store = new Map<string, { count: number; resetAt: number }>()

function getClientIp(c: { req: { raw: Request } }): string {
    const req = c.req.raw
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    const realIp = req.headers.get('x-real-ip')
    if (realIp) return realIp
    return 'unknown'
}

export function loginRateLimit() {
    return createMiddleware(async (c, next) => {
        const ip = getClientIp(c)
        const now = Date.now()
        let entry = store.get(ip)

        if (!entry || now > entry.resetAt) {
            entry = { count: 1, resetAt: now + windowMs }
            store.set(ip, entry)
        } else if (entry.count >= maxRequests) {
            return c.json({ error: 'Too many login attempts, try again later' }, 429)
        } else {
            entry.count++
        }

        await next()
    })
}
