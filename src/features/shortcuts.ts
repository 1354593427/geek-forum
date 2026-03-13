import * as store from '../core/store'
import * as reader from './reader'

let helpEl: HTMLDivElement | null = null

function showHelp() {
    if (helpEl) {
        helpEl.remove()
        helpEl = null
        return
    }
    helpEl = document.createElement('div')
    helpEl.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4'
    helpEl.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-sm shadow-xl">
            <h3 class="text-sm font-black uppercase mb-4">键盘快捷键</h3>
            <div class="text-xs space-y-2 text-gray-600">
                <p><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">j</kbd> 下一篇</p>
                <p><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">k</kbd> 上一篇</p>
                <p><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">o</kbd> 打开选中</p>
                <p><kbd class="px-1.5 py-0.5 bg-gray-100 rounded">Esc</kbd> 关闭阅读器 / 帮助</p>
            </div>
            <button class="mt-4 text-xs text-brand-600 font-bold">关闭</button>
        </div>
    `
    helpEl.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement) === helpEl) {
            helpEl?.remove()
            helpEl = null
        }
    })
    document.body.appendChild(helpEl)
}

export function init() {
    document.addEventListener('keydown', (e) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
        if (e.key === '?') {
            e.preventDefault()
            showHelp()
            return
        }
        if (e.key === 'Escape') {
            const url = window.location.hash.slice(1)
            if (url) reader.close()
            else if (helpEl) {
                helpEl.remove()
                helpEl = null
            }
            return
        }
        const url = window.location.hash.slice(1)
        const posts = store.getPosts()
        const cat = store.getCurrentCategory()
        const tag = store.getCurrentTag()
        let list = cat === 'tags' && tag
            ? posts.filter(p => (p.tags || []).includes(tag))
            : posts.filter(p => cat === 'all' || p.category === cat)
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const idx = list.findIndex(p => p.url === url)
        if (e.key === 'j' && idx >= 0 && idx < list.length - 1) {
            e.preventDefault()
            window.location.hash = list[idx + 1].url
        }
        if (e.key === 'k' && idx > 0) {
            e.preventDefault()
            window.location.hash = list[idx - 1].url
        }
    })
}
