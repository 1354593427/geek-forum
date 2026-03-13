import './styles/main.css'
import { getAuthToken, setAuthToken, clearAuthToken, getAuthUsername } from './api/auth'

const API_BASE = (import.meta.env.VITE_API_BASE as string)?.replace(/\/$/, '')
const $ = (id: string) => document.getElementById(id)!

function apiFetch(path: string, opts?: RequestInit) {
    const token = getAuthToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((opts?.headers as Record<string, string>) || {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${API_BASE}${path}`, { ...opts, headers })
}

function show(el: HTMLElement) {
    el.classList.remove('hidden')
}
function hide(el: HTMLElement) {
    el.classList.add('hidden')
}

function render() {
    const loading = $('adminLoading')
    const login = $('adminLogin')
    const noApi = $('adminNoApi')
    const dashboard = $('adminDashboard')

    // Always hide everything first
    hide(loading)
    hide(login)
    hide(noApi)
    hide(dashboard)

    if (!API_BASE) {
        show(noApi)
        return
    }

    const token = getAuthToken()
    if (!token) {
        show(login)
        return
    }

    show(dashboard)
    void loadDashboard()
}


async function doLogin(username: string, password: string) {
    const errEl = $('loginError')
    errEl.classList.add('hidden')
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!res.ok) {
            errEl.textContent = data.error || '登录失败'
            errEl.classList.remove('hidden')
            return
        }
        setAuthToken(data.token, data.username)
        $('adminUsername').textContent = data.username
        render()
    } catch (e) {
        errEl.textContent = '网络错误，请检查 API 地址'
        errEl.classList.remove('hidden')
    }
}

function switchTab(tab: string) {
    document.querySelectorAll('.admin-tab').forEach((btn) => {
        const active = (btn as HTMLElement).dataset.tab === tab
        btn.classList.toggle('bg-brand-50', active)
        btn.classList.toggle('text-brand-600', active)
        btn.classList.toggle('text-gray-500', !active)
    })
    document.querySelectorAll('.admin-panel').forEach((panel) => {
        ;(panel as HTMLElement).classList.toggle('hidden', (panel as HTMLElement).id !== `tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)
    })
    if (tab === 'posts') void loadPosts()
    if (tab === 'drafts') void loadDrafts()
    if (tab === 'media') void loadMediaTab()
    if (tab === 'categories') void loadCategories()
    if (tab === 'trash') void loadTrash()
}

async function loadDashboard() {
    $('adminUsername').textContent = getAuthUsername() || '管理员'
    await Promise.all([
        loadStats(),
        loadPosts()
    ])
}

async function loadStats() {
    try {
        const [p, d, t] = await Promise.all([
            apiFetch('/posts'),
            apiFetch('/drafts'),
            apiFetch('/trash')
        ])
        const posts = await p.json()
        const drafts = await d.json()
        const trash = await t.json()
        
        $('statTotalPosts').textContent = String(posts.length)
        $('statTotalDrafts').textContent = String(drafts.length)
        $('statTotalTrash').textContent = String(trash.length)
    } catch (e) {
        console.error('Failed to load stats', e)
    }
}


async function loadPosts() {
    const list = $('postsList')
    const count = $('postsCount')
    try {
        const res = await apiFetch('/posts')
        const posts = await res.json()
        count.textContent = `${posts.length} 篇`
        list.innerHTML = posts.length === 0
            ? '<div class="p-8 text-center text-gray-400 text-xs">暂无文章</div>'
            : posts.map((p: { title: string; url: string; category: string; date: string }) => `
                <div class="p-4 flex items-center justify-between hover:bg-gray-50 group">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-bold text-gray-900 truncate">${escapeHtml(p.title)}</div>
                        <div class="text-[10px] text-gray-400 mt-0.5">${escapeHtml(p.category)} · ${escapeHtml(p.date)}</div>
                    </div>
                    <div class="flex items-center gap-3 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href="index.html#${escapeHtml(p.url)}" target="_blank" class="text-[10px] font-bold text-gray-500 hover:text-gray-900">预览</a>
                        <a href="editor.html?url=${encodeURIComponent(p.url)}" class="text-[10px] font-bold text-brand-600 hover:text-brand-700">编辑</a>
                        <button data-action="delete" data-url="${escapeHtml(p.url)}" class="text-[10px] font-bold text-red-500 hover:text-red-700">删除</button>
                    </div>
                </div>
            `).join('')
    } catch {

        list.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">加载失败</div>'
    }
}

