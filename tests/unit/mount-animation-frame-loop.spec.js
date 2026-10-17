import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import Animations, {
  applyProgressiveReveal,
} from '../../src/modules/Animations.js'

// The mount animations (marker / label sweep, scatter pop, pen draw) share
// one requestAnimationFrame per chart per frame instead of one loop per
// element, stop when the chart is destroyed, and read every path length
// before writing any dash pattern. A scatter fires animationEnd when its
// LAST popped marker lands, not its first. Frames are driven by hand so
// every count is exact.

let queue
let clock
let thrown

beforeEach(() => {
  queue = []
  clock = 0
  thrown = []
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    queue.push(cb)
    return queue.length
  })
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

// Runs one frame and returns how many rAF callbacks it executed. As in a
// browser, a callback that throws does not stop the others: its error is
// kept in `thrown`.
function frame(dt = 16) {
  clock += dt
  const q = queue
  queue = []
  q.forEach((cb) => {
    try {
      cb(clock)
    } catch (e) {
      thrown.push(e)
    }
  })
  return q.length
}

function makeW() {
  return {
    config: {
      chart: {
        type: 'line',
        animations: { enabled: true, speed: 800 },
        events: {},
      },
    },
    globals: {
      dataChanged: false,
      resized: false,
      shouldAnimate: true,
      isDestroyed: false,
      animationEnded: false,
      delayedElements: [],
      cuid: 'c1',
    },
    layout: { gridWidth: 400, gridHeight: 200 },
    dom: {
      elDefs: {
        node: document.createElementNS('http://www.w3.org/2000/svg', 'defs'),
      },
    },
  }
}

const styled = () => ({ node: { style: {} } })

describe('progressive reveal runs on one frame loop per chart', () => {
  it('registers one rAF per frame for 500 swept elements', () => {
    const w = makeW()
    const els = []
    for (let i = 0; i < 500; i++) {
      const el = styled()
      els.push(el)
      applyProgressiveReveal(el, (i / 499) * 400, w)
    }
    expect(queue.length).toBe(1)
    let maxPerFrame = 0
    let frames = 0
    while (queue.length && frames < 500) {
      maxPerFrame = Math.max(maxPerFrame, frame())
      frames++
    }
    expect(maxPerFrame).toBe(1)
    expect(els.every((el) => el.node.style.opacity === '')).toBe(true)
  })

  it('reveals each element on the frame the pen reaches it', () => {
    const w = makeW()
    const xs = [0, 100, 200, 300, 400]
    const els = xs.map((x) => {
      const el = styled()
      applyProgressiveReveal(el, x, w)
      return el
    })
    const anchor = clock + 16
    const due = xs.map((x) => (1 - Math.cbrt(1 - x / 400)) * 1600)
    const shownAt = []
    while (queue.length) {
      frame()
      els.forEach((el, i) => {
        if (shownAt[i] === undefined && el.node.style.opacity === '') {
          shownAt[i] = clock
        }
      })
    }
    shownAt.forEach((t, i) => {
      // the first frame at or past the element's delay, never a frame later
      expect(t - anchor).toBeGreaterThanOrEqual(due[i])
      expect(t - 16 - anchor).toBeLessThan(due[i])
    })
  })

  it('stops polling once the chart is destroyed', () => {
    const w = makeW()
    for (let i = 0; i < 50; i++) applyProgressiveReveal(styled(), 399, w)
    frame()
    w.globals.isDestroyed = true
    frame()
    expect(queue.length).toBe(0)
  })
})

describe('scatter pop runs on one frame loop per chart', () => {
  it('registers one rAF per frame for 300 popping markers', () => {
    const w = makeW()
    const anim = new Animations(w)
    for (let i = 0; i < 300; i++) {
      anim.animatePop(styled(), { speed: 400, delay: i * 2 })
    }
    let maxPerFrame = 0
    while (queue.length) maxPerFrame = Math.max(maxPerFrame, frame())
    expect(maxPerFrame).toBe(1)
  })

  it('completes once, on the frame the last staggered pop lands', () => {
    const w = makeW()
    const anim = new Animations(w)
    const els = []
    const completedAt = []
    for (let i = 0; i < 300; i++) {
      const el = styled()
      els.push(el)
      anim.animatePop(el, {
        speed: 400,
        delay: i * 2,
        onComplete: () => {
          completedAt.push({
            clock,
            popping: els.filter((e) => e.node.style.transform !== '').length,
          })
        },
      })
    }
    while (queue.length) frame()
    expect(completedAt.length).toBe(1)
    // every marker is at rest when the animation is reported over
    expect(completedAt[0].popping).toBe(0)
    expect(completedAt[0].clock).toBeGreaterThanOrEqual(299 * 2 + 400)
  })

  it('does not complete after the chart is destroyed', () => {
    const w = makeW()
    const onComplete = vi.fn()
    new Animations(w).animatePop(styled(), { speed: 400, onComplete })
    frame()
    w.globals.isDestroyed = true
    while (queue.length) frame()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('fires animationEnd only after the last marker has landed', () => {
    document.body.innerHTML = '<div id="chart"></div>'
    let endedWith = null
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'scatter',
        width: 400,
        height: 300,
        animations: { enabled: true, speed: 400 },
        events: {
          animationEnd: () => {
            const markers = [
              ...document.querySelectorAll('#chart .apexcharts-marker'),
            ]
            endedWith = {
              total: markers.length,
              popping: markers.filter((m) => m.style.transform !== '').length,
            }
          },
        },
      },
      series: [
        { name: 'a', data: Array.from({ length: 40 }, (_, i) => [i, i % 7]) },
      ],
    })
    chart.render()
    let guard = 0
    while (queue.length && guard++ < 1000) frame()
    expect(endedWith).not.toBe(null)
    expect(endedWith.total).toBe(40)
    expect(endedWith.popping).toBe(0)
    chart.destroy()
  })
})

