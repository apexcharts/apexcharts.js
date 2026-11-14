import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import {
  rafTween,
  startTweenLater,
  stillMoving,
} from '../../src/modules/animations/LengthTransition.js'
import { finishChromeTweens } from '../../src/modules/animations/AxisTransition.js'

// rafTween ran every tween to its end. A scatter updated faster than its
// morph kept riding the markers of every superseded render, nodes no longer
// on the page, one callback per marker per frame. It now takes an optional
// liveness check and returns a cancel; the marker rides stop once their
// marker is replaced, and a live tween lands exactly as before. Each tween
// counts as running until it lands or stops, so that stillMoving can tell
// when a scatter's markers, which ride past its animationEnded, have landed.

function fakeClock() {
  let queue = []
  let t = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => t)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    queue.push(cb)
    return queue.length
  })
  return {
    /** Run one frame `dt` ms on; returns how many callbacks it ran. */
    frame(dt = 16) {
      t += dt
      const q = queue
      queue = []
      q.forEach((cb) => cb(t))
      return q.length
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('rafTween', () => {
  const w = { globals: { isDestroyed: false } }

  it('keeps its signature: runs to the end and calls onDone', () => {
    const clock = fakeClock()
    const seen = []
    const done = vi.fn()
    rafTween(w, 100, (t) => t, (e) => seen.push(e), done)
    clock.frame(50)
    clock.frame(50)
    clock.frame(50)
    expect(seen).toEqual([0.5, 1])
    expect(done).toHaveBeenCalledTimes(1)
  })

  it('returns a cancel that stops it without onDone', () => {
    const clock = fakeClock()
    const seen = []
    const done = vi.fn()
    const cancel = rafTween(w, 100, (t) => t, (e) => seen.push(e), done)
    clock.frame(25)
    cancel()
    expect(clock.frame(25)).toBe(1)
    expect(clock.frame(25)).toBe(0)
    expect(seen).toEqual([0.25])
    expect(done).not.toHaveBeenCalled()
  })

  it('stops once its liveness check fails', () => {
    const clock = fakeClock()
    let alive = true
    const seen = []
    const done = vi.fn()
    rafTween(w, 100, (t) => t, (e) => seen.push(e), done, () => alive)
    clock.frame(25)
    alive = false
    clock.frame(25)
    expect(clock.frame(25)).toBe(0)
    expect(seen).toEqual([0.25])
    expect(done).not.toHaveBeenCalled()
  })

  it('counts as moving until it lands, is cancelled or fails its liveness check', () => {
    const clock = fakeClock()
    const chartW = { globals: { isDestroyed: false, animationEnded: true } }
    let alive = true
    rafTween(chartW, 100, (t) => t, () => {})
    const cancel = rafTween(chartW, 100, (t) => t, () => {})
    rafTween(chartW, 100, (t) => t, () => {}, undefined, () => alive)
    expect(stillMoving(chartW)).toBe(true)

    cancel()
    alive = false
    clock.frame(50)
    expect(chartW.globals.liveTweens.size).toBe(1)
    clock.frame(50)
    expect(stillMoving(chartW)).toBe(false)
  })
})

const pts = (n, seed = 0) =>
  Array.from({ length: n }, (_, i) => [i, ((i + seed) * 7) % 23])

async function scatter() {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'scatter',
      width: 600,
      height: 300,
      animations: {
        enabled: true,
        speed: 1,
        dynamicAnimation: { enabled: true, speed: 320 },
      },
    },
    dataLabels: { enabled: false },
    xaxis: { type: 'numeric' },
    series: [
      { name: 'A', data: pts(30) },
      { name: 'B', data: pts(30, 4) },
    ],
  })
  await chart.render()
  return chart
}

