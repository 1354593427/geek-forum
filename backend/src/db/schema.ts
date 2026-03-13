import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/** 文章索引（与 posts.json 结构对齐） */
export const posts = sqliteTable('posts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    url: text('url').notNull().unique(),
    category: text('category').notNull(),
    date: text('date').notNull(),
    excerpt: text('excerpt'),
    tags: text('tags').notNull(), // JSON 数组字符串
    author: text('author').notNull(),
    authorAvatar: text('author_avatar').notNull(),
    sidebarStyle: text('sidebar_style').notNull(),
    html: text('html'), // 阶段 2 存储 HTML 内容
})

/** 草稿 */
export const drafts = sqliteTable('drafts', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    category: text('category').notNull(),
    author: text('author').notNull(),
    tags: text('tags'),
    date: text('date'),
    content: text('content').notNull(),
    lastUpdated: integer('last_updated').notNull(),
    savedAt: integer('saved_at'),
    url: text('url'),
})

/** 回收站（存 Post 元数据，JSON 序列化） */
export const trash = sqliteTable('trash', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    url: text('url').notNull(),
    category: text('category').notNull(),
    date: text('date').notNull(),
    excerpt: text('excerpt'),
    tags: text('tags').notNull(),
    author: text('author').notNull(),
    authorAvatar: text('author_avatar').notNull(),
    sidebarStyle: text('sidebar_style').notNull(),
})

/** 管理员用户（阶段 3 认证） */
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt: text('created_at').notNull(),
})

/** 收藏（url 列表） */
export const favorites = sqliteTable('favorites', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    url: text('url').notNull().unique(),
})

/** 主题/分类（如具身智能VLA、机器人等） */
export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
})
