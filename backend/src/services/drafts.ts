import { db } from '../db/index.js'
import { drafts } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { ConflictError } from '../lib/errors.js'

export type DraftInput = {
    id?: string
    title: string
    category: string
    author: string
    tags?: string
    date?: string
    content: string
    lastUpdated: number
    savedAt?: number
    url?: string
}

export type DraftFormat = {
    id: string
    title: string
    category: string
    author: string
    tags: string
    date: string
    content: string
    lastUpdated: number
    savedAt?: number
    url?: string
}

function isUniqueError(err: unknown): boolean {
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
    return msg.includes('UNIQUE') || msg.includes('unique')
}

export async function listDrafts(): Promise<DraftFormat[]> {
    const rows = await db.select().from(drafts)
    return rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        author: r.author,
        tags: r.tags ?? '',
        date: r.date ?? '',
        content: r.content,
        lastUpdated: r.lastUpdated,
        savedAt: r.savedAt ?? undefined,
        url: r.url ?? undefined,
    }))
}

export async function syncDrafts(list: Array<Record<string, unknown>>): Promise<number> {
    await db.delete(drafts).run()
    for (const d of list) {
        const id = (d.id as string) ?? `draft_${Date.now()}`
        await db.insert(drafts).values({
            id,
            title: String(d.title ?? ''),
            category: String(d.category ?? 'robot'),
            author: String(d.author ?? ''),
            tags: d.tags != null ? String(d.tags) : null,
            date: d.date != null ? String(d.date) : null,
            content: String(d.content ?? ''),
            lastUpdated: Number(d.lastUpdated ?? Date.now()),
            savedAt: d.savedAt != null ? Number(d.savedAt) : null,
            url: d.url != null ? String(d.url) : null,
        }).run()
    }
    return list.length
}

export async function createDraft(body: DraftInput): Promise<string> {
    const id = body.id ?? `draft_${Date.now()}`
    const row = {
        id,
        title: body.title,
        category: body.category,
        author: body.author,
        tags: body.tags ?? null,
        date: body.date ?? null,
        content: body.content,
        lastUpdated: body.lastUpdated,
        savedAt: body.savedAt ?? null,
        url: body.url ?? null,
    }
    try {
        await db.insert(drafts).values(row).run()
    } catch (err: unknown) {
        if (isUniqueError(err)) {
            await db
                .update(drafts)
                .set({
                    title: row.title,
                    category: row.category,
                    author: row.author,
                    tags: row.tags,
                    date: row.date,
                    content: row.content,
                    lastUpdated: row.lastUpdated,
                    savedAt: row.savedAt,
                    url: row.url,
                })
                .where(eq(drafts.id, id))
                .run()
        } else {
            throw err
        }
    }
    return id
}

export async function updateDraft(id: string, body: Partial<DraftInput>): Promise<void> {
    await db
        .update(drafts)
        .set({
            title: body.title ?? undefined,
            category: body.category ?? undefined,
            author: body.author ?? undefined,
            tags: body.tags ?? undefined,
            date: body.date ?? undefined,
            content: body.content ?? undefined,
            lastUpdated: body.lastUpdated ?? undefined,
            savedAt: body.savedAt ?? undefined,
            url: body.url ?? undefined,
        })
        .where(eq(drafts.id, id))
        .run()
}

export async function deleteDraft(id: string): Promise<void> {
    await db.delete(drafts).where(eq(drafts.id, id)).run()
}
