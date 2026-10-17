import { describe, it, expect, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import { rafTween } from '../../src/modules/animations/LengthTransition.js'

// rafTween ran every tween to its end. A scatter updated faster than its
// morph kept riding the markers of every superseded render, nodes no longer
// on the page, one callback per marker per frame. It now takes an optional
// liveness check and returns a cancel; the marker rides stop once their
// marker is replaced, and a live tween lands exactly as before.

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
