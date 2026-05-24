import type { IncomingMessage } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

import { signAuthToken } from "../../../src/auth/token.js";

const mocks = vi.hoisted(() => {
  return {
    prisma: {
      user: {},
    },
  };
});

vi.mock("../../../src/db/prisma.js", () => {
  return {
    prisma: mocks.prisma,
  };
});

const tokenConfig = {
  jwtSecret: "test-jwt-secret-value-that-is-long-enough",
  jwtExpiresIn: "1h",
} as const;

const loadCreateContext = async () => {
  vi.resetModules();
  vi.stubEnv("JWT_SECRET", tokenConfig.jwtSecret);

  const module = await import("../../../src/context/context.js");

  return module.createContext;
};

const createRequest = (
  authorization: string | string[] | undefined,
): IncomingMessage => {
  return {
    headers: {
      authorization,
    },
  } as IncomingMessage;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createContext", () => {
  it("creates an anonymous context when no authorization header is present", async () => {
    const createContext = await loadCreateContext();

    const context = await createContext({
      req: createRequest(undefined),
    });

    expect(context).toEqual({
      requestId: expect.any(String),
      prisma: mocks.prisma,
      currentUserId: null,
    });
  });

  it("adds currentUserId for valid bearer tokens", async () => {
    const createContext = await loadCreateContext();
    const token = signAuthToken({ userId: "user_123" }, tokenConfig);

    const context = await createContext({
      req: createRequest(`Bearer ${token}`),
    });

    expect(context.currentUserId).toBe("user_123");
  });

  it("rejects invalid authorization headers", async () => {
    const createContext = await loadCreateContext();

    await expect(
      createContext({
        req: createRequest("Basic token"),
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Invalid authorization header.",
    });
  });

  it("rejects invalid bearer tokens", async () => {
    const createContext = await loadCreateContext();

    await expect(
      createContext({
        req: createRequest("Bearer not-a-token"),
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
      message: "Invalid or expired authentication token.",
    });
  });
});
