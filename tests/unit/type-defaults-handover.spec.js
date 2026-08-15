/**
 * What a chart type chooses for itself, and what happens to those choices when
 * `updateOptions({ chart: { type } })` makes it a different type.
 *
 * Type defaults are applied once, by Config.init on the initial render. The
 * update path builds Config directly and skips init, so before this every leaf
 * the outgoing type had chosen outlived that type. It showed loudly one way
 * round (a box plot that became a violin kept the five-number tooltip formatter
 * and threw on a violin's empty candle globals, every hover) and silently the
 * other (a bar that became a box plot never acquired that formatter at all).
 *
 * The line the fix draws is between what a chart DOES and how it is PAINTED,
 * and both sides of that line are pinned here: the behavioural leaves hand
 * over, and the painted ones deliberately do not, so a morph in flight is not
 * also restyled. See TYPE_OWNED_PATHS in src/modules/settings/Defaults.js.
 */

import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const TIERS = [
  { x: 'Express', points: [1.2, 1.4, 1.5, 1.6, 1.8, 1.3, 1.7, 1.5] },
  { x: 'Standard', points: [2.4, 2.6, 2.8, 4.2, 4.4, 4.6, 2.5, 4.3] },
  { x: 'Economy', points: [4.2, 4.6, 5.0, 5.4, 6.0, 7.2, 9.0, 4.8] },
]
const SUMMARY = [{ name: 'Days', data: TIERS }]
const BARS = [{ name: 'Orders', data: [55, 44, 41] }]
const CATS = { categories: ['a', 'b', 'c'] }

/** Render `type`, then become `to`. Returns the chart. */
const morph = async (type, to, extra = {}, update = {}) => {
  const chart = createChartWithOptions({
    chart: { type },
    series: type === 'boxPlot' || type === 'violin' ? SUMMARY : BARS,
    xaxis: CATS,
    legend: { show: false },
    ...extra,
  })
  await chart.updateOptions({
    chart: { type: to },
    series: to === 'boxPlot' || to === 'violin' ? SUMMARY : BARS,
    ...update,
  })
  return chart
}

/** The caption the chart's current formatter renders for its first mark. */
const caption = (chart) =>
  chart.w.config.tooltip.custom({
    seriesIndex: 0,
    dataPointIndex: 0,
    w: chart.w,
  })

