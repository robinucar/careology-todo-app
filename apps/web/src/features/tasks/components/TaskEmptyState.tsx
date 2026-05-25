type TaskEmptyStateProps = {
  label: string
}

export const TaskEmptyState = ({ label }: TaskEmptyStateProps) => {
  return (
    <p className="task-empty-state">
      No {label.toLowerCase()} yet.
    </p>
  )
}
