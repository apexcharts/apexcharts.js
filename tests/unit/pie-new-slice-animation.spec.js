// A pie slice with no previous angle (the series grew, or the previous render
// was empty or all zero) used to take animateArc's static branch, which set
// w.globals.animationEnded mid-render. The last slice's completion then
// early-returned, so delayed outer labels stayed hidden and
// chart.events.animationEnd never fired. New slices now grow from a zero-width
// wedge and the sweep completes as usual.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function mount(series, onEnd) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'pie',
      width: 400,
      height: 400,
      animations: { enabled: true, speed: 60, dynamicAnimation: { enabled: true, speed: 60 } },
      events: { animationEnd: onEnd },
    },
    series,
    labels: ['A', 'B', 'C', 'D'],
    plotOptions: { pie: { dataLabels: { external: { show: true } } } },
  })
  return chart
}

const hiddenLabelGroups = (chart) =>
  [...chart.el.querySelectorAll('.apexcharts-pie-name-label-group')].filter((g) =>
    g.classList.contains('apexcharts-element-hidden'),
  ).length

describe('pie slices with no previous angle on a data-change update', () => {
  it('control: same-length update reveals outer labels and fires animationEnd', async () => {
    let ended = 0
    const chart = mount([44, 55, 13], () => ended++)
    await chart.render()
    await wait(600)
    ended = 0
    await chart.updateSeries([40, 50, 20])
    await wait(600)
    expect(chart.el.querySelectorAll('.apexcharts-pie-name-label-group').length).toBe(3)
    expect(hiddenLabelGroups(chart)).toBe(0)
    expect(ended).toBe(1)
    chart.destroy()
  })

  it('grown series (3 -> 4 slices): labels revealed and animationEnd fires', async () => {
    let ended = 0
    const chart = mount([44, 55, 13], () => ended++)
    await chart.render()
    await wait(600)
    ended = 0
    await chart.updateSeries([44, 55, 13, 20])
    await wait(600)
    expect(chart.el.querySelectorAll('.apexcharts-pie-name-label-group').length).toBe(4)
    expect(hiddenLabelGroups(chart)).toBe(0)
    expect(ended).toBe(1)
    chart.destroy()
  })

  it('empty -> updateSeries (async-load pattern): labels revealed and animationEnd fires', async () => {
    let ended = 0
    const chart = mount([], () => ended++)
    await chart.render()
    await wait(600)
    ended = 0
    await chart.updateSeries([44, 55, 13])
    await wait(600)
    expect(chart.el.querySelectorAll('.apexcharts-pie-name-label-group').length).toBe(3)
    expect(hiddenLabelGroups(chart)).toBe(0)
    expect(ended).toBe(1)
    chart.destroy()
  })

  it('all-zero placeholder -> real data: labels revealed and animationEnd fires', async () => {
    let ended = 0
    const chart = mount([0, 0, 0], () => ended++)
    await chart.render()
    await wait(600)
    ended = 0
    await chart.updateSeries([44, 55, 13])
    await wait(600)
    expect(hiddenLabelGroups(chart)).toBe(0)
    expect(ended).toBe(1)
    chart.destroy()
  })
})

describe('radialBar rings with no previous value on a data-change update', () => {
  it('a new ring grows in and animationEnd still fires', async () => {
    let ended = 0
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'radialBar',
        width: 400,
        height: 400,
        animations: { enabled: true, speed: 60, dynamicAnimation: { enabled: true, speed: 60 } },
        events: { animationEnd: () => ended++ },
      },
      series: [44, 55],
      labels: ['A', 'B', 'C'],
    })
    await chart.render()
    await wait(600)
    ended = 0
    await chart.updateSeries([44, 55, 70])
    await wait(600)
    expect(chart.el.querySelectorAll('.apexcharts-radialbar-slice-2').length).toBe(1)
    expect(ended).toBe(1)
    chart.destroy()
  })
})
