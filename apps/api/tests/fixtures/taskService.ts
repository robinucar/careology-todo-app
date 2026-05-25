import { vi } from "vitest";

import type { TaskRepository } from "../../src/tasks/taskRepository.js";
import type { TaskServiceDependencies } from "../../src/tasks/taskService.js";
import { createTaskRecord } from "./tasks.js";

export const TASK_SERVICE_USER_ID = "user_123";
export const TASK_SERVICE_TASK_ID = "task_123";

export const createTaskServiceDependencies = (
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
      (_userId: string, taskIds: string[]) => {
        return Promise.resolve(
          taskIds.map((taskId, order) => createTaskRecord({ id: taskId, order })),
        );
      },
    ),
  };

  return {
    currentUserId: TASK_SERVICE_USER_ID,
    ...repository,
    ...overrides,
  };
};
