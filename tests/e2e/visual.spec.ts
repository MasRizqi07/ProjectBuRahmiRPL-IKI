import { expect, test } from '@playwright/test'

test('landing page visual smoke', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('#main-content')).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('landing-full-page.png'),
    fullPage: true,
    animations: 'disabled',
  })
})