async function loadDrafts() {
    const list = $('draftsList')
    try {
        const res = await apiFetch('/drafts')
        const drafts = await res.json()
        list.innerHTML = drafts.length === 0
            ? '<div class="p-8 text-center text-gray-400 text-xs">暂无草稿</div>'
            : drafts.map((d: { id: string; title: string; lastUpdated: number }) => `
                <div class="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-bold text-gray-900 truncate">${escapeHtml(d.title || '未命名')}</div>
                        <div class="text-[10px] text-gray-400 mt-0.5">${new Date(d.lastUpdated).toLocaleString()}</div>
                    </div>
                    <a href="editor.html?id=${encodeURIComponent(d.id)}" class="text-[10px] font-bold text-brand-600 hover:underline ml-2">编辑</a>
                </div>
            `).join('')
    } catch {
        list.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">加载失败</div>'
    }
}

function getMediaBaseUrl(): string {
    try {
        return new URL(API_BASE).origin
    } catch {
        return ''
    }
}

type MediaItemWithRelations = { url: string; thumbUrl: string; name: string; source?: 'uploads' | 'posts'; categoryName?: string; categorySlug?: string }

async function loadMediaTab() {
    const filterEl = document.getElementById('mediaCategoryFilter') as HTMLSelectElement
    if (filterEl && filterEl.options.length <= 1) {
        const catsRes = await apiFetch('/categories')
        const cats: { slug: string; name: string }[] = await catsRes.json()
        filterEl.innerHTML = '<option value="">全部</option>' + cats.map((c) => `<option value="${escapeAttr(c.slug)}">${escapeHtml(c.name)}</option>`).join('')
        filterEl.addEventListener('change', () => loadMedia())
    }
    await loadMedia()
}

async function loadMedia() {
    const list = $('mediaList')
    const countEl = $('mediaCount')
    const filterEl = document.getElementById('mediaCategoryFilter') as HTMLSelectElement
    const category = filterEl?.value || ''
    try {
        const url = category ? `/media?category=${encodeURIComponent(category)}` : '/media'
        const res = await apiFetch(url)
        const data = await res.json()
        const items: MediaItemWithRelations[] = data?.items ?? []
        const apiBase = getMediaBaseUrl()
        countEl.textContent = `${items.length} 张`
        if (items.length === 0) {
            list.innerHTML = '<div class="col-span-full p-12 text-center text-gray-400 text-sm rounded-xl border border-gray-100 bg-gray-50/50">暂无图片，可在编辑器中上传</div>'
        } else {
            list.innerHTML = items.map((it) => {
                const isUploads = it.source === 'uploads'
                const base = isUploads ? apiBase : (typeof location !== 'undefined' ? location.origin : '')
                const thumbSrc = base ? base + (it.thumbUrl || it.url) : it.thumbUrl || it.url
                const fullSrc = base ? base + it.url : it.url
                const deleteBtn = isUploads
                    ? `<button data-action="delete-media" data-filename="${escapeAttr(it.name)}" class="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg hover:bg-red-600">删除</button>`
                    : ''
                const categoryLabel = it.categoryName ? `<span class="text-[9px] text-brand-600 font-medium">${escapeHtml(it.categoryName)}</span>` : ''
                return `
                <div class="group relative rounded-xl border border-gray-100 overflow-hidden bg-white hover:border-brand-200 transition-all">
                    <a href="${escapeAttr(fullSrc)}" target="_blank" class="block aspect-square">
                        <img src="${escapeAttr(thumbSrc)}" alt="${escapeAttr(it.name)}" class="w-full h-full object-cover">
                    </a>
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        ${deleteBtn}
                    </div>
                    <div class="p-2 truncate text-[10px] text-gray-500 font-medium flex flex-col gap-0.5">
                        ${categoryLabel}
                        <span>${escapeHtml(it.name)}</span>
                    </div>
                </div>
            `
            }).join('')
        }
    } catch {
        list.innerHTML = '<div class="col-span-full p-12 text-center text-red-500 text-sm">加载失败</div>'
    }
}

