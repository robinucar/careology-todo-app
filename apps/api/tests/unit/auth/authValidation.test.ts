import { describe, expect, it } from "vitest";

import {
  loginInputSchema,
  registerInputSchema,
} from "../../../src/auth/authValidation.js";

describe("registerInputSchema", () => {
  it("normalises valid register input", () => {
    const result = registerInputSchema.parse({
      name: " Task Master ",
      email: " USER@example.COM ",
      password: "password123",
    });

    expect(result).toEqual({
      name: "Task Master",
      email: "user@example.com",
      password: "password123",
    });
  });

  it("rejects invalid email addresses", () => {
    expect(() =>
      registerInputSchema.parse({
        name: "Task Master",
        email: "not-an-email",
        password: "password123",
      }),
    ).toThrow("Enter a valid email address.");
  });

  it("rejects short names", () => {
    expect(() =>
      registerInputSchema.parse({
        name: "A",
        email: "user@example.com",
        password: "password123",
      }),
    ).toThrow("Name must be at least 2 characters.");
  });

  it("rejects short passwords", () => {
    expect(() =>
      registerInputSchema.parse({
        name: "Task Master",
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
