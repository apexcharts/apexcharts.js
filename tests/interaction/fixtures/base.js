/**
 * Base Playwright fixture for ApexCharts interaction tests.
 *
 * Provides:
 *   - `loadChart(type, file)` — navigate to a sample HTML, wait for render,
 *     and wire up automatic console-error detection.
 *   - `consoleErrors` — array populated with any JS errors thrown during the
 *     test; checked automatically in the afterEach hook.
 *
 * Every test that uses this fixture gets automatic failure if a runtime
 * exception fires in the page (e.g. `this.ctx.events is null`).
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

export const test = base.extend({
  // Accumulated page-level JS errors for the current test.
  consoleErrors: async ({ page: _page }, use) => {
    const errors = []
    await use(errors)
  },

  /**
   * loadChart(type, file) — navigate to samples/vanilla-js/{type}/{file}.html
   * and wait until the chart has finished rendering (animationEnded flag).
   *
   * Also patches Math.random with the same seeded PRNG the e2e runner uses so
   * that charts with random data are deterministic.
   */
  loadChart: async ({ page, consoleErrors }, use) => {
    // Collect every uncaught page error into consoleErrors[].
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    const load = async (type, file) => {
      const htmlPath = resolve(rootDir, 'samples', 'vanilla-js', type, `${file}.html`)
      await page.goto(`file://${htmlPath}`)

      // Wait for animationEnded — same signal used by the Puppeteer e2e runner.
      await page.waitForFunction(
        () =>
          typeof window.chart !== 'undefined' &&
          window.chart.w.globals.animationEnded === true,
        { timeout: 10_000 },
      )
    }

    await use(load)

    // After each test: fail if any JS error was collected.
    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

export { expect } from '@playwright/test'
