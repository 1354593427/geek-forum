/**
 * 种子脚本：从 posts.json 填充 posts 表
 * 用法：npx tsx scripts/seed.ts
 */
import { initDb, seedAdminIfNeeded, seedCategoriesIfNeeded, db } from '../src/db/index.js'
import * as schema from '../src/db/schema.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '../..')

async function seedPosts() {
    const existing = await db.select().from(schema.posts).limit(1)
    if (existing.length > 0) {
        console.log('[Seed] posts table already has data, skipping')
        return
    }

    const rootPostsPath = path.join(projectRoot, 'posts.json')
    const postsDir = path.join(projectRoot, 'posts')
    if (!fs.existsSync(rootPostsPath) || !fs.existsSync(postsDir)) {
        console.log('[Seed] posts.json or posts/ not found, skipping')
        return
    }

    console.log('[Seed] Seeding posts from posts.json + HTML files...')
    const raw = fs.readFileSync(rootPostsPath, 'utf-8')
    const postsList: Array<{
        title: string
        url: string
        category: string
        date: string
        excerpt?: string
        tags?: string[]
        author: string
        author_avatar: string
        sidebar_style: string
    }> = JSON.parse(raw)

    for (const p of postsList) {
        let html: string | null = null
        const htmlPath = path.join(projectRoot, p.url)
        if (fs.existsSync(htmlPath)) {
            try {
                html = fs.readFileSync(htmlPath, 'utf-8')
            } catch {
                /* ignore */
            }
        }
        await db.insert(schema.posts).values({
            title: p.title,
            url: p.url,
            category: p.category,
            date: p.date,
            excerpt: p.excerpt ?? '',
            tags: JSON.stringify(p.tags || []),
            author: p.author,
            authorAvatar: p.author_avatar,
            sidebarStyle: p.sidebar_style,
            html,
        }).run()
    }
    console.log(`[Seed] Seeded ${postsList.length} posts.`)
}

async function main() {
    await initDb()
    await seedPosts()
    await seedAdminIfNeeded()
    await seedCategoriesIfNeeded()
    process.exit(0)
}

main().catch((e) => {
    console.error('[Seed] Error:', e)
    process.exit(1)
})
