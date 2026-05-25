import { TASK_TITLE_MAX_LENGTH } from '@careology/shared'
import type { FormEvent } from 'react'

import { getTodayDateInputValue } from '../taskFormMappers'
import { TASK_TAG_OPTIONS } from '../taskTags'
import type { TaskFormErrors, TaskFormValues, TaskTagValue } from '../taskTypes'

type TaskFormProps = {
  errors?: TaskFormErrors
  formId: string
  isSubmitting: boolean
  onCancel: () => void
  onChange: (values: TaskFormValues) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitLabel: string
  values: TaskFormValues
}

export const TaskForm = ({
  errors = {},
  formId,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  submitLabel,
  values,
}: TaskFormProps) => {
  const titleCharacterCount = values.title.trim().length
  const titleCountId = `${formId}-title-count`
  const titleRequiredId = `${formId}-title-required`
  const minDueDate = getTodayDateInputValue()
  const getErrorId = (field: keyof TaskFormValues) => `${formId}-${field}-error`
  const getDescribedBy = (...ids: Array<string | false | undefined>) => {
    return ids.filter(Boolean).join(' ') || undefined
  }

  const updateField = <Field extends keyof TaskFormValues>(
    field: Field,
    value: TaskFormValues[Field],
  ) => {
    onChange({
      ...values,
      [field]: value,
    })
  }

  return (
    <form className="task-create-form" onSubmit={onSubmit}>
      <div className="task-create-form__header">
        <div>
          <p className="task-create-form__eyebrow">
            {submitLabel === 'Save' ? 'Edit task' : 'New task'}
          </p>
          <h3>{submitLabel === 'Save' ? 'Update task details' : 'Add a task'}</h3>
        </div>
      </div>

      <div className="task-create-form__field task-create-form__field--title">
        <div className="task-create-form__label-row">
          <span className="task-create-form__label-required">
            <label htmlFor={`${formId}-title`}>Task name</label>
            <span aria-hidden="true" className="task-create-form__required">
              *
            </span>
          </span>
          <span className="sr-only" id={titleRequiredId}>
            required
          </span>
          <span id={titleCountId}>
            {titleCharacterCount}/{TASK_TITLE_MAX_LENGTH}
          </span>
        </div>
        <input
          aria-describedby={getDescribedBy(
            titleRequiredId,
            titleCountId,
            errors.title && getErrorId('title'),
          )}
          aria-invalid={errors.title ? 'true' : undefined}
          aria-required="true"
          autoFocus
          className="task-create-form__title"
          disabled={isSubmitting}
          id={`${formId}-title`}
          maxLength={TASK_TITLE_MAX_LENGTH}
          onChange={(event) => {
            updateField('title', event.target.value)
          }}
          placeholder="e.g. Book London tickets"
          type="text"
          value={values.title}
        />
        {errors.title ? (
          <p className="task-create-form__error" id={getErrorId('title')}>
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="task-create-form__meta-grid">
        <div className="task-create-form__field">
          <label htmlFor={`${formId}-tag`}>Priority tag</label>
          <select
            aria-describedby={errors.tag ? getErrorId('tag') : undefined}
            aria-invalid={errors.tag ? 'true' : undefined}
            className="task-create-form__tag"
            disabled={isSubmitting}
            id={`${formId}-tag`}
            onChange={(event) => {
              updateField('tag', event.target.value as TaskTagValue | '')
            }}
            value={values.tag}
          >
            <option value="">No tag</option>
            {TASK_TAG_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.tag ? (
            <p className="task-create-form__error" id={getErrorId('tag')}>
              {errors.tag}
            </p>
          ) : null}
        </div>

        <div className="task-create-form__field">
          <label htmlFor={`${formId}-due-date`}>Due date</label>
          <input
            aria-describedby={errors.dueDate ? getErrorId('dueDate') : undefined}
            aria-invalid={errors.dueDate ? 'true' : undefined}
            className="task-create-form__date"
            disabled={isSubmitting}
            id={`${formId}-due-date`}
            min={minDueDate}
            onChange={(event) => {
              updateField('dueDate', event.target.value)
            }}
            type="date"
            value={values.dueDate}
          />
          {errors.dueDate ? (
            <p className="task-create-form__error" id={getErrorId('dueDate')}>
              {errors.dueDate}
            </p>
          ) : null}
        </div>
      </div>

      <div className="task-create-form__field">
        <label htmlFor={`${formId}-description`}>Note</label>
        <textarea
          className="task-create-form__description"
          disabled={isSubmitting}
          id={`${formId}-description`}
          onChange={(event) => {
            updateField('description', event.target.value)
          }}
          placeholder="Add extra details, if useful"
          value={values.description}
        />
      </div>

      <div className="task-create-form__actions">
        <button
          className="task-create-form__submit"
          disabled={isSubmitting}
          type="submit"
        >
          {submitLabel}
        </button>
        <button
          className="task-create-form__cancel"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
