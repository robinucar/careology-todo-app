import { describe, expect, it, vi } from "vitest";

import { createAuthServiceDependencies } from "../../../src/auth/authDependencies.js";
import type { AuthRepositoryPrismaClient } from "../../../src/auth/authRepository.js";
import { hashPassword, verifyPassword } from "../../../src/auth/password.js";
import { signAuthToken } from "../../../src/auth/token.js";

const tokenConfig = {
  jwtSecret: "test-jwt-secret-value-that-is-long-enough",
  jwtExpiresIn: "1h",
} as const;

describe("createAuthServiceDependencies", () => {
  it("wires repository, password, and token dependencies", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: "user_123",
      name: "Task Master",
      email: "user@example.com",
      passwordHash: "stored-password-hash",
    });
    const create = vi.fn();
    const prisma = {
      user: {
        findUnique,
        create,
      },
    } as unknown as AuthRepositoryPrismaClient;

    const dependencies = createAuthServiceDependencies({
      prisma,
      tokenConfig,
    });

    expect(dependencies.hashPassword).toBe(hashPassword);
    expect(dependencies.verifyPassword).toBe(verifyPassword);
    expect(dependencies.signAuthToken).toBe(signAuthToken);
    expect(dependencies.tokenConfig).toBe(tokenConfig);

    await expect(dependencies.findUserByEmail("user@example.com")).resolves.toEqual({
      id: "user_123",
      name: "Task Master",
      email: "user@example.com",
      passwordHash: "stored-password-hash",
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        email: "user@example.com",
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });
  });
});
