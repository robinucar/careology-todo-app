import type { Task } from '@careology/shared'

import { formatTaskTagLabel, getTaskTagTone, getTaskTagValue } from './taskTags'
import type { TaskListItem, TaskSections, TaskTagBadge } from './taskTypes'

const sortByOrder = (tasks: TaskListItem[]) => {
  return [...tasks].sort((firstTask, secondTask) => {
    return firstTask.order - secondTask.order
  })
}

export const splitTasksByCompletion = (
  tasks: TaskListItem[],
): TaskSections => {
  return {
    done: sortByOrder(tasks.filter((task) => task.completed)),
    todo: sortByOrder(tasks.filter((task) => !task.completed)),
  }
}

export const createTaskSections = (tasks: Task[]): TaskSections => {
  return splitTasksByCompletion(tasks.map(mapTaskToListItem))
}

export const createTaskFilters = (searchTerm: string) => {
  const trimmedSearchTerm = searchTerm.trim()

  return trimmedSearchTerm ? { search: trimmedSearchTerm } : null
}

export const mapTaskToListItem = (task: Task): TaskListItem => {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    description: task.description,
    dueDate: task.dueDate,
    dueDateLabel: formatDueDateLabel(task.dueDate),
    note: task.description || null,
    tag: createTaskTag(task.tags ?? []),
    tagValue: createTaskTagValue(task.tags ?? []),
    order: task.order,
    weatherLabel: createTaskWeatherLabel(task),
  }
}

const createTaskTag = (tags: string[]): TaskTagBadge | null => {
  const firstTag = tags[0]?.trim()

  if (!firstTag) {
    return null
  }

  return {
    label: formatTaskTagLabel(firstTag),
    tone: getTaskTagTone(firstTag),
  }
}

const createTaskTagValue = (tags: string[]) => {
  const firstTag = tags[0]?.trim()

  return firstTag ? getTaskTagValue(firstTag) : ''
}

const formatDueDateLabel = (dueDate: string | null): string | null => {
  if (!dueDate) {
    return null
  }

  const parsedDate = new Date(dueDate)

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
    year: '2-digit',
  }).format(parsedDate)
}

const createTaskWeatherLabel = (task: Task): string | null => {
  if (task.weatherTemperature === null) {
    return null
  }

  const temperatureLabel = `☼ ${Math.round(task.weatherTemperature)} °C`

  return temperatureLabel
}
