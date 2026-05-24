import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GraphQLContext } from "../../../src/context/context.js";

const mocks = vi.hoisted(() => {
  return {
    createAuthServiceDependencies: vi.fn(),
    loginUser: vi.fn(),
    registerUser: vi.fn(),
  };
});

vi.mock("../../../src/auth/authDependencies.js", () => {
  return {
    createAuthServiceDependencies: mocks.createAuthServiceDependencies,
  };
});

vi.mock("../../../src/auth/authService.js", () => {
  return {
    loginUser: mocks.loginUser,
    registerUser: mocks.registerUser,
  };
});

const createContext = (): GraphQLContext => {
  return {
    requestId: "request_123",
    prisma: {
      user: {},
    },
    currentUserId: null,
  } as unknown as GraphQLContext;
};

const loadResolvers = async () => {
  vi.resetModules();
  vi.stubEnv("JWT_SECRET", "test-jwt-secret-value-that-is-long-enough");
  vi.stubEnv("JWT_EXPIRES_IN", "1h");

  const module = await import("../../../src/graphql/resolvers.js");

  return module.resolvers;
};

beforeEach(() => {
  mocks.createAuthServiceDependencies.mockReturnValue("auth-dependencies");
  mocks.loginUser.mockResolvedValue({
    token: "login-token",
    user: {
      id: "user_123",
      email: "user@example.com",
    },
  });
  mocks.registerUser.mockResolvedValue({
    token: "register-token",
    user: {
      id: "user_123",
      email: "user@example.com",
    },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("resolvers", () => {
  it("resolves health checks", async () => {
    const resolvers = await loadResolvers();

    expect(resolvers.Query.health()).toBe("ok");
  });

  it("delegates register mutations to the auth service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const input = {
      email: "user@example.com",
      password: "password123",
    };

    await expect(
      resolvers.Mutation.register(undefined, { input }, context),
    ).resolves.toEqual({
      token: "register-token",
      user: {
        id: "user_123",
        email: "user@example.com",
      },
    });

    expect(mocks.createAuthServiceDependencies).toHaveBeenCalledWith({
      prisma: context.prisma,
      tokenConfig: {
        jwtSecret: "test-jwt-secret-value-that-is-long-enough",
        jwtExpiresIn: "1h",
      },
    });
    expect(mocks.registerUser).toHaveBeenCalledWith(input, "auth-dependencies");
  });

  it("delegates login mutations to the auth service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const input = {
      email: "user@example.com",
      password: "password123",
    };

    await expect(
      resolvers.Mutation.login(undefined, { input }, context),
    ).resolves.toEqual({
      token: "login-token",
      user: {
        id: "user_123",
        email: "user@example.com",
      },
    });

    expect(mocks.createAuthServiceDependencies).toHaveBeenCalledWith({
      prisma: context.prisma,
      tokenConfig: {
        jwtSecret: "test-jwt-secret-value-that-is-long-enough",
        jwtExpiresIn: "1h",
      },
    });
    expect(mocks.loginUser).toHaveBeenCalledWith(input, "auth-dependencies");
  });
});
