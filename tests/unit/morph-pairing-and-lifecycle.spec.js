/**
 * Cross-type morph: the pairing, geometry and lifecycle rules behind the
 * piece layer and the ghost fade.
 *
 * jsdom has no path hit-testing and no real frames, so these drive the
 * planning methods directly (with the DOM capture stubbed where the browser
 * would supply it) and the timers through fake clocks.
 */

import MorphTypeChange from '../../src/modules/MorphTypeChange.js'
import { parsePath } from '../../src/svg/PathMorphing.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function stubW() {
  return {
    config: {
      chart: {
        animations: {
          enabled: true,
          speed: 800,
          chartTypeMorph: { enabled: true, speed: 600 },
        },
      },
    },
    globals: {
      previousPaths: [],
      dom: { baseEl: document.createElement('div') },
      colors: ['#aa0000', '#0000aa', '#00aa00'],
    },
    layout: { translateX: 0, translateY: 0, gridWidth: 300, gridHeight: 450 },
    dom: {},
  }
}

function makeMorph() {
  const w = /** @type {any} */ (stubW())
  const ctx = /** @type {any} */ ({})
  const m = new MorphTypeChange(w, ctx)
  ctx.morphTypeChange = m
  return m
}

/**
 * What the unit capture yields for clusters `[index, dotCount, fill]`: one
 * synthetic box mark per cluster that drew dots, and the dots themselves.
 */
function unitCapture(clusters) {
  const marks = []
  const unitDots = new Map()
  clusters.forEach(([i, n, fill]) => {
    const list = []
    for (let k = 0; k < n; k++) {
      list.push({ x: 20 + i * 60 + (k % 3) * 8, y: 40 + Math.floor(k / 3) * 8, r: 3, fill })
    }
    unitDots.set(i, list)
    marks.push({ realIndex: i, j: 0, d: `M ${i * 60} 0 L ${i * 60 + 40} 0 L ${i * 60 + 40} 80 L ${i * 60} 80 Z`, fill })
  })
  return { marks, branches: [], unitDots }
}

function captureUnitInto(m, toType, newSeries, clusters) {
  m._canProbePaths = () => true
  m._captureFromDOM = () => unitCapture(clusters)
  return m.captureBeforeDestroy({ fromType: 'unit', toType, newSeries })
}

describe('unit -> mark pairing', () => {
  it('keys a radial target by slice for the single-series object form', () => {
    const m = makeMorph()
    captureUnitInto(m, 'pie', [{ data: [5, 3, 4] }], [
      [0, 5, '#aa0000'],
      [1, 3, '#0000aa'],
      [2, 4, '#00aa00'],
    ])
    expect(m._snapshot.pieceIn).toBe(true)
    expect(m._snapshot.keyOrder).toEqual(['0:0', '1:0', '2:0'])
    expect([...m._snapshot.mapping.keys()]).toEqual(['0:0', '1:0', '2:0'])
  })

  it('pairs each cluster with its own category when a middle cluster is empty', () => {
    const clusters = [
      [0, 3, '#aa0000'],
      [2, 4, '#00aa00'],
    ]
    const bar = makeMorph()
    captureUnitInto(bar, 'bar', [{ data: [3, 0, 4] }], clusters)
    expect([...bar._snapshot.mapping.keys()]).toEqual(['0:0', '0:2'])

    const pie = makeMorph()
    captureUnitInto(pie, 'pie', [3, 0, 4], clusters)
    expect([...pie._snapshot.mapping.keys()]).toEqual(['0:0', '2:0'])
  })

  it('flies an empty-cluster neighbour into its own mark, not the empty one', () => {
    const m = makeMorph()
    captureUnitInto(m, 'bar', [{ data: [3, 0, 4] }], [
      [0, 3, '#aa0000'],
      [2, 4, '#00aa00'],
    ])
    const svg = document.createElementNS(SVG_NS, 'svg')
    const target = (j) => {
      const p = document.createElementNS(SVG_NS, 'path')
      svg.appendChild(p)
      return { realIndex: 0, j, bbox: { x: j * 60, y: 0, width: 40, height: 80 }, fill: '#555555', els: [p] }
    }
    m._collectTargetMarks = () =>
      new Map([
        ['0:0', target(0)],
        ['0:1', target(1)],
        ['0:2', target(2)],
      ])
    m._makePieceLayer = () => {
      const g = document.createElementNS(SVG_NS, 'g')
      svg.appendChild(g)
      return g
    }
    let pieces = []
    m._runPieces = (p) => {
      pieces = p
    }
    m._combinePieces()

    const keysFor = (fill) =>
      new Set(pieces.filter((p) => p.el.getAttribute('fill') === fill).map((p) => p.el.getAttribute('data-key')))
    expect(keysFor('#aa0000')).toEqual(new Set(['0:0']))
    expect(keysFor('#00aa00')).toEqual(new Set(['0:2']))
  })

  it('keeps the ghost fade for unit -> radialBar, whose rings cannot be tiled', () => {
    for (const toType of ['radialBar', 'gauge']) {
      const m = makeMorph()
      const svg = document.createElementNS(SVG_NS, 'svg')
      svg.appendChild(document.createElementNS(SVG_NS, 'circle'))
      m.w.dom.Paper = { node: svg }
      captureUnitInto(m, toType, [40, 70], [
        [0, 4, '#aa0000'],
        [1, 6, '#0000aa'],
      ])
      expect(m._snapshot.pieceIn).toBeFalsy()
      expect(m._ghost).not.toBeNull()
    }
  })
})

