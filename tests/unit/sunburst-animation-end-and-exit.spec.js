// Users saw chart.events.animationEnd never fire on a sunburst (and a parent
// resize wait out its give-up deadline before reflowing), and an arc removed
// by a data update vanish at frame 0 instead of collapsing out with the morph.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/sunburst.js'

const abc = [{ data: [{ x: 'A', y: 40 }, { x: 'B', y: 30 }, { x: 'C', y: 30 }] }]
const nested = (other = true, v = 10) => [
  {
    data: [
      {
        x: 'root',
        children: [
          { x: 'mid', children: [{ x: 'leaf', y: v }, { x: 'leaf2', y: 5 }] },
          ...(other ? [{ x: 'other', y: 40 }] : []),
        ],
      },
    ],
  },
]
const anim = (speed, dyn) => ({ enabled: true, speed, dynamicAnimation: { enabled: true, speed: dyn } })

function create(o = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    series: abc,
    ...o,
    plotOptions: { sunburst: { spacing: 0 } },
    chart: { type: 'sunburst', width: 500, height: 500, ...o.chart },
  })
}
const arcs = (name) =>
  [...document.querySelectorAll('.apexcharts-sunburst-arc')].filter(
    (el) => el.getAttribute('data:name') === name,
  )

describe('sunburst animation lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
  })
  afterEach(() => vi.useRealTimers())

  it('marks the animation over at once with animations off', async () => {
    const c = create({ chart: { animations: { enabled: false } } })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(50)
    await p
    expect(c.w.globals.animationEnded).toBe(true)
    c.destroy()
  })

  it('fires animationEnd when the intro and each update land', async () => {
    const spy = vi.fn()
    const c = create({
      chart: {
        animations: { enabled: true, speed: 300, dynamicAnimation: { enabled: true, speed: 400 } },
        events: { animationEnd: spy },
      },
    })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(100)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    await p
    expect(c.w.globals.animationEnded).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)

    const up = c.updateSeries([{ data: [{ x: 'A', y: 10 }, { x: 'B', y: 60 }, { x: 'C', y: 30 }] }])
    await vi.advanceTimersByTimeAsync(100)
    await up
    expect(c.w.globals.animationEnded).toBe(false)
    await vi.advanceTimersByTimeAsync(2000)
    expect(spy).toHaveBeenCalledTimes(2)
    c.destroy()
  })

  it('collapses a removed arc out with the update', async () => {
    const c = create({
      chart: { animations: { enabled: true, speed: 300, dynamicAnimation: { enabled: true, speed: 800 } } },
    })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(2000)
    await p
    const before = arcs('B')[0].getAttribute('d')

    const up = c.updateSeries([{ data: [{ x: 'A', y: 40 }, { x: 'C', y: 30 }] }])
    await vi.advanceTimersByTimeAsync(200)
    await up
    const [ghost] = arcs('B')
    expect(ghost).toBeTruthy()
    expect(ghost.style.display).not.toBe('none')
    const op = parseFloat(ghost.getAttribute('opacity'))
    expect(op).toBeGreaterThan(0)
    expect(op).toBeLessThan(1)
    expect(ghost.getAttribute('d')).not.toBe(before)

    await vi.advanceTimersByTimeAsync(2000)
    expect(ghost.style.display).toBe('none')
    c.destroy()
  })

  it('does not end an update when the replaced render lands first', async () => {
    const spy = vi.fn()
    const c = create({ chart: { animations: anim(300, 1000), events: { animationEnd: spy } } })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(150)
    const up = c.updateSeries([{ data: [{ x: 'A', y: 10 }, { x: 'B', y: 60 }, { x: 'C', y: 30 }] }])
    await vi.advanceTimersByTimeAsync(350)
    await p
    await up
    expect(spy).not.toHaveBeenCalled()
    expect(c.w.globals.animationEnded).toBe(false)
    await vi.advanceTimersByTimeAsync(2000)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(c.w.globals.animationEnded).toBe(true)
    c.destroy()
  })

  it('keeps collapsing a removed arc through a zoom', async () => {
    const c = create({ series: nested(), chart: { animations: anim(300, 800) } })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(2000)
    await p
    const up = c.updateSeries(nested(false))
    await vi.advanceTimersByTimeAsync(200)
    await up
    arcs('mid')[0].dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(3000)
    expect(arcs('other')[0].style.display).toBe('none')
    c.destroy()
  })

  it('keeps collapsing a removed arc through a second update', async () => {
    const c = create({ series: nested(), chart: { animations: anim(300, 800) } })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(2000)
    await p
    let up = c.updateSeries(nested(false))
    await vi.advanceTimersByTimeAsync(300)
    await up
    const op0 = parseFloat(arcs('other')[0].getAttribute('opacity'))
    expect(op0).toBeGreaterThan(0)
    expect(op0).toBeLessThan(1)
    up = c.updateSeries(nested(false, 20))
    await vi.advanceTimersByTimeAsync(50)
    await up
    const [ghost] = arcs('other')
    expect(ghost).toBeTruthy()
    expect(ghost.style.display).not.toBe('none')
    const op = parseFloat(ghost.getAttribute('opacity'))
    expect(op).toBeGreaterThan(0)
    expect(op).toBeLessThanOrEqual(op0)
    await vi.advanceTimersByTimeAsync(2000)
    expect(ghost.style.display).toBe('none')
    c.destroy()
  })
})
