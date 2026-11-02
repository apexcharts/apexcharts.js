import { describe, it, expect } from 'vitest'
import '../../src/features/dumbbell'
import Annotations from '../../src/modules/annotations/Annotations.js'
import Helpers from '../../src/modules/annotations/Helpers.js'
import { createChartWithOptions } from './utils/utils.js'

// #5078: a point annotation on a horizontal bar / dumbbell row sat on the
// category label's text baseline (or, with the labels hidden, on a fallback
// that drifted a pixel per row) and, when rangeBarGroupRows put every series
// on that same centre, seriesIndex 0 shifted it off the row again.

const q = (chart, sel) => chart.w.dom.baseEl.querySelector(sel)
const qa = (chart, sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]

/** Vertical centre of a bar path. Commands alternate x, y. */
const pathY = (el) => {
  const nums = (el.getAttribute('d').match(/-?\d+(\.\d+)?/g) || []).map(Number)
  const ys = nums.filter((_, k) => k % 2 === 1)
  return (Math.min(...ys) + Math.max(...ys)) / 2
}

const markerY = (el) => {
  const cy = el.getAttribute('cy')
  if (cy !== null) return parseFloat(cy)
  return pathY(el)
}

const seriesBarY = (chart, name, j = 0) => {
  const g = q(chart, `.apexcharts-series[seriesName='${name}']`)
  const bars = g.querySelectorAll(
    '.apexcharts-bar-area, .apexcharts-rangebar-area',
  )
  return pathY(bars[j])
}

const rowCentre = (chart, index, count) =>
  (index + 0.5) * (chart.w.layout.gridHeight / count)

