import { describe, it, expect } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

// An annotation added through the public API must follow
// the y scale when a same-shape updateSeries rescales the axis.
const lineY = (el) => {
  const l = el.querySelector('.apexcharts-yaxis-annotations line')
  return l ? Number(l.getAttribute('y1')) : null
}

describe('API annotations after a rescaling updateSeries', () => {
  it('redraws an addYaxisAnnotation line at the new scale', async () => {
    document.body.innerHTML = '<div id="c"></div><div id="d"></div>'
    const base = {
      chart: {
        type: 'line',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      xaxis: { categories: ['a', 'b', 'c'] },
    }
    const el = document.querySelector('#c')
    const chart = new ApexCharts(el, {
      ...base,
      series: [{ name: 'S', data: [10, 20, 30] }],
    })
    await chart.render()
    chart.addYaxisAnnotation({ y: 20, borderColor: '#f00' })
    const before = lineY(el)
    await chart.updateSeries([{ name: 'S', data: [10, 40, 80] }])

    // control: a fresh chart with the new data and the same API annotation
    const d = document.querySelector('#d')
    const control = new ApexCharts(d, {
      ...base,
      series: [{ name: 'S', data: [10, 40, 80] }],
    })
    await control.render()
    control.addYaxisAnnotation({ y: 20, borderColor: '#f00' })
    const expected = lineY(d)

    expect(expected).not.toBeCloseTo(before, 0) // the scale really moved
    expect(lineY(el)).toBeCloseTo(expected, 1)
    chart.destroy()
    control.destroy()
  })
})