describe('pen draw reads every length before writing any dash', () => {
  function pathEl(log) {
    const attrs = {}
    return {
      node: {
        getAttribute: (k) => attrs[k] ?? null,
        getTotalLength: () => {
          log.push('R')
          return 100
        },
        setAttribute: (k, v) => {
          if (k === 'stroke-dasharray') log.push('W')
          attrs[k] = v
        },
        removeAttribute: (k) => delete attrs[k],
      },
    }
  }

  it('batches the reads ahead of the writes on one rAF', () => {
    const w = makeW()
    const anim = new Animations(w)
    const log = []
    for (let i = 0; i < 50; i++) {
      anim.animateDraw(pathEl(log), {
        realIndex: i,
        isFill: false,
        isLast: i === 49,
        speed: 1600,
        delay: 0,
      })
    }
    const callbacks = frame()
    // a read after a write forces a style and layout flush
    const readsAfterWrite = log.filter(
      (op, i) => op === 'R' && log.slice(0, i).includes('W'),
    ).length
    expect(readsAfterWrite).toBe(0)
    expect(log.length).toBe(100)
    expect(callbacks).toBe(1)
    let maxPerFrame = 0
    while (queue.length) maxPerFrame = Math.max(maxPerFrame, frame())
    expect(maxPerFrame).toBe(1)
    expect(w.globals.animationEnded).toBe(true)
  })
})

describe('a job that destroys the chart or throws spares the rest of the frame', () => {
  let errors
  let realSetTimeout

  beforeEach(() => {
    errors = []
    realSetTimeout = globalThis.setTimeout
    // The loop reports a job's error from a timer: keep it from failing the
    // run and record it, as every other timer runs as usual.
    vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn, ms, ...a) =>
      realSetTimeout(() => {
        try {
          fn(...a)
        } catch (e) {
          errors.push(e)
        }
      }, ms),
    )
  })

  afterEach(() => {
    delete window.SVGElement.prototype.getTotalLength
  })

  async function mountAndDrain(options) {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      ...options,
      chart: { width: 400, height: 300, ...options.chart },
    })
    chart.render()
    let guard = 0
    while (queue.length && guard++ < 1000) frame()
    await new Promise((r) => realSetTimeout(r, 20))
    errors.push(...thrown)
    return chart
  }

  const pts = (n) => Array.from({ length: n }, (_, i) => [i, (i % 5) + 1])

  it('runs nothing more once an animationEnd handler destroys the chart', async () => {
    // jsdom has no getTotalLength, so the first area's stroke finalizes in
    // the deferral frame and a combo ends the animation there; the next
    // area's mask write must not touch the torn-down defs.
    const chart = await mountAndDrain({
      chart: {
        type: 'line',
        animations: { enabled: true, speed: 400 },
        events: { animationEnd: (ctx) => ctx.destroy() },
      },
      series: [
        { name: 'a', type: 'area', data: pts(6) },
        { name: 'b', type: 'area', data: pts(6) },
        { name: 'c', type: 'line', data: pts(6) },
      ],
    })
    expect(chart.w.globals.isDestroyed).toBe(true)
    expect(errors.map(String)).toEqual([])
  })

  it('lands every scatter marker when the animationEnd handler throws', async () => {
    await mountAndDrain({
      chart: {
        type: 'line',
        animations: { enabled: true, speed: 400, largeDatasetThreshold: 5 },
        events: {
          animationEnd: () => {
            throw new Error('handler')
          },
        },
      },
      series: [
        { name: 'a', type: 'column', data: pts(12) },
        { name: 'b', type: 'scatter', data: pts(12) },
      ],
    })
    const stuck = [
      ...document.querySelectorAll('#chart .apexcharts-series .apexcharts-marker'),
    ].filter((m) => m.style.transform !== '' || m.style.opacity === '0')
    expect(stuck.length).toBe(0)
    // reported once, after the frame
    expect(errors.map(String)).toEqual(['Error: handler'])
  })

  it('finishes every pen draw when the animationEnd handler throws', async () => {
    window.SVGElement.prototype.getTotalLength = () => 100
    await mountAndDrain({
      chart: {
        type: 'line',
        animations: { enabled: true, speed: 400 },
        events: {
          animationEnd: () => {
            throw new Error('handler')
          },
        },
      },
      series: [
        { name: 'a', type: 'line', data: pts(6) },
        { name: 'b', type: 'area', data: pts(6) },
        { name: 'c', type: 'line', data: pts(6) },
      ],
    })
    const drawing = [
      ...document.querySelectorAll('#chart path[stroke-dashoffset]'),
    ]
    expect(drawing.length).toBe(0)
    expect(errors.map(String)).toEqual(['Error: handler'])
  })
})
