import { createTheme } from '@mui/material/styles'

import { appColors, appFonts, appRadii } from './designTokens'

export const appTheme = createTheme({
  palette: {
    background: {
      default: appColors.background,
      paper: appColors.background,
    },
    primary: {
      main: appColors.primary,
      contrastText: appColors.white,
    },
    text: {
      primary: appColors.text,
      secondary: appColors.textMuted,
    },
  },
  shape: {
    borderRadius: appRadii.default,
  },
  typography: {
    fontFamily: appFonts.body,
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.04em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
})
