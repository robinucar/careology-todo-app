import "dotenv/config";

import { startStandaloneServer } from "@apollo/server/standalone";

import { env } from "./config/env.js";
import { createContext } from "./context/context.js";
import { createGraphQLServer } from "./graphql/server.js";

const server = createGraphQLServer();

const { url } = await startStandaloneServer(server, {
  listen: {
    port: env.port,
  },
  context: createContext,
});

console.log(`API server ready at ${url}`);
