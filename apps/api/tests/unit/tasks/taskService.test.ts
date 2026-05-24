import { describe, expect, it, vi } from "vitest";

import { AppError, ERROR_CODES } from "../../../src/errors/index.js";
import type { TaskRepository } from "../../../src/tasks/taskRepository.js";
import {
  createTask,
  deleteTask,
  listTasks,
  reorderTasks,
  type TaskServiceDependencies,
  updateTask,
} from "../../../src/tasks/taskService.js";
import { createTaskRecord } from "../../fixtures/tasks.js";

const createDependencies = (
  overrides: Partial<TaskServiceDependencies> = {},
): TaskServiceDependencies => {
  const task = createTaskRecord();
  const repository: TaskRepository = {
    findTasks: vi.fn().mockResolvedValue([task]),
    createTask: vi.fn().mockResolvedValue(task),
    findActiveTaskById: vi.fn().mockResolvedValue(task),
    updateTask: vi.fn().mockResolvedValue(task),
    softDeleteTask: vi.fn().mockResolvedValue(task),
    reorderTasks: vi.fn().mockImplementation(
      (_userId: string, taskIds: string[]) =>
        Promise.resolve(
          taskIds.map((taskId, order) =>
            createTaskRecord({
              id: taskId,
              order,
            }),
          ),
        ),
    ),
  };

  return {
    currentUserId: "user_123",
    ...repository,
    ...overrides,
  };
};

describe("listTasks", () => {
  it("lists tasks for the authenticated user with normalised filters", async () => {
    const dependencies = createDependencies();

    await listTasks(
      {
        search: "  London  ",
        completed: false,
        tags: [" Travel ", "travel"],
        dueBefore: "2026-06-01",
      },
      dependencies,
    );

    expect(dependencies.findTasks).toHaveBeenCalledWith("user_123", {
      search: "London",
      completed: false,
      tags: ["travel"],
      dueBefore: new Date("2026-06-01T00:00:00.000Z"),
      dueAfter: undefined,
    });
  });

  it("requires authentication", async () => {
    const dependencies = createDependencies({
      currentUserId: null,
    });

    await expect(listTasks({}, dependencies)).rejects.toMatchObject({
      code: ERROR_CODES.unauthenticated,
      message: "You must be logged in to perform this action.",
    });
    expect(dependencies.findTasks).not.toHaveBeenCalled();
  });
});

describe("createTask", () => {
  it("creates tasks for the authenticated user with normalised input", async () => {
    const dependencies = createDependencies();

    await createTask(
      {
        title: "  Book London tickets  ",
        description: "   ",
        dueDate: "2026-05-24",
        tags: [" Travel ", "travel"],
      },
      dependencies,
    );

    expect(dependencies.createTask).toHaveBeenCalledWith("user_123", {
      title: "Book London tickets",
      description: null,
      dueDate: new Date("2026-05-24T00:00:00.000Z"),
      tags: ["travel"],
    });
  });

  it("returns validation errors for invalid input", async () => {
    const dependencies = createDependencies();

    await expect(
      createTask(
        {
          title: "   ",
        },
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Task title is required.",
    });
    expect(dependencies.createTask).not.toHaveBeenCalled();
  });
});

describe("updateTask", () => {
  it("updates an active task owned by the authenticated user", async () => {
    const dependencies = createDependencies();

    await updateTask(
      "task_123",
      {
        completed: true,
        title: " Updated title ",
      },
      dependencies,
    );

    expect(dependencies.findActiveTaskById).toHaveBeenCalledWith(
      "user_123",
      "task_123",
    );
    expect(dependencies.updateTask).toHaveBeenCalledWith("user_123", "task_123", {
      completed: true,
      title: "Updated title",
    });
  });

  it("rejects empty updates", async () => {
    const dependencies = createDependencies();

    await expect(updateTask("task_123", {}, dependencies)).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "At least one task field must be provided.",
    });
    expect(dependencies.findActiveTaskById).not.toHaveBeenCalled();
    expect(dependencies.updateTask).not.toHaveBeenCalled();
  });

  it("returns not found when the task is missing or not owned by the user", async () => {
    const dependencies = createDependencies({
      findActiveTaskById: vi.fn().mockResolvedValue(null),
    });

    await expect(
      updateTask(
        "task_123",
        {
          completed: true,
        },
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
    expect(dependencies.updateTask).not.toHaveBeenCalled();
  });
});

describe("deleteTask", () => {
  it("soft deletes active tasks owned by the authenticated user", async () => {
    const dependencies = createDependencies();

    await deleteTask("task_123", dependencies);

    expect(dependencies.findActiveTaskById).toHaveBeenCalledWith(
      "user_123",
      "task_123",
    );
    expect(dependencies.softDeleteTask).toHaveBeenCalledWith(
      "user_123",
      "task_123",
    );
  });

  it("returns not found when deleting missing tasks", async () => {
    const dependencies = createDependencies({
      findActiveTaskById: vi.fn().mockResolvedValue(null),
    });

    await expect(deleteTask("task_123", dependencies)).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
    expect(dependencies.softDeleteTask).not.toHaveBeenCalled();
  });
});

describe("reorderTasks", () => {
  it("reorders active tasks owned by the authenticated user", async () => {
    const dependencies = createDependencies();

    await expect(
      reorderTasks([" task_1 ", "task_2"], dependencies),
    ).resolves.toEqual([
      expect.objectContaining({
        id: "task_1",
        order: 0,
      }),
      expect.objectContaining({
        id: "task_2",
        order: 1,
      }),
    ]);

    expect(dependencies.reorderTasks).toHaveBeenCalledWith("user_123", [
      "task_1",
      "task_2",
    ]);
  });

  it("rejects duplicate task ids", async () => {
    const dependencies = createDependencies();

    await expect(
      reorderTasks(["task_1", " task_1 "], dependencies),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Task ids must be unique.",
    });
    expect(dependencies.reorderTasks).not.toHaveBeenCalled();
  });

  it("returns repository not found errors when any task is missing", async () => {
    const dependencies = createDependencies({
      reorderTasks: vi.fn().mockRejectedValue(
        new AppError({
          code: ERROR_CODES.notFound,
          message: "Task not found.",
        }),
      ),
    });

    await expect(reorderTasks(["task_1", "task_2"], dependencies)).rejects.toMatchObject({
      code: ERROR_CODES.notFound,
      message: "Task not found.",
    });
  });

  it("throws AppError instances for validation failures", async () => {
    const dependencies = createDependencies();

    await expect(reorderTasks([], dependencies)).rejects.toBeInstanceOf(AppError);
  });
});
