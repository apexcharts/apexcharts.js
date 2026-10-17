// The first placement of a shown tooltip blocks its left/top transition and
// clears the block a frame later, and a tooltip kept open across an update
// waits frames for the tween to land before it is drawn again. Where there
// is no frame clock (server rendering, or a DOM shim that has a window but
// no requestAnimationFrame) both run at once, rather than the call throwing
// and leaving `transition-property: none` stuck on the box or the replay
// lost.
import { describe, it, expect, vi, afterEach } from 'vitest'
import Position from '../../src/modules/tooltip/Position'
import { Environment } from '../../src/utils/Environment.js'
import { createChartWithOptions } from './utils/utils.js'

const rAF = window.requestAnimationFrame
/** A DOM shim without a frame clock: the window is there, the frame is not. */
const dropFrameClock = () => {
  window.requestAnimationFrame = /** @type {any} */ (undefined)
  vi.stubGlobal('requestAnimationFrame', undefined)
}

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
  window.requestAnimationFrame = rAF
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const position = () => new Position(/** @type {any} */ ({ w: {} }))

describe('first tooltip placement', () => {
  it('clears the transition block on the next frame in a browser', () => {
    /** @type {FrameRequestCallback[]} */
    const frames = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frames.push(cb)
      return frames.length
    })
    const el = document.createElement('div')
    position().applyTooltipPosition(el, { x: 4, y: 8 })
    expect(el.style.transitionProperty).toBe('none')
    expect(el.dataset.positioned).toBe('true')
    expect(frames.length).toBe(1)
    frames[0](0)
    expect(el.style.transitionProperty).toBe('')
  })

  it('clears it at once, without throwing, in a DOM shim with no frame clock', () => {
    expect(Environment.isSSR()).toBe(false)
    dropFrameClock()
    const el = document.createElement('div')
    expect(() =>
      position().applyTooltipPosition(el, { x: 4, y: 8 }),
    ).not.toThrow()
    expect(el.style.left).toBe('4px')
    expect(el.style.transitionProperty).toBe('')
  })

  it('clears it at once, without throwing, under server rendering', () => {
    vi.spyOn(Environment, 'isSSR').mockReturnValue(true)
    dropFrameClock()
    const el = document.createElement('div')
    expect(() =>
      position().applyTooltipPosition(el, { x: 4, y: 8 }),
    ).not.toThrow()
    expect(el.style.transitionProperty).toBe('')
  })
})

describe('a tooltip kept open across an update', () => {
  const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))
  const lineSeries = (/** @type {number} */ k) =>
    Array.from({ length: 3 }, (_, i) => ({
      name: `s${i}`,
      data: Array.from({ length: 12 }, (_, j) => ((i + 1) * (j + 3) + k) % 37),
    }))

  it('is drawn again at once, without throwing, in a DOM shim with no frame clock', async () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: lineSeries(0),
      tooltip: { shared: true, intersect: false },
    })
    await tick(30)
    const w = chart.w
    const x = w.layout.translateX + (w.layout.gridWidth / 11) * 4
    const y = w.layout.translateY + w.layout.gridHeight / 2
    w.dom.Paper.node.dispatchEvent(
      new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true }),
    )
    await tick(30)
    const tt = w.globals.tooltip
    const el = tt.getElTooltip()
    expect(el.classList.contains('apexcharts-active')).toBe(true)
    const hover = vi.spyOn(tt, 'seriesHover')

    // The update's tween never lands here, so the replay would wait frames.
    const g = w.globals
    Object.defineProperty(g, 'animationEnded', {
      configurable: true,
      get: () => false,
      set: () => {},
    })
    dropFrameClock()
    let error = null
    try {
      await chart.updateSeries(lineSeries(11))
    } catch (e) {
      error = e
    }
    delete g.animationEnded
    g.animationEnded = true

    expect(error).toBe(null)
    expect(chart._updateStats.fast).toBe(1)
    expect(hover).toHaveBeenCalledTimes(1)
    expect(el.classList.contains('apexcharts-active')).toBe(true)
  })
})
