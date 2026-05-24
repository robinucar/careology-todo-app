import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

import { appConfig } from './config'

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: appConfig.graphqlUrl,
  }),
})
