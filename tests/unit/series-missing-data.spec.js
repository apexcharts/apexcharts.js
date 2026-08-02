import { createChartWithOptions } from './utils/utils.js'

// A series object missing its `data` property used to abort parsing of ALL
// remaining series (a bare `return` in parseDataAxisCharts), desyncing the
// parsed arrays from seriesNames. It should instead be treated as an empty
// series so the rest still parse and stay index-aligned.
describe('parseDataAxisCharts: a series missing its data property', () => {
  it('treats it as empty and keeps the remaining series aligned', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B' }, // no data property
        { name: 'C', data: [7, 8, 9] },
      ],
      xaxis: { categories: ['x', 'y', 'z'] },
    })
    const w = chart.w

    // All three parsed and aligned with their names.
    expect(w.seriesData.series.length).toBe(3)
    expect(w.seriesData.seriesNames.length).toBe(3)
    // The missing-data series is empty (not a shifted copy of C).
    expect(w.seriesData.series[1]).toEqual([])
    // C's data landed in slot 2, not shifted into slot 1.
    expect(w.seriesData.series[2]).toEqual([7, 8, 9])

    errSpy.mockRestore()
  })

  it('does not mutate the caller-passed series object (replaces, not mutates)', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const bObj = { name: 'B' } // the user's original object, missing data
    createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }, bObj],
      xaxis: { categories: ['x', 'y', 'z'] },
    })
    // The user's own object is left untouched (the fix spreads into a NEW
    // object rather than injecting data: [] onto theirs).
    expect(Object.prototype.hasOwnProperty.call(bObj, 'data')).toBe(false)
    errSpy.mockRestore()
  })
})
