import { ApolloProvider } from '@apollo/client/react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import type { ReactNode } from 'react'

import { apolloClient } from './apolloClient'
import { appTheme } from './theme'

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ApolloProvider>
  )
}
