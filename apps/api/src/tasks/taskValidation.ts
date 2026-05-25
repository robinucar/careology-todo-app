import {
  TASK_MAX_TAGS,
  TASK_TAG_OPTIONS,
  TASK_TAG_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  getTaskTagValue,
  type TaskTagValue,
} from "@careology/shared";
import { z } from "zod";

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Task title is required.")
  .max(
    TASK_TITLE_MAX_LENGTH,
    `Task title must be ${TASK_TITLE_MAX_LENGTH} characters or fewer.`,
  );

const nullableTextSchema = z.union([z.string(), z.null()]).transform((value) => {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
});

const isValidDateOnly = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const toUtcDateOnlyTime = (date: Date): number => {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const isBeforeToday = (date: Date): boolean => {
  return toUtcDateOnlyTime(date) < toUtcDateOnlyTime(new Date());
};

const parseIsoDate = (value: string): Date | null => {
  const dateOnlyMatch = DATE_ONLY_PATTERN.exec(value);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    if (!isValidDateOnly(year, month, day)) {
      return null;
    }

    return new Date(Date.UTC(year, month - 1, day));
  }

  if (!ISO_DATE_TIME_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const nullableDueDateSchema = z
  .union([z.string(), z.null()])
  .transform((value, context): Date | null => {
    if (value === null) {
      return null;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const date = parseIsoDate(trimmed);

    if (!date) {
      context.addIssue({
        code: "custom",
        message: "Due date must be an ISO date or date-time string.",
      });

      return z.NEVER;
    }

    return date;
  });

const futureNullableDueDateSchema = nullableDueDateSchema.refine(
  (date) => date === null || !isBeforeToday(date),
  "Due date cannot be in the past.",
);

const validTaskTagLabels = TASK_TAG_OPTIONS.map((option) => option.label).join(
  ", ",
);
const validTaskTagMessage = `Tags must be one of: ${validTaskTagLabels}.`;

const removeBlankTags = (tags: string[]): string[] => {
  return tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
};

const isKnownTaskTag = (tag: string): boolean => {
  return getTaskTagValue(tag).length > 0;
};

const toUniqueCanonicalTaskTags = (tags: string[]): TaskTagValue[] => {
  const canonicalTags = tags
    .map((tag) => getTaskTagValue(tag))
    .filter((tag): tag is TaskTagValue => tag.length > 0);

  return Array.from(new Set(canonicalTags));
};

const normalisedTagsSchema = z
  .array(z.string())
  .transform(removeBlankTags)
  .refine(
    (tags) => tags.length <= TASK_MAX_TAGS,
    `Tags cannot contain more than ${TASK_MAX_TAGS} items.`,
  )
  .refine(
    (tags) => tags.every((tag) => tag.length <= TASK_TAG_MAX_LENGTH),
    `Tags must be ${TASK_TAG_MAX_LENGTH} characters or fewer.`,
  )
  .refine((tags) => tags.every(isKnownTaskTag), validTaskTagMessage)
  .transform(toUniqueCanonicalTaskTags);

const nullableTagsSchema = z
  .union([normalisedTagsSchema, z.null()])
  .transform((value): string[] => value ?? []);

const searchSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value): string | undefined => {
    if (value === undefined || value === null) {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  });

export const createTaskInputSchema = z.object({
  title: titleSchema,
  description: nullableTextSchema.optional().transform((value) => value ?? null),
  dueDate: futureNullableDueDateSchema
    .optional()
    .transform((value) => value ?? null),
  tags: nullableTagsSchema.optional().transform((value) => value ?? []),
});

export const updateTaskInputSchema = z.object({
  title: titleSchema.optional(),
  description: nullableTextSchema.optional(),
  completed: z.boolean().optional(),
  dueDate: futureNullableDueDateSchema.optional(),
  tags: nullableTagsSchema.optional(),
});

export const taskFiltersInputSchema = z.object({
  search: searchSchema,
  completed: z
    .union([z.boolean(), z.null()])
    .optional()
    .transform((value): boolean | undefined => value ?? undefined),
  tags: nullableTagsSchema
    .optional()
    .transform((value): string[] | undefined =>
      value && value.length > 0 ? value : undefined,
    ),
  dueBefore: nullableDueDateSchema
    .optional()
    .transform((value): Date | undefined => value ?? undefined),
  dueAfter: nullableDueDateSchema
    .optional()
    .transform((value): Date | undefined => value ?? undefined),
});

export const reorderTaskIdsSchema = z
  .array(z.string().trim().min(1, "Task id is required."))
  .min(1, "At least one task id is required.")
  .superRefine((ids, context) => {
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Task ids must be unique.",
      });
    }
  });

export type ParsedCreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type ParsedUpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type ParsedTaskFiltersInput = z.infer<typeof taskFiltersInputSchema>;
