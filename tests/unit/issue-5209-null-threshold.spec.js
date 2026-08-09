import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #5209: with plotOptions.line.colors thresholds, a null splits the series into
 * several path elements. Under the default objectBoundingBox units each segment
 * resolved the shared gradient against its own bounding box, so the color
 * transition landed on a different value in every segment.
 *
 * The fix anchors the threshold gradient to the plot area and positions its
 * boundary over the y-axis range, which is the space that gradient now spans.
 */

const thresholdColors = {
  threshold: 0,
  colorAboveThreshold: '#00ff00',
  colorBelowThreshold: '#ff0000',
}

const withNull = [60, 63, 60, 87, -50, -50, null, 100, 120, 138]
const withoutNull = [60, 63, 60, 87, -50, -50, 0, 100, 120, 138]

function render(overrides = {}) {
  return createChartWithOptions({
    chart: { type: 'area', width: 800, height: 350 },
    plotOptions: { line: { colors: thresholdColors } },
    dataLabels: { enabled: false },
    stroke: { curve: 'straight' },
    // an annotation at the threshold is placed by the axis mapping, giving an
    // oracle for where the color transition belongs that is independent of the
    // gradient code under test
    annotations: { yaxis: [{ y: thresholdColors.threshold }] },
    series: [{ data: withNull }],
    ...overrides,
  })
}

function thresholdGradient() {
  const grad = document.querySelector('linearGradient')
  const stops = [...grad.querySelectorAll('stop')]
  const offset = parseFloat(stops[0].getAttribute('offset'))
  const y2 = parseFloat(grad.getAttribute('y2'))

  return {
    units: grad.getAttribute('gradientUnits'),
    offset,
    // where the transition actually falls, in plot-area pixels
    boundaryPx: offset * y2,
    colors: stops.map((s) => s.getAttribute('stop-color')),
  }
}

/** Pixel y of the threshold value, read off the y-axis annotation. */
function thresholdPx() {
  const line = document.querySelector('.apexcharts-yaxis-annotations line')
  return parseFloat(line.getAttribute('y1'))
}

describe('Issue 5209: null values with line threshold colors', () => {
  it('anchors the threshold gradient to the plot area', () => {
    const chart = render()

    // the null splits the area into multiple paths
    const areaPaths = document.querySelectorAll('.apexcharts-area[fill^="url("]')
    expect(areaPaths.length).toBeGreaterThan(1)

    const grad = thresholdGradient()
    expect(grad.units).toBe('userSpaceOnUse')
    expect(grad.boundaryPx).toBeCloseTo(chart.w.layout.gridHeight * grad.offset, 5)
  })

  it('puts the color transition on the threshold value', () => {
    render()
    expect(thresholdGradient().boundaryPx).toBeCloseTo(thresholdPx(), 1)
  })

  it('positions the transition identically with and without the null', () => {
    render()
    const withNullBoundary = thresholdGradient().boundaryPx
    // pin the shared value to the threshold, so this cannot pass by both cases
    // being wrong in the same way
    expect(withNullBoundary).toBeCloseTo(thresholdPx(), 1)

    render({ series: [{ data: withoutNull }] })
    expect(thresholdGradient().boundaryPx).toBeCloseTo(withNullBoundary, 5)
  })

  it('keeps the transition on the threshold when the axis is wider than the data', () => {
    // the pre-fix mapping derived the offset from the data range, so an
    // explicit axis window moved the transition off the threshold
    render({ yaxis: { min: -500, max: 500 } })

    const grad = thresholdGradient()
    expect(grad.offset).toBeCloseTo(0.5, 5)
    expect(grad.boundaryPx).toBeCloseTo(thresholdPx(), 1)
  })

  it('applies to line charts, not just area', () => {
    render({ chart: { type: 'line', width: 800, height: 350 } })

    const linePaths = document.querySelectorAll('.apexcharts-line[stroke^="url("]')
    expect(linePaths.length).toBeGreaterThan(1)

    const grad = thresholdGradient()
    expect(grad.units).toBe('userSpaceOnUse')
    expect(grad.boundaryPx).toBeCloseTo(thresholdPx(), 1)
  })

  it('mirrors the transition on a reversed axis', () => {
    render({ yaxis: { reversed: true } })

    const grad = thresholdGradient()
    expect(grad.boundaryPx).toBeCloseTo(thresholdPx(), 1)
    // low values on top means the below-threshold band leads
    expect(grad.colors[0]).toBe('#ff0000')
  })

  it('leaves ordinary vertical gradient fills on objectBoundingBox', () => {
    // no threshold colors configured, so the presence of a null must not pull
    // this gradient into user space. gradient.type is set explicitly because
    // the default is horizontal, which never reaches the branch under test.
    createChartWithOptions({
      chart: { type: 'area', width: 800, height: 350 },
      fill: { type: 'gradient', gradient: { type: 'vertical' } },
      series: [{ data: [10, null, 30] }],
    })

    const grad = document.querySelector('linearGradient')
    expect(grad.getAttribute('gradientUnits')).toBeNull()
    expect(grad.getAttribute('y2')).toBe('1')
  })

  it('leaves other series in a combo chart on objectBoundingBox', () => {
    // hasNullValues is chart-global, so a gate keyed off it would re-anchor
    // gradients belonging to series that have no nulls and no thresholds
    createChartWithOptions({
      chart: { type: 'area', width: 800, height: 350 },
      fill: { type: 'gradient', gradient: { type: 'vertical' } },
      series: [
        { name: 'has null', type: 'area', data: [10, null, 30] },
        { name: 'no null', type: 'bar', data: [5, 15, 25] },
      ],
    })

    const grads = [...document.querySelectorAll('linearGradient')]
    expect(grads.length).toBeGreaterThan(1)
    grads.forEach((g) => expect(g.getAttribute('gradientUnits')).toBeNull())
  })

  it('emits finite offsets for non-numeric data', () => {
    createChartWithOptions({
      chart: { type: 'line', width: 800, height: 350 },
      plotOptions: { line: { colors: { ...thresholdColors, threshold: 50 } } },
      series: [{ data: [60, undefined, 30] }],
    })

    const stops = [...document.querySelector('linearGradient').querySelectorAll('stop')]
    expect(stops.length).toBeGreaterThan(0)
    stops.forEach((s) => {
      expect(Number.isFinite(parseFloat(s.getAttribute('offset')))).toBe(true)
    })
  })
})
