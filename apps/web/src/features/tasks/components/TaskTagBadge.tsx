import type { TaskTagBadge as TaskTagBadgeType } from '../taskTypes'

type TaskTagBadgeProps = {
  tag: TaskTagBadgeType
}

export const TaskTagBadge = ({ tag }: TaskTagBadgeProps) => {
  return (
    <span className={`task-tag task-tag--${tag.tone}`}>
      {tag.label}
    </span>
  )
}
