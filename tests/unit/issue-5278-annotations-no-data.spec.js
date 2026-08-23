import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #1832 / #5278: annotations on a chart whose series are empty.
 *
 * #1832 was fixed with a chart-wide `w.globals.dataPoints` guard in
 * drawAxesAnnotations(), which suppressed every axis annotation (and their three
 * container groups) whenever no series had data. That was too broad in two
 * directions:
 *
 *  - A y-axis annotation is always placeable. An empty chart still lays out a
 *    grid and a y scale (the default 0..6, or the configured yaxis.min/max), so
 *    dropping those was pure collateral damage. That is what #5278 asked for.
 *  - The containers went missing too, so the runtime add*Annotation APIs threw
 *    a TypeError looking up their null parent.
 *
 * What #1832 was actually about is the x domain: nothing bounds it on an empty
 * chart (maxX undefined, xRange NaN, no category labels), so an x-based
 * annotation cannot be placed. Gating is now per annotation on whether its
 * domain resolves (Helpers.hasXDomain), not chart-wide on dataPoints.
 */

const W = 600
const H = 400
// Grid box for a 600x400 line chart with default padding, and the y scale an
// empty chart falls back to. Both are asserted below so the expected pixel
// positions stay tied to something visible rather than being magic numbers.
const GRID_H = 338.82
const NO_DATA_Y_MAX = 6

const render = (opts = {}) =>
  createChartWithOptions({
    chart: {
      type: 'line',
      width: W,
      height: H,
      animations: { enabled: false },
    },
    series: [{ name: 's', data: [] }],
    ...opts,
  })

const q = (chart, sel) => [...chart.w.globals.dom.baseEl.querySelectorAll(sel)]
const attrs = (chart, sel, attr) =>
  q(chart, sel).map((el) => parseFloat(el.getAttribute(attr)))

