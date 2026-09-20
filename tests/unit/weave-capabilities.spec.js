/**
 * Weave v6: what a plugin can ask the host about itself.
 *
 * The version integer cannot answer this. A plugin declaring a version newer
 * than the host is skipped outright, so a plugin that has to run against
 * several hosts declares the LOWEST it can work on and then has to discover
 * anything above that, which until now meant sniffing the facade for function
 * members. These tests pin the answer and, more importantly, pin that a plugin
 * cannot edit what later plugins are told.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
import { WEAVE_CAPABILITIES } from '../../src/modules/weave/PluginAPI.js'

/** What the probe was told, captured at setup. */
let reported = null

const prober = {
  name: 'capprober',
  apiVersion: 2,
  setup(api) {
    reported = {
      can: (name) => api.can(name),
      capabilities: api.capabilities,
    }
  },
}

// A block body, not an expression: registerPlugin returns the ApexCharts class
// and vitest treats a returned value as a teardown function, which then fails
// with "Class constructor ApexCharts cannot be invoked without 'new'".
beforeAll(() => {
  ApexCharts.registerPlugin(prober)
})

beforeEach(() => {
  reported = null
})

function chart() {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 400,
      height: 300,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    legend: { show: false },
    series: [{ name: 'S1', data: [1, 2, 3] }],
    xaxis: { categories: ['a', 'b', 'c'] },
    plugins: [{ name: 'capprober' }],
  })
}

// ---------------------------------------------------------------------------

describe('api.capabilities', () => {
  it('reports what this host supports, and answers can()', () => {
    chart()
    expect(reported.can('claim')).toBe(true)
    expect(reported.can('pointer')).toBe(true)
    expect(reported.can('nonsense')).toBe(false)
  })

  // A frozen Set is not read-only: Object.freeze does not touch internal slots,
  // so add() and delete() would still work and one plugin could edit what every
  // later one is told.
  it('hands out something a plugin cannot edit', () => {
    chart()
    expect(Array.isArray(reported.capabilities)).toBe(true)
    expect(Object.isFrozen(reported.capabilities)).toBe(true)
    expect(() => reported.capabilities.push('nonsense')).toThrow()
    expect(reported.can('nonsense')).toBe(false)
  })

  // scales is null on a pie rather than absent on an old host, so advertising
  // it would tell a plugin the wrong thing about the chart it is on.
  it('does not advertise scales, which is a chart shape rather than a host feature', () => {
    chart()
    expect(reported.capabilities).not.toContain('scales')
  })

  // Every published name is probed off the facade that was actually built. A
  // name with no probe would be advertised unconditionally, which is the whole
  // failure this table exists to prevent.
  it('grants every name it publishes, on a host that wires them all', () => {
    chart()
    for (const name of WEAVE_CAPABILITIES) {
      expect(reported.can(name)).toBe(true)
    }
  })
})
