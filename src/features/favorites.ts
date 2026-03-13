import { getStorageAdapter } from '../core/storageAdapter'

export function getFavorites(): string[] {
    return getStorageAdapter().getFavorites()
}

export function toggleFavorite(url: string): boolean {
    const adapter = getStorageAdapter()
    const cur = adapter.getFavorites()
    const idx = cur.indexOf(url)
    const next = idx >= 0 ? cur.filter((_, i) => i !== idx) : [...cur, url]
    adapter.setFavorites(next)
    return !cur.includes(url)
}

export function isFavorite(url: string): boolean {
    return getFavorites().includes(url)
}
