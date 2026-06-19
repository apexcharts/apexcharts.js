import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ApexCharts from '../../src/entries/full.js'

// Regression test for the draw-animation race reported on react-apexcharts#602:
//   "Cannot read properties of null (reading 'node')" in runMaskReveal
// render() schedules a requestAnimationFrame to run the area-chart mask reveal.
// If the chart is destroyed before that frame fires (e.g. React StrictMode
// mounts -> unmounts -> remounts), clearDomElements() has nulled w.dom.elDefs,
// and the stale rAF callback then dereferenced w.dom.elDefs.node and threw.
// The deferred animation callbacks must bail when the chart was destroyed.

describe('destroy() before queued draw animation runs (#602)', () => {
  /** @type {Array<FrameRequestCallback>} */
  let rafQueue
  let realRaf

  beforeEach(() => {
    rafQueue = []
    realRaf = window.requestAnimationFrame
    // Capture rAF callbacks instead of running them, so we control when (and
    // whether) the post-render animation frame fires relative to destroy().
    window.requestAnimationFrame = vi.fn((cb) => {
      rafQueue.push(cb)
      return rafQueue.length
    })
  })

  afterEach(() => {
    window.requestAnimationFrame = realRaf
    document.body.innerHTML = ''
  })

  const flushRaf = () => {
    // drain the queue (callbacks may schedule more frames)
    let guard = 0
    while (rafQueue.length && guard++ < 1000) {
      const cb = rafQueue.shift()
      cb(performance.now())
    }
  }

  it('does not throw when the area-chart reveal frame fires after destroy', () => {
    document.body.innerHTML = '<div id="chart" />'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'area', animations: { enabled: true } },
      series: [{ name: 'A', data: [10, 41, 35, 51, 49, 62, 69, 91, 148] }],
      xaxis: { type: 'category' },
    })
    chart.render()

    // a draw-animation frame should have been queued by render()
    expect(rafQueue.length).toBeGreaterThan(0)

    // chart goes away before the frame runs (StrictMode unmount)
    chart.destroy()

    // the stale frame now fires — must be a no-op, not a crash
    expect(() => flushRaf()).not.toThrow()
  })
})
