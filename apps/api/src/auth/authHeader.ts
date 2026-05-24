import { AppError, ERROR_CODES } from "../errors/index.js";
import {
  verifyAuthToken,
  type AuthTokenConfig,
  type AuthTokenPayload,
} from "./token.js";

type AuthorizationHeader = string | string[] | undefined;

const createInvalidAuthorizationError = () => {
  return new AppError({
    code: ERROR_CODES.unauthenticated,
    message: "Invalid authorization header.",
  });
};

export const getBearerToken = (
  authorizationHeader: AuthorizationHeader,
): string | null => {
  if (authorizationHeader === undefined) {
    return null;
  }

  if (Array.isArray(authorizationHeader)) {
    throw createInvalidAuthorizationError();
  }

  const header = authorizationHeader.trim();

  if (!header) {
    return null;
  }

  const [scheme, token, ...extraParts] = header.split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
    throw createInvalidAuthorizationError();
  }

  return token;
};

export const getCurrentUserIdFromAuthorizationHeader = (
  authorizationHeader: AuthorizationHeader,
  config: Pick<AuthTokenConfig, "jwtSecret">,
): AuthTokenPayload["userId"] | null => {
  const token = getBearerToken(authorizationHeader);

  if (!token) {
    return null;
  }

  return verifyAuthToken(token, config).userId;
};
