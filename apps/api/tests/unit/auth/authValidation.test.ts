import { describe, expect, it } from "vitest";

import {
  loginInputSchema,
  registerInputSchema,
} from "../../../src/auth/authValidation.js";

describe("registerInputSchema", () => {
  it("normalises valid register input", () => {
    const result = registerInputSchema.parse({
      email: " USER@example.COM ",
      password: "password123",
    });

    expect(result).toEqual({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("rejects invalid email addresses", () => {
    expect(() =>
      registerInputSchema.parse({
        email: "not-an-email",
        password: "password123",
      }),
    ).toThrow("Enter a valid email address.");
  });

  it("rejects short passwords", () => {
    expect(() =>
      registerInputSchema.parse({
        email: "user@example.com",
        password: "short",
      }),
    ).toThrow("Password must be at least 8 characters.");
  });
});

describe("loginInputSchema", () => {
  it("normalises valid login input", () => {
    const result = loginInputSchema.parse({
      email: " USER@example.COM ",
      password: "password123",
    });

    expect(result).toEqual({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("rejects invalid email addresses", () => {
    expect(() =>
      loginInputSchema.parse({
        email: "not-an-email",
        password: "password123",
      }),
    ).toThrow("Enter a valid email address.");
  });

  it("rejects missing passwords", () => {
    expect(() =>
      loginInputSchema.parse({
        email: "user@example.com",
        password: "",
      }),
    ).toThrow("Password is required.");
  });
});