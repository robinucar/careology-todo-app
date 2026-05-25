import { useMutation, useQuery } from '@apollo/client/react'
import { useDeferredValue, useState, type FormEvent } from 'react'

import { getTaskErrorMessage } from '../taskErrorMessage'
import { validateTaskFormValues } from '../taskFormMappers'
import { createTaskFilters, createTaskSections } from '../taskMappers'
import {
  CREATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  REORDER_TASKS_MUTATION,
  TASKS_QUERY,
  UPDATE_TASK_MUTATION,
} from '../taskOperations'
import { createReorderedTaskIds } from '../taskReorder'
import type {
  CreateTaskMutationData,
  CreateTaskMutationVariables,
  DeleteTaskMutationData,
  DeleteTaskMutationVariables,
  ReorderTasksMutationData,
  ReorderTasksMutationVariables,
  TaskListItem,
  TaskSectionKey,
  TasksQueryData,
  TasksQueryVariables,
  UpdateTaskMutationData,
  UpdateTaskMutationVariables,
} from '../taskTypes'
import { useTaskForms } from './useTaskForms'
import { useTaskNotice } from './useTaskNotice'

export const useTaskBoard = () => {
  const { createForm, editForm } = useTaskForms()
  const {
    clearTaskNotice,
    handleCloseTaskNotice,
    showTaskError,
    showTaskSuccess,
    taskNotice,
  } = useTaskNotice()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const taskFilters = createTaskFilters(deferredSearchTerm)

  const tasksQuery = useQuery<TasksQueryData, TasksQueryVariables>(TASKS_QUERY, {
    variables: {
      filters: taskFilters,
    },
  })
  const [createTask, createTaskResult] = useMutation<
    CreateTaskMutationData,
    CreateTaskMutationVariables
  >(CREATE_TASK_MUTATION)
  const [updateTask, updateTaskResult] = useMutation<
    UpdateTaskMutationData,
    UpdateTaskMutationVariables
  >(UPDATE_TASK_MUTATION)
  const [deleteTask, deleteTaskResult] = useMutation<
    DeleteTaskMutationData,
    DeleteTaskMutationVariables
  >(DELETE_TASK_MUTATION)
  const [reorderTasks, reorderTasksResult] = useMutation<
    ReorderTasksMutationData,
    ReorderTasksMutationVariables
  >(REORDER_TASKS_MUTATION)

  const tasks = tasksQuery.data?.tasks ?? []
  const taskSections = createTaskSections(tasks)
  const isInitialLoading = tasksQuery.loading && !tasksQuery.data
  const isSearchActive = searchTerm.trim().length > 0
  const isDeferredSearchActive = deferredSearchTerm.trim().length > 0
  const isTaskActionInFlight =
    createTaskResult.loading ||
    updateTaskResult.loading ||
    deleteTaskResult.loading ||
    reorderTasksResult.loading
  const isDisabled = isInitialLoading || isTaskActionInFlight
  const isReorderDisabled =
    isDisabled || tasksQuery.loading || isSearchActive || isDeferredSearchActive
  const queryErrorMessage = tasksQuery.error
    ? getTaskErrorMessage(tasksQuery.error)
    : null
  const shouldShowTaskSections = !isInitialLoading && !queryErrorMessage

  const refetchTasks = async () => {
    await tasksQuery.refetch({
      filters: createTaskFilters(searchTerm),
    })
  }

  const startAddingTask = () => {
    clearTaskNotice()
    createForm.start()
  }

  const handleCreateTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateTaskFormValues(createForm.values)

    if (!validation.isValid) {
      createForm.setErrors(validation.errors)
      clearTaskNotice()
      return
    }

    try {
      clearTaskNotice()
      await createTask({
        variables: {
          input: validation.input,
        },
      })
      createForm.reset()
      showTaskSuccess('Task added.')
      await refetchTasks()
    } catch (error) {
      showTaskError(error)
    }
  }

  const handleStartEditingTask = (task: TaskListItem) => {
    clearTaskNotice()
    editForm.start(task)
  }

  const handleUpdateTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editForm.taskId) {
      return
    }

    const validation = validateTaskFormValues(editForm.values)

    if (!validation.isValid) {
      editForm.setErrors(validation.errors)
      clearTaskNotice()
      return
    }

    try {
      clearTaskNotice()
      await updateTask({
        variables: {
          id: editForm.taskId,
          input: validation.input,
        },
      })
      editForm.reset()
      showTaskSuccess('Task updated.')
      await refetchTasks()
    } catch (error) {
      showTaskError(error)
    }
  }

  const handleToggleTask = async (task: TaskListItem) => {
    try {
      clearTaskNotice()
      await updateTask({
        variables: {
          id: task.id,
          input: {
            completed: !task.completed,
          },
        },
      })
      await refetchTasks()
    } catch (error) {
      showTaskError(error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      clearTaskNotice()
      await deleteTask({
        variables: {
          id: taskId,
        },
      })
      showTaskSuccess('Task deleted.')
      await refetchTasks()
    } catch (error) {
      showTaskError(error)
    }
  }

  const handleReorderTasks = async (
    sectionKey: TaskSectionKey,
    activeTaskId: string,
    overTaskId: string,
  ) => {
    const reorderedTaskIds = createReorderedTaskIds(
      taskSections,
      sectionKey,
      activeTaskId,
      overTaskId,
    )

    if (!reorderedTaskIds) {
      return
    }

    try {
      clearTaskNotice()
      await reorderTasks({
        variables: {
          ids: reorderedTaskIds,
        },
      })
      showTaskSuccess('Task order updated.')
      await refetchTasks()
    } catch (error) {
      showTaskError(error)
    }
  }

  return {
    actions: {
      deleteTask: handleDeleteTask,
      reorderTasks: handleReorderTasks,
      startAddingTask,
      startEditingTask: handleStartEditingTask,
      toggleTask: handleToggleTask,
    },
    forms: {
      create: {
        errors: createForm.errors,
        isOpen: createForm.isOpen,
        isSubmitting: createTaskResult.loading,
        onCancel: createForm.reset,
        onChange: createForm.updateValues,
        onSubmit: handleCreateTaskSubmit,
        values: createForm.values,
      },
      edit: {
        errors: editForm.errors,
        isOpen: Boolean(editForm.taskId),
        isSubmitting: updateTaskResult.loading,
        onCancel: editForm.reset,
        onChange: editForm.updateValues,
        onSubmit: handleUpdateTaskSubmit,
        values: editForm.values,
      },
    },
    notice: {
      onClose: handleCloseTaskNotice,
      value: taskNotice,
    },
    search: {
      onChange: setSearchTerm,
      term: searchTerm,
    },
    state: {
      isDisabled,
      isInitialLoading,
      isReorderDisabled,
      queryErrorMessage,
      shouldShowTaskSections,
      taskSections,
    },
  }
}
