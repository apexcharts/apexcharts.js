import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { parseDash, isDashPattern } from '../../src/utils/dash.js'
import CanvasCompositor from '../../src/renderers/canvas/CanvasCompositor'
import '../../src/features/renderer-canvas.js'

// #5383: a dash value may be a number, an SVG dash list string or an array.
// SVG takes all three straight into stroke-dasharray; the canvas renderer
// turned a string into [NaN], which setLineDash ignores, so a dash-dot
// series drew solid there. Annotations gained strokeLineCap for round dots.

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

describe('parseDash', () => {
  it.each([
    [6, [6]],
    ['6', [6]],
    ['8 3 2 3', [8, 3, 2, 3]],
    ['8,3,2,3', [8, 3, 2, 3]],
    [' 8, 3  2 ,3 ', [8, 3, 2, 3]],
    ['4px 2px', [4, 2]],
    [[8, 3, 2, 3], [8, 3, 2, 3]],
    ['0 6', [0, 6]],
    ['1.5 2', [1.5, 2]],
  ])('reads %j as %j', (input, out) => {
    expect(parseDash(input)).toEqual(out)
  })

  it.each([0, '0', '0 0', [0, 0], null, undefined, '', 'none', 'dashed', '4 -2', [4, NaN], -3])(
    'draws %j solid',
    (input) => {
      expect(parseDash(input)).toEqual([])
    },
  )
})

describe('isDashPattern', () => {
  it('takes numbers, dash list strings and arrays of numbers', () => {
    for (const v of [0, 6, '8 3 2 3', '8,3', '4px 2px', 'none', [8, 3]]) {
      expect(isDashPattern(v)).toBe(true)
    }
  })
  it('refuses anything else', () => {
    for (const v of ['dashed', '', NaN, [8, '3'], {}, null, true]) {
      expect(isDashPattern(v)).toBe(false)
    }
  })
})

describe('canvas dash', () => {
  const fakeCtx = () => {
    const calls = []
    return {
      calls,
      globalAlpha: 1,
      strokeStyle: '',
      lineWidth: 1,
      lineCap: '',
      setLineDash(d) {
        calls.push(d)
      },
    }
  }
  const applied = (strokeDash) => {
    const comp = new CanvasCompositor({})
    comp._alpha = 1
    const ctx = fakeCtx()
    const ok = comp._applyStroke(ctx, {
      stroke: '#000',
      strokeWidth: 2,
      strokeDash,
    })
    expect(ok).toBe(true)
    return ctx.calls[ctx.calls.length - 1]
  }

  it('draws a pattern string as that pattern, not solid', () => {
    expect(applied('8 3 2 3')).toEqual([8, 3, 2, 3])
    expect(applied('8,3')).toEqual([8, 3])
  })

  it('keeps a number and an array as before', () => {
    expect(applied(6)).toEqual([6])
    expect(applied([8, 3, 2, 3])).toEqual([8, 3, 2, 3])
    expect(applied(0)).toEqual([])
    expect(applied(undefined)).toEqual([])
  })

  it('records a per-series pattern string on the series command', () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, renderer: 'canvas' },
      stroke: { dashArray: [0, '8 3 2 3'] },
      series: [
        { name: 'a', data: [1, 4, 2, 5, 3] },
        { name: 'b', data: [2, 3, 4, 1, 2] },
      ],
    })
    const paths = chart.ctx.renderer._g._list.filter(
      (cmd) => cmd.tag === 'path' && cmd.stroke && cmd.stroke !== 'none',
    )
    const b = paths.find((c) => c.si === 1)
    expect(b.strokeDash).toBe('8 3 2 3')
    expect(parseDash(b.strokeDash)).toEqual([8, 3, 2, 3])
  })
})

