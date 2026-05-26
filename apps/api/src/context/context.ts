import type { IncomingHttpHeaders } from "node:http";

import { getCurrentUserIdFromAuthorizationHeader } from "../auth/authHeader.js";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";

export type GraphQLContext = {
  requestId: string;
  prisma: typeof prisma;
  currentUserId: string | null;
};

type ContextRequest = {
  headers: Pick<IncomingHttpHeaders, "authorization">;
};

type CreateContextArgs = {
  req?: ContextRequest;
};

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
