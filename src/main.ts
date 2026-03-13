import './styles/main.css'
import type { Post } from './types'
import * as store from './core/store'
import { getDataSource } from './api/dataSource'
import { getStorageAdapter } from './core/storageAdapter'
import { $id } from './utils/dom'

import * as postList from './features/postList'
import * as reader from './features/reader'
import * as integratedEditor from './features/integratedEditor'
import * as drafts from './features/drafts'
import * as trash from './features/trash'
import * as contextMenu from './features/contextMenu'
import * as resizer from './features/resizer'
import * as mobile from './features/mobile'
import * as accessibility from './features/accessibility'

async function boot() {
    try {
        const adapter = getStorageAdapter()
        if (adapter.init) await adapter.init()

        const dataSource = getDataSource()
        const rawPosts: Post[] = await dataSource.getPosts()

        const trashUrls = adapter.getTrash().map(p => p.url)
        store.setPosts(rawPosts.filter(p => !trashUrls.includes(p.url)))

        $id('totalPosts').innerText = String(store.getPosts().length)

        postList.buildIndex()
        postList.render()
        reader.handleHashChange()

        trash.updateCount()
        drafts.updateCount()
    } catch (err) {
        console.error('Failed to load posts:', err)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    postList.init({
        onContextMenu: (e, url) => contextMenu.show(e, url),
    })

    contextMenu.init({
        onEdit: (url) => integratedEditor.enterEditMode(url),
        onDelete: (url) => {
            trash.moveToTrash(url)
            if (window.location.hash.slice(1) === url) reader.close()
            postList.render()
        },
    })

    reader.init()
    integratedEditor.init()
    drafts.init()
    trash.init()
    resizer.init()
    mobile.init()
    accessibility.init()

    boot()
})
