import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { CombinedGraphQLErrors } from '@apollo/client/errors'
import { SetContextLink } from '@apollo/client/link/context'
import { ErrorLink } from '@apollo/client/link/error'
import { ERROR_CODES } from '@careology/shared'

import { clearStoredAuthSession, getStoredAuthSession } from './authSession'
import { appConfig } from './config'

const isUnauthenticatedError = (error: unknown) => {
  return CombinedGraphQLErrors.is(error) && error.errors.some((graphQLError) => {
    return graphQLError.extensions?.code === ERROR_CODES.unauthenticated
  })
}

const errorLink = new ErrorLink(({ error }) => {
  if (isUnauthenticatedError(error)) {
    clearStoredAuthSession()
  }
})

const authLink = new SetContextLink((previousContext) => {
  const token = getStoredAuthSession()?.token

  if (!token) {
    return {}
  }

  return {
    headers: {
      ...previousContext.headers,
      authorization: `Bearer ${token}`,
    },
  }
})

const httpLink = new HttpLink({
  uri: appConfig.graphqlUrl,
})

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: errorLink.concat(authLink).concat(httpLink),
})
