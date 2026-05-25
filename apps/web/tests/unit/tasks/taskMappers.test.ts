import { describe, expect, it } from 'vitest'

import {
  createTaskFilters,
  createTaskSections,
  mapTaskToListItem,
} from '../../../src/features/tasks/taskMappers'
import { createFutureDateIso, createFutureDateLabel } from '../../fixtures/dates'
import { createTaskRecord } from '../../fixtures/tasks'

describe('taskMappers', () => {
  const futureDueDateIso = createFutureDateIso(61)
  const futureDueDateLabel = createFutureDateLabel(61)

  it('splits tasks into todo and done sections sorted by order', () => {
    const sections = createTaskSections([
      createTaskRecord({
        id: 'done-later',
        title: 'Done later',
        completed: true,
        order: 4,
      }),
      createTaskRecord({
        id: 'todo-later',
        title: 'Todo later',
        completed: false,
        order: 3,
      }),
      createTaskRecord({
        id: 'done-first',
        title: 'Done first',
        completed: true,
        order: 1,
      }),
      createTaskRecord({
        id: 'todo-first',
        title: 'Todo first',
        completed: false,
        order: 2,
      }),
    ])

    expect(sections.todo.map((task) => task.id)).toEqual([
      'todo-first',
      'todo-later',
    ])
    expect(sections.done.map((task) => task.id)).toEqual([
      'done-first',
      'done-later',
    ])
  })

  it('maps task dates, descriptions, weather labels, and tags for the UI', () => {
    expect(
      mapTaskToListItem(
        createTaskRecord({
          id: 'task-1',
          title: 'Read a book',
          description: 'Bring notebook',
          dueDate: futureDueDateIso,
          tags: ['high'],
          weatherTemperature: 30,
        }),
      ),
    ).toMatchObject({
      description: 'Bring notebook',
      dueDate: futureDueDateIso,
      dueDateLabel: futureDueDateLabel,
      note: 'Bring notebook',
      tag: {
        label: 'High',
        tone: 'high',
      },
      tagValue: 'high',
      weatherLabel: '☼ 30 °C',
    })

    expect(
      mapTaskToListItem(
        createTaskRecord({
          id: 'task-2',
          title: 'Plan trip to Tokyo',
          weatherCity: 'Tokyo',
          weatherTemperature: 30,
        }),
      ).weatherLabel,
    ).toBe('☼ 30 °C')

    expect(
      mapTaskToListItem(
        createTaskRecord({
          id: 'task-3',
          title: 'Buy groceries',
          tags: ['urgent'],
        }),
      ).tag,
    ).toEqual({
      label: 'Urgent',
      tone: 'urgent',
    })

    expect(
      mapTaskToListItem(
        createTaskRecord({
          id: 'task-4',
          title: 'Prepare meals',
          tags: ['not urgent'],
        }),
      ),
    ).toMatchObject({
      tag: {
        label: 'Not urgent',
        tone: 'notUrgent',
      },
      tagValue: 'not-urgent',
    })
  })

  it('creates nullable task filters from search input', () => {
    expect(createTaskFilters('')).toBeNull()
    expect(createTaskFilters('   ')).toBeNull()
    expect(createTaskFilters(' Tokyo ')).toEqual({ search: 'Tokyo' })
  })
})
