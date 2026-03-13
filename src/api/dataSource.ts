import type { Post } from '../types'
import type { PostsDataSource } from './types'

/** 静态模式：从 posts.json 获取数据 */
const staticSource: PostsDataSource = {
    async getPosts(): Promise<Post[]> {
        const res = await fetch('posts.json')
        return res.json()
    },
    getPostHtml: undefined, // 静态模式用 iframe.src 直接加载
}

/** API 模式：从后端获取数据 */
const apiSource = (baseUrl: string): PostsDataSource => {
    const base = baseUrl.replace(/\/$/, '')
    return {
        async getPosts(): Promise<Post[]> {
            const res = await fetch(`${base}/posts`)
            if (!res.ok) throw new Error('Failed to fetch posts from API')
            return res.json()
        },
        async getPostHtml(url: string): Promise<string | null> {
            const res = await fetch(`${base}/posts?url=${encodeURIComponent(url)}`)
            if (!res.ok) return null
            const data = await res.json()
            return data?.html ?? null
        },
    }
}

/**
 * 获取当前使用的数据源
 * VITE_API_BASE 为空时使用静态模式
 */
export function getDataSource(): PostsDataSource {
    const base = import.meta.env.VITE_API_BASE as string | undefined
    if (base) {
        return apiSource(base)
    }
    return staticSource
}
