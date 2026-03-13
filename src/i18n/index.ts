import { storageGet, storageSet, KEYS } from '../core/storage'
import * as zh from './zh'
import * as en from './en'

export type Locale = 'zh' | 'en'

const LOCALE_KEY = KEYS.LOCALE
const DEFAULT_LOCALE: Locale = 'zh'

const messages = { zh: zh.t, en: en.t } as const

export function getLocale(): Locale {
    const v = storageGet<string>(LOCALE_KEY, DEFAULT_LOCALE)
    return v === 'en' ? 'en' : 'zh'
}

export function setLocale(locale: Locale): void {
    storageSet(LOCALE_KEY, locale)
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    window.dispatchEvent(new CustomEvent('localechange', { detail: locale }))
}

function deepProxy(target: any): any {
    if (target != null && typeof target === 'object') {
        return new Proxy(target, {
            get(_, key) {
                return deepProxy((target as any)[key])
            },
        })
    }
    return target
}

export const t = new Proxy({} as typeof zh.t, {
    get(_, key) {
        return deepProxy((messages[getLocale()] as any)[key])
    },
})

export function applyToDom(): void {
    const txt = messages[getLocale()]
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n')
        if (!key) return
        const value = key.split('.').reduce((o: any, k) => o?.[k], txt as any)
        if (value == null) return
        const str = typeof value === 'function' ? (value as Function)() : String(value)
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            if (el.type === 'text' || el.type === 'search' || !el.type) el.placeholder = str
            else el.setAttribute('aria-label', str)
        } else {
            el.textContent = str
        }
    })
}
