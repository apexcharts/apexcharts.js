// Users saw a zoomed sunburst snap back to the root on resize, legend toggle
// or live update; a click on the lone root raise a dead breadcrumb; arcs show
// a pointer with zoomOnClick off; labels fade in over arcs still moving after
// a quick re-click; and updateSeries(data, false) still animate.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/sunburst.js'

const deep = () => [
  {
    data: [
      {
        x: 'root',
        children: [
          { x: 'mid', children: [{ x: 'leaf', y: 10 }, { x: 'leaf2', y: 5 }] },
          { x: 'other', y: 40 },
        ],
      },
    ],
  },
]

function create(o = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    series: deep(),
    ...o,
    plotOptions: { sunburst: { spacing: 0, ...o.plotOptions?.sunburst } },
    chart: { type: 'sunburst', width: 500, height: 500, ...o.chart },
  })
}
const arc = (name) =>
  [...document.querySelectorAll('.apexcharts-sunburst-arc')].find(
    (el) => el.getAttribute('data:name') === name,
  )
const shown = (name) => {
  const a = arc(name)
  return !!a && a.style.display !== 'none' && a.getAttribute('opacity') !== '0'
}
const click = (name) =>
  arc(name).dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
const crumb = () => document.querySelector('.apexcharts-breadcrumb')
const off = { animations: { enabled: false } }

describe('sunburst zoom focus across renders', () => {
  it('survives a re-render and is dropped when its branch goes away', async () => {
    const c = create({ chart: off })
    await c.render()
    click('mid')
    expect(shown('other')).toBe(false)
    await c.updateOptions({ chart: { width: 520 } })
    expect(shown('other')).toBe(false)
    expect(crumb()).not.toBe(null)

    await c.updateSeries([{ data: [{ x: 'root', children: [{ x: 'other', y: 40 }, { x: 'new', y: 10 }] }] }])
    expect(c.w.globals.sunburstFocusKey).toBe(null)
    expect(shown('other')).toBe(true)
    expect(crumb()).toBe(null)
    c.destroy()
  })

  it('is dropped when its branch becomes a leaf', async () => {
    const c = create({ chart: off })
    await c.render()
    click('mid')
    await c.updateSeries([{ data: [{ x: 'root', children: [{ x: 'mid', y: 10 }, { x: 'other', y: 40 }] }] }])
    expect(c.w.globals.sunburstFocusKey).toBe(null)
    expect(shown('other')).toBe(true)
    c.destroy()
  })
})

describe('sunburst click affordance', () => {
  it('the lone root neither zooms nor offers a pointer', async () => {
    const c = create({ chart: off })
    await c.render()
    expect(arc('root').style.cursor).toBe('default')
    expect(arc('mid').style.cursor).toBe('pointer')
    click('root')
    expect(crumb()).toBe(null)
    c.destroy()
  })

  it('zoomOnClick: false leaves no pointer and no zoom', async () => {
    const c = create({ chart: off, plotOptions: { sunburst: { zoomOnClick: false } } })
    await c.render()
    expect(arc('mid').style.cursor).not.toBe('pointer')
    click('mid')
    expect(shown('other')).toBe(true)
    c.destroy()
  })
})

describe('sunburst zoom and update timing', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
  })
  afterEach(() => vi.useRealTimers())

  const mount = async (dynamicAnimation, series = deep()) => {
    const c = create({
      series,
      chart: { animations: { enabled: true, speed: 300, dynamicAnimation } },
    })
    const p = c.render()
    await vi.advanceTimersByTimeAsync(3000)
    await p
    return c
  }

  it('a superseded zoom does not reveal labels mid-flight', async () => {
    const c = await mount({ enabled: true, speed: 300 })
    const labels = document.querySelector('.apexcharts-sunburst-labels')
    click('mid')
    await vi.advanceTimersByTimeAsync(100)
    click('mid') // back out: this zoom moves for another 300 ms
    await vi.advanceTimersByTimeAsync(250)
    expect(parseFloat(labels.getAttribute('opacity'))).toBe(0)
    await vi.advanceTimersByTimeAsync(2000)
    expect(parseFloat(labels.getAttribute('opacity'))).toBe(1)
    c.destroy()
  })

  it('updateSeries(data, false) lands at once', async () => {
    const c = await mount({ enabled: true, speed: 800 }, [
      { data: [{ x: 'A', y: 40 }, { x: 'B', y: 60 }] },
    ])
    const up = c.updateSeries([{ data: [{ x: 'A', y: 80 }, { x: 'B', y: 20 }] }], false)
    await vi.advanceTimersByTimeAsync(20)
    await up
    const early = arc('B').getAttribute('d')
    await vi.advanceTimersByTimeAsync(3000)
    expect(arc('B').getAttribute('d')).toBe(early)
    c.destroy()
  })

  it('zooms at once with dynamicAnimation off', async () => {
    const c = await mount({ enabled: false })
    click('mid')
    await vi.advanceTimersByTimeAsync(20)
    expect(shown('other')).toBe(false)
    c.destroy()
  })
})
