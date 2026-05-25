import { vi } from "vitest";

import { Prisma } from "../../src/generated/prisma/client.js";
import type {
  TaskRecord,
  TaskRepositoryPrismaClient,
} from "../../src/tasks/taskRepository.js";
import { createFutureUtcDate } from "./dates.js";

export const taskFixture = {
  id: "task_123",
  userId: "user_123",
  title: "Book London tickets",
  tag: "high",
  dueDate: createFutureUtcDate(30),
  timestamp: new Date("2026-05-24T10:00:00.000Z"),
} as const;

export const taskSelect = {
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

export const createActiveTaskWhere = (
  taskId: string = taskFixture.id,
  userId: string = taskFixture.userId,
) => {
  return {
    id: taskId,
    userId,
    deletedAt: null,
  };
};

export const createFilteredTaskFindManyCall = () => {
  return {
    where: {
      userId: taskFixture.userId,
      deletedAt: null,
      tags: {
        hasEvery: [taskFixture.tag],
      },
      OR: [
        {
          title: {
            contains: "London",
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: "London",
            mode: "insensitive",
          },
        },
        {
          tags: {
            has: "london",
          },
        },
      ],
    },
    orderBy: [
      {
        order: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: taskSelect,
  };
};

export const createTaskUpdateCall = (
  data: Record<string, unknown>,
  taskId: string = taskFixture.id,
) => {
  return {
    where: createActiveTaskWhere(taskId),
    data,
    select: taskSelect,
  };
};

export type MockPrismaTask = {
  create: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

export type MockTaskPrismaClient = MockPrismaTask & {
  $transaction: ReturnType<typeof vi.fn>;
  prisma: TaskRepositoryPrismaClient;
};

export const createTaskRecord = (
  overrides: Partial<TaskRecord> = {},
): TaskRecord => {
  return {
    id: taskFixture.id,
    title: taskFixture.title,
    description: null,
    completed: false,
    dueDate: null,
    tags: [taskFixture.tag],
    order: 0,
    weatherCity: null,
    weatherTemperature: null,
    weatherCondition: null,
    weatherIconUrl: null,
    weatherFetchedAt: null,
    createdAt: taskFixture.timestamp,
    updatedAt: taskFixture.timestamp,
    ...overrides,
  };
};

export const createMockPrismaTask = (): MockPrismaTask => {
  return {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  };
};

export const createMockTaskPrismaClient = (): MockTaskPrismaClient => {
  const task = createMockPrismaTask();
  const $transaction = vi.fn(
    async (
      callback: (transaction: Pick<TaskRepositoryPrismaClient, "task">) => unknown,
    ) => callback({ task } as unknown as Pick<TaskRepositoryPrismaClient, "task">),
  );

  return {
    ...task,
    $transaction,
    prisma: {
      $transaction,
      task,
    } as unknown as TaskRepositoryPrismaClient,
  };
};

export const createRecordNotFoundError = () => {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "test",
  });
};
