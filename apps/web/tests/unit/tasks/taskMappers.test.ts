import type { Task } from '@careology/shared'
import { describe, expect, it } from 'vitest'

import {
  createTaskFilters,
  createTaskSections,
  mapTaskToListItem,
} from '../../../src/features/tasks/taskMappers'

const createTask = (overrides: Partial<Task> & Pick<Task, 'id' | 'title'>): Task => {
  const { id, title, ...rest } = overrides

  return {
    id,
    title,
    description: null,
    completed: false,
    dueDate: null,
    tags: [],
    order: 1,
    weatherCity: null,
    weatherTemperature: null,
    weatherCondition: null,
    weatherIconUrl: null,
    weatherFetchedAt: null,
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:00.000Z',
    ...rest,
  }
}

describe('taskMappers', () => {
  it('splits tasks into todo and done sections sorted by order', () => {
    const sections = createTaskSections([
      createTask({
        id: 'done-later',
        title: 'Done later',
        completed: true,
        order: 4,
      }),
      createTask({
        id: 'todo-later',
        title: 'Todo later',
        completed: false,
        order: 3,
      }),
      createTask({
        id: 'done-first',
        title: 'Done first',
        completed: true,
        order: 1,
      }),
      createTask({
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
        createTask({
          id: 'task-1',
          title: 'Read a book',
          description: 'Bring notebook',
          dueDate: '2026-07-25T00:00:00.000Z',
          tags: ['high'],
          weatherTemperature: 30,
        }),
      ),
    ).toMatchObject({
      description: 'Bring notebook',
      dueDate: '2026-07-25T00:00:00.000Z',
      dueDateLabel: '25/07/26',
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
        createTask({
          id: 'task-2',
          title: 'Plan trip to Tokyo',
          weatherCity: 'Tokyo',
          weatherTemperature: 30,
        }),
      ).weatherLabel,
    ).toBe('Tokyo: ☼ 30 °C')

    expect(
      mapTaskToListItem(
        createTask({
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
        createTask({
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
