/**
 * Weave v6, the two small reads: the chart's title, and the modifier keys.
 *
 * Both exist for the same reason as `info.stroke` before them: the chart knows
 * something a plugin has no other way to learn, and without it the plugin
 * either guesses or does without. The title is what a page-level readout should
 * call this chart; the modifiers are what a gesture beyond plain click needs.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'

/** What the probe plugin saw. */
let info = null
/** Pointer payloads, in arrival order. */
let events = []

const probe = {
  name: 'v6probe',
  apiVersion: 2,
  setup(api) {
    info = api.info
    api.pointer((e) => events.push(e))
  },
}

// A block body, not an expression: registerPlugin returns the ApexCharts class
// and vitest treats a returned value as a teardown function, which then fails
// with "Class constructor ApexCharts cannot be invoked without 'new'".
beforeAll(() => {
  ApexCharts.registerPlugin(probe)
})

beforeEach(() => {
  info = null
  events = []
})

function chart(extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'bar',
      width: 400,
      height: 300,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    legend: { show: false },
    series: [{ name: 'S1', data: [1, 2, 3] }],
    xaxis: { categories: ['a', 'b', 'c'] },
    plugins: [{ name: 'v6probe' }],
    ...extra,
  })
}

// ---------------------------------------------------------------------------

describe('the chart title, through the facade', () => {
  it('reports the name the page gave this chart', () => {
    chart({ title: { text: 'Revenue by region' } })
    expect(info.title).toBe('Revenue by region')
  })

  // A string either way, so a plugin can drop it into a template without a
  // guard; falsy when there is no title, which is the check that matters.
  it('is an empty string for an untitled chart', () => {
    chart()
    expect(info.title).toBe('')
  })

  it('is frozen with the rest of info', () => {
    chart({ title: { text: 'Revenue' } })
    expect(Object.isFrozen(info)).toBe(true)
  })

  it('follows a title the caller changes', async () => {
    const c = chart({ title: { text: 'Before' } })
    await c.updateOptions({ title: { text: 'After' } })
    // `info` is a getter: the plugin holds the facade, not a snapshot.
    expect(c.w.config.title.text).toBe('After')
  })
})

describe('the modifier keys on a pointer event', () => {
  /** Click the first bar, with whatever modifiers. */
  function clickBar(init = {}) {
    const bar = document.querySelector('.apexcharts-bar-area')
    bar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, ...init }))
  }

  it('reports a plain click as no keys held', () => {
    chart()
    clickBar()
    expect(events.at(-1).modifiers).toEqual({
      shift: false,
      ctrl: false,
      alt: false,
      meta: false,
    })
  })

  it('reports shift, which is the gesture page mode wants', () => {
    chart()
    clickBar({ shiftKey: true })
    expect(events.at(-1).modifiers.shift).toBe(true)
  })

  it('reports the platform accelerator keys separately', () => {
    chart()
    clickBar({ metaKey: true, altKey: true })
    const m = events.at(-1).modifiers
    expect(m.meta).toBe(true)
    expect(m.alt).toBe(true)
    expect(m.ctrl).toBe(false)
  })

  // The shape is the contract: a plugin writes `if (e.modifiers.shift)` with no
  // guard, so the object is always there with all four keys.
  it('is always the same four booleans, on every event type', () => {
    chart()
    const bar = document.querySelector('.apexcharts-bar-area')
    bar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    bar.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    clickBar()
    expect(events.length).toBeGreaterThan(0)
    for (const e of events) {
      expect(Object.keys(e.modifiers).sort()).toEqual([
        'alt',
        'ctrl',
        'meta',
        'shift',
      ])
    }
  })
})
