import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Range bar layout defects users saw:
// - with rangeBarOverlap: false, every bar after an overlapping row was drawn
//   at the shrunk thickness, and three overlaps in a later series landed on
//   the previous series' bars;
// - in a line + rangeBar combo the range columns read the line's data and
//   stopped where it ended;
// - a null range drew the tallest column in the chart, and an x: '' row was
//   drawn below the plot;
// - on a numeric x axis, labels of columns whose x matched a tick sat away
//   from their columns;
// - timeline bars were keyed by the j-th row label, so updates morphed bars
//   from other bars' positions.

const mount = (options) =>
  createChartWithOptions({
    ...options,
    chart: { type: 'rangeBar', width: 600, height: 400, ...options.chart },
  })

const box = (el) => {
  const n = el
    .getAttribute('d')
    .match(/-?\d+(\.\d+)?(e-?\d+)?/g)
    .map(Number)
  const xs = n.filter((_, k) => k % 2 === 0)
  const ys = n.filter((_, k) => k % 2 === 1)
  return {
    x1: Math.min(...xs),
    x2: Math.max(...xs),
    y1: Math.min(...ys),
    y2: Math.max(...ys),
  }
}

const bars = (chart, root = chart.el) => [
  ...root.querySelectorAll('.apexcharts-rangebar-area'),
]

describe('rangeBarOverlap: false', () => {
  it('shrinks only the overlapping row', () => {
    const chart = mount({
      plotOptions: { bar: { horizontal: true, rangeBarOverlap: false } },
      series: [
        {
          data: [
            { x: 'A', y: [0, 30] },
            { x: 'A', y: [10, 40] },
            { x: 'B', y: [50, 60] },
          ],
        },
      ],
    })
    const h = bars(chart).map((p) => box(p).y2 - box(p).y1)
    expect(h[2]).toBeCloseTo(h[0] * 2, 0)
  })

  it('keeps a later series overlap inside its own band', () => {
    const chart = mount({
      plotOptions: { bar: { horizontal: true, rangeBarOverlap: false } },
      series: [
        { name: 'S1', data: [{ x: 'A', y: [0, 10] }] },
        {
          name: 'S2',
          data: [
            { x: 'A', y: [0, 30] },
            { x: 'A', y: [10, 40] },
            { x: 'A', y: [20, 50] },
          ],
        },
      ],
    })
    const s = chart.el.querySelectorAll(
      '.apexcharts-rangebar-series .apexcharts-series',
    )
    const s1 = bars(chart, s[0]).map(box)
    const s2 = bars(chart, s[1]).map(box)
    const top = Math.min(...s2.map((b) => b.y1))
    expect(top).toBeGreaterThanOrEqual(Math.max(...s1.map((b) => b.y2)) - 0.5)
    // the three S2 bars stack without overlapping each other
    s2.sort((a, b) => a.y1 - b.y1)
    expect(s2[1].y1).toBeGreaterThanOrEqual(s2[0].y2 - 0.5)
    expect(s2[2].y1).toBeGreaterThanOrEqual(s2[1].y2 - 0.5)
  })
})

describe('rangeBar data lookups', () => {
  it('draws every range column after a shorter line in a combo', () => {
    const chart = mount({
      series: [
        {
          name: 'L',
          type: 'line',
          data: [
            { x: 'a', y: 3 },
            { x: 'b', y: 4 },
          ],
        },
        {
          name: 'R',
          type: 'rangeBar',
          data: [
            { x: 'a', y: [1, 5] },
            { x: 'b', y: [2, 6] },
            { x: 'c', y: [3, 7] },
          ],
        },
      ],
    })
    expect(bars(chart).length).toBe(3)
  })

  it('draws no column for a null range', () => {
    const chart = mount({
      series: [
        {
          data: [
            { x: 'a', y: [10, 20] },
            { x: 'b', y: null },
            { x: 'c', y: [15, 25] },
          ],
        },
      ],
    })
    bars(chart)
      .filter((p) => p.getAttribute('j') === '1')
      .forEach((p) => expect(box(p).y2 - box(p).y1).toBeLessThan(1))
  })

  it("places an x: '' bar on its own row inside the plot", () => {
    const chart = mount({
      plotOptions: { bar: { horizontal: true } },
      series: [
        {
          data: [
            { x: 'A', y: [1, 5] },
            { x: 'A', y: [6, 9] },
            { x: '', y: [2, 6] },
          ],
        },
      ],
    })
    expect(box(bars(chart)[2]).y2).toBeLessThanOrEqual(
      chart.w.layout.gridHeight + 0.5,
    )
  })

  it('centres labels on columns whose numeric x equals a tick', () => {
    const chart = mount({
      dataLabels: { enabled: true },
      xaxis: { type: 'numeric', min: 10, max: 50, tickAmount: 4 },
      series: [
        {
          data: [
            { x: 10, y: [1, 5] },
            { x: 15, y: [2, 6] },
            { x: 50, y: [3, 7] },
          ],
        },
      ],
    })
    const centres = bars(chart).map((p) => (box(p).x1 + box(p).x2) / 2)
    const labels = [...chart.el.querySelectorAll('.apexcharts-datalabel')]
    expect(labels.length).toBe(3)
    labels.forEach((t, k) =>
      expect(Number(t.getAttribute('x'))).toBeCloseTo(centres[k], 0),
    )
  })

  it('keys each timeline bar by its own row', () => {
    const chart = mount({
      plotOptions: { bar: { horizontal: true } },
      series: [
        {
          data: [
            { x: 'A', y: [1, 5] },
            { x: 'A', y: [6, 9] },
            { x: 'B', y: [2, 6] },
          ],
        },
      ],
    })
    expect(bars(chart).map((p) => p.getAttribute('data:pathKey'))).toEqual([
      'c:A',
      'c:A#1',
      'c:B',
    ])
  })
})
