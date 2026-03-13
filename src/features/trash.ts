import type { Post } from '../types'
import * as store from '../core/store'
import { getStorageAdapter } from '../core/storageAdapter'
import { $id, delegate } from '../utils/dom'
import { showNotification } from '../utils/notification'
import { trashItem } from '../templates/trashItem'

export function init() {
    $id('btnTrash').addEventListener('click', () => { window.location.hash = '#trash' })
    $id('btnTrashEmpty').addEventListener('click', emptyAll)

    delegate($id('trashList'), '[data-trash-restore]', 'click', (target) => {
        const idx = Number(target.dataset.trashRestore)
        restore(idx)
    })
}

export function moveToTrash(url: string) {
    const post = store.removePost(url)
    if (!post) return

    const adapter = getStorageAdapter()
    const trash = adapter.getTrash()
    trash.push(post)
    adapter.setTrash(trash)

    $id('totalPosts').innerText = String(store.getPosts().length)
    updateCount()
    showNotification('Document moved to Recycle Bin')
}

export function renderView() {
    const data = getStorageAdapter().getTrash()
    const list = $id('trashList')

    if (data.length === 0) {
        list.innerHTML = '<div class="py-12 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">回收站为空</div>'
    } else {
        list.innerHTML = data.map((p, i) => trashItem(p, i)).join('')
    }
    updateCount()
}

function restore(index: number) {
    const adapter = getStorageAdapter()
    const data = adapter.getTrash()
    const post = data.splice(index, 1)[0]
    adapter.setTrash(data)

    store.addPost(post)
    $id('totalPosts').innerText = String(store.getPosts().length)
    updateCount()
    renderView()
    showNotification('已还原到列表')
}

function emptyAll() {
    const adapter = getStorageAdapter()
    const data = adapter.getTrash()
    if (data.length === 0) return
    if (confirm(`警告：清空回收站将永久删除 ${data.length} 个本地文件且不可撤销！确定执行？`)) {
        adapter.setTrash([])
        updateCount()
        renderView()
        showNotification('回收站已清空')
    }
}

export function updateCount() {
    const trash = getStorageAdapter().getTrash()
    $id('trashCount').innerText = String(trash.length)
}
