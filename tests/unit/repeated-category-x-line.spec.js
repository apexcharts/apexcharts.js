import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A line or area chart of {x, y} points with STRING x is converted to a
// numeric axis, and its x slots (labels, and the seriesX built from them) are
// counted in Data._generateExternalLabels. That count deduped every series by
// x, a fix for boxplot outliers (#2706) that stack on one category. On a line
// a repeated x (two readings in the same second of a live feed) is still a
// point of its own, so the count came up short of the series, the last points
// had no x, and the whole path was dropped while tooltips kept working
// (Blazor-ApexCharts #509).
//
// The fix is narrow: points stay placed by their array index, as before. The
// only change is that a line or area series counts every point, so labels and
// seriesX have one entry per point and a repeated x gives a repeated label.

const linePaths = () =>
  [...document.querySelectorAll('path.apexcharts-line')].map((p) =>
    p.getAttribute('d'),
  )

const areaPaths = () =>
  [...document.querySelectorAll('path.apexcharts-area')].map((p) =>
    p.getAttribute('d'),
  )

// Points on a straight-curve path: the M plus one L per further point.
const pointCount = (d) => (d.match(/[ML]/g) || []).length

const dup = [
  { x: '10:00:00', y: 5 },
  { x: '10:00:01', y: 6 },
  { x: '10:00:01', y: 9 },
]

function lineChart(series, type = 'line') {
  return createChartWithOptions({
    chart: { type, width: 600, height: 300 },
    stroke: { curve: 'straight' },
    series,
  })
}

describe('repeated string x on a line or area series', () => {
  it('a repeat in the first series keeps one label per point and draws the line', () => {
    const chart = lineChart([{ name: 's', data: dup }])
    const w = chart.w

    expect(w.config.xaxis.convertedCatToNumeric).toBe(true)
    expect(w.seriesData.series[0]).toEqual([5, 6, 9])
    expect(w.labelData.labels).toEqual([1, 2, 3])
    expect(w.seriesData.seriesX[0]).toEqual([1, 2, 3])
    // the repeated x gives a repeated label
    expect(w.labelData.categoryLabels).toEqual([
      '10:00:00',
      '10:00:01',
      '10:00:01',
    ])

    const paths = linePaths()
    expect(paths).toHaveLength(1)
    expect(pointCount(paths[0])).toBe(3)
    expect(paths[0]).not.toMatch(/NaN/)
  })

  it('a repeat in a later series keeps every series in sync with the labels', () => {
    const chart = lineChart([
      { name: 's', data: dup.slice(0, 2) },
      { name: 't', data: dup },
    ])
    const w = chart.w

    expect(w.labelData.labels).toEqual([1, 2, 3])
    expect(w.seriesData.seriesX).toEqual([
      [1, 2, 3],
      [1, 2, 3],
    ])
    // Category names come from the first series, as they do for a later
    // series that is longer without any repeat; that rule is unchanged.
    expect(w.labelData.categoryLabels).toEqual(['10:00:00', '10:00:01', ''])

    const paths = linePaths()
    expect(paths).toHaveLength(2)
    expect(paths.map(pointCount)).toEqual([2, 3])
  })

  it('an area series with a repeated x keeps its area path', () => {
    const chart = lineChart([{ name: 's', data: dup }], 'area')

    expect(chart.w.seriesData.seriesX[0]).toEqual([1, 2, 3])
    // an area draws its fill and its stroke, both classed apexcharts-area;
    // the fill closes down to the baseline with two more points
    const paths = areaPaths()
    expect(paths).toHaveLength(2)
    expect(paths.map(pointCount).sort()).toEqual([3, 5])
    expect(paths.join(' ')).not.toMatch(/NaN/)
  })

  it('appendData that repeats the last x keeps the line', async () => {
    const chart = lineChart([{ name: 's', data: dup.slice(0, 2) }])
    expect(pointCount(linePaths()[0])).toBe(2)

    await chart.appendData([{ data: [dup[2]] }])

    expect(chart.w.seriesData.seriesX[0]).toEqual([1, 2, 3])
    const paths = linePaths()
    expect(paths).toHaveLength(1)
    expect(pointCount(paths[0])).toBe(3)
  })

  it('leaves the user series untouched', () => {
    const data = dup.map((p) => ({ ...p }))
    const chart = lineChart([{ name: 's', data }])
    expect(chart.w.config.series[0].data).toEqual(dup)
  })

  it('unique x is unchanged: one slot per point', () => {
    const chart = lineChart([
      {
        name: 's',
        data: [
          { x: 'a', y: 5 },
          { x: 'b', y: 6 },
          { x: 'c', y: 9 },
        ],
      },
    ])
    expect(chart.w.labelData.labels).toEqual([1, 2, 3])
    expect(chart.w.labelData.categoryLabels).toEqual(['a', 'b', 'c'])
  })
})

describe('boxplot outliers on one category (#2706)', () => {
  const cats = ['Jan 2015', 'Jan 2016', 'Jan 2017', 'Jan 2018', 'Jan 2019']

  it('a scatter series repeating a category does not add a column', () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot', width: 600, height: 300 },
      series: [
        {
          name: 'box',
          type: 'boxPlot',
          data: cats.map((x, i) => ({
            x,
            y: [30 + i, 40 + i, 50 + i, 60 + i, 70 + i],
          })),
        },
        {
          name: 'outliers',
          type: 'scatter',
          data: [
            { x: 'Jan 2015', y: 20 },
            { x: 'Jan 2018', y: 90 },
            { x: 'Jan 2018', y: 15 },
            { x: 'Jan 2019', y: 95 },
            { x: 'Jan 2019', y: 10 },
            { x: 'Jan 2019', y: 12 },
          ],
        },
      ],
    })
    const w = chart.w

    // six outliers, but only the five categories of the boxes
    expect(w.labelData.labels).toEqual([1, 2, 3, 4, 5])
    expect(w.seriesData.seriesX[0]).toEqual([1, 2, 3, 4, 5])
    expect(w.labelData.categoryLabels).toEqual(cats)
  })
})
