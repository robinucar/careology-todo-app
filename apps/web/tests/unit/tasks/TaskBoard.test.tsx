import type { MockLink } from '@apollo/client/testing'
import { MockedProvider } from '@apollo/client/testing/react'
import type { Task } from '@careology/shared'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import type { DocumentNode } from 'graphql'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TaskBoard } from '../../../src/features/tasks'
import {
  CREATE_TASK_MUTATION,
  TASKS_QUERY,
  UPDATE_TASK_MUTATION,
} from '../../../src/features/tasks/taskOperations'
import {
  createFutureDateInput,
  createFutureDateIso,
} from '../../fixtures/dates'
import { authSession, createTaskRecord } from '../../fixtures/tasks'
import { renderWithTheme } from '../../helpers/render'

const pendingDueDateInput = createFutureDateInput(61)
const pendingDueDateIso = createFutureDateIso(61)
const createdDueDateInput = createFutureDateInput(62)
const createdDueDateIso = createFutureDateIso(62)
const updatedDueDateInput = createFutureDateInput(64)
const updatedDueDateIso = createFutureDateIso(64)

const pendingTask = createTaskRecord({
  id: 'task-pending',
  title: 'Still pending',
  dueDate: pendingDueDateIso,
  tags: ['low'],
  order: 1,
})

const laterPendingTask = createTaskRecord({
  id: 'task-later-pending',
  title: 'Later pending',
  order: 2,
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

const taskMutationMock = (
  query: DocumentNode,
  variables: Record<string, unknown>,
  field: string,
  task: Task,
): MockLink.MockedResponse => {
  return {
    request: {
      query,
      variables,
    },
    result: {
      data: {
        [field]: task,
      },
    },
  }
}

const createMatchMedia = (matches: boolean) => {
  return (query: string): MediaQueryList => {
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }
  }
}

const renderTaskBoard = (
  mocks: ReadonlyArray<MockLink.MockedResponse>,
  props: Partial<ComponentProps<typeof TaskBoard>> = {},
) => {
  const onLogout = vi.fn()

  const renderResult = renderWithTheme(
    <MockedProvider mocks={mocks} showWarnings={false}>
      <TaskBoard onLogout={onLogout} session={authSession} {...props} />
    </MockedProvider>,
  )

  return {
    ...renderResult,
    onLogout,
    user: userEvent.setup(),
  }
}

const fillTaskForm = async (
  user: ReturnType<typeof userEvent.setup>,
  values: {
    dueDate: string
    note: string
    tag: string
    title: string
  },
) => {
  fireEvent.change(screen.getByLabelText('Task name'), {
    target: { value: values.title },
  })
  await user.selectOptions(screen.getByLabelText('Priority tag'), values.tag)
  fireEvent.change(screen.getByLabelText('Due date'), {
    target: { value: values.dueDate },
  })
  fireEvent.change(screen.getByLabelText('Note'), {
    target: { value: values.note },
  })
}

describe('TaskBoard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

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

  it('renders mobile task layout and mobile menu actions', async () => {
    vi.stubGlobal('matchMedia', createMatchMedia(true))
    const { onLogout, user } = renderTaskBoard(
      [tasksQueryMock([pendingTask, laterPendingTask])],
      { isMobileMenuOpen: true },
    )

    expect(await screen.findAllByText('Still pending')).not.toHaveLength(0)
    const todoList = screen.getByRole('list', { name: 'Tasks to do' })
    const mobileMenu = screen.getByRole('navigation', {
      name: 'Mobile task actions',
    })

    expect(
      screen.queryByRole('table', { name: 'Tasks to do' }),
    ).not.toBeInTheDocument()
    expect(
      within(todoList).getByRole('button', {
        name: 'Reorder task: Still pending',
      }),
    ).toBeEnabled()
    expect(within(mobileMenu).getByLabelText('Search tasks')).toBeInTheDocument()
    await user.click(within(mobileMenu).getByRole('button', { name: 'Logout' }))

    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('creates a task from the add task form and refetches the list', async () => {
    const createdTask = createTaskRecord({
      id: 'task-created',
      title: 'Write a task here',
      completed: false,
      description: 'Remember details',
      dueDate: createdDueDateIso,
      tags: ['high'],
      order: 2,
    })
    const input = {
      description: 'Remember details',
      dueDate: createdDueDateInput,
      tags: ['high'],
      title: 'Write a task here',
    }
    const { user } = renderTaskBoard([
      tasksQueryMock([pendingTask]),
      taskMutationMock(CREATE_TASK_MUTATION, { input }, 'createTask', createdTask),
      tasksQueryMock([pendingTask, createdTask]),
    ])

    await screen.findAllByText('Still pending')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await fillTaskForm(user, {
      dueDate: createdDueDateInput,
      note: 'Remember details',
      tag: 'high',
      title: 'Write a task here',
    })
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Task added.')).toBeInTheDocument()
    expect(await screen.findAllByText('Write a task here')).not.toHaveLength(0)
    expect(await screen.findAllByText('High')).not.toHaveLength(0)
  })

  it('updates an existing task from the edit form and refetches the list', async () => {
    const updatedTask = createTaskRecord({
      ...pendingTask,
      title: 'Updated task title',
      description: 'Updated note',
      dueDate: updatedDueDateIso,
      tags: ['urgent'],
    })
    const input = {
      description: 'Updated note',
      dueDate: updatedDueDateInput,
      tags: ['urgent'],
      title: 'Updated task title',
    }
    const { user } = renderTaskBoard([
      tasksQueryMock([pendingTask]),
      taskMutationMock(
        UPDATE_TASK_MUTATION,
        { id: pendingTask.id, input },
        'updateTask',
        updatedTask,
      ),
      tasksQueryMock([updatedTask]),
    ])

    await screen.findAllByText('Still pending')
    const todoTable = screen.getByRole('table', { name: 'Tasks to do' })

    await user.click(
      within(todoTable).getByRole('button', { name: 'Edit task: Still pending' }),
    )

    expect(screen.getByLabelText('Task name')).toHaveValue('Still pending')
    expect(screen.getByLabelText('Due date')).toHaveValue(pendingDueDateInput)

    await fillTaskForm(user, {
      dueDate: updatedDueDateInput,
      note: 'Updated note',
      tag: 'urgent',
      title: 'Updated task title',
    })
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Task updated.')).toBeInTheDocument()
    expect(await screen.findAllByText('Updated task title')).not.toHaveLength(0)
    expect(await screen.findAllByText('Urgent')).not.toHaveLength(0)
  })

  it('uses the search term as a GraphQL task filter', async () => {
    renderTaskBoard([
      tasksQueryMock([pendingTask, doneTask]),
      tasksQueryMock([pendingTask, laterPendingTask], { search: 'pending' }),
    ])

    await screen.findAllByText('Already completed')
    fireEvent.change(screen.getByLabelText('Search tasks'), {
      target: {
        value: 'pending',
      },
    })

    expect(await screen.findAllByText('Later pending')).not.toHaveLength(0)
    expect(screen.queryByText('Already completed')).not.toBeInTheDocument()
    const todoTable = screen.getByRole('table', { name: 'Tasks to do' })

    expect(
      within(todoTable).getByRole('button', {
        name: 'Reorder task: Still pending',
      }),
    ).toBeDisabled()
  })

})
