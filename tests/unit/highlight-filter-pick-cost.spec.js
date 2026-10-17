import { test, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/highlight-filter.js'

// What a pick costs before its update starts. set() and clear() read the
// series as the chart was handed them, never the deep snapshot behind
// `initialSeries` (a clone of every point, made on first read after each
// update). And the line labels captured for the next render's ride find
// their point by a lookup, not a scan of every point per label.

/** Count reads of the lazy `initialSeries` snapshot. */
function countSnapshotReads(chart) {
  const gl = chart.w.globals
  const d = Object.getOwnPropertyDescriptor(gl, 'initialSeries')
  const box = { n: 0 }
  Object.defineProperty(gl, 'initialSeries', {
    configurable: true,
    enumerable: true,
    get() {
      box.n++
      return d.get.call(gl)
    },
    set(v) {
      d.set.call(gl, v)
    },
  })
  return box
}

test('set() and clear() never deep-clone the series', async () => {
  const chart = createChartWithOptions({
    chart: { type: 'bar', width: 600, height: 300 },
    series: [
      { name: 'A', data: [10, 20, 30] },
      {
        name: 'B',
        data: [
          { x: 'a', y: 5 },
          { x: 'b', y: 6 },
          { x: 'c', y: 7 },
        ],
      },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
  })
  const reads = countSnapshotReads(chart)
  const hf = chart.highlightFilter
  await hf.set([
    [5, 10, null],
    [1, 2, 3],
  ])
  expect(hf.valueAt(0, 1)).toBe(10)
  expect(hf.valueAt(1, 2)).toBe(3)
  await hf.set((p) => p.value / 2)
  expect(hf.valueAt(1, 0)).toBe(2.5)
  await hf.clear()
  expect(hf.isActive()).toBe(false)
  // The data handed back is the chart's own: the pick did not rewrite it.
  expect(chart.w.config.series[1].data[0]).toEqual({ x: 'a', y: 5 })
  expect(reads.n).toBe(0)
  chart.destroy()
})

test('the label ride finds each label point by lookup, not by scan', () => {
  const n = 300
  const chart = createChartWithOptions({
    chart: { type: 'line', width: 900, height: 300 },
    series: [
      {
        name: 'A',
        data: Array.from({ length: n }, (_, j) => ({
          x: j,
          y: 10 + (j % 7),
          highlight: 5,
        })),
      },
    ],
    xaxis: { type: 'numeric' },
    dataLabels: { enabled: true },
  })
  const hf = chart.highlightFilter
  hf._tween = () => {}
  const wrap = chart.w.dom.baseEl.querySelector('.apexcharts-datalabels')
  const texts = [...wrap.querySelectorAll('text.apexcharts-datalabel')]
  expect(texts.length).toBeGreaterThan(50)
  const xs = chart.w.globals.seriesXvalues[0].slice()
  // Each label's point, as the screen had it: a label matched to the wrong
  // point leaves its source unused, and an unused source is carried out.
  const src = new Map(
    texts.map((t) => {
      const k = xs.indexOf(parseFloat(t.getAttribute('cx')))
      return [k, { x: 0, y: 0, o: 1, els: [t] }]
    }),
  )
  expect(src.size).toBe(texts.length)
  let reads = 0
  const counted = new Proxy(xs, {
    get(t, k, r) {
      if (typeof k === 'string' && /^\d+$/.test(k)) reads++
      return Reflect.get(t, k, r)
    },
  })
  hf._rideLabels(
    wrap,
    counted,
    xs.map(() => 0),
    src,
    [],
  )
  expect(wrap.querySelectorAll('.apexcharts-highlight-label-exit').length).toBe(
    0,
  )
  // A scan reads every point per label (n per label); a lookup reads the
  // row once to index it, and a label off its point falls back to a scan.
  expect(reads).toBeLessThan(n * 3)
  chart.destroy()
})
