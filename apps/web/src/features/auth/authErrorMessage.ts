import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors'

const DEFAULT_AUTH_ERROR_MESSAGE = 'Something went wrong. Please try again.'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  VALIDATION_ERROR: 'Please check your details and try again.',
}

export const getAuthErrorMessage = (error: unknown) => {
  if (CombinedGraphQLErrors.is(error)) {
    const graphQLError = error.errors[0]
    const errorCode = graphQLError?.extensions?.code

    if (typeof errorCode === 'string' && AUTH_ERROR_MESSAGES[errorCode]) {
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
