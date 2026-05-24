import { prisma } from "../db/prisma.js";

export type GraphQLContext = {
  requestId: string;
  prisma: typeof prisma;
};

export const createContext = async (): Promise<GraphQLContext> => {
  return {
    requestId: crypto.randomUUID(),
    prisma,
  };
};
