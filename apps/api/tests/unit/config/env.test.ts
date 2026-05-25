import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type EnvModule = typeof import("../../../src/config/env.js");

let parsePort: EnvModule["parsePort"];
let parseJwtSecret: EnvModule["parseJwtSecret"];
let parseJwtExpiresIn: EnvModule["parseJwtExpiresIn"];
let parseWeatherApiKey: EnvModule["parseWeatherApiKey"];
let parseWeatherApiBaseUrl: EnvModule["parseWeatherApiBaseUrl"];

beforeAll(async () => {
  vi.stubEnv("JWT_SECRET", "test-jwt-secret-value-that-is-long-enough");

  const envModule = await import("../../../src/config/env.js");

  parsePort = envModule.parsePort;
  parseJwtSecret = envModule.parseJwtSecret;
  parseJwtExpiresIn = envModule.parseJwtExpiresIn;
  parseWeatherApiKey = envModule.parseWeatherApiKey;
  parseWeatherApiBaseUrl = envModule.parseWeatherApiBaseUrl;
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("parsePort", () => {
  it("uses defaults and normalises valid PORT values", () => {
    expect(parsePort(undefined)).toBe(4000);
    expect(parsePort("4001")).toBe(4001);
    expect(parsePort(" 4002 ")).toBe(4002);
  });

  it("rejects invalid PORT values", () => {
    for (const value of ["", "abc", "0", "-1", "4000.5", "65536"]) {
      expect(() => parsePort(value)).toThrow(
        "PORT must be an integer between 1 and 65535.",
      );
    }
  });
});

describe("parseJwtSecret", () => {
  it("returns and trims valid JWT secrets", () => {
    expect(parseJwtSecret("a".repeat(32))).toBe("a".repeat(32));
    const secret = "b".repeat(32);

    expect(parseJwtSecret(` ${secret} `)).toBe(secret);
  });

  it("rejects missing JWT_SECRET values", () => {
    for (const value of [undefined, "", "   "]) {
      expect(() => parseJwtSecret(value)).toThrow("JWT_SECRET is required");
    }
  });

  it("rejects a short JWT secret", () => {
    expect(() => parseJwtSecret("short-secret")).toThrow(
      "JWT_SECRET must be at least 32 characters",
    );
  });
});

describe("parseJwtExpiresIn", () => {
  it("uses defaults and normalises valid JWT expiry values", () => {
    expect(parseJwtExpiresIn(undefined)).toBe("1h");
    expect(parseJwtExpiresIn("   ")).toBe("1h");
    expect(parseJwtExpiresIn("15m")).toBe("15m");
    expect(parseJwtExpiresIn(" 7d ")).toBe("7d");
  });

  it("rejects invalid JWT_EXPIRES_IN values", () => {
    for (const value of ["0h", "abc", "1", "1 fortnight"]) {
      expect(() => parseJwtExpiresIn(value)).toThrow(
        "JWT_EXPIRES_IN must be a duration like 15m, 1h, or 7d.",
      );
    }
  });
});

describe("parseWeatherApiKey", () => {
  it("returns a configured WeatherAPI key", () => {
    expect(parseWeatherApiKey(" api-key ", "development")).toBe("api-key");
  });

  it("allows missing WeatherAPI keys outside production", () => {
    expect(parseWeatherApiKey(undefined, "development")).toBeNull();
    expect(parseWeatherApiKey("   ", "test")).toBeNull();
  });

  it("requires WeatherAPI keys in production", () => {
    expect(() => parseWeatherApiKey(undefined, "production")).toThrow(
      "WEATHER_API_KEY is required in production",
    );
  });
});

describe("parseWeatherApiBaseUrl", () => {
  it("uses defaults and normalises configured WeatherAPI base URLs", () => {
    expect(parseWeatherApiBaseUrl(undefined)).toBe(
      "https://api.weatherapi.com/v1",
    );
    expect(parseWeatherApiBaseUrl(" https://example.com/weather/ ")).toBe(
      "https://example.com/weather",
    );
  });

  it("rejects invalid WeatherAPI base URL values", () => {
    for (const value of ["not-a-url", "ftp://example.com/weather"]) {
      expect(() => parseWeatherApiBaseUrl(value)).toThrow(
        "WEATHER_API_BASE_URL must be a valid HTTP(S) URL. Production must use HTTPS.",
      );
    }
  });

  it("rejects HTTP WeatherAPI URLs in production", () => {
    expect(() =>
      parseWeatherApiBaseUrl("http://example.com/weather", "production"),
    ).toThrow(
      "WEATHER_API_BASE_URL must be a valid HTTP(S) URL. Production must use HTTPS.",
    );
  });

  it("allows HTTP WeatherAPI URLs outside production for local mocks", () => {
    expect(parseWeatherApiBaseUrl("http://localhost:5000/weather", "test")).toBe(
      "http://localhost:5000/weather",
    );
  });
});
