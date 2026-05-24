import { describe, expect, it } from "vitest";

import { requireCurrentUserId } from "../../../src/auth/requireCurrentUserId.js";
import { ERROR_CODES } from "../../../src/errors/index.js";
import { expectToThrowAppError } from "../../helpers/errors.js";

describe("requireCurrentUserId", () => {
  it("returns the current user id when authenticated", () => {
    expect(requireCurrentUserId("user_123")).toBe("user_123");
  });

  it("throws an unauthenticated error when no user is present", () => {
    expectToThrowAppError(() => requireCurrentUserId(null), {
      code: ERROR_CODES.unauthenticated,
      message: "You must be logged in to perform this action.",
    });
  });
});
