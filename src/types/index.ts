export interface Post {
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

export interface Draft {
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
