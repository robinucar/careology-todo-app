const DEFAULT_GRAPHQL_URL = 'http://localhost:4000/'

export const appConfig = {
  graphqlUrl: import.meta.env.VITE_GRAPHQL_URL?.trim() || DEFAULT_GRAPHQL_URL,
}
