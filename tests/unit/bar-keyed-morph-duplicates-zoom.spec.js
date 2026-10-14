import { describe, it, expect } from 'vitest'
import Bar from '../../src/charts/Bar'
import { seriesKeys } from '../../src/modules/animations/LengthTransition'
import { createChartWithOptions } from './utils/utils.js'

// Keyed bar morph defects users saw:
// - with duplicate category labels, a bar flew in from another bar's
//   position on every animated value update;
// - on a zoomed bar chart every value update lost the per-bar stagger, read
//   as an enter/exit layout change.

const fakeW = (labels, series, seriesX, isXNumeric) => ({
  config: {
    chart: {
      animations: { enabled: true, dynamicAnimation: { enabled: true } },
    },
    plotOptions: { bar: { borderRadius: 0 } },
  },
  globals: {
    labels,
    dataPoints: series[0].length,
    dataChanged: true,
    shouldAnimate: true,
    previousPaths: [],
  },
  axisFlags: { isXNumeric },
  seriesData: { series, seriesX },
})

const barOn = (w, drawn) => {
  // the previous render stamped each drawn bar with its key
  const keys = seriesKeys(w, 0)
  w.globals.previousPaths = [
    {
      realIndex: 0,
      paths: drawn.map((j) => ({ d: `M ${j} 0 L ${j} 10`, key: keys[j] })),
    },
  ]
  const bar = Object.create(Bar.prototype)
  bar.w = w
  return bar
}

describe('keyed bar morph', () => {
  it('each duplicate category is stamped with its own key', () => {
    createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      dataLabels: { enabled: false },
      xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Jan'] },
      series: [{ name: 'A', data: [1, 2, 3, 4] }],
    })
    const keys = [...document.querySelectorAll('.apexcharts-bar-area')].map(
      (p) => p.getAttribute('data:pathKey'),
    )
    expect(keys.length).toBe(4)
    expect(new Set(keys).size).toBe(4)
  })

  it('each duplicate category label rides with its own key', () => {
    createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 300 },
      dataLabels: { animate: { enabled: true } },
      xaxis: { categories: ['Jan', 'Feb', 'Jan'] },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    const pathKeys = [...document.querySelectorAll('.apexcharts-bar-area')].map(
      (p) => '0::' + p.getAttribute('data:pathKey'),
    )
    const dlKeys = [
      ...document.querySelectorAll('.apexcharts-data-labels'),
    ].map((g) => g.getAttribute('data:dlKey'))
    expect(dlKeys).toEqual(pathKeys)
    expect(new Set(dlKeys).size).toBe(3)
  })

  it('a duplicate category morphs from its own previous bar', () => {
    const w = fakeW(['Jan', 'Feb', 'Mar', 'Jan'], [[1, 2, 3, 4]], [[]], false)
    const bar = barOn(w, [0, 1, 2, 3])
    expect(bar.getPreviousPath(0, 0, 'M 9 9 L 9 9')).toBe('M 0 0 L 0 10')
    expect(bar.getPreviousPath(0, 3, 'M 9 9 L 9 9')).toBe('M 3 0 L 3 10')
  })

  it('a value update of a zoomed series is not a layout change', () => {
    const w = fakeW([], [[1, 2, 3, 4, 5, 6]], [[10, 20, 30, 40, 50, 60]], true)
    // three of the six bars were on screen
    expect(barOn(w, [2, 3, 4]).isLengthTransition(0)).toBe(false)
    // a drawn bar whose datum is gone still counts as an exit
    const bar = barOn(w, [2, 3, 4])
    w.seriesData.seriesX = [[10, 20, 30, 45, 50, 60]]
    expect(bar.isLengthTransition(0)).toBe(true)
  })
})
