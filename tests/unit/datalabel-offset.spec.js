import { describe, it, expect, vi } from 'vitest'
import { resolveDataLabelOffset } from '../../src/modules/helpers/DataLabelOffset.js'
import { createChartWithOptions } from './utils/utils.js'

// dataLabels.offsetX/offsetY accept a function evaluated per data point, so
// labels that would otherwise overlap can be nudged individually.
// See https://github.com/apexcharts/apexcharts.js/issues/5107

const labelYs = () =>
  Array.from(document.querySelectorAll('text.apexcharts-datalabel')).map((el) =>
    parseFloat(el.getAttribute('y')),
  )

const labelXs = () =>
  Array.from(document.querySelectorAll('text.apexcharts-datalabel')).map((el) =>
    parseFloat(el.getAttribute('x')),
  )

const lineChart = (dataLabels) =>
  createChartWithOptions({
    chart: { type: 'line', width: 500, height: 300 },
    series: [
      { name: 'A', data: [30, 40] },
      { name: 'B', data: [32, 42] },
    ],
    xaxis: { categories: ['Jan', 'Feb'] },
    dataLabels: { enabled: true, ...dataLabels },
  })

describe('resolveDataLabelOffset', () => {
  const w = { seriesData: { series: [[1, 2]] } }

  it('passes a plain number through', () => {
    expect(resolveDataLabelOffset(12, w, 0, 0)).toBe(12)
    expect(resolveDataLabelOffset(0, w, 0, 0)).toBe(0)
    expect(resolveDataLabelOffset(-8, w, 0, 1)).toBe(-8)
  })

  it('calls a function with the series and data point indices', () => {
    const spy = vi.fn(() => 5)
    expect(resolveDataLabelOffset(spy, w, 2, 3)).toBe(5)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ seriesIndex: 2, dataPointIndex: 3, w }),
    )
  })

  it('falls back to 0 when the function returns a non-finite value', () => {
    // a NaN here would propagate into the x attribute and drop the label
    expect(resolveDataLabelOffset(() => undefined, w, 0, 0)).toBe(0)
    expect(resolveDataLabelOffset(() => NaN, w, 0, 0)).toBe(0)
    expect(resolveDataLabelOffset(() => 'nope', w, 0, 0)).toBe(0)
  })
})

describe('dataLabels offset functions', () => {
  // regression: a non-numeric offset used to make `x` NaN before the isNaN
  // guard, so the whole label block was skipped and no labels rendered at all
  it('renders every label on a line chart', () => {
    lineChart({ offsetY: ({ dataPointIndex }) => dataPointIndex * -20 })
    expect(labelYs()).toHaveLength(4)
    expect(labelYs().every((y) => Number.isFinite(y))).toBe(true)

    lineChart({ offsetX: ({ dataPointIndex }) => dataPointIndex * -20 })
    expect(labelXs()).toHaveLength(4)
    expect(labelXs().every((x) => Number.isFinite(x))).toBe(true)
  })

  it('matches the scalar form when the function returns a constant', () => {
    lineChart({ offsetY: 10 })
    const scalar = labelYs()

    lineChart({ offsetY: () => 10 })
    expect(labelYs()).toEqual(scalar)
  })

  it('offsets each data point independently', () => {
    lineChart({ offsetY: 0 })
    const base = labelYs()

    lineChart({
      offsetY: ({ dataPointIndex }) => (dataPointIndex === 1 ? -20 : 0),
    })
    const moved = labelYs()

    // series A point 0 and series B point 0 stay put, both point 1s move up
    expect(moved[0]).toBe(base[0])
    expect(moved[2]).toBe(base[2])
    expect(moved[1]).toBeLessThan(base[1])
    expect(moved[3]).toBeLessThan(base[3])
  })

  it('offsets each series independently', () => {
    // the case an index-keyed value cannot express: dataLabels is chart-wide
    // config, so separating two overlapping series needs the series index
    lineChart({ offsetY: 0 })
    const base = labelYs()

    lineChart({ offsetY: ({ seriesIndex }) => (seriesIndex === 0 ? -15 : 15) })
    const moved = labelYs()

    expect(moved[0]).toBeLessThan(base[0])
    expect(moved[1]).toBeLessThan(base[1])
    expect(moved[2]).toBeGreaterThan(base[2])
    expect(moved[3]).toBeGreaterThan(base[3])
  })

  it('offsets each data point independently on a bar chart', () => {
    const barChart = (dataLabels) =>
      createChartWithOptions({
        chart: { type: 'bar', width: 500, height: 300 },
        series: [{ name: 'A', data: [30, 40, 50] }],
        dataLabels: { enabled: true, ...dataLabels },
      })

    barChart({ offsetY: 0 })
    const base = labelYs()

    // bar/column reverse the offset sign for negative values, so compare
    // against the scalar form rather than assuming a direction
    barChart({ offsetY: -25 })
    const scalar = labelYs()

    barChart({
      offsetY: ({ dataPointIndex }) => (dataPointIndex === 2 ? -25 : 0),
    })
    const moved = labelYs()

    expect(moved).toHaveLength(3)
    expect(moved[0]).toBe(base[0])
    expect(moved[1]).toBe(base[1])
    expect(moved[2]).toBe(scalar[2])
    expect(moved[2]).not.toBe(base[2])
  })
})
