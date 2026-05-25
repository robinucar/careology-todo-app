import { expect, test } from '@playwright/test'

import { createTestUser, registerThroughUi } from './support/auth'

test('registers a new user and logs out', async ({ page }) => {
  await registerThroughUi(page, createTestUser('auth'))

  await expect(page.getByRole('heading', { name: 'My Tasks' })).toBeVisible()
  await page.getByRole('button', { name: 'Logout' }).click()

  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  await expect(page.getByText('You have been logged out.')).toBeVisible()
})

test('shows safe auth errors for invalid credentials', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Enter your email').fill('missing-user@example.com')
  await page.getByLabel('Enter your password').fill('password123')
  await page.getByRole('button', { name: 'Login' }).click()

  await expect(page.getByText('Invalid email or password.')).toBeVisible()
})
