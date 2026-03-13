import { createClient } from '@libsql/client'
import { eq } from 'drizzle-orm'
import { categories } from './schema.js'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import * as schema from './schema.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '../../data')
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'forum.db')
const fileUrl = dbPath.startsWith('file:') ? dbPath : `file:${path.resolve(dbPath)}`
const projectRoot = path.join(__dirname, '../../..')

if (!dbPath.startsWith('file:') && !fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
}

export const client = createClient({ url: fileUrl })
export const db = drizzle(client, { schema })

/** migrations 目录（相对于 backend/） */
const migrationsFolder = path.join(__dirname, '../../drizzle')

/** 初始化数据库：执行 Drizzle 迁移 */
export async function initDb() {
    await migrate(db, { migrationsFolder })
}

/** 种子管理员（每次启动检查，ADMIN_USER/ADMIN_PASSWORD 存在时创建） */
export async function seedAdminIfNeeded() {
    const adminUser = process.env.ADMIN_USER
    const adminPass = process.env.ADMIN_PASSWORD
    if (!adminUser || !adminPass) return
    const existing = await db.select().from(schema.users).where(eq(schema.users.username, adminUser)).limit(1)
    if (existing.length > 0) return
    const hash = await hashPassword(adminPass)
    await db.insert(schema.users).values({
        username: adminUser,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
    }).run()
    console.log(`[DB] Created admin user: ${adminUser}`)
}

const DEFAULT_CATEGORIES = [
    { slug: 'robot', name: '机器人与仿真', sortOrder: 0 },
    { slug: 'algo', name: '算法与架构', sortOrder: 1 },
    { slug: 'vla', name: '具身智能 VLA', sortOrder: 2 },
    { slug: 'news', name: '新鲜动态', sortOrder: 3 },
    { slug: 'travel', name: '探索与生活', sortOrder: 4 },
]

export async function seedCategoriesIfNeeded() {
    const existing = await db.select().from(categories).limit(1)
    if (existing.length > 0) return
    for (const c of DEFAULT_CATEGORIES) {
        await db.insert(categories).values(c).run()
    }
    console.log(`[DB] Seeded ${DEFAULT_CATEGORIES.length} default categories`)
}

const SALT_LEN = 16
const KEY_LEN = 64

export async function hashPassword(password: string): Promise<string> {
    const { scrypt, randomBytes } = await import('crypto')
    const { promisify } = await import('util')
    const scryptAsync = promisify(scrypt)
    const salt = randomBytes(SALT_LEN).toString('hex')
    const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer
    return `${salt}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const crypto = await import('crypto')
    const util = await import('util')
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const derived = (await util.promisify(crypto.scrypt)(password, salt, KEY_LEN)) as Buffer
    const buf = Buffer.from(hash, 'hex')
    return buf.length === derived.length && crypto.timingSafeEqual(buf, derived)
}
