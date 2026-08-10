import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #5273: on a step-1 datetime interval, `DateTime.ceilToBoundary()` returns the
 * calendar boundary at or *before* the first data point, so `TimeScale` gives
 * that tick a negative position. The label and the axis tick are both dropped
 * for being outside the plot, but `Grid.datetimeLines()` drew the gridline
 * verbatim, and gridlines get no clip-path, so the line landed in the y-axis
 * label gutter.
 *
 * 159 monthly points from 21 May 2013 span 13.2 years, which picks year x 1.
 */

const DATA = Array.from({ length: 159 }, (_, i) => [
  new Date(2013, 4 + i, 21).getTime(),
  100 + (i % 17),
])

function render() {
  return createChartWithOptions({
    chart: { type: 'line', width: 800, height: 400 },
    series: [{ name: 'Series', data: DATA }],
    xaxis: { type: 'datetime' },
    yaxis: { labels: { minWidth: 60 } },
    grid: { xaxis: { lines: { show: true } } },
  })
}

function verticalGridlineXs() {
  return Array.from(
    document.querySelectorAll('.apexcharts-gridlines-vertical line'),
  ).map((line) => parseFloat(line.getAttribute('x1')))
}

describe('Issue 5273: datetime gridline drawn outside the plot', () => {
  it('draws no gridline left of the plot area', () => {
    const chart = render()

    // control: the timescale really does put a tick before the plot origin
    expect(chart.w.labelData.timescaleLabels[0].position).toBeLessThan(0)

    expect(verticalGridlineXs().filter((x) => x < 0)).toEqual([])
  })

  it('still draws a gridline for every tick inside the plot', () => {
    const chart = render()

    const inside = chart.w.labelData.timescaleLabels.filter(
      (label) => label.position >= 0,
    )

    expect(verticalGridlineXs()).toEqual(inside.map((label) => label.position))
  })
})
