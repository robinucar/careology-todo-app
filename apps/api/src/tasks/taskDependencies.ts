import {
  createTaskRepository,
  type TaskRepositoryPrismaClient,
} from "./taskRepository.js";
import type { TaskServiceDependencies } from "./taskService.js";

type CreateTaskServiceDependenciesInput = {
  currentUserId: string | null;
  prisma: TaskRepositoryPrismaClient;
};

export const createTaskServiceDependencies = ({
  currentUserId,
  prisma,
}: CreateTaskServiceDependenciesInput): TaskServiceDependencies => {
  return {
    ...createTaskRepository(prisma),
    currentUserId,
  };
};
