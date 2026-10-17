import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'
import CanvasGraphics from '../../src/renderers/canvas/CanvasGraphics'
import CanvasCompositor from '../../src/renderers/canvas/CanvasCompositor'
import '../../src/features/renderer-canvas.js'

// The canvas primitives (drawText, drawCircle, drawLine, drawPath,
// renderPaths) record a paint command per call. They dropped styling the
// SVG primitives honour, and the ones a custom series emits carried no
// series identity:
// - drawText ignored fontWeight and defaulted to black text in the canvas
//   default font, where SVG uses chart.foreColor (light in dark mode) and
//   chart.fontFamily. Dark-mode custom labels were invisible.
// - drawCircle ignored stroke-width, so api.circle({ strokeWidth: 3 }) drew
//   a 1px ring.
// - a path or line with no explicit cap painted butt, where SVG falls back
//   to stroke.lineCap (highlightFilter's line parts pass none).
// - custom-series primitives had no series index, so legend hover left
//   them at full opacity and they painted beneath the next series' line.

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

const lolli = {
  renderItem({ x, y, api, color }) {
    api.circle({ cx: x, cy: y, r: 4, fill: color, stroke: color, strokeWidth: 3 })
    api.text({ x, y: y - 8, text: 'v', weight: 'bold' })
  },
}

beforeAll(() => {
  ApexCharts.registerSeriesType('lolliCanvasSpec', lolli)
})
afterAll(() => {
  ApexCharts.unregisterSeriesType('lolliCanvasSpec')
})

const list = (c) => c.ctx.renderer._g._list

function customChart(extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 500,
      height: 300,
      renderer: 'canvas',
      animations: { enabled: false },
    },
    series: [
      { name: 'dots', type: 'lolliCanvasSpec', data: [3, 6, 4, 8] },
      { name: 'line', type: 'line', data: [2, 5, 7, 3] },
    ],
    ...extra,
  })
}

describe('canvas custom-series primitives', () => {
  it('record the series index so legend dimming and paint order match SVG', () => {
    chart = customChart()
    expect(chart.ctx.renderer.kind).toBe('canvas')
    const cmds = list(chart)
    const circles = cmds.filter((c) => c.tag === 'circle')
    const texts = cmds.filter((c) => c.tag === 'text')
    expect(circles.length).toBe(4)
    expect(texts.length).toBe(4)
    for (const c of [...circles, ...texts]) {
      expect(c.si).toBe(0)
      expect(c.z).toBe(0)
    }
    // series 1's line sorts above series 0's dots, as the SVG groups stack
    const line = cmds.find((c) => c.tag === 'path' && c.si === 1)
    expect(line.z).toBeGreaterThan(circles[0].z)
  })

  it('records stroke-width on a circle', () => {
    chart = customChart()
    const circle = list(chart).find((c) => c.tag === 'circle')
    expect(circle.strokeWidth).toBe(3)
    expect(circle.stroke).toBeTruthy()
  })

  it('records the font weight and the resolved dark-mode foreColor on text', () => {
    chart = customChart({ theme: { mode: 'dark' } })
    const text = list(chart).find((c) => c.tag === 'text')
    const fore = chart.w.config.chart.foreColor
    expect(fore).toBeTruthy()
    expect(text.fill).toBe(fore)
    expect(text.fontFamily).toBe(chart.w.config.chart.fontFamily)
    expect(text.fontWeight).toBe('bold')
  })
})

describe('canvas compositor text', () => {
  const fakeCtx = () => ({
    font: '',
    fillStyle: '',
    globalAlpha: 1,
    textAlign: '',
    save() {},
    restore() {},
    fillText() {},
  })

  it('puts the weight first in the canvas font', () => {
    const comp = new CanvasCompositor({})
    comp._alpha = 1
    const ctx = fakeCtx()
    comp._paintOne(ctx, {
      tag: 'text',
      text: 'v',
      tx: 0,
      ty: 0,
      fill: '#fff',
      fontSize: '12px',
      fontFamily: 'Arial',
      fontWeight: 600,
    })
    expect(ctx.font).toBe('600 12px Arial')
  })

  it("leaves the weight out for SVG's 'regular' default", () => {
    const comp = new CanvasCompositor({})
    comp._alpha = 1
    const ctx = fakeCtx()
    comp._paintOne(ctx, {
      tag: 'text',
      text: 'v',
      tx: 0,
      ty: 0,
      fontSize: '12px',
      fontFamily: 'Arial',
      fontWeight: 'regular',
    })
    expect(ctx.font).toBe('12px Arial')
  })
})

describe('canvas line caps', () => {
  const graphics = () =>
    new CanvasGraphics({
      config: { series: [], stroke: { lineCap: 'round' } },
      globals: {},
      layout: { gridWidth: 100, gridHeight: 100 },
    })

  it('renderPaths and drawPath fall back to stroke.lineCap like SVG', () => {
    const g = graphics()
    g.reset()
    g.renderPaths({ realIndex: 0, pathTo: 'M 0 0 L 5 5', stroke: '#000' })
    expect(g.displayList().at(-1).lineCap).toBe('round')
    g.drawPath({ d: 'M 0 0 L 5 5', stroke: '#000' })
    expect(g.displayList().at(-1).lineCap).toBe('round')
    g.renderPaths({
      realIndex: 0,
      pathTo: 'M 0 0 L 5 5',
      stroke: '#000',
      strokeLinecap: 'square',
    })
    expect(g.displayList().at(-1).lineCap).toBe('square')
  })

  it('drawLine records its cap argument', () => {
    const g = graphics()
    g.reset()
    g.drawLine(0, 0, 5, 5, '#000', 0, 2, 'round')
    expect(g.displayList().at(-1).lineCap).toBe('round')
  })
})
