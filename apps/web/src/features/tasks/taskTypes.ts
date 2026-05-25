import type {
  CreateTaskInput,
  Task,
  TaskFiltersInput,
  TaskTagTone,
  TaskTagValue,
  UpdateTaskInput,
} from '@careology/shared'

export type { TaskTagTone, TaskTagValue } from '@careology/shared'

export type TaskTagBadge = {
  label: string
  tone: TaskTagTone
}

export type TaskFormValues = {
  description: string
  dueDate: string
  tag: TaskTagValue | ''
  title: string
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>

export type TaskListItem = Pick<
  Task,
  'completed' | 'description' | 'dueDate' | 'id' | 'order' | 'title'
> & {
  dueDateLabel: string | null
  note: string | null
  tag: TaskTagBadge | null
  tagValue: TaskTagValue | ''
  weatherLabel: string | null
}

export type TaskSections = {
  done: TaskListItem[]
  todo: TaskListItem[]
}

export type TasksQueryData = {
  tasks: Task[]
}

export type TasksQueryVariables = {
  filters: TaskFiltersInput | null
}

export type CreateTaskMutationData = {
  createTask: Task
}

export type CreateTaskMutationVariables = {
  input: CreateTaskInput
}

export type UpdateTaskMutationData = {
  updateTask: Task
}

export type UpdateTaskMutationVariables = {
  id: string
  input: UpdateTaskInput
}

export type DeleteTaskMutationData = {
  deleteTask: Task
}

export type DeleteTaskMutationVariables = {
  id: string
}
