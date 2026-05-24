import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";

import { AppError, ERROR_CODES } from "../../../src/errors/index.js";
import { signAuthToken, verifyAuthToken } from "../../../src/auth/token.js";
import { expectToThrowAppError } from "../../helpers/errors.js";

const tokenConfig = {
  jwtSecret: "test-jwt-secret-value-that-is-long-enough",
  jwtExpiresIn: "1h",
} as const;

describe("token utilities", () => {
  it("signs and verifies auth tokens", () => {
    const token = signAuthToken({ userId: "user_123" }, tokenConfig);
    const [encodedHeader] = token.split(".");
    const header = JSON.parse(
      Buffer.from(encodedHeader ?? "", "base64url").toString("utf8"),
    ) as Record<string, unknown>;

    expect(header["alg"]).toBe("HS256");
    expect(verifyAuthToken(token, tokenConfig)).toEqual({
      userId: "user_123",
    });
  });

  it("rejects tokens signed with unsupported algorithms", () => {
    const token = jwt.sign({ userId: "user_123" }, null, {
      algorithm: "none",
    });

    expect(() => verifyAuthToken(token, tokenConfig)).toThrow(AppError);
  });

  it("rejects invalid tokens with a safe auth error", () => {
    expectToThrowAppError(() => verifyAuthToken("not-a-token", tokenConfig), {
      code: ERROR_CODES.unauthenticated,
      message: "Invalid or expired authentication token.",
    });
  });
});
