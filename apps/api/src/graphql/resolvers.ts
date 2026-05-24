import { createAuthServiceDependencies } from "../auth/authDependencies.js";
import {
  loginUser,
  registerUser,
  type AuthPayload,
} from "../auth/authService.js";
import { env } from "../config/env.js";
import type { GraphQLContext } from "../context/context.js";

type AuthMutationArgs = {
  input: unknown;
};

const createAuthDependencies = (context: GraphQLContext) => {
  return createAuthServiceDependencies({
    prisma: context.prisma,
    tokenConfig: {
      jwtSecret: env.jwtSecret,
      jwtExpiresIn: env.jwtExpiresIn,
    },
  });
};

export const resolvers = {
  Query: {
    health: () => "ok",
  },
  Mutation: {
    register: (
      _parent: unknown,
      args: AuthMutationArgs,
      context: GraphQLContext,
    ): Promise<AuthPayload> => {
      return registerUser(args.input, createAuthDependencies(context));
    },
    login: (
      _parent: unknown,
      args: AuthMutationArgs,
      context: GraphQLContext,
    ): Promise<AuthPayload> => {
      return loginUser(args.input, createAuthDependencies(context));
    },
  },
};
