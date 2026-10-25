/**
 * A colour the blend cannot parse (named, hsl(), var(), currentColor) is
 * resolved by the browser, and it must be resolved INSIDE the chart: a var()
 * scoped to the chart's container or shadow root does not exist in
 * document.body, where it would compute to body's text colour and the morph
 * pieces would blend through black before snapping on the last frame.
 *
 * jsdom does not resolve var(), so Utils.resolveColor is stubbed and the test
 * pins WHERE it is asked to resolve.
 */
import { vi } from 'vitest'
import Utils from '../../src/utils/Utils'
import { resolveRGBA } from '../../src/utils/Color'
import { makeColorLerp } from '../../src/modules/MorphPieces'
import MorphTypeChange from '../../src/modules/MorphTypeChange.js'

const SVGNS = 'http://www.w3.org/2000/svg'
const RESOLVED = { 'var(--brand-a)': 'rgb(255, 0, 0)', 'var(--brand-b)': 'rgb(0, 0, 255)' }

let spy
beforeEach(() => {
  spy = vi
    .spyOn(Utils, 'resolveColor')
    .mockImplementation((c) => RESOLVED[c] || c)
})
afterEach(() => {
  spy.mockRestore()
  document.body.innerHTML = ''
})

it('resolveRGBA and makeColorLerp resolve inside the element they are given', () => {
  const el = document.createElement('div')
  expect(resolveRGBA('var(--brand-a)', new Map(), el)).toEqual([255, 0, 0, 1])
  expect(spy).toHaveBeenLastCalledWith('var(--brand-a)', el)
  const lerp = makeColorLerp('var(--brand-a)', 'var(--brand-b)', new Map(), el)
  expect(lerp(0.5)).toBe('rgb(128,0,128)')
  spy.mock.calls.forEach((c) => expect(c[1]).toBe(el))
})

/** A plot with a graphical group to host the piece layer, inside elWrap. */
function scene() {
  document.body.innerHTML = `<div id="wrap"><svg xmlns="${SVGNS}" id="root"><g id="graph"></g></svg></div>`
  const wrap = document.getElementById('wrap')
  const svg = document.getElementById('root')
  const w = {
    config: {
      chart: { animations: { enabled: true, speed: 800, chartTypeMorph: { speed: 600 } } },
    },
    globals: { dom: { baseEl: svg }, colors: ['#1a7f37', '#0969da'] },
    dom: { elGraphical: { node: document.getElementById('graph') }, elWrap: wrap },
    layout: { translateX: 0, translateY: 0 },
  }
  return { svg, w, wrap }
}

const markD = (i) => {
  const x0 = 20 + i * 60
  return `M ${x0} 300 L ${x0} 100 L ${x0 + 40} 100 L ${x0 + 40} 300 Z`
}

/** Run a piece direction and hand back the pieces it would fly. */
function run(morph, method) {
  let pieces = []
  morph._runPieces = (p) => {
    pieces = p
  }
  morph[method]()
  return pieces
}

it('mark -> objects: the pieces resolve var() fills inside the chart', () => {
  const { svg, w, wrap } = scene()
  for (let i = 0; i < 2; i++) {
    for (let k = 0; k < 4; k++) {
      const c = document.createElementNS(SVGNS, 'circle')
      c.setAttribute('class', 'apexcharts-unit-area')
      c.setAttribute('i', String(i))
      c.setAttribute('cx', String(40 + i * 60 + k))
      c.setAttribute('cy', String(200 + k * 5))
      c.setAttribute('r', '3')
      c.setAttribute('fill', 'var(--brand-b)')
      svg.appendChild(c)
    }
  }
  const morph = new MorphTypeChange(w, {})
  morph._snapshot = {
    fromType: 'bar',
    toType: 'unit',
    mapping: new Map([0, 1].map((i) => [`${i}:0`, { d: markD(i), fill: 'var(--brand-a)' }])),
    oldLayout: { translateX: 0, translateY: 0 },
  }
  const pieces = run(morph, '_separatePieces')
  expect(pieces).toHaveLength(8)
  expect(pieces[0].fill(0.5)).toBe('rgb(128,0,128)')
  expect(spy).toHaveBeenCalled()
  spy.mock.calls.forEach((c) => expect(c[1]).toBe(wrap))
})

it('objects -> mark: the pieces resolve var() fills inside the chart', () => {
  const { svg, w, wrap } = scene()
  const sourceDots = new Map()
  const targets = new Map()
  for (let i = 0; i < 2; i++) {
    sourceDots.set(
      i,
      Array.from({ length: 4 }, (_, k) => ({ x: 40 + i * 60 + k, y: 200 + k * 5, r: 3, fill: 'var(--brand-a)' })),
    )
    const el = document.createElementNS(SVGNS, 'path')
    el.setAttribute('d', markD(i))
    svg.appendChild(el)
    targets.set(`${i}:0`, { realIndex: i, fill: 'var(--brand-b)', els: [el], d: markD(i) })
  }
  const morph = new MorphTypeChange(w, {})
  morph._collectTargetMarks = () => targets
  morph._snapshot = {
    fromType: 'unit',
    toType: 'bar',
    mapping: new Map(),
    oldLayout: { translateX: 0, translateY: 0 },
    sourceDots,
    keyOrder: ['0:0', '1:0'],
  }
  const pieces = run(morph, '_combinePieces')
  expect(pieces).toHaveLength(8)
  expect(pieces[0].fill(0.5)).toBe('rgb(128,0,128)')
  expect(spy).toHaveBeenCalled()
  spy.mock.calls.forEach((c) => expect(c[1]).toBe(wrap))
})
