import type { Post } from '../types'

/**
 * 文章数据源接口
 * 阶段 0：staticSource（fetch posts.json）
 * 阶段 2：apiSource（请求后端 /api/posts）
 */
export interface PostsDataSource {
    getPosts(): Promise<Post[]>
    /** 获取单篇 HTML 内容，API 模式下使用 */
    getPostHtml?(url: string): Promise<string | null>
}
