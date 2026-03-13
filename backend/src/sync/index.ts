/**
 * 阶段 C：文件系统同步 (SSG 兼容)
 * - 发布/更新时在 posts/ 下生成 .html，并重新生成 posts.json
 * - 可选：GIT_AUTO_COMMIT 时自动 git add + commit
 */

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** 项目根目录（geek-forum） */
export function getProjectRoot(): string {
    return path.join(__dirname, '../../..')
}

export type PostMeta = {
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

/** 最小可用的文章 HTML 模板（与现有静态页风格一致） */
function buildPostHtml(meta: PostMeta, bodyHtml: string): string {
    const isFullDocument = /^\s*<!DOCTYPE/i.test(bodyHtml)
    if (isFullDocument) return bodyHtml

    const tagsHtml = (meta.tags || [])
        .map((t) => `<span class="tag tag-pink">${escapeHtml(t)}</span>`)
        .join('\n            ')
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(meta.title)} | 极客论坛</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #fafafa; }
        .tag { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; margin-right: 0.5rem; margin-bottom: 0.5rem; }
        .tag-pink { background: #fce7f3; color: #db2777; }
        .article-content h2 { font-size: 1.75rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; }
        .article-content h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; }
        .article-content p { margin-bottom: 1rem; line-height: 1.8; color: #374151; }
        .article-content ul, .article-content ol { margin-bottom: 1rem; padding-left: 1.5rem; }
        .article-content li { margin-bottom: 0.5rem; color: #4b5563; }
    </style>
</head>
<body class="antialiased">
    <nav class="bg-white border-b sticky top-0 z-50">
        <div class="max-w-4xl mx-auto px-4 py-3">
            <a href="/" class="text-gray-700 hover:text-gray-900">← 返回</a>
        </div>
    </nav>
    <main class="max-w-4xl mx-auto px-4 py-8">
        <header class="mb-8">
            <div class="flex flex-wrap gap-1">${tagsHtml}</div>
            <h1 class="text-3xl font-bold mt-4">${escapeHtml(meta.title)}</h1>
            <p class="text-gray-500 mt-2">${escapeHtml(meta.author)} · ${escapeHtml(meta.date)}</p>
        </header>
        <article class="article-content prose max-w-none">
${bodyHtml}
        </article>
    </main>
    <script>if (typeof lucide !== 'undefined') lucide.createIcons();</script>
</body>
</html>
`
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/**
 * 将一篇文章写入 posts/ 目录下的物理 .html 文件
 */
export function writePostHtml(projectRoot: string, meta: PostMeta, htmlContent: string | null): void {
    const filePath = path.join(projectRoot, meta.url)
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const body = htmlContent && htmlContent.trim()
        ? htmlContent
        : `<p>${escapeHtml(meta.excerpt || '')}</p>`
    const content = buildPostHtml(meta, body)
    fs.writeFileSync(filePath, content, 'utf-8')
}

/**
 * 删除文章对应的 .html 文件（如回收站/物理删除时）
 */
export function removePostHtml(projectRoot: string, url: string): void {
    const filePath = path.join(projectRoot, url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

/** 与 posts.json 条目结构一致（不含 html） */
export type PostIndexEntry = {
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

/**
 * 将文章列表写回 posts.json，保证静态索引与 DB 一致（由调用方从 DB 查询后传入）
 */
export function regeneratePostsJson(projectRoot: string, list: PostIndexEntry[]): void {
    const outPath = path.join(projectRoot, 'posts.json')
    fs.writeFileSync(outPath, JSON.stringify(list, null, 4), 'utf-8')
}

/**
 * 可选：对指定路径执行 git add 并 commit
 */
export function gitCommitIfEnabled(projectRoot: string, message: string): void {
    const enabled = process.env.GIT_AUTO_COMMIT
    if (!enabled || enabled === '0' || enabled.toLowerCase() === 'false') return
    try {
        execSync('git add posts.json posts/', { cwd: projectRoot, stdio: 'pipe' })
        execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: projectRoot, stdio: 'pipe' })
    } catch (e) {
        console.warn('[Sync] GIT_AUTO_COMMIT: git commit failed (maybe nothing to commit or not a repo)', (e as Error).message)
    }
}
