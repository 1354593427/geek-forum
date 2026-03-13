export type Category = {
    id: number
    slug: string
    name: string
    sortOrder: number
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: 0, slug: 'robot', name: '机器人与仿真 (Robot)', sortOrder: 0 },
    { id: 1, slug: 'algo', name: '算法与架构 (Algo)', sortOrder: 1 },
    { id: 2, slug: 'vla', name: '具身智能 (VLA)', sortOrder: 2 },
    { id: 3, slug: 'news', name: '新鲜动态 (News)', sortOrder: 3 },
    { id: 4, slug: 'travel', name: '探索与生活 (Travel)', sortOrder: 4 },
]

export async function getCategories(): Promise<Category[]> {
    const base = (import.meta.env.VITE_API_BASE as string)?.replace(/\/$/, '')
    if (!base) return DEFAULT_CATEGORIES
    try {
        const res = await fetch(`${base}/categories`)
        if (!res.ok) return DEFAULT_CATEGORIES
        const list = await res.json()
        if (Array.isArray(list) && list.length > 0) {
            return list
        }
    } catch {
        /* fallback to defaults */
    }
    return DEFAULT_CATEGORIES
}
