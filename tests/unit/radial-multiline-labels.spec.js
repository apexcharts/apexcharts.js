// Issue #3594: a multi-line label (an array) in the centre of a radialBar or
// donut kept its line break on first render, then turned into "Series,B" on
// hover, because the hover path wrote the array to textContent.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const centreLines = (chart) =>
  [
    ...chart.el
      .querySelector('.apexcharts-datalabel-label')
      .querySelectorAll('tspan'),
  ].map((t) => t.textContent)

const centreText = (chart) =>
  chart.el.querySelector('.apexcharts-datalabel-label').textContent

describe('centre label lines on hover', () => {
  it('keeps a multi-line radialBar series label on separate lines', () => {
    const chart = createChartWithOptions({
      chart: { type: 'radialBar' },
      series: [40, 60, 80],
      labels: ['A', ['Series', 'B'], 'C'],
      plotOptions: {
        radialBar: {
          dataLabels: { total: { show: true, label: ['Label', 'Here'] } },
        },
      },
    })
    expect(centreLines(chart)).toEqual(['Label', 'Here'])

    const slice = chart.el.querySelector('.apexcharts-radialbar-slice-1')
    slice.dispatchEvent(new MouseEvent('mouseenter'))
    expect(centreLines(chart)).toEqual(['Series', 'B'])
    const second = chart.el.querySelectorAll(
      '.apexcharts-datalabel-label tspan',
    )[1]
    expect(second.getAttribute('dy')).toBe('1.1em')
    expect(second.getAttribute('data-newline')).toBe('1')

    slice.dispatchEvent(new MouseEvent('mouseleave'))
    expect(centreLines(chart)).toEqual(['Label', 'Here'])
  })

  it('keeps a multi-line donut slice label on separate lines', () => {
    const chart = createChartWithOptions({
      chart: { type: 'donut' },
      series: [30, 40, 30],
      labels: ['A', ['Slice', 'B'], 'C'],
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: { show: true, label: 'Total' },
            },
          },
        },
      },
    })
    const slice = chart.el.querySelector('.apexcharts-donut-slice-1')
    slice.dispatchEvent(new MouseEvent('mouseenter'))
    expect(centreLines(chart)).toEqual(['Slice', 'B'])

    // A single-line label after a multi-line one is plain text again.
    const first = chart.el.querySelector('.apexcharts-donut-slice-0')
    first.dispatchEvent(new MouseEvent('mouseenter'))
    expect(centreText(chart)).toBe('A')
    expect(centreLines(chart)).toEqual([])
  })
})
