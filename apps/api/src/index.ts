import "dotenv/config";

import { env } from "./config/env.js";
import { createGraphQLServer } from "./graphql/server.js";
import { createHttpApp } from "./http/app.js";

const graphqlServer = createGraphQLServer();
await graphqlServer.start();

const app = createHttpApp({
  graphqlServer,
});

const httpServer = app.listen(env.port);

const shutdown = async () => {
  httpServer.close();
  await graphqlServer.stop();
};

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});
