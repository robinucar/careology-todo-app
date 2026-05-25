import { Box, IconButton, Typography } from '@mui/material'
import { useState } from 'react'

import type { AuthSession } from '../../../app/authSession'
import { TaskBoard } from '../../tasks'

type AuthenticatedAppProps = {
  isLoggingOut?: boolean
  session: AuthSession
  onLogout: () => void | Promise<void>
}

export const AuthenticatedApp = ({
  isLoggingOut = false,
  session,
  onLogout,
}: AuthenticatedAppProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    setIsMobileMenuOpen(false)
    void onLogout()
  }

  return (
    <Box className="authenticated-page">
      <Box className="authenticated-header" component="header">
        <Typography className="authenticated-brand" component="p">
          Checked
        </Typography>

        <IconButton
          aria-controls="task-mobile-menu"
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close task menu' : 'Open task menu'}
          className="authenticated-menu-button"
          disableRipple
          onClick={() => {
            setIsMobileMenuOpen((isOpen) => !isOpen)
          }}
          type="button"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </IconButton>
      </Box>

      <Box className="authenticated-main" component="main">
        <TaskBoard
          isMobileMenuOpen={isMobileMenuOpen}
          isLoggingOut={isLoggingOut}
          onLogout={handleLogout}
          session={session}
        />
      </Box>
    </Box>
  )
}
