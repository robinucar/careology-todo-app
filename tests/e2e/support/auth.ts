import type { Page } from '@playwright/test'

const e2eRunId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
let userCounter = 0

export type TestUser = {
  email: string
  name: string
  password: string
}

export const createTestUser = (label: string): TestUser => {
  userCounter += 1

  return {
    email: `e2e-${label}-${e2eRunId}-${userCounter}@example.com`,
    name: `E2E ${label}`,
    password: 'password123',
  }
}

export const registerThroughUi = async (page: Page, user: TestUser) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Register' }).click()
  await page.getByLabel('Enter your email').fill(user.email)
  await page.getByLabel('Enter your user name').fill(user.name)
  await page.getByLabel('Enter your password').fill(user.password)
  await page.getByLabel('Confirm your password').fill(user.password)
  await page.getByRole('button', { name: 'Register' }).click()
}
