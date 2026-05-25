import { Alert } from '@mui/material'
import { useApolloClient, useMutation } from '@apollo/client/react'
import { useEffect, useState } from 'react'

import type { AuthSession } from '../../app/authSession'
import {
  AUTH_SESSION_CLEARED_EVENT,
  clearStoredAuthSession,
  getStoredAuthSession,
  storeAuthSession,
} from '../../app/authSession'
import './auth.css'
import { getAuthErrorMessage } from './authErrorMessage'
import { LOGIN_MUTATION, REGISTER_MUTATION } from './authOperations'
import {
  toLoginInput,
  toRegisterInput,
  type LoginFormValues,
  type RegisterFormValues,
} from './authSchemas'
import type {
  AuthPayload,
  LoginMutationData,
  LoginMutationVariables,
  RegisterMutationData,
  RegisterMutationVariables,
} from './authTypes'
import { AuthenticatedApp } from './components/AuthenticatedApp'
import { AuthLayout } from './components/AuthLayout'
import { LoginForm } from './components/LoginForm'
import { RegisterForm } from './components/RegisterForm'

type AuthMode = 'login' | 'register'
type AuthNotice = {
  message: string
  severity: 'error' | 'info' | 'success'
}

export const AuthPage = () => {
  const apolloClient = useApolloClient()
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [authNotice, setAuthNotice] = useState<AuthNotice | null>(null)
  const [authSession, setAuthSession] = useState<AuthSession | null>(
    getStoredAuthSession,
  )
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [login, loginResult] = useMutation<
    LoginMutationData,
    LoginMutationVariables
  >(LOGIN_MUTATION)
  const [registerUser, registerResult] = useMutation<
    RegisterMutationData,
    RegisterMutationVariables
  >(REGISTER_MUTATION)

  useEffect(() => {
    const handleSessionCleared = () => {
      setAuthMode('login')
      setAuthSession(null)
      setAuthNotice({
        message: 'Your session has expired. Please sign in again.',
        severity: 'error',
      })
    }

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared)

    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared)
    }
  }, [])

  const showLogin = authMode === 'login'
  const isSubmitting = loginResult.loading || registerResult.loading

  const handleAuthSuccess = (payload: AuthPayload) => {
    setAuthSession(payload)
    setAuthNotice(null)
  }

  const handleForgotPasswordClick = () => {
    setAuthNotice({
      message: 'Password reset is not available in this demo.',
      severity: 'info',
    })
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    clearStoredAuthSession()

    try {
      await apolloClient.clearStore()
    } finally {
      setAuthMode('login')
      setAuthSession(null)
      setAuthNotice({
        message: 'You have been logged out.',
        severity: 'info',
      })
      setIsLoggingOut(false)
    }
  }

  const handleLoginSubmit = async (values: LoginFormValues) => {
    setAuthNotice(null)

    try {
      const result = await login({
        variables: {
          input: toLoginInput(values),
        },
      })

      if (!result.data?.login) {
        throw new Error('Login did not return an auth session.')
      }

      storeAuthSession(result.data.login, values.rememberMe ? 'local' : 'session')
      handleAuthSuccess(result.data.login)
    } catch (error) {
      setAuthNotice({
        message: getAuthErrorMessage(error),
        severity: 'error',
      })
    }
  }

  const handleRegisterSubmit = async (values: RegisterFormValues) => {
    setAuthNotice(null)

    try {
      const result = await registerUser({
        variables: {
          input: toRegisterInput(values),
        },
      })

      if (!result.data?.register) {
        throw new Error('Register did not return an auth session.')
      }

      storeAuthSession(result.data.register, 'session')
      handleAuthSuccess(result.data.register)
    } catch (error) {
      setAuthNotice({
        message: getAuthErrorMessage(error),
        severity: 'error',
      })
    }
  }

  if (authSession) {
    return (
      <AuthenticatedApp
        isLoggingOut={isLoggingOut}
        onLogout={handleLogout}
        session={authSession}
      />
    )
  }

  return (
    <AuthLayout>
      {authNotice ? (
        <Alert severity={authNotice.severity} sx={{ mb: 3 }}>
          {authNotice.message}
        </Alert>
      ) : null}

      {showLogin ? (
        <LoginForm
          isSubmitting={isSubmitting}
          onForgotPasswordClick={handleForgotPasswordClick}
          onRegisterClick={() => {
            setAuthNotice(null)
            setAuthMode('register')
          }}
          onSubmit={handleLoginSubmit}
        />
      ) : (
        <RegisterForm
          isSubmitting={isSubmitting}
          onLoginClick={() => {
            setAuthNotice(null)
            setAuthMode('login')
          }}
          onSubmit={handleRegisterSubmit}
        />
      )}
    </AuthLayout>
  )
}
