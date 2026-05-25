import { expect, test } from '@playwright/test'

import { createTestUser, registerThroughUi } from './support/auth'

test('shows search and logout only after opening the mobile menu', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 390 })
  await registerThroughUi(page, createTestUser('mobile'))
  const visibleLogoutButton = page.locator('button:has-text("Logout"):visible')
  const visibleSearchInput = page.locator('input[placeholder="Search"]:visible')

  await expect(page.getByRole('heading', { name: 'My Tasks' })).toBeVisible()
  await expect(visibleSearchInput).toHaveCount(0)
  await expect(visibleLogoutButton).toHaveCount(0)

  await page.getByRole('button', { name: 'Open task menu' }).click()

  await expect(visibleLogoutButton).toBeVisible()
  await expect(visibleSearchInput).toBeVisible()
})
