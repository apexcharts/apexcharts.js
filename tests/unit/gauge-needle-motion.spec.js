// plotOptions.radialBar.needle.animation: `enabled: false` lands the needle
// at once, and with no duration set the needle runs on the same clock as the
// value arc (animations.speed on mount, dynamicAnimation.speed on update).
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import Radial from '../../src/charts/Radial.js'

function mount(needle = {}, animations = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'gauge',
      width: 400,
      height: 400,
      animations: { enabled: true, ...animations },
    },
    series: [70],
    plotOptions: { radialBar: { shape: 'needle', needle } },
  })
}

const needleTransform = (chart) =>
  chart.el.querySelector('.apexcharts-gauge-needle').getAttribute('transform')

describe('gauge needle animation options', () => {
  it('needle.animation.enabled: false lands the needle at once', async () => {
    const chart = mount({ animation: { enabled: false } })
    await chart.render()
    // 70 on the default -135..135 dial.
    expect(needleTransform(chart)).toBe('rotate(54)')
    expect(new Radial(chart.w, chart).needleMotion()).toBeNull()
    chart.destroy()
  })

  it('sweeps on mount by default', async () => {
    const chart = mount()
    await chart.render()
    expect(new Radial(chart.w, chart).needleMotion()).not.toBeNull()
    chart.destroy()
  })

  it('runs on the arc clock: animations.speed on mount, dynamicAnimation.speed on update', async () => {
    const chart = mount(
      {},
      { speed: 300, dynamicAnimation: { enabled: true, speed: 120 } },
    )
    await chart.render()
    const w = chart.w
    w.globals.dataChanged = false
    w.globals.resized = false
    w.globals.shouldAnimate = true
    expect(new Radial(w, chart).needleMotion().speed).toBe(300)
    w.globals.dataChanged = true
    expect(new Radial(w, chart).needleMotion().speed).toBe(120)
    chart.destroy()
  })

  it('an explicit duration still wins', async () => {
    const chart = mount({ animation: { duration: 900 } }, { speed: 300 })
    await chart.render()
    chart.w.globals.shouldAnimate = true
    expect(new Radial(chart.w, chart).needleMotion().speed).toBe(900)
    chart.destroy()
  })
})
