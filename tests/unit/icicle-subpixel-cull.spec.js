/**
 * A cell under half a pixel along the value axis draws nothing a reader can
 * see or point at, and on flame-graph data most cells are that thin. The
 * icicle skips their element, their listeners and their tween; a zoom that
 * makes them wide brings them back, and nothing (tooltip, click) can reach a
 * cell that was never drawn. Counted by cells in the DOM, hover listeners
 * added to cells, and _animateCell calls.
 */
import { vi } from 'vitest'
import ApexCharts from '../../src/entries/icicle.js'
import IcicleChart from '../../src/charts/Icicle.js'
import { createChartWithOptions } from './utils/utils.js'

const LEAVES = 400

// 'small' is a few pixels wide; each of its leaves is ~0.006px. Zoomed into,
// 'small' fills the plot and every leaf is wider than a pixel.
function options() {
  return {
    chart: { type: 'icicle', width: 640, height: 400 },
    series: [
      {
        data: [
          {
            x: 'root',
            children: [
              { x: 'big', y: 100000 },
              {
                x: 'small',
                children: Array.from({ length: LEAVES }, (_, k) => ({
                  x: `leaf${k}`,
                  y: 1,
                })),
              },
            ],
          },
        ],
      },
    ],
  }
}

const cells = () => [...document.querySelectorAll('.apexcharts-icicle-cell')]
const shown = () => cells().filter((el) => el.style.display !== 'none')
const named = (name) => cells().find((c) => c.getAttribute('data:name') === name)

let hoverListeners = 0
let restore = () => {}

beforeEach(() => {
  hoverListeners = 0
  const proto = window.Element.prototype
  const orig = proto.addEventListener
  proto.addEventListener = function (type, ...rest) {
    if (type === 'mousemove' && this.classList?.contains('apexcharts-icicle-cell')) {
      hoverListeners++
    }
    return orig.call(this, type, ...rest)
  }
  restore = () => (proto.addEventListener = orig)
})

afterEach(() => {
  restore()
  vi.restoreAllMocks()
})

describe('sub-pixel icicle cells are culled', () => {
  it('draws, wires and tweens only the cells wider than half a pixel', () => {
    const tweens = vi.spyOn(IcicleChart.prototype, '_animateCell')
    const chart = createChartWithOptions(options())

    // root, big, small: the leaves are never created
    expect(cells()).toHaveLength(3)
    expect(hoverListeners).toBe(3)
    expect(tweens).toHaveBeenCalledTimes(3)
    expect(named('leaf0')).toBeUndefined()
    // and no drawn cell is thinner than the cull line
    cells().forEach((el) => {
      expect(parseFloat(el.getAttribute('width'))).toBeGreaterThan(0)
    })
    chart.destroy()
  })

  it('a zoom that makes them wide brings them back, wired', () => {
    const chart = createChartWithOptions(options())
    named('small').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

    // big is outside the branch and leaves; every leaf is now on screen
    const leaves = shown().filter((el) => el.getAttribute('data:name').startsWith('leaf'))
    expect(leaves).toHaveLength(LEAVES)
    leaves.forEach((el) => {
      expect(parseFloat(el.getAttribute('width'))).toBeGreaterThan(0.5)
    })
    expect(hoverListeners).toBe(3 + LEAVES)

    // and zooming back out hides them again rather than leaving slivers
    named('small').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    expect(shown().map((el) => el.getAttribute('data:name')).sort()).toEqual([
      'big',
      'root',
      'small',
    ])
    chart.destroy()
  })
})

