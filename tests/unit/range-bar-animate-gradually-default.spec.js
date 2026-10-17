/**
 * The rangeBar type default for `chart.animations.animateGradually`.
 *
 * It was the boolean `false` where every other type has `{ enabled, delay }`,
 * so the merge had nothing to lay a user's partial setting over. On a rangeBar
 * (and a timeline) `{ enabled: true }` came out with no `delay`, and the
 * stagger multiplied by `undefined`; `{ delay: 50 }` came out with no
 * `enabled`, which Bar read as on and Animations read as off.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const RANGES = [
  {
    name: 'Plan',
    data: [
      { x: 'Design', y: [1, 4] },
      { x: 'Build', y: [3, 8] },
    ],
  },
]

const gradually = (animateGradually) =>
  createChartWithOptions({
    chart: { type: 'rangeBar', animations: { animateGradually } },
    plotOptions: { bar: { horizontal: true } },
    series: RANGES,
  }).w.config.chart.animations.animateGradually

describe('rangeBar animateGradually default', () => {
  it('is off, in the same shape as every other type', () => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeBar' },
      plotOptions: { bar: { horizontal: true } },
      series: RANGES,
    })
    expect(chart.w.config.chart.animations.animateGradually).toEqual({
      enabled: false,
      delay: 150,
    })
  })

  it('keeps the default delay when the page only turns it on', () => {
    expect(gradually({ enabled: true })).toEqual({ enabled: true, delay: 150 })
  })

  it('stays off when the page only sets a delay', () => {
    expect(gradually({ delay: 50 })).toEqual({ enabled: false, delay: 50 })
  })
})
