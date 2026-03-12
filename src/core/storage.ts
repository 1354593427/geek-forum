export function storageGet<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : fallback
    } catch {
        return fallback
    }
}

export function storageSet(key: string, value: any): void {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
        console.warn('[Storage] Write failed:', e)
    }
}

export function storageRemove(key: string): void {
    try { localStorage.removeItem(key) } catch { /* noop */ }
}

export const KEYS = {
    TRASH: 'openclaw_trash',
    DRAFTS: 'openclaw_drafts',
    EDIT_ACTIVE: 'openclaw_edit_active',
} as const
