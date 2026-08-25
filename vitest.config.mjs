import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  test: {
    environment: './tests/unit/jsdom-quiet.js',
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
        // Branch coverage is limited heavy DOM/event code
        // in ZoomPanSelection, Graphics, Line, DataLabels, Intersect is only exercisable
        // with live browser rendering. 55% is the realistic ceiling for unit tests.
        // Functions and lines reflect pure-logic coverage which is achievable at 70%+.
        branches: 55,
        functions: 70,
        lines: 67,
      },
    },
    // Vitest's 5s default is really an assertion about how fast the machine
    // is, and most of this suite mounts real charts in jsdom, so the cost
    // tracks the runner rather than the code. The publish job measured 166s
    // for a suite that takes ~21s on a dev machine — 8x — which is enough to
    // put any test over ~600ms locally past a 5s budget. That is exactly how
    // the 7.0.0-rc.1 publish failed: `trellis-virtual` timed out in CI having
    // never been slow anywhere else, and it blocked the release rather than
    // reporting a defect.
    //
    // 20s covers the ~900ms-under-load tier with room to spare. The one test
    // that genuinely earns more (70 real chart instances) sets its own. A hung
    // test still fails, just later, which is the cheaper way to be wrong here.
    testTimeout: 20000,
    // 10x faster than Jest for this codebase
    globals: true, // Jest uses globals (describe, it, expect), so we enable them in Vitest
  },
})
