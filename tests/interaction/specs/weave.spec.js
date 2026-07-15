/**
 * Weave (#1) interaction regressions from the 6.0 audit.
 *
 * Fixture: misc/weave-plugin (a 'mean-line' plugin drawing into its own layer
 * and emitting the computed mean). Verifies against a real render:
 *   - plugin layer draws; api.emit arrives NAMESPACED as
 *     plugin:mean-line:meanComputed (a plugin must not be able to fire internal
 *     lifecycle events like 'updated')
 *   - updateOptions({ plugins: [{ name, options }] }) refreshes a live
 *     plugin's api.options in place (reconcile-by-name kept stale options)
 */

import { test, expect } from '../fixtures/base.js'

test.describe('Weave: plugin platform', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'weave-plugin')
  })

  test('the plugin layer draws and the namespaced emit reaches the page', async ({
    page,
  }) => {
    const r = await page.evaluate(() => ({
      layer: !!window.chart.el.querySelector('.apexcharts-plugin-mean-line'),
      line: !!window.chart.el.querySelector('.apexcharts-plugin-mean-line line'),
    }))
    expect(r.layer).toBe(true)
    expect(r.line).toBe(true)

    // the initial emit predates the page listener; a redraw emits again
    await page.click('#newData')
    await page.waitForFunction(() =>
      document.getElementById('readout').textContent.includes('mean ='),
    ) // wired to plugin:mean-line:meanComputed

    // the raw, un-namespaced name must NOT fire (spoof protection)
    const spoof = await page.evaluate(async () => {
      let rawFired = false
      window.chart.addEventListener('meanComputed', () => {
        rawFired = true
      })
      await window.chart.updateSeries(
        [{ name: 'Value', data: [1, 2, 3, 4, 5, 6, 7, 8] }],
        false,
      )
      await new Promise((res) => setTimeout(res, 100))
      return rawFired
    })
    expect(spoof).toBe(false)
  })

  test('updateOptions refreshes a live plugin options in place (no stale reconcile)', async ({
    page,
  }) => {
    const r = await page.evaluate(async () => {
      let seen = null
      window.ApexCharts.registerPlugin({
        name: 'opt-probe',
        apiVersion: 1,
        setup(api) {
          api.on('draw', () => {
            seen = api.options.label || 'none'
          })
        },
      })
      await window.chart.updateOptions(
        { plugins: [{ name: 'mean-line' }, { name: 'opt-probe', options: { label: 'first' } }] },
        false,
        false,
      )
      const afterFirst = seen
      await window.chart.updateOptions(
        { plugins: [{ name: 'mean-line' }, { name: 'opt-probe', options: { label: 'second' } }] },
        false,
        false,
      )
      return { afterFirst, afterSecond: seen }
    })
    expect(r.afterFirst).toBe('first')
    expect(r.afterSecond).toBe('second') // stale-options bug would keep 'first'
  })
})
