import {
  createTaskRepository,
  type TaskRepositoryPrismaClient,
} from "./taskRepository.js";
import type { TaskServiceDependencies } from "./taskService.js";
import type { WeatherService } from "../weather/index.js";

type CreateTaskServiceDependenciesInput = {
  currentUserId: string | null;
  prisma: TaskRepositoryPrismaClient;
  weatherService?: WeatherService;
};

export const createTaskServiceDependencies = ({
  currentUserId,
  prisma,
  weatherService,
}: CreateTaskServiceDependenciesInput): TaskServiceDependencies => {
  return {
    ...createTaskRepository(prisma),
    currentUserId,
    ...(weatherService ? { weatherService } : {}),
  };
};
