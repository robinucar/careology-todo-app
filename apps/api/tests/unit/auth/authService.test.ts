import { describe, expect, it, vi } from "vitest";

import {
  loginUser,
  registerUser,
  type AuthServiceDependencies,
} from "../../../src/auth/authService.js";
import { AppError, ERROR_CODES } from "../../../src/errors/index.js";

const tokenConfig = {
  jwtSecret: "test-jwt-secret-value-that-is-long-enough",
  jwtExpiresIn: "1h",
} as const;

const createDependencies = () => {
  const findUserByEmail = vi
    .fn<AuthServiceDependencies["findUserByEmail"]>()
    .mockResolvedValue(null);

  const createUser = vi
    .fn<AuthServiceDependencies["createUser"]>()
    .mockResolvedValue({
      id: "user_123",
      name: "Task Master",
      email: "user@example.com",
    });

  const hashPassword = vi
    .fn<AuthServiceDependencies["hashPassword"]>()
    .mockResolvedValue("hashed-password");

  const verifyPassword = vi
    .fn<AuthServiceDependencies["verifyPassword"]>()
    .mockResolvedValue(true);

  const signAuthToken = vi
    .fn<AuthServiceDependencies["signAuthToken"]>()
    .mockReturnValue("signed-token");

  return {
    findUserByEmail,
    createUser,
    hashPassword,
    verifyPassword,
    signAuthToken,
    tokenConfig,
  };
};

describe("registerUser", () => {
  it("registers a new user and returns a token with safe user data", async () => {
    const dependencies = createDependencies();

    await expect(
      registerUser(
        {
          name: " Task Master ",
          email: " USER@example.COM ",
          password: "password123",
        },
        dependencies,
      ),
    ).resolves.toEqual({
      token: "signed-token",
      user: {
        id: "user_123",
        name: "Task Master",
        email: "user@example.com",
      },
    });

    expect(dependencies.findUserByEmail).toHaveBeenCalledWith("user@example.com");
    expect(dependencies.hashPassword).toHaveBeenCalledWith("password123");
    expect(dependencies.createUser).toHaveBeenCalledWith({
      name: "Task Master",
      email: "user@example.com",
      passwordHash: "hashed-password",
    });
    expect(dependencies.signAuthToken).toHaveBeenCalledWith(
      { userId: "user_123" },
      tokenConfig,
    );
  });

  it("rejects duplicate emails before hashing or creating a user", async () => {
    const dependencies = createDependencies();

    dependencies.findUserByEmail.mockResolvedValue({
      id: "existing_user",
      name: "Task Master",
      email: "user@example.com",
      passwordHash: "existing-password-hash",
    });

    await expect(
      registerUser(
        {
          name: "Task Master",
          email: "user@example.com",
          password: "password123",
        },
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.emailAlreadyExists,
      message: "An account with this email already exists.",
    });

    expect(dependencies.hashPassword).not.toHaveBeenCalled();
    expect(dependencies.createUser).not.toHaveBeenCalled();
    expect(dependencies.signAuthToken).not.toHaveBeenCalled();
  });

  it("returns validation errors as AppError instances", async () => {
    const dependencies = createDependencies();

    await expect(
      registerUser(
        {
          name: "Task Master",
          email: "not-an-email",
          password: "password123",
        },
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Enter a valid email address.",
    });

    await expect(
      registerUser(
        {
          name: "Task Master",
          email: "not-an-email",
          password: "password123",
        },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(AppError);

    expect(dependencies.findUserByEmail).not.toHaveBeenCalled();
  });
});

describe("loginUser", () => {
  it("logs in a user and returns a token with safe user data", async () => {
    const dependencies = createDependencies();

    dependencies.findUserByEmail.mockResolvedValue({
      id: "user_123",
      name: "Task Master",
      email: "user@example.com",
      passwordHash: "stored-password-hash",
    });

    await expect(
      loginUser(
        {
          email: " USER@example.COM ",
          password: "password123",
        },
        dependencies,
      ),
    ).resolves.toEqual({
      token: "signed-token",
      user: {
        id: "user_123",
        name: "Task Master",
        email: "user@example.com",
      },
    });

    expect(dependencies.findUserByEmail).toHaveBeenCalledWith("user@example.com");
    expect(dependencies.verifyPassword).toHaveBeenCalledWith(
      "password123",
      "stored-password-hash",
    );
    expect(dependencies.signAuthToken).toHaveBeenCalledWith(
      { userId: "user_123" },
      tokenConfig,
    );
    expect(dependencies.createUser).not.toHaveBeenCalled();
    expect(dependencies.hashPassword).not.toHaveBeenCalled();
  });

  it("rejects unknown users with a safe invalid credentials error", async () => {
    const dependencies = createDependencies();

    await expect(
      loginUser(
        {
          email: "missing@example.com",
          password: "password123",
        },
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.invalidCredentials,
      message: "Invalid email or password.",
    });

    expect(dependencies.verifyPassword).not.toHaveBeenCalled();
    expect(dependencies.signAuthToken).not.toHaveBeenCalled();
  });

  it("rejects incorrect passwords with a safe invalid credentials error", async () => {
    const dependencies = createDependencies();

    dependencies.findUserByEmail.mockResolvedValue({
      id: "user_123",
      name: "Task Master",
      email: "user@example.com",
      passwordHash: "stored-password-hash",
    });
    dependencies.verifyPassword.mockResolvedValue(false);

    await expect(
      loginUser(
        {
          email: "user@example.com",
          password: "wrong-password",
        },
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.invalidCredentials,
      message: "Invalid email or password.",
    });

    expect(dependencies.signAuthToken).not.toHaveBeenCalled();
  });

  it("returns validation errors as AppError instances", async () => {
    const dependencies = createDependencies();

    await expect(
      loginUser(
        {
          email: "not-an-email",
          password: "password123",
        },
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Enter a valid email address.",
    });

    await expect(
      loginUser(
        {
          email: "not-an-email",
          password: "password123",
        },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(AppError);

    expect(dependencies.findUserByEmail).not.toHaveBeenCalled();
  });
});
