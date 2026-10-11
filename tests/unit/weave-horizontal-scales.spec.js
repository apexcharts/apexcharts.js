/**
 * Weave scales on a horizontal bar (#5341). The facade built them for the
 * upright chart, so a mark placed through both scales.x and scales.y went
 * through the wrong axis twice: up to 92% of the grid height away from the
 * datum on a datetime x. Asserted against the bars the chart drew, never
 * against the scales' own arithmetic, which would agree with itself either way.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

let n = 0
/** Registers a plugin that keeps the last scales and data it was handed. */
function probe() {
  const out = { name: `hscale-${n++}`, scales: null, data: null, api: null }
  ApexCharts.registerPlugin({
    name: out.name,
    apiVersion: 2,
    setup(api) {
      out.api = api
      api.on('draw', ({ scales, data }) => {
        out.scales = scales
        out.data = data
      })
    },
  })
  return out
}

/** Each drawn bar's box, from its path, in layer-local pixels. */
function bars(chart) {
  return Array.from(
    chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-bar-area, .apexcharts-rangebar-area',
    ),
  ).map((p) => {
    const nums = (
      (p.getAttribute('d') || '').match(/-?\d+(\.\d+)?/g) || []
    ).map(Number)
    const xs = nums.filter((_, k) => k % 2 === 0)
    const ys = nums.filter((_, k) => k % 2 === 1)
    return {
      i: Number(p.getAttribute('index')),
      j: Number(p.getAttribute('j')),
      left: Math.min(...xs),
      right: Math.max(...xs),
      cy: (Math.min(...ys) + Math.max(...ys)) / 2,
    }
  })
}

const render = async (out, opts) => {
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
    plugins: [{ name: out.name }],
  })
  await chart.render()
  return chart
}

const DAY = 864e5
const T0 = 1e12

/**
 * Every datum of series `i` lands where its bar ends: the value edge of the
 * bar across, its centre down.
 */
function expectOnBars(out, chart, i = 0, valueEdge = 'right') {
  const drawn = bars(chart).filter((b) => b.i === i)
  expect(drawn.length).toBe(out.data[i].points.length)
  out.data[i].points.forEach((p, j) => {
    const bar = drawn.find((b) => b.j === j)
    const at = out.scales.point(p.x, p.y)
    expect(Math.abs(at.x - bar[valueEdge])).toBeLessThan(0.5)
    expect(Math.abs(at.y - bar.cy)).toBeLessThan(0.5)
  })
}

describe('Weave scales: horizontal bars', () => {
  it('says it can, and says the chart is on its side', async () => {
    const out = probe()
    const chart = await render(out, {
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    expect(out.api.can('scale-orientation')).toBe(true)
    expect(out.scales.transposed).toBe(true)
    chart.destroy()
  })

  it('places a datetime bar on the bar', async () => {
    const out = probe()
    const chart = await render(out, {
      xaxis: { type: 'datetime' },
      series: [
        {
          data: [
            [T0, 10],
            [T0 + DAY, 20],
            [T0 + 3 * DAY, 40],
          ],
        },
      ],
    })
    expectOnBars(out, chart)
    chart.destroy()
  })

  it('places a numeric bar on the bar, for each of several series', async () => {
    const out = probe()
    const series = [0, 1, 2].map((s) => ({
      data: [
        { x: 1, y: 10 + s },
        { x: 2, y: 20 + s },
        { x: 5, y: 40 + s },
      ],
    }))
    const chart = await render(out, { xaxis: { type: 'numeric' }, series })
    // Every series of a group sits on the same x, so the group's centre is
    // where its datum goes: the middle series' bar is exactly that.
    expectOnBars(out, chart, 1)
    chart.destroy()
  })

  it('places a category bar on its band', async () => {
    const out = probe()
    const chart = await render(out, {
      series: [{ data: [10, 20, 30, 40] }],
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
    })
    expectOnBars(out, chart)
    chart.destroy()
  })

  it('looks a stacked datetime bar up to the row it was drawn on', async () => {
    const out = probe()
    const chart = await render(out, {
      chart: { stacked: true },
      xaxis: { type: 'datetime' },
      series: [
        {
          data: [
            [T0, 10],
            [T0 + DAY, 20],
            [T0 + 3 * DAY, 40],
          ],
        },
        {
          data: [
            [T0, 5],
            [T0 + DAY, 6],
            [T0 + 3 * DAY, 7],
          ],
        },
      ],
    })
    // The first series' bars start at the baseline, so their ends are values.
    expectOnBars(out, chart, 0)
    chart.destroy()
  })

  it('takes a rangeBar row by the label api.data hands out', async () => {
    const out = probe()
    const chart = await render(out, {
      chart: { type: 'rangeBar' },
      xaxis: { type: 'datetime' },
      series: [
        {
          data: [
            { x: 'A', y: [T0, T0 + DAY] },
            { x: 'B', y: [T0 + DAY, T0 + 3 * DAY] },
          ],
        },
      ],
    })
    expect(out.data[0].points.map((p) => p.x)).toEqual(['A', 'B'])
    expectOnBars(out, chart)
    chart.destroy()
  })

  it('runs the value from the right on a reversed axis', async () => {
    const out = probe()
    const chart = await render(out, {
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
      yaxis: { reversed: true },
    })
    expectOnBars(out, chart, 0, 'left')
    chart.destroy()
  })

  it('puts zero where a negative bar meets a positive one', async () => {
    const out = probe()
    const chart = await render(out, {
      series: [{ data: [-10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    const [neg, pos] = bars(chart)
    expect(Math.abs(out.scales.y(0) - neg.right)).toBeLessThan(0.5)
    expect(Math.abs(out.scales.y(0) - pos.left)).toBeLessThan(0.5)
    expect(Math.abs(out.scales.y(-10) - neg.left)).toBeLessThan(0.5)
    chart.destroy()
  })

  // apex-analyst rebases by subtracting the edges, so they stay 0 and the far
  // side of the grid, now down for x and across for the value.
  it('keeps the domain edges on the grid edges', async () => {
    const out = probe()
    const chart = await render(out, {
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    const L = chart.w.layout
    const [x0, x1] = out.scales.domainX
    const [y0, y1] = out.scales.domainY()
    expect(out.scales.x(x0)).toBeCloseTo(0, 6)
    expect(out.scales.x(x1)).toBeCloseTo(L.gridHeight, 6)
    expect(out.scales.y(y0)).toBeCloseTo(0, 6)
    expect(out.scales.y(y1)).toBeCloseTo(L.gridWidth, 6)
    chart.destroy()
  })
})

describe('Weave scales: upright charts', () => {
  it('are not transposed, and point() is just the two scales', async () => {
    const out = probe()
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 800, height: 300 },
      series: [{ data: [10, 20, 30] }],
      xaxis: { categories: ['a', 'b', 'c'] },
      plugins: [{ name: out.name }],
    })
    await chart.render()
    expect(out.scales.transposed).toBe(false)
    expect(out.scales.point(1, 20)).toEqual({
      x: out.scales.x(1),
      y: out.scales.y(20),
    })
    chart.destroy()
  })
})
