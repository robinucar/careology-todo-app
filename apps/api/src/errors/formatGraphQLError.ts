import { unwrapResolverError } from "@apollo/server/errors";
import { GraphQLError, type GraphQLFormattedError } from "graphql";

import { isAppError } from "./AppError.js";
import { ERROR_CODES } from "./errorCodes.js";

export const formatGraphQLError = (
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError => {
  const originalError = unwrapResolverError(error);

  if (isAppError(originalError)) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
      },
    };
  }

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