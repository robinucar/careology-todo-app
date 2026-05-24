import type { GraphQLResponse } from "@apollo/server";
import type { FormattedExecutionResult } from "graphql";
import { afterEach, vi } from "vitest";

import type { createGraphQLServer } from "../../src/graphql/server.js";

type TestServer = ReturnType<typeof createGraphQLServer>;

const testServers: TestServer[] = [];

export const createTestGraphQLServer = async (): Promise<TestServer> => {
  vi.resetModules();
  vi.stubEnv("JWT_SECRET", "test-jwt-secret-value-that-is-long-enough");
  vi.stubEnv("JWT_EXPIRES_IN", "1h");

  const { createGraphQLServer } = await import("../../src/graphql/server.js");
  const server = createGraphQLServer();

  testServers.push(server);

  return server;
};

export const getSingleResult = <TData>(
  response: GraphQLResponse<TData>,
): FormattedExecutionResult<TData> => {
  if (response.body.kind !== "single") {
    throw new Error("Expected a single GraphQL response.");
  }

  return response.body.singleResult;
};

export const registerGraphQLTestCleanup = () => {
  afterEach(async () => {
    await Promise.all(testServers.splice(0).map((server) => server.stop()));
    vi.unstubAllEnvs();
  });
};
