import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const sharedSourcePath = new URL('../../packages/shared/src/index.ts', import.meta.url)
  .pathname

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const useSharedSource = command === 'serve'

  return {
    plugins: [react()],
    ...(useSharedSource
      ? {
          optimizeDeps: {
            exclude: ['@careology/shared'],
          },
          resolve: {
            alias: {
              '@careology/shared': sharedSourcePath,
            },
          },
        }
      : {}),
    test: {
      environment: 'jsdom',
      restoreMocks: true,
      setupFiles: './tests/setup.ts',
    },
  }
})
