const DEFAULT_GRAPHQL_URL = '/graphql'

export const appConfig = {
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL?.trim() || DEFAULT_GRAPHQL_URL,
}
