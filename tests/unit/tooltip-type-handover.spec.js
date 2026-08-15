/**
 * A chart type installs its own `tooltip.custom`, and that formatter reads
 * globals only that type fills. Type defaults are applied once, by Config.init
 * on the initial render, so `updateOptions({ chart: { type } })` used to leave
 * the OUTGOING type's formatter behind: a box plot that became a violin kept
 * asking for the five-number summary nobody computes for a violin and threw on
 * every hover, which killed the tooltip outright and stranded the crosshair on
 * the first category. The reverse was quieter and no better, a box plot
 * captioned with the violin's density range.
 *
 * The handover is asserted here on the config, and end to end (the throw, and
 * the caption a reader actually gets) in
 * tests/interaction/specs/tooltip-type-change.spec.js.
 */

import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const TIERS = [
  { x: 'Express', points: [1.2, 1.4, 1.5, 1.6, 1.8, 1.3, 1.7, 1.5] },
  { x: 'Standard', points: [2.4, 2.6, 2.8, 4.2, 4.4, 4.6, 2.5, 4.3] },
  { x: 'Economy', points: [4.2, 4.6, 5.0, 5.4, 6.0, 7.2, 9.0, 4.8] },
]
const SUMMARY = [{ name: 'Days', data: TIERS }]

/** The caption a chart of `type` would render for its first mark, rendered. */
const captionFor = (chart, type) => {
  const built = createChartWithOptions({
    chart: { type },
    series: SUMMARY,
    legend: { show: false },
  })
  const expected = built.w.config.tooltip.custom({
    seriesIndex: 0,
    dataPointIndex: 0,
    w: built.w,
  })
  built.destroy()
  return expected
}

describe('a type-owned tooltip formatter hands over on a type change', () => {
  it('a box plot that becomes a violin captions like a violin', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot' },
      series: SUMMARY,
      legend: { show: false },
    })
    const asBox = chart.w.config.tooltip.custom

    await chart.updateOptions({ chart: { type: 'violin' }, series: SUMMARY })

    expect(chart.w.config.tooltip.custom).not.toBe(asBox)
    // Not just "some other function": the same caption a violin renders.
    expect(
      chart.w.config.tooltip.custom({
        seriesIndex: 0,
        dataPointIndex: 0,
        w: chart.w,
      }),
    ).toContain('Observations')
  })

  it('a violin that becomes a box plot captions like a box plot', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'violin' },
      series: SUMMARY,
      legend: { show: false },
    })

    await chart.updateOptions({ chart: { type: 'boxPlot' }, series: SUMMARY })

    const caption = chart.w.config.tooltip.custom({
      seriesIndex: 0,
      dataPointIndex: 0,
      w: chart.w,
    })
    expect(caption).toContain('Median')
    expect(caption).not.toContain('Observations')
    expect(caption).toBe(captionFor(chart, 'boxPlot'))
  })

  it('a type with no formatter of its own is left with none', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot' },
      series: SUMMARY,
      legend: { show: false },
    })
    expect(typeof chart.w.config.tooltip.custom).toBe('function')

    await chart.updateOptions({
      chart: { type: 'bar' },
      series: [{ name: 'Days', data: [1, 2, 3] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })

    // A bar reads its own values through the ordinary tooltip path; keeping the
    // box formatter here is what threw.
    expect(chart.w.config.tooltip.custom).toBeUndefined()
  })

  it("GUARD a user's own formatter survives any type change", async () => {
    const mine = () => '<div>mine</div>'
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot' },
      series: SUMMARY,
      tooltip: { custom: mine },
      legend: { show: false },
    })
    expect(chart.w.config.tooltip.custom).toBe(mine)

    await chart.updateOptions({ chart: { type: 'violin' }, series: SUMMARY })

    // Only formatters Defaults installed carry the mark that allows a handover.
    expect(chart.w.config.tooltip.custom).toBe(mine)
  })

  it('GUARD an update that does not change the type keeps the formatter', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot' },
      series: SUMMARY,
      legend: { show: false },
    })
    const asBox = chart.w.config.tooltip.custom

    await chart.updateOptions({ legend: { show: true } })

    expect(chart.w.config.tooltip.custom).toBe(asBox)
  })
})
