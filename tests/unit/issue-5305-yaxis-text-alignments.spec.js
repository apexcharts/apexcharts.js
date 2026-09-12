import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/full.js'

/**
 * #5305: setYAxisTextAlignments() threw on a hidden y-axis with labels.align,
 * which made render() reject and skipped the rest of mount().
 */

describe('setYAxisTextAlignments hidden y-axis (#5305)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('render() resolves when a hidden y-axis has labels.align', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'line', height: 200, animations: { enabled: false } },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [3, 2, 1] },
      ],
      yaxis: [
        { labels: { align: 'left' } },
        { show: false, labels: { align: 'left' } },
      ],
    })

    await expect(chart.render()).resolves.toBeTruthy()
    chart.destroy()
  })

  it('still aligns a later axis when an earlier axis is collapsed', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'line', height: 200, animations: { enabled: false } },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [3, 2, 1] },
        { name: 'c', data: [2, 1, 3] },
      ],
      yaxis: [
        { labels: { align: 'left' } },
        { labels: { align: 'left' } },
        { labels: { align: 'left' } },
      ],
    })

    await chart.render()
    chart.hideSeries('a')

    const lastInner = chart.w.dom.baseEl.querySelector(
      `.apexcharts-yaxis[rel='2'] .apexcharts-yaxis-texts-g`,
    )
    expect(lastInner).not.toBeNull()
    expect(lastInner.getAttribute('transform')).toMatch(/translate\(/)

    chart.destroy()
  })
})
