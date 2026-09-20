/**
 * Weave v6: a plugin claiming a positional option.
 *
 * The assertions that matter most here are the two that protect the promise
 * rather than the feature: that a claim never writes the caller's config, and
 * that no claim can outlive the plugin holding it. Everything else is about
 * resolution being the same answer wherever the option is read from.
 *
 * Driven through a real chart rather than against Claims.js alone: the point of
 * a claim is what the chart DRAWS, and a unit test of the resolver would agree
 * with itself about that.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
import { CLAIMABLE } from '../../src/modules/weave/Claims.js'

/** The claim a plugin makes, settable per test before the chart mounts. */
let pending = []
/** Handles from the last mount, so a test can release them. */
let handles = []

const claimer = {
  name: 'claimer',
  apiVersion: 2,
  setup(api) {
    handles = pending
      .map(([option, entries]) => api.claim(option, entries))
      .filter(Boolean)
  },
}

/** A second plugin, for the two-plugins-one-option case. */
const other = {
  name: 'other',
  apiVersion: 2,
  setup(api) {
    if (pending.other) api.claim(...pending.other)
  },
}

const breaker = {
  name: 'breaker',
  apiVersion: 2,
  setup(api) {
    api.claim('stroke.dashArray', [{ series: 'S1', value: 9 }])
    api.on('draw', () => {
      throw new Error('breaker throws on every draw')
    })
  },
}

// A block body, not an expression: registerPlugin returns the ApexCharts class
// and vitest treats a returned value as a teardown function, which then fails
// with "Class constructor ApexCharts cannot be invoked without 'new'".
beforeAll(() => {
  ;[claimer, other, breaker].forEach((p) => ApexCharts.registerPlugin(p))
})

beforeEach(() => {
  pending = []
  handles = []
})

function lineChart(plugins, extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 400,
      height: 300,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    legend: { show: false },
    dataLabels: { enabled: true },
    series: [
      { name: 'S1', data: [1, 2, 3] },
      { name: 'S2', data: [4, 5, 6] },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
    plugins,
    ...extra,
  })
}

/** The dash each series' line path is drawn with. */
function dashes() {
  return [...document.querySelectorAll('.apexcharts-series')].map((g) => {
    const path = [...g.querySelectorAll('path')].find(
      (p) => p.getAttribute('stroke') !== 'none',
    )
    return path ? path.getAttribute('stroke-dasharray') : null
  })
}

/**
 * How many data labels each series drew.
 *
 * Counted per `.apexcharts-datalabels` group, which is the per-series one: a
 * line chart emits several `.apexcharts-data-labels` children inside each.
 */
function labelCounts() {
  return [...document.querySelectorAll('.apexcharts-datalabels')].map(
    (g) => g.querySelectorAll('text').length,
  )
}

// ---------------------------------------------------------------------------

describe('claiming a positional option', () => {
  it('dashes the claimed series and leaves the other alone', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    lineChart([{ name: 'claimer' }])
    expect(dashes()).toEqual(['7', '0'])
  })

  it('resolves a claim by position as well as by name', () => {
    pending = [['stroke.dashArray', [{ series: 1, value: 4 }]]]
    lineChart([{ name: 'claimer' }])
    expect(dashes()).toEqual(['0', '4'])
  })

  it('keeps the caller dashing they configured for everyone else', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    lineChart([{ name: 'claimer' }], { stroke: { dashArray: [1, 5] } })
    expect(dashes()).toEqual(['7', '5'])
  })

  // The promise the whole design exists for. A write-and-restore mechanism
  // could pass every test above and fail this one.
  it('never writes the caller config', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    const chart = lineChart([{ name: 'claimer' }], {
      stroke: { dashArray: [1, 5] },
    })
    expect(chart.w.config.stroke.dashArray).toEqual([1, 5])
  })

  it('turns data labels off for its own series only', () => {
    pending = [['dataLabels.enabledOnSeries', [{ series: 'S2', value: false }]]]
    lineChart([{ name: 'claimer' }])
    expect(labelCounts()).toEqual([3, 0])
  })

  it('is gone the moment it is released', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    const chart = lineChart([{ name: 'claimer' }])
    expect(dashes()).toEqual(['7', '0'])

    handles[0].release()
    chart.update()
    expect(dashes()).toEqual(['0', '0'])
  })

  it('releases idempotently', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    lineChart([{ name: 'claimer' }])
    handles[0].release()
    expect(() => handles[0].release()).not.toThrow()
  })

  it('takes a new value through update() without changing its place in line', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    const chart = lineChart([{ name: 'claimer' }])
    handles[0].update([{ series: 'S1', value: 2 }])
    chart.update()
    expect(dashes()).toEqual(['2', '0'])
  })
})

