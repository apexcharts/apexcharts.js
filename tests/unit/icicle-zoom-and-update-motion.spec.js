// Users saw a zoomed icicle snap back to the root on resize, legend toggle or
// live update; labels fade in over cells still moving after a quick re-click;
// an update landing during the intro snap every cell to its target before
// tweening; and click-zoom keep animating with dynamicAnimation turned off.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/icicle.js'

const deep = () => [
  {
    data: [
      {
        x: 'root',
        children: [
          { x: 'mid', children: [{ x: 'leaf', y: 10 }] },
          { x: 'other', y: 40 },
        ],
      },
    ],
  },
]

function create(o) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    series: deep(),
    plotOptions: { icicle: { spacing: 0 } },
    ...o,
    chart: { type: 'icicle', width: 600, height: 400, ...o.chart },
  })
}
const cell = (name) =>
  [...document.querySelectorAll('.apexcharts-icicle-cell')].find(
    (el) => el.getAttribute('data:name') === name,
  )
const width = (name) => parseFloat(cell(name).getAttribute('width'))
const click = (name) =>
  cell(name).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))

describe('icicle zoom focus across renders', () => {
  it('survives a re-render and is dropped when its branch goes away', async () => {
    const c = create({ chart: { animations: { enabled: false } } })
    await c.render()
    click('mid')
    expect(width('mid')).toBeCloseTo(c.w.layout.gridWidth, 0)
    await c.updateOptions({ chart: { width: 620 } })
    expect(width('mid')).toBeCloseTo(c.w.layout.gridWidth, 0)
    expect(document.querySelector('.apexcharts-breadcrumb')).not.toBe(null)

    await c.updateSeries([{ data: [{ x: 'root', children: [{ x: 'other', y: 40 }, { x: 'new', y: 10 }] }] }])
    expect(c.w.globals.icicleFocusKey).toBe(null)
    expect(width('other')).toBeLessThan(c.w.layout.gridWidth)
    c.destroy()
  })

  it('is dropped when its branch becomes a leaf', async () => {
    const c = create({ chart: { animations: { enabled: false } } })
    await c.render()
    click('mid')
    await c.updateSeries([{ data: [{ x: 'root', children: [{ x: 'mid', y: 10 }, { x: 'other', y: 40 }] }] }])
    expect(c.w.globals.icicleFocusKey).toBe(null)
    expect(width('mid')).toBeLessThan(c.w.layout.gridWidth / 2)
    expect(document.querySelector('.apexcharts-breadcrumb')).toBe(null)
    c.destroy()
  })

  it('is dropped when its root becomes the lone root', async () => {
    const kid = (x) => ({ x, children: [{ x: x + 'a', y: 10 }, { x: x + 'b', y: 20 }] })
    const c = create({
      series: [{ data: [kid('R1'), kid('R2')] }],
      chart: { animations: { enabled: false } },
    })
    await c.render()
    click('R1')
    expect(c.w.globals.icicleFocusKey).not.toBe(null)
    await c.updateSeries([{ data: [kid('R1')] }])
    // A stale key would spend the next click on R1 clearing it, unseen.
    expect(c.w.globals.icicleFocusKey).toBe(null)
    c.destroy()
  })
})

describe('icicle animation clocks', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
  })
  afterEach(() => vi.useRealTimers())

  async function mounted(chart) {
    const c = create({ chart })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(3000)
    await p
    return c
  }

  for (const [label, dyn] of [
    ['enabled:false', { enabled: false }],
    ['speed:0', { enabled: true, speed: 0 }],
  ]) {
    it(`click-zoom lands at once with dynamicAnimation ${label}`, async () => {
      const c = await mounted({ animations: { enabled: true, speed: 300, dynamicAnimation: dyn } })
      click('mid')
      expect(width('mid')).toBeCloseTo(c.w.layout.gridWidth, 0)
      c.destroy()
    })
  }

  it('a superseded zoom does not reveal labels mid-flight', async () => {
    const c = await mounted({
      animations: { enabled: true, speed: 300, dynamicAnimation: { enabled: true, speed: 350 } },
    })
    const labels = document.querySelector('.apexcharts-icicle-labels')
    click('mid')
    await vi.advanceTimersByTimeAsync(100)
    click('mid') // back out: this zoom moves until t = 450
    await vi.advanceTimersByTimeAsync(340)
    expect(parseFloat(labels.getAttribute('opacity'))).toBe(0)
    await vi.advanceTimersByTimeAsync(1000)
    expect(parseFloat(labels.getAttribute('opacity'))).toBe(1)
    c.destroy()
  })

  it('an update during the intro tweens from the on-screen box', async () => {
    const series = [{ data: [{ x: 'A', y: 40 }, { x: 'B', y: 60 }] }]
    const c = create({
      series,
      chart: { animations: { enabled: true, speed: 1000, dynamicAnimation: { enabled: true, speed: 1000 } } },
    })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(0)
    await p
    await vi.advanceTimersByTimeAsync(150)
    const mid = width('B')
    const up = c.updateSeries(series)
    await vi.advanceTimersByTimeAsync(20)
    await up
    expect(Math.abs(width('B') - mid)).toBeLessThan(40)
    c.destroy()
  })
})
