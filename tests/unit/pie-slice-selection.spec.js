// Slice pull-out vs selection state on pie and donut. The pull-out is the
// selected cue (the darken filter is suppressed for a slice that slides), so
// the two must never disagree: not across re-renders inside the entrance
// sweep, not after a destroy, and not with multiple selection.
import { describe, it, expect } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function mount(extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  return new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'pie',
      width: 400,
      height: 400,
      animations: { enabled: false },
      ...extra.chart,
    },
    series: [44, 55, 13, 30],
    labels: ['A', 'B', 'C', 'D'],
    states: extra.states,
  })
}

const out = (chart) =>
  [...chart.el.querySelectorAll('.apexcharts-pie-area')]
    .filter((p) => p.getAttribute('data:pieClicked') === 'true')
    .map((p) => Number(p.getAttribute('j')))

const click = (chart, i) => {
  const path = chart.el.querySelector(`.apexcharts-pie-slice-${i}`)
  path.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
  path.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
}

describe('pie pre-selected slice deferred pull-out', () => {
  const animated = {
    chart: { animations: { enabled: true, speed: 120 } },
  }

  it('stays out after two re-renders inside the entrance sweep', async () => {
    const chart = mount(animated)
    await chart.render()
    await wait(300)
    click(chart, 1)
    expect(out(chart)).toEqual([1])

    // Each full redraw replays the sweep and defers the selected slice's
    // pull-out to its end. A stale timer must not toggle the new slice.
    await chart.updateOptions({ chart: { animations: { speed: 121 } } }, true)
    await chart.updateOptions({ chart: { animations: { speed: 120 } } }, true)
    await wait(400)
    expect(out(chart)).toEqual([1])
    expect(chart.w.interact.selectedDataPoints[0]).toEqual([1])
    chart.destroy()
  })

  it('does not throw when the chart is destroyed inside the sweep', async () => {
    const errors = []
    const onErr = (e) => errors.push(e)
    process.on('uncaughtException', onErr)
    try {
      const chart = mount(animated)
      await chart.render()
      await wait(300)
      click(chart, 1)
      await chart.updateOptions({ chart: { animations: { speed: 121 } } }, true)
      chart.destroy()
      await wait(400)
    } finally {
      process.off('uncaughtException', onErr)
    }
    expect(errors).toEqual([])
  })
})

describe('pie multiple selection', () => {
  const multi = { states: { active: { allowMultipleDataPointsSelection: true } } }

  it('keeps every selected slice pulled out', async () => {
    const chart = mount(multi)
    await chart.render()
    click(chart, 0)
    click(chart, 2)
    expect(chart.w.interact.selectedDataPoints[0]).toEqual([0, 2])
    expect(out(chart).sort()).toEqual([0, 2])
    chart.destroy()
  })

  it('a re-click deselects and pulls in only that slice', async () => {
    const chart = mount(multi)
    await chart.render()
    click(chart, 0)
    click(chart, 2)
    click(chart, 0)
    expect(chart.w.interact.selectedDataPoints[0]).toEqual([2])
    expect(out(chart)).toEqual([2])
    chart.destroy()
  })

  it('single selection still keeps one slice out at a time', async () => {
    const chart = mount()
    await chart.render()
    click(chart, 0)
    click(chart, 2)
    expect(chart.w.interact.selectedDataPoints[0]).toEqual([2])
    expect(out(chart)).toEqual([2])
    chart.destroy()
  })
})
