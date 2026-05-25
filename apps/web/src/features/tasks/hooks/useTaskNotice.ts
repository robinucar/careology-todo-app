import { useState } from 'react'

import { getTaskErrorMessage } from '../taskErrorMessage'

export type TaskNotice = {
  message: string
  severity: 'error' | 'info' | 'success'
}

export const useTaskNotice = () => {
  const [taskNotice, setTaskNotice] = useState<TaskNotice | null>(null)

  const clearTaskNotice = () => {
    setTaskNotice(null)
  }

  const handleCloseTaskNotice = (_event?: unknown, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }

    clearTaskNotice()
  }

  const showTaskError = (error: unknown) => {
    setTaskNotice({
      message: getTaskErrorMessage(error),
      severity: 'error',
    })
  }

  const showTaskSuccess = (message: string) => {
    setTaskNotice({
      message,
      severity: 'success',
    })
  }

  return {
    clearTaskNotice,
    handleCloseTaskNotice,
    showTaskError,
    showTaskSuccess,
    taskNotice,
  }
}
