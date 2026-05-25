import { useState } from 'react'

import {
  createTaskFormValues,
  emptyTaskFormValues,
} from '../taskFormMappers'
import type {
  TaskFormErrors,
  TaskFormValues,
  TaskListItem,
} from '../taskTypes'

export const useTaskForms = () => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskFormValues, setEditTaskFormValues] =
    useState<TaskFormValues>(emptyTaskFormValues)
  const [editTaskFormErrors, setEditTaskFormErrors] = useState<TaskFormErrors>({})
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskFormValues, setNewTaskFormValues] =
    useState<TaskFormValues>(emptyTaskFormValues)
  const [newTaskFormErrors, setNewTaskFormErrors] = useState<TaskFormErrors>({})

  const resetCreateTaskForm = () => {
    setIsAddingTask(false)
    setNewTaskFormErrors({})
    setNewTaskFormValues(emptyTaskFormValues)
  }

  const resetEditTaskForm = () => {
    setEditingTaskId(null)
    setEditTaskFormErrors({})
    setEditTaskFormValues(emptyTaskFormValues)
  }

  const startAddingTask = () => {
    resetEditTaskForm()
    setIsAddingTask(true)
  }

  const startEditingTask = (task: TaskListItem) => {
    resetCreateTaskForm()
    setEditingTaskId(task.id)
    setEditTaskFormErrors({})
    setEditTaskFormValues(createTaskFormValues(task))
  }

  const updateNewTaskFormValues = (values: TaskFormValues) => {
    setNewTaskFormErrors({})
    setNewTaskFormValues(values)
  }

  const updateEditTaskFormValues = (values: TaskFormValues) => {
    setEditTaskFormErrors({})
    setEditTaskFormValues(values)
  }

  return {
    createForm: {
      errors: newTaskFormErrors,
      isOpen: isAddingTask,
      reset: resetCreateTaskForm,
      setErrors: setNewTaskFormErrors,
      start: startAddingTask,
      updateValues: updateNewTaskFormValues,
      values: newTaskFormValues,
    },
    editForm: {
      errors: editTaskFormErrors,
      reset: resetEditTaskForm,
      setErrors: setEditTaskFormErrors,
      start: startEditingTask,
      taskId: editingTaskId,
      updateValues: updateEditTaskFormValues,
      values: editTaskFormValues,
    },
  }
}
