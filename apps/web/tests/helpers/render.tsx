import { ThemeProvider } from '@mui/material'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

import { appTheme } from '../../src/app/theme'

export const renderWithTheme = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={appTheme}>{children}</ThemeProvider>
    ),
    ...options,
  })
}
