import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as store from '../../src/core/store'
import type { Post } from '../../src/types'

const mockPost = (overrides: Partial<Post> = {}): Post => ({
    title: 'Test Post',
    url: 'posts/robot/test.html',
    category: 'robot',
    date: '2026-03-12',
    excerpt: 'Test excerpt',
    tags: ['test'],
    author: 'Tester',
    author_avatar: 'https://example.com/avatar.png',
    sidebar_style: '',
    ...overrides,
})

describe('store', () => {
    beforeEach(() => {
        store.setPosts([])
        store.setCurrentCategory('all')
    })

    describe('posts', () => {
        it('should start with empty posts', () => {
            expect(store.getPosts()).toEqual([])
        })

        it('should set and get posts', () => {
            const posts = [mockPost(), mockPost({ title: 'Second' })]
            store.setPosts(posts)
            expect(store.getPosts()).toHaveLength(2)
            expect(store.getPosts()[1].title).toBe('Second')
        })

        it('should find post by url', () => {
            store.setPosts([mockPost({ url: 'a.html' }), mockPost({ url: 'b.html' })])
            expect(store.findPost('b.html')?.title).toBe('Test Post')
            expect(store.findPost('nope.html')).toBeUndefined()
        })

        it('should add a post', () => {
            store.setPosts([mockPost()])
            store.addPost(mockPost({ title: 'New' }))
            expect(store.getPosts()).toHaveLength(2)
        })

        it('should remove a post and return it', () => {
            store.setPosts([mockPost({ url: 'a.html' }), mockPost({ url: 'b.html' })])
            const removed = store.removePost('a.html')
            expect(removed?.url).toBe('a.html')
            expect(store.getPosts()).toHaveLength(1)
        })

        it('should return undefined when removing non-existent post', () => {
            store.setPosts([mockPost()])
            expect(store.removePost('nope.html')).toBeUndefined()
        })
    })

    describe('category', () => {
        it('should default to all', () => {
            expect(store.getCurrentCategory()).toBe('all')
        })

        it('should set category', () => {
            store.setCurrentCategory('vla')
            expect(store.getCurrentCategory()).toBe('vla')
        })
    })

    describe('subscriptions', () => {
        it('should notify listeners on setPosts', () => {
            const fn = vi.fn()
            store.on('posts', fn)
            store.setPosts([mockPost()])
            expect(fn).toHaveBeenCalledOnce()
        })

        it('should notify listeners on addPost', () => {
            const fn = vi.fn()
            store.on('posts', fn)
            store.addPost(mockPost())
            expect(fn).toHaveBeenCalledOnce()
        })

        it('should notify listeners on removePost', () => {
            store.setPosts([mockPost({ url: 'x.html' })])
            const fn = vi.fn()
            store.on('posts', fn)
            store.removePost('x.html')
            expect(fn).toHaveBeenCalledOnce()
        })

        it('should notify listeners on category change', () => {
            const fn = vi.fn()
            store.on('category', fn)
            store.setCurrentCategory('algo')
            expect(fn).toHaveBeenCalledOnce()
        })

        it('should unsubscribe when calling returned function', () => {
            const fn = vi.fn()
            const unsub = store.on('posts', fn)
            unsub()
            store.setPosts([mockPost()])
            expect(fn).not.toHaveBeenCalled()
        })
    })
})
