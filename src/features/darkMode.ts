import { storageGet, storageSet } from '../core/storage'

type Theme = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'openclaw_theme'

export function init() {
    const saved = storageGet<Theme>(STORAGE_KEY, 'system')
    apply(saved)

    const btn = document.getElementById('btnDarkMode')
    if (btn) {
        btn.addEventListener('click', toggle)
        updateIcon(saved)
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getCurrent() === 'system') apply('system')
    })
}

function getCurrent(): Theme {
    return storageGet<Theme>(STORAGE_KEY, 'system')
}

function toggle() {
    const order: Theme[] = ['light', 'dark', 'system']
    const cur = getCurrent()
    const next = order[(order.indexOf(cur) + 1) % order.length]
    storageSet(STORAGE_KEY, next)
    apply(next)
    updateIcon(next)
}

function apply(theme: Theme) {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', isDark)
}

function updateIcon(theme: Theme) {
    const btn = document.getElementById('btnDarkMode')
    if (!btn) return
    const icons: Record<Theme, string> = {
        light: '☀️',
        dark: '🌙',
        system: '💻',
    }
    const labels: Record<Theme, string> = {
        light: '浅色模式',
        dark: '深色模式',
        system: '跟随系统',
    }
    btn.innerHTML = `<span class="text-sm">${icons[theme]}</span><span>${labels[theme]}</span>`
    btn.setAttribute('aria-label', labels[theme])
}