describe('a claim and the caller changing the same option', () => {
  /*
   * The stale-restore case, which is failure mode 2 in Claims.js: a plugin
   * holding a snapshot would put the OLD array back here and silently revert
   * the caller. Resolution cannot, because it never took a copy.
   */
  it('composes, rather than reverting the caller update', async () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    const chart = lineChart([{ name: 'claimer' }], {
      stroke: { dashArray: [1, 5] },
    })

    await chart.updateOptions({ stroke: { dashArray: [3, 3] } })

    // The caller's new value for the series nobody claimed, the claim for the
    // one somebody did.
    expect(dashes()).toEqual(['7', '3'])
    expect(chart.w.config.stroke.dashArray).toEqual([3, 3])
  })

  it('follows its series by name when the caller adds one in front', async () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    const chart = lineChart([{ name: 'claimer' }])

    await chart.updateSeries([
      { name: 'S0', data: [9, 9, 9] },
      { name: 'S1', data: [1, 2, 3] },
      { name: 'S2', data: [4, 5, 6] },
    ])

    expect(dashes()).toEqual(['0', '7', '0'])
  })
})

describe('two plugins on one option', () => {
  it('gives the series to the last claim, deterministically', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    pending.other = ['stroke.dashArray', [{ series: 'S1', value: 2 }]]
    lineChart([{ name: 'claimer' }, { name: 'other' }])
    expect(dashes()).toEqual(['2', '0'])
  })

  it('leaves a series each when they claim different ones', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    pending.other = ['stroke.dashArray', [{ series: 'S2', value: 2 }]]
    lineChart([{ name: 'claimer' }, { name: 'other' }])
    expect(dashes()).toEqual(['7', '2'])
  })
})

describe('a claim cannot outlive its plugin', () => {
  it('goes when the host disables the plugin after repeated failures', () => {
    const chart = lineChart([{ name: 'breaker' }])
    expect(dashes()).toEqual(['9', '0'])

    // Three throws is the host's disable threshold.
    chart.update()
    chart.update()
    chart.update()

    expect(dashes()).toEqual(['0', '0'])
  })

  it('goes on destroy, so nothing is left on w for a later chart', () => {
    pending = [['stroke.dashArray', [{ series: 'S1', value: 7 }]]]
    const chart = lineChart([{ name: 'claimer' }])
    const w = chart.w
    chart.destroy()
    expect(w.weaveClaims.byOption.get('stroke.dashArray')).toEqual([])
  })
})

describe('what a plugin may claim', () => {
  it('refuses an option that is not claimable, and says which are', () => {
    pending = [['chart.background', [{ series: 'S1', value: 'red' }]]]
    lineChart([{ name: 'claimer' }])
    // A null handle rather than a throw: a plugin written against a newer host
    // degrades instead of breaking the chart it is a guest on.
    expect(handles).toEqual([])
  })

  it('drops an entry whose value is the wrong type and keeps the rest', () => {
    pending = [
      [
        'stroke.dashArray',
        [
          { series: 'S1', value: 'dashed' },
          { series: 'S2', value: 4 },
        ],
      ],
    ]
    lineChart([{ name: 'claimer' }])
    expect(dashes()).toEqual(['0', '4'])
  })

  it('ignores a claim on a series that is not there', () => {
    pending = [['stroke.dashArray', [{ series: 'Nope', value: 7 }]]]
    lineChart([{ name: 'claimer' }])
    expect(dashes()).toEqual(['0', '0'])
  })

  // The allowlist is the difference between this and "write anything to the
  // caller's config", so its shape is asserted rather than assumed.
  it('declares a value type for every claimable option', () => {
    const names = Object.keys(CLAIMABLE)
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      expect(['number', 'boolean', 'string']).toContain(CLAIMABLE[name].type)
    }
    expect(Object.isFrozen(CLAIMABLE)).toBe(true)
  })
})
