export const ERROR_CODES = {
  unauthenticated: "UNAUTHENTICATED",
  forbidden: "FORBIDDEN",
  validationError: "VALIDATION_ERROR",
  notFound: "NOT_FOUND",
  conflict: "CONFLICT",
  emailAlreadyExists: "EMAIL_ALREADY_EXISTS",
  invalidCredentials: "INVALID_CREDENTIALS",
  externalServiceError: "EXTERNAL_SERVICE_ERROR",
  internalServerError: "INTERNAL_SERVER_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];