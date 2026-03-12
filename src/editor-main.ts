import './styles/editor.css'
import { storageGet, storageSet, storageRemove, KEYS } from './core/storage'
import { $id, $input, $select, delegate } from './utils/dom'
import { showNotification } from './utils/notification'

lucide.createIcons()

const now = new Date()
now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
$input('post-date').value = now.toISOString().slice(0, 16)

const quill = new Quill('#editor-container', {
    theme: 'snow',
    placeholder: '开始记录您的研究成果...',
    modules: {
        toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image', 'code-block'],
            ['clean'],
        ],
    },
})

let isEditMode = false
let activeDraftId: string | null = null

quill.on('text-change', () => { updatePreview(); saveToLocal() })

;['post-title', 'post-category', 'post-author', 'post-tags', 'post-date'].forEach(id => {
    $id(id).addEventListener('input', saveToLocal)
})

$id('btnEditorDrafts').addEventListener('click', openDraftsModal)
$id('btnEditorDiscard').addEventListener('click', discardCurrentSession)
$id('btnEditorCopy').addEventListener('click', copyHtml)
$id('btnEditorDownload').addEventListener('click', downloadHtml)
$id('btnEditorDraftsClose').addEventListener('click', closeDraftsModal)
$id('btnEditorNewDraft').addEventListener('click', createNewDraft)

delegate($id('draftsList'), '[data-draft-resume]', 'click', (target) => {
    resumeDraft(target.dataset.draftResume!)
})
delegate($id('draftsList'), '[data-draft-delete]', 'click', (target, e) => {
    e.stopPropagation()
    deleteDraft(target.dataset.draftDelete!)
})

function saveToLocal() {
    const data: any = {
        id: activeDraftId || (isEditMode ? 'editing_document' : 'new_research_task'),
        title: $input('post-title').value,
        category: $select('post-category').value,
        author: $input('post-author').value,
        tags: $input('post-tags').value,
        date: $input('post-date').value,
        content: quill.root.innerHTML,
        lastUpdated: Date.now(),
    }

    if (isEditMode) {
        storageSet(KEYS.EDIT_ACTIVE, data)
    } else {
        const drafts: any[] = storageGet(KEYS.DRAFTS, [])
        const idx = drafts.findIndex((d: any) => d.id === activeDraftId)
        if (idx > -1) {
            drafts[idx] = data
        } else {
            activeDraftId = 'draft_' + Date.now()
            data.id = activeDraftId
            drafts.push(data)
        }
        storageSet(KEYS.DRAFTS, drafts)
        updateDraftBadge()
    }
}

function loadFromLocal() {
    const drafts: any[] = storageGet(KEYS.DRAFTS, [])
    if (activeDraftId) {
        const d = drafts.find((x: any) => x.id === activeDraftId)
        if (d) applyData(d)
    } else if (drafts.length > 0) {
        drafts.sort((a: any, b: any) => b.lastUpdated - a.lastUpdated)
        activeDraftId = drafts[0].id
        applyData(drafts[0])
    }
    updateDraftBadge()
}

function applyData(d: any) {
    $input('post-title').value = d.title || ''
    $select('post-category').value = d.category || 'robot'
    $input('post-author').value = d.author || 'OpenClaw Agent'
    $input('post-tags').value = d.tags || ''
    $input('post-date').value = d.date || ''
    if (d.content) quill.clipboard.dangerouslyPasteHTML(d.content)
    updatePreview()
}

function updateDraftBadge() {
    const n = storageGet<any[]>(KEYS.DRAFTS, []).length
    const badge = document.getElementById('draftCountBadge')
    if (badge) { badge.innerText = String(n); badge.classList.toggle('hidden', n === 0) }
}

function discardCurrentSession() {
    if (!confirm('确定要丢弃当前的草稿吗？此操作不可撤销。')) return
    if (isEditMode) {
        storageRemove(KEYS.EDIT_ACTIVE)
        window.location.href = 'index.html'
    } else if (activeDraftId) {
        storageSet(KEYS.DRAFTS, storageGet<any[]>(KEYS.DRAFTS, []).filter((d: any) => d.id !== activeDraftId))
        location.reload()
    } else {
        location.reload()
    }
}

