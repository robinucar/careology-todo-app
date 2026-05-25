import { Button } from '@mui/material'

import { LockIcon, SearchIcon } from './TaskIcons'

type TaskToolbarProps = {
  isLoggingOut: boolean
  onLogout: () => void
  onSearchChange: (value: string) => void
  searchTerm: string
}

export const TaskToolbar = ({
  isLoggingOut,
  onLogout,
  onSearchChange,
  searchTerm,
}: TaskToolbarProps) => {
  return (
    <div className="task-toolbar">
      <label className="task-search">
        <SearchIcon className="task-search__icon" />
        <span className="sr-only">Search tasks</span>
        <input
          onChange={(event) => {
            onSearchChange(event.target.value)
          }}
          placeholder="Search"
          type="search"
          value={searchTerm}
        />
      </label>

      <Button
        className="task-logout-button"
        disabled={isLoggingOut}
        onClick={onLogout}
        type="button"
        variant="outlined"
      >
        <LockIcon className="task-logout-button__icon" />
        Logout
      </Button>
    </div>
  )
}
