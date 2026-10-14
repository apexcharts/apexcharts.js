import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// On a stacked area or line chart with ragged x (series that do not share
// every x), the upper series was only stacked at its own points. Between
// two of them its edge ran straight across, cutting under the lower
// series' peak, so the layers crossed. The other way round, a lower series
// ran straight over an x only the upper series has, where it stands on the
// axis. A missing point contributes 0, so every edge must match the same
// data padded with zeros.

const render = async (opts) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    ...opts,
    chart: {
      width: 600,
      height: 400,
      ...opts.chart,
      animations: { enabled: false },
    },
    dataLabels: { enabled: false },
  })
  await chart.render()
  return chart
}

const A = [
  [1, 10],
  [2, 50],
  [3, 10],
]
const ragged = [
  [1, 10],
  [3, 20],
]
const padded = [
  [1, 10],
  [2, 0],
  [3, 20],
]

const cfg = (type, curve, B, a = A) => ({
  chart: { type, stacked: true },
  xaxis: { type: 'numeric' },
  stroke: { curve },
  series: [
    { name: 'A', data: a },
    { name: 'B', data: B },
  ],
})

// d of every series' paths (stacked series are drawn top layer first)
const paths = (type) => {
  const sel = type === 'area' ? 'path.apexcharts-area' : 'path.apexcharts-line'
  return [...document.querySelectorAll(sel)].map((p) => p.getAttribute('d'))
}

const curves = [
  ['area', 'straight'],
  ['area', 'smooth'],
  ['area', 'stepline'],
  ['area', 'monotoneCubic'],
  ['line', 'straight'],
  ['line', 'smooth'],
  ['line', 'monotoneCubic'],
]

describe('ragged stacked edge between points', () => {
  it.each(curves)(
    '%s %s: an upper series matches the zero-padded data',
    async (type, curve) => {
      await render(cfg(type, curve, padded))
      const oracle = paths(type)
      await render(cfg(type, curve, ragged))
      expect(paths(type)).toEqual(oracle)
    },
  )

  it.each(curves)(
    '%s %s: a lower series matches the zero-padded data',
    async (type, curve) => {
      const lower = [
        [1, 10],
        [3, 12],
      ]
      await render(cfg(type, curve, A, [lower[0], [2, 0], lower[1]]))
      const oracle = paths(type)
      await render(cfg(type, curve, A, lower))
      expect(paths(type)).toEqual(oracle)
    },
  )

  it('leaves an unstacked ragged series straight between its points', async () => {
    const opts = cfg('line', 'straight', ragged)
    opts.chart.stacked = false
    await render(opts)
    const d = document
      .querySelector('.apexcharts-series[seriesName="B"] path.apexcharts-line')
      .getAttribute('d')
    expect(d.match(/L/g)).toHaveLength(1)
  })
})
