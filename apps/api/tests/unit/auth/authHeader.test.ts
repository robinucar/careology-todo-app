import { describe, expect, it } from "vitest";

import {
  getBearerToken,
  getCurrentUserIdFromAuthorizationHeader,
} from "../../../src/auth/authHeader.js";
import { signAuthToken } from "../../../src/auth/token.js";
import { ERROR_CODES } from "../../../src/errors/index.js";
import { expectToThrowAppError } from "../../helpers/errors.js";

const tokenConfig = {
  jwtSecret: "test-jwt-secret-value-that-is-long-enough",
  jwtExpiresIn: "1h",
} as const;

describe("getBearerToken", () => {
  it("returns null for missing headers", () => {
    for (const header of [undefined, ""]) {
      expect(getBearerToken(header)).toBeNull();
    }
  });

  it("extracts bearer tokens with case-insensitive schemes", () => {
    expect(getBearerToken("Bearer signed-token")).toBe("signed-token");
    expect(getBearerToken("bearer signed-token")).toBe("signed-token");
  });

  it("rejects invalid authorization headers", () => {
    for (const header of [
      "Basic signed-token",
      "Bearer",
      "Bearer signed-token extra",
      ["Bearer signed-token"],
    ]) {
      expectToThrowAppError(() => getBearerToken(header), {
        code: ERROR_CODES.unauthenticated,
        message: "Invalid authorization header.",
      });
    }
  });
});

describe("getCurrentUserIdFromAuthorizationHeader", () => {
  it("returns null when no token is present", () => {
    expect(
      getCurrentUserIdFromAuthorizationHeader(undefined, tokenConfig),
    ).toBeNull();
  });

  it("returns the authenticated user id for valid bearer tokens", () => {
    const token = signAuthToken({ userId: "user_123" }, tokenConfig);

    expect(
      getCurrentUserIdFromAuthorizationHeader(`Bearer ${token}`, tokenConfig),
    ).toBe("user_123");
  });

  it("rejects invalid bearer tokens", () => {
    expectToThrowAppError(
      () =>
        getCurrentUserIdFromAuthorizationHeader("Bearer not-a-token", tokenConfig),
      {
        code: ERROR_CODES.unauthenticated,
        message: "Invalid or expired authentication token.",
      },
    );
  });
});
