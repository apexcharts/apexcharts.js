/**
 * A horizontal bar with a datetime or numeric x. The bars were placed by value
 * while the axis drew one label per band, so they disagreed (a bar at Jan 04
 * beside the "Jan 03" tick), the end rows sat half outside the plot, the row
 * labels printed raw milliseconds, and the value axis lost its labels to a
 * time scale built over the values. Every row now gets a band, as the stacked
 * form always had.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const DAY = 864e5
const T0 = Date.UTC(2024, 0, 1)
const ROWS = [
  [T0, 10],
  [T0 + DAY, 20],
  [T0 + 3 * DAY, 40],
  [T0 + 7 * DAY, 25],
]

const render = async (opts) => {
  const chart = createChartWithOptions({
    ...opts,
    chart: {
      type: 'bar',
      width: 800,
      height: 300,
      animations: { enabled: false },
      ...(opts.chart || {}),
    },
    plotOptions: { bar: { horizontal: true } },
  })
  await chart.render()
  return chart
}

/** Vertical extent of each drawn bar or box, from its path. */
const rowsDrawn = (chart, selector = '.apexcharts-bar-area') =>
  Array.from(chart.w.dom.baseEl.querySelectorAll(selector)).map((p) => {
    const ys = ((p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || [])
      .map(Number)
      .filter((_, k) => k % 2 === 1)
    return { top: Math.min(...ys), bottom: Math.max(...ys) }
  })

const texts = (chart, selector) =>
  Array.from(chart.w.dom.baseEl.querySelectorAll(selector)).map((t) =>
    t.textContent.trim(),
  )

describe('horizontal bar with a datetime x', () => {
  it('gives every row a band inside the plot', async () => {
    const chart = await render({
      xaxis: { type: 'datetime' },
      series: [{ data: ROWS }],
    })
    const h = chart.w.layout.gridHeight
    const band = h / ROWS.length
    rowsDrawn(chart).forEach((r, j) => {
      expect(r.top).toBeGreaterThanOrEqual(-0.5)
      expect(r.bottom).toBeLessThanOrEqual(h + 0.5)
      expect(Math.abs((r.top + r.bottom) / 2 - band * (j + 0.5))).toBeLessThan(
        0.5,
      )
    })
    chart.destroy()
  })

  it('labels each row with its own date, formatted as one', async () => {
    const chart = await render({
      xaxis: { type: 'datetime' },
      series: [{ data: ROWS }],
    })
    expect(texts(chart, '.apexcharts-yaxis-label')).toEqual([
      '01 Jan',
      '02 Jan',
      '04 Jan',
      '08 Jan',
    ])
    chart.destroy()
  })

  it('keeps the value axis labels', async () => {
    const chart = await render({
      xaxis: { type: 'datetime' },
      series: [{ data: ROWS }],
    })
    const values = texts(chart, '.apexcharts-xaxis-label')
    expect(values).toContain('0')
    expect(values).toContain('40')
    chart.destroy()
  })

  it('still lets the caller format the rows', async () => {
    const chart = await render({
      xaxis: { type: 'datetime' },
      yaxis: { labels: { formatter: (v) => `row ${v}` } },
      series: [{ data: ROWS.slice(0, 2) }],
    })
    expect(texts(chart, '.apexcharts-yaxis-label')).toEqual([
      `row ${T0}`,
      `row ${T0 + DAY}`,
    ])
    chart.destroy()
  })

  it('bands a boxPlot the same way', async () => {
    const chart = await render({
      chart: { type: 'boxPlot' },
      xaxis: { type: 'datetime' },
      series: [
        {
          data: [
            { x: T0, y: [5, 10, 15, 20, 30] },
            { x: T0 + 5 * DAY, y: [2, 6, 9, 14, 22] },
          ],
        },
      ],
    })
    const h = chart.w.layout.gridHeight
    // Each box is drawn as two halves; take the extent of both.
    const halves = rowsDrawn(chart, '.apexcharts-boxPlot-area')
    expect(halves.length).toBe(4)
    const boxes = [halves.slice(0, 2), halves.slice(2)].map((pair) => ({
      top: Math.min(...pair.map((r) => r.top)),
      bottom: Math.max(...pair.map((r) => r.bottom)),
    }))
    boxes.forEach((r, j) => {
      expect(
        Math.abs((r.top + r.bottom) / 2 - (h / 2) * (j + 0.5)),
      ).toBeLessThan(0.5)
    })
    chart.destroy()
  })
})

describe('horizontal bar with a numeric x', () => {
  it('labels the rows with their x and the values without x decimals', async () => {
    const chart = await render({
      xaxis: { type: 'numeric' },
      series: [
        {
          data: [
            [1, 10],
            [2, 20],
            [5, 40],
          ],
        },
      ],
    })
    expect(texts(chart, '.apexcharts-yaxis-label')).toEqual(['1', '2', '5'])
    // The value axis was formatted with decimals sized for the x range (1..5).
    const values = texts(chart, '.apexcharts-xaxis-label')
    expect(values).toContain('0')
    expect(values.some((v) => v.includes('.'))).toBe(false)
    chart.destroy()
  })
})