describe('SVG dash', () => {
  const lineChart = (extra) =>
    createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [
        { name: 'a', data: [1, 4, 2, 5, 3] },
        { name: 'b', data: [2, 3, 4, 1, 2] },
        { name: 'c', data: [3, 2, 1, 2, 3] },
      ],
      ...extra,
    })
  const seriesDash = (c) =>
    [...c.w.dom.baseEl.querySelectorAll('path.apexcharts-line')].map((p) =>
      p.getAttribute('stroke-dasharray'),
    )

  it('writes numbers exactly as before', () => {
    chart = lineChart({ stroke: { dashArray: [6, 0, 3] } })
    expect(seriesDash(chart)).toEqual(['6', '0', '3'])
  })

  it('writes a pattern string and a nested array per series', () => {
    chart = lineChart({ stroke: { dashArray: [6, '8 3 2 3', [8, 3, 2, 3]] } })
    expect(seriesDash(chart)).toEqual(['6', '8 3 2 3', '8,3,2,3'])
  })

  it('applies one pattern string to every series', () => {
    chart = lineChart({ stroke: { dashArray: '8 3 2 3' } })
    expect(seriesDash(chart)).toEqual(['8 3 2 3', '8 3 2 3', '8 3 2 3'])
  })
})

describe('annotation dash and line cap', () => {
  const annoChart = (annotations) =>
    createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ name: 'a', data: [10, 20, 30, 40, 50] }],
      annotations,
    })
  const q = (c, sel) => c.w.dom.baseEl.querySelector(sel)

  it('leaves a numeric dash and the default cap as before', () => {
    chart = annoChart({
      yaxis: [{ y: 25, strokeDashArray: 6 }, { y: 30, y2: 40 }],
      xaxis: [{ x: 2 }],
    })
    const yl = q(chart, '.apexcharts-yaxis-annotations line')
    expect(yl.getAttribute('stroke-dasharray')).toBe('6')
    expect(yl.getAttribute('stroke-linecap')).toBe('butt')
    const xl = q(chart, '.apexcharts-xaxis-annotations line')
    expect(xl.getAttribute('stroke-dasharray')).toBe('1')
    expect(xl.getAttribute('stroke-linecap')).toBe('butt')
    // A range never wrote a cap; the default still writes none.
    const rect = q(chart, '.apexcharts-yaxis-annotations .apexcharts-annotation-rect')
    expect(rect.hasAttribute('stroke-linecap')).toBe(false)
  })

  it('writes a pattern string and an array', () => {
    chart = annoChart({
      yaxis: [{ y: 25, strokeDashArray: '8 3 2 3' }],
      xaxis: [{ x: 2, strokeDashArray: [8, 3, 2, 3] }],
    })
    expect(
      q(chart, '.apexcharts-yaxis-annotations line').getAttribute('stroke-dasharray'),
    ).toBe('8 3 2 3')
    expect(
      q(chart, '.apexcharts-xaxis-annotations line').getAttribute('stroke-dasharray'),
    ).toBe('8,3,2,3')
  })

  it('applies strokeLineCap to the line and the range border', () => {
    chart = annoChart({
      yaxis: [
        { y: 25, strokeDashArray: '0 6', strokeLineCap: 'round' },
        { y: 30, y2: 40, strokeLineCap: 'square' },
      ],
      xaxis: [
        { x: 2, strokeLineCap: 'round' },
        { x: 3, x2: 4, strokeLineCap: 'round' },
      ],
    })
    expect(
      q(chart, '.apexcharts-yaxis-annotations line').getAttribute('stroke-linecap'),
    ).toBe('round')
    expect(
      q(
        chart,
        '.apexcharts-yaxis-annotations .apexcharts-annotation-rect',
      ).getAttribute('stroke-linecap'),
    ).toBe('square')
    expect(
      q(chart, '.apexcharts-xaxis-annotations line').getAttribute('stroke-linecap'),
    ).toBe('round')
    expect(
      q(
        chart,
        '.apexcharts-xaxis-annotations .apexcharts-annotation-rect',
      ).getAttribute('stroke-linecap'),
    ).toBe('round')
  })
})
