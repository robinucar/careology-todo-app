import { Prisma } from "../generated/prisma/client.js";
import { AppError, ERROR_CODES } from "../errors/index.js";
import type { prisma } from "../db/prisma.js";
import type { AuthServiceDependencies } from "./authService.js";

export type AuthRepositoryPrismaClient = Pick<typeof prisma, "user">;

type AuthRepository = Pick<
  AuthServiceDependencies,
  "createUser" | "findUserByEmail"
>;

const authUserSelect = {
  id: true,
  name: true,
  email: true,
} as const;

const authUserWithPasswordSelect = {
  ...authUserSelect,
  passwordHash: true,
} as const;

const isPrismaUniqueConstraintError = (error: unknown): boolean => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
};

const createEmailAlreadyExistsError = (cause?: unknown) => {
  return new AppError({
    code: ERROR_CODES.emailAlreadyExists,
    message: "An account with this email already exists.",
    cause,
  });
};

export const createAuthRepository = (
  prismaClient: AuthRepositoryPrismaClient,
): AuthRepository => {
  return {
    findUserByEmail: (email) => {
      return prismaClient.user.findUnique({
        where: {
          email,
        },
        select: authUserWithPasswordSelect,
      });
    },
    createUser: async ({ email, name, passwordHash }) => {
      try {
        return await prismaClient.user.create({
          data: {
            email,
            name,
            passwordHash,
          },
          select: authUserSelect,
        });
      } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
          throw createEmailAlreadyExistsError(error);
        }

        throw error;
      }
    },
  };
};
