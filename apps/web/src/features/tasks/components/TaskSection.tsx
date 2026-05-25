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
  const hasTasks = tasks.length > 0
  const headingId = label.toLowerCase().replaceAll(' ', '-')

  return (
    <section className="task-section" aria-labelledby={headingId}>
      <h2 className="task-section__heading" id={headingId}>
        <span>{label}</span>
        <ChevronDownIcon className="task-section__chevron" />
      </h2>

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
    </section>
  )
}
