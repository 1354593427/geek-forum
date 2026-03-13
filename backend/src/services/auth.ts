import { SignJWT } from 'jose'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '../db/index.js'
import { config } from '../config.js'
import { BadRequestError, UnauthorizedError } from '../lib/errors.js'

export type LoginResult = {
    token: string
    username: string
}

const JWT_SECRET = new TextEncoder().encode(config.jwtSecret)

export async function login(username: string, password: string): Promise<LoginResult> {
    if (!username || !password) {
        throw BadRequestError('username and password required')
    }
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1)
    const user = rows[0]
    if (!user) {
        throw UnauthorizedError('Invalid credentials')
    }
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
        throw UnauthorizedError('Invalid credentials')
    }
    const token = await new SignJWT({ sub: String(user.id), username: user.username })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('geek-forum')
        .setIssuedAt()
        .setExpirationTime(config.jwtExp)
        .sign(JWT_SECRET)
    return { token, username: user.username }
}
