/**
 * 100% stacked combo chart, line declared before the columns (#2429).
 *
 * Under `stackType: '100%'` the stacked bar renderer swaps `series` for the
 * percentage rows, and in a combo chart it narrows those rows to just the
 * series it draws as bars. The data-label value lookup kept indexing that
 * bar-only array with the global series index, so a line ahead of a column ran
 * the index past the end and the render threw on `undefined`, leaving the
 * partially drawn chart with no axes that #2429 reports.
 *
 * The lookup runs while positioning labels, before any check on whether labels
 * are switched on, which is why the chart dies with `dataLabels` at its
 * default of off.
 *
 * Order is the whole defect, so both are covered: with the line last the chart
 * always rendered, and that case is the control.
 *
 * NOTE: these charts deliberately leave `dataLabels.enabled` alone. Turning
 * labels ON in a 100% stacked COMBO hits a separate, older defect:
 * `Defaults.stacked100` only installs the percentage formatter when
 * `chart.type === 'bar'`, and a combo's type is `line`, so the formatter stays
 * undefined and `drawCalculatedDataLabels` calls it anyway. That is not what
 * this spec guards, and it needs a decision about what a combo's labels should
 * read before it can be fixed.
 */

import { test, expect } from '../fixtures/base.js'

const CATEGORIES = ['A', 'B', 'C', 'D']
const COL_A = [100, 200, 300, 400]
const COL_B = [50, 60, 70, 80]
const TREND = [180, 290, 400, 510]

const COLUMN_COUNT = 2
const EXPECTED_BARS = COLUMN_COUNT * CATEGORIES.length

/**
 * Build a 100% stacked combo with the line at either end of the series array.
 * A render failure is captured rather than thrown so the assertion can name it.
 */
async function renderCombo(page, { lineFirst }) {
  return page.evaluate(
    async ({ lineFirst, categories, a, b, trend }) => {
      window.chart.destroy()
      document.body.innerHTML = '<div id="pct" style="width:700px"></div>'

      const columns = [
        { name: 'ColA', type: 'column', data: a },
        { name: 'ColB', type: 'column', data: b },
      ]
      const line = { name: 'Trend', type: 'line', data: trend }

      try {
        const chart = new ApexCharts(document.querySelector('#pct'), {
          series: lineFirst ? [line, ...columns] : [...columns, line],
          chart: {
            type: 'line',
            height: 400,
            stacked: true,
            stackType: '100%',
            animations: { enabled: false },
          },
          stroke: { width: lineFirst ? [3, 0, 0] : [0, 0, 3] },
          xaxis: { categories },
        })
        window.chart = chart
        await chart.render()
        return null
      } catch (e) {
        return String((e && e.message) || e)
      }
    },
    { lineFirst, categories: CATEGORIES, a: COL_A, b: COL_B, trend: TREND },
  )
}

for (const lineFirst of [true, false]) {
  const order = lineFirst
    ? 'the line declared before the columns'
    : 'the line declared after the columns'

  test.describe(`100% stacked combo, ${order}`, () => {
    test('renders every column and its axes', async ({ page, loadChart }) => {
      await loadChart('mixed', 'line-column')

      const error = await renderCombo(page, { lineFirst })
      expect(error, 'render threw').toBeNull()

      const rendered = await page.evaluate(() => {
        const perSeries = {}
        for (const group of document.querySelectorAll(
          '#pct .apexcharts-series',
        )) {
          const bars = group.querySelectorAll('.apexcharts-bar-area')
          if (bars.length) perSeries[group.getAttribute('seriesName')] = bars.length
        }
        return {
          perSeries,
          bars: document.querySelectorAll('#pct .apexcharts-bar-area').length,
          // The axes are the visible casualty when the render dies part-way,
          // and what the issue reports as "partially drawn plot without axes".
          xaxis: document.querySelectorAll('#pct .apexcharts-xaxis').length,
          line: document.querySelectorAll('#pct .apexcharts-line').length,
        }
      })

      expect(Object.keys(rendered.perSeries).sort()).toEqual(['ColA', 'ColB'])
      expect(rendered.bars).toBe(EXPECTED_BARS)
      expect(rendered.xaxis, 'the x-axis is missing').toBeGreaterThan(0)
      expect(rendered.line, 'the line series is missing').toBeGreaterThan(0)
    })
  })
}
