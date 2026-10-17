import { test, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'

// A 100% stack normalises each stack to its own total: per series group, and
// per x value on a numeric or datetime axis. The parts must divide by the same
// total as their wholes, so a part equal to its whole draws exactly on it.

const at = (n) => n.getAttribute('index') + '|' + n.getAttribute('j')
const nodes = (c, sel) =>
  new Map([...c.w.dom.baseEl.querySelectorAll(sel)].map((n) => [at(n), n]))
const ys = (d) => {
  const nums = (String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number)
  const v = nums.filter((_, k) => k % 2 === 1)
  return [Math.min(...v), Math.max(...v)]
}

const expectPartsOnWholes = (c, count) => {
  const parts = nodes(c, '.apexcharts-bar-highlight-part')
  const wholes = nodes(c, '.apexcharts-series > .apexcharts-bar-area')
  expect(parts.size).toBe(count)
  for (const [k, p] of parts) {
    const [p0, p1] = ys(p.getAttribute('pathTo'))
    const [w0, w1] = ys(wholes.get(k).getAttribute('pathTo'))
    expect(Math.abs(p0 - w0), k).toBeLessThan(0.5)
    expect(Math.abs(p1 - w1), k).toBeLessThan(0.5)
  }
}

test('100% grouped stack: a part equal to its whole spans its whole', () => {
  const series = [
    { name: 'A', group: 'g1', data: [10, 20, 30] },
    { name: 'B', group: 'g1', data: [5, 5, 5] },
    { name: 'C', group: 'g2', data: [7, 8, 9] },
    { name: 'D', group: 'g2', data: [1, 2, 3] },
  ].map((s) => ({ ...s, highlightData: s.data }))
  const c = createChartWithOptions({
    chart: {
      type: 'bar',
      width: 600,
      height: 360,
      stacked: true,
      stackType: '100%',
    },
    series,
    xaxis: { categories: ['a', 'b', 'c'] },
    dataLabels: { enabled: false },
  })
  expectPartsOnWholes(c, 12)
  c.destroy()
})

test('100% stack on a datetime axis: a date missing from one series aligns', () => {
  const d = (k) => Date.UTC(2024, 0, 1 + k)
  const c = createChartWithOptions({
    chart: {
      type: 'bar',
      width: 600,
      height: 360,
      stacked: true,
      stackType: '100%',
    },
    series: [
      {
        name: 'A',
        data: [0, 1, 2].map((k) => ({
          x: d(k),
          y: 10 * (k + 1),
          highlight: 10 * (k + 1),
        })),
      },
      {
        // No value on the first date: index j no longer names the same x.
        name: 'B',
        data: [1, 2].map((k) => ({ x: d(k), y: 30, highlight: 30 })),
      },
    ],
    xaxis: { type: 'datetime' },
    dataLabels: { enabled: false },
  })
  expectPartsOnWholes(c, 5)
  c.destroy()
})
