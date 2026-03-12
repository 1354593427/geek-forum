import { $id } from '../utils/dom'

let sidebarOpen = false

export function init() {
    const btnMenu = document.getElementById('btnMobileMenu')
    const backdrop = document.getElementById('sidebarBackdrop')
    const sidebar = document.getElementById('sidebarColumn')

    if (btnMenu) {
        btnMenu.addEventListener('click', () => toggleSidebar(true))
    }
    if (backdrop) {
        backdrop.addEventListener('click', () => toggleSidebar(false))
    }

    const btnMobileBack = document.getElementById('btnMobileBack')
    if (btnMobileBack) {
        btnMobileBack.addEventListener('click', closeMobileReader)
    }

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1)
        const reader = document.getElementById('readerColumn')
        if (reader) {
            reader.classList.toggle('mobile-reader-open', !!hash)
        }
    })

    document.querySelectorAll('#mobileTabBar [data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = (btn as HTMLElement).dataset.tab
            handleTab(tab!)
        })
    })
}

function toggleSidebar(open: boolean) {
    sidebarOpen = open
    const sidebar = document.getElementById('sidebarColumn')
    const backdrop = document.getElementById('sidebarBackdrop')
    sidebar?.classList.toggle('mobile-open', open)
    backdrop?.classList.toggle('hidden', !open)
    document.body.classList.toggle('overflow-hidden', open)
}

function closeMobileReader() {
    window.location.hash = ''
    const reader = document.getElementById('readerColumn')
    reader?.classList.remove('mobile-reader-open')
}

function handleTab(tab: string) {
    if (sidebarOpen) toggleSidebar(false)

    switch (tab) {
        case 'home':
            closeMobileReader()
            break
        case 'search':
            document.getElementById('postSearch')?.focus()
            break
        case 'menu':
            toggleSidebar(true)
            break
        case 'drafts':
            document.getElementById('btnDrafts')?.click()
            break
    }
}
