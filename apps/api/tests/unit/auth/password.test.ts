import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "../../../src/auth/password.js";

describe("password utilities", () => {
  it("hashes passwords without storing the raw password", async () => {
    const passwordHash = await hashPassword("password123");

    expect(passwordHash).not.toBe("password123");
    expect(passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("verifies matching passwords and rejects non-matching passwords", async () => {
    const passwordHash = await hashPassword("password123");

    await expect(verifyPassword("password123", passwordHash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", passwordHash)).resolves.toBe(false);
  });
});
