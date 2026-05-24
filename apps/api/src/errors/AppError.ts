import { ERROR_CODES, type ErrorCode } from "./errorCodes.js";

type AppErrorOptions = {
  code: ErrorCode;
  message: string;
  cause?: unknown;
};

export class AppError extends Error {
  public readonly code: ErrorCode;

  public override readonly cause?: unknown;

  public constructor({ code, message, cause }: AppErrorOptions) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.cause = cause;
  }
}

export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const createInternalServerError = (cause?: unknown) => {
  return new AppError({
    code: ERROR_CODES.internalServerError,
    message: "Something went wrong.",
    cause,
  });
};