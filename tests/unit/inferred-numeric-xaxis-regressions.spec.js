import { describe, expect, it } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const xAxisLabels = (chart) =>
  Array.from(chart.el.querySelectorAll('.apexcharts-xaxis-label')).map(
    (label) => label.querySelector('tspan').textContent,
  )

const points = (xs, y = (x) => x) => xs.map((x) => ({ x, y: y(x) }))

describe('inferred numeric x-axis regressions', () => {
  it('keeps integer precision for a short vertical bar year series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 900 },
      series: [{ data: points([2020, 2021, 2022]) }],
    })

    expect(xAxisLabels(chart)).toEqual(['2020', '2021', '2022'])
  })

  it('keeps integer precision for a decade-long vertical bar year series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 900 },
      series: [
        {
          data: points(Array.from({ length: 10 }, (_, index) => 2015 + index)),
        },
      ],
    })

    const labels = xAxisLabels(chart)
    expect(labels.length).toBeGreaterThan(0)
    expect(labels.every((label) => /^\d{4}$/.test(label))).toBe(true)
  })

  it('keeps tooltip titles at the same precision as integer bar labels', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 900 },
      series: [{ data: points([2020, 2021, 2022]) }],
    })

    expect(chart.w.formatters.xLabelFormatter(2021)).toBe('2021')
    expect(chart.w.formatters.ttKeyFormatter(2021)).toBe('2021')
  })

  it('does not add trailing zeros to integer tooltip keys on an irregular scale', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600 },
      series: [{ data: points([1, 2, 10]) }],
    })

    expect(chart.w.globals.xAxisScale.result).toEqual([1, 5.5, 10])
    expect(chart.w.formatters.ttKeyFormatter(2)).toBe('2')
  })

  it('keeps integer precision for rangeBar category labels', () => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeBar', width: 900 },
      series: [
        {
          data: points([1, 2, 3, 4, 5], (x) => [x, x + 1]),
        },
      ],
    })

    expect(xAxisLabels(chart)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('keeps integer precision for heatmap category labels', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap', width: 900 },
      series: [{ data: points([2020, 2021, 2022]) }],
    })

    expect(xAxisLabels(chart)).toEqual(['2020', '2021', '2022'])
  })

  it('keeps integer precision for numeric two-dimensional bar data', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 900 },
      series: [
        {
          data: [2020, 2021, 2022].map((x) => [x, x]),
        },
      ],
    })

    expect(xAxisLabels(chart)).toEqual(['2020', '2021', '2022'])
  })

  it('preserves explicitly categorical numeric x data', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 900 },
      series: [{ data: points([2020, 2021, 2022]) }],
      xaxis: { type: 'category' },
    })

    expect(chart.w.config.xaxis.type).toBe('category')
    expect(xAxisLabels(chart)).toEqual(['2020', '2021', '2022'])
  })

  it('does not apply numeric decimalsInFloat to an inferred category axis', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 900 },
      series: [{ data: points([2020, 2021, 2022]) }],
      xaxis: { type: 'category', decimalsInFloat: 2 },
    })

    expect(xAxisLabels(chart)).toEqual(['2020', '2021', '2022'])
  })

  it('keeps category formatting when tick placement prevents conversion', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 900 },
      series: [{ data: points([2020, 2021, 2022]) }],
      xaxis: { type: 'category', tickPlacement: 'between' },
    })

    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(false)
    expect(xAxisLabels(chart)).toEqual(['2020', '2021', '2022'])
  })

  it('keeps category formatting for scatter jitter data', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter', width: 900 },
      series: [{ data: points([2020, 2021, 2022]) }],
      plotOptions: { scatter: { jitter: { enabled: true } } },
    })

    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(false)
    expect(xAxisLabels(chart)).toEqual(['2020', '2021', '2022'])
  })

  it.each([
    ['narrow', 250, 12, 2],
    ['wide', 1200, 29, 8],
  ])(
    'keeps the width-derived tick count for a %s inferred numeric chart',
    (_, width, count, expectedTicks) => {
      const chart = createChartWithOptions({
        chart: { type: 'bar', width },
        series: [
          {
            data: points(
              Array.from({ length: count }, (_, index) => 1000000 + index),
            ),
          },
        ],
      })

      expect(chart.w.globals.xTickAmount).toBe(expectedTicks)
      expect(chart.w.globals.xAxisScale.result).toHaveLength(expectedTicks + 1)
    },
  )
})
