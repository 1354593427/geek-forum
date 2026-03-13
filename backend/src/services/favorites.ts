import { db } from '../db/index.js'
import { favorites } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { BadRequestError } from '../lib/errors.js'

function isUniqueError(err: unknown): boolean {
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
    return msg.includes('UNIQUE') || msg.includes('unique')
}

export async function listFavorites(): Promise<string[]> {
    const rows = await db.select().from(favorites)
    return rows.map((r) => r.url)
}

export async function syncFavorites(list: string[]): Promise<number> {
    await db.delete(favorites).run()
    for (const url of list) {
        try {
            await db.insert(favorites).values({ url }).run()
        } catch {
            /* ignore duplicate */
        }
    }
    return list.length
}

export async function addFavorite(url: string): Promise<boolean> {
    if (!url) throw BadRequestError('url required')
    try {
        await db.insert(favorites).values({ url }).run()
        return true
    } catch (err: unknown) {
        if (isUniqueError(err)) return false // already exists
        throw err
    }
}

export async function removeFavorite(url: string): Promise<void> {
    await db.delete(favorites).where(eq(favorites.url, url)).run()
}
