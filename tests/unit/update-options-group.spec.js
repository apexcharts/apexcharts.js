import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

// updateOptions() on a chart in a group fans the payload out to its siblings,
// which must not take the caller's series or yaxis. That used to be done by
// deleting them from the caller's own object, and the promise resolved with
// whichever sibling came last rather than the chart it was called on.

const charts = []

const mount = async (id) => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: {
      id,
      group: 'g',
      type: 'line',
      height: 200,
      animations: { enabled: false },
    },
    series: [{ name: id, data: [1, 2, 3] }],
    yaxis: { labels: { minWidth: 40 } },
  })
  await chart.render()
  charts.push(chart)
  return chart
}

afterEach(() => {
  charts.splice(0).forEach((c) => c.destroy())
  document.body.innerHTML = ''
})

describe('grouped updateOptions', () => {
  it('resolves with the chart it was called on and leaves the payload intact', async () => {
    const a = await mount('ca')
    const b = await mount('cb')
    const opts = {
      title: { text: 'T' },
      series: [{ name: 'ca', data: [5, 6, 7] }],
      yaxis: { min: 0, max: 10 },
    }
    const res = await a.updateOptions(opts)
    expect(res).toBe(a)
    expect(Object.keys(opts).sort()).toEqual(['series', 'title', 'yaxis'])
    expect(a.w.config.title.text).toBe('T')
    expect(b.w.config.title.text).toBe('T')
    expect(a.w.config.series[0].data).toEqual([5, 6, 7])
    expect(b.w.config.series[0].data).toEqual([1, 2, 3])
    expect(b.w.config.yaxis[0].max).toBeUndefined()
  })
})
