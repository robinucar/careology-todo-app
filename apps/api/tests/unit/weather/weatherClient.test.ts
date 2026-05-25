import { describe, expect, it, vi } from "vitest";

import { createWeatherClient } from "../../../src/weather/weatherClient.js";
import { createFutureUtcDate, formatDateInput } from "../../fixtures/dates.js";

type MockFetch = ReturnType<typeof vi.fn> & typeof fetch;

const createJsonResponse = (payload: unknown, ok = true): Response => {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
};

const createFetch = (...responses: Response[]): MockFetch => {
  return vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(responses.shift() ?? createJsonResponse(null)),
    ) as unknown as MockFetch;
};

describe("createWeatherClient", () => {
  it("maps current weather responses", async () => {
    const fetcher = createFetch(
      createJsonResponse({
        location: {
          name: "Tokyo",
        },
        current: {
          temp_c: 22.5,
          condition: {
            text: "Sunny",
            icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
          },
        },
      }),
    );
    const client = createWeatherClient({
      apiKey: "weather-key",
      baseUrl: "https://api.weather.test/v1",
      fetcher,
    });

    await expect(client.getWeatherForDate("Tokyo", null)).resolves.toEqual({
      weatherCity: "Tokyo",
      weatherTemperature: 22.5,
      weatherCondition: "Sunny",
      weatherIconUrl: "https://cdn.weatherapi.com/weather/64x64/day/113.png",
      weatherFetchedAt: expect.any(Date),
    });
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      "https://api.weather.test/v1/current.json?key=weather-key&q=Tokyo",
    );
  });

  it("uses forecast weather for due dates within the next 14 days", async () => {
    const dueDate = createFutureUtcDate(7);
    const fetcher = createFetch(
      createJsonResponse({
        location: {
          name: "London",
        },
        forecast: {
          forecastday: [
            {
              day: {
                avgtemp_c: 18.2,
                condition: {
                  text: "Patchy rain",
                  icon: "//cdn.weatherapi.com/weather/64x64/day/176.png",
                },
              },
            },
          ],
        },
      }),
    );
    const client = createWeatherClient({
      apiKey: "weather-key",
      baseUrl: "https://api.weather.test/v1",
      fetcher,
    });

    await expect(client.getWeatherForDate("London", dueDate)).resolves.toEqual({
      weatherCity: "London",
      weatherTemperature: 18.2,
      weatherCondition: "Patchy rain",
      weatherIconUrl: "https://cdn.weatherapi.com/weather/64x64/day/176.png",
      weatherFetchedAt: expect.any(Date),
    });
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      `https://api.weather.test/v1/forecast.json?key=weather-key&dt=${formatDateInput(
        dueDate,
      )}&q=London`,
    );
  });

  it("skips WeatherAPI calls for dates outside the supported forecast window", async () => {
    const fetcher = createFetch();
    const client = createWeatherClient({
      apiKey: "weather-key",
      baseUrl: "https://api.weather.test/v1",
      fetcher,
    });

    await expect(
      client.getWeatherForDate("London", createFutureUtcDate(-1)),
    ).resolves.toBeNull();
    await expect(
      client.getWeatherForDate("London", createFutureUtcDate(15)),
    ).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("does not call WeatherAPI when the API key is missing", async () => {
    const fetcher = createFetch();
    const client = createWeatherClient({
      apiKey: null,
      baseUrl: "https://api.weather.test/v1",
      fetcher,
    });

    await expect(
      client.getWeatherForDate("London", new Date()),
    ).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns safe fallbacks for WeatherAPI failures", async () => {
    const fetcher = createFetch(createJsonResponse(null, false));
    const client = createWeatherClient({
      apiKey: "weather-key",
      baseUrl: "https://api.weather.test/v1",
      fetcher,
    });

    await expect(client.getWeatherForDate("London", null)).resolves.toBeNull();
  });
});
