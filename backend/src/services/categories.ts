import { db } from '../db/index.js'
import { categories } from '../db/schema.js'
import { eq, asc } from 'drizzle-orm'
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors.js'

export type CategoryFormat = {
    id: number
    slug: string
    name: string
    sortOrder: number
}

export type CategoryInput = {
    slug: string
    name: string
    sortOrder?: number
}

function slugSafe(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'uncategorized'
}

export async function listCategories(): Promise<CategoryFormat[]> {
    const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.slug))
    return rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        sortOrder: r.sortOrder,
    }))
}

export async function getCategoryBySlug(slug: string): Promise<CategoryFormat | null> {
    const row = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1).get()
    if (!row) return null
    return { id: row.id, slug: row.slug, name: row.name, sortOrder: row.sortOrder }
}

export async function createCategory(input: CategoryInput): Promise<CategoryFormat> {
    const slug = input.slug?.trim() ? slugSafe(input.slug) : slugSafe(input.name)
    const name = input.name?.trim() || slug
    if (!slug) throw BadRequestError('slug or name required')
    try {
        await db.insert(categories).values({
            slug,
            name,
            sortOrder: input.sortOrder ?? 0,
        }).run()
    } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
        if (msg.includes('UNIQUE') || msg.includes('unique')) throw ConflictError(`Slug "${slug}" already exists`)
        throw err
    }
    const row = await db.select().from(categories).where(eq(categories.slug, slug)).get()
    if (!row) throw new Error('Failed to create category')
    return { id: row.id, slug: row.slug, name: row.name, sortOrder: row.sortOrder }
}

export async function updateCategory(id: number, input: Partial<CategoryInput>): Promise<CategoryFormat> {
    const existing = await db.select().from(categories).where(eq(categories.id, id)).get()
    if (!existing) throw NotFoundError('Category not found')
    const slug = input.slug != null ? slugSafe(input.slug) : existing.slug
    const name = input.name != null ? input.name.trim() || existing.name : existing.name
    const sortOrder = input.sortOrder ?? existing.sortOrder
    try {
        await db.update(categories)
            .set({ slug, name, sortOrder })
            .where(eq(categories.id, id))
            .run()
    } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
        if (msg.includes('UNIQUE') || msg.includes('unique')) throw ConflictError(`Slug "${slug}" already exists`)
        throw err
    }
    const row = await db.select().from(categories).where(eq(categories.id, id)).get()
    if (!row) throw new Error('Failed to update category')
    return { id: row.id, slug: row.slug, name: row.name, sortOrder: row.sortOrder }
}

export async function deleteCategory(id: number): Promise<void> {
    const existing = await db.select().from(categories).where(eq(categories.id, id)).get()
    if (!existing) throw NotFoundError('Category not found')
    await db.delete(categories).where(eq(categories.id, id)).run()
}
