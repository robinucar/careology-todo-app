import { describe, expect, it } from 'vitest'

import { createTaskSections } from '../../../src/features/tasks/taskMappers'
import { createReorderedTaskIds } from '../../../src/features/tasks/taskReorder'
import { createTaskRecord } from '../../fixtures/tasks'

const todoFirst = createTaskRecord({
  id: 'todo-1',
  title: 'First todo',
  order: 1,
})

const todoSecond = createTaskRecord({
  id: 'todo-2',
  title: 'Second todo',
  order: 2,
})

const doneFirst = createTaskRecord({
  id: 'done-1',
  title: 'First done',
  completed: true,
  order: 3,
})

const doneSecond = createTaskRecord({
  id: 'done-2',
  title: 'Second done',
  completed: true,
  order: 4,
})

const taskSections = createTaskSections([
  doneSecond,
  todoSecond,
  doneFirst,
  todoFirst,
])

describe('createReorderedTaskIds', () => {
  it('reorders todo tasks while preserving the full active task id list', () => {
    expect(
      createReorderedTaskIds(taskSections, 'todo', todoFirst.id, todoSecond.id),
    ).toEqual([todoSecond.id, todoFirst.id, doneFirst.id, doneSecond.id])
  })

  it('reorders done tasks after the todo section ids', () => {
    expect(
      createReorderedTaskIds(taskSections, 'done', doneSecond.id, doneFirst.id),
    ).toEqual([todoFirst.id, todoSecond.id, doneSecond.id, doneFirst.id])
  })

  it('ignores a reorder when the task is dropped on itself', () => {
    expect(
      createReorderedTaskIds(taskSections, 'todo', todoFirst.id, todoFirst.id),
    ).toBeNull()
  })

  it('ignores a reorder when either task is outside the target section', () => {
    expect(
      createReorderedTaskIds(taskSections, 'todo', todoFirst.id, doneFirst.id),
    ).toBeNull()
  })
})
