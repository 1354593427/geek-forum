import * as store from '../core/store'
import { getDataSource } from '../api/dataSource'
import { $id } from '../utils/dom'
import * as postList from './postList'
import * as drafts from './drafts'
import * as trash from './trash'

export function init() {
    window.addEventListener('hashchange', handleHashChange)

    $id('btnFullscreen').addEventListener('click', toggleFullscreen)
    $id('btnCloseReader').addEventListener('click', close)
}

export function handleHashChange() {
    const url = window.location.hash.slice(1)
    if (!url) { close(); return }

    const placeholder = $id('readerPlaceholder')
    const toolbar = $id('readerToolbar')
    const wrapper = $id('iframeWrapper')
    const draftsView = $id('draftsView')
    const trashView = $id('trashView')

    if (url === 'drafts') {
        placeholder.classList.add('hidden')
        wrapper.classList.add('hidden')
        trashView.classList.add('hidden')
        trashView.classList.remove('flex')
        toolbar.classList.remove('hidden')
        draftsView.classList.remove('hidden')
        draftsView.classList.add('flex')
        $id('readerBreadcrumb').innerText = '工作区 / 草稿箱'
        $id('readerTitleMini').innerText = 'Research Drafts'
        const fsBtn = $id('fullscreenIcon').closest('button')
        if (fsBtn) fsBtn.classList.add('hidden')
        drafts.renderView()
        postList.render()
        return
    }
    if (url === 'trash') {
        placeholder.classList.add('hidden')
        wrapper.classList.add('hidden')
        draftsView.classList.add('hidden')
        draftsView.classList.remove('flex')
        toolbar.classList.remove('hidden')
        trashView.classList.remove('hidden')
        trashView.classList.add('flex')
        $id('readerBreadcrumb').innerText = '工作区 / 回收站'
        $id('readerTitleMini').innerText = 'Recycle Bin'
        const fsBtn = $id('fullscreenIcon').closest('button')
        if (fsBtn) fsBtn.classList.add('hidden')
        trash.renderView()
        postList.render()
        return
    }

    const post = store.findPost(url)
    if (!post) return

    postList.render()
    draftsView.classList.add('hidden')
    draftsView.classList.remove('flex')
    trashView.classList.add('hidden')
    trashView.classList.remove('flex')
    const fsBtn = $id('fullscreenIcon').closest('button')
    if (fsBtn) fsBtn.classList.remove('hidden')
    const iframe = $id('postIframe') as HTMLIFrameElement
    const loading = $id('readerLoading')

    placeholder.classList.add('hidden')
    toolbar.classList.remove('hidden')
    wrapper.classList.remove('hidden')
    loading.classList.remove('hidden')

    wrapper.classList.add('no-transition')
    wrapper.style.opacity = '0'
    wrapper.style.transform = 'translateY(20px)'
    void wrapper.offsetWidth
    wrapper.classList.remove('no-transition')

    iframe.onload = () => {
        loading.classList.add('hidden')
        wrapper.style.opacity = '1'
        wrapper.style.transform = 'translateY(0)'
        patchIframeContent(iframe)
    }

    const ds = getDataSource()
    if (ds.getPostHtml) {
        ds.getPostHtml(url).then((html) => {
            if (html) {
                iframe.srcdoc = html
            } else {
                iframe.src = url
            }
        }).catch(() => { iframe.src = url })
    } else {
        iframe.src = url
    }
    wrapper.style.opacity = '0'
    wrapper.style.transform = 'translateY(20px)'

    $id('readerBreadcrumb').innerText = `Research / ${post.category.toUpperCase()}`
    $id('readerTitleMini').innerText = post.title
    const openExt = document.getElementById('openExtLink')
    if (openExt) openExt.onclick = () => window.open(url, '_blank')
}

export function close() {
    window.location.hash = ''
    $id('iframeWrapper').classList.add('hidden')
    $id('readerToolbar').classList.add('hidden')
    $id('readerPlaceholder').classList.remove('hidden')
    $id('readerLoading').classList.add('hidden')
    $id('draftsView').classList.add('hidden')
    $id('draftsView').classList.remove('flex')
    $id('trashView').classList.add('hidden')
    $id('trashView').classList.remove('flex')
    const fsBtn = $id('fullscreenIcon').closest('button')
    if (fsBtn) fsBtn.classList.remove('hidden')
    ;($id('postIframe') as HTMLIFrameElement).src = ''
    postList.render()
}

export function toggleFullscreen() {
    const isFull = document.body.classList.toggle('fullscreen-reader')
    const icon = $id('fullscreenIcon')
    icon.innerHTML = isFull
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 3L10 10M10 10L3 10M10 10L3 3M14 3L14 10M14 10L21 10M14 10L21 3M10 21L10 14M10 14L3 14M10 14L3 21M14 21L14 14M14 14L21 14M14 14L21 21"></path>'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>'
}

export function reloadOriginal(url: string) {
    const iframe = $id('postIframe') as HTMLIFrameElement
    const loading = $id('readerLoading')
    const wrapper = $id('iframeWrapper')

    if (iframe.hasAttribute('srcdoc')) iframe.removeAttribute('srcdoc')
    if (loading) loading.classList.add('hidden')

    iframe.src = 'about:blank'
    setTimeout(() => {
        iframe.onload = () => {
            if (loading) loading.classList.add('hidden')
            if (wrapper) { wrapper.style.opacity = '1'; wrapper.style.transform = 'translateY(0)' }
            patchIframeContent(iframe)
        }
        if (wrapper) { wrapper.style.opacity = '0'; wrapper.style.transform = 'translateY(20px)' }
        iframe.src = url
    }, 50)
}

function patchIframeContent(iframe: HTMLIFrameElement) {
    try {
        const doc = iframe.contentWindow!.document
        doc.querySelectorAll('a').forEach(a => a.setAttribute('target', '_blank'))
        doc.querySelectorAll('nav').forEach(n => (n as HTMLElement).style.display = 'none')
        doc.querySelectorAll('footer').forEach(f => (f as HTMLElement).style.display = 'none')
        const main = doc.querySelector('main') as HTMLElement | null
        if (main) { main.style.maxWidth = '1000px'; main.style.padding = '3rem 2rem' }
    } catch { /* cross-origin */ }
}
