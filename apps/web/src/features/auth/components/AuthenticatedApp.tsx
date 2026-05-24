import { Box, Button, Paper, Stack, Typography } from '@mui/material'

import type { AuthSession } from '../../../app/authSession'

type AuthenticatedAppProps = {
  isLoggingOut?: boolean
  session: AuthSession
  onLogout: () => void | Promise<void>
}

export function AuthenticatedApp({
  isLoggingOut = false,
  session,
  onLogout,
}: AuthenticatedAppProps) {
  return (
    <Box className="authenticated-page">
      <Box className="authenticated-header" component="header">
        <Typography className="authenticated-brand" component="p">
          Checked
        </Typography>

        <Button
          className="authenticated-logout"
          disabled={isLoggingOut}
          onClick={() => {
            void onLogout()
          }}
          type="button"
          variant="outlined"
        >
          Logout
        </Button>
      </Box>

      <Box className="authenticated-main" component="main">
        <Stack spacing={4}>
          <Box>
            <Typography className="authenticated-title" component="h1">
              My Tasks for the next month
            </Typography>
            <Typography className="authenticated-subtitle">
              Signed in as {session.user.name || session.user.email}
            </Typography>
          </Box>

          <Paper className="authenticated-placeholder" elevation={0}>
            <Typography className="authenticated-placeholder-title" component="h2">
              Todo workspace ready
            </Typography>
            <Typography className="authenticated-placeholder-copy">
              Authentication is complete. The task list will be connected in the next
              step.
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Box>
  )
}
