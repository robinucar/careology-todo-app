import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";

import { getCurrentUserIdFromAuthorizationHeader } from "../auth/authHeader.js";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

export type GraphQLContext = {
  requestId: string;
  prisma: typeof prisma;
  currentUserId: string | null;
};

type CreateContextArgs = Partial<StandaloneServerContextFunctionArgument>;

export const createContext = async ({
  req,
}: CreateContextArgs = {}): Promise<GraphQLContext> => {
  return {
    requestId: crypto.randomUUID(),
    prisma,
    currentUserId: getCurrentUserIdFromAuthorizationHeader(
      req?.headers.authorization,
      {
        jwtSecret: env.jwtSecret,
      },
    ),
  };
};
