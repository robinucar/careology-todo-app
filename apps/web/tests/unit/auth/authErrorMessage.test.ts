import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors'
import { describe, expect, it } from 'vitest'

import { getAuthErrorMessage } from '../../../src/features/auth/authErrorMessage'

const createGraphQLError = (code: string, message = 'Server message') => {
  return new CombinedGraphQLErrors({
    data: null,
    errors: [
      {
        message,
        extensions: {
          code,
        },
      },
    ],
  })
}

describe('getAuthErrorMessage', () => {
  it.each([
    ['EMAIL_ALREADY_EXISTS', 'An account with this email already exists.'],
    ['INVALID_CREDENTIALS', 'Invalid email or password.'],
    ['VALIDATION_ERROR', 'Please check your details and try again.'],
  ])('maps %s to a user friendly message', (code, expectedMessage) => {
    expect(getAuthErrorMessage(createGraphQLError(code))).toBe(expectedMessage)
  })

  it('falls back to the GraphQL message for unknown app codes', () => {
    expect(getAuthErrorMessage(createGraphQLError('UNKNOWN_CODE', 'Custom server message'))).toBe(
      'Custom server message',
    )
  })

  it('returns a server message for HTTP server errors', () => {
    const error = new ServerError('Server failed', {
      bodyText: 'Internal server error',
      response: new Response(null, { status: 500 }),
    })

    expect(getAuthErrorMessage(error)).toBe(
      'The server could not process the request. Please try again.',
    )
  })

  it('returns a connection message for network-like TypeError failures', () => {
    expect(getAuthErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Could not connect to the server. Please try again.',
    )
  })

  it('returns a safe fallback for unknown errors', () => {
    expect(getAuthErrorMessage(new Error('Unexpected'))).toBe(
      'Something went wrong. Please try again.',
    )
  })
})
