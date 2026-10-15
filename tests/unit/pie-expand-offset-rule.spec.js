// A pie with `plotOptions.pie.expandOffset: Infinity` never slid a clicked
// slice out (Pie drops an offset it cannot draw), yet the states.active
// darken was still suppressed as if the slide owned the click, so the slice
// gave no feedback at all. Pie and Filters must read one expand-offset rule.
import Filters from '../../src/modules/Filters.js'
import Graphics from '../../src/modules/Graphics.js'
import { createChartWithOptions } from './utils/utils.js'

function pie(expandOffset) {
  return createChartWithOptions({
    chart: { type: 'pie' },
    series: [30, 40, 20, 10],
    labels: ['A', 'B', 'C', 'D'],
    plotOptions: { pie: { expandOffset } },
    dataLabels: { enabled: false },
  })
}

function clickSlice(chart, j) {
  const path = chart.w.dom.Paper.findOne(`.apexcharts-pie-slice-${j}`)
  const spy = vi.spyOn(Filters.prototype, 'applyFilter')
  new Graphics(chart.w, chart.ctx).pathMouseDown(path, null)
  const types = spy.mock.calls.map((c) => c[2])
  spy.mockRestore()
  return types
}

describe('pie expand offset: one rule for the slide and the active state', () => {
  it('darkens a clicked slice when the offset cannot be drawn', () => {
    const chart = pie(Infinity)
    expect(chart.ctx.pie.getExpandOffset()).toBe(0)
    expect(clickSlice(chart, 1)).toContain('darken')
  })

  it('leaves a sliding slice undarkened', () => {
    const chart = pie(20)
    expect(chart.ctx.pie.getExpandOffset()).toBe(20)
    expect(clickSlice(chart, 1)).not.toContain('darken')
  })

  it.each([Infinity, NaN, -5, 0, '20', 20])(
    'agrees with the slide for expandOffset %s',
    (offset) => {
      const chart = pie(offset)
      expect(Filters.sliceOffsetOwnsActiveState(chart.w)).toBe(
        chart.ctx.pie.getExpandOffset() > 0,
      )
    },
  )
})
