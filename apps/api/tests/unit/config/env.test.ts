import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type EnvModule = typeof import("../../../src/config/env.js");

let parsePort: EnvModule["parsePort"];
let parseJwtSecret: EnvModule["parseJwtSecret"];
let parseJwtExpiresIn: EnvModule["parseJwtExpiresIn"];

beforeAll(async () => {
  vi.stubEnv("JWT_SECRET", "test-jwt-secret-value-that-is-long-enough");

  const envModule = await import("../../../src/config/env.js");

  parsePort = envModule.parsePort;
  parseJwtSecret = envModule.parseJwtSecret;
  parseJwtExpiresIn = envModule.parseJwtExpiresIn;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

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

describe("parseJwtSecret", () => {
  it("returns a valid JWT secret", () => {
    expect(parseJwtSecret("a".repeat(32))).toBe("a".repeat(32));
  });

  it("trims whitespace around the JWT secret", () => {
    const secret = "b".repeat(32);

    expect(parseJwtSecret(` ${secret} `)).toBe(secret);
  });

  it.each([undefined, "", "   "])("rejects missing JWT_SECRET value %j", (value) => {
    expect(() => parseJwtSecret(value)).toThrow("JWT_SECRET is required");
  });

  it("rejects a short JWT secret", () => {
    expect(() => parseJwtSecret("short-secret")).toThrow(
      "JWT_SECRET must be at least 32 characters",
    );
  });
});

describe("parseJwtExpiresIn", () => {
  it("uses the default expiry when JWT_EXPIRES_IN is not set", () => {
    expect(parseJwtExpiresIn(undefined)).toBe("1h");
  });

  it("uses the default expiry when JWT_EXPIRES_IN is blank", () => {
    expect(parseJwtExpiresIn("   ")).toBe("1h");
  });

  it("returns a configured JWT expiry", () => {
    expect(parseJwtExpiresIn("15m")).toBe("15m");
  });

  it("trims whitespace around the JWT expiry", () => {
    expect(parseJwtExpiresIn(" 7d ")).toBe("7d");
  });

  it.each(["0h", "abc", "1", "1 fortnight"])(
    "rejects invalid JWT_EXPIRES_IN value %j",
    (value) => {
      expect(() => parseJwtExpiresIn(value)).toThrow(
        "JWT_EXPIRES_IN must be a duration like 15m, 1h, or 7d.",
      );
    },
  );
});
