// CoincidentMarkers: which series' points are drawn at a marker's spot, the
// set the intersect tooltip lists and the marker events name as
// `coincident` (apexcharts.js#4778). Found from an index of the rendered
// marker centres, built once a render, not by reading every marker each time.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import {
  coincidentPoints,
  markerSeriesIndex,
  COINCIDENT_TOLERANCE,
} from '../../src/modules/CoincidentMarkers.js'

const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms))

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
})

async function mount(options) {
  chart = createChartWithOptions({
    markers: { size: 5 },
    tooltip: { intersect: true, shared: false },
    ...options,
    chart: { height: 400, width: 800, ...options.chart },
  })
  await tick()
  return chart
}

const pairs = (pts) => pts?.map((p) => [p.seriesIndex, p.dataPointIndex])
const marker = (i, j) =>
  chart.el.querySelector(`.apexcharts-marker[index="${i}"][rel="${j}"]`)

const line = (data) => ({
  chart: { type: 'line' },
  series: data.map((d, i) => ({ name: 'S' + i, data: d })),
  xaxis: { categories: data[0].map((_, j) => 'c' + j) },
})

describe('coincidentPoints', () => {
  it('names the points of every series drawn at the spot, in series order', async () => {
    await mount(
      line([
        [1, 5, 9],
        [2, 5, 8],
        [3, 4, 9],
      ]),
    )
    expect(pairs(coincidentPoints(chart.w, { node: marker(2, 1) }))).toEqual([
      [2, 1],
    ])
    expect(pairs(coincidentPoints(chart.w, { node: marker(1, 1) }))).toEqual([
      [0, 1],
      [1, 1],
    ])
    expect(pairs(coincidentPoints(chart.w, { node: marker(0, 2) }))).toEqual([
      [0, 2],
      [2, 2],
    ])
    // by point, as markerClick asks
    expect(pairs(coincidentPoints(chart.w, { i: 2, j: 2 }))).toEqual([
      [0, 2],
      [2, 2],
    ])
  })

  it('reads the series the way the intersect tooltip does', async () => {
    await mount(line([[1, 2]]))
    expect(markerSeriesIndex(marker(0, 1))).toBe(0)
  })

  it('matches points of different indexes drawn at one spot (scatter)', async () => {
    await mount({
      chart: { type: 'scatter' },
      series: [
        {
          name: 'A',
          data: [
            [2, 5],
            [4, 7],
            [6, 1],
          ],
        },
        {
          name: 'B',
          data: [
            [1, 1],
            [3, 3],
            [5, 5],
            [4, 7],
          ],
        },
      ],
      xaxis: { type: 'numeric', min: 0, max: 8 },
    })
    expect(pairs(coincidentPoints(chart.w, { node: marker(1, 3) }))).toEqual([
      [0, 1],
      [1, 3],
    ])
    expect(pairs(coincidentPoints(chart.w, { node: marker(0, 0) }))).toEqual([
      [0, 0],
    ])
  })

  it('keeps apart points a pixel apart, and joins ones within the tolerance', async () => {
    await mount(
      line([
        [10, 10],
        [10, 10],
      ]),
    )
    const a = marker(0, 1)
    const b = marker(1, 1)
    const cy = parseFloat(a.getAttribute('cy'))
    b.setAttribute('cy', String(cy + COINCIDENT_TOLERANCE * 0.5))
    expect(pairs(coincidentPoints(chart.w, { node: a }))).toEqual([
      [0, 1],
      [1, 1],
    ])
    b.setAttribute('cy', String(cy + 1))
    expect(pairs(coincidentPoints(chart.w, { node: a }))).toEqual([[0, 1]])
  })

  it('leaves out collapsed series', async () => {
    await mount(
      line([
        [1, 5],
        [2, 5],
        [3, 5],
      ]),
    )
    chart.hideSeries('S1')
    await tick()
    expect(pairs(coincidentPoints(chart.w, { node: marker(2, 1) }))).toEqual([
      [0, 1],
      [2, 1],
    ])
  })

  it('is null for a node that is not a point marker, or a point with none', async () => {
    await mount({
      chart: { type: 'line' },
      series: [
        { name: 'col', type: 'column', data: [3, 4] },
        { name: 'line', type: 'line', data: [3, 4] },
      ],
      xaxis: { categories: ['a', 'b'] },
    })
    const bar = chart.el.querySelector('.apexcharts-bar-area')
    expect(coincidentPoints(chart.w, { node: bar })).toBeNull()
    expect(coincidentPoints(chart.w, { i: 0, j: 1 })).toBeNull()
    expect(pairs(coincidentPoints(chart.w, { i: 1, j: 1 }))).toEqual([[1, 1]])
  })

  it('indexes the markers once a render, however often it is asked', async () => {
    const n = 300
    await mount(
      line([
        Array.from({ length: n }, (_, j) => j % 7),
        Array.from({ length: n }, (_, j) => j % 5),
        Array.from({ length: n }, (_, j) => j % 3),
      ]),
    )
    const root = chart.w.dom.elGraphical.node
    const spy = vi.spyOn(root, 'querySelectorAll')
    const scans = () =>
      spy.mock.calls.filter(([sel]) => /apexcharts-marker/.test(sel)).length
    for (let j = 0; j < n; j += 3) {
      coincidentPoints(chart.w, { node: marker(0, j) })
      coincidentPoints(chart.w, { i: 1, j })
    }
    expect(scans()).toBe(1)
    // A point with no marker looks once more, in case the markers were drawn
    // again in place, and is then remembered as having none.
    for (let k = 0; k < 5; k++) coincidentPoints(chart.w, { i: 7, j: 0 })
    expect(scans()).toBe(2)
    spy.mockRestore()

    // j = 0 (mod 105): 0 in all three series
    expect(pairs(coincidentPoints(chart.w, { node: marker(0, 105) }))).toEqual([
      [0, 105],
      [1, 105],
      [2, 105],
    ])
  })

  it('follows a new render, and a marker moved since the index was taken', async () => {
    await mount(
      line([
        [1, 5],
        [2, 5],
      ]),
    )
    expect(pairs(coincidentPoints(chart.w, { node: marker(0, 1) }))).toEqual([
      [0, 1],
      [1, 1],
    ])
    await chart.updateSeries([
      { name: 'S0', data: [1, 5] },
      { name: 'S1', data: [2, 6] },
    ])
    await tick()
    expect(pairs(coincidentPoints(chart.w, { node: marker(0, 1) }))).toEqual([
      [0, 1],
    ])

    // moved onto the other series' marker after the index was built
    const a = marker(0, 1)
    const b = marker(1, 1)
    a.setAttribute('cx', b.getAttribute('cx'))
    a.setAttribute('cy', b.getAttribute('cy'))
    expect(pairs(coincidentPoints(chart.w, { node: a }))).toEqual([
      [0, 1],
      [1, 1],
    ])
  })

  it('hands out copies, so a handler that edits one changes no other', async () => {
    await mount(
      line([
        [1, 5],
        [2, 5],
      ]),
    )
    const first = coincidentPoints(chart.w, { node: marker(0, 1) })
    first[0].seriesIndex = 99
    first.pop()
    expect(pairs(coincidentPoints(chart.w, { node: marker(0, 1) }))).toEqual([
      [0, 1],
      [1, 1],
    ])
  })
})

describe('coincident markers in a custom tooltip and a per-series-row tooltip', () => {
  it('passes the points to tooltip.custom', async () => {
    const custom = vi.fn(() => '<div>custom</div>')
    await mount({
      ...line([
        [1, 5],
        [2, 5],
      ]),
      tooltip: { intersect: true, shared: false, custom },
    })
    const top = marker(1, 1)
    for (const type of ['mouseover', 'mousemove']) {
      top.dispatchEvent(
        new MouseEvent(type, { bubbles: true, clientX: 100, clientY: 100 }),
      )
    }
    await tick()
    const opts = custom.mock.calls.at(-1)[0]
    expect(opts.seriesIndex).toBe(1)
    expect(opts.dataPointIndex).toBe(1)
    expect(pairs(opts.coincident)).toEqual([
      [0, 1],
      [1, 1],
    ])

    // a marker no other series shares: the opts are what they were
    const alone = marker(0, 0)
    for (const type of ['mouseover', 'mousemove']) {
      alone.dispatchEvent(
        new MouseEvent(type, { bubbles: true, clientX: 100, clientY: 100 }),
      )
    }
    await tick()
    expect(custom.mock.calls.at(-1)[0].coincident).toBeUndefined()
  })
})
