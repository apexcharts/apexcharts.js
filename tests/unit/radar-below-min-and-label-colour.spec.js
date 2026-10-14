import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// Two radar defects users saw:
// - a value below yaxis.min got a negative radius and was drawn on the
//   opposite spoke instead of at the centre;
// - a single string xaxis.labels.style.colors was ignored, so the category
//   labels stayed #a8a8a8.

const render = async (opts) => {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    ...opts,
    chart: { type: 'radar', width: 600, height: 400, animations: { enabled: false } },
  })
  await chart.render()
  return chart
}

// vertices of the first radar path, relative to the radar centre
const vertices = () =>
  document
    .querySelector('.apexcharts-radar-series path')
    .getAttribute('d')
    .split(/[ML]/)
    .slice(1)
    .map((p) => p.trim().split(/[ ,]+/).map(Number))

describe('radar', () => {
  it('draws a value below yaxis.min at the centre, not on the opposite spoke', async () => {
    await render({
      yaxis: { min: 20, max: 60 },
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
      series: [{ name: 'A', data: [10, 50, 50, 50] }],
    })
    const [x0, y0] = vertices()[0]
    expect(Math.abs(x0)).toBeLessThan(1e-6)
    expect(Math.abs(y0)).toBeLessThan(1e-6)
  })

  it('keeps values inside the range on their own spoke', async () => {
    await render({
      yaxis: { min: 20, max: 60 },
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
      series: [{ name: 'A', data: [40, 50, 50, 50] }],
    })
    expect(vertices()[0][1]).toBeLessThan(0)
  })

  it('applies a string xaxis label colour to every category', async () => {
    await render({
      xaxis: {
        categories: ['a', 'b', 'c'],
        labels: { style: { colors: '#ff0000' } },
      },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    const fills = [...document.querySelectorAll('.apexcharts-xaxis-label')].map(
      (t) => t.getAttribute('fill'),
    )
    expect(fills).toEqual(['#ff0000', '#ff0000', '#ff0000'])
  })

  it('still reads per-category colours and falls back to the default', async () => {
    await render({
      xaxis: {
        categories: ['a', 'b', 'c'],
        labels: { style: { colors: ['#00ff00'] } },
      },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    const fills = [...document.querySelectorAll('.apexcharts-xaxis-label')].map(
      (t) => t.getAttribute('fill'),
    )
    expect(fills).toEqual(['#00ff00', '#a8a8a8', '#a8a8a8'])
  })
})
