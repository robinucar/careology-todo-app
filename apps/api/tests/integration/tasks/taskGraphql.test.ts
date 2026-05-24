import { describe, expect, it } from "vitest";

import * as taskGraphql from "../../fixtures/taskGraphql.js";
import * as taskFixtures from "../../fixtures/tasks.js";
import * as graphQLTest from "../../helpers/graphql.js";

graphQLTest.registerGraphQLTestCleanup();

describe("task GraphQL integration", () => {
  it("lists authenticated user tasks through GraphQL", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    task.findMany.mockResolvedValue([
      taskFixtures.createTaskRecord({
        dueDate: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ]);

    const response = await server.executeOperation<taskGraphql.TasksQueryData>(
      {
        query: taskGraphql.TASKS_QUERY,
        variables: {
          filters: {
            search: " London ",
            tags: [" Travel ", "travel"],
          },
        },
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.tasks).toEqual([
      {
        id: "task_123",
        title: "Book London tickets",
        dueDate: "2026-06-01T00:00:00.000Z",
        createdAt: "2026-05-24T10:00:00.000Z",
        updatedAt: "2026-05-24T10:00:00.000Z",
      },
    ]);
    expect(task.findMany).toHaveBeenCalledWith(
      taskFixtures.createFilteredTaskFindManyCall(),
    );
  });

  it("rejects unauthenticated task queries", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    const response = await server.executeOperation(
      {
        query: taskGraphql.TASK_IDS_QUERY,
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task, null),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.data).toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: "You must be logged in to perform this action.",
        extensions: {
          code: "UNAUTHENTICATED",
        },
      }),
    ]);
    expect(task.findMany).not.toHaveBeenCalled();
  });

  it("creates tasks through GraphQL with normalised input", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    task.findFirst.mockResolvedValue({
      order: 2,
    });
    task.create.mockResolvedValue(
      taskFixtures.createTaskRecord({
        dueDate: new Date("2026-06-01T00:00:00.000Z"),
        order: 3,
      }),
    );

    const response = await server.executeOperation<
      taskGraphql.CreateTaskMutationData
    >(
      {
        query: taskGraphql.CREATE_TASK_MUTATION,
        variables: {
          input: {
            title: "  Book London tickets  ",
            dueDate: "2026-06-01",
            tags: [" Travel ", "travel"],
          },
        },
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.createTask).toEqual({
      id: "task_123",
      title: "Book London tickets",
      tags: ["travel"],
      dueDate: "2026-06-01T00:00:00.000Z",
    });
    expect(task.findFirst).toHaveBeenCalledWith({
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
    expect(task.create).toHaveBeenCalledWith({
      data: {
        title: "Book London tickets",
        description: null,
        dueDate: new Date("2026-06-01T00:00:00.000Z"),
        order: 3,
        tags: ["travel"],
        userId: "user_123",
      },
      select: taskFixtures.taskSelect,
    });
  });

  it("returns validation errors for invalid create input", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    const response = await server.executeOperation(
      {
        query: taskGraphql.CREATE_TASK_ID_MUTATION,
        variables: {
          input: {
            title: "   ",
          },
        },
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.data).toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: "Task title is required.",
        extensions: {
          code: "VALIDATION_ERROR",
        },
      }),
    ]);
    expect(task.create).not.toHaveBeenCalled();
  });

  it("updates tasks through GraphQL", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    task.findFirst.mockResolvedValue(taskFixtures.createTaskRecord());
    task.update.mockResolvedValue(
      taskFixtures.createTaskRecord({
        completed: true,
        title: "Updated title",
      }),
    );

    const response = await server.executeOperation<
      taskGraphql.UpdateTaskMutationData
    >(
      {
        query: taskGraphql.UPDATE_TASK_MUTATION,
        variables: {
          id: "task_123",
          input: {
            completed: true,
            title: " Updated title ",
          },
        },
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.updateTask).toEqual({
      id: "task_123",
      completed: true,
      title: "Updated title",
    });
    expect(task.findFirst).toHaveBeenCalledWith({
      where: taskFixtures.createActiveTaskWhere(),
      select: taskFixtures.taskSelect,
    });
    expect(task.update).toHaveBeenCalledWith(
      taskFixtures.createTaskUpdateCall({
        completed: true,
        title: "Updated title",
      }),
    );
  });

  it("returns not found for missing update tasks", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    task.findFirst.mockResolvedValue(null);

    const response = await server.executeOperation(
      {
        query: taskGraphql.UPDATE_TASK_ID_MUTATION,
        variables: {
          id: "task_missing",
          input: {
            completed: true,
          },
        },
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.data).toBeNull();
    expect(result.errors).toEqual([
      expect.objectContaining({
        message: "Task not found.",
        extensions: {
          code: "NOT_FOUND",
        },
      }),
    ]);
    expect(task.update).not.toHaveBeenCalled();
  });

  it("soft deletes tasks through GraphQL", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    task.findFirst.mockResolvedValue(taskFixtures.createTaskRecord());
    task.update.mockResolvedValue(taskFixtures.createTaskRecord());

    const response = await server.executeOperation<
      taskGraphql.DeleteTaskMutationData
    >(
      {
        query: taskGraphql.DELETE_TASK_MUTATION,
        variables: {
          id: "task_123",
        },
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteTask).toEqual({
      id: "task_123",
    });
    expect(task.update).toHaveBeenCalledWith(
      taskFixtures.createTaskUpdateCall({
        deletedAt: expect.any(Date),
      }),
    );
  });

  it("reorders tasks through GraphQL", async () => {
    const server = await graphQLTest.createTestGraphQLServer();
    const task = taskFixtures.createMockPrismaTask();

    task.findMany.mockResolvedValue([
      {
        id: "task_1",
      },
      {
        id: "task_2",
      },
    ]);
    task.update
      .mockResolvedValueOnce(
        taskFixtures.createTaskRecord({ id: "task_1", order: 0 }),
      )
      .mockResolvedValueOnce(
        taskFixtures.createTaskRecord({ id: "task_2", order: 1 }),
      );

    const response = await server.executeOperation<
      taskGraphql.ReorderTasksMutationData
    >(
      {
        query: taskGraphql.REORDER_TASKS_MUTATION,
        variables: {
          ids: ["task_1", "task_2"],
        },
      },
      {
        contextValue: taskGraphql.createMockTaskGraphQLContext(task),
      },
    );

    const result = graphQLTest.getSingleResult(response);

    expect(result.errors).toBeUndefined();
    expect(result.data?.reorderTasks).toEqual([
      {
        id: "task_1",
        order: 0,
      },
      {
        id: "task_2",
        order: 1,
      },
    ]);
    expect(task.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user_123",
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });
    expect(task.update).toHaveBeenNthCalledWith(
      1,
      taskFixtures.createTaskUpdateCall({
        order: 0,
      },
      "task_1",
    ),
    );
    expect(task.update).toHaveBeenNthCalledWith(
      2,
      taskFixtures.createTaskUpdateCall({
        order: 1,
      },
      "task_2",
    ),
    );
  });
});
