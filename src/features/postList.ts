import Fuse from 'fuse.js'
import * as store from '../core/store'
import { $id, $input, $select, delegate } from '../utils/dom'
import { postCard } from '../templates/postCard'

let fuse: Fuse<any> | null = null
let contextMenuHandler: ((e: MouseEvent, url: string) => void) | null = null

export function init(opts: { onContextMenu: (e: MouseEvent, url: string) => void }) {
    contextMenuHandler = opts.onContextMenu

    $input('postSearch').addEventListener('input', render)
    $id('sortOrder').addEventListener('change', render)

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-nav') || 'all'
            filter(cat)
        })
    })

    const list = $id('postList')
    delegate(list, '[data-post-url]', 'click', (target) => {
        const url = target.dataset.postUrl
        if (url) window.location.hash = url
    })
    delegate(list, '[data-post-url]', 'contextmenu', (target, e) => {
        const url = target.dataset.postUrl
        if (url && contextMenuHandler) contextMenuHandler(e as MouseEvent, url)
    })

    store.on('posts', render)
    store.on('category', render)
}

export function buildIndex() {
    fuse = new Fuse(store.getPosts(), {
        keys: ['title', 'excerpt', 'tags'],
        threshold: 0.35,
        ignoreLocation: true,
        useExtendedSearch: true,
    })
}

export function filter(category: string) {
    store.setCurrentCategory(category)
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('sidebar-item-active', btn.getAttribute('data-nav') === category)
    })
}

export function render() {
    const container = $id('postList')
    const query = $input('postSearch').value.trim()
    const sort = $select('sortOrder').value
    const category = store.getCurrentCategory()
    const posts = store.getPosts()

    let list: any[]
    if (query && fuse) {
        list = fuse.search(query).map(r => r.item).filter(p => category === 'all' || p.category === category)
        $id('resultsCount').innerText = `${list.length} Matches Found`
    } else {
        list = posts.filter(p => category === 'all' || p.category === category)
        $id('resultsCount').innerText = `Syncing ${category.toUpperCase()} Registry`
    }

    list.sort((a, b) => {
        const da = new Date(a.date).getTime(), db = new Date(b.date).getTime()
        return sort === 'newest' ? db - da : da - db
    })

    if (list.length === 0) {
        container.innerHTML = '<div class="p-20 text-center opacity-20"><p class="text-[10px] font-black uppercase">End of stream</p></div>'
        return
    }

    const hash = window.location.hash.slice(1)
    container.innerHTML = list.map(p => postCard(p, hash === p.url)).join('')
}
