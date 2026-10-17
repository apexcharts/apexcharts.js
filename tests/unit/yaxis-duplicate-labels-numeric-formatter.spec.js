// drawYaxis hid a repeated label by querying the chart DOM for every label
// already drawn on the axis, once per label, and compared the formatter's
// value against those strings with ===. A formatter that returns a number
// never matched, so `v => Math.round(v)` showed 3, 3, 2, 2, 1 although
// showDuplicates defaults to false. A per-axis Set of drawn strings now
// does the check with no DOM query and catches numbers too.
import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import YAxis from '../../src/modules/axes/YAxis.js'

const data = [1, 1.2, 1.4, 2.6, 3]

const labels = (chart, rel = 0) =>
  [
    ...chart.el.querySelectorAll(
      `.apexcharts-yaxis[rel='${rel}'] .apexcharts-yaxis-label tspan`,
    ),
  ].map((t) => t.textContent)

const line = (yaxis) =>
  createChartWithOptions({
    chart: { type: 'line', width: 600, height: 300 },
    series: [{ data }],
    yaxis,
  })

describe('y axis duplicate labels', () => {
  it('hides repeats from a formatter that returns numbers', () => {
    const chart = line({ labels: { formatter: (v) => Math.round(v) } })
    expect(labels(chart)).toEqual(['3', '', '2', '', '1'])
  })

  it('hides repeats from a formatter that returns strings, as before', () => {
    const chart = line({ labels: { formatter: (v) => String(Math.round(v)) } })
    expect(labels(chart)).toEqual(['3', '', '2', '', '1'])
  })

  it('keeps repeats when showDuplicates is on', () => {
    const chart = line({
      labels: { showDuplicates: true, formatter: (v) => Math.round(v) },
    })
    expect(labels(chart)).toEqual(['3', '3', '2', '2', '1'])
  })

  it('checks each axis on its own', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [
        { name: 'a', data },
        { name: 'b', data },
      ],
      yaxis: [
        { labels: { formatter: (v) => Math.round(v) } },
        { opposite: true, labels: { formatter: (v) => Math.round(v) } },
      ],
    })
    expect(labels(chart, 0)).toEqual(['3', '', '2', '', '1'])
    expect(labels(chart, 1)).toEqual(['3', '', '2', '', '1'])
  })

  it('draws an axis without querying the chart DOM per label', () => {
    const chart = line({ labels: { formatter: (v) => String(Math.round(v)) } })
    chart.el.querySelector(".apexcharts-yaxis[rel='0']").remove()
    const qsa = vi.spyOn(chart.w.dom.baseEl, 'querySelectorAll')
    new YAxis(chart.w, { theme: chart.theme, timeScale: chart.timeScale })
      .drawYaxis(0)
    expect(qsa).toHaveBeenCalledTimes(0)
    qsa.mockRestore()
    expect(labels(chart)).toEqual(['3', '', '2', '', '1'])
  })
})
