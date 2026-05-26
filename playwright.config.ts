import { defineConfig, devices } from '@playwright/test'

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://careology:careology@localhost:5433/careology_todo?schema=public'

const apiPort = process.env.E2E_API_PORT ?? '4010'
const weatherApiPort = process.env.E2E_WEATHER_API_PORT ?? '4110'
const webPort = process.env.E2E_WEB_PORT ?? '5174'

const apiUrl = process.env.E2E_API_URL ?? `http://127.0.0.1:${apiPort}/`
const weatherApiUrl =
  process.env.E2E_WEATHER_API_URL ?? `http://127.0.0.1:${weatherApiPort}/v1`
const webUrl = process.env.E2E_WEB_URL ?? `http://127.0.0.1:${webPort}`
const apiGraphqlUrl = `${apiUrl.replace(/\/$/, '')}/graphql`

export default defineConfig({
  expect: {
    timeout: 7_500,
  },
  fullyParallel: false,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: webUrl,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'node tests/e2e/support/weather-api-mock.mjs',
      env: {
        E2E_WEATHER_API_PORT: weatherApiPort,
      },
      reuseExistingServer: !process.env.CI,
      url: weatherApiUrl.replace(/\/v1$/, '/health'),
    },
    {
      command: 'npm run dev --workspace @careology/api',
      env: {
        DATABASE_URL: databaseUrl,
        JWT_EXPIRES_IN: '1h',
        JWT_SECRET: 'e2e-jwt-secret-value-that-is-long-enough',
        PORT: apiPort,
        WEATHER_API_BASE_URL: weatherApiUrl,
        WEATHER_API_KEY: 'e2e-weather-api-key',
      },
      reuseExistingServer: !process.env.CI,
      url: apiGraphqlUrl,
    },
    {
      command: `npm run dev --workspace @careology/web -- --host 127.0.0.1 --port ${webPort}`,
      env: {
        VITE_GRAPHQL_URL: apiGraphqlUrl,
      },
      reuseExistingServer: !process.env.CI,
      url: webUrl,
    },
  ],
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
})
