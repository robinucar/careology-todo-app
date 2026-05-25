import type { MockLink } from '@apollo/client/testing'
import { MockedProvider } from '@apollo/client/testing/react'
import { TASK_TITLE_MAX_LENGTH, type Task } from '@careology/shared'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AuthSession } from '../../../src/app/authSession'
import { TaskBoard } from '../../../src/features/tasks'
import {
  CREATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  TASKS_QUERY,
  UPDATE_TASK_MUTATION,
} from '../../../src/features/tasks/taskOperations'
import { renderWithTheme } from '../../helpers/render'

const authSession: AuthSession = {
  token: 'test-token',
  user: {
    id: 'user-1',
    name: 'Task Master',
    email: 'task.master@example.com',
  },
}

const createTaskRecord = (
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

const pendingTask = createTaskRecord({
  id: 'task-pending',
  title: 'Still pending',
  completed: false,
  dueDate: '2026-07-25T00:00:00.000Z',
  tags: ['low'],
  order: 1,
})

const doneTask = createTaskRecord({
  id: 'task-done',
  title: 'Already completed',
  completed: true,
  tags: ['medium'],
  order: 2,
})

const tasksQueryMock = (
  tasks: Task[],
  filters: { search: string } | null = null,
): MockLink.MockedResponse => {
  return {
    request: {
      query: TASKS_QUERY,
      variables: {
        filters,
      },
    },
    result: {
      data: {
        tasks,
      },
    },
  }
}

const renderTaskBoard = (mocks: ReadonlyArray<MockLink.MockedResponse>) => {
  const onLogout = vi.fn()

  renderWithTheme(
    <MockedProvider mocks={mocks} showWarnings={false}>
      <TaskBoard onLogout={onLogout} session={authSession} />
    </MockedProvider>,
  )

  return {
    onLogout,
    user: userEvent.setup(),
  }
}

describe('TaskBoard', () => {
  it('renders tasks from the GraphQL query in todo and done sections', async () => {
    renderTaskBoard([tasksQueryMock([doneTask, pendingTask])])

    expect(await screen.findAllByText('Still pending')).not.toHaveLength(0)
    const todoTable = screen.getByRole('table', { name: 'Tasks to do' })
    const doneTable = screen.getByRole('table', { name: 'Tasks done' })

    expect(
      screen.getByRole('heading', { name: 'My Tasks' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add task' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search tasks')).toBeInTheDocument()
    expect(screen.getByText('Signed in as Task Master')).toBeInTheDocument()
    expect(within(todoTable).getByText('Still pending')).toBeInTheDocument()
    expect(within(doneTable).getByText('Already completed')).toBeInTheDocument()
  })

  it('creates a task from the add task form and refetches the list', async () => {
    const createdTask = createTaskRecord({
      id: 'task-created',
      title: 'Write a task here',
      completed: false,
      description: 'Remember details',
      dueDate: '2026-07-25T00:00:00.000Z',
      tags: ['high'],
      order: 2,
    })
    const { user } = renderTaskBoard([
      tasksQueryMock([pendingTask]),
      {
        request: {
          query: CREATE_TASK_MUTATION,
          variables: {
            input: {
              description: 'Remember details',
              dueDate: '2026-07-25',
              tags: ['high'],
              title: 'Write a task here',
            },
          },
        },
        result: {
          data: {
            createTask: createdTask,
          },
        },
      },
      tasksQueryMock([pendingTask, createdTask]),
    ])

    await screen.findAllByText('Still pending')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await user.type(screen.getByLabelText('Task name'), 'Write a task here')
    await user.selectOptions(screen.getByLabelText('Priority tag'), 'high')
    fireEvent.change(screen.getByLabelText('Due date'), {
      target: {
        value: '2026-07-25',
      },
    })
    await user.type(screen.getByLabelText('Note'), 'Remember details')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Task added.')).toBeInTheDocument()
    expect(await screen.findAllByText('Write a task here')).not.toHaveLength(0)
    expect(await screen.findAllByText('High')).not.toHaveLength(0)
  })

  it('shows note and weather details without dropping either value', async () => {
    const taskWithDetails = createTaskRecord({
      id: 'task-weather',
      title: 'Plan my August trip to Tokyo',
      description: 'Book flights',
      dueDate: '2026-07-25T00:00:00.000Z',
      weatherCity: 'Tokyo',
      weatherTemperature: 30,
    })

    renderTaskBoard([tasksQueryMock([taskWithDetails])])

    expect(await screen.findAllByText('Plan my August trip to Tokyo')).not.toHaveLength(0)
    expect(screen.getAllByText('25/07/26')).not.toHaveLength(0)
    expect(screen.getAllByText(/\(Book flights\)/)).not.toHaveLength(0)
    expect(screen.getAllByText(/\(Tokyo: ☼ 30 °C\)/)).not.toHaveLength(0)
  })

  it('validates task titles before sending a create mutation', async () => {
    const { user } = renderTaskBoard([tasksQueryMock([])])

    await screen.findByText('No tasks to do yet.')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Task title is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Task name')).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(screen.getByLabelText('Task name'), {
      target: {
        value: 'a'.repeat(TASK_TITLE_MAX_LENGTH + 1),
      },
    })
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(
      await screen.findByText(
        `Task title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`,
      ),
    ).toBeInTheDocument()
  })

  it('updates an existing task from the edit form and refetches the list', async () => {
    const updatedTask = createTaskRecord({
      ...pendingTask,
      title: 'Updated task title',
      description: 'Updated note',
      dueDate: '2026-08-01T00:00:00.000Z',
      tags: ['urgent'],
    })
    const { user } = renderTaskBoard([
      tasksQueryMock([pendingTask]),
      {
        request: {
          query: UPDATE_TASK_MUTATION,
          variables: {
            id: pendingTask.id,
            input: {
              description: 'Updated note',
              dueDate: '2026-08-01',
              tags: ['urgent'],
              title: 'Updated task title',
            },
          },
        },
        result: {
          data: {
            updateTask: updatedTask,
          },
        },
      },
      tasksQueryMock([updatedTask]),
    ])

    await screen.findAllByText('Still pending')
    const todoTable = screen.getByRole('table', { name: 'Tasks to do' })

    await user.click(
      within(todoTable).getByRole('button', { name: 'Edit task: Still pending' }),
    )

    expect(screen.getByLabelText('Task name')).toHaveValue('Still pending')
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-07-25')

    fireEvent.change(screen.getByLabelText('Task name'), {
      target: {
        value: 'Updated task title',
      },
    })
    fireEvent.change(screen.getByLabelText('Priority tag'), {
      target: {
        value: 'urgent',
      },
    })
    fireEvent.change(screen.getByLabelText('Due date'), {
      target: {
        value: '2026-08-01',
      },
    })
    fireEvent.change(screen.getByLabelText('Note'), {
      target: {
        value: 'Updated note',
      },
    })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Task updated.')).toBeInTheDocument()
    expect(await screen.findAllByText('Updated task title')).not.toHaveLength(0)
    expect(await screen.findAllByText('Urgent')).not.toHaveLength(0)
  })

  it('offers every Figma task tag option in the add task form', async () => {
    const { user } = renderTaskBoard([tasksQueryMock([])])

    await screen.findByText('No tasks to do yet.')
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Medium' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Not urgent' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Urgent' })).toBeInTheDocument()
  })

  it('toggles task completion and refetches the list', async () => {
    const completedTask = {
      ...pendingTask,
      completed: true,
    }
    const { user } = renderTaskBoard([
      tasksQueryMock([pendingTask]),
      {
        request: {
          query: UPDATE_TASK_MUTATION,
          variables: {
            id: pendingTask.id,
            input: {
              completed: true,
            },
          },
        },
        result: {
          data: {
            updateTask: completedTask,
          },
        },
      },
      tasksQueryMock([completedTask]),
    ])

    await screen.findAllByText('Still pending')
    const todoTable = screen.getByRole('table', { name: 'Tasks to do' })

    await user.click(
      within(todoTable).getByRole('checkbox', {
        name: 'Mark as done: Still pending',
      }),
    )

    await waitFor(() => {
      const doneTable = screen.getByRole('table', { name: 'Tasks done' })
      expect(within(doneTable).getByText('Still pending')).toBeInTheDocument()
    })
  })

  it('deletes a task and refetches the list', async () => {
    const { user } = renderTaskBoard([
      tasksQueryMock([pendingTask]),
      {
        request: {
          query: DELETE_TASK_MUTATION,
          variables: {
            id: pendingTask.id,
          },
        },
        result: {
          data: {
            deleteTask: pendingTask,
          },
        },
      },
      tasksQueryMock([]),
    ])

    await screen.findAllByText('Still pending')
    const todoTable = screen.getByRole('table', { name: 'Tasks to do' })

    await user.click(
      within(todoTable).getByRole('button', { name: 'Delete task: Still pending' }),
    )

    expect(await screen.findByText('Task deleted.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Still pending')).not.toBeInTheDocument()
    })
  })

  it('uses the search term as a GraphQL task filter', async () => {
    renderTaskBoard([
      tasksQueryMock([pendingTask, doneTask]),
      tasksQueryMock([pendingTask], { search: 'pending' }),
    ])

    await screen.findAllByText('Already completed')
    fireEvent.change(screen.getByLabelText('Search tasks'), {
      target: {
        value: 'pending',
      },
    })

    await waitFor(() => {
      expect(screen.queryByText('Already completed')).not.toBeInTheDocument()
    })
    expect(await screen.findAllByText('Still pending')).not.toHaveLength(0)
  })

  it('delegates logout from the desktop task toolbar', async () => {
    const { onLogout, user } = renderTaskBoard([tasksQueryMock([])])

    await screen.findByText('No tasks to do yet.')
    await user.click(screen.getByRole('button', { name: 'Logout' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})
