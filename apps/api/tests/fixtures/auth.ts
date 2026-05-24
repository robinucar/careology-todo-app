import { vi } from "vitest";

import type { GraphQLContext } from "../../src/context/context.js";

export const authFixture = {
  email: "manual-auth-test@example.com",
  emailInput: " MANUAL-AUTH-TEST@example.COM ",
  id: "user_123",
  password: "password123",
  wrongPassword: "wrong-password",
} as const;

export type MockPrismaUser = {
  create: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
};

export const createMockPrismaUser = (): MockPrismaUser => {
  return {
    create: vi.fn(),
    findUnique: vi.fn(),
  };
};

export const createMockGraphQLContext = (
  user: MockPrismaUser,
  currentUserId: string | null = null,
): GraphQLContext => {
  return {
    requestId: "request_123",
    prisma: {
      user,
    },
    currentUserId,
  } as unknown as GraphQLContext;
};

export const createAuthUser = (
  overrides: Partial<{
    email: string;
    id: string;
  }> = {},
) => {
  return {
    id: overrides.id ?? authFixture.id,
    email: overrides.email ?? authFixture.email,
  };
};

export const createAuthUserWithPasswordHash = (
  passwordHash: string,
  overrides: Partial<{
    email: string;
    id: string;
  }> = {},
) => {
  return {
    ...createAuthUser(overrides),
    passwordHash,
  };
};
