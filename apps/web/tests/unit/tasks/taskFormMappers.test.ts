import { describe, expect, it } from 'vitest'

import {
  emptyTaskFormValues,
  validateTaskFormValues,
} from '../../../src/features/tasks/taskFormMappers'
import { createFutureDateInput } from '../../fixtures/dates'

describe('taskFormMappers', () => {
  it('accepts valid due dates in task form input format', () => {
    const dueDateInput = createFutureDateInput(45)
    const result = validateTaskFormValues({
      ...emptyTaskFormValues,
      dueDate: dueDateInput,
      title: 'Book London tickets',
    })

    expect(result).toEqual({
      input: {
        description: null,
        dueDate: dueDateInput,
        tags: [],
        title: 'Book London tickets',
      },
      isValid: true,
    })
  })

  it('rejects impossible calendar dates even when the format is correct', () => {
    const result = validateTaskFormValues({
      ...emptyTaskFormValues,
      dueDate: '2026-02-30',
      title: 'Book London tickets',
    })

    expect(result).toMatchObject({
      errors: {
        dueDate: 'Due date must be a valid date.',
      },
      isValid: false,
    })
  })

  it('rejects due dates in the past', () => {
    const result = validateTaskFormValues({
      ...emptyTaskFormValues,
      dueDate: '2000-01-01',
      title: 'Book London tickets',
    })

    expect(result).toMatchObject({
      errors: {
        dueDate: 'Due date cannot be in the past.',
      },
      isValid: false,
    })
  })
})
