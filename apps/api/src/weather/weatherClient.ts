import type { TaskWeather, WeatherClient } from "./weatherTypes.js";

type WeatherClientConfig = {
  apiKey: string | null;
  baseUrl: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

type WeatherApiCurrentResponse = {
  location?: {
    name?: unknown;
  };
  current?: {
    temp_c?: unknown;
    condition?: {
      text?: unknown;
      icon?: unknown;
    };
  };
};

type WeatherApiForecastResponse = {
  location?: {
    name?: unknown;
  };
  forecast?: {
    forecastday?: Array<{
      day?: {
        avgtemp_c?: unknown;
        condition?: {
          text?: unknown;
          icon?: unknown;
        };
      };
    }>;
  };
};

const DEFAULT_TIMEOUT_MS = 5_000;
const FORECAST_MAX_DAYS_FROM_TODAY = 14;
const MILLISECONDS_PER_DAY = 86_400_000;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getString = (value: unknown): string | null => {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
};

const getNumber = (value: unknown): number | null => {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const normaliseIconUrl = (iconUrl: string | null): string | null => {
  if (!iconUrl) {
    return null;
  }

  return iconUrl.startsWith("//") ? `https:${iconUrl}` : iconUrl;
};

const createTaskWeather = ({
  city,
  condition,
  iconUrl,
  temperature,
}: {
  city: string | null;
  condition: string | null;
  iconUrl: string | null;
  temperature: number | null;
}): TaskWeather | null => {
  if (!city || temperature === null || !condition) {
    return null;
  }

  return {
    weatherCity: city,
    weatherTemperature: temperature,
    weatherCondition: condition,
    weatherIconUrl: normaliseIconUrl(iconUrl),
    weatherFetchedAt: new Date(),
  };
};

const createWeatherApiUrl = (
  baseUrl: string,
  path: string,
  params: Record<string, string>,
): URL => {
  const url = new URL(`${baseUrl}/${path}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
};

const parseCurrentWeather = (value: unknown): TaskWeather | null => {
  if (!isRecord(value)) {
    return null;
  }

  const weather = value as WeatherApiCurrentResponse;
  const city = getString(weather.location?.name);
  const temperature = getNumber(weather.current?.temp_c);
  const condition = getString(weather.current?.condition?.text);
  const iconUrl = getString(weather.current?.condition?.icon);

  return createTaskWeather({ city, condition, iconUrl, temperature });
};

const parseForecastWeather = (value: unknown): TaskWeather | null => {
  if (!isRecord(value)) {
    return null;
  }

  const weather = value as WeatherApiForecastResponse;
  const city = getString(weather.location?.name);
  const forecastDay = weather.forecast?.forecastday?.[0]?.day;
  const temperature = getNumber(forecastDay?.avgtemp_c);
  const condition = getString(forecastDay?.condition?.text);
  const iconUrl = getString(forecastDay?.condition?.icon);

  return createTaskWeather({ city, condition, iconUrl, temperature });
};

const fetchJson = async (
  url: URL,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<unknown | null> => {
  try {
    const response = await fetcher(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
};

const toUtcDateOnlyTime = (date: Date): number => {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const formatDateOnly = (date: Date): string => {
  return new Date(toUtcDateOnlyTime(date)).toISOString().slice(0, 10);
};

const getDaysFromToday = (date: Date): number => {
  return Math.floor(
    (toUtcDateOnlyTime(date) - toUtcDateOnlyTime(new Date())) /
      MILLISECONDS_PER_DAY,
  );
};

type WeatherEndpoint = {
  parse: (value: unknown) => TaskWeather | null;
  params: Record<string, string>;
  path: "current.json" | "forecast.json";
};

const getWeatherEndpoint = (
  query: string,
  date: Date | null,
): WeatherEndpoint | null => {
  if (!date) {
    return {
      parse: parseCurrentWeather,
      params: {
        q: query,
      },
      path: "current.json",
    };
  }

  const daysFromToday = getDaysFromToday(date);

  if (daysFromToday < 0 || daysFromToday > FORECAST_MAX_DAYS_FROM_TODAY) {
    return null;
  }

  if (daysFromToday === 0) {
    return {
      parse: parseCurrentWeather,
      params: {
        q: query,
      },
      path: "current.json",
    };
  }

  return {
    parse: parseForecastWeather,
    params: {
      dt: formatDateOnly(date),
      q: query,
    },
    path: "forecast.json",
  };
};

export const createWeatherClient = ({
  apiKey,
  baseUrl,
  fetcher = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: WeatherClientConfig): WeatherClient => {
  const getWeatherForDate = async (
    query: string,
    date: Date | null,
  ): Promise<TaskWeather | null> => {
    const trimmedQuery = query.trim();

    if (!apiKey || !trimmedQuery) {
      return null;
    }

    const endpoint = getWeatherEndpoint(trimmedQuery, date);

    if (!endpoint) {
      return null;
    }

    const url = createWeatherApiUrl(baseUrl, endpoint.path, {
      key: apiKey,
      ...endpoint.params,
    });
    const payload = await fetchJson(url, fetcher, timeoutMs);

    return endpoint.parse(payload);
  };

  return {
    getWeatherForDate,
  };
};
