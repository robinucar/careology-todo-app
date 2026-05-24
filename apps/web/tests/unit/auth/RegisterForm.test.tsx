import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RegisterForm } from '../../../src/features/auth/components/RegisterForm'
import { renderWithTheme } from '../../helpers/render'

const renderRegisterForm = ({ isSubmitting = false } = {}) => {
  const onLoginClick = vi.fn()
  const onSubmit = vi.fn()

  renderWithTheme(
    <RegisterForm
      isSubmitting={isSubmitting}
      onLoginClick={onLoginClick}
      onSubmit={onSubmit}
    />,
  )

  return {
    onLoginClick,
    onSubmit,
    user: userEvent.setup(),
  }
}

describe('RegisterForm', () => {
  it('shows validation errors for empty register submissions', async () => {
    const { onSubmit, user } = renderRegisterForm()

    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Username must be at least 2 characters.')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(screen.getByText('Confirm your password.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows a validation error for invalid email format', async () => {
    const { onSubmit, user } = renderRegisterForm()

    await user.type(screen.getByLabelText('Enter your email'), 'not-an-email')
    await user.type(screen.getByLabelText('Enter your user name'), 'task master')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.type(screen.getByLabelText('Confirm your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('blocks submit when password and confirm password do not match', async () => {
    const { onSubmit, user } = renderRegisterForm()

    await user.type(screen.getByLabelText('Enter your email'), 'new-user@example.com')
    await user.type(screen.getByLabelText('Enter your user name'), 'task master')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.type(screen.getByLabelText('Confirm your password'), 'different123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(await screen.findByText('Passwords must match.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits normalised register values when input is valid', async () => {
    const { onSubmit, user } = renderRegisterForm()

    await user.type(screen.getByLabelText('Enter your email'), 'NEW@Example.COM')
    await user.type(screen.getByLabelText('Enter your user name'), '  task master  ')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.type(screen.getByLabelText('Confirm your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(onSubmit.mock.calls[0]?.[0]).toEqual({
      confirmPassword: 'password123',
      email: 'new@example.com',
      password: 'password123',
      username: 'task master',
    })
  })

  it('delegates switching back to login', async () => {
    const { onLoginClick, user } = renderRegisterForm()

    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(onLoginClick).toHaveBeenCalledTimes(1)
  })

  it('disables the submit button while a register request is in progress', () => {
    renderRegisterForm({ isSubmitting: true })

    expect(screen.getByRole('button', { name: 'Register' })).toBeDisabled()
  })

  it('toggles both password fields independently', async () => {
    const { user } = renderRegisterForm()
    const passwordInput = screen.getByLabelText('Enter your password')
    const confirmPasswordInput = screen.getByLabelText('Confirm your password')
    const showPasswordButtons = screen.getAllByRole('button', { name: 'Show password' })

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(confirmPasswordInput).toHaveAttribute('type', 'password')

    await user.click(showPasswordButtons[0]!)
    await user.click(showPasswordButtons[1]!)

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    expect(screen.getAllByRole('button', { name: 'Hide password' })).toHaveLength(2)
  })
})
