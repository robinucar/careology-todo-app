import { describe, expect, it } from "vitest";

import {
  createTaskInputSchema,
  reorderTaskIdsSchema,
  taskFiltersInputSchema,
  updateTaskInputSchema,
} from "../../../src/tasks/taskValidation.js";
import {
  createFutureDateTimeInput,
  createFutureUtcDate,
  formatDateInput,
} from "../../fixtures/dates.js";

describe("createTaskInputSchema", () => {
  it("normalises valid task input", () => {
    const dueDate = createFutureUtcDate(45);
    const dueDateInput = formatDateInput(dueDate);
    const result = createTaskInputSchema.parse({
      title: "  Book London tickets  ",
      description: "   ",
      dueDate: dueDateInput,
      tags: [" High ", "high", "", "Urgent"],
    });

    expect(result).toEqual({
      title: "Book London tickets",
      description: null,
      dueDate,
      tags: ["high", "urgent"],
    });
  });

  it("defaults optional nullable fields", () => {
    const result = createTaskInputSchema.parse({
      title: "Buy milk",
    });

    expect(result).toEqual({
      title: "Buy milk",
      description: null,
      dueDate: null,
      tags: [],
    });
  });

  it("rejects invalid create task input", () => {
    expect(() =>
      createTaskInputSchema.parse({
        title: "   ",
      }),
    ).toThrow("Task title is required.");

    expect(() =>
      createTaskInputSchema.parse({
        title: "Invalid due date",
        dueDate: "2026-02-30",
      }),
    ).toThrow("Due date must be an ISO date or date-time string.");

    expect(() =>
      createTaskInputSchema.parse({
        title: "Past due date",
        dueDate: "2000-01-01",
      }),
    ).toThrow("Due date cannot be in the past.");

    expect(() =>
      createTaskInputSchema.parse({
        title: "Too many tags",
        tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
      }),
    ).toThrow("Tags cannot contain more than 10 items.");

    expect(() =>
      createTaskInputSchema.parse({
        title: "Long tag",
        tags: ["a".repeat(33)],
      }),
    ).toThrow("Tags must be 32 characters or fewer.");

    expect(() =>
      createTaskInputSchema.parse({
        title: "Unknown tag",
        tags: ["travel"],
      }),
    ).toThrow("Tags must be one of: Low, Medium, High, Not urgent, Urgent.");
  });
});

describe("updateTaskInputSchema", () => {
  it("keeps omitted update fields undefined", () => {
    expect(updateTaskInputSchema.parse({})).toEqual({});
  });

  it("normalises partial update input", () => {
    const result = updateTaskInputSchema.parse({
      title: "  Updated title  ",
      description: " Updated description ",
      completed: true,
      dueDate: "",
      tags: null,
    });

    expect(result).toEqual({
      title: "Updated title",
      description: "Updated description",
      completed: true,
      dueDate: null,
      tags: [],
    });
  });

  it("accepts ISO date-time due dates", () => {
    const dueDateTimeInput = createFutureDateTimeInput(45);
    const result = updateTaskInputSchema.parse({
      dueDate: dueDateTimeInput,
    });

    expect(result.dueDate).toEqual(new Date(dueDateTimeInput));
  });
});

describe("taskFiltersInputSchema", () => {
  it("normalises filter input", () => {
    const dueBefore = createFutureUtcDate(30);
    const dueBeforeInput = formatDateInput(dueBefore);
    const result = taskFiltersInputSchema.parse({
      search: "  london  ",
      completed: null,
      tags: [" Not urgent ", "not_urgent"],
      dueBefore: dueBeforeInput,
      dueAfter: "",
    });

    expect(result).toEqual({
      search: "london",
      completed: undefined,
      tags: ["not-urgent"],
      dueBefore,
      dueAfter: undefined,
    });
  });

  it("removes blank search and blank tags from filters", () => {
    const result = taskFiltersInputSchema.parse({
      search: "   ",
      tags: ["   "],
    });

    expect(result).toEqual({
      search: undefined,
      tags: undefined,
    });
  });
});

describe("reorderTaskIdsSchema", () => {
  it("normalises task ids and rejects invalid order payloads", () => {
    expect(reorderTaskIdsSchema.parse([" task_1 ", "task_2"])).toEqual([
      "task_1",
      "task_2",
    ]);

    expect(() => reorderTaskIdsSchema.parse([])).toThrow(
      "At least one task id is required.",
    );

    expect(() => reorderTaskIdsSchema.parse(["task_1", " task_1 "])).toThrow(
      "Task ids must be unique.",
    );
  });
});
