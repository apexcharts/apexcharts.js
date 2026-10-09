/**
 * The series API toggles a pie, donut or polarArea slice both ways.
 *
 * isSeriesHidden read the `apexcharts-series-collapsed` class, which a slice's
 * group never carries (radialBar's arcs do). So a hidden slice read as
 * visible: toggleSeries() hid it again instead of showing it, and
 * showSeries() did nothing. Legend clicks were unaffected; they take their
 * own path.
 */
import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

async function chart(type) {
  document.body.innerHTML = '<div id="chart" />'
  const c = new ApexCharts(document.querySelector('#chart'), {
    chart: { type, height: 300, animations: { enabled: false } },
    series: [44, 33, 23],
    labels: ['A', 'B', 'C'],
  })
  await c.render()
  return c
}

describe.each(['pie', 'donut', 'polarArea', 'radialBar'])('%s', (type) => {
  it('toggleSeries hides the slice, then shows it again', async () => {
    const c = await chart(type)
    c.toggleSeries('B')
    expect(c.w.globals.series).toEqual([44, 0, 23])
    expect(c.series.isSeriesHidden('B').isHidden).toBe(true)
    c.toggleSeries('B')
    expect(c.w.globals.series).toEqual([44, 33, 23])
    expect(c.series.isSeriesHidden('B').isHidden).toBe(false)
  })

  it('hideSeries is idempotent and showSeries brings the slice back', async () => {
    const c = await chart(type)
    c.hideSeries('B')
    c.hideSeries('B')
    expect(c.w.globals.series).toEqual([44, 0, 23])
    c.showSeries('B')
    expect(c.w.globals.series).toEqual([44, 33, 23])
  })
})
