import { test, expect } from '@playwright/test'

test.describe('首页：加载 → 搜索 → 阅读', () => {
  test('加载首页并显示研报列表', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#postList')).toBeVisible()
    await page.waitForSelector('#skeletonPosts', { state: 'hidden', timeout: 10000 }).catch(() => {})
    const list = page.locator('#postList')
    await expect(list).toBeVisible()
    const totalEl = page.locator('#totalPosts')
    await expect(totalEl).not.toHaveText('--', { timeout: 8000 })
  })

  test('搜索后列表更新', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#skeletonPosts', { state: 'hidden', timeout: 10000 }).catch(() => {})
    const search = page.locator('#postSearch')
    await search.fill('VLA')
    await page.waitForTimeout(400)
    const countEl = page.locator('#resultsCount')
    await expect(countEl).toBeVisible()
    const list = page.locator('#postList')
    await expect(list).toBeVisible()
  })

  test('点击一篇打开阅读器', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('#skeletonPosts', { state: 'hidden', timeout: 10000 }).catch(() => {})
    const firstCard = page.locator('#postList [data-post-url]').first()
    await firstCard.click({ timeout: 8000 })
    const reader = page.locator('#readerColumn')
    const iframe = page.locator('#postIframe')
    await expect(iframe).toBeVisible({ timeout: 6000 })
    await expect(reader).toBeVisible()
  })
})
