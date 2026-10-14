import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Two click (data point selection) defects users saw:
// - with dropShadow.enabledOnSeries and single select, clicking a bar of
//   another series stripped the shadow from every bar of the first series,
//   because every series node was reset with the CLICKED series' index;
// - with states.active.filter.type 'none', clicking a bar dropped its
//   hover highlight while the pointer was still on it.

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

const bars = (c, i) =>
  Array.from(
    c.w.dom.baseEl.querySelectorAll(`path.apexcharts-bar-area[index="${i}"]`),
  )

describe('data point selection filters', () => {
  it('keeps per-series drop shadows when single select moves series', () => {
    chart = createChartWithOptions({
      chart: {
        type: 'bar',
        width: 500,
        height: 300,
        dropShadow: { enabled: true, enabledOnSeries: [0] },
      },
      states: { active: { allowMultipleDataPointsSelection: false } },
      series: [
        { name: 'a', data: [3, 4, 5] },
        { name: 'b', data: [2, 5, 1] },
      ],
    })
    const s0 = bars(chart, 0)
    const s1 = bars(chart, 1)
    expect(s0.every((p) => p.hasAttribute('filter'))).toBe(true)
    expect(s1.some((p) => p.hasAttribute('filter'))).toBe(false)

    const g = chart.ctx.graphics
    g.pathMouseDown(s0[0].instance, null)
    g.pathMouseDown(s1[1].instance, null)

    expect(s0[0].getAttribute('selected')).toBe('false')
    expect(s1[1].getAttribute('selected')).toBe('true')
    expect(chart.w.interact.selectedDataPoints[0]).toBeUndefined()
    expect(chart.w.interact.selectedDataPoints[1]).toEqual([1])
    // series 0 keeps its shadow, series 1 never gains one it was not given
    expect(s0.every((p) => p.hasAttribute('filter'))).toBe(true)
    expect(s1[0].hasAttribute('filter')).toBe(false)
    expect(s1[2].hasAttribute('filter')).toBe(false)
  })

  it.each(['pie', 'polarArea'])(
    'keeps per-slice drop shadows when single select moves (%s)',
    (type) => {
      chart = createChartWithOptions({
        chart: {
          type,
          width: 400,
          height: 300,
          dropShadow: { enabled: true, enabledOnSeries: [1] },
        },
        states: { active: { allowMultipleDataPointsSelection: false } },
        series: [3, 4, 5],
      })
      chart.w.interact.isTouchDevice = false
      const slices = Array.from(
        chart.w.dom.baseEl.querySelectorAll('path.apexcharts-pie-area'),
      )
      const shadows = () => slices.map((p) => p.hasAttribute('filter'))
      expect(shadows()).toEqual([false, true, false])

      const g = chart.ctx.graphics
      g.pathMouseDown(slices[1].instance, null)
      g.pathMouseDown(slices[2].instance, null)
      expect(slices[1].getAttribute('selected')).toBe('false')
      expect(shadows().slice(0, 2)).toEqual([false, true])

      // deselecting the clicked slice restores its own shadow too
      g.pathMouseDown(slices[2].instance, null)
      g.pathMouseDown(slices[1].instance, null)
      g.pathMouseDown(slices[1].instance, null)
      expect(slices[1].getAttribute('selected')).toBe('false')
      expect(shadows()[1]).toBe(true)

      // hovering the slice (no outline band) keeps its shadow on leave
      chart.w.config.plotOptions.pie.hoverOutline.show = false
      g.pathMouseEnter(slices[1].instance, null)
      g.pathMouseLeave(slices[1].instance, null)
      expect(shadows()[1]).toBe(true)
    },
  )

  it("keeps the hover filter on click when active.filter.type is 'none'", () => {
    chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300 },
      states: {
        hover: { filter: { type: 'lighten', value: 0.15 } },
        active: { filter: { type: 'none' } },
      },
      series: [{ name: 'a', data: [3, 4, 5] }],
    })
    chart.w.interact.isTouchDevice = false
    const path = bars(chart, 0)[0]
    const g = chart.ctx.graphics
    g.pathMouseEnter(path.instance, null)
    expect(path.hasAttribute('filter')).toBe(true)
    g.pathMouseDown(path.instance, null)
    expect(path.getAttribute('selected')).toBe('true')
    expect(path.hasAttribute('filter')).toBe(true)
  })
})
