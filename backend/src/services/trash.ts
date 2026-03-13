import { db } from '../db/index.js'
import { trash, posts } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { NotFoundError } from '../lib/errors.js'

export type TrashItemFormat = {
    title: string
    url: string
    category: string
    date: string
    excerpt: string
    tags: string[]
    author: string
    author_avatar: string
    sidebar_style: string
}

export type TrashInput = {
    title: string
    url: string
    category: string
    date: string
    excerpt?: string
    tags: string[]
    author: string
    author_avatar: string
    sidebar_style: string
}

export async function listTrash(): Promise<TrashItemFormat[]> {
    const rows = await db.select().from(trash)
    return rows.map((r) => ({
        title: r.title,
        url: r.url,
        category: r.category,
        date: r.date,
        excerpt: r.excerpt ?? '',
        tags: JSON.parse(r.tags) as string[],
        author: r.author,
        author_avatar: r.authorAvatar,
        sidebar_style: r.sidebarStyle,
    }))
}

export async function syncTrash(list: Array<Record<string, unknown>>): Promise<number> {
    await db.delete(trash).run()
    for (const p of list) {
        await db.insert(trash).values({
            title: String(p.title ?? ''),
            url: String(p.url ?? ''),
            category: String(p.category ?? ''),
            date: String(p.date ?? ''),
            excerpt: p.excerpt != null ? String(p.excerpt) : null,
            tags: JSON.stringify((p.tags as string[]) ?? []),
            author: String(p.author ?? ''),
            authorAvatar: String((p as Record<string, string>).author_avatar ?? ''),
            sidebarStyle: String((p as Record<string, string>).sidebar_style ?? ''),
        }).run()
    }
    return list.length
}

export async function addToTrash(body: TrashInput): Promise<void> {
    await db.insert(trash).values({
        title: body.title,
        url: body.url,
        category: body.category,
        date: body.date,
        excerpt: body.excerpt ?? null,
        tags: JSON.stringify(body.tags ?? []),
        author: body.author,
        authorAvatar: body.author_avatar,
        sidebarStyle: body.sidebar_style,
    }).run()
}

export async function restoreFromTrash(url: string): Promise<void> {
    const item = await db.select().from(trash).where(eq(trash.url, url)).get()
    if (!item) throw NotFoundError('Not found in trash')

    await db.insert(posts).values({
        title: item.title,
        url: item.url,
        category: item.category,
        date: item.date,
        excerpt: item.excerpt,
        tags: item.tags,
        author: item.author,
        authorAvatar: item.authorAvatar,
        sidebarStyle: item.sidebarStyle,
    }).run()

    await db.delete(trash).where(eq(trash.url, url)).run()
}

export async function clearTrash(): Promise<void> {
    await db.delete(trash).run()
}
