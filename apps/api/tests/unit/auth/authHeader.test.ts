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
  it.each([undefined, ""])("returns null for missing header %j", (header) => {
    expect(getBearerToken(header)).toBeNull();
  });

  it("extracts bearer tokens", () => {
    expect(getBearerToken("Bearer signed-token")).toBe("signed-token");
  });

  it("accepts case-insensitive bearer schemes", () => {
    expect(getBearerToken("bearer signed-token")).toBe("signed-token");
  });

  it.each([
    "Basic signed-token",
    "Bearer",
    "Bearer signed-token extra",
    ["Bearer signed-token"],
  ])("rejects invalid authorization header %j", (header) => {
    expectToThrowAppError(() => getBearerToken(header), {
      code: ERROR_CODES.unauthenticated,
      message: "Invalid authorization header.",
    });
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
