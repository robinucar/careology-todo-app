import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useState } from 'react'

import { appBreakpoints } from '../../../app/designTokens'
import type { TaskListItem, TaskSectionKey } from '../taskTypes'
import { ChevronDownIcon } from './TaskIcons'
import { TaskEmptyState } from './TaskEmptyState'
import { TaskMobileList } from './TaskMobileList'
import { TaskTable } from './TaskTable'

type TaskSectionProps = {
  disabled?: boolean
  isReorderDisabled?: boolean
  label: string
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onReorderTasks: (
    sectionKey: TaskSectionKey,
    activeTaskId: string,
    overTaskId: string,
  ) => Promise<void> | void
  onToggleTask: (task: TaskListItem) => void
  sectionKey: TaskSectionKey
  tasks: TaskListItem[]
}

export const TaskSection = ({
  disabled = false,
  isReorderDisabled = false,
  label,
  onDeleteTask,
  onEditTask,
  onReorderTasks,
  onToggleTask,
  sectionKey,
  tasks,
}: TaskSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const isMobileLayout = useMediaQuery(appBreakpoints.taskMobileQuery, {
    noSsr: true,
  })
  const hasTasks = tasks.length > 0
  const headingId = label.toLowerCase().replaceAll(' ', '-')
  const contentId = `${headingId}-content`
  const canReorder = hasTasks && tasks.length > 1 && !isReorderDisabled
  const sortableIds = tasks.map((task) => {
    return task.id
  })
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id

    if (!canReorder || !overId) {
      return
    }

    const activeTaskId = String(event.active.id)
    const overTaskId = String(overId)

    void onReorderTasks(sectionKey, activeTaskId, overTaskId)
  }

  return (
    <section className="task-section" aria-labelledby={headingId}>
      <h2 className="task-section__heading" id={headingId}>
        <button
          aria-controls={contentId}
          aria-expanded={isExpanded}
          className="task-section__toggle"
          onClick={() => {
            setIsExpanded((expanded) => !expanded)
          }}
          type="button"
        >
          <span>{label}</span>
          <ChevronDownIcon className="task-section__chevron" />
        </button>
      </h2>

      <div hidden={!isExpanded} id={contentId}>
        {hasTasks ? (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              disabled={!canReorder}
              items={sortableIds}
              strategy={verticalListSortingStrategy}
            >
              {isMobileLayout ? (
                <TaskMobileList
                  disabled={disabled}
                  isReorderDisabled={!canReorder}
                  label={label}
                  onDeleteTask={onDeleteTask}
                  onEditTask={onEditTask}
                  onToggleTask={onToggleTask}
                  tasks={tasks}
                />
              ) : (
                <TaskTable
                  disabled={disabled}
                  isReorderDisabled={!canReorder}
                  label={label}
                  onDeleteTask={onDeleteTask}
                  onEditTask={onEditTask}
                  onToggleTask={onToggleTask}
                  tasks={tasks}
                />
              )}
            </SortableContext>
          </DndContext>
        ) : (
          <TaskEmptyState label={label} />
        )}
      </div>
    </section>
  )
}
