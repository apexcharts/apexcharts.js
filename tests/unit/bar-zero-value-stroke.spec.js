// @ts-nocheck
/**
 * Regression for #5046: with stroke.width > 0, a stacked column whose value
 * is 0 still painted a visible mark because BarStacked passed the series
 * stroke width into the value-axis geometry (stroke centering expands a
 * zero-height column by strokeWidth) even though the rendered stroke-width
 * attribute was 0.
 *
 * The sideways (slot) inset keeps the series width, so a legend-hidden layer
 * re-enters from the geometry it left instead of changing width as it grows.
 */
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const render = async (opts = {}) => {
  const { chart: chartOpts, stroke, plotOptions, series, ...rest } = opts
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'bar',
      stacked: true,
      width: 400,
      height: 300,
      animations: { enabled: false },
      ...chartOpts,
    },
    stroke: { width: 5, ...(stroke || {}) },
    plotOptions: { bar: { borderRadius: 0 }, ...(plotOptions || {}) },
    series: series || [
      { name: 'S1', data: [100, 0, 1] },
      { name: 'S2', data: [0, 1, 0] },
    ],
    ...rest,
  })
  await chart.render()
  return chart
}

function pathPoints(d) {
  const nums = (d.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi) || []).map(parseFloat)
  const xs = []
  const ys = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i])
    ys.push(nums[i + 1])
  }
  return { xs, ys }
}

function pathYSpan(d) {
  const { ys } = pathPoints(d)
  if (!ys.length) return 0
  return Math.max(...ys) - Math.min(...ys)
}

/** [min x, max x] of a column path: its sideways extent. */
function pathXExtent(d) {
  const { xs } = pathPoints(d)
  return [Math.min(...xs), Math.max(...xs)]
}

/** Let the legend toggle's redraw land in the DOM. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

const barPath = (index, j) =>
  document.querySelector(`.apexcharts-bar-area[index="${index}"][j="${j}"]`)

describe('stacked column zero values with stroke (#5046)', () => {
  it('does not expand zero-value column paths by the series stroke width', async () => {
    await render()
    const zeros = [...document.querySelectorAll('.apexcharts-bar-area')].filter(
      (p) => p.getAttribute('barHeight') === '0',
    )
    expect(zeros.length).toBe(3)
    for (const p of zeros) {
      expect(parseFloat(p.getAttribute('stroke-width') || '0')).toBe(0)
      // Path must not be grown by stroke centering (was exactly stroke.width).
      expect(pathYSpan(p.getAttribute('d') || '')).toBeLessThan(0.01)
    }
  })

  it('still strokes non-zero stacked columns', async () => {
    await render()
    const nonZero = [
      ...document.querySelectorAll('.apexcharts-bar-area'),
    ].filter((p) => parseFloat(p.getAttribute('barHeight') || '0') > 1)
    expect(nonZero.length).toBeGreaterThan(0)
    expect(
      nonZero.some(
        (p) => parseFloat(p.getAttribute('stroke-width') || '0') === 5,
      ),
    ).toBe(true)
  })

  it('keeps the sideways inset of a hidden layer so it re-enters at the same width', async () => {
    const chart = await render({
      chart: { animations: { enabled: true } },
      series: [
        { name: 'S1', data: [100, -40, 30] },
        { name: 'S2', data: [20, 10, -15] },
        { name: 'S3', data: [0, 5, 7] },
      ],
    })
    const shownTo = barPath(1, 0).getAttribute('pathTo')

    chart.hideSeries('S2')
    await settle()
    // Hidden: an empty segment, collapsed to zero height but still inset
    // sideways by the series stroke like its visible neighbours.
    const hiddenTo = barPath(1, 0).getAttribute('pathTo')
    expect(pathYSpan(hiddenTo)).toBeLessThan(0.01)
    expect(pathXExtent(hiddenTo)).toEqual(pathXExtent(shownTo))

    chart.showSeries('S2')
    await settle()
    // Re-entering: the rise starts from the geometry the layer left and only
    // grows in height, it does not change width on the way.
    const el = barPath(1, 0)
    expect(pathXExtent(el.getAttribute('pathFrom'))).toEqual(
      pathXExtent(el.getAttribute('pathTo')),
    )
    expect(pathXExtent(el.getAttribute('pathTo'))).toEqual(pathXExtent(shownTo))
    chart.destroy()
  })
})
