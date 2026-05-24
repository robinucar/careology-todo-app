import jwt, { type Algorithm, type JwtPayload, type SignOptions } from "jsonwebtoken";

import { AppError, ERROR_CODES } from "../errors/index.js";

type JwtExpiresIn = NonNullable<SignOptions["expiresIn"]>;
const AUTH_TOKEN_ALGORITHM: Algorithm = "HS256";

export type AuthTokenPayload = {
  userId: string;
};

export type AuthTokenConfig = {
  jwtSecret: string;
  jwtExpiresIn: JwtExpiresIn;
};

const isAuthTokenPayload = (value: unknown): value is JwtPayload & AuthTokenPayload => {
  return (
    typeof value === "object" &&
    value !== null &&
    "userId" in value &&
    typeof value.userId === "string" &&
    value.userId.length > 0
  );
};

export const signAuthToken = (
  payload: AuthTokenPayload,
  config: AuthTokenConfig,
): string => {
  return jwt.sign(payload, config.jwtSecret, {
    algorithm: AUTH_TOKEN_ALGORITHM,
    expiresIn: config.jwtExpiresIn,
  });
};

export const verifyAuthToken = (
  token: string,
  config: Pick<AuthTokenConfig, "jwtSecret">,
): AuthTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, {
      algorithms: [AUTH_TOKEN_ALGORITHM],
    });

    if (!isAuthTokenPayload(decoded)) {
      throw new Error("Token payload is invalid.");
    }

    return {
      userId: decoded.userId,
    };
  } catch (cause) {
    throw new AppError({
      code: ERROR_CODES.unauthenticated,
      message: "Invalid or expired authentication token.",
      cause,
    });
  }
};
