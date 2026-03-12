export function init() {
    const root = document.documentElement
    setupResizer('resizer1', '--sidebar-width', 180, 400)
    setupResizer('resizer2', '--explorer-width', 300, 800)

    function setupResizer(id: string, cssVar: string, min: number, max: number) {
        const el = document.getElementById(id)
        if (!el) return

        let startX: number, startWidth: number

        el.addEventListener('mousedown', (e) => {
            startX = e.clientX
            startWidth = parseInt(getComputedStyle(root).getPropertyValue(cssVar))
            el.classList.add('resizing')
            document.body.classList.add('resizing-active', 'select-none')
            document.body.style.cursor = 'col-resize'

            const onMove = (ev: MouseEvent) => {
                const w = Math.max(min, Math.min(max, startWidth + ev.clientX - startX))
                root.style.setProperty(cssVar, `${w}px`)
            }
            const onUp = () => {
                el.classList.remove('resizing')
                document.body.classList.remove('resizing-active', 'select-none')
                document.body.style.cursor = ''
                document.removeEventListener('mousemove', onMove)
                document.removeEventListener('mouseup', onUp)
            }
            document.addEventListener('mousemove', onMove)
            document.addEventListener('mouseup', onUp)
        })
    }
}
