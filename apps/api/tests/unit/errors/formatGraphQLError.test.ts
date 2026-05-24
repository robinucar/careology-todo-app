import { GraphQLError } from "graphql";
import { describe, expect, it } from "vitest";

import {
  AppError,
  ERROR_CODES,
  formatGraphQLError,
} from "../../../src/errors/index.js";

describe("formatGraphQLError", () => {
  it("returns AppError messages and codes", () => {
    const result = formatGraphQLError(
      { message: "Original formatted error" },
      new AppError({
        code: ERROR_CODES.forbidden,
        message: "You cannot access this resource.",
      }),
    );

    expect(result).toEqual({
      message: "You cannot access this resource.",
      extensions: {
        code: ERROR_CODES.forbidden,
      },
    });
  });

  it("preserves formatted GraphQL errors", () => {
    const formattedError = {
      message: "GraphQL validation failed",
      extensions: {
        code: "GRAPHQL_VALIDATION_FAILED",
      },
    };

    const result = formatGraphQLError(
      formattedError,
      new GraphQLError("GraphQL validation failed"),
    );

    expect(result).toBe(formattedError);
  });

  it("hides unexpected error details", () => {
    const result = formatGraphQLError(
      { message: "Database password leaked" },
      new Error("Database password leaked"),
    );

    expect(result).toEqual({
      message: "Something went wrong.",
      extensions: {
        code: ERROR_CODES.internalServerError,
      },
    });
  });
});