import { $id } from '../utils/dom'

let selectedUrl: string | null = null
let onEditCb: ((url: string) => void) | null = null
let onDeleteCb: ((url: string) => void) | null = null

const menu = document.getElementById('contextMenu')!

export function init(opts: { onEdit: (url: string) => void; onDelete: (url: string) => void }) {
    onEditCb = opts.onEdit
    onDeleteCb = opts.onDelete

    $id('menuEdit').addEventListener('click', () => {
        if (selectedUrl && onEditCb) onEditCb(selectedUrl)
        hide()
    })
    $id('menuDelete').addEventListener('click', () => {
        if (selectedUrl && onDeleteCb) onDeleteCb(selectedUrl)
        hide()
    })

    window.addEventListener('scroll', hide, true)
    window.addEventListener('click', hide)
    window.addEventListener('contextmenu', (e) => {
        if (!(e.target as HTMLElement).closest('.post-card')) hide()
    })
}

export function show(e: MouseEvent, url: string) {
    e.preventDefault()
    selectedUrl = url
    menu.style.display = 'block'
    menu.style.left = `${e.clientX}px`
    menu.style.top = `${e.clientY}px`
}

export function hide() {
    menu.style.display = 'none'
}
