export function init() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') handleEscape()
    })

    initFocusTraps()
}

function handleEscape() {
    const modals = ['draftsModal', 'trashModal']
    for (const id of modals) {
        const modal = document.getElementById(id)
        if (modal && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden')
            modal.classList.remove('flex')
            return
        }
    }

    if (document.body.classList.contains('edit-mode')) {
        document.getElementById('btnEditorClose')?.click()
        return
    }

    if (document.body.classList.contains('fullscreen-reader')) {
        document.getElementById('btnFullscreen')?.click()
        return
    }

    const sidebar = document.getElementById('sidebarColumn')
    if (sidebar?.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open')
        document.getElementById('sidebarBackdrop')?.classList.add('hidden')
        return
    }
}

function initFocusTraps() {
    const modals = document.querySelectorAll('[role="dialog"]')
    modals.forEach(modal => {
        modal.addEventListener('keydown', (e: Event) => {
            const ke = e as KeyboardEvent
            if (ke.key !== 'Tab') return

            const focusable = modal.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            if (focusable.length === 0) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (ke.shiftKey && document.activeElement === first) {
                ke.preventDefault()
                last.focus()
            } else if (!ke.shiftKey && document.activeElement === last) {
                ke.preventDefault()
                first.focus()
            }
        })
    })
}
