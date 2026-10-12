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
