import { IconButton, InputAdornment, type TextFieldProps } from '@mui/material'
import { useState } from 'react'

import eyeCrossIcon from '../../../assets/eye-cross.svg'
import { AuthTextField } from './AuthTextField'

type PasswordFieldProps = Omit<TextFieldProps, 'label' | 'type'> & {
  label: string
}

export const PasswordField = ({
  slotProps,
  ...textFieldProps
}: PasswordFieldProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const inputSlotProps = typeof slotProps?.input === 'object' ? slotProps.input : undefined
  const existingEndAdornment = inputSlotProps && 'endAdornment' in inputSlotProps
    ? inputSlotProps.endAdornment
    : null

  return (
    <AuthTextField
      {...textFieldProps}
      type={isPasswordVisible ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: {
          ...inputSlotProps,
          endAdornment: (
            <>
              {existingEndAdornment}
              <InputAdornment position="end">
                <IconButton
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  color="primary"
                  edge="end"
                  onClick={() => {
                    setIsPasswordVisible((currentValue) => !currentValue)
                  }}
                  size="small"
                  type="button"
                >
                  <img alt="" className="auth-password-icon" src={eyeCrossIcon} />
                </IconButton>
              </InputAdornment>
            </>
          ),
        },
      }}
    />
  )
}
