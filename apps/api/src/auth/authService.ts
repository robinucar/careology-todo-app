import { AppError, ERROR_CODES } from "../errors/index.js";
import {
  loginInputSchema,
  registerInputSchema,
  type LoginInput,
  type RegisterInput,
} from "./authValidation.js";
import { type AuthTokenConfig, type AuthTokenPayload } from "./token.js";

type AuthUser = {
  id: string;
  email: string;
};

type AuthUserWithPassword = AuthUser & {
  passwordHash: string;
};

type CreateUserInput = {
  email: string;
  passwordHash: string;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export type AuthServiceDependencies = {
  findUserByEmail: (email: string) => Promise<AuthUserWithPassword | null>;
  createUser: (input: CreateUserInput) => Promise<AuthUser>;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, passwordHash: string) => Promise<boolean>;
  signAuthToken: (payload: AuthTokenPayload, config: AuthTokenConfig) => string;
  tokenConfig: AuthTokenConfig;
};

const getRegisterInput = (input: unknown): RegisterInput => {
  const result = registerInputSchema.safeParse(input);

  if (!result.success) {
    throw new AppError({
      code: ERROR_CODES.validationError,
      message: result.error.issues[0]?.message ?? "Invalid input.",
      cause: result.error,
    });
  }

  return result.data;
};

const getLoginInput = (input: unknown): LoginInput => {
  const result = loginInputSchema.safeParse(input);

  if (!result.success) {
    throw new AppError({
      code: ERROR_CODES.validationError,
      message: result.error.issues[0]?.message ?? "Invalid input.",
      cause: result.error,
    });
  }

  return result.data;
};

const createInvalidCredentialsError = () => {
  return new AppError({
    code: ERROR_CODES.invalidCredentials,
    message: "Invalid email or password.",
  });
};

const toAuthUser = (user: AuthUser): AuthUser => {
  return {
    id: user.id,
    email: user.email,
  };
};

export const registerUser = async (
  input: unknown,
  dependencies: AuthServiceDependencies,
): Promise<AuthPayload> => {
  const registerInput = getRegisterInput(input);

  const existingUser = await dependencies.findUserByEmail(registerInput.email);

  if (existingUser) {
    throw new AppError({
      code: ERROR_CODES.emailAlreadyExists,
      message: "An account with this email already exists.",
    });
  }

  const passwordHash = await dependencies.hashPassword(registerInput.password);

  const user = await dependencies.createUser({
    email: registerInput.email,
    passwordHash,
  });

  const token = dependencies.signAuthToken(
    { userId: user.id },
    dependencies.tokenConfig,
  );

  return {
    token,
    user: toAuthUser(user),
  };
};

export const loginUser = async (
  input: unknown,
  dependencies: AuthServiceDependencies,
): Promise<AuthPayload> => {
  const loginInput = getLoginInput(input);

  const user = await dependencies.findUserByEmail(loginInput.email);

  if (!user?.passwordHash) {
    throw createInvalidCredentialsError();
  }

  const isPasswordValid = await dependencies.verifyPassword(
    loginInput.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw createInvalidCredentialsError();
  }

  const token = dependencies.signAuthToken(
    { userId: user.id },
    dependencies.tokenConfig,
  );

  return {
    token,
    user: toAuthUser(user),
  };
};
