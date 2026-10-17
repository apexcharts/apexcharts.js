import { describe, it, expect, afterEach, vi } from 'vitest'
import { playExitLabels } from '../../src/modules/animations/DataLabelTransition.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

// A bar that leaves the data exits as a ghost, and its data label rides the
// ghost out (playExitLabels). The ghost tween starts while its series
// renders; the label tween started after the whole render, on its own
// clock, so on a large chart the label trailed its ghost by the render's
// length (about 23% of the tween at 2,000 bars). The label now starts from
// the ghost's recorded start and shares its easing (GHOST_EASE).

const SVGNS = 'http://www.w3.org/2000/svg'
const SPEED = 300

const el = (doc, tag, attrs, parent) => {
  const e = doc.createElementNS(SVGNS, tag)
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v)))
  parent?.appendChild(e)
  return e
}

afterEach(() => vi.restoreAllMocks())

describe('an exit label rides its ghost on the same clock', () => {
  it('starts from the ghost start, not from after the render', () => {
    const frames = []
    // The ghost started at 1000; the render ran on and the labels are
    // played at 1240, most of the way through the ghost's 300 ms.
    let now = 1240
    vi.spyOn(BrowserAPIs, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb)
      return frames.length
    })
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const doc = document.implementation.createDocument(SVGNS, 'svg', null)
    const root = doc.documentElement
    el(doc, 'g', { class: 'apexcharts-graphical' }, root)
    const ghost = el(
      doc,
      'path',
      {
        class: 'apexcharts-bar-ghost',
        'data:ghostKey': '0::c:d',
        'data:ghostEdge': 100,
        'data:ghostStart': 1000,
      },
      root,
    )
    const g = el(doc, 'g', { class: 'apexcharts-data-labels' })
    el(doc, 'text', { class: 'apexcharts-datalabel', cx: 5, cy: 40 }, g)

    // jsdom cannot match an escaped `data\:ghostKey` selector, so this
    // answers it the way a browser would.
    const real = root.querySelector.bind(root)
    vi.spyOn(root, 'querySelector').mockImplementation((s) =>
      s.startsWith('.apexcharts-bar-ghost[') ? ghost : real(s),
    )

    playExitLabels({
      config: {
        chart: {
          animations: { easing: 'linear', dynamicAnimation: { speed: SPEED } },
        },
      },
      dom: { baseEl: root, elGraphical: { node: root.firstElementChild } },
      globals: {
        isBarHorizontal: false,
        riseLabels: null,
        exitLabels: [
          { realIndex: 0, node: g, key: '0::c:d', oldX: [], oldY: [] },
        ],
      },
    })

    now = 1250
    frames.splice(0).forEach((cb) => cb(now))
    // 250 of 300 ms in, on the ghost's cubic ease out.
    const raw = 250 / SPEED
    const eased = 1 - Math.pow(1 - raw, 3)
    expect(Number(g.getAttribute('opacity'))).toBeCloseTo(1 - eased, 6)
    expect(g.querySelector('text').getAttribute('transform')).toBe(
      `translate(0 ${60 * eased})`,
    )
  })
})
