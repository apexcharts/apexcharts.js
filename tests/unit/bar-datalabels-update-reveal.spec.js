import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// #5332: on a bar chart, updateSeries() kept the data labels hidden for the
// whole bar morph while updateOptions({ series }) showed them from frame 0.
// The label group is born `apexcharts-element-hidden` and registered as a
// delayed element; the options path reveals delayed elements at once (it sets
// `resized`), the series path waited for animationCompleted. With
// dataLabels.animate on (the default) the labels ride the bars, so hiding them
// hides exactly the motion that option exists to show, and on a chart updated
// once a second the labels flashed.
//
// jsdom never finishes an animation, so whatever is still hidden right after
// the update call stays hidden for the test's lifetime: the same observation
// the issue sampled in a real browser.

const CATS = ['A', 'B', 'C', 'D', 'E', 'F']
const first = [120, 180, 90, 240, 150, 210]
const next = [140, 160, 110, 220, 170, 190]

function barChart(dataLabels = {}) {
  return createChartWithOptions({
    chart: {
      type: 'bar',
      height: 360,
      animations: { enabled: true, dynamicAnimation: { enabled: true, speed: 400 } },
    },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: true, ...dataLabels },
    series: [{ name: 'p95', data: first }],
    // a fixed axis keeps the update on the fast path, as in the report
    xaxis: { categories: CATS, max: 500 },
  })
}

const labelGroups = (chart) =>
  Array.from(chart.w.dom.baseEl.querySelectorAll('.apexcharts-datalabels'))

const hiddenCount = (chart) =>
  labelGroups(chart).filter((g) =>
    g.classList.contains('apexcharts-element-hidden'),
  ).length

describe('bar data labels across a data-change update (#5332)', () => {
  it('updateSeries() leaves the labels visible while they ride', async () => {
    const chart = barChart()
    await chart.updateSeries([{ name: 'p95', data: next }])

    expect(labelGroups(chart).length).toBeGreaterThan(0)
    expect(hiddenCount(chart)).toBe(0)
  })

  it('matches updateOptions({ series }), which was already visible', async () => {
    const chart = barChart()
    await chart.updateOptions({ series: [{ name: 'p95', data: next }] })

    expect(labelGroups(chart).length).toBeGreaterThan(0)
    expect(hiddenCount(chart)).toBe(0)
  })

  it('countUp alone keeps them visible too, so the count can be seen', async () => {
    const chart = barChart({ animate: { enabled: false }, countUp: { enabled: true } })
    await chart.updateSeries([{ name: 'p95', data: next }])

    expect(hiddenCount(chart)).toBe(0)
  })

  it('with label motion off, the labels still wait for the bars', async () => {
    const chart = barChart({ animate: { enabled: false } })
    await chart.updateSeries([{ name: 'p95', data: next }])

    // control: the old behaviour is kept where nothing rides
    expect(hiddenCount(chart)).toBe(labelGroups(chart).length)
  })
})
