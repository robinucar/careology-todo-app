import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    primary: {
      main: '#00805F',
      contrastText: '#ffffff',
    },
    text: {
      primary: '#20262a',
      secondary: '#5f6870',
    },
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Poppins", "Avenir Next", "Helvetica Neue", sans-serif',
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
