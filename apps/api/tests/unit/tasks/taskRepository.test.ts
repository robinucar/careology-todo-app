import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "../../../src/errors/index.js";
import { createTaskRepository } from "../../../src/tasks/taskRepository.js";
import * as taskFixtures from "../../fixtures/tasks.js";

describe("createTaskRepository", () => {
  it("finds active tasks scoped to the authenticated user", async () => {
    const { findMany, prisma } = taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);
    const dueAfter = new Date("2026-05-01T00:00:00.000Z");
    const dueBefore = new Date("2026-06-01T00:00:00.000Z");

    findMany.mockResolvedValue([taskFixtures.createTaskRecord()]);

    await expect(
      repository.findTasks("user_123", {
        completed: false,
        dueAfter,
        dueBefore,
        search: "London",
        tags: ["travel"],
      }),
    ).resolves.toEqual([taskFixtures.createTaskRecord()]);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_123",
        deletedAt: null,
        completed: false,
        tags: {
          hasEvery: ["travel"],
        },
        dueDate: {
          lte: dueBefore,
          gte: dueAfter,
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
      select: taskFixtures.taskSelect,
    });
  });

  it("creates tasks using the authenticated user id", async () => {
    const { create, findFirst, prisma } =
      taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);
    const task = taskFixtures.createTaskRecord();

    findFirst.mockResolvedValue({
      order: 2,
    });
    create.mockResolvedValue(task);

    await expect(
      repository.createTask("user_123", {
        title: task.title,
        description: null,
        dueDate: null,
        tags: ["travel"],
      }),
    ).resolves.toEqual(task);

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user_123",
        deletedAt: null,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: task.title,
        description: null,
        dueDate: null,
        order: 3,
        tags: ["travel"],
        userId: "user_123",
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("finds active tasks by id and user id", async () => {
    const { findFirst, prisma } = taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    findFirst.mockResolvedValue(taskFixtures.createTaskRecord());

    await repository.findActiveTaskById("user_123", "task_123");

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: "task_123",
        userId: "user_123",
        deletedAt: null,
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("updates only active tasks owned by the authenticated user", async () => {
    const { prisma, update } = taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    update.mockResolvedValue(taskFixtures.createTaskRecord());

    await repository.updateTask("user_123", "task_123", {
      completed: true,
      title: "Updated title",
    });

    expect(update).toHaveBeenCalledWith({
      where: {
        id: "task_123",
        userId: "user_123",
        deletedAt: null,
      },
      data: {
        completed: true,
        title: "Updated title",
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("maps update races to a task not found error", async () => {
    const { prisma, update } = taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    update.mockRejectedValue(taskFixtures.createRecordNotFoundError());

    await expect(
      repository.updateTask("user_123", "task_123", {
        completed: true,
      }),
    ).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
  });

  it("soft deletes tasks instead of hard deleting them", async () => {
    const { prisma, update } = taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);
    const deletedAt = new Date("2026-05-24T12:00:00.000Z");

    update.mockResolvedValue(taskFixtures.createTaskRecord());

    await repository.softDeleteTask("user_123", "task_123", deletedAt);

    expect(update).toHaveBeenCalledWith({
      where: {
        id: "task_123",
        userId: "user_123",
        deletedAt: null,
      },
      data: {
        deletedAt,
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("maps soft delete races to a task not found error", async () => {
    const { prisma, update } = taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    update.mockRejectedValue(taskFixtures.createRecordNotFoundError());

    await expect(
      repository.softDeleteTask("user_123", "task_123"),
    ).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
  });

  it("reorders active tasks owned by the authenticated user in one transaction", async () => {
    const { $transaction, findMany, prisma, update } =
      taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    findMany.mockResolvedValue([
      {
        id: "task_2",
      },
      {
        id: "task_1",
      },
    ]);
    update
      .mockResolvedValueOnce(
        taskFixtures.createTaskRecord({ id: "task_2", order: 0 }),
      )
      .mockResolvedValueOnce(
        taskFixtures.createTaskRecord({ id: "task_1", order: 1 }),
      );

    await expect(
      repository.reorderTasks("user_123", ["task_2", "task_1"]),
    ).resolves.toEqual([
      taskFixtures.createTaskRecord({
        id: "task_2",
        order: 0,
      }),
      taskFixtures.createTaskRecord({
        id: "task_1",
        order: 1,
      }),
    ]);

    expect($transaction).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_123",
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: {
        id: "task_2",
        userId: "user_123",
        deletedAt: null,
      },
      data: {
        order: 0,
      },
      select: taskFixtures.taskSelect,
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: {
        id: "task_1",
        userId: "user_123",
        deletedAt: null,
      },
      data: {
        order: 1,
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("returns validation before reordering when the task order is incomplete", async () => {
    const { findMany, prisma, update } =
      taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    findMany.mockResolvedValue([
      {
        id: "task_1",
      },
      {
        id: "task_2",
      },
    ]);

    await expect(
      repository.reorderTasks("user_123", ["task_1"]),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Task order must include every active task exactly once.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns not found before reordering when any task is not active for the user", async () => {
    const { findMany, prisma, update } =
      taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    findMany.mockResolvedValue([
      {
        id: "task_1",
      },
    ]);

    await expect(
      repository.reorderTasks("user_123", ["task_1", "task_2"]),
    ).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("maps reorder update races to a task not found error", async () => {
    const { findMany, prisma, update } =
      taskFixtures.createMockTaskPrismaClient();
    const repository = createTaskRepository(prisma);

    findMany.mockResolvedValue([
      {
        id: "task_1",
      },
    ]);
    update.mockRejectedValue(taskFixtures.createRecordNotFoundError());

    await expect(
      repository.reorderTasks("user_123", ["task_1"]),
    ).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
  });
});
