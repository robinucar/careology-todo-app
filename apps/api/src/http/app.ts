import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import cors from "cors";
import express from "express";

import { createContext, type GraphQLContext } from "../context/context.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const defaultWebDistPath = resolve(currentDir, "../../../web/dist");

type CreateHttpAppOptions = {
  graphqlServer: ApolloServer<GraphQLContext>;
  webDistPath?: string;
};

export const createHttpApp = ({
  graphqlServer,
  webDistPath = defaultWebDistPath,
}: CreateHttpAppOptions) => {
  const app = express();
  const indexHtmlPath = resolve(webDistPath, "index.html");

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(graphqlServer, {
      context: createContext,
    }),
  );

  if (existsSync(indexHtmlPath)) {
    app.use(express.static(webDistPath));
    app.get(/.*/, (_request, response) => {
      response.sendFile(indexHtmlPath);
    });
  }

  return app;
};
