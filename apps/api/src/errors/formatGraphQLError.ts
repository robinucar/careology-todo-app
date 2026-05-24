import { unwrapResolverError } from "@apollo/server/errors";
import { GraphQLError, type GraphQLFormattedError } from "graphql";

import { isAppError } from "./AppError.js";
import { ERROR_CODES } from "./errorCodes.js";

const getAppError = (error: unknown) => {
  const originalError = unwrapResolverError(error);

  if (isAppError(originalError)) {
    return originalError;
  }

  if (
    originalError instanceof GraphQLError &&
    isAppError(originalError.originalError)
  ) {
    return originalError.originalError;
  }

  return null;
};

export const formatGraphQLError = (
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError => {
  const appError = getAppError(error);

  if (appError) {
    return {
      message: appError.message,
      extensions: {
        code: appError.code,
      },
    };
  }

  const originalError = unwrapResolverError(error);

  if (originalError instanceof GraphQLError) {
    return formattedError;
  }

  return {
    message: "Something went wrong.",
    extensions: {
      code: ERROR_CODES.internalServerError,
    },
  };
};
