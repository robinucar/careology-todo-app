import { expect } from "vitest";

import { AppError, type ErrorCode } from "../../src/errors/index.js";

export const expectToThrowAppError = (
  action: () => unknown,
  expected: {
    code: ErrorCode;
    message: string;
  },
) => {
  expect(action).toThrow(AppError);

  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(expected.code);
    expect((error as AppError).message).toBe(expected.message);
  }
};
