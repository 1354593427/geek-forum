import type { Post } from '../types'
import * as store from '../core/store'
import { storageGet, storageSet, KEYS } from '../core/storage'
import { $id, delegate } from '../utils/dom'
import { showNotification } from '../utils/notification'
import { trashItem } from '../templates/trashItem'

export function init() {
    $id('btnTrash').addEventListener('click', openModal)
    $id('btnTrashClose').addEventListener('click', closeModal)
    $id('btnTrashCloseFooter').addEventListener('click', closeModal)
    $id('btnTrashEmpty').addEventListener('click', emptyAll)

    delegate($id('trashList'), '[data-trash-restore]', 'click', (target) => {
        const idx = Number(target.dataset.trashRestore)
        restore(idx)
    })
}

export function moveToTrash(url: string) {
    const post = store.removePost(url)
    if (!post) return

    const trash: Post[] = storageGet(KEYS.TRASH, [])
    trash.push(post)
    storageSet(KEYS.TRASH, trash)

    $id('totalPosts').innerText = String(store.getPosts().length)
    updateCount()
    showNotification('Document moved to Recycle Bin')
}

function openModal() {
    const trash: Post[] = storageGet(KEYS.TRASH, [])
    const modal = $id('trashModal')
    const list = $id('trashList')

    modal.classList.remove('hidden')
    modal.classList.add('flex')

    if (trash.length === 0) {
        list.innerHTML = '<div class="p-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">Trash is empty</div>'
        return
    }
    list.innerHTML = trash.map((p, i) => trashItem(p, i)).join('')
    updateCount()
}

function closeModal() {
    const modal = $id('trashModal')
    modal.classList.add('hidden')
    modal.classList.remove('flex')
}

function restore(index: number) {
    const trash: Post[] = storageGet(KEYS.TRASH, [])
    const post = trash.splice(index, 1)[0]
    storageSet(KEYS.TRASH, trash)

    store.addPost(post)
    $id('totalPosts').innerText = String(store.getPosts().length)
    updateCount()
    openModal()
    showNotification('Document restored to archive')
}

function emptyAll() {
    const trash: Post[] = storageGet(KEYS.TRASH, [])
    if (trash.length === 0) return
    if (confirm(`警告：清空回收站将永久删除 ${trash.length} 个本地文件且不可撤销！确定执行？`)) {
        storageSet(KEYS.TRASH, [])
        updateCount()
        closeModal()
        showNotification('Archive Purged: Local files synchronization pending.')
    }
}

export function updateCount() {
    const trash: Post[] = storageGet(KEYS.TRASH, [])
    $id('trashCount').innerText = String(trash.length)
}
