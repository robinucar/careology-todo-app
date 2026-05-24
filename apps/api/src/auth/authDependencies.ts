import type { AuthServiceDependencies } from "./authService.js";
import {
  createAuthRepository,
  type AuthRepositoryPrismaClient,
} from "./authRepository.js";
import { hashPassword, verifyPassword } from "./password.js";
import { signAuthToken, type AuthTokenConfig } from "./token.js";

type CreateAuthServiceDependenciesInput = {
  prisma: AuthRepositoryPrismaClient;
  tokenConfig: AuthTokenConfig;
};

export const createAuthServiceDependencies = ({
  prisma,
  tokenConfig,
}: CreateAuthServiceDependenciesInput): AuthServiceDependencies => {
  return {
    ...createAuthRepository(prisma),
    hashPassword,
    verifyPassword,
    signAuthToken,
    tokenConfig,
  };
};