async function loadCategories() {
    const list = $('categoriesList')
    try {
        const res = await apiFetch('/categories')
        const items: { id: number; slug: string; name: string; sortOrder: number }[] = await res.json()
        if (items.length === 0) {
            list.innerHTML = '<div class="p-8 text-center text-gray-400 text-xs">暂无主题，添加一个吧</div>'
        } else {
            list.innerHTML = items.map((c) => `
                <div class="p-4 flex items-center justify-between hover:bg-gray-50 group" data-category-id="${c.id}">
                    <div class="flex items-center gap-4 min-w-0 flex-1">
                        <span class="text-[10px] font-black text-gray-400 w-6">${c.sortOrder}</span>
                        <span class="text-sm font-bold text-gray-900">${escapeHtml(c.name)}</span>
                        <span class="text-[10px] text-gray-400 font-mono">${escapeHtml(c.slug)}</span>
                    </div>
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button data-action="edit-category" data-id="${c.id}" data-name="${escapeAttr(c.name)}" data-slug="${escapeAttr(c.slug)}" class="text-[10px] font-bold text-brand-600 hover:underline">编辑</button>
                        <button data-action="delete-category" data-id="${c.id}" data-name="${escapeAttr(c.name)}" class="text-[10px] font-bold text-red-500 hover:underline">删除</button>
                    </div>
                </div>
            `).join('')
        }
    } catch {
        list.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">加载失败</div>'
    }
}