describe('superseded marker rides stop', () => {
  it('a second update stops the first one\'s rides, the live ones land', async () => {
    const chart = await scatter()
    const clock = fakeClock()
    const root = chart.w.dom.baseEl
    const markers = () => [...root.querySelectorAll('.apexcharts-marker[j]')]

    await chart.updateSeries([{ data: pts(30, 1) }, { data: pts(30, 5) }])
    const first = markers()
    clock.frame()
    await chart.updateSeries([{ data: pts(30, 2) }, { data: pts(30, 6) }])
    const second = markers()
    expect(first.every((n) => !n.isConnected)).toBe(true)

    // Writes to the replaced markers from here on.
    let dead = 0
    const orig = Element.prototype.setAttribute
    vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (
      k,
      v,
    ) {
      if (k === 'transform' && first.includes(this)) dead++
      return orig.call(this, k, v)
    })
    // Before: 120 writes (60 dead rides, every frame). After: none.
    clock.frame()
    clock.frame()
    expect(dead).toBe(0)

    // The live rides are untouched: mid-flight value, then they land.
    for (let i = 0; i < 8; i++) clock.frame()
    expect(second[7].getAttribute('transform')).toBe(MID)
    for (let i = 0; i < 30; i++) clock.frame()
    expect(second.some((n) => n.hasAttribute('transform'))).toBe(false)
    chart.destroy()
  })
})

const MID = 'translate(0, 34.019999999999996)'

// stillMoving answers for the render on screen: a tween cut short, or one
// of a render since replaced, no longer counts, however long it had to run.
describe('stillMoving counts what still moves', () => {
  async function line(dynamicSpeed) {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'line',
        width: 600,
        height: 300,
        animations: { speed: 1, dynamicAnimation: { speed: dynamicSpeed } },
      },
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] },
      series: [{ name: 'A', data: [3, 4, 3, 5, 4, 6, 7, 9] }],
    })
    await chart.render()
    return chart
  }
  // the same data range: the fast path, which skips create()
  const fast = (c) => c._updateStats.fast + c._updateStats.fastWithAxes
  const UPDATES = [
    ['a full render', (c) => c.updateOptions({ title: { text: 'T' } }), 0],
    [
      'a data-only update',
      (c) => c.updateSeries([{ name: 'A', data: [4, 3, 5, 4, 6, 5, 9, 3] }]),
      1,
    ],
  ]
  for (const [name, update, fastRuns] of UPDATES) {
    it(`${name} drops a tween of the render it replaces`, async () => {
      const chart = await line(300)
      const clock = fakeClock()
      // no liveness check, as a data label or treemap tile tween runs
      rafTween(chart.w, 60000, (t) => t, () => {})
      expect(stillMoving(chart.w)).toBe(true)

      await update(chart)
      expect(fast(chart)).toBe(fastRuns)
      for (let i = 0; i < 60; i++) clock.frame()
      expect(stillMoving(chart.w)).toBe(false)
      chart.destroy()
    })

    // as a staggered data label holds its tween back until its bar starts
    it(`${name} drops a tween start the render it replaces held back`, async () => {
      const chart = await line(300)
      vi.useFakeTimers({ toFake: ['setTimeout'] })
      const started = []
      startTweenLater(chart.w, 100, () => started.push('replaced'))

      await update(chart)
      expect(fast(chart)).toBe(fastRuns)
      startTweenLater(chart.w, 100, () => started.push('on screen'))
      vi.advanceTimersByTime(100)
      expect(started).toEqual(['on screen'])
      chart.destroy()
    })
  }

  // A render's set is there from its start, not from its first tween: a start
  // held back before that tween would read as another render's.
  const RENDERS = [['the first render', async () => {}], UPDATES[1]]
  for (const [name, update] of RENDERS) {
    it(`a tween start ${name} holds back before its first tween still runs`, async () => {
      const chart = await line(300)
      await update(chart)
      vi.useFakeTimers({ toFake: ['setTimeout'] })
      const started = []
      startTweenLater(chart.w, 100, () => started.push('held'))
      rafTween(chart.w, 50, (t) => t, () => {})
      vi.advanceTimersByTime(100)
      expect(started).toEqual(['held'])
      chart.destroy()
    })
  }

  it('an axis tween landed early stops counting', async () => {
    const chart = await line(60000)
    const clock = fakeClock()
    await chart.updateSeries([{ data: [30, 40, 30, 50, 40, 60, 70, 90] }])
    const gl = chart.w.globals
    const chrome = gl.chromeTweens.size
    const live = gl.liveTweens.size
    expect(chrome).toBeGreaterThan(0)

    finishChromeTweens(chart.w)
    clock.frame()
    expect(gl.liveTweens.size).toBe(live - chrome)
    chart.destroy()
  })
})
