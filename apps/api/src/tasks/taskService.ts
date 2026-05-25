import { requireCurrentUserId } from "../auth/requireCurrentUserId.js";
import { AppError, ERROR_CODES } from "../errors/index.js";
import type {
  TaskWeatherFields,
  WeatherService,
} from "../weather/index.js";
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
import type { z } from "zod";

export type TaskServiceDependencies = TaskRepository & {
  currentUserId: string | null;
  weatherService?: WeatherService;
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
  schema: z.ZodType<TOutput>,
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

const clearedWeatherFields: TaskWeatherFields = {
  weatherCity: null,
  weatherTemperature: null,
  weatherCondition: null,
  weatherIconUrl: null,
  weatherFetchedAt: null,
};

const getTaskWeather = async (
  title: string,
  weatherService: WeatherService | undefined,
  dueDate: Date | null,
  clearWhenMissing = false,
): Promise<Partial<TaskWeatherFields>> => {
  if (!weatherService) {
    return {};
  }

  try {
    const weather = await weatherService.getWeatherForTaskTitle(title, dueDate);

    if (weather.status === "found") {
      return weather.weather;
    }

    if (clearWhenMissing) {
      return clearedWeatherFields;
    }

    return {};
  } catch {
    return clearWhenMissing ? clearedWeatherFields : {};
  }
};

export const listTasks = async (
  input: unknown,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord[]> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);
  const filters: ParsedTaskFiltersInput = parseInput(
    taskFiltersInputSchema,
    input ?? {},
  );

  return dependencies.findTasks(userId, filters);
};

export const createTask = async (
  input: unknown,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);
  const taskInput: ParsedCreateTaskInput = parseInput(createTaskInputSchema, input);
  const weather = await getTaskWeather(
    taskInput.title,
    dependencies.weatherService,
    taskInput.dueDate,
  );

  return dependencies.createTask(userId, {
    ...taskInput,
    ...weather,
  });
};

export const updateTask = async (
  taskId: string,
  input: unknown,
  dependencies: TaskServiceDependencies,
): Promise<TaskRecord> => {
  const userId = requireCurrentUserId(dependencies.currentUserId);
  const taskInput = parseUpdateTaskInput(input);

  const existingTask = await ensureActiveTaskExists(userId, taskId, dependencies);
  const weatherTitle = taskInput.title ?? existingTask.title;
  const weatherDueDate =
    taskInput.dueDate === undefined ? existingTask.dueDate : taskInput.dueDate;
  const weather =
    taskInput.title === undefined && taskInput.dueDate === undefined
      ? {}
      : await getTaskWeather(
          weatherTitle,
          dependencies.weatherService,
          weatherDueDate,
          true,
        );

  return dependencies.updateTask(userId, taskId, {
    ...taskInput,
    ...weather,
  });
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
  const taskIds = parseInput(reorderTaskIdsSchema, input);

  return dependencies.reorderTasks(userId, taskIds);
};
