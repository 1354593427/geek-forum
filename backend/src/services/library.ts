/**
 * 内容库：统一主题、文章、媒体的层级关系
 * 主题(category) → 文章(post) → 媒体(media)
 */

import * as mediaService from './media.js'
import { getCategoryBySlug } from './categories.js'

export type MediaItem = mediaService.MediaItem & {
    /** 文章目录路径，如 posts/news */
    postFolder?: string
    /** 主题 slug（从路径推断） */
    categorySlug?: string
    categoryId?: number
    categoryName?: string
}

/** 从 posts/categorySlug/xxx 解析 category slug */
function parseCategoryFromPath(url: string): string | null {
    const m = url.match(/^\/posts\/([^/]+)\//)
    return m ? m[1] : null
}

/** 从 url 推断 postFolder，如 /posts/news/xxx.jpg → posts/news */
function parsePostFolder(url: string): string | null {
    if (!url.startsWith('/posts/')) return null
    const parts = url.split('/').filter(Boolean)
    return parts.length >= 2 ? parts.slice(0, 2).join('/') : null
}

export type ListMediaOptions = {
    /** 按主题 slug 筛选（仅影响 posts 来源的图片） */
    category?: string
}

export async function listMedia(opts?: ListMediaOptions): Promise<MediaItem[]> {
    const raw = mediaService.listMedia()
    const categoryCache = new Map<string, { id: number; name: string }>()

    const enriched: MediaItem[] = []
    for (const it of raw) {
        let item: MediaItem = { ...it }

        if (it.source === 'posts' && it.url) {
            const folder = parsePostFolder(it.url)
            const slug = parseCategoryFromPath(it.url) ?? folder?.split('/')[1] ?? null
            if (folder) item.postFolder = folder
            if (slug) {
                item.categorySlug = slug
                let cat = categoryCache.get(slug)
                if (!cat) {
                    const c = await getCategoryBySlug(slug)
                    if (c) {
                        cat = { id: c.id, name: c.name }
                        categoryCache.set(slug, cat)
                    }
                }
                if (cat) {
                    item.categoryId = cat.id
                    item.categoryName = cat.name
                }
                if (opts?.category && slug !== opts.category) continue
            } else if (opts?.category) {
                continue
            }
        } else if (opts?.category) {
            continue
        }
        enriched.push(item)
    }
    return enriched
}
