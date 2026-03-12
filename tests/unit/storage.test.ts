import { describe, it, expect, beforeEach } from 'vitest'
import { storageGet, storageSet, storageRemove, KEYS } from '../../src/core/storage'

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    describe('storageGet', () => {
        it('should return fallback when key does not exist', () => {
            expect(storageGet('missing', 42)).toBe(42)
        })

        it('should return parsed value when key exists', () => {
            localStorage.setItem('test', JSON.stringify({ a: 1 }))
            expect(storageGet('test', {})).toEqual({ a: 1 })
        })

        it('should return fallback on invalid JSON', () => {
            localStorage.setItem('bad', '{broken')
            expect(storageGet('bad', 'default')).toBe('default')
        })

        it('should handle arrays', () => {
            localStorage.setItem('arr', JSON.stringify([1, 2, 3]))
            expect(storageGet('arr', [])).toEqual([1, 2, 3])
        })
    })

    describe('storageSet', () => {
        it('should write JSON to localStorage', () => {
            storageSet('key', { hello: 'world' })
            expect(JSON.parse(localStorage.getItem('key')!)).toEqual({ hello: 'world' })
        })

        it('should overwrite existing value', () => {
            storageSet('key', 'old')
            storageSet('key', 'new')
            expect(storageGet('key', '')).toBe('new')
        })

        it('should not throw on storage error', () => {
            const orig = localStorage.setItem
            localStorage.setItem = () => { throw new DOMException('quota exceeded') }
            expect(() => storageSet('key', 'value')).not.toThrow()
            localStorage.setItem = orig
        })
    })

    describe('storageRemove', () => {
        it('should remove a key', () => {
            storageSet('key', 'value')
            storageRemove('key')
            expect(localStorage.getItem('key')).toBeNull()
        })

        it('should not throw on missing key', () => {
            expect(() => storageRemove('nope')).not.toThrow()
        })
    })

    describe('KEYS', () => {
        it('should have correct key constants', () => {
            expect(KEYS.TRASH).toBe('openclaw_trash')
            expect(KEYS.DRAFTS).toBe('openclaw_drafts')
            expect(KEYS.EDIT_ACTIVE).toBe('openclaw_edit_active')
        })
    })
})
