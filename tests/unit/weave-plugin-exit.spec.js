/**
 * A plugin that leaves a chart, by being removed from `plugins` or by being
 * disabled after repeated errors, lets go of everything it held: its claims,
 * its highlight parts, its pointer handlers, its derived-series record, what it
 * declared it drew and the gutter it reserved. Full destroy always did; the
 * other two exits used to release only some of it.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

/** What the holder plugin saw, reset per test. */
let pointed = []
/** Whether the holder's draw handler throws. */
let breakDraw = false
/** The api.drawn() inventory a bystander plugin read on its last draw. */
let inventory = null

const holder = {
  name: 'holder',
  apiVersion: 6,
  setup(api) {
    api.claim('stroke.dashArray', [{ series: 'S1', value: 7 }])
    api.pointer((e) => pointed.push(e.type))
    api.markDerived(['S2'])
    api.reserve({ right: 150 })
    api.on('draw', () => {
      api.declare({ id: 'band', label: 'Band' })
      if (breakDraw) throw new Error('holder throws on draw')
    })
  },
}

const pointerBreaker = {
  name: 'pointer-breaker',
  apiVersion: 6,
  setup(api) {
    api.reserve({ right: 100 })
    api.pointer(() => {
      throw new Error('pointer-breaker throws on every hover')
    })
  },
}

const bystander = {
  name: 'bystander',
  apiVersion: 6,
  setup(api) {
    api.on('draw', () => {
      inventory = api.drawn()
    })
  },
}

beforeAll(() => {
  ;[holder, pointerBreaker, bystander].forEach((p) => ApexCharts.registerPlugin(p))
})

let errorSpy
beforeEach(() => {
  pointed = []
  breakDraw = false
  inventory = null
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  errorSpy.mockRestore()
})

function lineChart(plugins) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 300,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    legend: { show: false },
    series: [
      { name: 'S1', data: [1, 2, 3] },
      { name: 'S2', data: [4, 5, 6] },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
    plugins,
  })
}

/** The dash each series' line path is drawn with. */
function dashes(chart) {
  return [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-series')].map((g) => {
    const path = [...g.querySelectorAll('path')].find(
      (p) => p.getAttribute('stroke') !== 'none',
    )
    return path ? path.getAttribute('stroke-dasharray') : null
  })
}

/** Fire the chart's own event, the way Graphics does when a viewer hovers. */
function fire(chart, name, opts) {
  const handlers = chart.w.globals.events[name] || []
  handlers.forEach((h) => h({}, chart, opts))
}

/** Wait for a deferred re-render to land rather than for a fixed tick count. */
async function settle(read, target, tries = 30) {
  for (let i = 0; i < tries; i++) {
    if (JSON.stringify(read()) === JSON.stringify(target)) return true
    await new Promise((r) => setTimeout(r, 0))
  }
  return read()
}

const widthOf = (chart) => chart.w.globals.svgWidth

/** Everything the host still holds for one plugin. */
function heldBy(chart, name) {
  const host = chart.weave
  return {
    pointer: !!(host._pointerSubs && host._pointerSubs.has(name)),
    derived: !!(host._derived && host._derived.has(name)),
    declared: !!(host._declared && host._declared.has(name)),
    reserved: !!(host._reserved && host._reserved.has(name)),
  }
}

const NOTHING = { pointer: false, derived: false, declared: false, reserved: false }

describe('a plugin removed with updateOptions', () => {
  it('lets go of its claims, handlers, derived series, declarations and gutter', async () => {
    const chart = lineChart([{ name: 'holder' }, { name: 'bystander' }])
    expect(await settle(() => widthOf(chart), 450)).toBe(true)
    expect(dashes(chart)).toEqual(['7', '0'])
    expect(heldBy(chart, 'holder')).toEqual({
      pointer: true,
      derived: true,
      declared: true,
      reserved: true,
    })

    await chart.updateOptions({ plugins: [{ name: 'bystander' }] })
    expect(heldBy(chart, 'holder')).toEqual(NOTHING)

    // The gutter comes back and the claim stops answering, both on the
    // re-render the removal schedules.
    expect(await settle(() => widthOf(chart), 600)).toBe(true)
    expect(await settle(() => dashes(chart), ['0', '0'])).toBe(true)

    // A hover no longer reaches a plugin whose destroy already ran.
    fire(chart, 'dataPointMouseEnter', { seriesIndex: 0, dataPointIndex: 1 })
    expect(pointed).toEqual([])

    // Nor does another plugin's inventory still credit it with a series.
    const owners = inventory.filter((d) => d.kind === 'series').map((d) => d.owner)
    expect(owners).toEqual(['core', 'core'])
    chart.destroy()
  })

  it('does not stack a second set of pointer handlers when it is added back', async () => {
    const chart = lineChart([{ name: 'holder' }])
    await chart.updateOptions({ plugins: [] })
    await chart.updateOptions({ plugins: [{ name: 'holder' }] })
    fire(chart, 'dataPointMouseEnter', { seriesIndex: 0, dataPointIndex: 1 })
    expect(pointed).toEqual(['enter'])
    chart.destroy()
  })
})

describe('a plugin disabled after repeated errors', () => {
  it('stops receiving pointer events and gives its gutter back', async () => {
    breakDraw = true
    const chart = lineChart([{ name: 'holder' }])
    expect(await settle(() => widthOf(chart), 450)).toBe(true)
    // Re-render until the third failure disables it.
    for (let i = 0; i < 3 && !chart.weave.active[0].disabled; i++) {
      await chart.updateSeries([
        { name: 'S1', data: [3, 2, i] },
        { name: 'S2', data: [6, 5, 4] },
      ])
    }
    expect(chart.weave.active[0].disabled).toBe(true)
    expect(heldBy(chart, 'holder')).toEqual(NOTHING)

    expect(await settle(() => widthOf(chart), 600)).toBe(true)
    expect(await settle(() => dashes(chart), ['0', '0'])).toBe(true)
    fire(chart, 'dataPointMouseEnter', { seriesIndex: 0, dataPointIndex: 1 })
    expect(pointed).toEqual([])
    chart.destroy()
  })

  it('counts a pointer handler that throws toward the same limit', async () => {
    const chart = lineChart([{ name: 'pointer-breaker' }])
    expect(await settle(() => widthOf(chart), 500)).toBe(true)
    for (let i = 0; i < 5; i++) {
      fire(chart, 'dataPointMouseEnter', { seriesIndex: 0, dataPointIndex: 1 })
    }
    expect(chart.weave.active[0].disabled).toBe(true)
    // Three reports and the disable notice, not one per hover forever.
    const reports = errorSpy.mock.calls.filter((c) =>
      String(c[0]).includes('"pointer-breaker" threw'),
    )
    expect(reports).toHaveLength(3)
    expect(await settle(() => widthOf(chart), 600)).toBe(true)
    chart.destroy()
  })
})
