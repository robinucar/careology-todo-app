import type { Task } from '@careology/shared'

import type { AuthSession } from '../../src/app/authSession'

export const authSession: AuthSession = {
  token: 'test-token',
  user: {
    id: 'user-1',
    name: 'Task Master',
    email: 'task.master@example.com',
  },
}

export const createTaskRecord = (
  overrides: Partial<Task> & Pick<Task, 'id' | 'title'>,
): Task => {
  const { id, title, ...rest } = overrides

  const task = {
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
  } satisfies Task

  return {
    __typename: 'Task',
    ...task,
  } as Task
}
