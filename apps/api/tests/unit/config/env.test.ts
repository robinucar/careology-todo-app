import { describe, expect, it } from "vitest";

import { parsePort } from "../../../src/config/env.js";

describe("parsePort", () => {
  it("uses the default port when PORT is not set", () => {
    expect(parsePort(undefined)).toBe(4000);
  });

  it("parses a valid port", () => {
    expect(parsePort("4001")).toBe(4001);
  });

  it("trims whitespace around the port", () => {
    expect(parsePort(" 4002 ")).toBe(4002);
  });

  it.each(["", "abc", "0", "-1", "4000.5", "65536"])(
    "rejects invalid PORT value %j",
    (value) => {
      expect(() => parsePort(value)).toThrow(
        "PORT must be an integer between 1 and 65535.",
      );
    },
  );
});
