import { storageGet, storageSet, KEYS } from '../core/storage'
import { $id, delegate } from '../utils/dom'
import { showNotification } from '../utils/notification'
import { draftItem } from '../templates/draftItem'

export function init() {
    $id('btnDrafts').addEventListener('click', openModal)
    $id('btnDraftsClose').addEventListener('click', closeModal)
    $id('btnDraftsCloseFooter').addEventListener('click', closeModal)
    $id('btnDraftsClear').addEventListener('click', clearAll)

    delegate($id('draftsList'), '[data-draft-delete]', 'click', (target) => {
        const idx = Number(target.dataset.draftDelete)
        deleteDraft(idx)
    })
}

export function openModal() {
    const drafts: any[] = storageGet(KEYS.DRAFTS, [])
    const modal = $id('draftsModal')
    const list = $id('draftsList')

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    if (drafts.length === 0) {
        list.innerHTML = '<div class="p-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">No saved drafts</div>'
        return
    }
    list.innerHTML = drafts.map((d, i) => draftItem(d, i)).join('')
    updateCount()
}

export function closeModal() {
    const modal = $id('draftsModal')
    modal.classList.add('hidden')
    modal.classList.remove('flex')
}

function deleteDraft(index: number) {
    const drafts: any[] = storageGet(KEYS.DRAFTS, [])
    drafts.splice(index, 1)
    storageSet(KEYS.DRAFTS, drafts)
    updateCount()
    openModal()
}

function clearAll() {
    const drafts: any[] = storageGet(KEYS.DRAFTS, [])
    if (drafts.length === 0) return
    if (confirm(`确定要清空所有 ${drafts.length} 个草稿吗？此操作不可撤销。`)) {
        storageSet(KEYS.DRAFTS, [])
        updateCount()
        closeModal()
        showNotification('All drafts cleared.')
    }
}

export function updateCount() {
    const drafts: any[] = storageGet(KEYS.DRAFTS, [])
    const el = document.getElementById('draftCountNav')
    if (el) el.innerText = String(drafts.length)
}
