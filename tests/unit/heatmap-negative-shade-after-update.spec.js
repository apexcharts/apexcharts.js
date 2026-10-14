import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// A heatmap or treemap that once held a negative value kept the negative
// shade formula after updateSeries to non-negative data, so its cells were
// coloured differently from a fresh chart with the same data.

const render = async (opts) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    ...opts,
    chart: { ...opts.chart, width: 600, height: 400, animations: { enabled: false } },
    dataLabels: { enabled: false },
  })
  await chart.render()
  return chart
}

const series = (ys) => [
  { name: 'A', data: ys.map((y, i) => ({ x: 'c' + i, y })) },
]
// a fresh render writes rgba(), an update writes hex: compare as hex
const hex = (f) => {
  const m = /rgba?\((\d+),(\d+),(\d+)/.exec(f)
  return m
    ? '#' + m.slice(1, 4).map((n) => (+n).toString(16).padStart(2, '0')).join('')
    : f
}
const fills = (sel) =>
  [...document.querySelectorAll(sel)].map((r) => hex(r.getAttribute('fill')))

describe.each([
  ['heatmap', '.apexcharts-heatmap-rect'],
  ['treemap', '.apexcharts-treemap-rect'],
])('%s negative shading', (type, sel) => {
  it('matches a fresh chart after negatives are removed', async () => {
    await render({ chart: { type }, series: series([0, 20, 40, 60]) })
    const fresh = fills(sel)
    const chart = await render({ chart: { type }, series: series([-10, 20, 40, 60]) })
    expect(chart.w.globals.hasNegs).toBe(true)
    await chart.updateSeries(series([0, 20, 40, 60]))
    expect(chart.w.globals.hasNegs).toBe(false)
    expect(fills(sel)).toEqual(fresh)
  })
})
