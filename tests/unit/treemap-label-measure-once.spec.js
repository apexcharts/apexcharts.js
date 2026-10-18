import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A tile label that fits better sideways is turned about its own centre. That
// centre used to come from getBBox on the label just inserted into the live
// SVG: a forced layout per turned tile, on top of the one measure the fit test
// already takes. It is now worked out from that measure and the position the
// label was drawn at. These specs count the reads and pin the centre.
//
// jsdom has no text layout, so getBBox is replaced here by a simple, consistent
// text model (0.6em a character, 1.25em a line, top at 0.8em above the
// baseline). Whatever the model, the old getBBox centre and the new arithmetic
// must agree under it.

/** @param {Element} el */
function textBox(el) {
  const size = parseFloat(el.getAttribute('font-size')) || 11
  const tsp = el.querySelectorAll('tspan')
  const lines = tsp.length ? [...tsp].map((t) => t.textContent) : [el.textContent]
  const width = Math.max(...lines.map((l) => l.length)) * size * 0.6
  const x0 = parseFloat(el.getAttribute('x')) || 0
  const y0 = parseFloat(el.getAttribute('y')) || 0
  const a = el.getAttribute('text-anchor')
  return {
    x: x0 - width * (a === 'middle' ? 0.5 : a === 'end' ? 1 : 0),
    y: y0 - size * 0.8,
    width,
    height: lines.length * size * 1.25,
  }
}

let orig
let labelReads
let measured
beforeEach(() => {
  orig = SVGElement.prototype.getBBox
  labelReads = 0
  measured = new Map()
  SVGElement.prototype.getBBox = function () {
    if (this.tagName === 'text') {
      // getTextRects draws its probe at x = -200
      if (this.getAttribute('x') === '-200') {
        const k = `${this.textContent}|${this.getAttribute('font-size')}`
        measured.set(k, (measured.get(k) || 0) + 1)
      }
      return textBox(this)
    }
    if (this.matches('g.apexcharts-data-labels')) {
      labelReads++
      const t = this.querySelector('text')
      return t ? textBox(t) : { x: 0, y: 0, width: 0, height: 0 }
    }
    return orig.call(this)
  }
})
afterEach(() => {
  SVGElement.prototype.getBBox = orig
})

// One big tile and a strip of four narrow ones whose long names fit only
// sideways.
const render = (extra = {}) =>
  createChartWithOptions({
    chart: { type: 'treemap', width: 800, height: 400 },
    series: [
      {
        data: [400, 10, 9, 8, 7].map((y, k) => ({
          x: k ? `Item number long ${k}` : 'A',
          y,
        })),
      },
    ],
    ...extra,
  })

const turnedLabels = (c) =>
  [...c.el.querySelectorAll('.apexcharts-treemap-series > g.apexcharts-data-labels')].filter(
    (g) => /rotate\(/.test(g.getAttribute('transform') || ''),
  )

/** The pivot of `rotate(-90 cx cy)`. */
const pivot = (g) => {
  const m = /rotate\(-90 ([-\d.e]+) ([-\d.e]+)\)/.exec(g.getAttribute('transform'))
  return { x: +m[1], y: +m[2] }
}

describe('treemap tile labels are measured once', () => {
  it('turns a label without reading its box back from the DOM', () => {
    const c = render()
    expect(turnedLabels(c).length).toBeGreaterThan(0)
    // No getBBox on a drawn label group (was one per turned label).
    expect(labelReads).toBe(0)
    // Each label is measured once at the size it is drawn at. (The x-axis
    // dimensions pass measures the last category at its own size; that is
    // not tile labelling.)
    const labels = [...c.el.querySelectorAll('.apexcharts-treemap-series .apexcharts-datalabel')]
    expect(labels.length).toBe(5)
    for (const t of labels) {
      expect(measured.get(`${t.textContent}|${t.getAttribute('font-size')}`)).toBe(1)
    }
  })

  for (const [name, dataLabels] of [
    ['middle anchor', {}],
    ['start anchor', { textAnchor: 'start' }],
    ['end anchor', { textAnchor: 'end' }],
    ['offset label', { offsetX: 3, offsetY: -4 }],
    ['two-line label', { formatter: (t, o) => [t, o.value] }],
  ]) {
    it(`pivots on the centre of the drawn box (${name})`, () => {
      const c = render({ dataLabels })
      const turned = turnedLabels(c)
      expect(turned.length).toBeGreaterThan(0)
      for (const g of turned) {
        const b = textBox(g.querySelector('text'))
        const p = pivot(g)
        expect(p.x).toBeCloseTo(b.x + b.width / 2, 6)
        expect(p.y).toBeCloseTo(b.y + b.height / 2, 6)
      }
    })
  }
})