describe('horizontal bar annotations sit on the row (#5078)', () => {
  const cats = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  const horizontalBar = (showLabels, extra = {}) =>
    createChartWithOptions({
      chart: { type: 'bar', width: 640, height: 480 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'S', data: cats.map((_, i) => (i + 1) * 10) }],
      xaxis: { categories: cats },
      yaxis: { labels: { show: showLabels } },
      annotations: {
        points: cats.map((y) => ({
          x: 40,
          y,
          marker: { size: 4 },
        })),
      },
      ...extra,
    })

  const expectMarkersOnBars = (chart) => {
    const markers = qa(chart, '.apexcharts-point-annotation-marker')
    expect(markers).toHaveLength(cats.length)
    markers.forEach((marker, i) => {
      const y = markerY(marker)
      expect(y).toBeCloseTo(seriesBarY(chart, 'S', i), 1)
      expect(y).toBeCloseTo(rowCentre(chart, i, cats.length), 1)
    })
    // Evenly spaced by a whole band. The old hidden-label fallback stepped
    // by (band - 1), so this is the drift the report describes.
    for (let i = 1; i < markers.length; i++) {
      expect(markerY(markers[i]) - markerY(markers[i - 1])).toBeCloseTo(
        chart.w.layout.gridHeight / cats.length,
        1,
      )
    }
  }

  it('centres a point on each bar, not on the label baseline', () => {
    const chart = horizontalBar(true)
    expectMarkersOnBars(chart)

    const labelY = parseFloat(
      q(chart, '.apexcharts-yaxis-texts-g text').getAttribute('y'),
    )
    // The baseline sits ~colHeight/22 below the band centre. A tall chart
    // with few rows would show it; eight rows still leaves a visible gap.
    expect(
      Math.abs(
        markerY(qa(chart, '.apexcharts-point-annotation-marker')[0]) - labelY,
      ),
    ).toBeGreaterThan(1)
  })

  it('centres a point on each bar when yaxis.labels.show is false', () => {
    const chart = horizontalBar(false)
    expect(q(chart, '.apexcharts-yaxis-texts-g text')).toBeNull()
    expectMarkersOnBars(chart)
  })

  it('offsets a grouped bar by seriesIndex from the row centre', () => {
    const names = ['A', 'B', 'C']
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 640, height: 420 },
      plotOptions: { bar: { horizontal: true } },
      series: names.map((name, s) => ({
        name,
        data: [10, 20, 30, 40].map((v) => v + s),
      })),
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
      annotations: {
        points: [0, 2].map((seriesIndex) => ({
          x: 25,
          y: 'b',
          seriesIndex,
          marker: { size: 5 },
        })),
      },
    })

    const markers = qa(chart, '.apexcharts-point-annotation-marker')
    expect(markerY(markers[0])).toBeCloseTo(seriesBarY(chart, 'A', 1), 1)
    expect(markerY(markers[1])).toBeCloseTo(seriesBarY(chart, 'C', 1), 1)
    // The two series do not share a centre. Collapsing the slot (as
    // rangeBarGroupRows must) would drop both markers on the same y.
    expect(Math.abs(markerY(markers[0]) - markerY(markers[1]))).toBeGreaterThan(
      5,
    )

    const helpers = new Helpers(new Annotations(chart.w))
    expect(helpers.barSlotOffset(0, 20)).toBe(-20)
    expect(helpers.barSlotOffset(1, 20)).toBe(0)
    expect(helpers.barSlotOffset(2, 20)).toBe(20)
  })

  describe('rangeBarGroupRows dumbbell rows', () => {
    // One series per row, each its own colour: the shape #5078 builds, with
    // rangeBarGroupRows so the rows share a track instead of splitting it.
    const rows = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']

    const dumbbellRows = (showLabels) =>
      createChartWithOptions({
        chart: { type: 'rangeBar', width: 700, height: 460 },
        plotOptions: {
          bar: { horizontal: true, rangeBarGroupRows: true, barHeight: '40%' },
        },
        series: rows.map((row, i) => ({
          name: `s${i}`,
          data: [{ x: row, y: [12, 28 + i] }],
        })),
        yaxis: { labels: { show: showLabels } },
        annotations: {
          points: rows.map((y) => ({
            x: 20,
            y,
            seriesIndex: 0,
            marker: { size: 5 },
          })),
        },
      })

    const expectOnSharedCentre = (chart) => {
      const markers = qa(chart, '.apexcharts-point-annotation-marker')
      expect(markers).toHaveLength(rows.length)
      markers.forEach((marker, i) => {
        const y = markerY(marker)
        expect(y).toBeCloseTo(seriesBarY(chart, `s${i}`), 1)
        expect(y).toBeCloseTo(rowCentre(chart, i, rows.length), 1)
      })

      const helpers = new Helpers(new Annotations(chart.w))
      // seriesIndex 0 must not shift by barHeight * (0 - (n - 1) / 2).
      expect(helpers.barSlotOffset(0, chart.w.globals.barHeight)).toBe(0)
      expect(helpers.barSlotOffset(rows.length - 1, 10)).toBe(0)
      const placed = helpers.getY1Y2('y1', {
        y: rows[3],
        seriesIndex: 0,
        yAxisIndex: 0,
      })
      expect(placed.clipped).toBe(false)
      expect(placed.yP).toBeCloseTo(rowCentre(chart, 3, rows.length), 5)
    }

    it('keeps seriesIndex 0 on the shared row centre', () => {
      expectOnSharedCentre(dumbbellRows(true))
    })

    it('keeps the row centre when yaxis.labels.show is false', () => {
      const chart = dumbbellRows(false)
      expect(q(chart, '.apexcharts-yaxis-texts-g text')).toBeNull()
      expectOnSharedCentre(chart)
    })
  })

  it('places a dumbbell chart point on the connector', () => {
    const names = ['Terraform', 'Homebrew', 'Cargo']
    const chart = createChartWithOptions({
      chart: { type: 'dumbbell', width: 700, height: 420 },
      series: [
        {
          name: 'Desired',
          data: [
            { x: 'Terraform', y: 15 },
            { x: 'Homebrew', y: 20 },
            { x: 'Cargo', y: 12 },
          ],
        },
        {
          name: 'Admired',
          data: [
            { x: 'Terraform', y: 51 },
            { x: 'Homebrew', y: 56 },
            { x: 'Cargo', y: 70 },
          ],
        },
      ],
      yaxis: { labels: { show: false } },
      annotations: {
        points: names.map((y) => ({
          x: 30,
          y,
          seriesIndex: 0,
          marker: { size: 5 },
        })),
      },
    })

    const markers = qa(chart, '.apexcharts-point-annotation-marker')
    const bars = qa(chart, '.apexcharts-rangebar-area')
    expect(markers).toHaveLength(names.length)
    expect(bars).toHaveLength(names.length)
    markers.forEach((marker, i) => {
      expect(markerY(marker)).toBeCloseTo(pathY(bars[i]), 1)
      expect(markerY(marker)).toBeCloseTo(rowCentre(chart, i, names.length), 1)
    })
  })

  it('draws a y-axis annotation through the row centre', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 640, height: 400 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'S', data: [5, 15, 25, 35] }],
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
      yaxis: { labels: { show: false } },
      annotations: { yaxis: [{ y: 'c', borderColor: '#f00' }] },
    })

    const line = q(chart, '.apexcharts-yaxis-annotations line')
    expect(line).not.toBeNull()
    const y = parseFloat(line.getAttribute('y1'))
    expect(y).toBeCloseTo(seriesBarY(chart, 'S', 2), 1)
    expect(y).toBeCloseTo(rowCentre(chart, 2, 4), 1)
  })
})
