import type { Post } from '../types'

type Listener = () => void

let posts: Post[] = []
let currentCategory = 'all'

const listeners: Record<string, Set<Listener>> = {}

function emit(event: string) {
    listeners[event]?.forEach(fn => fn())
}

export function on(event: string, fn: Listener): () => void {
    if (!listeners[event]) listeners[event] = new Set()
    listeners[event].add(fn)
    return () => { listeners[event]?.delete(fn) }
}

export function getPosts(): Post[] { return posts }

export function setPosts(value: Post[]) {
    posts = value
    emit('posts')
}

export function findPost(url: string): Post | undefined {
    return posts.find(p => p.url === url)
}

export function removePost(url: string): Post | undefined {
    const idx = posts.findIndex(p => p.url === url)
    if (idx === -1) return undefined
    const removed = posts.splice(idx, 1)[0]
    emit('posts')
    return removed
}

export function addPost(post: Post) {
    posts.push(post)
    emit('posts')
}

export function getCurrentCategory(): string { return currentCategory }

export function setCurrentCategory(cat: string) {
    currentCategory = cat
    emit('category')
}
