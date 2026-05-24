import { describe, expect, it } from "vitest";

import {
  createTaskInputSchema,
  reorderTaskIdsSchema,
  taskFiltersInputSchema,
  updateTaskInputSchema,
} from "../../../src/tasks/taskValidation.js";

describe("createTaskInputSchema", () => {
  it("normalises valid task input", () => {
    const result = createTaskInputSchema.parse({
      title: "  Book London tickets  ",
      description: "   ",
      dueDate: "2026-05-24",
      tags: [" Travel ", "travel", "", "Urgent"],
    });

    expect(result).toEqual({
      title: "Book London tickets",
      description: null,
      dueDate: new Date("2026-05-24T00:00:00.000Z"),
      tags: ["travel", "urgent"],
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

  it("rejects blank titles", () => {
    expect(() =>
      createTaskInputSchema.parse({
        title: "   ",
      }),
    ).toThrow("Task title is required.");
  });

  it("rejects invalid due dates", () => {
    expect(() =>
      createTaskInputSchema.parse({
        title: "Invalid due date",
        dueDate: "2026-02-30",
      }),
    ).toThrow("Due date must be an ISO date or date-time string.");
  });

  it("rejects too many tags", () => {
    expect(() =>
      createTaskInputSchema.parse({
        title: "Too many tags",
        tags: Array.from({ length: 11 }, (_, index) => `tag-${index}`),
      }),
    ).toThrow("Tags cannot contain more than 10 items.");
  });

  it("rejects long tags", () => {
    expect(() =>
      createTaskInputSchema.parse({
        title: "Long tag",
        tags: ["a".repeat(33)],
      }),
    ).toThrow("Tags must be 32 characters or fewer.");
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
    const result = updateTaskInputSchema.parse({
      dueDate: "2026-05-24T10:30:00.000Z",
    });

    expect(result.dueDate).toEqual(new Date("2026-05-24T10:30:00.000Z"));
  });
});

describe("taskFiltersInputSchema", () => {
  it("normalises filter input", () => {
    const result = taskFiltersInputSchema.parse({
      search: "  london  ",
      completed: null,
      tags: [" Work ", "work"],
      dueBefore: "2026-06-01",
      dueAfter: "",
    });

    expect(result).toEqual({
      search: "london",
      completed: undefined,
      tags: ["work"],
      dueBefore: new Date("2026-06-01T00:00:00.000Z"),
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
  it("normalises task ids", () => {
    expect(reorderTaskIdsSchema.parse([" task_1 ", "task_2"])).toEqual([
      "task_1",
      "task_2",
    ]);
  });

  it("rejects empty reorder lists", () => {
    expect(() => reorderTaskIdsSchema.parse([])).toThrow(
      "At least one task id is required.",
    );
  });

  it("rejects duplicate task ids", () => {
    expect(() => reorderTaskIdsSchema.parse(["task_1", " task_1 "])).toThrow(
      "Task ids must be unique.",
    );
  });
});
