import { expect, test } from '@playwright/test'

import { createTestUser, registerThroughUi } from './support/auth'
import { futureDateInput, pastDateInput } from './support/dates'

test.beforeEach(async ({ page }) => {
  await registerThroughUi(page, createTestUser('tasks'))
  await expect(page.getByRole('heading', { name: 'My Tasks' })).toBeVisible()
})

test('creates, searches, edits, completes, and deletes a weather-aware task', async ({
  page,
}) => {
  const dueDate = futureDateInput(7)
  const initialTaskName = 'I need to travel to London'
  const updatedTaskName = 'I need to travel to Paris'

  await page.getByRole('button', { name: 'Add task' }).click()
  await page.getByLabel('Task name').fill(initialTaskName)
  await page.getByLabel('Priority tag').selectOption('high')
  await page.getByLabel('Due date').fill(dueDate)
  await page.getByLabel('Note').fill('Buy return ticket')
  await page.getByRole('button', { exact: true, name: 'Add' }).click()

  await expect(page.getByText('Task added.')).toBeVisible()
  await expect(page.getByText(initialTaskName)).toBeVisible()
  await expect(page.getByText('High')).toBeVisible()
  await expect(page.getByText('☼ 18 °C')).toBeVisible()

  const searchInput = page.locator('input[placeholder="Search"]:visible')
  await searchInput.fill('London')
  await expect(page.getByText(initialTaskName)).toBeVisible()
  await searchInput.clear()

  await page
    .getByRole('button', { name: `Edit task: ${initialTaskName}` })
    .click()
  await page.getByLabel('Task name').fill(updatedTaskName)
  await page.getByLabel('Priority tag').selectOption('medium')
  await page.getByLabel('Note').fill('Choose a window seat')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Task updated.')).toBeVisible()
  await expect(page.getByText(updatedTaskName)).toBeVisible()
  await expect(page.getByText('Medium')).toBeVisible()
  await expect(page.getByText('☼ 25 °C')).toBeVisible()

  await page
    .getByRole('checkbox', { name: `Mark as done: ${updatedTaskName}` })
    .click()
  await expect(page.getByRole('table', { name: 'Tasks done' })).toContainText(
    updatedTaskName,
  )

  await page
    .getByRole('button', { name: `Delete task: ${updatedTaskName}` })
    .click()
  await expect(page.getByText('Task deleted.')).toBeVisible()
  await expect(page.getByText(updatedTaskName)).toBeHidden()
})

test('prevents selecting past due dates', async ({ page }) => {
  await page.getByRole('button', { name: 'Add task' }).click()
  await page.getByLabel('Task name').fill('Plan a trip')
  const dueDateInput = page.getByLabel('Due date')
  await dueDateInput.fill(pastDateInput())

  const hasRangeUnderflow = await dueDateInput.evaluate(
    (input: HTMLInputElement) => input.validity.rangeUnderflow,
  )
  expect(hasRangeUnderflow).toBe(true)
  await page.getByRole('button', { exact: true, name: 'Add' }).click()
  await expect(page.getByText('Plan a trip')).toBeHidden()
})

test('persists drag-and-drop ordering', async ({ page }) => {
  for (const taskName of ['First priority', 'Second priority']) {
    await page.getByRole('button', { name: 'Add task' }).click()
    await page.getByLabel('Task name').fill(taskName)
    await page.getByRole('button', { exact: true, name: 'Add' }).click()
    await expect(page.getByText('Task added.')).toBeVisible()
  }

  const rows = page.getByRole('table', { name: 'Tasks to do' }).locator('tbody tr')
  await expect(rows.nth(0)).toContainText('First priority')
  await expect(rows.nth(1)).toContainText('Second priority')

  const firstHandle = page.getByRole('button', {
    name: 'Reorder task: First priority',
  })
  const secondHandle = page.getByRole('button', {
    name: 'Reorder task: Second priority',
  })
  const firstBox = await firstHandle.boundingBox()
  const secondBox = await secondHandle.boundingBox()

  if (!firstBox || !secondBox) {
    throw new Error('Drag handles should be visible before reordering.')
  }

  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    secondBox.x + secondBox.width / 2,
    secondBox.y + secondBox.height / 2,
    { steps: 8 },
  )
  await page.mouse.up()

  await expect(page.getByText('Task order updated.')).toBeVisible()
  await expect(rows.nth(0)).toContainText('Second priority')
  await expect(rows.nth(1)).toContainText('First priority')

  await page.reload()
  await expect(rows.nth(0)).toContainText('Second priority')
  await expect(rows.nth(1)).toContainText('First priority')
})