// With animations on, a culled cell still has a slot: a zoom or update moves
// it into or out of that sliver like any other cell, rather than collapsing it
// where it stood or growing it out of the middle of its new slot.
describe('sub-pixel icicle cells move with their branch', () => {
  const create = (series) => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      ...options(),
      ...(series && { series }),
      chart: { type: 'icicle', width: 640, height: 400 },
    })
    c.render()
    return c
  }
  // What a finished tween leaves behind (jsdom runs no frames).
  const settle = (inst) =>
    inst._nodesAll.forEach((n) => (n._cur = n._show ? inst._box(n) : null))
  let layouts
  beforeEach(() => {
    layouts = vi.spyOn(IcicleChart.prototype, '_applyLayout')
  })
  const latest = (spy) => spy.mock.contexts.at(-1)
  const callsFor = (spy, name) => spy.mock.calls.filter((a) => a[0].name === name)

  it('zooming in, the leaves open out of the sliver they sat in', () => {
    const tweens = vi.spyOn(IcicleChart.prototype, '_animateCell')
    const chart = create()
    settle(latest(layouts))
    named('small').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    const leaf0 = callsFor(tweens, 'leaf0')
    const leaf39 = callsFor(tweens, 'leaf39')
    expect(leaf0).toHaveLength(1)
    const [, from, to, , hide, fadeIn] = leaf0[0]
    expect(hide).toBe(false)
    expect(fadeIn).toBe(false)
    // from its sliver (inside the old 'small' span), not its new slot's centre
    expect(from.w).toBeLessThan(0.5)
    expect(from.x).toBeGreaterThan(630)
    expect(to.w).toBeGreaterThan(1)
    expect(leaf39[0][1].x).toBeGreaterThan(from.x)
    chart.destroy()
  })

  it('zooming out, the leaves ride into their sliver, then go', () => {
    const tweens = vi.spyOn(IcicleChart.prototype, '_animateCell')
    const chart = create()
    settle(latest(layouts))
    named('small').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    settle(latest(layouts))
    tweens.mockClear()
    named('small').dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    const small = callsFor(tweens, 'small')[0][2]
    ;['leaf0', 'leaf39', `leaf${LEAVES - 1}`].forEach((name) => {
      const [[, from, to, , hide]] = callsFor(tweens, name)
      expect(hide).toBe(true)
      expect(from.w).toBeGreaterThan(1)
      // into its slot inside 'small', not shrunk in place across the plot
      expect(to.w).toBeLessThan(0.5)
      expect(to.h).toBeGreaterThan(1)
      expect(to.x).toBeGreaterThanOrEqual(small.x - 0.01)
      expect(to.x + to.w).toBeLessThanOrEqual(small.x + small.w + 0.01)
    })
    // and stays opaque on the way, as a drawn cell would
    expect(named('leaf0').getAttribute('opacity')).toBe('1')
    chart.destroy()
  })

  it('an update that thins a cell below half a pixel tweens it there', async () => {
    const tree = (big) => [
      { data: [{ x: 'root', children: [{ x: 'big', y: big }, { x: 'a', y: 1 }] }] },
    ]
    const tweens = vi.spyOn(IcicleChart.prototype, '_animateCell')
    const chart = create(tree(1))
    settle(latest(layouts))
    await chart.updateSeries(tree(100000))
    const [[, from, to, , hide]] = callsFor(tweens, 'a')
    expect(hide).toBe(true)
    expect(from.w).toBeGreaterThan(100)
    expect(to.w).toBeLessThan(0.5)
    expect(to.x).toBeGreaterThan(630)
    chart.destroy()
  })

  it('an update that widens a sliver grows it out of that sliver', async () => {
    const tree = (big) => [
      { data: [{ x: 'root', children: [{ x: 'big', y: big }, { x: 'a', y: 1 }] }] },
    ]
    const tweens = vi.spyOn(IcicleChart.prototype, '_animateCell')
    const chart = create(tree(100000))
    settle(latest(layouts))
    await chart.updateSeries(tree(1))
    const [[, from, to, , hide, fadeIn]] = callsFor(tweens, 'a')
    expect(hide).toBe(false)
    expect(fadeIn).toBe(false)
    expect(from.w).toBeLessThan(0.5)
    expect(from.x).toBeGreaterThan(630)
    expect(to.w).toBeGreaterThan(100)
    chart.destroy()
  })
})
