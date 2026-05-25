import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors'
import { ERROR_CODES, type ErrorCode } from '@careology/shared'

const DEFAULT_AUTH_ERROR_MESSAGE = 'Something went wrong. Please try again.'

const AUTH_ERROR_MESSAGES = {
  [ERROR_CODES.emailAlreadyExists]: 'An account with this email already exists.',
  [ERROR_CODES.invalidCredentials]: 'Invalid email or password.',
  [ERROR_CODES.validationError]: 'Please check your details and try again.',
} satisfies Partial<Record<ErrorCode, string>>

export const getAuthErrorMessage = (error: unknown) => {
  if (CombinedGraphQLErrors.is(error)) {
    const graphQLError = error.errors[0]
    const errorCode = graphQLError?.extensions?.code

    if (isKnownAuthErrorCode(errorCode)) {
      return AUTH_ERROR_MESSAGES[errorCode]
    }

    return graphQLError?.message || DEFAULT_AUTH_ERROR_MESSAGE
  }

  if (ServerError.is(error)) {
    return 'The server could not process the request. Please try again.'
  }

  if (error instanceof TypeError) {
    return 'Could not connect to the server. Please try again.'
  }

  return DEFAULT_AUTH_ERROR_MESSAGE
}

const isKnownAuthErrorCode = (
  errorCode: unknown,
): errorCode is keyof typeof AUTH_ERROR_MESSAGES => {
  return typeof errorCode === 'string' && errorCode in AUTH_ERROR_MESSAGES
}
