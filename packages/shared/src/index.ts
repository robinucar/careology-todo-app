export const appName = "Careology Todo App";

export const AUTH_PASSWORD_MIN_LENGTH = 8;

export const USER_NAME_MIN_LENGTH = 2;
export const USER_NAME_MAX_LENGTH = 80;

export const TASK_TITLE_MAX_LENGTH = 160;
export const TASK_MAX_TAGS = 10;
export const TASK_TAG_MAX_LENGTH = 32;

export const TASK_TAG_OPTIONS = [
  {
    label: "Low",
    tone: "low",
    value: "low",
  },
  {
    label: "Medium",
    tone: "medium",
    value: "medium",
  },
  {
    label: "High",
    tone: "high",
    value: "high",
  },
  {
    label: "Not urgent",
    tone: "notUrgent",
    value: "not-urgent",
  },
  {
    label: "Urgent",
    tone: "urgent",
    value: "urgent",
  },
] as const;

type TaskTagOption = (typeof TASK_TAG_OPTIONS)[number];

export type TaskTagValue = TaskTagOption["value"];
export type TaskTagTone = "default" | TaskTagOption["tone"];

export const normalizeTaskTag = (tag: string): string => {
  return tag.trim().toLowerCase().replace(/[_\s]+/g, "-");
};

export const getTaskTagValue = (tag: string): TaskTagValue | "" => {
  const normalizedTag = normalizeTaskTag(tag);

  return TASK_TAG_OPTIONS.some((option) => option.value === normalizedTag)
    ? (normalizedTag as TaskTagValue)
    : "";
};

export const getTaskTagTone = (tag: string): TaskTagTone => {
  const normalizedTag = normalizeTaskTag(tag);
  const option = TASK_TAG_OPTIONS.find(({ value }) => value === normalizedTag);

  return option?.tone ?? "default";
};

export const formatTaskTagLabel = (tag: string): string => {
  const normalizedTag = normalizeTaskTag(tag);
  const option = TASK_TAG_OPTIONS.find(({ value }) => value === normalizedTag);

  if (option) {
    return option.label;
  }

  return tag
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

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
