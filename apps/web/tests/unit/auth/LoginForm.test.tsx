import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginForm } from '../../../src/features/auth/components/LoginForm'
import { renderWithTheme } from '../../helpers/render'

const renderLoginForm = ({ isSubmitting = false } = {}) => {
  const onForgotPasswordClick = vi.fn()
  const onRegisterClick = vi.fn()
  const onSubmit = vi.fn()

  renderWithTheme(
    <LoginForm
      isSubmitting={isSubmitting}
      onForgotPasswordClick={onForgotPasswordClick}
      onRegisterClick={onRegisterClick}
      onSubmit={onSubmit}
    />,
  )

  return {
    onForgotPasswordClick,
    onRegisterClick,
    onSubmit,
    user: userEvent.setup(),
  }
}

describe('LoginForm', () => {
  it('shows validation errors for empty login submissions', async () => {
    const { onSubmit, user } = renderLoginForm()

    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows a validation error for invalid email format', async () => {
    const { onSubmit, user } = renderLoginForm()

    await user.type(screen.getByLabelText('Enter your email'), 'not-an-email')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits normalised login values with remember me enabled', async () => {
    const { onSubmit, user } = renderLoginForm()

    await user.type(screen.getByLabelText('Enter your email'), 'USER@Example.COM')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.click(screen.getByRole('checkbox', { name: 'Remember me' }))
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: 'user@example.com',
      password: 'password123',
      rememberMe: true,
    })
  })

  it('keeps remember me false by default in the submit payload', async () => {
    const { onSubmit, user } = renderLoginForm()

    await user.type(screen.getByLabelText('Enter your email'), 'user@example.com')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      email: 'user@example.com',
      password: 'password123',
      rememberMe: false,
    })
  })

  it('delegates auth mode and forgot password actions', async () => {
    const { onForgotPasswordClick, onRegisterClick, user } = renderLoginForm()

    await user.click(screen.getByRole('button', { name: 'Forgot Password ?' }))
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(onForgotPasswordClick).toHaveBeenCalledTimes(1)
    expect(onRegisterClick).toHaveBeenCalledTimes(1)
  })

  it('disables the submit button while a login request is in progress', () => {
    renderLoginForm({ isSubmitting: true })

    expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled()
  })

  it('toggles password visibility from the password action button', async () => {
    const { user } = renderLoginForm()
    const passwordInput = screen.getByLabelText('Enter your password')

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
  })
})
