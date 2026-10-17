import { describe, it, expect, afterEach, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { hasCanvasUnsupportedFeature } from '../../src/renderers/Renderer.js'
import '../../src/features/renderer-canvas.js'

// The canvas gate (hasCanvasUnsupportedFeature) sends a chart to SVG when it
// uses something the canvas renderer does not paint.
//
// forecastDataPoints on a line or area draws the series twice, a solid copy
// and a dashed copy, split only by the forecast / nonForecast clip-paths. The
// canvas ignores those clips, so both copies painted the whole line: the
// dashed (and thickened) copy covered the solid one and the forecast segment
// could not be told apart. Bars mark their forecast per bar through plain
// stroke attributes, which the canvas does paint, so they keep canvas.
//
// stroke.fill other than solid gives an area or rangeArea outline a url()
// gradient stroke, which the canvas skips: only the body painted.

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

const data = Array.from({ length: 40 }, (_, i) => (i * 7) % 23)

const fakeW = (config) => ({
  config: {
    chart: { type: 'line' },
    series: [{ name: 'a', data: [1, 2, 3] }],
    fill: { type: 'solid' },
    states: {},
    ...config,
  },
})

describe('canvas gate: line forecast', () => {
  it('declines canvas for an explicit canvas line with a forecast', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, renderer: 'canvas' },
      series: [{ name: 'a', data }],
      forecastDataPoints: { count: 10, dashArray: 4, strokeWidth: 4 },
    })
    expect(chart.ctx.renderer.kind).toBe('svg')
    expect(warn.mock.calls.some((c) => /forecast/.test(String(c[0])))).toBe(
      true,
    )
  })

  it("declines canvas for renderer 'auto' over the threshold", () => {
    const opts = {
      chart: {
        type: 'area',
        width: 500,
        height: 300,
        renderer: 'auto',
        rendererThreshold: 10,
      },
      markers: { size: 3 },
      fill: { type: 'solid' },
      series: [{ name: 'a', data }],
    }
    chart = createChartWithOptions(opts)
    // over the threshold the chart does go to canvas without a forecast
    expect(chart.ctx.renderer.kind).toBe('canvas')
    chart.destroy()
    chart = createChartWithOptions({
      ...opts,
      forecastDataPoints: { count: 10 },
    })
    expect(chart.ctx.renderer.kind).toBe('svg')
  })

  it('declines canvas when a combo line series carries the forecast', () => {
    expect(
      hasCanvasUnsupportedFeature(
        fakeW({
          chart: { type: 'bar' },
          series: [
            { name: 'a', type: 'bar', data: [1, 2] },
            { name: 'b', type: 'line', data: [1, 2] },
          ],
          forecastDataPoints: { count: 1 },
        }),
      ),
    ).toBe(true)
  })

  it('keeps canvas for a bar forecast, which canvas paints per bar', () => {
    expect(
      hasCanvasUnsupportedFeature(
        fakeW({ chart: { type: 'bar' }, forecastDataPoints: { count: 1 } }),
      ),
    ).toBe(false)
    expect(
      hasCanvasUnsupportedFeature(fakeW({ forecastDataPoints: { count: 0 } })),
    ).toBe(false)
  })

  it('keeps canvas for a rangeArea forecast, which Line.js never draws', () => {
    expect(
      hasCanvasUnsupportedFeature(
        fakeW({
          chart: { type: 'rangeArea' },
          forecastDataPoints: { count: 1 },
        }),
      ),
    ).toBe(false)
  })
})

describe('canvas gate: gradient stroke.fill', () => {
  it('declines canvas for an area with a gradient stroke fill', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    chart = createChartWithOptions({
      chart: { type: 'area', width: 500, height: 300, renderer: 'canvas' },
      series: [{ name: 'a', data }],
      fill: { type: 'solid' },
      stroke: { fill: { type: 'gradient' } },
    })
    expect(chart.ctx.renderer.kind).toBe('svg')
  })

  it('declines canvas for a rangeArea with a gradient stroke fill', () => {
    expect(
      hasCanvasUnsupportedFeature(
        fakeW({
          chart: { type: 'rangeArea' },
          stroke: { fill: { type: 'gradient' } },
        }),
      ),
    ).toBe(true)
  })

  it('keeps canvas where stroke.fill is not painted or is solid', () => {
    // a bar's stroke never takes its paint from stroke.fill
    expect(
      hasCanvasUnsupportedFeature(
        fakeW({ chart: { type: 'bar' }, stroke: { fill: { type: 'gradient' } } }),
      ),
    ).toBe(false)
    expect(
      hasCanvasUnsupportedFeature(
        fakeW({ chart: { type: 'area' }, stroke: { fill: { type: 'solid' } } }),
      ),
    ).toBe(false)
  })
})
