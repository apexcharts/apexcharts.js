import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/full.js'

// Regression tests for the crash reported in react-apexcharts#602:
//   "Cannot read properties of undefined (reading 'node')"
// It happens when destroy()/clear() runs on a chart that never completed
// setupElements() — e.g. it was rendered while detached from the DOM, so
// create() bailed out early and w.dom.Paper is still undefined. Tearing such a
// chart down (React useEffect cleanup, or a queued resize update() firing after
// the element was removed) must not throw.

describe('destroy() on an un-mounted / detached chart (#602)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('does not throw when render() bailed because the element was detached', async () => {
    // element intentionally NOT attached to document -> el.isConnected === false
    const el = document.createElement('div')

    const chart = new ApexCharts(el, {
      chart: { id: 'detached-602', type: 'bar', animations: { enabled: false } },
      series: [{ data: [1, 2, 3] }],
      // responsive present because the original reports correlate the crash with it
      responsive: [{ breakpoint: 480, options: { chart: { width: 300 } } }],
    })

    // create() returns early (element not connected) so Paper is never created
    try {
      await chart.render()
    } catch (e) {
      // render() rejects with "Element not found" for a detached element
    }

    expect(() => chart.destroy()).not.toThrow()
  })

  it('does not throw in clearDomElements when Paper was never created (no chart.id)', async () => {
    // no chart.id -> destroy() skips the _chartInstances path and goes straight
    // to clear() -> clearDomElements(), which is the exact "reading 'node'" site.
    if (typeof window.Apex === 'undefined') window.Apex = {}
    window.Apex._chartInstances = []

    const el = document.createElement('div') // detached -> Paper never created
    const chart = new ApexCharts(el, {
      chart: { type: 'bar', animations: { enabled: false } },
      series: [{ data: [1, 2, 3] }],
    })
    try {
      await chart.render()
    } catch (e) {}

    expect(() => chart.destroy()).not.toThrow()
  })

  it('does not throw when destroyed twice', () => {
    document.body.innerHTML = '<div id="chart" />'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { id: 'twice-602', type: 'line', animations: { enabled: false } },
      series: [{ data: [1, 2, 3] }],
    })
    chart.render()

    expect(() => chart.destroy()).not.toThrow()
    expect(() => chart.destroy()).not.toThrow()
  })

  it('does not throw when Apex._chartInstances is missing', async () => {
    // simulate a fresh global where the registry was never initialised
    if (typeof window.Apex !== 'undefined') {
      delete window.Apex._chartInstances
    }
    const el = document.createElement('div')
    const chart = new ApexCharts(el, {
      chart: { id: 'noregistry-602', type: 'bar', animations: { enabled: false } },
      series: [{ data: [1, 2, 3] }],
    })
    try {
      await chart.render()
    } catch (e) {}

    expect(() => chart.destroy()).not.toThrow()
  })
})
