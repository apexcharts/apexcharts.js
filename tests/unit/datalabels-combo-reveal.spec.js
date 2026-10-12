import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// The progressive reveal holds a label until the line's pen reaches its x. In
// a line chart with a column series, the column is never drawn with that pen,
// so its labels (and their background pills) must not wait on it.
// Built by hand: createChartWithOptions forces animations off.
function comboChart(background) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'line',
      width: 400,
      height: 300,
      animations: { enabled: true },
    },
    series: [
      { name: 'line', type: 'line', data: [10, 20, 30, 40] },
      { name: 'col', type: 'column', data: [15, 25, 35, 45] },
    ],
    labels: ['a', 'b', 'c', 'd'],
    dataLabels: { enabled: true, background: { enabled: background } },
  })
  chart.render()
  return chart
}

/** @param {any} chart @param {number} realIndex @param {string} sel */
function opacities(chart, realIndex, sel) {
  const wrap = Array.from(
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-datalabels'),
  ).find((n) => n.getAttribute('data:realIndex') === String(realIndex))
  return Array.from(wrap.querySelectorAll(sel)).map((n) => n.style.opacity)
}

describe('progressive reveal in a line and column combo', () => {
  it('holds the line labels and leaves the column labels alone', () => {
    const chart = comboChart(false)
    const line = opacities(chart, 0, 'text')
    const col = opacities(chart, 1, 'text')
    expect(line.length).toBe(4)
    expect(line.every((o) => o === '0')).toBe(true)
    expect(col.length).toBe(4)
    expect(col.every((o) => o !== '0')).toBe(true)
  })

  it('treats the background pills the same way', () => {
    const chart = comboChart(true)
    const line = opacities(chart, 0, 'rect')
    const col = opacities(chart, 1, 'rect')
    expect(line.length).toBe(4)
    expect(line.every((o) => o === '0')).toBe(true)
    expect(col.length).toBe(4)
    expect(col.every((o) => o !== '0')).toBe(true)
  })
})