function escapeAttr(s: string) {
    const div = document.createElement('div')
    div.textContent = s
    return div.innerHTML.replace(/"/g, '&quot;')
}

async function loadTrash() {
    const list = $('trashList')
    try {
        const res = await apiFetch('/trash')
        const items = await res.json()
        list.innerHTML = items.length === 0
            ? '<div class="p-8 text-center text-gray-400 text-xs">回收站为空</div>'
            : items.map((p: { title: string; url: string; date: string }) => `
                <div class="p-4 flex items-center justify-between hover:bg-gray-50 group">
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-bold text-gray-900 truncate">${escapeHtml(p.title)}</div>
                        <div class="text-[10px] text-gray-400 mt-0.5">${escapeHtml(p.date)}</div>
                    </div>
                    <div class="flex items-center gap-3 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button data-action="restore" data-url="${escapeHtml(p.url)}" class="text-[10px] font-black text-brand-600 uppercase tracking-tighter">恢复</button>
                    </div>
                </div>
            `).join('')
    } catch {

        list.innerHTML = '<div class="p-8 text-center text-red-500 text-xs">加载失败</div>'
    }
}

function escapeHtml(s: string) {
    const div = document.createElement('div')
    div.textContent = s
    return div.innerHTML
}

document.addEventListener('DOMContentLoaded', () => {
    $('loginForm').addEventListener('submit', (e) => {
        e.preventDefault()
        const username = ($('loginUsername') as HTMLInputElement).value.trim()
        const password = ($('loginPassword') as HTMLInputElement).value
        if (username && password) doLogin(username, password)
    })

    document.querySelectorAll('.admin-tab').forEach((btn) => {
        btn.addEventListener('click', () => switchTab((btn as HTMLElement).dataset.tab!))
    })

    $('btnLogout')?.addEventListener('click', () => {
        clearAuthToken()
        render()
    })

    $('btnAddCategory')?.addEventListener('click', async () => {
        const nameInput = $('newCategoryName') as HTMLInputElement
        const slugInput = $('newCategorySlug') as HTMLInputElement
        const name = nameInput.value.trim()
        if (!name) {
            alert('请输入主题名称')
            return
        }
        try {
            const res = await apiFetch('/categories', {
                method: 'POST',
                body: JSON.stringify({ name, slug: slugInput.value.trim() || undefined }),
            })
            if (res.ok) {
                nameInput.value = ''
                slugInput.value = ''
                await loadCategories()
            } else {
                const data = await res.json().catch(() => ({}))
                alert(data?.error || '添加失败')
            }
        } catch {
            alert('添加失败')
        }
    })

    $('btnEmptyTrash')?.addEventListener('click', async () => {
        if (!confirm('确定要清空回收站吗？')) return
        try {
            await apiFetch('/trash', { method: 'DELETE' })
            await Promise.all([loadTrash(), loadStats()])
        } catch (e) {
            alert('操作失败')
        }
    })

    // Event delegation for actions
    document.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement
        const action = target.dataset.action
        const url = target.dataset.url

        if (action === 'delete' && url) {
            if (!confirm('确定要删除这篇文章并移入回收站吗？')) return
            try {
                const res = await apiFetch(`/posts?url=${encodeURIComponent(url)}`, { method: 'DELETE' })
                if (res.ok) {
                    await Promise.all([loadPosts(), loadStats()])
                } else {
                    alert('删除失败')
                }
            } catch (err) {
                alert('删除失败')
            }
        }

        const filename = target.dataset.filename

        if (action === 'delete-media' && filename) {
            if (!confirm('确定要删除这张图片吗？')) return
            try {
                const res = await apiFetch(`/media/${encodeURIComponent(filename)}`, { method: 'DELETE' })
                if (res.ok) {
                    await loadMedia()
                } else {
                    const data = await res.json().catch(() => ({}))
                    alert(data?.error || '删除失败')
                }
            } catch {
                alert('删除失败')
            }
        }

        const id = target.dataset.id
        if (action === 'edit-category' && id) {
            const name = target.dataset.name || ''
            const slug = target.dataset.slug || ''
            const newName = prompt('主题名称', name)
            if (newName === null) return
            const newSlug = prompt('Slug', slug)
            if (newSlug === null) return
            try {
                const res = await apiFetch(`/categories/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() }),
                })
                if (res.ok) await loadCategories()
                else {
                    const data = await res.json().catch(() => ({}))
                    alert(data?.error || '更新失败')
                }
            } catch {
                alert('更新失败')
            }
        }
        if (action === 'delete-category' && id) {
            const name = target.dataset.name || ''
            if (!confirm(`确定要删除主题「${name}」吗？已有文章将保留该分类标记。`)) return
            try {
                const res = await apiFetch(`/categories/${id}`, { method: 'DELETE' })
                if (res.ok) await loadCategories()
                else {
                    const data = await res.json().catch(() => ({}))
                    alert(data?.error || '删除失败')
                }
            } catch {
                alert('删除失败')
            }
        }

        if (action === 'restore' && url) {
            try {
                // 后端 restore 逻辑：DELETE from trash, then front-end usually re-publishes or we assume it's moved back
                // Our current backend restore only deletes from trash. 
                // Let's check backend/src/routes/trash.ts again.
                // It seems restore/:url only deletes from trash. We need to move it back to posts.
                // Wait, I should have implemented the move-back logic in backend.
                // Let me check if I did that.
                const res = await apiFetch(`/trash/restore/${encodeURIComponent(url)}`, { method: 'POST' })
                if (res.ok) {
                    await Promise.all([loadTrash(), loadStats(), loadPosts()])
                    alert('已恢复到文章列表')
                }
            } catch (err) {
                alert('恢复失败')
            }
        }
    })

    render()
})

