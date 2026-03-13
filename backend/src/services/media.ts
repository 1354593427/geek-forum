import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { BadRequestError } from '../lib/errors.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(__dirname, '../..', '..')
const uploadsDir = path.join(projectRoot, 'public', 'uploads')
const THUMB_MAX = 400

export type MediaUploadResult = {
    url: string
    thumbUrl: string
    filename: string
}

export type MediaItem = {
    url: string
    thumbUrl: string
    name: string
    /** uploads=媒体上传, posts=文章目录 */
    source?: 'uploads' | 'posts'
}

function ensureUploadsDir() {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
    }
}

function safeFilename(original: string): string {
    const ext = path.extname(original) || '.jpg'
    const base = path.basename(original, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'image'
    return `${base}_${Date.now()}${ext.toLowerCase()}`
}

async function generateThumbnail(srcPath: string, destPath: string): Promise<void> {
    try {
        const sharp = await import('sharp')
        await sharp.default(srcPath)
            .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
            .toFile(destPath)
    } catch {
        /* no sharp or failed - skip thumbnail */
    }
}

export async function uploadImage(file: File): Promise<MediaUploadResult> {
    const ct = file.type ?? ''
    if (!ct.startsWith('image/')) {
        throw BadRequestError('Only image files allowed')
    }

    ensureUploadsDir()
    const filename = safeFilename(file.name || 'image.jpg')
    const destPath = path.join(uploadsDir, filename)
    const buf = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(destPath, buf)

    const thumbName = `thumb_${filename}`
    const thumbPath = path.join(uploadsDir, thumbName)
    await generateThumbnail(destPath, thumbPath)

    const url = `/uploads/${filename}`
    const thumbUrl = fs.existsSync(thumbPath) ? `/uploads/${thumbName}` : url

    return { url, thumbUrl, filename }
}

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i

function walkImages(dir: string, baseDir: string): MediaItem[] {
    const items: MediaItem[] = []
    if (!fs.existsSync(dir)) return items
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            items.push(...walkImages(full, baseDir))
        } else if (IMAGE_EXT.test(e.name) && !e.name.startsWith('thumb_')) {
            const rel = path.relative(baseDir, full)
            const webPath = '/' + rel.replace(/\\/g, '/')
            items.push({
                url: webPath,
                thumbUrl: webPath,
                name: e.name,
                source: 'posts',
            })
        }
    }
    return items
}

export function listMedia(): MediaItem[] {
    ensureUploadsDir()
    const items: MediaItem[] = []
    const seenUrls = new Set<string>()

    const uploadFiles = fs
        .readdirSync(uploadsDir)
        .filter((n) => IMAGE_EXT.test(n) && !n.startsWith('thumb_'))
        .sort((a, b) => {
            const sa = fs.statSync(path.join(uploadsDir, a)).mtimeMs
            const sb = fs.statSync(path.join(uploadsDir, b)).mtimeMs
            return sb - sa
        })
    for (const name of uploadFiles) {
        const thumbName = `thumb_${name}`
        const hasThumb = fs.existsSync(path.join(uploadsDir, thumbName))
        items.push({
            url: `/uploads/${name}`,
            thumbUrl: hasThumb ? `/uploads/${thumbName}` : `/uploads/${name}`,
            name,
            source: 'uploads',
        })
        seenUrls.add(`/uploads/${name}`)
    }

    const publicDir = path.join(projectRoot, 'public')
    const postsDirs = [
        path.join(projectRoot, 'public', 'posts'),
        path.join(projectRoot, 'posts'),
    ]
    for (const dir of postsDirs) {
        const postItems = walkImages(dir, dir.includes('public') ? publicDir : projectRoot)
        for (const it of postItems) {
            if (!seenUrls.has(it.url)) {
                seenUrls.add(it.url)
                items.push(it)
            }
        }
    }

    return items
}

export function deleteMedia(filename: string): void {
    const safe = path.basename(filename).replace(/\.\./g, '')
    if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(safe)) {
        throw BadRequestError('Invalid file type')
    }
    const mainPath = path.join(uploadsDir, safe)
    const thumbPath = path.join(uploadsDir, `thumb_${safe}`)
    if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath)
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath)
}
