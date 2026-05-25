import { extractCityCandidates } from "./cityCandidates.js";
import type {
  TaskWeatherLookupResult,
  WeatherClient,
  WeatherService,
} from "./weatherTypes.js";

type CreateWeatherServiceInput = {
  weatherClient: WeatherClient;
};

export const createWeatherService = ({
  weatherClient,
}: CreateWeatherServiceInput): WeatherService => {
  return {
    getWeatherForTaskTitle: async (
      title,
      dueDate = null,
    ): Promise<TaskWeatherLookupResult> => {
      const [firstCity] = extractCityCandidates(title);

      if (!firstCity) {
        return {
          status: "no_city",
        };
      }

      const weather = await weatherClient.getWeatherForDate(firstCity, dueDate);

      if (weather) {
        return {
          status: "found",
          weather,
        };
      }

      return {
        status: "unavailable",
      };
    },
  };
};
