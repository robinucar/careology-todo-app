import type { GraphQLContext } from "../../src/context/context.js";
import type { MockPrismaTask } from "./tasks.js";

export type TasksQueryData = {
  tasks: Array<{
    id: string;
    title: string;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CreateTaskMutationData = {
  createTask: {
    id: string;
    title: string;
    tags: string[];
    dueDate: string | null;
  };
};

export type UpdateTaskMutationData = {
  updateTask: {
    id: string;
    completed: boolean;
    title: string;
  };
};

export type DeleteTaskMutationData = {
  deleteTask: {
    id: string;
  };
};

export type ReorderTasksMutationData = {
  reorderTasks: Array<{
    id: string;
    order: number;
  }>;
};

export const TASKS_QUERY = `#graphql
  query Tasks($filters: TaskFiltersInput) {
    tasks(filters: $filters) {
      id
      title
      dueDate
      createdAt
      updatedAt
    }
  }
`;

export const TASK_IDS_QUERY = `#graphql
  query Tasks {
    tasks {
      id
    }
  }
`;

export const CREATE_TASK_MUTATION = `#graphql
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
      title
      tags
      dueDate
    }
  }
`;

export const CREATE_TASK_ID_MUTATION = `#graphql
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
      id
    }
  }
`;

export const UPDATE_TASK_MUTATION = `#graphql
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
      completed
      title
    }
  }
`;

export const UPDATE_TASK_ID_MUTATION = `#graphql
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
      id
    }
  }
`;

export const DELETE_TASK_MUTATION = `#graphql
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      id
    }
  }
`;

export const REORDER_TASKS_MUTATION = `#graphql
  mutation ReorderTasks($ids: [ID!]!) {
    reorderTasks(ids: $ids) {
      id
      order
    }
  }
`;

export const createMockTaskGraphQLContext = (
  task: MockPrismaTask,
  currentUserId: string | null = "user_123",
): GraphQLContext => {
  const $transaction = async (
    callback: (transaction: { task: MockPrismaTask }) => unknown,
  ) => callback({ task });

  return {
    requestId: "request_123",
    prisma: {
      $transaction,
      task,
    },
    currentUserId,
  } as unknown as GraphQLContext;
};
