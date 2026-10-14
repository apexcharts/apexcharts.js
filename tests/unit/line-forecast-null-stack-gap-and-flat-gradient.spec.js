import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// Three line defects users saw:
// - forecastDataPoints dashed the whole series when the value at the
//   forecast boundary was null;
// - on a stacked straight or stepline chart with a negative axis minimum,
//   the series above a null was drawn far off its value (the null was folded
//   in as a stack top at the bottom of the axis);
// - a flat gradient line drawn after a column series got no #358 nudge, so
//   its gradient had a zero height box and the stroke did not render.

const render = async (opts) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    ...opts,
    chart: {
      width: 600,
      height: 400,
      ...opts.chart,
      animations: { enabled: false },
    },
  })
  await chart.render()
  return chart
}

const maskX = () => ({
  forecast: +document.querySelector('[id^=forecastMask] rect').getAttribute('x'),
  solid: +document.querySelector('[id^=nonForecastMask] rect').getAttribute('width'),
})

describe('forecast cutoff', () => {
  const data = [10, 41, 35, 51, 49, 62, 69, 91]

  it.each([
    ['category', {}],
    ['numeric', { type: 'numeric' }],
  ])('sits on the boundary point on a %s axis', async (_, xaxis) => {
    const chart = await render({
      chart: { type: 'line' },
      xaxis,
      forecastDataPoints: { count: 3 },
      series: [{ name: 'A', data: xaxis.type ? data.map((y, i) => [i * 2, y]) : data }],
    })
    const boundary = chart.w.globals.seriesXvalues[0][4]
    const m = maskX()
    expect(m.forecast).toBeCloseTo(boundary, 6)
    expect(m.solid).toBeCloseTo(boundary, 6)
  })

  it('does not dash the whole series when the boundary value is null', async () => {
    await render({
      chart: { type: 'line' },
      forecastDataPoints: { count: 3 },
      series: [{ name: 'A', data: [10, 41, 35, 51, 49, 62, 69, 91] }],
    })
    const expected = maskX()
    await render({
      chart: { type: 'line' },
      forecastDataPoints: { count: 3 },
      series: [{ name: 'A', data: [10, 41, 35, 51, null, 62, 69, 91] }],
    })
    const m = maskX()
    expect(m.forecast).toBeGreaterThan(0)
    expect(m.forecast).toBeCloseTo(expected.forecast, 6)
    expect(m.solid).toBeCloseTo(expected.solid, 6)
  })
})

describe('stacked null over a negative axis minimum', () => {
  const stacked = (curve, B) => ({
    chart: { type: 'line', stacked: true },
    stroke: { curve },
    series: [
      { name: 'A', data: [-10, 10, 10] },
      { name: 'B', data: B },
      { name: 'C', data: [5, 5, 5] },
    ],
  })

  it.each(['straight', 'stepline', 'smooth'])(
    'stacks the next series as if the null were zero (%s)',
    async (curve) => {
      const padded = await render(stacked(curve, [5, 0, 5]))
      const oracle = padded.w.globals.seriesYvalues[2].slice()
      const gap = await render(stacked(curve, [5, null, 5]))
      gap.w.globals.seriesYvalues[2].forEach((y, j) =>
        expect(y).toBeCloseTo(oracle[j], 6),
      )
    },
  )
})

describe('flat gradient line in a combo', () => {
  const ys = () =>
    document
      .querySelector('.apexcharts-line-series path.apexcharts-line')
      .getAttribute('d')
      .split(/[ML]/)
      .filter((p) => p.trim())
      .map((p) => +p.trim().split(/[ ,]+/)[1])

  it('nudges a flat line drawn after a column, as it does alone', async () => {
    await render({
      chart: { type: 'line' },
      stroke: { curve: 'straight' },
      fill: { type: 'gradient' },
      series: [
        { name: 'C', type: 'column', data: [10, 20, 30] },
        { name: 'L', type: 'line', data: [25, 25, 25] },
      ],
    })
    const y = ys()
    expect(y[y.length - 1]).not.toBe(y[0])
  })

  it('reads the gradient fill type of the line, not of the column', async () => {
    await render({
      chart: { type: 'line' },
      stroke: { curve: 'straight' },
      fill: { type: ['solid', 'gradient'] },
      series: [
        { name: 'C', type: 'column', data: [10, 20, 30] },
        { name: 'L', type: 'line', data: [25, 25, 25] },
      ],
    })
    const y = ys()
    expect(y[y.length - 1]).not.toBe(y[0])
  })

  it('leaves a non-flat line in the combo untouched', async () => {
    const chart = await render({
      chart: { type: 'line' },
      fill: { type: 'gradient' },
      series: [
        { name: 'C', type: 'column', data: [25, 25, 25] },
        { name: 'L', type: 'line', data: [10, 20, 30] },
      ],
    })
    expect(chart.w.seriesData.series[1]).toEqual([10, 20, 30])
  })
})