describe('a type-owned formatter follows the type', () => {
  it('a box plot that becomes a violin captions like a violin', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot' },
      series: SUMMARY,
      legend: { show: false },
    })
    const asBox = chart.w.config.tooltip.custom

    await chart.updateOptions({ chart: { type: 'violin' }, series: SUMMARY })

    expect(chart.w.config.tooltip.custom).not.toBe(asBox)
    expect(caption(chart)).toContain('Observations')
  })

  it('a violin that becomes a box plot captions like a box plot', async () => {
    const chart = await morph('violin', 'boxPlot')
    expect(caption(chart)).toContain('Median')
    expect(caption(chart)).not.toContain('Observations')
  })

  it('a bar that becomes a box plot ACQUIRES the five-number caption', async () => {
    // The other direction of the same defect, and the quiet one: the bar owned
    // no formatter, so there was nothing to hand over and the box plot was left
    // with the plain series tooltip instead of its summary.
    const chart = await morph('bar', 'boxPlot')
    expect(typeof chart.w.config.tooltip.custom).toBe('function')
    expect(caption(chart)).toContain('Median')
  })

  it('a box plot that becomes a bar is left with no formatter', async () => {
    const chart = await morph('boxPlot', 'bar')
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

    // Only the built-ins carry the mark that allows a handover.
    expect(chart.w.config.tooltip.custom).toBe(mine)
  })

  it('GUARD an update that does not change the type changes nothing', async () => {
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

describe('the behavioural leaves hand over', () => {
  it('a violin drops the box plot markers it has no outliers for', async () => {
    const chart = await morph('boxPlot', 'violin')
    // boxPlot asks for 7 (its outliers are hit targets); a violin asks for
    // nothing, which means the library default of 0, not the box plot's 7.
    expect(chart.w.config.markers.size).toBe(0)
  })

  it('a box plot regains the hover and select feedback a violin turns off', async () => {
    const chart = await morph('violin', 'boxPlot')
    // violin sets states.active.filter.type 'none' because it paints its own.
    expect(chart.w.config.states.active.filter.type).toBe('darken')
  })

  it('a violin cannot be range-zoomed, and says so after the change', async () => {
    const chart = await morph('bar', 'violin')
    expect(chart.w.config.chart.zoom.enabled).toBe(false)
  })

  it('a bar regains the zoom a violin had turned off', async () => {
    const chart = await morph('violin', 'bar')
    expect(chart.w.config.chart.zoom.enabled).toBe(true)
  })

  it('a bar that becomes a box plot stops writing values on the marks', async () => {
    const chart = await morph('bar', 'boxPlot')
    expect(chart.w.config.dataLabels.enabled).toBe(false)
  })
})

describe('the painted leaves deliberately do not', () => {
  it('fill, stroke and legend placement survive a type change', async () => {
    const chart = await morph('bar', 'donut')
    // A donut would have chosen 1, 2 and 'right' for these. Keeping the bar's
    // is the point: a morph re-reads the data without restyling mid-flight.
    expect(chart.w.config.fill.opacity).toBe(0.85)
    expect(chart.w.config.stroke.width).toBe(0)
    expect(chart.w.config.legend.position).toBe('bottom')
  })
})

describe('what the user set is never re-chosen', () => {
  it('a size set at construction survives the type change', async () => {
    const chart = await morph('boxPlot', 'violin', { markers: { size: 12 } })
    expect(chart.w.config.markers.size).toBe(12)
  })

  it('a size set in the SAME update wins over the incoming type', async () => {
    // Equal-to-the-outgoing-default would otherwise read as untouched, so the
    // update payload is consulted directly rather than only by value.
    const chart = await morph('boxPlot', 'violin', {}, { markers: { size: 7 } })
    expect(chart.w.config.markers.size).toBe(7)
  })

  it('an explicit zoom setting is not overridden by the incoming type', async () => {
    const chart = await morph('bar', 'violin', {
      chart: { zoom: { enabled: false } },
    })
    await chart.updateOptions({
      chart: { type: 'bar', zoom: { enabled: false } },
      series: BARS,
    })
    expect(chart.w.config.chart.zoom.enabled).toBe(false)
  })
})

describe('GUARD the initial render still picks its own defaults', () => {
  // Config.init now shares its type pick with the update path, so this pins
  // that the refactor did not move what a fresh chart of each type gets.
  const cases = [
    ['boxPlot', SUMMARY, (w) => expect(w.config.markers.size).toBe(7)],
    ['violin', SUMMARY, (w) => expect(w.config.chart.zoom.enabled).toBe(false)],
    ['bar', BARS, (w) => expect(w.config.tooltip.intersect).toBe(true)],
    ['line', BARS, (w) => expect(w.config.stroke.width).toBe(5)],
    ['pie', [55, 44], (w) => expect(w.config.legend.position).toBe('right')],
  ]

  it.each(cases)('a fresh %s', (type, series, assert) => {
    const chart = createChartWithOptions({
      chart: { type },
      series,
      xaxis: CATS,
      labels: ['a', 'b'],
    })
    assert(chart.w)
  })

  it('a funnel still gets the funnel defaults through the shared pick', () => {
    const chart = createChartWithOptions({
      chart: { type: 'funnel' },
      series: [{ name: 'F', data: [1380, 1100, 990] }],
      xaxis: CATS,
    })
    expect(chart.w.config.plotOptions.bar.isFunnel).toBe(true)
    expect(chart.w.config.plotOptions.bar.horizontal).toBe(true)
  })
})
