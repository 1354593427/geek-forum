import { getStorageAdapter } from '../core/storageAdapter'
import { $id, delegate } from '../utils/dom'
import { showNotification } from '../utils/notification'
import { draftItem } from '../templates/draftItem'

export function init() {
    $id('btnDrafts').addEventListener('click', () => { window.location.hash = '#drafts' })
    $id('btnDraftsClear').addEventListener('click', clearAll)

    delegate($id('draftsList'), '[data-draft-delete]', 'click', (target) => {
        const idx = Number(target.dataset.draftDelete)
        deleteDraft(idx)
    })
}

export function renderView() {
    const drafts = getStorageAdapter().getDrafts()
    const list = $id('draftsList')

    if (drafts.length === 0) {
        list.innerHTML = '<div class="py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">暂无草稿</div>'
    } else {
        list.innerHTML = drafts.map((d, i) => draftItem(d, i)).join('')
    }
    updateCount()
}

function deleteDraft(index: number) {
    const adapter = getStorageAdapter()
    const drafts = adapter.getDrafts()
    drafts.splice(index, 1)
    adapter.setDrafts(drafts)
    updateCount()
    renderView()
}

function clearAll() {
    const adapter = getStorageAdapter()
    const drafts = adapter.getDrafts()
    if (drafts.length === 0) return
    if (confirm(`确定要清空所有 ${drafts.length} 个草稿吗？此操作不可撤销。`)) {
        adapter.setDrafts([])
        updateCount()
        renderView()
        showNotification('草稿已清空')
    }
}

export function updateCount() {
    const drafts = getStorageAdapter().getDrafts()
    const el = document.getElementById('draftCountNav')
    if (el) el.innerText = String(drafts.length)
}
