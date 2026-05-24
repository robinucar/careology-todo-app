import { ApolloServer } from "@apollo/server";

import type { GraphQLContext } from "../context/context.js";
import { formatGraphQLError } from "../errors/formatGraphQLError.js";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./typeDefs.js";

export const createGraphQLServer = (): ApolloServer<GraphQLContext> => {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    formatError: formatGraphQLError,
  });
};
