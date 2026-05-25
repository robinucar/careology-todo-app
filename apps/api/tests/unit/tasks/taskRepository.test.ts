import { describe, expect, it } from "vitest";

import { ERROR_CODES } from "../../../src/errors/index.js";
import { createTaskRepository } from "../../../src/tasks/taskRepository.js";
import { createFutureUtcDate } from "../../fixtures/dates.js";
import * as taskFixtures from "../../fixtures/tasks.js";

type MockTaskClient = ReturnType<typeof taskFixtures.createMockTaskPrismaClient>;

const USER_ID = "user_123";
const TASK_ID = "task_123";

const activeTaskWhere = (taskId = TASK_ID) => {
  return {
    id: taskId,
    userId: USER_ID,
    deletedAt: null,
  };
};

const createRepositoryContext = () => {
  const client = taskFixtures.createMockTaskPrismaClient();

  return {
    ...client,
    repository: createTaskRepository(client.prisma),
  };
};

const expectTaskUpdate = (
  update: MockTaskClient["update"],
  data: Record<string, unknown>,
  taskId = TASK_ID,
) => {
  expect(update).toHaveBeenCalledWith({
    where: activeTaskWhere(taskId),
    data,
    select: taskFixtures.taskSelect,
  });
};

const expectTaskNotFound = async (promise: Promise<unknown>) => {
  await expect(promise).rejects.toMatchObject({
    code: ERROR_CODES.notFound,
    message: "Task not found.",
  });
};

describe("createTaskRepository", () => {
  it("finds active tasks scoped to the authenticated user", async () => {
    const { findMany, repository } = createRepositoryContext();
    const dueAfter = createFutureUtcDate(10);
    const dueBefore = createFutureUtcDate(30);

    findMany.mockResolvedValue([taskFixtures.createTaskRecord()]);

    await expect(
      repository.findTasks(USER_ID, {
        completed: false,
        dueAfter,
        dueBefore,
        search: "London",
        tags: ["travel"],
      }),
    ).resolves.toEqual([taskFixtures.createTaskRecord()]);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
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
    const { create, findFirst, repository } = createRepositoryContext();
    const task = taskFixtures.createTaskRecord();

    findFirst.mockResolvedValue({
      order: 2,
    });
    create.mockResolvedValue(task);

    await expect(
      repository.createTask(USER_ID, {
        title: task.title,
        description: null,
        dueDate: null,
        tags: ["travel"],
      }),
    ).resolves.toEqual(task);

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: USER_ID,
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
        userId: USER_ID,
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("updates only active tasks owned by the authenticated user", async () => {
    const { repository, update } = createRepositoryContext();

    update.mockResolvedValue(taskFixtures.createTaskRecord());

    await repository.updateTask(USER_ID, TASK_ID, {
      completed: true,
      title: "Updated title",
    });

    expectTaskUpdate(update, {
      completed: true,
      title: "Updated title",
    });
  });

  it("updates task weather fields", async () => {
    const { repository, update } = createRepositoryContext();
    const weatherFetchedAt = new Date("2026-05-25T12:00:00.000Z");

    update.mockResolvedValue(
      taskFixtures.createTaskRecord({
        weatherCity: "London",
        weatherTemperature: 12.5,
        weatherCondition: "Cloudy",
        weatherIconUrl: "https://cdn.weatherapi.com/weather/64x64/day/119.png",
        weatherFetchedAt,
      }),
    );

    await repository.updateTask(USER_ID, TASK_ID, {
      title: "Book London tickets",
      weatherCity: "London",
      weatherTemperature: 12.5,
      weatherCondition: "Cloudy",
      weatherIconUrl: "https://cdn.weatherapi.com/weather/64x64/day/119.png",
      weatherFetchedAt,
    });

    expectTaskUpdate(update, {
      title: "Book London tickets",
      weatherCity: "London",
      weatherTemperature: 12.5,
      weatherCondition: "Cloudy",
      weatherIconUrl: "https://cdn.weatherapi.com/weather/64x64/day/119.png",
      weatherFetchedAt,
    });
  });

  it("maps update races to a task not found error", async () => {
    const { repository, update } = createRepositoryContext();

    update.mockRejectedValue(taskFixtures.createRecordNotFoundError());

    await expectTaskNotFound(
      repository.updateTask(USER_ID, TASK_ID, {
        completed: true,
      }),
    );
  });

  it("soft deletes tasks instead of hard deleting them", async () => {
    const { repository, update } = createRepositoryContext();
    const deletedAt = new Date("2026-05-24T12:00:00.000Z");

    update.mockResolvedValue(taskFixtures.createTaskRecord());

    await repository.softDeleteTask(USER_ID, TASK_ID, deletedAt);

    expectTaskUpdate(update, {
      deletedAt,
    });
  });

  it("reorders active tasks owned by the authenticated user in one transaction", async () => {
    const { $transaction, findMany, repository, update } =
      createRepositoryContext();

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
      repository.reorderTasks(USER_ID, ["task_2", "task_1"]),
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
        userId: USER_ID,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: activeTaskWhere("task_2"),
      data: {
        order: 0,
      },
      select: taskFixtures.taskSelect,
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: activeTaskWhere("task_1"),
      data: {
        order: 1,
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("returns validation before reordering when the task order is incomplete", async () => {
    const { findMany, repository, update } = createRepositoryContext();

    findMany.mockResolvedValue([
      {
        id: "task_1",
      },
      {
        id: "task_2",
      },
    ]);

    await expect(
      repository.reorderTasks(USER_ID, ["task_1"]),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Task order must include every active task exactly once.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns not found before reordering when any task is not active for the user", async () => {
    const { findMany, repository, update } = createRepositoryContext();

    findMany.mockResolvedValue([
      {
        id: "task_1",
      },
    ]);

    await expectTaskNotFound(repository.reorderTasks(USER_ID, ["task_1", "task_2"]));
    expect(update).not.toHaveBeenCalled();
  });

});
