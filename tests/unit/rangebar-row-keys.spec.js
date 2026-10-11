import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Timeline rows are grouped by their x. A multi-line (array) x names the same
// row as its joined string, and merging the rows of every series into the
// axis labels must not grow the first series' x array.

const timeline = (data, bar = {}) =>
  createChartWithOptions({
    chart: { type: 'rangeBar', width: 600, height: 300 },
    plotOptions: { bar: { horizontal: true, ...bar } },
    series: data,
  })

const barBoxes = (chart) =>
  [...chart.el.querySelectorAll('.apexcharts-rangebar-area')].map((p) => {
    const nums = p
      .getAttribute('d')
      .match(/-?\d+(\.\d+)?/g)
      .map(Number)
    const ys = nums.filter((_, k) => k % 2 === 1)
    return [Math.min(...ys), Math.max(...ys)]
  })

describe('rangeBar row keys', () => {
  it('separates overlaps on an array (multi-line) row like on a string row', () => {
    const str = timeline(
      [{ data: [{ x: 'Row A', y: [0, 30] }, { x: 'Row A', y: [10, 40] }] }],
      { rangeBarOverlap: false },
    )
    const strBoxes = barBoxes(str)
    const arr = timeline(
      [
        {
          data: [
            { x: ['Row', 'A'], y: [0, 30] },
            { x: ['Row', 'A'], y: [10, 40] },
          ],
        },
      ],
      { rangeBarOverlap: false },
    )
    const arrBoxes = barBoxes(arr)
    expect(arrBoxes.length).toBe(2)
    // side by side, not drawn on top of each other, as on the string row
    expect(strBoxes[0][1]).toBeLessThanOrEqual(strBoxes[1][0])
    expect(arrBoxes[0][1]).toBeLessThanOrEqual(arrBoxes[1][0])
    expect(arr.w.labelData.labels).toEqual([['Row', 'A']])
  })

  it("does not grow the first series' x past its points", () => {
    const chart = timeline([
      { name: 'A', data: [{ x: 'Code', y: [1, 4] }, { x: 'Test', y: [4, 6] }] },
      { name: 'B', data: [{ x: 'Deploy', y: [6, 8] }, { x: 'Code', y: [2, 3] }] },
    ])
    const w = chart.w
    expect(w.seriesData.seriesX[0]).toEqual(['Code', 'Test'])
    expect(w.labelData.labels).toEqual(['Code', 'Test', 'Deploy'])
  })

  it('merges array rows from a second series once', () => {
    const chart = timeline([
      { name: 'A', data: [{ x: ['Code', 'x'], y: [1, 4] }] },
      { name: 'B', data: [{ x: ['Code', 'x'], y: [2, 3] }, { x: ['Ship', 'y'], y: [5, 6] }] },
    ])
    expect(chart.w.labelData.labels).toEqual([
      ['Code', 'x'],
      ['Ship', 'y'],
    ])
    expect(chart.w.seriesData.seriesX[0].length).toBe(1)
  })
})
