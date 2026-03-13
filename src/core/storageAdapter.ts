import type { Post, Draft } from '../types'
import { storageGet, storageSet, storageRemove } from './storage'
import { getAuthToken } from '../api/auth'

export const KEYS = {
    TRASH: 'openclaw_trash',
    DRAFTS: 'openclaw_drafts',
    FAVORITES: 'openclaw_favorites',
    EDIT_ACTIVE: 'openclaw_edit_active',
} as const

export interface StorageAdapter {
    getDrafts(): Draft[]
    setDrafts(drafts: Draft[]): void
    getTrash(): Post[]
    setTrash(items: Post[]): void
    getFavorites(): string[]
    setFavorites(urls: string[]): void
    getEditActive(): unknown
    setEditActive(data: unknown): void
    removeEditActive(): void
    /** 初始化（API 模式下需拉取远程数据） */
    init?(): Promise<void>
}

const localStorageAdapter: StorageAdapter = {
    getDrafts() {
        return storageGet<Draft[]>(KEYS.DRAFTS, [])
    },
    setDrafts(drafts) {
        storageSet(KEYS.DRAFTS, drafts)
    },
    getTrash() {
        return storageGet<Post[]>(KEYS.TRASH, [])
    },
    setTrash(items) {
        storageSet(KEYS.TRASH, items)
    },
    getFavorites() {
        return storageGet<string[]>(KEYS.FAVORITES, [])
    },
    setFavorites(urls) {
        storageSet(KEYS.FAVORITES, urls)
    },
    getEditActive() {
        return storageGet<unknown>(KEYS.EDIT_ACTIVE, null)
    },
    setEditActive(data) {
        storageSet(KEYS.EDIT_ACTIVE, data)
    },
    removeEditActive() {
        storageRemove(KEYS.EDIT_ACTIVE)
    },
}

function apiFetch(path: string, opts?: RequestInit) {
    const base = (import.meta.env.VITE_API_BASE as string)?.replace(/\/$/, '')
    const token = getAuthToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((opts?.headers as Record<string, string>) || {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return fetch(`${base}${path}`, { ...opts, headers })
}

function createApiAdapter(): StorageAdapter {
    let draftsCache: Draft[] = []
    let trashCache: Post[] = []
    let favoritesCache: string[] = []
    let inited = false

    return {
        async init() {
            if (inited) return
            const token = getAuthToken()
            if (!token) return
            try {
                const [dRes, tRes, fRes] = await Promise.all([
                    apiFetch('/drafts'),
                    apiFetch('/trash'),
                    apiFetch('/favorites'),
                ])
                if (dRes.ok) draftsCache = await dRes.json()
                if (tRes.ok) trashCache = await tRes.json()
                if (fRes.ok) favoritesCache = await fRes.json()
                inited = true
            } catch (e) {
                console.warn('[storageAdapter] API init failed:', e)
            }
        },
        getDrafts() {
            return draftsCache
        },
        setDrafts(drafts) {
            draftsCache = drafts
            void apiFetch('/drafts/sync', { method: 'POST', body: JSON.stringify({ drafts }) }).catch(() => {})
        },
        getTrash() {
            return trashCache
        },
        setTrash(items) {
            trashCache = items
            void apiFetch('/trash/sync', { method: 'POST', body: JSON.stringify({ trash: items }) }).catch(() => {})
        },
        getFavorites() {
            return favoritesCache
        },
        setFavorites(urls) {
            favoritesCache = urls
            void apiFetch('/favorites/sync', { method: 'POST', body: JSON.stringify({ favorites: urls }) }).catch(() => {})
        },
        getEditActive() {
            return storageGet<unknown>(KEYS.EDIT_ACTIVE, null)
        },
        setEditActive(data) {
            storageSet(KEYS.EDIT_ACTIVE, data)
        },
        removeEditActive() {
            storageRemove(KEYS.EDIT_ACTIVE)
        },
    }
}

let apiAdapterInstance: StorageAdapter | null = null

export function getStorageAdapter(): StorageAdapter {
    const base = import.meta.env.VITE_API_BASE as string | undefined
    const token = getAuthToken()
    if (base && token) {
        if (!apiAdapterInstance) apiAdapterInstance = createApiAdapter()
        return apiAdapterInstance
    }
    return localStorageAdapter
}
