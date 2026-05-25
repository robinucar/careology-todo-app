import {
  TASK_TAG_OPTIONS,
  TASK_TITLE_MAX_LENGTH,
  type CreateTaskInput,
} from '@careology/shared'

import type { TaskFormErrors, TaskFormValues, TaskListItem } from './taskTypes'

export const emptyTaskFormValues: TaskFormValues = {
  description: '',
  dueDate: '',
  tag: '',
  title: '',
}

export const getTodayDateInputValue = (): string => {
  const today = new Date()
  const timezoneOffsetMs = today.getTimezoneOffset() * 60_000

  return new Date(today.getTime() - timezoneOffsetMs).toISOString().slice(0, 10)
}

type TaskFormValidationResult =
  | {
      input: CreateTaskInput
      isValid: true
    }
  | {
      errors: TaskFormErrors
      isValid: false
    }

export const createTaskFormValues = (task: TaskListItem): TaskFormValues => {
  return {
    description: task.description ?? '',
    dueDate: toDateInputValue(task.dueDate),
    tag: task.tagValue,
    title: task.title,
  }
}

export const validateTaskFormValues = (
  values: TaskFormValues,
): TaskFormValidationResult => {
  const title = values.title.trim()
  const errors: TaskFormErrors = {}

  if (!title) {
    errors.title = 'Task title is required.'
  }

  if (title.length > TASK_TITLE_MAX_LENGTH) {
    errors.title = `Task title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`
  }

  if (values.dueDate && !isDateInputValue(values.dueDate)) {
    errors.dueDate = 'Due date must be a valid date.'
  }

  if (values.dueDate && isDateInputValue(values.dueDate)) {
    if (values.dueDate < getTodayDateInputValue()) {
      errors.dueDate = 'Due date cannot be in the past.'
    }
  }

  if (values.tag && !isKnownTaskTag(values.tag)) {
    errors.tag = 'Please choose a valid task tag.'
  }

  const message = Object.values(errors)[0]

  if (message) {
    return {
      errors,
      isValid: false,
    }
  }

  return {
    input: createTaskMutationInput(values, title),
    isValid: true,
  }
}

const toDateInputValue = (dueDate: string | null): string => {
  if (!dueDate) {
    return ''
  }

  if (isDateInputValue(dueDate)) {
    return dueDate
  }

  const date = new Date(dueDate)

  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

const createTaskMutationInput = (
  values: TaskFormValues,
  title: string,
): CreateTaskInput => {
  const description = values.description.trim()

  return {
    description: description ? description : null,
    dueDate: values.dueDate || null,
    tags: values.tag ? [values.tag] : [],
    title,
  }
}

const isDateInputValue = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const isKnownTaskTag = (tag: string): boolean => {
  return TASK_TAG_OPTIONS.some((option) => option.value === tag)
}
