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
  label: string
  onDeleteTask: (taskId: string) => void
  onEditTask: (task: TaskListItem) => void
  onToggleTask: (task: TaskListItem) => void
  tasks: TaskListItem[]
}

export const TaskTable = ({
  disabled = false,
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
            <tr key={task.id} className={task.completed ? 'is-completed' : undefined}>
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
              <td className="task-table__title">{task.title}</td>
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
          ))}
        </tbody>
      </table>
    </div>
  )
}
