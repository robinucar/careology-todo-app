import { vi } from "vitest";

import type {
  TaskWeather,
  TaskWeatherFields,
  WeatherClient,
  WeatherService,
} from "../../src/weather/index.js";

export const clearedWeatherFields: TaskWeatherFields = {
  weatherCity: null,
  weatherTemperature: null,
  weatherCondition: null,
  weatherIconUrl: null,
  weatherFetchedAt: null,
};

export const createWeather = (
  overrides: Partial<TaskWeather> = {},
): TaskWeather => {
  return {
    weatherCity: "London",
    weatherTemperature: 12.5,
    weatherCondition: "Cloudy",
    weatherIconUrl: "https://cdn.weatherapi.com/weather/64x64/day/119.png",
    weatherFetchedAt: new Date("2026-05-25T12:00:00.000Z"),
    ...overrides,
  };
};

export const createWeatherClient = (
  overrides: Partial<WeatherClient> = {},
): WeatherClient => {
  return {
    getWeatherForDate: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
};

export const createWeatherService = (
  overrides: Partial<WeatherService> = {},
): WeatherService => {
  return {
    getWeatherForTaskTitle: vi.fn().mockResolvedValue({
      status: "no_city",
    }),
    ...overrides,
  };
};
