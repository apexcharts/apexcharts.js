import ApexCharts from '../../src/entries/heatmap.js'
import './__mocks__/ResizeObserver.js'

// Per-cell work a heatmap does not need. (The colour-only update tween is
// checked in a browser: jsdom captures no previous cells to tween from.)
const grid = (rows, cols) =>
  Array.from({ length: rows }, (_, r) => ({
    name: `r${r}`,
    data: Array.from({ length: cols }, (_, c) => ({
      x: `c${c}`,
      y: (r * 7 + c * 3) % 50,
    })),
  }))

const mount = async (options) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'heatmap', width: 500, height: 300 },
    series: grid(4, 6),
    ...options,
  })
  await chart.render()
  return chart
}

describe('heatmap update cost', () => {
  it('does not call the label formatter with labels off', async () => {
    const formatter = vi.fn((v) => v)
    const chart = await mount({ dataLabels: { enabled: false, formatter } })
    expect(formatter).not.toHaveBeenCalled()
    chart.destroy()
  })
})
