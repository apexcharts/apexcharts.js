/**
 * Marks (#11) interaction tests: custom series types via registerSeriesType.
 *
 * Uses the dumbbell fixture (samples/vanilla-js/marks/dumbbell.html), which
 * registers a 'dumbbell' custom type (dataType: 'rangeXY') in page scripts and
 * renders chart.type 'dumbbell'. Exercises the real render + event wiring that
 * jsdom cannot:
 *   - the adapter draws tagged marks and populates the shared coordinate caches
 *   - event delegation resolves a mark hover to (seriesIndex, dataPointIndex)
 *   - the registry guard rejects overriding a built-in type (6.0 audit fix)
 *   - unregisterSeriesType removes a custom type
 *   - a throwing renderItem is isolated per datum (warn once, keep rendering)
 */

import { test, expect } from '../fixtures/base.js'

test.describe('Marks: custom series render + integration', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('marks', 'dumbbell')
  })

  test('renders tagged marks and populates the shared coordinate caches', async ({
    page,
  }) => {
    const r = await page.evaluate(() => {
      const el = window.chart.el
      const marks = el.querySelectorAll('.apexcharts-marks-mark')
      const first = marks[0]
      const xs = window.chart.w.globals.seriesXvalues[0] || []
      const ys = window.chart.w.globals.seriesYvalues[0] || []
      const pts = window.chart.w.globals.pointsArray[0] || []
      return {
        seriesGroup: !!el.querySelector('.apexcharts-marks-series'),
        markCount: marks.length,
        firstIndex: first && first.getAttribute('index'),
        firstJ: first && first.getAttribute('j'),
        cacheLen: xs.length,
        cachesArePixels:
          xs.length > 0 &&
          xs.every((v) => v == null || (isFinite(v) && v >= -1000 && v < 5000)),
        pointsMirrors: pts.length === xs.length && ys.length === xs.length,
      }
    })
    expect(r.seriesGroup).toBe(true)
    expect(r.markCount).toBeGreaterThan(0)
    expect(r.firstIndex).toBe('0')
    expect(r.firstJ).not.toBeNull()
    expect(r.cacheLen).toBeGreaterThan(0)
    expect(r.cachesArePixels).toBe(true)
    expect(r.pointsMirrors).toBe(true)
  })

  test('hovering a mark fires dataPointMouseEnter with the datum identity', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.__enter = null
      window.chart.addEventListener('dataPointMouseEnter', (e, c, opts) => {
        window.__enter = {
          seriesIndex: opts.seriesIndex,
          dataPointIndex: opts.dataPointIndex,
        }
      })
      const mark = window.chart.el.querySelectorAll('.apexcharts-marks-mark')[2]
      mark.dispatchEvent(
        new MouseEvent('mouseover', { bubbles: true, cancelable: true, view: window }),
      )
    })
    await page.waitForFunction(() => window.__enter !== null)
    const enter = await page.evaluate(() => window.__enter)
    expect(enter.seriesIndex).toBe(0)
    expect(enter.dataPointIndex).toBeGreaterThanOrEqual(0)
  })

  test('registerSeriesType rejects a built-in type name (global registry guard)', async ({
    page,
  }) => {
    const r = await page.evaluate(() => {
      const warnings = []
      const origWarn = console.warn
      console.warn = (...a) => warnings.push(a.join(' '))
      window.ApexCharts.registerSeriesType('line', { renderItem: () => {} })
      console.warn = origWarn
      return {
        warned: warnings.some((wr) => wr.includes('built-in')),
        lineStillBuiltIn: !globalThis.__apexcharts_custom_types__.has('line'),
        dumbbellStillCustom: globalThis.__apexcharts_custom_types__.has('dumbbell'),
      }
    })
    expect(r.warned).toBe(true)
    expect(r.lineStillBuiltIn).toBe(true)
    expect(r.dumbbellStillCustom).toBe(true)
  })

  test('unregisterSeriesType removes a custom type; built-ins are immune', async ({
    page,
  }) => {
    const r = await page.evaluate(() => {
      window.ApexCharts.unregisterSeriesType('dumbbell')
      window.ApexCharts.unregisterSeriesType('line') // must be a no-op
      return {
        dumbbellGone: !globalThis.__apexcharts_custom_types__.has('dumbbell'),
        dumbbellUnregistered: !globalThis.__apexcharts_registry__.dumbbell,
        lineIntact: !!globalThis.__apexcharts_registry__.line,
      }
    })
    expect(r.dumbbellGone).toBe(true)
    expect(r.dumbbellUnregistered).toBe(true)
    expect(r.lineIntact).toBe(true)
  })

  test('a throwing renderItem is isolated: one warning, remaining data still draws', async ({
    page,
  }) => {
    const r = await page.evaluate(async () => {
      const warnings = []
      const origWarn = console.warn
      console.warn = (...a) => warnings.push(a.join(' '))

      window.ApexCharts.registerSeriesType('brittle', {
        renderItem({ datum, x, y, api }) {
          if (datum === 13) throw new Error('unlucky datum')
          api.circle({ cx: x, cy: y, r: 4, fill: '#16a34a' })
        },
      })
      const div = document.createElement('div')
      document.body.appendChild(div)
      const c = new window.ApexCharts(div, {
        chart: { type: 'brittle', height: 200, animations: { enabled: false } },
        series: [{ name: 'S', data: [10, 13, 12, 13, 14] }],
        xaxis: { type: 'numeric' },
      })
      await c.render()
      const marks = div.querySelectorAll('.apexcharts-marks-mark').length
      c.destroy()
      div.remove()
      console.warn = origWarn
      return {
        marks,
        throwWarnings: warnings.filter((wr) => wr.includes('renderItem')).length,
      }
    })
    expect(r.marks).toBe(3) // 5 data points, 2 threw (datum === 13)
    expect(r.throwWarnings).toBe(1) // warned once, not per datum
  })
})
