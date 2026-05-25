import { useState } from 'react'

import type { TaskListItem } from '../taskTypes'
import { ChevronDownIcon } from './TaskIcons'
import { TaskEmptyState } from './TaskEmptyState'
import { TaskMobileList } from './TaskMobileList'
import { TaskTable } from './TaskTable'

type TaskSectionProps = {
  disabled?: boolean
  label: string
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onToggleTask: (task: TaskListItem) => void
  tasks: TaskListItem[]
}

export const TaskSection = ({
  disabled = false,
  label,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
}: TaskSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasTasks = tasks.length > 0
  const headingId = label.toLowerCase().replaceAll(' ', '-')
  const contentId = `${headingId}-content`

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
          <>
            <TaskTable
              disabled={disabled}
              label={label}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onToggleTask={onToggleTask}
              tasks={tasks}
            />
            <TaskMobileList
              disabled={disabled}
              label={label}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onToggleTask={onToggleTask}
              tasks={tasks}
            />
          </>
        ) : (
          <TaskEmptyState label={label} />
        )}
      </div>
    </section>
  )
}
