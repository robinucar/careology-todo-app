import { describe, expect, it, vi } from "vitest";

import {
  createAuthRepository,
  type AuthRepositoryPrismaClient,
} from "../../../src/auth/authRepository.js";
import { Prisma } from "../../../src/generated/prisma/client.js";
import { ERROR_CODES } from "../../../src/errors/index.js";

const createPrismaClient = () => {
  const findUnique = vi.fn();
  const create = vi.fn();

  return {
    findUnique,
    create,
    prisma: {
      user: {
        findUnique,
        create,
      },
    } as unknown as AuthRepositoryPrismaClient,
  };
};

describe("createAuthRepository", () => {
  it("finds users by email with password hash for credential checks", async () => {
    const { findUnique, prisma } = createPrismaClient();
    const repository = createAuthRepository(prisma);

    findUnique.mockResolvedValue({
      id: "user_123",
      email: "user@example.com",
      passwordHash: "stored-password-hash",
    });

    await expect(repository.findUserByEmail("user@example.com")).resolves.toEqual({
      id: "user_123",
      email: "user@example.com",
      passwordHash: "stored-password-hash",
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        email: "user@example.com",
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
  });

  it("creates users without returning password hashes", async () => {
    const { create, prisma } = createPrismaClient();
    const repository = createAuthRepository(prisma);

    create.mockResolvedValue({
      id: "user_123",
      email: "user@example.com",
    });

    await expect(
      repository.createUser({
        email: "user@example.com",
        passwordHash: "hashed-password",
      }),
    ).resolves.toEqual({
      id: "user_123",
      email: "user@example.com",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        email: "user@example.com",
        passwordHash: "hashed-password",
      },
      select: {
        id: true,
        email: true,
      },
    });
  });

  it("maps unique email races to email already exists errors", async () => {
    const { create, prisma } = createPrismaClient();
    const repository = createAuthRepository(prisma);

    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: {
          target: ["email"],
        },
      }),
    );

    await expect(
      repository.createUser({
        email: "user@example.com",
        passwordHash: "hashed-password",
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.emailAlreadyExists,
      message: "An account with this email already exists.",
    });
  });
});
