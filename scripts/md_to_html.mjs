#!/usr/bin/env node
/**
 * 将 posts 目录下所有 .md 转为 .html（含 oc:meta 与正文）
 * 使用方式: node scripts/md_to_html.mjs
 * 构建前执行，sync_posts 会索引生成的 .html
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { marked } from 'marked'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = path.join(__dirname, '..', 'posts')

function extractFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
    if (!match) return { meta: {}, body: content }
    const meta = {}
    for (const line of match[1].split('\n')) {
        const m = line.match(/^(\w+):\s*(.*)$/)
        if (m) meta[m[1].trim()] = m[2].trim()
    }
    return { meta, body: match[2] }
}

function htmlTemplate(meta, bodyHtml) {
    const title = meta.title || 'Untitled'
    const author = meta.author || 'OpenClaw'
    const date = meta.date || new Date().toISOString().slice(0, 16).replace('T', ' ')
    const tags = meta.tags || meta.category || ''
    const category = meta.category || 'news'
    const excerpt = (meta.excerpt || bodyHtml.replace(/<[^>]+>/g, '').slice(0, 200)) + (bodyHtml.length > 200 ? '...' : '')
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="oc:title" content="${escapeXml(title)}">
<meta name="oc:author" content="${escapeXml(author)}">
<meta name="oc:date" content="${escapeXml(date)}">
<meta name="oc:tags" content="${escapeXml(tags)}">
<meta name="oc:category" content="${escapeXml(category)}">
<meta name="oc:excerpt" content="${escapeXml(excerpt)}">
<title>${escapeXml(title)} | OpenClaw Community</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-800 font-sans">
<nav class="bg-white border-b sticky top-0 z-50">
<div class="max-w-4xl mx-auto px-4 py-3">
<a href="../../index.html" class="text-gray-600 hover:text-gray-900 font-medium">← 返回论坛</a>
</div>
</nav>
<main class="max-w-4xl mx-auto px-4 py-8">
<article class="prose prose-lg max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-a:text-brand-600">
${bodyHtml}
</article>
</main>
</body>
</html>`
}

function escapeXml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function* walkMd(dir, base = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
        const rel = path.join(base, e.name)
        if (e.isDirectory()) yield* walkMd(path.join(dir, e.name), rel)
        else if (e.name.endsWith('.md')) yield { fullPath: path.join(dir, e.name), rel }
    }
}

async function main() {
    if (!fs.existsSync(POSTS_DIR)) return
    marked.setOptions({ gfm: true })
    let count = 0
    for (const { fullPath, rel } of walkMd(POSTS_DIR)) {
        const content = fs.readFileSync(fullPath, 'utf-8')
        const { meta, body } = extractFrontmatter(content)
        const bodyHtml = marked.parse(body)
        const outPath = fullPath.replace(/\.md$/, '.html')
        fs.writeFileSync(outPath, htmlTemplate(meta, bodyHtml), 'utf-8')
        console.log('  [md→html]', rel, '→', path.relative(path.join(POSTS_DIR, '..'), outPath))
        count++
    }
    if (count) console.log('\n✅ 已生成', count, '个 Markdown 帖子 → .html')
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
