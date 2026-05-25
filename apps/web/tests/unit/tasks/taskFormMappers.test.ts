import { describe, expect, it } from 'vitest'

import {
  emptyTaskFormValues,
  validateTaskFormValues,
} from '../../../src/features/tasks/taskFormMappers'

describe('taskFormMappers', () => {
  it('accepts valid due dates in task form input format', () => {
    const result = validateTaskFormValues({
      ...emptyTaskFormValues,
      dueDate: '2028-02-29',
      title: 'Book London tickets',
    })

    expect(result).toEqual({
      input: {
        description: null,
        dueDate: '2028-02-29',
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
})
