import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The gap kept between y axes was added whenever the chart had more than one
// y axis, so an axis set to show: false still widened the gutter of the one
// that is drawn, and the plot no longer lined up with a single-axis chart
// (#5004).

const data = [30, 40, 35, 50, 49, 60, 70, 91, 125]

function plotX(yaxis, series = [{ name: 'a', data }]) {
  const chart = createChartWithOptions({
    chart: { type: 'line', width: 800, height: 250 },
    series,
    yaxis,
    xaxis: {
      categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999],
    },
  })
  const { translateX, gridWidth } = chart.w.layout
  chart.destroy()
  return { translateX, gridWidth }
}

const two = [
  { name: 'a', data },
  { name: 'b', data: data.map((v) => v * 2) },
]

describe('y axis gutter with a hidden axis', () => {
  it('places the plot as a single-axis chart does when the other axis is hidden', () => {
    const single = plotX({})
    expect(plotX([{}, { show: false }], two)).toEqual(single)
    expect(plotX([{ show: false }, {}], two)).toEqual(single)
    expect(plotX([{}, { opposite: true, show: false }], two)).toEqual(single)
  })

  it('keeps the gap between two drawn axes when a third is hidden', () => {
    const single = plotX({})
    const both = plotX([{}, {}], two)
    expect(both.translateX).toBeGreaterThan(single.translateX)
    expect(
      plotX([{}, {}, { show: false }], [...two, { name: 'c', data }]),
    ).toEqual(both)
  })
})
