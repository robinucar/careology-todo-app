import type { GraphQLResponse } from "@apollo/server";
import type { FormattedExecutionResult } from "graphql";
import { afterEach, describe, expect, it, vi } from "vitest";

import { hashPassword } from "../../../src/auth/password.js";
import type { createGraphQLServer } from "../../../src/graphql/server.js";
import {
  authFixture,
  createAuthUser,
  createAuthUserWithPasswordHash,
  createMockGraphQLContext,
  createMockPrismaUser,
} from "../../fixtures/auth.js";

type TestServer = ReturnType<typeof createGraphQLServer>;

const testServers: TestServer[] = [];

const createTestServer = async (): Promise<TestServer> => {
  vi.resetModules();
  vi.stubEnv("JWT_SECRET", "test-jwt-secret-value-that-is-long-enough");
  vi.stubEnv("JWT_EXPIRES_IN", "1h");

  const { createGraphQLServer } = await import("../../../src/graphql/server.js");

  const server = createGraphQLServer();

  testServers.push(server);

  return server;
};

const getSingleResult = <TData>(
  response: GraphQLResponse<TData>,
): FormattedExecutionResult<TData> => {
  if (response.body.kind !== "single") {
    throw new Error("Expected a single GraphQL response.");
  }

  return response.body.singleResult;
};

afterEach(async () => {
  await Promise.all(testServers.splice(0).map((server) => server.stop()));
  vi.unstubAllEnvs();
});

describe("auth GraphQL integration", () => {
  it("registers a new user through GraphQL", async () => {
    const server = await createTestServer();
    const user = createMockPrismaUser();

    user.findUnique.mockResolvedValue(null);
    user.create.mockResolvedValue(createAuthUser());

    const response = await server.executeOperation<{
      register: {
        token: string;
        user: {
          id: string;
          email: string;
        };
      };
    }>(
      {
        query: `#graphql
          mutation Register($input: RegisterInput!) {
            register(input: $input) {
              token
              user {
                id
                email
              }
            }
          }
        `,
        variables: {
          input: {
            email: authFixture.emailInput,
            password: authFixture.password,
          },
        },
      },
      {
        contextValue: createMockGraphQLContext(user),
      },
    );

    const result = getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.register.user).toEqual(createAuthUser());
    expect(result.data?.register.token).toEqual(expect.any(String));
    expect(result.data?.register.token.length).toBeGreaterThan(20);
    expect(user.findUnique).toHaveBeenCalledWith({
      where: {
        email: authFixture.email,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
    expect(user.create).toHaveBeenCalledWith({
      data: {
        email: authFixture.email,
        passwordHash: expect.stringMatching(/^\$2[aby]\$12\$/),
      },
      select: {
        id: true,
        email: true,
      },
    });
  });

  it("logs in an existing user through GraphQL", async () => {
    const server = await createTestServer();
    const user = createMockPrismaUser();
    const passwordHash = await hashPassword(authFixture.password);

    user.findUnique.mockResolvedValue(createAuthUserWithPasswordHash(passwordHash));

    const response = await server.executeOperation<{
      login: {
        token: string;
        user: {
          id: string;
          email: string;
        };
      };
    }>(
      {
        query: `#graphql
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              token
              user {
                id
                email
              }
            }
          }
        `,
        variables: {
          input: {
            email: authFixture.emailInput,
            password: authFixture.password,
          },
        },
      },
      {
        contextValue: createMockGraphQLContext(user),
      },
    );

    const result = getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.login.user).toEqual(createAuthUser());
    expect(result.data?.login.token).toEqual(expect.any(String));
    expect(result.data?.login.token.length).toBeGreaterThan(20);
    expect(user.create).not.toHaveBeenCalled();
  });

  it("returns a safe error for invalid login credentials", async () => {
    const server = await createTestServer();
    const user = createMockPrismaUser();
    const passwordHash = await hashPassword(authFixture.password);

    user.findUnique.mockResolvedValue(createAuthUserWithPasswordHash(passwordHash));

    const response = await server.executeOperation(
      {
        query: `#graphql
          mutation Login($input: LoginInput!) {
            login(input: $input) {
              token
              user {
                id
                email
              }
            }
          }
        `,
        variables: {
          input: {
            email: authFixture.email,
            password: authFixture.wrongPassword,
          },
        },
      },
      {
        contextValue: createMockGraphQLContext(user),
      },
    );

    const result = getSingleResult(response);

    expect(result.data).toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: "Invalid email or password.",
        extensions: {
          code: "INVALID_CREDENTIALS",
        },
      }),
    ]);
  });

  it("returns a safe error for duplicate registration", async () => {
    const server = await createTestServer();
    const user = createMockPrismaUser();

    user.findUnique.mockResolvedValue(
      createAuthUserWithPasswordHash("stored-password-hash"),
    );

    const response = await server.executeOperation(
      {
        query: `#graphql
          mutation Register($input: RegisterInput!) {
            register(input: $input) {
              token
              user {
                id
                email
              }
            }
          }
        `,
        variables: {
          input: {
            email: authFixture.email,
            password: authFixture.password,
          },
        },
      },
      {
        contextValue: createMockGraphQLContext(user),
      },
    );

    const result = getSingleResult(response);

    expect(result.data).toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: "An account with this email already exists.",
        extensions: {
          code: "EMAIL_ALREADY_EXISTS",
        },
      }),
    ]);
    expect(user.create).not.toHaveBeenCalled();
  });
});
