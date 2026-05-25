import type { TaskTagTone, TaskTagValue } from './taskTypes'

export const TASK_TAG_OPTIONS: ReadonlyArray<{
  label: string
  value: TaskTagValue
}> = [
  {
    label: 'Low',
    value: 'low',
  },
  {
    label: 'Medium',
    value: 'medium',
  },
  {
    label: 'High',
    value: 'high',
  },
  {
    label: 'Not urgent',
    value: 'not-urgent',
  },
  {
    label: 'Urgent',
    value: 'urgent',
  },
]

const tagToneByValue: Record<string, TaskTagTone> = {
  high: 'high',
  low: 'low',
  medium: 'medium',
  'not-urgent': 'notUrgent',
  urgent: 'urgent',
}

const normalizeTaskTag = (tag: string): string => {
  return tag.trim().toLowerCase().replace(/[_\s]+/g, '-')
}

export const getTaskTagValue = (tag: string): TaskTagValue | '' => {
  const normalizedTag = normalizeTaskTag(tag)

  return TASK_TAG_OPTIONS.some((option) => option.value === normalizedTag)
    ? (normalizedTag as TaskTagValue)
    : ''
}

export const getTaskTagTone = (tag: string): TaskTagTone => {
  return tagToneByValue[normalizeTaskTag(tag)] ?? 'default'
}

export const formatTaskTagLabel = (tag: string): string => {
  if (normalizeTaskTag(tag) === 'not-urgent') {
    return 'Not urgent'
  }

  return tag
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}
