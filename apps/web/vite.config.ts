import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const sharedSourcePath = new URL('../../packages/shared/src/index.ts', import.meta.url)
  .pathname

const dependencyChunkGroups = [
  {
    name: 'react-vendor',
    test: /node_modules[\\/](react|react-dom)[\\/]/,
    priority: 50,
  },
  {
    name: 'mui-vendor',
    test: /node_modules[\\/](@mui|@emotion)[\\/]/,
    priority: 40,
  },
  {
    name: 'apollo-vendor',
    test: /node_modules[\\/](@apollo|@graphql-typed-document-node|@wry|graphql)[\\/]/,
    priority: 30,
  },
  {
    name: 'form-vendor',
    test: /node_modules[\\/](@hookform|react-hook-form|zod)[\\/]/,
    priority: 20,
  },
  {
    name: 'dnd-vendor',
    test: /node_modules[\\/]@dnd-kit[\\/]/,
    priority: 20,
  },
  {
    name: 'vendor',
    test: /node_modules[\\/]/,
    priority: 1,
    maxSize: 450 * 1024,
  },
]

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const useSharedSource = command === 'serve'

  return {
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: dependencyChunkGroups,
          },
        },
      },
    },
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