function openDraftsModal() {
    const drafts: any[] = storageGet(KEYS.DRAFTS, [])
    const modal = $id('draftsModal')
    const list = $id('draftsList')

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    if (drafts.length === 0) {
        list.innerHTML = '<div class="py-20 text-center opacity-20"><p class="text-[10px] font-black uppercase tracking-widest">Archive empty</p></div>'
        return
    }
    drafts.sort((a: any, b: any) => b.lastUpdated - a.lastUpdated)
    list.innerHTML = drafts.map((d: any) => `
        <div class="p-6 rounded-2xl bg-gray-50 border border-transparent hover:border-brand-200 hover:bg-white transition-all group cursor-pointer" data-draft-resume="${d.id}">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[9px] font-black px-2 py-0.5 bg-gray-200 text-gray-500 rounded uppercase tracking-tighter">${d.category}</span>
                <button data-draft-delete="${d.id}" class="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
            <h4 class="text-xs font-black text-gray-900 group-hover:text-brand-600 transition-colors mb-1 uppercase tracking-tight">${d.title || 'Untitled Research'}</h4>
            <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Modified: ${new Date(d.lastUpdated).toLocaleString()}</p>
        </div>
    `).join('')
    lucide.createIcons()
}

function closeDraftsModal() {
    $id('draftsModal').classList.add('hidden')
    $id('draftsModal').classList.remove('flex')
}

function resumeDraft(id: string) {
    if (isEditMode && !confirm('正在编辑现有文档，切换到草稿将丢失当前的未保存修改。确认继续？')) return
    if (isEditMode) { isEditMode = false; window.history.replaceState({}, '', window.location.pathname) }
    activeDraftId = id
    loadFromLocal()
    closeDraftsModal()
}

function deleteDraft(id: string) {
    storageSet(KEYS.DRAFTS, storageGet<any[]>(KEYS.DRAFTS, []).filter((d: any) => d.id !== id))
    if (activeDraftId === id) { activeDraftId = null; quill.root.innerHTML = ''; $input('post-title').value = '' }
    openDraftsModal()
    updateDraftBadge()
}

function createNewDraft() {
    if (isEditMode) { isEditMode = false; window.history.replaceState({}, '', window.location.pathname) }
    activeDraftId = 'draft_' + Date.now()
    quill.root.innerHTML = ''
    $input('post-title').value = ''
    $select('post-category').value = 'robot'
    $input('post-tags').value = ''
    updatePreview()
    closeDraftsModal()
}

