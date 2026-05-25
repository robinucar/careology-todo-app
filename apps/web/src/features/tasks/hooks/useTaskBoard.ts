import { useMutation, useQuery } from '@apollo/client/react'
import { useDeferredValue, useState, type FormEvent } from 'react'

import { getTaskErrorMessage } from '../taskErrorMessage'
import {
  createTaskFormValues,
  emptyTaskFormValues,
  validateTaskFormValues,
} from '../taskFormMappers'
import { createTaskFilters, createTaskSections } from '../taskMappers'
import {
  CREATE_TASK_MUTATION,
  DELETE_TASK_MUTATION,
  TASKS_QUERY,
  UPDATE_TASK_MUTATION,
} from '../taskOperations'
import type {
  CreateTaskMutationData,
  CreateTaskMutationVariables,
  DeleteTaskMutationData,
  DeleteTaskMutationVariables,
  TaskFormErrors,
  TaskFormValues,
  TaskListItem,
  TasksQueryData,
  TasksQueryVariables,
  UpdateTaskMutationData,
  UpdateTaskMutationVariables,
} from '../taskTypes'

type TaskNotice = {
  message: string
  severity: 'error' | 'info' | 'success'
}

export const useTaskBoard = () => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskFormValues, setEditTaskFormValues] =
    useState<TaskFormValues>(emptyTaskFormValues)
  const [editTaskFormErrors, setEditTaskFormErrors] = useState<TaskFormErrors>({})
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskFormValues, setNewTaskFormValues] =
    useState<TaskFormValues>(emptyTaskFormValues)
  const [newTaskFormErrors, setNewTaskFormErrors] = useState<TaskFormErrors>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [taskNotice, setTaskNotice] = useState<TaskNotice | null>(null)
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

  const tasks = tasksQuery.data?.tasks ?? []
  const taskSections = createTaskSections(tasks)
  const isInitialLoading = tasksQuery.loading && !tasksQuery.data
  const isTaskActionInFlight =
    createTaskResult.loading || updateTaskResult.loading || deleteTaskResult.loading
  const isDisabled = isInitialLoading || isTaskActionInFlight
  const queryErrorMessage = tasksQuery.error
    ? getTaskErrorMessage(tasksQuery.error)
    : null
  const shouldShowTaskSections = !isInitialLoading && !queryErrorMessage

  const refetchTasks = async () => {
    await tasksQuery.refetch({
      filters: createTaskFilters(searchTerm),
    })
  }

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

  const updateNewTaskFormValues = (values: TaskFormValues) => {
    setNewTaskFormErrors({})
    setNewTaskFormValues(values)
  }

  const updateEditTaskFormValues = (values: TaskFormValues) => {
    setEditTaskFormErrors({})
    setEditTaskFormValues(values)
  }

  const startAddingTask = () => {
    setTaskNotice(null)
    resetEditTaskForm()
    setIsAddingTask(true)
  }

  const handleCloseTaskNotice = (_event?: unknown, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }

    setTaskNotice(null)
  }

  const handleCreateTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateTaskFormValues(newTaskFormValues)

    if (!validation.isValid) {
      setNewTaskFormErrors(validation.errors)
      setTaskNotice(null)
      return
    }

    try {
      setTaskNotice(null)
      await createTask({
        variables: {
          input: validation.input,
        },
      })
      resetCreateTaskForm()
      setTaskNotice({
        message: 'Task added.',
        severity: 'success',
      })
      await refetchTasks()
    } catch (error) {
      setTaskNotice({
        message: getTaskErrorMessage(error),
        severity: 'error',
      })
    }
  }

  const handleStartEditingTask = (task: TaskListItem) => {
    setTaskNotice(null)
    resetCreateTaskForm()
    setEditingTaskId(task.id)
    setEditTaskFormErrors({})
    setEditTaskFormValues(createTaskFormValues(task))
  }

  const handleUpdateTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingTaskId) {
      return
    }

    const validation = validateTaskFormValues(editTaskFormValues)

    if (!validation.isValid) {
      setEditTaskFormErrors(validation.errors)
      setTaskNotice(null)
      return
    }

    try {
      setTaskNotice(null)
      await updateTask({
        variables: {
          id: editingTaskId,
          input: validation.input,
        },
      })
      resetEditTaskForm()
      setTaskNotice({
        message: 'Task updated.',
        severity: 'success',
      })
      await refetchTasks()
    } catch (error) {
      setTaskNotice({
        message: getTaskErrorMessage(error),
        severity: 'error',
      })
    }
  }

  const handleToggleTask = async (task: TaskListItem) => {
    try {
      setTaskNotice(null)
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
      setTaskNotice({
        message: getTaskErrorMessage(error),
        severity: 'error',
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      setTaskNotice(null)
      await deleteTask({
        variables: {
          id: taskId,
        },
      })
      setTaskNotice({
        message: 'Task deleted.',
        severity: 'success',
      })
      await refetchTasks()
    } catch (error) {
      setTaskNotice({
        message: getTaskErrorMessage(error),
        severity: 'error',
      })
    }
  }

  return {
    createTaskResult,
    editTaskFormErrors,
    editTaskFormValues,
    editingTaskId,
    handleCloseTaskNotice,
    handleCreateTaskSubmit,
    handleDeleteTask,
    handleStartEditingTask,
    handleToggleTask,
    handleUpdateTaskSubmit,
    isAddingTask,
    isDisabled,
    isInitialLoading,
    newTaskFormErrors,
    newTaskFormValues,
    queryErrorMessage,
    resetCreateTaskForm,
    resetEditTaskForm,
    searchTerm,
    updateEditTaskFormValues,
    updateNewTaskFormValues,
    setSearchTerm,
    shouldShowTaskSections,
    startAddingTask,
    taskNotice,
    taskSections,
    updateTaskResult,
  }
}
