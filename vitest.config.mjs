import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.js'],
    clearMocks: true,
    alias: [
      {
        find: /.*\.css$/,
        replacement: path.resolve(__dirname, './tests/unit/mocks/styleMock.js'),
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // match existing Jest coverage exclusion
      exclude: [
          'src/**/*.spec.js',
          'src/**/__tests__/**',
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/tests/**',
          '**/coverage/**',
      ],
      thresholds: {
        // Enforce minimum coverage for new code
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
    // 10x faster than Jest for this codebase
    globals: true, // Jest uses globals (describe, it, expect), so we enable them in Vitest
  },
})