describe('_pathBBox', () => {
  const m = makeMorph()

  it('includes the bulge of a half-circle wedge', () => {
    // Top to bottom, clockwise: the arc swings out to x = 300.
    const box = m._pathBBox('M 200 100 A 100 100 0 0 1 200 300 L 200 200 L 200 100')
    expect(box.minX).toBeCloseTo(200)
    expect(box.maxX).toBeCloseTo(300)
    expect(box.minY).toBeCloseTo(100)
    expect(box.maxY).toBeCloseTo(300)
  })

  it('includes the axis extreme a short arc crosses', () => {
    const s = Math.SQRT1_2 * 100
    const box = m._pathBBox(`M 200 200 L ${200 + s} ${200 - s} A 100 100 0 0 1 ${200 + s} ${200 + s} Z`)
    expect(box.maxX).toBeCloseTo(300)
    expect(box.minY).toBeCloseTo(200 - s)
    expect(box.maxY).toBeCloseTo(200 + s)
  })

  it('follows the large-arc and sweep flags round the long way', () => {
    // Top to right, counter-clockwise, large: via the left and the bottom.
    const box = m._pathBBox('M 200 100 A 100 100 0 1 0 300 200')
    expect(box.minX).toBeCloseTo(100)
    expect(box.maxX).toBeCloseTo(300)
    expect(box.minY).toBeCloseTo(100)
    expect(box.maxY).toBeCloseTo(300)
  })

  it('places H and V at the current point, not a running midpoint', () => {
    const box = m._pathBBox('M 0 -5 L 10 5 H 100 V 40')
    expect(box).toEqual({ minX: 0, minY: -5, maxX: 100, maxY: 40 })
  })
})

describe('outgoing mark capture', () => {
  it('starts bars and summary marks from their live shape, not the end of their tween', () => {
    const m = makeMorph()
    // Built node by node: the HTML parser would lower-case `pathTo`.
    const el = (tag, attrs, parent) => {
      const node = document.createElementNS(SVG_NS, tag)
      Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v))
      parent.appendChild(node)
      return node
    }
    const svg = el('svg', {}, m.w.globals.dom.baseEl)
    const barSeries = el('g', { class: 'apexcharts-series', 'data:realIndex': '0' }, el('g', { class: 'apexcharts-bar-series' }, svg))
    el('path', { pathTo: 'M 0 100 L 0 0 L 10 0 L 10 100 Z', d: 'M 0 100 L 0 60 L 10 60 L 10 100 Z' }, barSeries)
    const boxSeries = el('g', { class: 'apexcharts-series', 'data:realIndex': '0' }, svg)
    el('path', { class: 'apexcharts-boxPlot-area', j: '0', pathTo: 'M 0 0 L 5 5', d: 'M 1 1 L 2 2' }, boxSeries)
    expect(m._captureFromDOM('bar').marks[0].d).toBe('M 0 100 L 0 60 L 10 60 L 10 100 Z')
    expect(m._captureFromDOM('boxPlot').marks[0].d).toBe('M 1 1 L 2 2')
  })

  it('rebuilds radialBar rings around the centre the renderer used', () => {
    const m = makeMorph()
    // A tall plot: the rings sit at the band's centre (150, 225), not at
    // min(w, h) / 2.
    m.w.globals.circleGeometry = { cx: 150, cy: 225, r: 120 }
    m.w.globals.dom.baseEl.innerHTML =
      '<svg><g class="apexcharts-radial-series"><g data:realIndex="0">' +
      '<path class="apexcharts-radialbar-area" stroke-width="20" d="M 150 125 A 100 100 0 0 1 250 225"></path>' +
      '</g></g></svg>'
    const d = m._captureFromDOM('radialBar').marks[0].d
    const radii = parsePath(d)
      .filter((c) => c[0] !== 'Z')
      .map((c) => Math.hypot(c[c.length - 2] - 150, c[c.length - 1] - 225))
    radii.forEach((r) => expect([90, 110].some((want) => Math.abs(r - want) < 1e-6)).toBe(true))
  })
})
