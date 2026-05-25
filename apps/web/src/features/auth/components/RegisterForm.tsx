import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Link, Stack, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'

import {
  registerFormSchema,
  type RegisterFormValues,
} from '../authSchemas'
import { AuthTextField } from './AuthTextField'
import { PasswordField } from './PasswordField'

type RegisterFormProps = {
  isSubmitting?: boolean
  onLoginClick: () => void
  onSubmit: (values: RegisterFormValues) => void | Promise<void>
}

export const RegisterForm = ({
  isSubmitting = false,
  onLoginClick,
  onSubmit,
}: RegisterFormProps) => {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      confirmPassword: '',
      email: '',
      password: '',
      username: '',
    },
    resolver: zodResolver(registerFormSchema),
  })

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3.5}>
        <Box>
          <Typography className="auth-welcome">Welcome !</Typography>
          <Typography
            aria-label="Sign up to get things done"
            className="auth-title"
            component="h1"
          >
            Sign up to
          </Typography>
          <Typography aria-hidden="true" className="auth-subtitle">
            get things done ✨
          </Typography>
        </Box>

        <Stack spacing={2.25}>
          <AuthTextField
            autoComplete="email"
            error={Boolean(errors.email)}
            fullWidth
            helperText={errors.email?.message}
            label="Enter your email"
            placeholder="yours@example.com"
            {...register('email')}
          />

          <AuthTextField
            autoComplete="name"
            error={Boolean(errors.username)}
            fullWidth
            helperText={errors.username?.message}
            label="Enter your user name"
            placeholder="task master"
            {...register('username')}
          />

          <PasswordField
            autoComplete="new-password"
            error={Boolean(errors.password)}
            fullWidth
            helperText={errors.password?.message}
            label="Enter your password"
            {...register('password')}
          />

          <PasswordField
            autoComplete="new-password"
            error={Boolean(errors.confirmPassword)}
            fullWidth
            helperText={errors.confirmPassword?.message}
            label="Confirm your password"
            {...register('confirmPassword')}
          />
        </Stack>

        <Button
          disabled={isSubmitting}
          fullWidth
          size="large"
          type="submit"
          variant="contained"
        >
          Register
        </Button>

        <Typography className="auth-switch-copy">
          Already have an Account ?{' '}
          <Link component="button" onClick={onLoginClick} type="button" underline="none">
            Login
          </Link>
        </Typography>
      </Stack>
    </Box>
  )
}
