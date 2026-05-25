import { requireCurrentUserId } from "../auth/requireCurrentUserId.js";
import { AppError, ERROR_CODES } from "../errors/index.js";
import type { TaskRecord, TaskRepository } from "./taskRepository.js";
import {
  createTaskInputSchema,
  reorderTaskIdsSchema,
  taskFiltersInputSchema,
  updateTaskInputSchema,
  type ParsedCreateTaskInput,
  type ParsedTaskFiltersInput,
  type ParsedUpdateTaskInput,
} from "./taskValidation.js";

export type TaskServiceDependencies = TaskRepository & {
  currentUserId: string | null;
};

const createValidationError = (message: string, cause?: unknown) => {
  return new AppError({
    code: ERROR_CODES.validationError,
    message,
    cause,
  });
};

const createTaskNotFoundError = () => {
  return new AppError({
    code: ERROR_CODES.notFound,
    message: "Task not found.",
  });
};

const parseInput = <TOutput>(
  schema: {
    safeParse: (input: unknown) =>
      | {
          success: true;
          data: TOutput;
        }
      | {
          success: false;
          error: {
            issues: Array<{
              message: string;
            }>;
          };
        };
  },
  input: unknown,
): TOutput => {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw createValidationError(
      result.error.issues[0]?.message ?? "Invalid input.",
      result.error,
    );
  }

  return result.data;
};

const parseCreateTaskInput = (input: unknown): ParsedCreateTaskInput => {
  return parseInput(createTaskInputSchema, input);
};

const parseUpdateTaskInput = (input: unknown): ParsedUpdateTaskInput => {
  const updateInput = parseInput(updateTaskInputSchema, input);
  const hasUpdateFields = Object.values(updateInput).some(
    (value) => value !== undefined,
  );

  if (!hasUpdateFields) {
    throw createValidationError("At least one task field must be provided.");
  }

  return updateInput;
};

const parseTaskFiltersInput = (input: unknown): ParsedTaskFiltersInput => {
  return parseInput(taskFiltersInputSchema, input ?? {});
};

const parseReorderTaskIds = (input: unknown): string[] => {
  return parseInput(reorderTaskIdsSchema, input);
};

const ensureActiveTaskExists = async (
  userId: string,
  taskId: string,
  dependencies: Pick<TaskServiceDependencies, "findActiveTaskById">,
): Promise<TaskRecord> => {
  const task = await dependencies.findActiveTaskById(userId, taskId);

  if (!task) {
    throw createTaskNotFoundError();
  }

  return task;
};

export const listTasks = async (
  input: unknown,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord[]> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);
  const filters = parseTaskFiltersInput(input);

  return dependencies.findTasks(userId, filters);
};

export const createTask = async (
  input: unknown,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);
  const taskInput = parseCreateTaskInput(input);

  return dependencies.createTask(userId, taskInput);
};

export const updateTask = async (
  taskId: string,
  input: unknown,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);
  const taskInput = parseUpdateTaskInput(input);

  await ensureActiveTaskExists(userId, taskId, dependencies);

  return dependencies.updateTask(userId, taskId, taskInput);
};

export const deleteTask = async (
  taskId: string,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);

  await ensureActiveTaskExists(userId, taskId, dependencies);

  return dependencies.softDeleteTask(userId, taskId);
};

export const reorderTasks = async (
  input: unknown,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord[]> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);
  const taskIds = parseReorderTaskIds(input);

  return dependencies.reorderTasks(userId, taskIds);
};
