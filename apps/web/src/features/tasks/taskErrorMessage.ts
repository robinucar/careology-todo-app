import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors'
import { ERROR_CODES, type ErrorCode } from '@careology/shared'

const DEFAULT_TASK_ERROR_MESSAGE = 'Something went wrong. Please try again.'

const TASK_ERROR_MESSAGES = {
  [ERROR_CODES.forbidden]: 'You do not have permission to update this task.',
  [ERROR_CODES.notFound]: 'This task could not be found.',
  [ERROR_CODES.unauthenticated]: 'Please sign in again to manage tasks.',
  [ERROR_CODES.validationError]: 'Please check the task details and try again.',
} satisfies Partial<Record<ErrorCode, string>>

export const getTaskErrorMessage = (error: unknown): string => {
  if (CombinedGraphQLErrors.is(error)) {
    const graphQLError = error.errors[0]
    const errorCode = graphQLError?.extensions?.code

    if (isKnownTaskErrorCode(errorCode)) {
      return TASK_ERROR_MESSAGES[errorCode]
    }

    return graphQLError?.message || DEFAULT_TASK_ERROR_MESSAGE
  }

  if (ServerError.is(error)) {
    return 'The server could not process the request. Please try again.'
  }

  if (error instanceof TypeError) {
    return 'Could not connect to the server. Please try again.'
  }

  return DEFAULT_TASK_ERROR_MESSAGE
}

const isKnownTaskErrorCode = (
  errorCode: unknown,
): errorCode is keyof typeof TASK_ERROR_MESSAGES => {
  return typeof errorCode === 'string' && errorCode in TASK_ERROR_MESSAGES
}
