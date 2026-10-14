import { describe, it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/entries/violin.js'
import '../../src/features/raincloud'
import Series from '../../src/modules/Series.js'

// Every violin update, legend toggle or zoom collapsed each violin to its
// centreline and grew it again: the outgoing violin paths were never
// captured, so there was nothing to morph from. A raincloud box lane shares
// its body's datum key, so it rides on the body's captured entry.

const density = (s) => [
  [0, 0.02],
  [1, 0.1 * s],
  [2, 0.35],
  [3, 0.5 * s],
  [4, 0.35],
  [5, 0.1],
  [6, 0.02],
]
const series = (s) => [
  {
    name: 'A',
    data: [
      { x: 'G1', y: { density: density(s), points: [1, 2, 3, 4] } },
      { x: 'G2', y: { density: density(s), points: [0.5, 1.5, 3, 5] } },
    ],
  },
]

let chart
afterEach(() => chart?.destroy())

const mount = async (extra = {}) => {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'violin', width: 600, height: 400 },
    dataLabels: { enabled: false },
    series: series(1),
    ...extra,
  })
  await chart.render()
  return chart
}
const body = (j) =>
  chart.w.dom.baseEl.querySelector(`path.apexcharts-violin-area[j='${j}']`)
const box = (j) => [
  ...chart.w.dom.baseEl.querySelectorAll(
    `path.apexcharts-raincloud-box[j='${j}']`,
  ),
]

describe('violin updates morph from the previous shape', () => {
  it('captures one entry per violin', async () => {
    await mount()
    new Series(chart.w).capturePreviousPaths()
    const rec = chart.w.globals.previousPaths.find((p) => p.type === 'violin')
    expect(rec.paths.length).toBe(2)
  })

  it('a survivor starts from the shape it had', async () => {
    await mount()
    const before = [body(0), body(1)].map((p) => p.getAttribute('pathTo'))
    await chart.updateSeries(series(1.6))
    expect(body(0).getAttribute('pathFrom')).toBe(before[0])
    expect(body(1).getAttribute('pathFrom')).toBe(before[1])
    expect(body(0).getAttribute('pathTo')).not.toBe(before[0])
  })

  it('morphs with update animations on, and regrows when the node count changes', async () => {
    const nodes = (n) =>
      Array.from({ length: n }, (_, i) => [
        i,
        0.05 + Math.sin((i / (n - 1)) * Math.PI) / 2,
      ])
    const by = (n) => [
      {
        name: 'A',
        data: [
          { x: 'G1', y: { density: nodes(n), points: [1, 2, 3] } },
          { x: 'G2', y: { density: nodes(n), points: [0.5, 2, 4] } },
        ],
      },
    ]
    await mount({
      chart: {
        type: 'violin',
        width: 600,
        height: 400,
        animations: { dynamicAnimation: { enabled: true } },
      },
      series: by(7),
    })
    const count = (d) => d.match(/[MLCZ]/gi).length
    let before = body(0).getAttribute('pathTo')
    await chart.updateSeries(
      by(7).map((s) => ({
        ...s,
        data: s.data.map((d) => ({
          ...d,
          y: { ...d.y, density: d.y.density.map(([x, v]) => [x, v * 1.5]) },
        })),
      })),
    )
    expect(body(0).getAttribute('pathFrom')).toBe(before)

    for (const n of [11, 5]) {
      before = body(0).getAttribute('pathTo')
      await chart.updateSeries(by(n))
      const from = body(0).getAttribute('pathFrom')
      const to = body(0).getAttribute('pathTo')
      expect(from).not.toBe(to)
      expect(from).not.toBe(before)
      expect(count(from)).toBe(count(to))
    }
  })

  it('the box lane keeps its own previous shape', async () => {
    const obs = (k) => Array.from({ length: 30 }, (_, i) => 10 + ((i * k) % 17))
    const rain = (k) => [
      {
        name: 'A',
        data: [
          { x: 'G1', points: obs(k) },
          { x: 'G2', points: obs(k + 4) },
        ],
      },
    ]
    await mount({
      chart: { type: 'raincloud', width: 600, height: 400 },
      series: rain(3),
    })
    expect(box(0).length).toBe(2)
    new Series(chart.w).capturePreviousPaths()
    const rec = chart.w.globals.previousPaths.find((p) => p.type === 'violin')
    expect(rec.paths.length).toBe(2)
    expect(rec.paths[0].box.length).toBe(2)

    const before = box(0).map((p) => p.getAttribute('pathTo'))
    await chart.updateSeries(rain(5))
    expect(box(0)[1].getAttribute('pathTo')).not.toBe(before[1])
    expect(box(0).map((p) => p.getAttribute('pathFrom'))).toEqual(before)
  })
})
