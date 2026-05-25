import { arrayMove } from '@dnd-kit/sortable'

import type { TaskSectionKey, TaskSections } from './taskTypes'

const taskSectionOrder: TaskSectionKey[] = ['todo', 'done']

export const createReorderedTaskIds = (
  sections: TaskSections,
  sectionKey: TaskSectionKey,
  activeTaskId: string,
  overTaskId: string,
): string[] | null => {
  if (activeTaskId === overTaskId) {
    return null
  }

  const sectionTasks = sections[sectionKey]
  const activeIndex = sectionTasks.findIndex((task) => task.id === activeTaskId)
  const overIndex = sectionTasks.findIndex((task) => task.id === overTaskId)

  if (activeIndex === -1 || overIndex === -1) {
    return null
  }

  const nextSections = {
    ...sections,
    [sectionKey]: arrayMove(sectionTasks, activeIndex, overIndex),
  }

  return taskSectionOrder.flatMap((key) => {
    return nextSections[key].map((task) => task.id)
  })
}
