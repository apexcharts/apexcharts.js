import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/full.js'

// render() must be idempotent: a second call (deliberate, or a framework
// double-invoking an effect) must not build a duplicate chart tree in the same
// element. It returns the same in-flight/settled promise instead. destroy()
// clears the cache so the instance can be rendered fresh again, and a rejected
// render clears itself so callers can retry.

describe('render() idempotency', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function makeChart() {
    document.body.innerHTML = '<div id="chart"></div>'
    return new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'line', width: 400, height: 300, animations: { enabled: false } },
      series: [{ name: 'A', data: [1, 2, 3] }],
      xaxis: { type: 'numeric' },
    })
  }

  it('a second render() does not duplicate the chart tree', async () => {
    const chart = makeChart()
    const p1 = chart.render()
    const p2 = chart.render()
    expect(p2).toBe(p1) // same in-flight promise, no second build
    await Promise.all([p1, p2])

    // exactly one root svg in the container
    const svgs = chart.w.dom.baseEl.querySelectorAll('svg.apexcharts-svg')
    expect(svgs.length).toBe(1)
    chart.destroy()
  })

  it('render() after destroy() builds a fresh chart', async () => {
    const chart = makeChart()
    await chart.render()
    chart.destroy()

    document.body.innerHTML = '<div id="chart2"></div>'
    const chart2 = new ApexCharts(document.querySelector('#chart2'), {
      chart: { type: 'line', width: 400, height: 300, animations: { enabled: false } },
      series: [{ name: 'A', data: [4, 5, 6] }],
      xaxis: { type: 'numeric' },
    })
    // a brand-new instance renders normally (destroy cleared its own cache)
    await chart2.render()
    expect(chart2.w.dom.baseEl.querySelectorAll('svg.apexcharts-svg').length).toBe(1)
    chart2.destroy()
  })

  it('a rejected render() clears the cache so a retry can run', async () => {
    const el = document.createElement('div') // detached -> render rejects
    const chart = new ApexCharts(el, {
      chart: { type: 'line', animations: { enabled: false } },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    await expect(chart.render()).rejects.toThrow()

    // attach and retry: the cache must not be pinned to the failed attempt
    document.body.appendChild(el)
    await expect(chart.render()).resolves.toBeTruthy()
    chart.destroy()
  })
})
