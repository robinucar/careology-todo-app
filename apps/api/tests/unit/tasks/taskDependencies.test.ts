import { describe, expect, it, vi } from "vitest";

import type { TaskRepositoryPrismaClient } from "../../../src/tasks/taskRepository.js";

const mocks = vi.hoisted(() => {
  return {
    createTaskRepository: vi.fn(),
  };
});

vi.mock("../../../src/tasks/taskRepository.js", () => {
  return {
    createTaskRepository: mocks.createTaskRepository,
  };
});

describe("createTaskServiceDependencies", () => {
  it("combines task repository dependencies with the current user id", async () => {
    const repository = {
      findTasks: vi.fn(),
      createTask: vi.fn(),
      findActiveTaskById: vi.fn(),
      updateTask: vi.fn(),
      softDeleteTask: vi.fn(),
      reorderTasks: vi.fn(),
    };
    const prisma = {
      $transaction: vi.fn(),
      task: {},
    } as unknown as TaskRepositoryPrismaClient;

    mocks.createTaskRepository.mockReturnValue(repository);

    const { createTaskServiceDependencies } = await import(
      "../../../src/tasks/taskDependencies.js"
    );

    expect(
      createTaskServiceDependencies({
        currentUserId: "user_123",
        prisma,
      }),
    ).toEqual({
      ...repository,
      currentUserId: "user_123",
    });
    expect(mocks.createTaskRepository).toHaveBeenCalledWith(prisma);
  });
});
