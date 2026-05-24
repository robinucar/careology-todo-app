import "dotenv/config";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ERROR_CODES } from "../../../src/errors/index.js";
import { createTaskServiceDependencies } from "../../../src/tasks/taskDependencies.js";
import {
  createTask,
  deleteTask,
  listTasks,
  reorderTasks,
  updateTask,
} from "../../../src/tasks/taskService.js";

type AppPrismaClient = typeof import("../../../src/db/prisma.js").prisma;

const isDatabaseTestRequested = process.env["RUN_DB_TESTS"] === "true";
const describeDatabase = isDatabaseTestRequested ? describe : describe.skip;

let prisma: AppPrismaClient;

const createdUserIds: string[] = [];
const testRunId = `task-persistence-${Date.now()}-${Math.random()
  .toString(36)
  .slice(2)}`;

const createDependencies = (currentUserId: string) => {
  return createTaskServiceDependencies({
    currentUserId,
    prisma,
  });
};

const createTestUser = async (name: string) => {
  const user = await prisma.user.create({
    data: {
      email: `${testRunId}-${name}@example.com`,
      passwordHash: "test-password-hash",
    },
    select: {
      id: true,
      email: true,
    },
  });

  createdUserIds.push(user.id);

  return user;
};

beforeAll(async () => {
  if (!isDatabaseTestRequested) {
    return;
  }

  if (!process.env["DATABASE_URL"]) {
    throw new Error("DATABASE_URL is required to run database integration tests.");
  }

  ({ prisma } = await import("../../../src/db/prisma.js"));
});

afterEach(async () => {
  if (!isDatabaseTestRequested || createdUserIds.length === 0) {
    return;
  }

  await prisma.task.deleteMany({
    where: {
      userId: {
        in: createdUserIds,
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: createdUserIds,
      },
    },
  });

  createdUserIds.length = 0;
});

afterAll(async () => {
  if (!isDatabaseTestRequested) {
    return;
  }

  await prisma.$disconnect();
});

describeDatabase("task persistence integration", () => {
  it("persists created tasks and applies task filters", async () => {
    const user = await createTestUser("filters");
    const dependencies = createDependencies(user.id);

    const createdTask = await createTask(
      {
        title: "  Book London tickets  ",
        description: "  Use the early train  ",
        dueDate: "2026-06-01",
        tags: [" Travel ", "travel", "Urgent"],
      },
      dependencies,
    );
    await createTask(
      {
        title: "Call Paris clinic",
        tags: ["health"],
      },
      dependencies,
    );

    const filteredTasks = await listTasks(
      {
        search: "london",
        tags: ["travel"],
      },
      dependencies,
    );
    const persistedTask = await prisma.task.findUniqueOrThrow({
      where: {
        id: createdTask.id,
      },
      select: {
        title: true,
        description: true,
        dueDate: true,
        tags: true,
        userId: true,
        deletedAt: true,
      },
    });

    expect(filteredTasks).toHaveLength(1);
    expect(filteredTasks[0]).toMatchObject({
      id: createdTask.id,
      title: "Book London tickets",
      description: "Use the early train",
      tags: ["travel", "urgent"],
    });
    expect(filteredTasks[0]?.dueDate?.toISOString()).toBe(
      "2026-06-01T00:00:00.000Z",
    );
    expect(persistedTask).toEqual({
      title: "Book London tickets",
      description: "Use the early train",
      dueDate: new Date("2026-06-01T00:00:00.000Z"),
      tags: ["travel", "urgent"],
      userId: user.id,
      deletedAt: null,
    });
  });

  it("keeps tasks scoped to the owning user", async () => {
    const owner = await createTestUser("owner");
    const otherUser = await createTestUser("other-user");
    const ownerDependencies = createDependencies(owner.id);
    const otherUserDependencies = createDependencies(otherUser.id);

    await createTask(
      {
        title: "Owner private task",
      },
      ownerDependencies,
    );
    const otherUserTask = await createTask(
      {
        title: "Other user private task",
      },
      otherUserDependencies,
    );

    const ownerTasks = await listTasks({}, ownerDependencies);

    await expect(
      updateTask(
        otherUserTask.id,
        {
          completed: true,
        },
        ownerDependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
    expect(ownerTasks.map((task) => task.title)).toEqual(["Owner private task"]);
    await expect(
      prisma.task.findUniqueOrThrow({
        where: {
          id: otherUserTask.id,
        },
        select: {
          completed: true,
        },
      }),
    ).resolves.toEqual({
      completed: false,
    });
  });

  it("soft deletes tasks and hides them from future lists", async () => {
    const user = await createTestUser("soft-delete");
    const dependencies = createDependencies(user.id);
    const task = await createTask(
      {
        title: "Archive old paperwork",
      },
      dependencies,
    );

    const deletedTask = await deleteTask(task.id, dependencies);
    const visibleTasks = await listTasks({}, dependencies);
    const persistedTask = await prisma.task.findUniqueOrThrow({
      where: {
        id: task.id,
      },
      select: {
        deletedAt: true,
      },
    });

    expect(deletedTask.id).toBe(task.id);
    expect(persistedTask.deletedAt).toEqual(expect.any(Date));
    expect(visibleTasks).toEqual([]);
  });

  it("persists task ordering for the authenticated user", async () => {
    const user = await createTestUser("ordering");
    const dependencies = createDependencies(user.id);
    const firstTask = await createTask(
      {
        title: "First task",
      },
      dependencies,
    );
    const secondTask = await createTask(
      {
        title: "Second task",
      },
      dependencies,
    );
    const thirdTask = await createTask(
      {
        title: "Third task",
      },
      dependencies,
    );

    expect(firstTask.order).toBe(0);
    expect(secondTask.order).toBe(1);
    expect(thirdTask.order).toBe(2);

    await expect(
      reorderTasks([secondTask.id, firstTask.id], dependencies),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Task order must include every active task exactly once.",
    });

    await reorderTasks([secondTask.id, firstTask.id, thirdTask.id], dependencies);

    const orderedTasks = await listTasks({}, dependencies);

    expect(
      orderedTasks.map((task) => ({
        id: task.id,
        order: task.order,
      })),
    ).toEqual([
      {
        id: secondTask.id,
        order: 0,
      },
      {
        id: firstTask.id,
        order: 1,
      },
      {
        id: thirdTask.id,
        order: 2,
      },
    ]);
  });
});
