export type TaskWeather = {
  weatherCity: string;
  weatherTemperature: number;
  weatherCondition: string;
  weatherIconUrl: string | null;
  weatherFetchedAt: Date;
};

export type TaskWeatherFields = {
  weatherCity: string | null;
  weatherTemperature: number | null;
  weatherCondition: string | null;
  weatherIconUrl: string | null;
  weatherFetchedAt: Date | null;
};

export type TaskWeatherLookupResult =
  | {
      status: "found";
      weather: TaskWeather;
    }
  | {
      status: "no_city";
    }
  | {
      status: "unavailable";
    };

export type WeatherClient = {
  getWeatherForDate: (
    query: string,
    date: Date | null,
  ) => Promise<TaskWeather | null>;
};

export type WeatherService = {
  getWeatherForTaskTitle: (
    title: string,
    dueDate?: Date | null,
  ) => Promise<TaskWeatherLookupResult>;
};
