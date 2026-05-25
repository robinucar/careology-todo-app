import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Checkbox, FormControlLabel, Link, Stack, Typography } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'

import {
  loginFormSchema,
  type LoginFormValues,
} from '../authSchemas'
import { AuthTextField } from './AuthTextField'
import { PasswordField } from './PasswordField'

type LoginFormProps = {
  isSubmitting?: boolean
  onForgotPasswordClick: () => void
  onRegisterClick: () => void
  onSubmit: (values: LoginFormValues) => void | Promise<void>
}

export const LoginForm = ({
  isSubmitting = false,
  onForgotPasswordClick,
  onRegisterClick,
  onSubmit,
}: LoginFormProps) => {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    resolver: zodResolver(loginFormSchema),
  })

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3.5}>
        <Box>
          <Typography className="auth-welcome">Welcome !</Typography>
          <Typography
            aria-label="Sign in to get things done"
            className="auth-title"
            component="h1"
          >
            Sign in to
          </Typography>
          <Typography aria-hidden="true" className="auth-subtitle">
            get things done ✨
          </Typography>
        </Box>

        <Stack spacing={2.5}>
          <AuthTextField
            autoComplete="email"
            error={Boolean(errors.email)}
            fullWidth
            helperText={errors.email?.message}
            label="Enter your email"
            placeholder="yours@example.com"
            {...register('email')}
          />

          <PasswordField
            autoComplete="current-password"
            error={Boolean(errors.password)}
            fullWidth
            helperText={errors.password?.message}
            label="Enter your password"
            {...register('password')}
          />
        </Stack>

        <Box className="auth-form-options">
          <FormControlLabel
            control={(
              <Controller
                control={control}
                name="rememberMe"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event.target.checked)
                    }}
                    size="small"
                    slotProps={{
                      input: {
                        ref: field.ref,
                      },
                    }}
                  />
                )}
              />
            )}
            label="Remember me"
          />
          <Link
            component="button"
            onClick={onForgotPasswordClick}
            type="button"
            underline="none"
          >
            Forgot Password ?
          </Link>
        </Box>

        <Button
          disabled={isSubmitting}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
        >
          Login
        </Button>

        <Typography className="auth-switch-copy">
          Don&apos;t have an Account ?{' '}
          <Link component="button" onClick={onRegisterClick} type="button" underline="none">
            Register
          </Link>
        </Typography>
      </Stack>
    </Box>
  )
}
