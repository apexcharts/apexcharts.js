// An intersect tooltip (tooltip.intersect with shared: false, which a
// chart with marker click events also gets) on markers of several series
// drawn at the same spot. Only the topmost marker can be under the pointer,
// so the tooltip listed that one series and markerClick, dataPointSelection
// and click named that one point: the series under it were unreachable
// (apexcharts.js#4778). The tooltip now lists every series drawn there, and
// the events keep the topmost point and add the whole set as `coincident`.
import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
// Jul (6): all four series at 15. Feb (1): S1 and S2 at 20. Jan (0): apart.
const values = [
  [10, 20, 30, 40, 40, 20, 15, 40],
  [20, 20, 20, 30, 30, 15, 15, 20],
  [40, 30, 25, 10, 10, 20, 15, 35],
  [50, 40, 35, 30, 20, 25, 15, 30],
]

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
})

async function mount(options = {}, events = []) {
  chart = createChartWithOptions({
    chart: {
      type: 'line',
      height: 400,
      width: 800,
      events: {
        markerClick: (_e, _c, cfg) => events.push(['markerClick', cfg]),
        dataPointSelection: (_e, _c, cfg) =>
          events.push(['dataPointSelection', cfg]),
        click: (_e, _c, cfg) => events.push(['click', cfg]),
      },
    },
    series: values.map((v, i) => ({
      name: 'S' + (i + 1),
      data: v.map((y, j) => ({ x: months[j], y })),
    })),
    markers: { size: 5 },
    tooltip: { intersect: true, shared: false },
    ...options,
  })
  await tick()
  return chart
}

/** The marker drawn last at point j: the one a pointer there is over. */
function topmost(j) {
  const ms = chart.el.querySelectorAll(`.apexcharts-marker[rel="${j}"]`)
  // the series drawn last whose marker sits where every other one does
  return ms[ms.length - 1]
}

function markerOf(i, j) {
  return chart.el.querySelector(`.apexcharts-marker[index="${i}"][rel="${j}"]`)
}

async function hover(el) {
  for (const type of ['mouseover', 'mousemove']) {
    el.dispatchEvent(
      new MouseEvent(type, { bubbles: true, clientX: 100, clientY: 100 }),
    )
  }
  await tick()
}

async function click(el) {
  for (const type of ['mousedown', 'mouseup']) {
    const ev = new MouseEvent(type, {
      bubbles: true,
      button: 0,
      clientX: 100,
      clientY: 100,
    })
    // jsdom leaves `which` at 0; the chart's click event wants the left button
    Object.defineProperty(ev, 'which', { value: 1 })
    el.dispatchEvent(ev)
  }
  await tick()
}

/** The tooltip rows on show, as "name: value", top to bottom. */
function rows() {
  return [...chart.el.querySelectorAll('.apexcharts-tooltip-series-group')]
    .filter((r) => r.isConnected && r.style.display !== 'none')
    .sort((a, b) => (+a.style.order || 0) - (+b.style.order || 0))
    .map((r) => r.querySelector('.apexcharts-tooltip-text').textContent)
}

const points = (cfg) =>
  cfg.coincident?.map((p) => [p.seriesIndex, p.dataPointIndex])

describe('intersect tooltip on coincident markers', () => {
  it('lists every series drawn at the hovered spot, in series order', async () => {
    await mount()
    await hover(topmost(6))
    expect(rows()).toEqual(['S1: 15', 'S2: 15', 'S3: 15', 'S4: 15'])
    expect(
      chart.el.querySelector('.apexcharts-tooltip-title').textContent,
    ).toBe('Jul')
  })

  it('lists only the series that share the spot', async () => {
    await mount()
    await hover(markerOf(1, 1))
    expect(rows()).toEqual(['S1: 20', 'S2: 20'])
  })

  it('keeps the single row for a marker no other series shares', async () => {
    await mount()
    await hover(topmost(6))
    await hover(markerOf(2, 0))
    expect(rows()).toEqual(['S3: 40'])
  })

  it('follows tooltip.inverseOrder', async () => {
    await mount({
      tooltip: { intersect: true, shared: false, inverseOrder: true },
    })
    await hover(topmost(6))
    expect(rows()).toEqual(['S4: 15', 'S3: 15', 'S2: 15', 'S1: 15'])
  })

  it('leaves out series tooltip.enabledOnSeries does not name', async () => {
    await mount({
      tooltip: { intersect: true, shared: false, enabledOnSeries: [0, 3] },
    })
    await hover(topmost(6))
    expect(rows()).toEqual(['S1: 15', 'S4: 15'])
  })

  it('leaves out a collapsed series', async () => {
    await mount()
    chart.hideSeries('S2')
    await tick()
    await hover(topmost(6))
    expect(rows()).toEqual(['S1: 15', 'S3: 15', 'S4: 15'])
  })

  it('leaves out empty series under hideEmptySeries, but never the hovered one', async () => {
    await mount({
      series: [
        { name: 'A', data: [0, 5, 3] },
        { name: 'B', data: [0, 5, 2] },
        { name: 'C', data: [0, 1, 4] },
      ],
      xaxis: { categories: ['a', 'b', 'c'] },
      tooltip: { intersect: true, shared: false, hideEmptySeries: true },
    })
    await hover(topmost(0))
    expect(rows()).toEqual(['C: 0'])
    await hover(markerOf(1, 1))
    expect(rows()).toEqual(['A: 5', 'B: 5'])
  })
})

describe('intersect tooltip on coincident markers, a row per series', () => {
  // A radar tooltip keeps a row for every series and shows the hovered one's
  it('shows the row of each series drawn at the spot', async () => {
    await mount({
      chart: { type: 'radar', height: 400, width: 600 },
      series: [
        { name: 'A', data: [5, 3, 4] },
        { name: 'B', data: [5, 4, 2] },
        { name: 'C', data: [1, 2, 3] },
      ],
      xaxis: { categories: ['x', 'y', 'z'] },
    })
    await hover(markerOf(1, 0))
    expect(rows()).toEqual(['A: 5', 'B: 5'])
    await hover(markerOf(2, 0))
    expect(rows()).toEqual(['C: 1'])
  })
})

describe('marker events on coincident markers', () => {
  it('keep the topmost point and add every coincident one', async () => {
    const events = []
    await mount({}, events)
    await hover(topmost(6))
    await click(topmost(6))

    const byName = Object.fromEntries(events)
    for (const name of ['markerClick', 'dataPointSelection', 'click']) {
      expect(byName[name], name).toBeTruthy()
      expect(byName[name].seriesIndex, name).toBe(3)
      expect(Number(byName[name].dataPointIndex), name).toBe(6)
      expect(points(byName[name]), name).toEqual([
        [0, 6],
        [1, 6],
        [2, 6],
        [3, 6],
      ])
    }
  })

  it('name only the clicked point where no other series is drawn', async () => {
    const events = []
    await mount({}, events)
    await hover(markerOf(2, 0))
    await click(markerOf(2, 0))

    const byName = Object.fromEntries(events)
    for (const name of ['markerClick', 'dataPointSelection', 'click']) {
      expect(byName[name].seriesIndex, name).toBe(2)
      expect(Number(byName[name].dataPointIndex), name).toBe(0)
      expect(points(byName[name]), name).toEqual([[2, 0]])
    }
  })
})
