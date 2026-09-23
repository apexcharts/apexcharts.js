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
 * The order cases leave `dataLabels.enabled` at its default so they guard the
 * lookup alone. Turning labels ON used to be its own, older crash:
 * `Defaults.stacked100` installed the percentage formatter only for
 * `chart.type === 'bar'` and wrote `formatter: undefined` over the default for
 * everything else, so a combo (typed `line`) had no formatter at all. The last
 * case covers that: bar labels read a percentage of the BAR total, the line's
 * labels read its raw value.
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
async function renderCombo(page, { lineFirst, dataLabels = false }) {
  return page.evaluate(
    async ({ lineFirst, dataLabels, categories, a, b, trend }) => {
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
          ...(dataLabels ? { dataLabels: { enabled: true } } : {}),
        })
        window.chart = chart
        await chart.render()
        return null
      } catch (e) {
        return String((e && e.message) || e)
      }
    },
    {
      lineFirst,
      dataLabels,
      categories: CATEGORIES,
      a: COL_A,
      b: COL_B,
      trend: TREND,
    },
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

test.describe('100% stacked combo with data labels on', () => {
  test('bars read a share of the bar total, the line reads its value', async ({
    page,
    loadChart,
  }) => {
    await loadChart('mixed', 'line-column')

    const error = await renderCombo(page, { lineFirst: true, dataLabels: true })
    expect(error, 'render threw').toBeNull()

    const labels = await page.evaluate(() => {
      const out = {}
      for (const group of document.querySelectorAll('#pct .apexcharts-datalabels')) {
        const realIndex = group.getAttribute('data:realIndex')
        out[window.chart.w.config.series[realIndex].name] = [
          ...group.querySelectorAll('.apexcharts-datalabel'),
        ].map((t) => t.textContent)
      }
      return out
    })

    // ColA / (ColA + ColB): the line is not a slice of the 100% total.
    expect(labels.ColA).toEqual(['67%', '77%', '81%', '83%'])
    expect(labels.ColB).toEqual(['33%', '23%', '19%', '17%'])
    expect(labels.Trend).toEqual(TREND.map(String))
  })
})
