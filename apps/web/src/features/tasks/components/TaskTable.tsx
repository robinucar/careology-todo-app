import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties } from 'react'

import type { TaskListItem } from '../taskTypes'
import {
  CalendarIcon,
  EditIcon,
  ListIcon,
  NoteIcon,
  TagIcon,
  TrashIcon,
} from './TaskIcons'
import { TaskStatusCheckbox } from './TaskStatusCheckbox'
import { TaskTagBadge } from './TaskTagBadge'

type TaskTableProps = {
  disabled?: boolean
  isReorderDisabled?: boolean
  label: string
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onToggleTask: (task: TaskListItem) => void
  tasks: TaskListItem[]
}

export const TaskTable = ({
  disabled = false,
  isReorderDisabled = false,
  label,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
}: TaskTableProps) => {
  return (
    <div className="task-table-shell">
      <table aria-label={label} className="task-table">
        <thead>
          <tr>
            <th className="task-table__status" scope="col">
              <span className="sr-only">Status</span>
            </th>
            <th className="task-table__title" scope="col">
              <ListIcon className="task-table__heading-icon" />
              <span>Task name</span>
            </th>
            <th className="task-table__date" scope="col">
              <CalendarIcon className="task-table__heading-icon" />
              <span>Due date</span>
            </th>
            <th className="task-table__tag" scope="col">
              <TagIcon className="task-table__heading-icon" />
              <span>Tag</span>
            </th>
            <th className="task-table__note" scope="col">
              <NoteIcon className="task-table__heading-icon" />
              <span>Note</span>
            </th>
            <th className="task-table__actions" scope="col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskTableRow
              disabled={disabled}
              isReorderDisabled={isReorderDisabled}
              key={task.id}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onToggleTask={onToggleTask}
              task={task}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

type TaskTableRowProps = {
  disabled: boolean
  isReorderDisabled: boolean
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onToggleTask: (task: TaskListItem) => void
  task: TaskListItem
}

const TaskTableRow = ({
  disabled,
  isReorderDisabled,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  task,
}: TaskTableRowProps) => {
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
    <tr className={className || undefined} ref={setNodeRef} style={style}>
      <td className="task-table__status">
        <TaskStatusCheckbox
          checked={task.completed}
          disabled={disabled}
          onToggle={() => {
            onToggleTask(task)
          }}
          taskTitle={task.title}
        />
      </td>
      <td className="task-table__title">
        <span className="task-table__title-content">
          <button
            aria-label={`Reorder task: ${task.title}`}
            className="task-drag-handle"
            disabled={isReorderDisabled}
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
          >
            <ListIcon aria-hidden="true" />
          </button>
          <span>{task.title}</span>
        </span>
      </td>
      <td className="task-table__date">{task.dueDateLabel}</td>
      <td className="task-table__tag">
        {task.tag ? <TaskTagBadge tag={task.tag} /> : null}
      </td>
      <td className="task-table__note">
        {task.note || task.weatherLabel ? (
          <span className="task-table__note-stack">
            {task.note ? <span>({task.note})</span> : null}
            {task.weatherLabel ? <span>({task.weatherLabel})</span> : null}
          </span>
        ) : null}
      </td>
      <td className="task-table__actions">
        <span className="task-table__action-icons">
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
      </td>
    </tr>
  )
}
