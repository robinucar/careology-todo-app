import { ApolloServer } from "@apollo/server";

import { formatGraphQLError } from "../errors/formatGraphQLError.js";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./typeDefs.js";

export const createGraphQLServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    formatError: formatGraphQLError,
  });
};