/**
 * The piece layer measures each summary mark's ink with a hit-test probe
 * (isPointInFill) before cutting it into cells. A hit-test forces the
 * browser to bring style and layout up to date, so cells written into the
 * live document between two marks' probes made every later probe pay for
 * them. Cells are now staged off-document and land in one write after the
 * last probe.
 *
 * jsdom has no path hit-testing, so the probe is stubbed: every point is
 * ink, and each call records whether a piece cell was already in the page.
 */
import MorphTypeChange from '../../src/modules/MorphTypeChange.js'

const SVGNS = 'http://www.w3.org/2000/svg'
const CLUSTERS = 3
const DOTS = 6

let hits = 0
let hitsAfterCells = 0
let restore = []

beforeEach(() => {
  hits = 0
  hitsAfterCells = 0
  const proto = window.SVGElement.prototype
  const svgProto = window.SVGSVGElement.prototype
  const had = { fill: proto.isPointInFill, pt: svgProto.createSVGPoint }
  proto.isPointInFill = function () {
    hits++
    if (document.querySelector('.apexcharts-morph-pieces rect')) {
      hitsAfterCells++
    }
    return true
  }
  svgProto.createSVGPoint = () => ({ x: 0, y: 0 })
  restore = [
    () => (proto.isPointInFill = had.fill),
    () => (svgProto.createSVGPoint = had.pt),
  ]
})

afterEach(() => {
  restore.forEach((r) => r())
  document.body.innerHTML = ''
})

/** A plot with a graphical group to host the piece layer. */
function scene() {
  document.body.innerHTML = `<svg xmlns="${SVGNS}" id="root"><g id="graph"></g></svg>`
  const svg = document.getElementById('root')
  const w = {
    config: {
      chart: {
        animations: { enabled: true, speed: 800, chartTypeMorph: { speed: 600 } },
      },
    },
    globals: { dom: { baseEl: svg }, colors: ['#1a7f37', '#0969da', '#bf3989'] },
    dom: { elGraphical: { node: document.getElementById('graph') } },
    layout: { translateX: 0, translateY: 0 },
  }
  return { svg, w }
}

/** Tall rectangle marks, one per cluster, as captured path data. */
const markD = (i) => {
  const x0 = 20 + i * 60
  return `M ${x0} 300 L ${x0} 100 L ${x0 + 40} 100 L ${x0 + 40} 300 Z`
}

function runAndCapture(morph, method) {
  /** @type {any[]} */
  let pieces = []
  morph._runPieces = (p) => {
    pieces = p
  }
  morph[method]()
  return pieces.map((p) => ({ from: p.from, to: p.to }))
}

describe('the extent probe never runs after a cell was written', () => {
  it('violin -> unit: all marks are probed before any cell lands', () => {
    const { svg, w } = scene()
    for (let i = 0; i < CLUSTERS; i++) {
      for (let k = 0; k < DOTS; k++) {
        const c = document.createElementNS(SVGNS, 'circle')
        c.setAttribute('class', 'apexcharts-unit-area')
        c.setAttribute('i', String(i))
        c.setAttribute('cx', String(40 + i * 60 + k))
        c.setAttribute('cy', String(200 + k * 5))
        c.setAttribute('r', '3')
        c.setAttribute('fill', '#333333')
        c.setAttribute('data-key', `${i}-${k}`)
        svg.appendChild(c)
      }
    }
    const morph = new MorphTypeChange(w, {})
    morph._snapshot = {
      fromType: 'violin',
      toType: 'unit',
      mapping: new Map(
        Array.from({ length: CLUSTERS }, (_, i) => [`${i}:0`, { d: markD(i), fill: '#1a7f37' }]),
      ),
      oldLayout: { translateX: 0, translateY: 0 },
    }
    const pieces = runAndCapture(morph, '_separatePieces')

    expect(pieces).toHaveLength(CLUSTERS * DOTS)
    expect(hits).toBeGreaterThan(0)
    expect(hitsAfterCells).toBe(0)
    expect(document.querySelectorAll('.apexcharts-morph-pieces rect')).toHaveLength(
      CLUSTERS * DOTS,
    )
    // every cell sits inside its mark's box
    pieces.forEach((p, n) => {
      const i = Math.floor(n / DOTS)
      expect(p.from.x).toBeGreaterThanOrEqual(20 + i * 60 - 1e-6)
      expect(p.from.x + p.from.width).toBeLessThanOrEqual(60 + i * 60 + 1e-6)
    })
  })

  it('unit -> violin: all marks are probed before any mosaic lands', () => {
    const { svg, w } = scene()
    const sourceDots = new Map()
    const targets = new Map()
    for (let i = 0; i < CLUSTERS; i++) {
      sourceDots.set(
        i,
        Array.from({ length: DOTS }, (_, k) => ({ x: 40 + i * 60 + k, y: 200 + k * 5, r: 3, fill: '#333333' })),
      )
      const el = document.createElementNS(SVGNS, 'path')
      el.setAttribute('d', markD(i))
      svg.appendChild(el)
      targets.set(`${i}:0`, { realIndex: i, fill: '#1a7f37', els: [el], d: markD(i) })
    }
    const morph = new MorphTypeChange(w, {})
    morph._collectTargetMarks = () => targets
    morph._snapshot = {
      fromType: 'unit',
      toType: 'violin',
      mapping: new Map(),
      oldLayout: { translateX: 0, translateY: 0 },
      sourceDots,
      keyOrder: Array.from({ length: CLUSTERS }, (_, i) => `${i}:0`),
    }
    const pieces = runAndCapture(morph, '_combinePieces')

    expect(pieces).toHaveLength(CLUSTERS * DOTS)
    expect(hits).toBeGreaterThan(0)
    expect(hitsAfterCells).toBe(0)
    expect(document.querySelectorAll('.apexcharts-morph-pieces > g')).toHaveLength(CLUSTERS)
  })
})
