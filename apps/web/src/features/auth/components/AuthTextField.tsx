import { Stack, TextField, Typography, type TextFieldProps } from '@mui/material'
import { useId } from 'react'

type AuthTextFieldProps = Omit<TextFieldProps, 'label'> & {
  label: string
}

export const AuthTextField = ({
  id,
  label,
  ...textFieldProps
}: AuthTextFieldProps) => {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <Stack className="auth-field" spacing={0.9}>
      <Typography
        className="auth-field-label"
        component="label"
        htmlFor={fieldId}
      >
        {label}
      </Typography>
      <TextField
        {...textFieldProps}
        id={fieldId}
        label={undefined}
        variant="outlined"
      />
    </Stack>
  )
}
