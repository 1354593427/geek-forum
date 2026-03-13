/**
 * 统一响应封装
 */
import type { Context } from 'hono'

type HttpStatus = 200 | 400 | 401 | 404 | 409 | 500

export function ok<T>(c: Context, data: T, status: HttpStatus = 200) {
    return c.json({ data }, status)
}

export function okList<T>(c: Context, data: T[], total?: number) {
    return c.json(total !== undefined ? { data, total } : { data })
}

export function err(c: Context, message: string, status: number = 500) {
    const s = status as HttpStatus
    return c.json({ error: message }, s)
}
