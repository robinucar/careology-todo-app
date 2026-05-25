import { Alert, Button, CircularProgress, Snackbar } from '@mui/material'

import type { AuthSession } from '../../../app/authSession'
import { useTaskBoard } from '../hooks/useTaskBoard'
import { TaskForm } from './TaskCreateControls'
import { TaskSection } from './TaskSection'
import { TaskToolbar } from './TaskToolbar'
import '../styles/task-layout.css'
import '../styles/task-table.css'
import '../styles/task-form.css'
import '../styles/task-mobile.css'

type TaskBoardProps = {
  isLoggingOut?: boolean
  isMobileMenuOpen?: boolean
  onLogout: () => void
  session: AuthSession
}

export const TaskBoard = ({
  isLoggingOut = false,
  isMobileMenuOpen = false,
  onLogout,
  session,
}: TaskBoardProps) => {
  const {
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
    setSearchTerm,
    shouldShowTaskSections,
    startAddingTask,
    taskNotice,
    taskSections,
    updateEditTaskFormValues,
    updateNewTaskFormValues,
    updateTaskResult,
  } = useTaskBoard()
  const signedInLabel = `Signed in as ${session.user.name || session.user.email}`

  return (
    <div className="task-board">
      <p className="sr-only">{signedInLabel}</p>

      <nav
        aria-label="Mobile task actions"
        className="task-board__mobile-menu"
        hidden={!isMobileMenuOpen}
        id="task-mobile-menu"
      >
        {isMobileMenuOpen ? (
          <TaskToolbar
            className="task-toolbar--mobile"
            isLoggingOut={isLoggingOut}
            onLogout={onLogout}
            onSearchChange={setSearchTerm}
            searchTerm={searchTerm}
          />
        ) : null}
      </nav>

      <div className="task-board__header">
        <h1 className="task-board__title">My Tasks</h1>
        <TaskToolbar
          className="task-toolbar--desktop"
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
          onSearchChange={setSearchTerm}
          searchTerm={searchTerm}
        />
      </div>

      <Button
        className="task-add-button"
        disabled={isDisabled}
        onClick={startAddingTask}
        type="button"
        variant="contained"
      >
        <span aria-hidden="true">+</span>
        Add task
      </Button>

      {queryErrorMessage ? (
        <Alert className="task-alert" severity="error">
          {queryErrorMessage}
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <div className="task-loading-state" role="status">
          <CircularProgress size={24} />
          <span>Loading tasks...</span>
        </div>
      ) : null}

      {isAddingTask ? (
        <div className="task-create-panel">
          <TaskForm
            errors={newTaskFormErrors}
            formId="new-task"
            isSubmitting={createTaskResult.loading}
            onCancel={resetCreateTaskForm}
            onChange={updateNewTaskFormValues}
            onSubmit={handleCreateTaskSubmit}
            submitLabel="Add"
            values={newTaskFormValues}
          />
        </div>
      ) : null}

      {editingTaskId ? (
        <div className="task-create-panel">
          <TaskForm
            errors={editTaskFormErrors}
            formId="edit-task"
            isSubmitting={updateTaskResult.loading}
            onCancel={resetEditTaskForm}
            onChange={updateEditTaskFormValues}
            onSubmit={handleUpdateTaskSubmit}
            submitLabel="Save"
            values={editTaskFormValues}
          />
        </div>
      ) : null}

      {shouldShowTaskSections ? (
        <div className="task-board__sections">
          <TaskSection
            disabled={isDisabled}
            label="Tasks to do"
            onDeleteTask={handleDeleteTask}
            onEditTask={handleStartEditingTask}
            onToggleTask={handleToggleTask}
            tasks={taskSections.todo}
          />
          <TaskSection
            disabled={isDisabled}
            label="Tasks done"
            onDeleteTask={handleDeleteTask}
            onEditTask={handleStartEditingTask}
            onToggleTask={handleToggleTask}
            tasks={taskSections.done}
          />
        </div>
      ) : null}
      <Snackbar
        autoHideDuration={taskNotice?.severity === 'success' ? 4000 : null}
        onClose={handleCloseTaskNotice}
        open={Boolean(taskNotice)}
      >
        {taskNotice ? (
          <Alert onClose={handleCloseTaskNotice} severity={taskNotice.severity}>
            {taskNotice.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </div>
  )
}
