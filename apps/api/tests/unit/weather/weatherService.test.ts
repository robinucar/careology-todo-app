import { describe, expect, it, vi } from "vitest";

import { createWeatherService } from "../../../src/weather/weatherService.js";
import { createFutureUtcDate } from "../../fixtures/dates.js";
import {
  createWeather,
  createWeatherClient,
} from "../../fixtures/weather.js";

describe("createWeatherService", () => {
  it("uses the first valid city candidate from the task title", async () => {
    const weather = createWeather({
      weatherCity: "Tokyo",
    });
    const weatherClient = createWeatherClient({
      getWeatherForDate: vi.fn().mockResolvedValue(weather),
    });
    const service = createWeatherService({ weatherClient });

    await expect(
      service.getWeatherForTaskTitle("Book August flights to Tokyo"),
    ).resolves.toEqual({
      status: "found",
      weather,
    });
    expect(weatherClient.getWeatherForDate).toHaveBeenCalledWith("Tokyo", null);
  });

  it("uses the task due date when fetching weather", async () => {
    const dueDate = createFutureUtcDate(30);
    const weather = createWeather();
    const weatherClient = createWeatherClient({
      getWeatherForDate: vi.fn().mockResolvedValueOnce(weather),
    });
    const service = createWeatherService({ weatherClient });

    await expect(
      service.getWeatherForTaskTitle("Book tickets for London", dueDate),
    ).resolves.toEqual({
      status: "found",
      weather,
    });
    expect(weatherClient.getWeatherForDate).toHaveBeenCalledWith(
      "London",
      dueDate,
    );
  });

  it("does not fall through to later cities when the first city is unavailable", async () => {
    const weatherClient = createWeatherClient({
      getWeatherForDate: vi.fn().mockResolvedValueOnce(null),
    });
    const service = createWeatherService({ weatherClient });

    await expect(
      service.getWeatherForTaskTitle("Book tickets for London after Paris meeting"),
    ).resolves.toEqual({ status: "unavailable" });
    expect(weatherClient.getWeatherForDate).toHaveBeenCalledTimes(1);
    expect(weatherClient.getWeatherForDate).toHaveBeenCalledWith("London", null);
  });

  it("returns no_city without WeatherAPI calls when there are no candidates", async () => {
    const weatherClient = createWeatherClient();
    const service = createWeatherService({ weatherClient });

    await expect(service.getWeatherForTaskTitle("123 !!!")).resolves.toEqual({
      status: "no_city",
    });
    expect(weatherClient.getWeatherForDate).not.toHaveBeenCalled();
  });

  it("returns unavailable when WeatherAPI cannot resolve the extracted city", async () => {
    const weatherClient = createWeatherClient();
    const service = createWeatherService({ weatherClient });

    await expect(
      service.getWeatherForTaskTitle("Book tickets for Atlantis"),
    ).resolves.toEqual({
      status: "unavailable",
    });
    expect(weatherClient.getWeatherForDate).toHaveBeenCalledWith(
      "Atlantis",
      null,
    );
  });
});
