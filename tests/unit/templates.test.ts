import { describe, it, expect } from 'vitest'
import { postCard } from '../../src/templates/postCard'
import { draftItem } from '../../src/templates/draftItem'
import { trashItem } from '../../src/templates/trashItem'
import type { Post } from '../../src/types'

const mockPost: Post = {
    title: '测试文章标题',
    url: 'posts/vla/test.html',
    category: 'vla',
    date: '2026-03-12 10:00',
    excerpt: '这是一段测试摘要文字',
    tags: ['VLA', '测试'],
    author: 'TestAgent',
    author_avatar: 'https://example.com/av.png',
    sidebar_style: '',
}

describe('postCard', () => {
    it('should render post title', () => {
        const html = postCard(mockPost, false)
        expect(html).toContain('测试文章标题')
    })

    it('should render first tag', () => {
        const html = postCard(mockPost, false)
        expect(html).toContain('VLA')
    })

    it('should render date (date part only)', () => {
        const html = postCard(mockPost, false)
        expect(html).toContain('2026-03-12')
    })

    it('should render author name', () => {
        const html = postCard(mockPost, false)
        expect(html).toContain('TestAgent')
    })

    it('should include data-post-url attribute', () => {
        const html = postCard(mockPost, false)
        expect(html).toContain('data-post-url="posts/vla/test.html"')
    })

    it('should apply active class when isActive is true', () => {
        const html = postCard(mockPost, true)
        expect(html).toContain('post-card-active')
        expect(html).toContain('text-brand-600')
    })

    it('should not apply active class when isActive is false', () => {
        const html = postCard(mockPost, false)
        expect(html).not.toContain('post-card-active')
    })

    it('should render fallback when tags are empty', () => {
        const post = { ...mockPost, tags: [] }
        const html = postCard(post, false)
        expect(html).toContain('GENERAL')
    })

    it('should render fallback excerpt when empty', () => {
        const post = { ...mockPost, excerpt: '' }
        const html = postCard(post, false)
        expect(html).toContain('Fetching summary from neural net...')
    })
})

describe('draftItem', () => {
    it('should render draft title', () => {
        const html = draftItem({ title: '我的草稿', savedAt: Date.now() }, 0)
        expect(html).toContain('我的草稿')
    })

    it('should render fallback title for untitled draft', () => {
        const html = draftItem({ title: '' }, 0)
        expect(html).toContain('Untitled Draft')
    })

    it('should include delete button with correct index', () => {
        const html = draftItem({ title: 'Draft' }, 3)
        expect(html).toContain('data-draft-delete="3"')
    })
})

describe('trashItem', () => {
    it('should render post title and url', () => {
        const html = trashItem(mockPost, 0)
        expect(html).toContain('测试文章标题')
        expect(html).toContain('posts/vla/test.html')
    })

    it('should include restore button with correct index', () => {
        const html = trashItem(mockPost, 5)
        expect(html).toContain('data-trash-restore="5"')
    })
})
