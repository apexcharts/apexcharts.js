import { test, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'
import CoreUtils from '../../src/modules/CoreUtils.js'

// One stack key (CoreUtils.stackKey) decides where a stacked datum stacks, for
// the stacked bar renderer, its total labels, the 100% shares and the highlight
// parts. A part keyed differently from its whole restarts from the axis while
// the whole sits on the stack, so it is drawn inside the bar below.

const at = (n) => n.getAttribute('index') + '|' + n.getAttribute('j')
const nodes = (c, sel) =>
  new Map([...c.w.dom.baseEl.querySelectorAll(sel)].map((n) => [at(n), n]))
const ys = (d) => {
  const nums = (String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number)
  const v = nums.filter((_, k) => k % 2 === 1)
  return [Math.min(...v), Math.max(...v)]
}
const d = (k) => Date.UTC(2024, 0, 1 + k)

test('stackKey is the x value on a numeric axis, else the index', () => {
  const w = {
    axisFlags: { isXNumeric: true },
    seriesData: { seriesX: [[d(0), d(1)], [d(1)]] },
  }
  expect(CoreUtils.stackKey(w, 0, 1)).toBe(d(1))
  expect(CoreUtils.stackKey(w, 1, 0)).toBe(d(1))
  // a series without x values has no stack to join
  expect(CoreUtils.stackKey(w, 2, 0)).toBeUndefined()
  w.axisFlags.isXNumeric = false
  expect(CoreUtils.stackKey(w, 1, 0)).toBe(0)
})

test('datetime stack with a missing date: parts sit on their wholes', () => {
  const c = createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 360, stacked: true },
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
        data: [1, 2].map((k) => ({ x: d(k), y: 15, highlight: 15 })),
      },
    ],
    xaxis: { type: 'datetime' },
    dataLabels: { enabled: false },
  })
  const parts = nodes(c, '.apexcharts-bar-highlight-part')
  const wholes = nodes(c, '.apexcharts-series > .apexcharts-bar-area')
  expect(parts.size).toBe(5)
  for (const [k, p] of parts) {
    const [p0, p1] = ys(p.getAttribute('pathTo'))
    const [w0, w1] = ys(wholes.get(k).getAttribute('pathTo'))
    expect(Math.abs(p0 - w0), k).toBeLessThan(0.5)
    expect(Math.abs(p1 - w1), k).toBeLessThan(0.5)
  }
  // B's first segment (Jan 2) stacks on A's Jan 2 segment, not the axis
  const [, bBase] = ys(wholes.get('1|0').getAttribute('pathTo'))
  const [aTop] = ys(wholes.get('0|1').getAttribute('pathTo'))
  expect(Math.abs(bBase - aTop)).toBeLessThan(0.5)
  c.destroy()
})
