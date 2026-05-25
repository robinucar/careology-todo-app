import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'

import type { TaskListItem } from '../taskTypes'
import { EditIcon, ListIcon, TrashIcon } from './TaskIcons'
import { TaskStatusCheckbox } from './TaskStatusCheckbox'
import { TaskTagBadge } from './TaskTagBadge'

type TaskMobileListProps = {
  disabled?: boolean
  isReorderDisabled?: boolean
  label: string
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onToggleTask: (task: TaskListItem) => void
  tasks: TaskListItem[]
}

export const TaskMobileList = ({
  disabled = false,
  isReorderDisabled = false,
  label,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
}: TaskMobileListProps) => {
  return (
    <ul aria-label={label} className="task-mobile-list">
      {tasks.map((task) => (
        <TaskMobileListItem
          disabled={disabled}
          isReorderDisabled={isReorderDisabled}
          key={task.id}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onToggleTask={onToggleTask}
          task={task}
        />
      ))}
    </ul>
  )
}

type TaskMobileListItemProps = {
  disabled: boolean
  isReorderDisabled: boolean
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onToggleTask: (task: TaskListItem) => void
  task: TaskListItem
}

const TaskMobileListItem = ({
  disabled,
  isReorderDisabled,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  task,
}: TaskMobileListItemProps) => {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    disabled: isReorderDisabled,
    id: task.id,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const className = [
    task.completed ? 'is-completed' : '',
    isDragging ? 'is-dragging' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={className || undefined} ref={setNodeRef} style={style}>
      <TaskStatusCheckbox
        checked={task.completed}
        disabled={disabled}
        onToggle={() => {
          onToggleTask(task)
        }}
        taskTitle={task.title}
      />

      <div className="task-mobile-list__content">
        <p className="task-mobile-list__title">{task.title}</p>

        {task.dueDateLabel || task.note || task.weatherLabel ? (
          <div className="task-mobile-list__meta">
            {task.dueDateLabel ? <span>{task.dueDateLabel}</span> : null}
            {task.note ? <span>Note: ({task.note})</span> : null}
            {task.weatherLabel ? <span>Note: ({task.weatherLabel})</span> : null}
          </div>
        ) : null}

        {task.tag ? <TaskTagBadge tag={task.tag} /> : null}
      </div>

      <span className="task-mobile-list__actions">
        <button
          aria-label={`Reorder task: ${task.title}`}
          className="task-drag-handle task-mobile-list__drag-handle"
          disabled={isReorderDisabled}
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
        >
          <ListIcon />
        </button>
        <button
          aria-label={`Edit task: ${task.title}`}
          className="task-icon-button"
          disabled={disabled}
          onClick={() => {
            onEditTask(task)
          }}
          type="button"
        >
          <EditIcon />
        </button>
        <button
          aria-label={`Delete task: ${task.title}`}
          className="task-icon-button"
          disabled={disabled}
          onClick={() => {
            onDeleteTask(task.id)
          }}
          type="button"
        >
          <TrashIcon />
        </button>
      </span>
    </li>
  )
}
