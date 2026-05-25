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
  const { actions, forms, notice, search, state } = useTaskBoard()
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
            onSearchChange={search.onChange}
            searchTerm={search.term}
          />
        ) : null}
      </nav>

      <div className="task-board__header">
        <h1 className="task-board__title">My Tasks</h1>
        <TaskToolbar
          className="task-toolbar--desktop"
          isLoggingOut={isLoggingOut}
          onLogout={onLogout}
          onSearchChange={search.onChange}
          searchTerm={search.term}
        />
      </div>

      <Button
        className="task-add-button"
        disabled={state.isDisabled}
        onClick={actions.startAddingTask}
        type="button"
        variant="contained"
      >
        <span aria-hidden="true">+</span>
        Add task
      </Button>

      {state.queryErrorMessage ? (
        <Alert className="task-alert" severity="error">
          {state.queryErrorMessage}
        </Alert>
      ) : null}

      {state.isInitialLoading ? (
        <div className="task-loading-state" role="status">
          <CircularProgress size={24} />
          <span>Loading tasks...</span>
        </div>
      ) : null}

      {forms.create.isOpen ? (
        <div className="task-create-panel">
          <TaskForm
            errors={forms.create.errors}
            formId="new-task"
            isSubmitting={forms.create.isSubmitting}
            onCancel={forms.create.onCancel}
            onChange={forms.create.onChange}
            onSubmit={forms.create.onSubmit}
            submitLabel="Add"
            values={forms.create.values}
          />
        </div>
      ) : null}

      {forms.edit.isOpen ? (
        <div className="task-create-panel">
          <TaskForm
            errors={forms.edit.errors}
            formId="edit-task"
            isSubmitting={forms.edit.isSubmitting}
            onCancel={forms.edit.onCancel}
            onChange={forms.edit.onChange}
            onSubmit={forms.edit.onSubmit}
            submitLabel="Save"
            values={forms.edit.values}
          />
        </div>
      ) : null}

      {state.shouldShowTaskSections ? (
        <div className="task-board__sections">
          <TaskSection
            disabled={state.isDisabled}
            isReorderDisabled={state.isReorderDisabled}
            label="Tasks to do"
            onDeleteTask={actions.deleteTask}
            onEditTask={actions.startEditingTask}
            onReorderTasks={actions.reorderTasks}
            onToggleTask={actions.toggleTask}
            sectionKey="todo"
            tasks={state.taskSections.todo}
          />
          <TaskSection
            disabled={state.isDisabled}
            isReorderDisabled={state.isReorderDisabled}
            label="Tasks done"
            onDeleteTask={actions.deleteTask}
            onEditTask={actions.startEditingTask}
            onReorderTasks={actions.reorderTasks}
            onToggleTask={actions.toggleTask}
            sectionKey="done"
            tasks={state.taskSections.done}
          />
        </div>
      ) : null}
      <Snackbar
        autoHideDuration={notice.value?.severity === 'success' ? 4000 : null}
        onClose={notice.onClose}
        open={Boolean(notice.value)}
      >
        {notice.value ? (
          <Alert onClose={notice.onClose} severity={notice.value.severity}>
            {notice.value.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </div>
  )
}
