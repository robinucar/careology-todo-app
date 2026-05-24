import { AppError, ERROR_CODES } from "../errors/index.js";

export const requireCurrentUserId = (currentUserId: string | null): string => {
  if (!currentUserId) {
    throw new AppError({
      code: ERROR_CODES.unauthenticated,
      message: "You must be logged in to perform this action.",
    });
  }

  return currentUserId;
};
