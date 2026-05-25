import type { TaskListItem } from '../taskTypes'
import { EditIcon, TrashIcon } from './TaskIcons'
import { TaskStatusCheckbox } from './TaskStatusCheckbox'
import { TaskTagBadge } from './TaskTagBadge'

type TaskMobileListProps = {
  disabled?: boolean
  label: string
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onToggleTask: (task: TaskListItem) => void
  tasks: TaskListItem[]
}

export const TaskMobileList = ({
  disabled = false,
  label,
  onDeleteTask,
  onEditTask,
  onToggleTask,
  tasks,
}: TaskMobileListProps) => {
  return (
    <ul aria-label={label} className="task-mobile-list">
      {tasks.map((task) => (
        <li className={task.completed ? 'is-completed' : undefined} key={task.id}>
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
                {task.weatherLabel ? (
                  <span>Weather: ({task.weatherLabel})</span>
                ) : null}
              </div>
            ) : null}

            {task.tag ? <TaskTagBadge tag={task.tag} /> : null}
          </div>

          <span className="task-mobile-list__actions">
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
      ))}
    </ul>
  )
}