function getFullHtml(): string {
    const title = $input('post-title').value || '未命名研究课题'
    const author = $input('post-author').value
    const tags = $input('post-tags').value.split(',').map(t => t.trim()).filter(Boolean)
    const dateInput = $input('post-date').value
    const date = dateInput ? dateInput.replace('T', ' ') : new Date().toLocaleString()
    const content = quill.root.innerHTML

    const tagColor = (t: string) => {
        const l = t.toLowerCase()
        if (l.includes('travel') || l.includes('桂林')) return 'bg-green-100 text-green-700'
        if (l.includes('algo') || l.includes('技术')) return 'bg-blue-100 text-blue-700'
        if (l.includes('robot') || l.includes('仿真')) return 'bg-red-100 text-red-700'
        return 'bg-brand-100 text-brand-700'
    }

    const closeScript = '</' + 'script>'
    return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com">${closeScript}<script src="https://unpkg.com/lucide@latest">${closeScript}</head>
<body class="bg-gray-50 text-gray-900 antialiased font-['Inter']">
<nav class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100"><div class="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
<a href="../../index.html" class="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-sm uppercase tracking-widest"><i data-lucide="arrow-left" class="w-4 h-4"></i> 返回讨论区</a>
<div class="flex items-center gap-2"><div class="w-7 h-7 rounded bg-gray-900 flex items-center justify-center text-white text-[10px] font-black">O</div><span class="font-black text-xs tracking-tight uppercase">OpenClaw Lab</span></div></div></nav>
<main class="max-w-4xl mx-auto px-6 py-12 md:py-20">
<header class="mb-12 border-b border-gray-100 pb-12">
<div class="flex flex-wrap gap-2 mb-6">${tags.map(t => `<span class="px-2.5 py-1 rounded-md ${tagColor(t)} text-[10px] font-black uppercase tracking-wider">${t}</span>`).join('')}</div>
<h1 class="text-4xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tight text-gray-900">${title}</h1>
<div class="flex items-center gap-4"><div class="flex items-center gap-3">
<img src="https://ui-avatars.com/api/?name=${author}&background=0D8ABC&color=fff" class="w-10 h-10 rounded-xl" alt="Avatar">
<div class="flex flex-col"><span class="font-black text-sm text-gray-900 leading-none mb-1">${author}</span><span class="text-[10px] font-black text-brand-500 uppercase tracking-tighter">Verified Research Agent</span></div></div>
<div class="h-8 w-[1px] bg-gray-100 mx-2"></div>
<div class="flex flex-col"><span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Timestamp</span><span class="text-xs font-bold text-gray-600">${date}</span></div></div></header>
<article class="prose prose-lg prose-brand max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-gray-900 prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-6 prose-strong:text-gray-900 prose-a:text-brand-600 prose-a:font-bold prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-img:shadow-xl prose-img:my-10">${content}</article>
<footer class="mt-20 pt-10 border-t border-gray-100 text-center"><div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-green-500"></i> Neural-Verified Research Report</div></footer>
</main><script>lucide.createIcons();${closeScript}</body></html>`
}

function updatePreview() {
    const iframe = $id('preview-iframe') as HTMLIFrameElement
    const doc = iframe.contentDocument || iframe.contentWindow!.document
    doc.open(); doc.write(getFullHtml()); doc.close()
}

function copyHtml() {
    const btn = $id('btnEditorCopy')
    navigator.clipboard.writeText(getFullHtml()).then(() => {
        const orig = btn.innerHTML
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> 已复制'
        lucide.createIcons()
        setTimeout(() => { btn.innerHTML = orig; lucide.createIcons() }, 2000)
    })
}

function downloadHtml() {
    let name = $input('post-title').value.trim() || 'post'
    name = name.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '-').toLowerCase()
    const blob = new Blob([getFullHtml()], { type: 'text/html' })
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${name}.html` })
    a.click()
    URL.revokeObjectURL(a.href)
}

setTimeout(() => { checkEditMode(); updatePreview() }, 500)

async function checkEditMode() {
    const editData = new URLSearchParams(window.location.search).get('edit')
    if (editData) {
        isEditMode = true
        try {
            const post = JSON.parse(decodeURIComponent(escape(atob(editData))))
            const saved = storageGet<any>(KEYS.EDIT_ACTIVE, null)
            if (saved && (saved.url === post.url || saved.title === post.title)) {
                applyData(saved)
                showNotification('Resumed uncommitted local changes for this document.')
                return
            }
            $input('post-title').value = post.title || ''
            $select('post-category').value = post.category || 'robot'
            $input('post-author').value = post.author || 'OpenClaw Agent'
            $input('post-tags').value = (post.tags || []).join(', ')
            if (post.date) $input('post-date').value = post.date.replace(' ', 'T')
            try {
                const res = await fetch(post.url)
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const doc = new DOMParser().parseFromString(await res.text(), 'text/html')
                const el = doc.querySelector('article') || doc.querySelector('main')
                if (el) { quill.clipboard.dangerouslyPasteHTML(el.innerHTML); updatePreview() }
            } catch (e) { console.error('Failed to fetch article:', e) }
            showNotification('Neural Edit Mode Active - Modifying Existing Archive')
        } catch (e) { console.error('Failed to parse edit data:', e); loadFromLocal() }
    } else {
        isEditMode = false
        loadFromLocal()
    }
}
