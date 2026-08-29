import { expect, test } from '@playwright/test'

const routes = [
  '/', '/concerts', '/promos', '/elite', '/elite/lounge', '/community', '/help',
  '/login', '/register', '/forgot-password', '/reset-password', '/partner',
  '/dashboard', '/my-tickets', '/notifications', '/profile', '/support/new',
  '/waiting-room', '/checkout/select', '/checkout/edge', '/payment', '/order-confirmation',
  '/organizer', '/organizer/events/new', '/organizer/reports', '/organizer/seating-analytics',
  '/organizer/wallet', '/scanner', '/admin', '/admin/disputes', '/admin/audit-logs',
  '/admin/security', '/legal/terms', '/legal/privacy', '/legal/refund', '/forbidden',
] as const

for (const route of routes) {
  test(`${route} renders without an unhandled browser error`, async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(response?.status(), `${route} HTTP status`).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
    expect(pageErrors).toEqual([])
  })
}

test('keyboard skip link reaches main content', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Lewati navigasi' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})
