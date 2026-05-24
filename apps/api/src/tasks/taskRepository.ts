import { Prisma } from "../generated/prisma/client.js";
import type { prisma } from "../db/prisma.js";
import { AppError, ERROR_CODES } from "../errors/index.js";
import type {
  CreateTaskInput,
  TaskFiltersInput,
  UpdateTaskInput,
} from "./taskValidation.js";

export type TaskRepositoryPrismaClient = Pick<
  typeof prisma,
  "$transaction" | "task"
>;

const taskSelect = {
  id: true,
  title: true,
  description: true,
  completed: true,
  dueDate: true,
  tags: true,
  order: true,
  weatherCity: true,
  weatherTemperature: true,
  weatherCondition: true,
  weatherIconUrl: true,
  weatherFetchedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type TaskRecord = Prisma.TaskGetPayload<{
  select: typeof taskSelect;
}>;

export type TaskRepository = {
  findTasks: (
    userId: string,
    filters?: TaskFiltersInput,
  ) => Promise<TaskRecord[]>;
  createTask: (userId: string, input: CreateTaskInput) => Promise<TaskRecord>;
  findActiveTaskById: (
    userId: string,
    taskId: string,
  ) => Promise<TaskRecord | null>;
  updateTask: (
    userId: string,
    taskId: string,
    input: UpdateTaskInput,
  ) => Promise<TaskRecord>;
  softDeleteTask: (
    userId: string,
    taskId: string,
    deletedAt?: Date,
  ) => Promise<TaskRecord>;
  reorderTasks: (userId: string, taskIds: string[]) => Promise<TaskRecord[]>;
};

const createActiveTaskWhere = (
  userId: string,
  taskId: string,
): Prisma.TaskWhereInput => {
  return {
    id: taskId,
    userId,
    deletedAt: null,
  };
};

const createActiveTaskUniqueWhere = (
  userId: string,
  taskId: string,
): Prisma.TaskWhereUniqueInput => {
  return {
    id: taskId,
    userId,
    deletedAt: null,
  };
};

const createTaskUpdateData = (input: UpdateTaskInput): Prisma.TaskUpdateInput => {
  const data: Prisma.TaskUpdateInput = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.completed !== undefined) {
    data.completed = input.completed;
  }

  if (input.dueDate !== undefined) {
    data.dueDate = input.dueDate;
  }

  if (input.tags !== undefined) {
    data.tags = input.tags;
  }

  return data;
};

const isPrismaRecordNotFoundError = (error: unknown): boolean => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
  );
};

const createTaskNotFoundError = (cause?: unknown) => {
  return new AppError({
    code: ERROR_CODES.notFound,
    message: "Task not found.",
    cause,
  });
};

const createTaskOrderValidationError = () => {
  return new AppError({
    code: ERROR_CODES.validationError,
    message: "Task order must include every active task exactly once.",
  });
};

const mapTaskNotFoundError = (error: unknown): never => {
  if (isPrismaRecordNotFoundError(error)) {
    throw createTaskNotFoundError(error);
  }

  throw error;
};

const createTaskListWhere = (
  userId: string,
  filters: Partial<TaskFiltersInput> = {},
): Prisma.TaskWhereInput => {
  const where: Prisma.TaskWhereInput = {
    userId,
    deletedAt: null,
  };

  if (filters.completed !== undefined) {
    where.completed = filters.completed;
  }

  if (filters.tags && filters.tags.length > 0) {
    where.tags = {
      hasEvery: filters.tags,
    };
  }

  if (filters.dueBefore || filters.dueAfter) {
    where.dueDate = {
      ...(filters.dueBefore ? { lte: filters.dueBefore } : {}),
      ...(filters.dueAfter ? { gte: filters.dueAfter } : {}),
    };
  }

  if (filters.search) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        tags: {
          has: filters.search.toLowerCase(),
        },
      },
    ];
  }

  return where;
};

const assertCompleteTaskOrder = (
  activeTasks: Array<{ id: string }>,
  taskIds: string[],
) => {
  const activeTaskIds = new Set(activeTasks.map((task) => task.id));
  const requestedTaskIds = new Set(taskIds);

  if (requestedTaskIds.size !== taskIds.length) {
    throw createTaskOrderValidationError();
  }

  if (taskIds.some((taskId) => !activeTaskIds.has(taskId))) {
    throw createTaskNotFoundError();
  }

  if (activeTaskIds.size !== requestedTaskIds.size) {
    throw createTaskOrderValidationError();
  }
};

export const createTaskRepository = (
  prismaClient: TaskRepositoryPrismaClient,
): TaskRepository => {
  return {
    findTasks: (userId, filters) => {
      return prismaClient.task.findMany({
        where: createTaskListWhere(userId, filters),
        orderBy: [
          {
            order: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
        select: taskSelect,
      });
    },
    createTask: (userId, input) => {
      return prismaClient.$transaction(async (transaction) => {
        const lastTask = await transaction.task.findFirst({
          where: {
            userId,
            deletedAt: null,
          },
          orderBy: {
            order: "desc",
          },
          select: {
            order: true,
          },
        });
        const order = (lastTask?.order ?? -1) + 1;

        return transaction.task.create({
          data: {
            ...input,
            order,
            userId,
          },
          select: taskSelect,
        });
      });
    },
    findActiveTaskById: (userId, taskId) => {
      return prismaClient.task.findFirst({
        where: createActiveTaskWhere(userId, taskId),
        select: taskSelect,
      });
    },
    updateTask: async (userId, taskId, input) => {
      try {
        return await prismaClient.task.update({
          where: createActiveTaskUniqueWhere(userId, taskId),
          data: createTaskUpdateData(input),
          select: taskSelect,
        });
      } catch (error) {
        return mapTaskNotFoundError(error);
      }
    },
    softDeleteTask: async (userId, taskId, deletedAt = new Date()) => {
      try {
        return await prismaClient.task.update({
          where: createActiveTaskUniqueWhere(userId, taskId),
          data: {
            deletedAt,
          },
          select: taskSelect,
        });
      } catch (error) {
        return mapTaskNotFoundError(error);
      }
    },
    reorderTasks: async (userId, taskIds) => {
      try {
        return await prismaClient.$transaction(async (transaction) => {
          const tasks = await transaction.task.findMany({
            where: {
              userId,
              deletedAt: null,
            },
            select: {
              id: true,
            },
          });

          assertCompleteTaskOrder(tasks, taskIds);

          const updatedTasks: TaskRecord[] = [];

          for (const [order, taskId] of taskIds.entries()) {
            updatedTasks.push(
              await transaction.task.update({
                where: createActiveTaskUniqueWhere(userId, taskId),
                data: {
                  order,
                },
                select: taskSelect,
              }),
            );
          }

          return updatedTasks;
        });
      } catch (error) {
        return mapTaskNotFoundError(error);
      }
    },
  };
};
