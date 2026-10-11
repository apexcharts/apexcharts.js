// The gauge needle's tween and the tick fade-in across renders: a missing
// reading cannot poison the next tween, a redraw replays the mount sweep, a
// render that lands at once stops the previous tween, and the ticks wait for
// the real end of the sweep.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function mount(series, { animations = {}, radialBar = {} } = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'gauge',
      width: 400,
      height: 400,
      animations: {
        enabled: true,
        speed: 60,
        dynamicAnimation: { enabled: true, speed: 60 },
        ...animations,
      },
    },
    series,
    plotOptions: { radialBar: { shape: 'needle', ...radialBar } },
  })
}

const needleAngle = (chart) =>
  Number(
    /rotate\(([^)]+)\)/.exec(
      chart.el
        .querySelector('.apexcharts-gauge-needle')
        .getAttribute('transform'),
    )[1],
  )

// jsdom's rAF timestamps run on another clock than performance.now(), so a
// needle tween never advances here. These specs read where each tween starts
// (written before its first frame), which is what the defects got wrong.
describe('gauge needle across renders', () => {
  it('a NaN reading parks at the start and the next update tweens from there', async () => {
    const chart = mount([NaN])
    await chart.render()
    expect(needleAngle(chart)).toBe(-135)
    await chart.updateSeries([70])
    expect(needleAngle(chart)).toBe(-135)
    chart.destroy()
  })

  it('a redraw sweeps the needle from the start, as on mount', async () => {
    const chart = mount([70])
    await chart.render()
    await chart.updateOptions({ title: { text: 'x' } }, true, true)
    // Not parked at the value (54) while the arc replays its sweep.
    expect(needleAngle(chart)).toBe(-135)
    chart.destroy()
  })

  it('a render that places the needle at once stops the previous tween', async () => {
    const chart = mount([70], { animations: { speed: 2000 } })
    await chart.render()
    expect(chart.w.globals.radialNeedleRAF).not.toBeNull()
    await chart.updateSeries([30], false)
    expect(chart.w.globals.radialNeedleRAF).toBeNull()
    await wait(50)
    expect(chart.w.globals.radialNeedleRAF).toBeNull()
    chart.destroy()
  })
})

describe('gauge tick fade-in', () => {
  it('waits for the needle when it outlasts the value arc', async () => {
    const chart = mount([70], {
      animations: { speed: 60 },
      radialBar: {
        ticks: { show: true },
        needle: { animation: { duration: 500 } },
      },
    })
    await chart.render()
    const ticks = chart.el.querySelector('.apexcharts-gauge-ticks')
    await wait(200)
    expect(ticks.style.opacity).toBe('0')
    await wait(500)
    expect(ticks.style.opacity).toBe('1')
    chart.destroy()
  })

  it('does not touch the ticks after the chart is destroyed', async () => {
    const chart = mount([70], {
      animations: { speed: 60 },
      radialBar: { ticks: { show: true } },
    })
    await chart.render()
    const ticks = chart.el.querySelector('.apexcharts-gauge-ticks')
    chart.destroy()
    await wait(200)
    expect(ticks.style.opacity).toBe('0')
  })
})
