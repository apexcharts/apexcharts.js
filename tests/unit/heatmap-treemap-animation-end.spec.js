// A heatmap and a treemap mark their animation over after every render, as
// the other chart types do, whether the render animated or not. A parent
// resize, the annotations and a screenshot harness wait for that mark, and
// chart.events.animationEnd fires on it.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const rows = (v) => [
  { name: 'a', data: [{ x: 'A', y: v }, { x: 'B', y: 20 }, { x: 'C', y: 30 }] },
  { name: 'b', data: [{ x: 'A', y: 5 }, { x: 'B', y: 25 }, { x: 'C', y: 35 }] },
]
const tiles = (v) => [{ data: [{ x: 'A', y: v }, { x: 'B', y: 20 }, { x: 'C', y: 30 }] }]
const animations = {
  on: { enabled: true, speed: 300, dynamicAnimation: { enabled: true, speed: 300 } },
  off: { enabled: false },
  'dynamicAnimation off': { enabled: true, speed: 300, dynamicAnimation: { enabled: false } },
}

function create(type, anim, o = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    series: type === 'heatmap' ? rows(10) : tiles(10),
    ...o,
    chart: { type, width: 500, height: 400, animations: anim, ...o.chart },
  })
}
// long enough for any tween here to land
const settle = async (p) => {
  await vi.advanceTimersByTimeAsync(2000)
  await p
}

describe('heatmap and treemap animation end', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
  })
  afterEach(() => vi.useRealTimers())

  describe.each([
    ['heatmap', rows],
    ['treemap', tiles],
  ])('%s', (type, data) => {
    it.each(Object.keys(animations))(
      'marks the animation over after the mount and each update, animations %s',
      async (name) => {
        const c = create(type, animations[name])
        const renders = {
          mount: () => c.render(),
          updateSeries: () => c.updateSeries(data(60)),
          'updateSeries, not animated': () => c.updateSeries(data(40), false),
          'updateOptions({ series })': () => c.updateOptions({ series: data(15) }),
          'updateOptions, a title': () => c.updateOptions({ title: { text: 'T' } }),
          'updateOptions, not animated': () =>
            c.updateOptions({ title: { text: 'U' } }, false, false),
          'a redraw from scratch': () => c.updateOptions({ series: data(12) }, true),
          'a redraw from scratch, not animated': () =>
            c.updateOptions({ series: data(13) }, true, false),
        }
        for (const [step, render] of Object.entries(renders)) {
          await settle(render())
          expect(c.w.globals.animationEnded, step).toBe(true)
        }
        c.destroy()
      },
    )
  })

  it('fires animationEnd once a heatmap update has landed', async () => {
    const animationEnd = vi.fn()
    const c = create('heatmap', animations.on, { chart: { events: { animationEnd } } })
    await settle(c.render())
    animationEnd.mockClear()

    const update = c.updateSeries(rows(60))
    await vi.advanceTimersByTimeAsync(100)
    await update
    expect(c.w.globals.animationEnded).toBe(false)
    expect(animationEnd).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    expect(c.w.globals.animationEnded).toBe(true)
    expect(animationEnd).toHaveBeenCalledOnce()
    c.destroy()
  })

  // Shaped cells are paths, and a new one pops in on a tween of its own.
  it('marks an update over when every cell of a shaped heatmap is new', async () => {
    const c = create('heatmap', animations.on, {
      series: [],
      plotOptions: { heatmap: { shape: 'circle' } },
    })
    await settle(c.render())

    await settle(c.updateSeries(rows(10)))
    expect(c.w.globals.animationEnded).toBe(true)
    c.destroy()
  })

  // dynamicAnimation off does not turn the type morph off.
  it('leaves a morph into a treemap to end the animation when it lands', async () => {
    const animationEnd = vi.fn()
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'bar',
        width: 500,
        height: 400,
        animations: {
          ...animations['dynamicAnimation off'],
          chartTypeMorph: { enabled: true, speed: 600 },
        },
        events: { animationEnd },
      },
      series: tiles(10),
    })
    await settle(c.render())
    animationEnd.mockClear()

    const update = c.updateOptions({ chart: { type: 'treemap' } })
    await vi.advanceTimersByTimeAsync(300)
    await update
    expect(c.w.globals.animationEnded).toBe(false)

    await vi.advanceTimersByTimeAsync(2000)
    expect(animationEnd).toHaveBeenCalledOnce()
    c.destroy()
  })
})
