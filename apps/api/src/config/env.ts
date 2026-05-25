import type { SignOptions } from "jsonwebtoken";

type JwtExpiresIn = NonNullable<SignOptions["expiresIn"]>;

const DEFAULT_PORT = 4000;
const DEFAULT_WEATHER_API_BASE_URL = "https://api.weatherapi.com/v1";
const MIN_PORT = 1;
const MAX_PORT = 65535;
const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_JWT_EXPIRES_IN: JwtExpiresIn = "1h";
const JWT_EXPIRES_IN_PATTERN =
  /^[1-9]\d*\s?(ms|msec|msecs|millisecond|milliseconds|s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks|y|yr|yrs|year|years)$/i;

export const parsePort = (value: string | undefined): number => {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  const port = Number(value.trim());

  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(`PORT must be an integer between ${MIN_PORT} and ${MAX_PORT}.`);
  }

  return port;
};

export const parseJwtSecret = (value: string | undefined): string => {
  const secret = value?.trim();

  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }

  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`);
  }

  return secret;
};

export const parseJwtExpiresIn = (value: string | undefined): JwtExpiresIn => {
  const expiresIn = value?.trim();

  if (!expiresIn) {
    return DEFAULT_JWT_EXPIRES_IN;
  }

  if (!JWT_EXPIRES_IN_PATTERN.test(expiresIn)) {
    throw new Error("JWT_EXPIRES_IN must be a duration like 15m, 1h, or 7d.");
  }

  return expiresIn as JwtExpiresIn;
};

export const parseWeatherApiKey = (
  value: string | undefined,
  nodeEnv: string | undefined = process.env["NODE_ENV"],
): string | null => {
  const apiKey = value?.trim();

  if (apiKey) {
    return apiKey;
  }

  if (nodeEnv === "production") {
    throw new Error("WEATHER_API_KEY is required in production");
  }

  return null;
};

export const parseWeatherApiBaseUrl = (
  value: string | undefined,
  nodeEnv: string | undefined = process.env["NODE_ENV"],
): string => {
  const baseUrl = value?.trim() || DEFAULT_WEATHER_API_BASE_URL;

  try {
    const url = new URL(baseUrl);

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }

    if (nodeEnv === "production" && url.protocol !== "https:") {
      throw new Error("Invalid production protocol");
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    throw new Error(
      "WEATHER_API_BASE_URL must be a valid HTTP(S) URL. Production must use HTTPS.",
    );
  }
};

export const env = {
  port: parsePort(process.env["PORT"]),
  jwtSecret: parseJwtSecret(process.env["JWT_SECRET"]),
  jwtExpiresIn: parseJwtExpiresIn(process.env["JWT_EXPIRES_IN"]),
  weatherApiKey: parseWeatherApiKey(
    process.env["WEATHER_API_KEY"],
    process.env["NODE_ENV"],
  ),
  weatherApiBaseUrl: parseWeatherApiBaseUrl(
    process.env["WEATHER_API_BASE_URL"],
    process.env["NODE_ENV"],
  ),
} as const;
