import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * markers.largeDatasetThreshold builds the batched path with the same SVG
 * builder the per-point path uses, so it has to work outside a real browser
 * (jsdom here, and the SSR renderer by extension) with no layout or
 * requestAnimationFrame involved. The interaction spec covers the browser
 * behaviour -- hover, keyboard, pointer-events; this covers the shape and the
 * style fidelity, which is what SSR serializes.
 */

const POINTS = 300

/** @param {object} [markers] @param {object} [rest] */
function render(markers = {}, rest = {}) {
  return createChartWithOptions({
    chart: { type: 'line', width: 800, height: 350 },
    series: [
      {
        name: 'a',
        data: Array.from({ length: POINTS }, (_, i) =>
          Math.round(50 + 40 * Math.sin(i / 9)),
        ),
      },
    ],
    dataLabels: { enabled: false },
    markers: { size: 4, largeDatasetThreshold: 100, ...markers },
    ...rest,
  })
}

const batchEl = () => document.querySelector('.apexcharts-marker-batch')
const perPointCount = () =>
  document.querySelectorAll('.apexcharts-series-markers-wrap .apexcharts-marker')
    .length

describe('Marker batching', () => {
  it('emits one path with a subpath per point and no marker nodes', () => {
    const chart = render()

    expect(chart.w.globals.markers.batched).toBe(true)
    const el = batchEl()
    expect(el).not.toBeNull()
    expect((el.getAttribute('d').match(/M/g) || []).length).toBe(POINTS)
    // only the tooltip's own hover dot survives
    expect(perPointCount()).toBe(1)
  })

  it('carries the marker style the per-point elements would have carried', () => {
    render({ strokeColors: '#123456', strokeWidth: 3, fillOpacity: 0.6 })

    const el = batchEl()
    expect(el.getAttribute('stroke')).toBe('#123456')
    expect(el.getAttribute('stroke-width')).toBe('3')
    expect(el.getAttribute('fill-opacity')).toBe('0.6')
    // the shape is recorded for the tooltip, which rebuilds a hover dot from it
    expect(el.getAttribute('shape')).toBe('circle')
    expect(el.getAttribute('default-marker-size')).toBe('4')
  })

  it('feeds the coord cache the tooltip positions off', () => {
    // there are no cx/cy nodes to read, so this cache is the only source
    const chart = render()

    const pts = chart.w.globals.pointsArray[0]
    expect(pts).toHaveLength(POINTS)
    pts.forEach(([x, y]) => {
      expect(Number.isFinite(x)).toBe(true)
      expect(Number.isFinite(y)).toBe(true)
    })
  })

  it('stays off at the default threshold', () => {
    const chart = render({ largeDatasetThreshold: undefined })

    expect(chart.w.globals.markers.batched).toBe(false)
    expect(batchEl()).toBeNull()
    expect(perPointCount()).toBe(POINTS)
  })

  it('declines a series at or below the threshold', () => {
    const chart = render({ largeDatasetThreshold: POINTS })

    expect(chart.w.globals.markers.batched).toBe(false)
    expect(perPointCount()).toBe(POINTS)
  })

  it('declines when the markers are hit-tested', () => {
    const chart = render({}, { tooltip: { intersect: true, shared: false } })

    expect(chart.w.globals.markers.batched).toBe(false)
    expect(perPointCount()).toBe(POINTS)
  })

  it('skips points with no value rather than drawing them', () => {
    const withNulls = createChartWithOptions({
      chart: { type: 'line', width: 800, height: 350 },
      series: [
        {
          name: 'a',
          data: Array.from({ length: POINTS }, (_, i) =>
            i % 3 === 0 ? null : Math.round(50 + 40 * Math.sin(i / 9)),
          ),
        },
      ],
      dataLabels: { enabled: false },
      markers: { size: 4, largeDatasetThreshold: 100 },
    })

    expect(withNulls.w.globals.markers.batched).toBe(true)
    const subpaths = (batchEl().getAttribute('d').match(/M/g) || []).length
    // a third of the points are null, so a third fewer subpaths -- and never
    // a NaN, which is what an unguarded coordinate would produce
    expect(subpaths).toBeGreaterThan(POINTS / 2)
    expect(subpaths).toBeLessThan(POINTS)
    expect(batchEl().getAttribute('d')).not.toMatch(/NaN|undefined/)
  })

  it('draws stroke-shaped markers as strokes, as drawMarker does', () => {
    // drawMarker paints line/plus/cross with the fill colour as the stroke,
    // since those shapes have no interior; the batch has to do the same or a
    // batched cross would come out invisible
    render({ shape: 'cross', colors: ['#ff8800'] })

    expect(batchEl().getAttribute('stroke')).toBe('#ff8800')
  })
})
