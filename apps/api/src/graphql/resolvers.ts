import { createAuthServiceDependencies } from "../auth/authDependencies.js";
import {
  loginUser,
  registerUser,
  type AuthPayload,
} from "../auth/authService.js";
import { env } from "../config/env.js";
import type { GraphQLContext } from "../context/context.js";
import { createTaskServiceDependencies } from "../tasks/taskDependencies.js";
import type { TaskRecord } from "../tasks/taskRepository.js";
import {
  createTask as createTaskUseCase,
  deleteTask as deleteTaskUseCase,
  listTasks,
  reorderTasks as reorderTasksUseCase,
  updateTask as updateTaskUseCase,
} from "../tasks/taskService.js";

type AuthMutationArgs = {
  input: unknown;
};

type TaskQueryArgs = {
  filters?: unknown;
};

type CreateTaskMutationArgs = {
  input: unknown;
};

type UpdateTaskMutationArgs = {
  id: string;
  input: unknown;
};

type DeleteTaskMutationArgs = {
  id: string;
};

type ReorderTasksMutationArgs = {
  ids: unknown;
};

const createAuthDependencies = (context: GraphQLContext) => {
  return createAuthServiceDependencies({
    prisma: context.prisma,
    tokenConfig: {
      jwtSecret: env.jwtSecret,
      jwtExpiresIn: env.jwtExpiresIn,
    },
  });
};

const createTaskDependencies = (context: GraphQLContext) => {
  return createTaskServiceDependencies({
    prisma: context.prisma,
    currentUserId: context.currentUserId,
  });
};

const formatNullableDate = (date: Date | null): string | null => {
  return date?.toISOString() ?? null;
};

export const resolvers = {
  Task: {
    dueDate: (task: TaskRecord): string | null => {
      return formatNullableDate(task.dueDate);
    },
    weatherFetchedAt: (task: TaskRecord): string | null => {
      return formatNullableDate(task.weatherFetchedAt);
    },
    createdAt: (task: TaskRecord): string => {
      return task.createdAt.toISOString();
    },
    updatedAt: (task: TaskRecord): string => {
      return task.updatedAt.toISOString();
    },
  },
  Query: {
    health: () => "ok",
    tasks: (
      _parent: unknown,
      args: TaskQueryArgs,
      context: GraphQLContext,
    ): Promise<TaskRecord[]> => {
      return listTasks(args.filters, createTaskDependencies(context));
    },
  },
  Mutation: {
    register: (
      _parent: unknown,
      args: AuthMutationArgs,
      context: GraphQLContext,
    ): Promise<AuthPayload> => {
      return registerUser(args.input, createAuthDependencies(context));
    },
    login: (
      _parent: unknown,
      args: AuthMutationArgs,
      context: GraphQLContext,
    ): Promise<AuthPayload> => {
      return loginUser(args.input, createAuthDependencies(context));
    },
    createTask: (
      _parent: unknown,
      args: CreateTaskMutationArgs,
      context: GraphQLContext,
    ): Promise<TaskRecord> => {
      return createTaskUseCase(args.input, createTaskDependencies(context));
    },
    updateTask: (
      _parent: unknown,
      args: UpdateTaskMutationArgs,
      context: GraphQLContext,
    ): Promise<TaskRecord> => {
      return updateTaskUseCase(
        args.id,
        args.input,
        createTaskDependencies(context),
      );
    },
    deleteTask: (
      _parent: unknown,
      args: DeleteTaskMutationArgs,
      context: GraphQLContext,
    ): Promise<TaskRecord> => {
      return deleteTaskUseCase(args.id, createTaskDependencies(context));
    },
    reorderTasks: (
      _parent: unknown,
      args: ReorderTasksMutationArgs,
      context: GraphQLContext,
    ): Promise<TaskRecord[]> => {
      return reorderTasksUseCase(args.ids, createTaskDependencies(context));
    },
  },
};
