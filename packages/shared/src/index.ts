export const appName = "Careology Todo App";

export const AUTH_PASSWORD_MIN_LENGTH = 8;

export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 80;

export const TASK_TITLE_MAX_LENGTH = 160;
export const TASK_MAX_TAGS = 10;
export const TASK_TAG_MAX_LENGTH = 32;

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

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthPayload = {
  token: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  tags: string[];
  order: number;
  weatherCity: string | null;
  weatherTemperature: number | null;
  weatherCondition: string | null;
  weatherIconUrl: string | null;
  weatherFetchedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  dueDate?: string | null;
  tags?: string[] | null;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  completed?: boolean;
  dueDate?: string | null;
  tags?: string[] | null;
};

export type TaskFiltersInput = {
  search?: string | null;
  completed?: boolean | null;
  tags?: string[] | null;
  dueBefore?: string | null;
  dueAfter?: string | null;
};
