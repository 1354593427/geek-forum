/// <reference types="vite/client" />
/**
 * Giscus 评论：在阅读器下方按文章 URL 加载评论。
 * 配置：在 .env 或部署环境设置
 *   VITE_GISCUS_REPO=owner/repo
 *   VITE_GISCUS_REPO_ID=  (从 https://giscus.app 获取)
 *   VITE_GISCUS_CATEGORY=Comments
 *   VITE_GISCUS_CATEGORY_ID=  (从 giscus 获取)
 */

const REPO = import.meta.env?.VITE_GISCUS_REPO as string | undefined
const REPO_ID = import.meta.env?.VITE_GISCUS_REPO_ID as string | undefined
const CATEGORY = import.meta.env?.VITE_GISCUS_CATEGORY as string | undefined
const CATEGORY_ID = import.meta.env?.VITE_GISCUS_CATEGORY_ID as string | undefined

export function isConfigured(): boolean {
    return !!(REPO && REPO_ID && CATEGORY && CATEGORY_ID)
}

const CONTAINER_ID = 'giscus-container'
const SCRIPT_ID = 'giscus-script'

function getTheme(): string {
    if (document.documentElement.classList.contains('dark')) return 'dark'
    return 'preferred_color_scheme'
}

export function loadGiscus(postUrl: string): void {
    if (!isConfigured()) return
    const container = document.getElementById(CONTAINER_ID)
    if (!container) return
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) existing.remove()
    container.innerHTML = ''
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', REPO!)
    script.setAttribute('data-repo-id', REPO_ID!)
    script.setAttribute('data-category', CATEGORY!)
    script.setAttribute('data-category-id', CATEGORY_ID!)
    script.setAttribute('data-mapping', 'specific')
    script.setAttribute('data-term', postUrl)
    script.setAttribute('data-strict', '0')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'bottom')
    script.setAttribute('data-theme', getTheme())
    script.setAttribute('data-lang', 'zh-CN')
    script.crossOrigin = 'anonymous'
    script.async = true
    container.appendChild(script)
}

export function unloadGiscus(): void {
    const script = document.getElementById(SCRIPT_ID)
    if (script) script.remove()
    const container = document.getElementById(CONTAINER_ID)
    if (container) container.innerHTML = ''
}