describe('annotations with no data (#1832 / #5278)', () => {
  describe('the empty chart still has a y scale', () => {
    it('renders the milestone line from the config as reported in #5278', () => {
      const chart = render({
        annotations: {
          position: 'front',
          yaxis: [
            {
              y: 3,
              y2: null,
              borderColor: 'red',
              fillColor: 'red',
              strokeDashArray: 0,
              label: {
                borderColor: 'transparent',
                style: { color: 'red', background: 'transparent' },
                text: 'Annotation text',
                textAnchor: 'start',
                position: 'left',
              },
            },
          ],
        },
      })

      const lines = q(chart, '.apexcharts-yaxis-annotations line')
      expect(lines).toHaveLength(1)
      expect(lines[0].getAttribute('stroke')).toBe('red')
      expect(parseFloat(lines[0].getAttribute('y1'))).toBeCloseTo(GRID_H / 2, 1)

      const label = q(chart, '.apexcharts-yaxis-annotation-label')[0]
      expect(label.textContent).toContain('Annotation text')
      // label.position 'left' anchors the text at the grid's left edge.
      expect(parseFloat(label.getAttribute('x'))).toBe(0)
    })

    it('renders a y-axis annotation at its position on the fallback scale', () => {
      const chart = render({
        annotations: {
          yaxis: [{ y: 3, borderColor: 'red', label: { text: 'Target' } }],
        },
      })

      // The scale the position is derived from: 0..6 over the grid height.
      expect(chart.w.globals.maxY).toBe(NO_DATA_Y_MAX)
      expect(chart.w.layout.gridHeight).toBeCloseTo(GRID_H, 1)

      // y=3 is the midpoint of 0..6, so it lands at half the grid height.
      const ys = attrs(chart, '.apexcharts-yaxis-annotations line', 'y1')
      expect(ys).toHaveLength(1)
      expect(ys[0]).toBeCloseTo(GRID_H / 2, 1)
    })

    it('draws the annotation label too', () => {
      const chart = render({
        annotations: {
          yaxis: [{ y: 3, borderColor: 'red', label: { text: 'Target' } }],
        },
      })

      const labels = q(chart, '.apexcharts-yaxis-annotation-label')
      expect(labels).toHaveLength(1)
      expect(labels[0].textContent).toContain('Target')
    })

    it('honours an explicit yaxis min/max', () => {
      const chart = render({
        yaxis: { min: 0, max: 10 },
        annotations: { yaxis: [{ y: 7, borderColor: 'red' }] },
      })

      // 7 of 0..10 measured down from the top of the grid.
      const ys = attrs(chart, '.apexcharts-yaxis-annotations line', 'y1')
      expect(ys[0]).toBeCloseTo(GRID_H * (1 - 7 / 10), 1)
    })

    it('places a range annotation (y + y2)', () => {
      const chart = render({
        annotations: { yaxis: [{ y: 2, y2: 4, fillColor: 'red' }] },
      })

      const rects = q(chart, '.apexcharts-yaxis-annotations rect')
      expect(rects).toHaveLength(1)
      expect(parseFloat(rects[0].getAttribute('y'))).toBeCloseTo(
        GRID_H * (1 - 4 / NO_DATA_Y_MAX),
        1,
      )
      expect(parseFloat(rects[0].getAttribute('height'))).toBeCloseTo(
        (GRID_H * 2) / NO_DATA_Y_MAX,
        1,
      )
    })
  })

  describe('the empty chart has no x domain (#1832 stays fixed)', () => {
    it('suppresses an x-axis annotation', () => {
      const chart = render({
        annotations: { xaxis: [{ x: 5, borderColor: 'blue' }] },
      })

      expect(q(chart, '.apexcharts-xaxis-annotations line')).toHaveLength(0)
    })

    it('suppresses a point annotation', () => {
      const chart = render({
        annotations: { points: [{ x: 5, y: 3, marker: { size: 5 } }] },
      })

      expect(q(chart, '.apexcharts-point-annotation-marker')).toHaveLength(0)
    })

    it('suppresses an x-axis annotation even when categories are configured', () => {
      // The categories exist but no series maps onto them, so there is still no
      // rendered x label to position against.
      const chart = render({
        xaxis: { categories: ['a', 'b', 'c', 'd'] },
        annotations: { xaxis: [{ x: 'c', borderColor: 'blue' }] },
      })

      expect(q(chart, '.apexcharts-xaxis-annotations line')).toHaveLength(0)
    })

    it('never emits a NaN or Infinity coordinate', () => {
      // The failure mode the dataPoints guard was hiding: NaN passes both clip
      // comparisons in getX1X2 (NaN > w and NaN < 0 are each false), so without
      // a domain check it reaches the renderer as an attribute.
      const chart = render({
        xaxis: { type: 'datetime' },
        annotations: {
          yaxis: [{ y: 3 }],
          xaxis: [
            { x: 1767225600000 },
            { x: 1767225600000, x2: 1769904000000 },
          ],
          points: [{ x: 1767225600000, y: 3, marker: { size: 5 } }],
        },
      })

      const svg = chart.w.globals.dom.baseEl.querySelector('.apexcharts-svg')
      expect(svg.outerHTML).not.toMatch(/NaN|Infinity/)
    })
  })

  describe('an x domain the user supplied is enough', () => {
    it('places an x-axis annotation against an explicit numeric min/max', () => {
      const chart = render({
        xaxis: { type: 'numeric', min: 0, max: 10 },
        annotations: { xaxis: [{ x: 5, borderColor: 'blue' }] },
      })

      const gridWidth = chart.w.layout.gridWidth
      const xs = attrs(chart, '.apexcharts-xaxis-annotations line', 'x1')
      expect(xs).toHaveLength(1)
      expect(xs[0]).toBeCloseTo(gridWidth / 2, 1)
    })

    it('places one against an explicit datetime min/max', () => {
      const min = Date.UTC(2026, 0, 1)
      const max = Date.UTC(2026, 1, 1)
      const at = Date.UTC(2026, 0, 16)
      const chart = render({
        xaxis: { type: 'datetime', min, max },
        annotations: { xaxis: [{ x: at, borderColor: 'b' }] },
      })

      const gridWidth = chart.w.layout.gridWidth
      const xs = attrs(chart, '.apexcharts-xaxis-annotations line', 'x1')
      expect(xs).toHaveLength(1)
      // 15 of the window's 31 days, not the halfway pixel.
      expect(xs[0]).toBeCloseTo((gridWidth * (at - min)) / (max - min), 1)
    })

    it('places a point annotation once x resolves', () => {
      const chart = render({
        xaxis: { type: 'numeric', min: 0, max: 10 },
        annotations: { points: [{ x: 5, y: 3, marker: { size: 5 } }] },
      })

      const pts = q(chart, '.apexcharts-point-annotation-marker')
      expect(pts).toHaveLength(1)
      expect(parseFloat(pts[0].getAttribute('cx'))).toBeCloseTo(
        chart.w.layout.gridWidth / 2,
        1,
      )
      expect(parseFloat(pts[0].getAttribute('cy'))).toBeCloseTo(GRID_H / 2, 1)
    })
  })

  describe('positions that need no domain at all', () => {
    it('places pixel-valued annotations', () => {
      const chart = render({
        annotations: {
          yaxis: [{ y: '100px', borderColor: 'red' }],
          xaxis: [{ x: '150px', borderColor: 'blue' }],
        },
      })

      expect(attrs(chart, '.apexcharts-yaxis-annotations line', 'y1')).toEqual([
        100,
      ])
      expect(attrs(chart, '.apexcharts-xaxis-annotations line', 'x1')).toEqual([
        150,
      ])
    })

    it('pins an x:null marker annotation to the grid edge', () => {
      const chart = render({
        annotations: { points: [{ x: null, y: 3, marker: { size: 5 } }] },
      })

      const pts = q(chart, '.apexcharts-point-annotation-marker')
      expect(pts).toHaveLength(1)
      expect(parseFloat(pts[0].getAttribute('cx'))).toBeCloseTo(
        chart.w.layout.gridWidth,
        1,
      )
      expect(parseFloat(pts[0].getAttribute('cy'))).toBeCloseTo(GRID_H / 2, 1)
    })
  })

  describe('the runtime API no longer throws on an empty chart', () => {
    it('builds all three container groups', () => {
      const chart = render()

      expect(q(chart, '.apexcharts-xaxis-annotations')).toHaveLength(1)
      expect(q(chart, '.apexcharts-yaxis-annotations')).toHaveLength(1)
      expect(q(chart, '.apexcharts-point-annotations')).toHaveLength(1)
    })

    it('addYaxisAnnotation places a line instead of throwing', () => {
      const chart = render()

      expect(() => chart.addYaxisAnnotation({ y: 3 })).not.toThrow()
      const ys = attrs(chart, '.apexcharts-yaxis-annotations line', 'y1')
      expect(ys).toHaveLength(1)
      expect(ys[0]).toBeCloseTo(GRID_H / 2, 1)
    })

    it('addXaxisAnnotation is a no-op rather than a throw', () => {
      const chart = render()

      expect(() => chart.addXaxisAnnotation({ x: 5 })).not.toThrow()
      expect(q(chart, '.apexcharts-xaxis-annotations line')).toHaveLength(0)
    })

    it('addPointAnnotation is a no-op rather than a throw', () => {
      const chart = render()

      expect(() =>
        chart.addPointAnnotation({ x: 5, y: 3, marker: { size: 5 } }),
      ).not.toThrow()
      expect(q(chart, '.apexcharts-point-annotation-marker')).toHaveLength(0)
    })

    it('holds for a chart with no series entries at all', () => {
      const chart = render({ series: [] })

      expect(() => chart.addYaxisAnnotation({ y: 3 })).not.toThrow()
      expect(
        attrs(chart, '.apexcharts-yaxis-annotations line', 'y1')[0],
      ).toBeCloseTo(GRID_H / 2, 1)
    })
  })

  describe('horizontal bars read the swapped axes', () => {
    const hbar = (opts = {}) =>
      createChartWithOptions({
        chart: {
          type: 'bar',
          width: W,
          height: H,
          animations: { enabled: false },
        },
        plotOptions: { bar: { horizontal: true } },
        series: [{ name: 's', data: [] }],
        ...opts,
      })

    it('places an x-axis annotation, which maps through the y scale', () => {
      // minX/xRange are ±MAX_VALUE / Infinity on a horizontal bar even with
      // data, so the domain check has to consult the y scale here instead.
      const chart = hbar({
        annotations: { xaxis: [{ x: 3, borderColor: 'blue' }] },
      })

      const xs = attrs(chart, '.apexcharts-xaxis-annotations line', 'x1')
      expect(xs).toHaveLength(1)
      expect(xs[0]).toBeCloseTo(chart.w.layout.gridWidth / 2, 1)
    })

    it('suppresses a y-axis annotation naming a category that does not exist', () => {
      const chart = hbar({
        annotations: { yaxis: [{ y: 'Product A', borderColor: 'red' }] },
      })

      expect(q(chart, '.apexcharts-yaxis-annotations line')).toHaveLength(0)
    })

    it('places a y-axis annotation on a configured category', () => {
      // The categories came from config rather than the data, so they position
      // fine even with nothing plotted.
      const withData = hbar({
        series: [{ name: 's', data: [5, 6, 7] }],
        xaxis: { categories: ['a', 'b', 'c'] },
        annotations: { yaxis: [{ y: 'b', borderColor: 'red' }] },
      })
      const empty = hbar({
        xaxis: { categories: ['a', 'b', 'c'] },
        annotations: { yaxis: [{ y: 'b', borderColor: 'red' }] },
      })

      const ys = attrs(empty, '.apexcharts-yaxis-annotations line', 'y1')
      expect(ys).toHaveLength(1)
      expect(ys[0]).toBeCloseTo(
        attrs(withData, '.apexcharts-yaxis-annotations line', 'y1')[0],
        1,
      )
    })
  })

  describe('charts with data are unaffected', () => {
    it('keeps a single-datum numeric chart placing all three families', () => {
      const chart = render({
        series: [{ data: [{ x: 2, y: 3 }] }],
        xaxis: { type: 'numeric' },
        annotations: {
          yaxis: [{ y: 3 }],
          xaxis: [{ x: 2 }],
          points: [{ x: 2, y: 3, marker: { size: 5 } }],
        },
      })

      expect(q(chart, '.apexcharts-yaxis-annotations line')).toHaveLength(1)
      expect(q(chart, '.apexcharts-xaxis-annotations line')).toHaveLength(1)
      expect(q(chart, '.apexcharts-point-annotation-marker')).toHaveLength(1)
    })

    it('keeps a category chart placing an annotation on a category', () => {
      const chart = render({
        series: [{ data: [1, 2, 3, 4] }],
        xaxis: { categories: ['a', 'b', 'c', 'd'] },
        annotations: { xaxis: [{ x: 'c', borderColor: 'blue' }] },
      })

      expect(q(chart, '.apexcharts-xaxis-annotations line')).toHaveLength(1)
    })

    it('still drops an annotation naming an unknown category', () => {
      const chart = render({
        series: [{ data: [1, 2, 3, 4] }],
        xaxis: { categories: ['a', 'b', 'c', 'd'] },
        annotations: { xaxis: [{ x: 'ZZZ', borderColor: 'blue' }] },
      })

      expect(q(chart, '.apexcharts-xaxis-annotations line')).toHaveLength(0)
    })
  })
})
