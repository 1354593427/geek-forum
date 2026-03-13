import { db } from '../db/index.js'
import { posts, trash } from '../db/schema.js'
import { eq, like, or, and } from 'drizzle-orm'
import {
    getProjectRoot,
    writePostHtml,
    removePostHtml,
    regeneratePostsJson,
    gitCommitIfEnabled,
    type PostIndexEntry,
} from '../sync/index.js'
import { NotFoundError, ConflictError } from '../lib/errors.js'

export type PostInput = {
    title: string
    url: string
    category: string
    date: string
    excerpt?: string
    tags: string[]
    author: string
    author_avatar: string
    sidebar_style: string
    html?: string
}

export type PostFormat = {
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

function toPostFormat(p: Record<string, unknown>): PostFormat {
    const tags = typeof p.tags === 'string' ? JSON.parse(p.tags as string) : p.tags
    return {
        title: String(p.title),
        url: String(p.url),
        category: String(p.category),
        date: String(p.date),
        excerpt: String(p.excerpt ?? ''),
        tags: Array.isArray(tags) ? tags : [],
        author: String(p.author),
        author_avatar: String((p as { authorAvatar?: string }).authorAvatar ?? (p as { author_avatar?: string }).author_avatar ?? ''),
        sidebar_style: String((p as { sidebarStyle?: string }).sidebarStyle ?? (p as { sidebar_style?: string }).sidebar_style ?? ''),
    }
}

function toIndexEntry(p: Record<string, unknown>): PostIndexEntry {
    const f = toPostFormat(p)
    return { ...f }
}

async function syncToFilesystem(message: string): Promise<void> {
    const root = getProjectRoot()
    const rows = await db.select().from(posts)
    const list: PostIndexEntry[] = (rows as Record<string, unknown>[]).map(toIndexEntry)
    regeneratePostsJson(root, list)
    gitCommitIfEnabled(root, message)
}

function isUniqueError(err: unknown): boolean {
    const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
    return msg.includes('UNIQUE') || msg.includes('unique')
}

export async function listPosts(category?: string, q?: string) {
    let query = db.select().from(posts)
    const conditions: ReturnType<typeof eq>[] = []
    if (category && category !== 'all') {
        conditions.push(eq(posts.category, category))
    }
    if (q) {
        conditions.push(
            or(
                like(posts.title, `%${q}%`),
                like(posts.excerpt, `%${q}%`),
                like(posts.tags, `%${q}%`)
            )!
        )
    }
    const results = conditions.length > 0 ? await query.where(and(...conditions)) : await query
    return results.map((p) => toPostFormat(p as Record<string, unknown>))
}

export async function getPostByUrl(url: string, withHtml = false): Promise<PostFormat & { html?: string | null }> {
    const result = await db.select().from(posts).where(eq(posts.url, url)).get()
    if (!result) throw NotFoundError('Not found')
    const post = toPostFormat(result as Record<string, unknown>)
    const html = (result as { html?: string }).html
    return withHtml ? { ...post, html: html ?? null } : post
}

export async function getPostByQueryUrl(url: string): Promise<PostFormat & { html: string | null }> {
    const result = await db.select().from(posts).where(eq(posts.url, url)).get()
    if (!result) throw NotFoundError('Not found')
    const post = toPostFormat(result as Record<string, unknown>)
    const html = (result as { html?: string }).html
    return { ...post, html: html ?? null }
}

export async function createPost(p: PostInput): Promise<void> {
    const row = {
        title: p.title,
        url: p.url,
        category: p.category,
        date: p.date,
        excerpt: p.excerpt ?? '',
        tags: JSON.stringify(p.tags || []),
        author: p.author,
        authorAvatar: p.author_avatar,
        sidebarStyle: p.sidebar_style,
        html: p.html ?? null,
    }
    try {
        await db.insert(posts).values(row).run()
    } catch (err: unknown) {
        if (isUniqueError(err)) throw ConflictError('URL already exists')
        throw err
    }
    const root = getProjectRoot()
    const meta = {
        title: p.title,
        url: p.url,
        category: p.category,
        date: p.date,
        excerpt: p.excerpt ?? '',
        tags: p.tags || [],
        author: p.author,
        author_avatar: p.author_avatar,
        sidebar_style: p.sidebar_style,
    }
    writePostHtml(root, meta, p.html ?? null)
    await syncToFilesystem(`post: add ${p.url}`)
}

export async function updatePost(p: PostInput): Promise<void> {
    await db
        .update(posts)
        .set({
            title: p.title ?? undefined,
            category: p.category ?? undefined,
            date: p.date ?? undefined,
            excerpt: p.excerpt ?? undefined,
            tags: p.tags ? JSON.stringify(p.tags) : undefined,
            author: p.author ?? undefined,
            authorAvatar: p.author_avatar ?? undefined,
            sidebarStyle: p.sidebar_style ?? undefined,
            html: p.html ?? undefined,
        })
        .where(eq(posts.url, p.url))
        .run()

    const updated = await db.select().from(posts).where(eq(posts.url, p.url)).get()
    if (updated) {
        const root = getProjectRoot()
        const meta = {
            title: updated.title,
            url: updated.url,
            category: updated.category,
            date: updated.date,
            excerpt: updated.excerpt ?? '',
            tags: typeof updated.tags === 'string' ? (JSON.parse(updated.tags) as string[]) : [],
            author: updated.author,
            author_avatar: updated.authorAvatar,
            sidebar_style: updated.sidebarStyle,
        }
        writePostHtml(root, meta, updated.html ?? null)
    }
    await syncToFilesystem(`post: update ${p.url}`)
}

export async function deletePost(url: string): Promise<void> {
    const postToMove = await db.select().from(posts).where(eq(posts.url, url)).get()
    if (!postToMove) throw NotFoundError('Not found')

    const trashRow = {
        title: postToMove.title,
        url: postToMove.url,
        category: postToMove.category,
        date: postToMove.date,
        excerpt: postToMove.excerpt,
        tags: postToMove.tags,
        author: postToMove.author,
        authorAvatar: postToMove.authorAvatar,
        sidebarStyle: postToMove.sidebarStyle,
    }
    await db.insert(trash).values(trashRow).run()
    await db.delete(posts).where(eq(posts.url, url)).run()

    removePostHtml(getProjectRoot(), url)
    await syncToFilesystem(`post: remove ${url}`)
}

export async function syncPosts(list: PostInput[]): Promise<number> {
    let count = 0
    for (const p of list) {
        const row = {
            title: p.title,
            url: p.url,
            category: p.category,
            date: p.date,
            excerpt: p.excerpt ?? '',
            tags: JSON.stringify(p.tags || []),
            author: p.author,
            authorAvatar: p.author_avatar,
            sidebarStyle: p.sidebar_style,
            html: p.html ?? null,
        }
        try {
            await db.insert(posts).values(row).run()
        } catch (err: unknown) {
            if (isUniqueError(err)) {
                await db
                    .update(posts)
                    .set({
                        title: row.title,
                        category: row.category,
                        date: row.date,
                        excerpt: row.excerpt,
                        tags: row.tags,
                        author: row.author,
                        authorAvatar: row.authorAvatar,
                        sidebarStyle: row.sidebarStyle,
                        html: row.html,
                    })
                    .where(eq(posts.url, row.url))
                    .run()
            } else {
                throw err
            }
        }
        count++
    }
    await syncToFilesystem(`post: sync ${count} posts`)
    return count
}
