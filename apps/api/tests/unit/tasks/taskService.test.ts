import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "../../../src/errors/index.js";
import {
  createTask,
  deleteTask,
  listTasks,
  reorderTasks,
  type TaskServiceDependencies,
  updateTask,
} from "../../../src/tasks/taskService.js";
import {
  createTaskServiceDependencies as createDependencies,
  TASK_SERVICE_TASK_ID,
  TASK_SERVICE_USER_ID,
} from "../../fixtures/taskService.js";
import { createFutureUtcDate, formatDateInput } from "../../fixtures/dates.js";
import { createTaskRecord } from "../../fixtures/tasks.js";
import {
  clearedWeatherFields,
  createWeather,
  createWeatherService,
} from "../../fixtures/weather.js";

const expectTaskCreatedWith = (
  dependencies: TaskServiceDependencies,
  input: Record<string, unknown>,
) => {
  expect(dependencies.createTask).toHaveBeenCalledWith(
    TASK_SERVICE_USER_ID,
    input,
  );
};

const expectTaskUpdatedWith = (
  dependencies: TaskServiceDependencies,
  input: Record<string, unknown>,
) => {
  expect(dependencies.updateTask).toHaveBeenCalledWith(
    TASK_SERVICE_USER_ID,
    TASK_SERVICE_TASK_ID,
    input,
  );
};

