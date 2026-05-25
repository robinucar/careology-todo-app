type TaskStatusCheckboxProps = {
  checked: boolean
  disabled?: boolean
  onToggle?: () => void
  taskTitle: string
}

export const TaskStatusCheckbox = ({
  checked,
  disabled = false,
  onToggle,
  taskTitle,
}: TaskStatusCheckboxProps) => {
  const actionLabel = checked ? 'Mark as not done' : 'Mark as done'

  return (
    <input
      aria-label={`${actionLabel}: ${taskTitle}`}
      checked={checked}
      className="task-status-checkbox"
      disabled={disabled}
      onChange={onToggle}
      type="checkbox"
    />
  )
}
