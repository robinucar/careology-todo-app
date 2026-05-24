import type { MockLink } from '@apollo/client/testing'
import { MockedProvider } from '@apollo/client/testing/react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  clearStoredAuthSession,
  type AuthSession,
} from '../../../src/app/authSession'
import { AuthPage } from '../../../src/features/auth/AuthPage'
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../../../src/features/auth/authOperations'
import { renderWithTheme } from '../../helpers/render'

const STORAGE_KEY = 'careology.auth.session'

const authPayload: AuthSession = {
  token: 'test-token',
  user: {
    id: 'user-1',
    name: 'Task Master',
    email: 'task.master@example.com',
  },
}

const renderAuthPage = (mocks: ReadonlyArray<MockLink.MockedResponse> = []) => {
  renderWithTheme(
    <MockedProvider mocks={mocks} showWarnings={false}>
      <AuthPage />
    </MockedProvider>,
  )

  return userEvent.setup()
}

describe('AuthPage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('moves to the authenticated shell after a successful login and stores a session', async () => {
    const user = renderAuthPage([
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            input: {
              email: 'task.master@example.com',
              password: 'password123',
            },
          },
        },
        result: {
          data: {
            login: authPayload,
          },
        },
      },
    ])

    await user.type(screen.getByLabelText('Enter your email'), 'task.master@example.com')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(
      await screen.findByRole('heading', { name: 'My Tasks for the next month' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Signed in as Task Master')).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '')).toEqual(authPayload)
  })

  it('stores remembered login sessions in localStorage', async () => {
    const user = renderAuthPage([
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            input: {
              email: 'task.master@example.com',
              password: 'password123',
            },
          },
        },
        result: {
          data: {
            login: authPayload,
          },
        },
      },
    ])

    await user.type(screen.getByLabelText('Enter your email'), 'task.master@example.com')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.click(screen.getByRole('checkbox', { name: 'Remember me' }))
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(
      await screen.findByRole('heading', { name: 'My Tasks for the next month' }),
    ).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual(authPayload)
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('disables the login button while the login mutation is in flight', async () => {
    const user = renderAuthPage([
      {
        delay: 50,
        request: {
          query: LOGIN_MUTATION,
          variables: {
            input: {
              email: 'task.master@example.com',
              password: 'password123',
            },
          },
        },
        result: {
          data: {
            login: authPayload,
          },
        },
      },
    ])

    await user.type(screen.getByLabelText('Enter your email'), 'task.master@example.com')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled()
    })
    expect(
      await screen.findByRole('heading', { name: 'My Tasks for the next month' }),
    ).toBeInTheDocument()
  })

  it('shows the backend invalid credentials message for failed login attempts', async () => {
    const user = renderAuthPage([
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            input: {
              email: 'task.master@example.com',
              password: 'wrong-password',
            },
          },
        },
        result: {
          data: null,
          errors: [
            new GraphQLError('Invalid email or password.', {
              extensions: {
                code: 'INVALID_CREDENTIALS',
              },
            }),
          ],
        },
      },
    ])

    await user.type(screen.getByLabelText('Enter your email'), 'task.master@example.com')
    await user.type(screen.getByLabelText('Enter your password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'My Tasks for the next month' })).not.toBeInTheDocument()
  })

  it('moves to the authenticated shell after successful registration', async () => {
    const user = renderAuthPage([
      {
        request: {
          query: REGISTER_MUTATION,
          variables: {
            input: {
              name: 'task master',
              email: 'new-user@example.com',
              password: 'password123',
            },
          },
        },
        result: {
          data: {
            register: {
              ...authPayload,
              user: {
                ...authPayload.user,
                email: 'new-user@example.com',
                name: 'task master',
              },
            },
          },
        },
      },
    ])

    await user.click(screen.getByRole('button', { name: 'Register' }))
    await user.type(screen.getByLabelText('Enter your email'), 'new-user@example.com')
    await user.type(screen.getByLabelText('Enter your user name'), 'task master')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.type(screen.getByLabelText('Confirm your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(
      await screen.findByRole('heading', { name: 'My Tasks for the next month' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Signed in as task master')).toBeInTheDocument()
  })

  it('shows the backend duplicate email message for failed registrations', async () => {
    const user = renderAuthPage([
      {
        request: {
          query: REGISTER_MUTATION,
          variables: {
            input: {
              name: 'task master',
              email: 'existing-user@example.com',
              password: 'password123',
            },
          },
        },
        result: {
          data: null,
          errors: [
            new GraphQLError('An account with this email already exists.', {
              extensions: {
                code: 'EMAIL_ALREADY_EXISTS',
              },
            }),
          ],
        },
      },
    ])

    await user.click(screen.getByRole('button', { name: 'Register' }))
    await user.type(screen.getByLabelText('Enter your email'), 'existing-user@example.com')
    await user.type(screen.getByLabelText('Enter your user name'), 'task master')
    await user.type(screen.getByLabelText('Enter your password'), 'password123')
    await user.type(screen.getByLabelText('Confirm your password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'My Tasks for the next month' })).not.toBeInTheDocument()
  })

  it('shows a demo-scope message for forgot password', async () => {
    const user = renderAuthPage()

    await user.click(screen.getByRole('button', { name: 'Forgot Password ?' }))

    expect(
      await screen.findByText('Password reset is not available in this demo.'),
    ).toBeInTheDocument()
  })

  it('loads an existing session and logs out back to the login screen', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authPayload))
    const user = renderAuthPage()

    expect(
      await screen.findByRole('heading', { name: 'My Tasks for the next month' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign in to get things done' }),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('You have been logged out.')).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('returns to login when the stored auth session is cleared globally', async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authPayload))
    renderAuthPage()

    expect(
      await screen.findByRole('heading', { name: 'My Tasks for the next month' }),
    ).toBeInTheDocument()

    clearStoredAuthSession()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Sign in to get things done' }),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Your session has expired. Please sign in again.')).toBeInTheDocument()
  })
})
