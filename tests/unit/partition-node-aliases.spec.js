import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/entries/icicle.js'
import '../../src/entries/sunburst.js'

// A hierarchy node may be written `{ name, value }` (the typed aliases of
// `x` and `y`), which the tree resolver reads. The parse that runs before it
// has to accept the same shapes, or the chart comes back with no series and
// draws nothing.

const chart = (type, data) =>
  createChartWithOptions({
    chart: { type, width: 500, height: 400 },
    series: [{ data }],
  })

describe('partition nodes written with name / value', () => {
  it.each(['icicle', 'sunburst'])('%s: { name, value } roots', (type) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const c = chart(type, [
        { name: 'A', value: 10 },
        { name: 'B', value: 20 },
      ])
      expect(c.w.seriesData.series).toEqual([10, 20])
      expect(c.w.seriesData.seriesNames).toEqual(['A', 'B'])
      expect(
        warn.mock.calls.some((args) => String(args[0]).includes('pie chart')),
      ).toBe(false)
    } finally {
      warn.mockRestore()
    }
  })

  it('a branch totals children written with value', () => {
    const c = chart('sunburst', [
      {
        name: 'A',
        children: [
          { name: 'a1', value: 3 },
          { name: 'a2', value: 4 },
        ],
      },
      { x: 'B', y: 5 },
    ])
    expect(c.w.seriesData.series).toEqual([7, 5])
    expect(c.el.querySelectorAll('.apexcharts-sunburst-arc').length).toBeGreaterThan(0)
  })

  it('a negative leaf does not pull a branch total below 0', () => {
    const c = chart('icicle', [
      { x: 'A', children: [{ x: 'a1', y: 3 }, { x: 'a2', y: -10 }] },
    ])
    expect(c.w.seriesData.series).toEqual([3])
  })
})
