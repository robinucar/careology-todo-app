import { Box, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import authIllustration from '../../../assets/auth-illustration.png'

type AuthLayoutProps = {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Box className="auth-page">
      <Typography className="auth-brand" component="p">
        Checked
      </Typography>

      <Box className="auth-stage">
        <Paper className="auth-card" elevation={0}>
          {children}
        </Paper>

        <Box
          alt=""
          aria-hidden="true"
          className="auth-illustration"
          component="img"
          src={authIllustration}
        />
      </Box>
    </Box>
  )
}
