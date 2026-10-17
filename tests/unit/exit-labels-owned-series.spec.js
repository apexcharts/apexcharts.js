import { describe, it, expect, afterEach, vi } from 'vitest'
import { playExitLabels } from '../../src/modules/animations/DataLabelTransition.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

// Hiding a series from the legend carries its data labels out with its
// marks (playExitLabels). Whether the renderer already drew that series'
// collapsing labels itself (stacked columns) is one fact per series, but it
// was looked up with a root querySelector for every captured label: a
// 20-category hide ran 20 identical scans. Counts the scans, and pins a
// mid-flight frame of the labels that do ride out, recorded at the base
// commit.

const SVGNS = 'http://www.w3.org/2000/svg'
const K = 20

const hash = (s) => {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 0x01000193)
  return (h >>> 0).toString(16)
}

const el = (doc, tag, attrs, parent) => {
  const e = doc.createElementNS(SVGNS, tag)
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)))
  parent?.appendChild(e)
  return e
}

/** A captured label as captureExitLabels clones it: a pill and its text. */
const label = (doc, j) => {
  const g = el(doc, 'g', { class: 'apexcharts-data-labels' })
  el(doc, 'rect', { x: j * 10, y: 40, width: 8, height: 6 }, g)
  el(
    doc,
    'text',
    { class: 'apexcharts-datalabel', cx: j * 10, cy: 50 + j },
    g,
  ).textContent = j
  return g
}

function setup() {
  const frames = []
  let now = 1000
  vi.spyOn(BrowserAPIs, 'requestAnimationFrame').mockImplementation((cb) => {
    frames.push(cb)
    return frames.length
  })
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  // Series 1 is a stacked column: the renderer drew its collapsing labels.
  // Series 0 is a line, carried out to where its points go.
  const doc = document.implementation.createDocument(SVGNS, 'svg', null)
  const root = doc.documentElement
  el(doc, 'g', { class: 'apexcharts-graphical' }, root)
  const own = el(
    doc,
    'g',
    { class: 'apexcharts-datalabels', 'data:realIndex': 1 },
    root,
  )
  el(doc, 'g', { class: 'apexcharts-data-labels' }, own)
  const xs = Array.from({ length: K }, (_, j) => j * 10)
  const w = {
    config: {
      chart: {
        animations: { easing: 'linear', dynamicAnimation: { speed: 300 } },
      },
    },
    dom: { baseEl: root, elGraphical: { node: root.firstElementChild } },
    globals: {
      isBarHorizontal: false,
      seriesXvalues: [xs.map((x) => x + 3)],
      seriesYvalues: [xs.map((_, j) => 200 - j)],
      riseLabels: null,
      exitLabels: [0, 1].flatMap((realIndex) =>
        xs.map((_, j) => ({
          realIndex,
          node: label(doc, j),
          key: null,
          oldX: xs,
          oldY: xs.map((_, k) => 50 + k),
        })),
      ),
    },
  }
  const pump = (t) => {
    now = t
    frames.splice(0).forEach((cb) => cb(t))
  }
  return { w, root, own, pump }
}

afterEach(() => vi.restoreAllMocks())

describe('exit labels look up the owning renderer once per series', () => {
  it('scans once per series and rides the same frames', () => {
    const { w, root, own, pump } = setup()
    // jsdom cannot match an escaped `data\:realIndex` selector, so this
    // answers it the way a browser would.
    const real = root.querySelector.bind(root)
    const qs = vi
      .spyOn(root, 'querySelector')
      .mockImplementation((s) =>
        s.startsWith('.apexcharts-datalabels[')
          ? s.includes('"1"')
            ? own
            : null
          : real(s),
      )
    playExitLabels(w)
    const scans = qs.mock.calls.filter(([s]) =>
      s.startsWith('.apexcharts-datalabels['),
    ).length
    // Before: 40, one per captured label of either series.
    expect(scans).toBe(2)

    // Only the line's labels ride; the stacked column's stay with its bars.
    const riding = () => [
      ...root.querySelectorAll('.apexcharts-label-exit > g'),
    ]
    expect(riding().length).toBe(K)
    pump(1000)
    pump(1150)
    const mid = riding()
      .flatMap((g) => [g, ...g.children])
      .map(
        (el) => `${el.getAttribute('transform')}|${el.getAttribute('opacity')}`,
      )
      .join(';')
    expect(hash(mid)).toBe('7db8520c')
    pump(1300)
    expect(root.querySelector('.apexcharts-label-exit')).toBe(null)
  })
})