describe("listTasks", () => {
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
  it("adds weather data when a new task title contains a supported city", async () => {
    const weather = createWeather();
    const weatherService = createWeatherService({
      getWeatherForTaskTitle: vi.fn().mockResolvedValue({
        status: "found",
        weather,
      }),
    });
    const dependencies = createDependencies({
      weatherService,
    });

    await createTask(
      {
        title: "Book tickets for London",
      },
      dependencies,
    );

    expect(weatherService.getWeatherForTaskTitle).toHaveBeenCalledWith(
      "Book tickets for London",
      null,
    );
    expectTaskCreatedWith(dependencies, {
      title: "Book tickets for London",
      description: null,
      dueDate: null,
      tags: [],
      ...weather,
    });
  });

  it("still creates tasks when weather lookup fails", async () => {
    const weatherService = createWeatherService({
      getWeatherForTaskTitle: vi.fn().mockRejectedValue(new Error("Weather down")),
    });
    const dependencies = createDependencies({
      weatherService,
    });

    await createTask(
      {
        title: "Book tickets for London",
      },
      dependencies,
    );

    expectTaskCreatedWith(dependencies, {
      title: "Book tickets for London",
      description: null,
      dueDate: null,
      tags: [],
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
      TASK_SERVICE_TASK_ID,
      {
        completed: true,
        title: " Updated title ",
      },
      dependencies,
    );

    expect(dependencies.findActiveTaskById).toHaveBeenCalledWith(
      TASK_SERVICE_USER_ID,
      TASK_SERVICE_TASK_ID,
    );
    expectTaskUpdatedWith(dependencies, {
      completed: true,
      title: "Updated title",
    });
  });

  it("refreshes weather data when the task title changes", async () => {
    const weather = createWeather({
      weatherCity: "Tokyo",
    });
    const weatherService = createWeatherService({
      getWeatherForTaskTitle: vi.fn().mockResolvedValue({
        status: "found",
        weather,
      }),
    });
    const dependencies = createDependencies({
      weatherService,
    });

    await updateTask(
      TASK_SERVICE_TASK_ID,
      {
        title: "Plan trip to Tokyo",
      },
      dependencies,
    );

    expect(weatherService.getWeatherForTaskTitle).toHaveBeenCalledWith(
      "Plan trip to Tokyo",
      null,
    );
    expectTaskUpdatedWith(dependencies, {
      title: "Plan trip to Tokyo",
      ...weather,
    });
  });

  it("does not refresh weather data when the title is unchanged", async () => {
    const weatherService = createWeatherService();
    const dependencies = createDependencies({
      weatherService,
    });

    await updateTask(
      TASK_SERVICE_TASK_ID,
      {
        completed: true,
      },
      dependencies,
    );

    expect(weatherService.getWeatherForTaskTitle).not.toHaveBeenCalled();
    expectTaskUpdatedWith(dependencies, {
      completed: true,
    });
  });

  it("refreshes weather data when the due date changes", async () => {
    const dueDate = createFutureUtcDate(7);
    const dueDateInput = formatDateInput(dueDate);
    const weather = createWeather();
    const weatherService = createWeatherService({
      getWeatherForTaskTitle: vi.fn().mockResolvedValue({
        status: "found",
        weather,
      }),
    });
    const dependencies = createDependencies({
      findActiveTaskById: vi.fn().mockResolvedValue(
        createTaskRecord({
          title: "Book tickets for London",
        }),
      ),
      weatherService,
    });

    await updateTask(
      TASK_SERVICE_TASK_ID,
      {
        dueDate: dueDateInput,
      },
      dependencies,
    );

    expect(weatherService.getWeatherForTaskTitle).toHaveBeenCalledWith(
      "Book tickets for London",
      dueDate,
    );
    expectTaskUpdatedWith(dependencies, {
      dueDate,
      ...weather,
    });
  });

  it("clears stale weather data on weather refresh misses", async () => {
    const scenarios = [
      {
        getLookupResult: () => Promise.resolve({ status: "no_city" as const }),
        title: "Prepare meals",
      },
      {
        getLookupResult: () => Promise.resolve({ status: "unavailable" as const }),
        title: "Book tickets for London",
      },
      {
        getLookupResult: () => Promise.reject(new Error("Weather down")),
        title: "Book tickets for London",
      },
    ];

    for (const { getLookupResult, title } of scenarios) {
      const weatherService = createWeatherService({
        getWeatherForTaskTitle: vi.fn().mockImplementation(getLookupResult),
      });
      const dependencies = createDependencies({
        weatherService,
      });

      await updateTask(TASK_SERVICE_TASK_ID, { title }, dependencies);

      expect(weatherService.getWeatherForTaskTitle).toHaveBeenCalledWith(
        title,
        null,
      );
      expectTaskUpdatedWith(dependencies, {
        title,
        ...clearedWeatherFields,
      });
    }
  });

  it("rejects empty updates", async () => {
    const dependencies = createDependencies();

    await expect(
      updateTask(TASK_SERVICE_TASK_ID, {}, dependencies),
    ).rejects.toMatchObject({
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
        TASK_SERVICE_TASK_ID,
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

    await deleteTask(TASK_SERVICE_TASK_ID, dependencies);

    expect(dependencies.findActiveTaskById).toHaveBeenCalledWith(
      TASK_SERVICE_USER_ID,
      TASK_SERVICE_TASK_ID,
    );
    expect(dependencies.softDeleteTask).toHaveBeenCalledWith(
      TASK_SERVICE_USER_ID,
      TASK_SERVICE_TASK_ID,
    );
  });

  it("returns not found when deleting missing tasks", async () => {
    const dependencies = createDependencies({
      findActiveTaskById: vi.fn().mockResolvedValue(null),
    });

    await expect(
      deleteTask(TASK_SERVICE_TASK_ID, dependencies),
    ).rejects.toMatchObject({
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

    expect(dependencies.reorderTasks).toHaveBeenCalledWith(TASK_SERVICE_USER_ID, [
      "task_1",
      "task_2",
    ]);
  });

  it("returns validation errors before reordering invalid input", async () => {
    const dependencies = createDependencies();

    await expect(
      reorderTasks(["task_1", " task_1 "], dependencies),
    ).rejects.toMatchObject({
      code: ERROR_CODES.validationError,
      message: "Task ids must be unique.",
    });
    expect(dependencies.reorderTasks).not.toHaveBeenCalled();
  });
});
