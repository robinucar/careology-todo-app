import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GraphQLContext } from "../../../src/context/context.js";
import { createTaskRecord } from "../../fixtures/tasks.js";

const mocks = vi.hoisted(() => {
  return {
    createAuthServiceDependencies: vi.fn(),
    createTask: vi.fn(),
    createTaskServiceDependencies: vi.fn(),
    deleteTask: vi.fn(),
    listTasks: vi.fn(),
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    reorderTasks: vi.fn(),
    updateTask: vi.fn(),
  };
});

vi.mock("../../../src/auth/authDependencies.js", () => {
  return {
    createAuthServiceDependencies: mocks.createAuthServiceDependencies,
  };
});

vi.mock("../../../src/auth/authService.js", () => {
  return {
    loginUser: mocks.loginUser,
    registerUser: mocks.registerUser,
  };
});

vi.mock("../../../src/tasks/taskDependencies.js", () => {
  return {
    createTaskServiceDependencies: mocks.createTaskServiceDependencies,
  };
});

vi.mock("../../../src/tasks/taskService.js", () => {
  return {
    createTask: mocks.createTask,
    deleteTask: mocks.deleteTask,
    listTasks: mocks.listTasks,
    reorderTasks: mocks.reorderTasks,
    updateTask: mocks.updateTask,
  };
});

const createContext = (
  overrides: Partial<GraphQLContext> = {},
): GraphQLContext => {
  return {
    requestId: "request_123",
    prisma: {
      user: {},
      task: {},
    },
    currentUserId: "user_123",
    ...overrides,
  } as unknown as GraphQLContext;
};

const loadResolvers = async () => {
  vi.resetModules();
  vi.stubEnv("JWT_SECRET", "test-jwt-secret-value-that-is-long-enough");
  vi.stubEnv("JWT_EXPIRES_IN", "1h");

  const module = await import("../../../src/graphql/resolvers.js");

  return module.resolvers;
};

const expectAuthDependenciesCreatedWith = (context: GraphQLContext) => {
  expect(mocks.createAuthServiceDependencies).toHaveBeenCalledWith({
    prisma: context.prisma,
    tokenConfig: {
      jwtSecret: "test-jwt-secret-value-that-is-long-enough",
      jwtExpiresIn: "1h",
    },
  });
};

const expectTaskDependenciesCreatedWith = (context: GraphQLContext) => {
  expect(mocks.createTaskServiceDependencies).toHaveBeenCalledWith({
    prisma: context.prisma,
    currentUserId: context.currentUserId,
  });
};

beforeEach(() => {
  mocks.createAuthServiceDependencies.mockReturnValue("auth-dependencies");
  mocks.createTaskServiceDependencies.mockReturnValue("task-dependencies");
  mocks.loginUser.mockResolvedValue({
    token: "login-token",
    user: {
      id: "user_123",
      name: "Task Master",
      email: "user@example.com",
    },
  });
  mocks.registerUser.mockResolvedValue({
    token: "register-token",
    user: {
      id: "user_123",
      name: "Task Master",
      email: "user@example.com",
    },
  });
  mocks.listTasks.mockResolvedValue([createTaskRecord()]);
  mocks.createTask.mockResolvedValue(createTaskRecord());
  mocks.updateTask.mockResolvedValue(createTaskRecord());
  mocks.deleteTask.mockResolvedValue(createTaskRecord());
  mocks.reorderTasks.mockResolvedValue([
    createTaskRecord({
      id: "task_1",
      order: 0,
    }),
    createTaskRecord({
      id: "task_2",
      order: 1,
    }),
  ]);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("resolvers", () => {
  it("resolves health checks", async () => {
    const resolvers = await loadResolvers();

    expect(resolvers.Query.health()).toBe("ok");
  });

  it("delegates register mutations to the auth service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const input = {
      name: "Task Master",
      email: "user@example.com",
      password: "password123",
    };

    await expect(
      resolvers.Mutation.register(undefined, { input }, context),
    ).resolves.toEqual({
      token: "register-token",
      user: {
        id: "user_123",
        name: "Task Master",
        email: "user@example.com",
      },
    });

    expectAuthDependenciesCreatedWith(context);
    expect(mocks.registerUser).toHaveBeenCalledWith(input, "auth-dependencies");
  });

  it("delegates login mutations to the auth service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const input = {
      email: "user@example.com",
      password: "password123",
    };

    await expect(
      resolvers.Mutation.login(undefined, { input }, context),
    ).resolves.toEqual({
      token: "login-token",
      user: {
        id: "user_123",
        name: "Task Master",
        email: "user@example.com",
      },
    });

    expectAuthDependenciesCreatedWith(context);
    expect(mocks.loginUser).toHaveBeenCalledWith(input, "auth-dependencies");
  });

  it("delegates task queries to the task service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const filters = {
      search: "London",
    };

    await expect(
      resolvers.Query.tasks(undefined, { filters }, context),
    ).resolves.toEqual([createTaskRecord()]);

    expectTaskDependenciesCreatedWith(context);
    expect(mocks.listTasks).toHaveBeenCalledWith(filters, "task-dependencies");
  });

  it("delegates createTask mutations to the task service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const input = {
      title: "Book London tickets",
    };

    await expect(
      resolvers.Mutation.createTask(undefined, { input }, context),
    ).resolves.toEqual(createTaskRecord());

    expectTaskDependenciesCreatedWith(context);
    expect(mocks.createTask).toHaveBeenCalledWith(input, "task-dependencies");
  });

  it("delegates updateTask mutations to the task service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const input = {
      completed: true,
    };

    await expect(
      resolvers.Mutation.updateTask(undefined, { id: "task_123", input }, context),
    ).resolves.toEqual(createTaskRecord());

    expect(mocks.updateTask).toHaveBeenCalledWith(
      "task_123",
      input,
      "task-dependencies",
    );
  });

  it("delegates deleteTask mutations to the task service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();

    await expect(
      resolvers.Mutation.deleteTask(undefined, { id: "task_123" }, context),
    ).resolves.toEqual(createTaskRecord());

    expect(mocks.deleteTask).toHaveBeenCalledWith(
      "task_123",
      "task-dependencies",
    );
  });

  it("delegates reorderTasks mutations to the task service", async () => {
    const resolvers = await loadResolvers();
    const context = createContext();
    const ids = ["task_1", "task_2"];

    await expect(
      resolvers.Mutation.reorderTasks(undefined, { ids }, context),
    ).resolves.toEqual([
      createTaskRecord({
        id: "task_1",
        order: 0,
      }),
      createTaskRecord({
        id: "task_2",
        order: 1,
      }),
    ]);

    expect(mocks.reorderTasks).toHaveBeenCalledWith(ids, "task-dependencies");
  });
});
