import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
import {
  captureViewState,
  VIEWSTATE_VERSION,
} from '../../src/modules/state/ViewState.js'
import Utils from '../../src/utils/Utils.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lineChart(overrides = {}) {
  return createChartWithOptions({
    chart: { type: 'line', animations: { enabled: false }, ...overrides.chart },
    series: overrides.series || [
      { name: 'A', data: [10, 20, 30, 40, 50] },
      { name: 'B', data: [5, 15, 25, 35, 45] },
    ],
    xaxis: { type: 'numeric', ...overrides.xaxis },
    ...(overrides.theme ? { theme: overrides.theme } : {}),
  })
}

// ---------------------------------------------------------------------------
// captureViewState: reads the right sources
// ---------------------------------------------------------------------------

describe('captureViewState', () => {
  it('captures the schema version and core fields from a fresh chart', () => {
    const chart = lineChart()
    const view = captureViewState(chart.w, chart)

    expect(view.v).toBe(VIEWSTATE_VERSION)
    expect(view.window.xaxis).toBeNull() // not zoomed
    expect(view.zoomed).toBe(false)
    expect(view.collapsed).toEqual([])
    expect(view.selectedDataPoints).toEqual([])
    expect(view.annotations).toHaveProperty('static')
    expect(Array.isArray(view.annotations.dynamic)).toBe(true)
    chart.destroy()
  })

  it('reflects a zoom window set via updateOptions', async () => {
    const chart = lineChart()
    await chart.updateOptions({ xaxis: { min: 1, max: 3 } }, false, false)

    const view = captureViewState(chart.w, chart)
    expect(view.window.xaxis).toEqual({ min: 1, max: 3 })
    chart.destroy()
  })

  it('reflects theme mode/palette and locale', () => {
    const chart = lineChart({ theme: { mode: 'dark', palette: 'palette2' } })
    const view = captureViewState(chart.w, chart)

    expect(view.theme).toEqual({ mode: 'dark', palette: 'palette2' })
    expect(view.locale).toBe('en')
    chart.destroy()
  })

  it('records collapsed series indices after hideSeries', async () => {
    const chart = lineChart()
    chart.hideSeries('B')

    const view = captureViewState(chart.w, chart)
    expect(view.collapsed).toContain(1)
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// Perspectives: capture / encode / decode
// ---------------------------------------------------------------------------

describe('Perspectives capture/encode/decode', () => {
  it('exposes chart.perspectives when the feature is bundled', () => {
    const chart = lineChart()
    expect(chart.perspectives).toBeTruthy()
    expect(typeof chart.perspectives.capture).toBe('function')
    chart.destroy()
  })

  it('capture() returns a { v, view } token', () => {
    const chart = lineChart()
    const token = chart.perspectives.capture()
    expect(token.v).toBe(1)
    expect(token.view).toBeTruthy()
    expect(token.view.v).toBe(VIEWSTATE_VERSION)
    chart.destroy()
  })

  it('encode/decode round-trips a token exactly', () => {
    const chart = lineChart()
    const token = chart.perspectives.capture()
    const str = chart.perspectives.encode(token)

    expect(typeof str).toBe('string')
    const decoded = ApexCharts.perspectives.decode(str)
    expect(decoded).toEqual(token)
    chart.destroy()
  })

  it('decode returns null (with a warning) on garbage input', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(ApexCharts.perspectives.decode('!!!not-base64!!!')).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('decode returns null (with a warning) on a version mismatch', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = lineChart()
    const token = chart.perspectives.capture()
    token.v = 999
    const str = chart.perspectives.encode(token)
    expect(ApexCharts.perspectives.decode(str)).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    chart.destroy()
  })

  it('serializes the whitelisted option delta (theme) into the token', () => {
    const chart = lineChart({ theme: { mode: 'dark', palette: 'palette3' } })
    const token = chart.perspectives.capture()
    expect(token.options).toBeTruthy()
    expect(token.options.theme.palette).toBe('palette3')
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// Function handling: the crux difference from Rewind
// ---------------------------------------------------------------------------

describe('function handling', () => {
  it('Utils.clone preserves a function by reference (in-memory constraint #1)', () => {
    const fn = (v) => v + 1
    const cloned = Utils.clone({ formatter: fn, nested: { g: fn } })
    expect(cloned.formatter).toBe(fn)
    expect(cloned.nested.g).toBe(fn)
  })

  it('an encoded token drops functions embedded in option overrides', () => {
    const chart = lineChart()
    // inject a function into a whitelisted, serialized path
    chart.w.config.title = { text: 'Hi', formatter: () => 'x' }
    const token = chart.perspectives.capture()
    const decoded = ApexCharts.perspectives.decode(
      chart.perspectives.encode(token),
    )
    expect(decoded.options.title.text).toBe('Hi')
    expect(decoded.options.title.formatter).toBeUndefined()
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// apply: deterministic round-trip on a live chart
// ---------------------------------------------------------------------------

describe('apply (round-trip on a live chart)', () => {
  it('restores the pre-mutation view: reverts zoom and un-hides a series', async () => {
    const chart = lineChart()

    // S0: baseline. Capture it.
    const s0 = chart.perspectives.capture()

    // Mutate: zoom + hide series B.
    await chart.updateOptions({ xaxis: { min: 2, max: 4 } }, false, false)
    chart.hideSeries('B')
    expect(chart.w.config.xaxis.min).toBe(2)
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)

    // Apply S0 → back to baseline.
    chart.perspectives.apply(s0, { animate: false })
    expect(chart.w.globals.collapsedSeriesIndices).not.toContain(1)
    expect(chart.w.interact.zoomed).toBe(false)
    expect(chart.w.config.xaxis.min).toBeUndefined()
    chart.destroy()
  })

  it('re-applies a captured mutated view (zoom + hidden series) after a reset', async () => {
    const chart = lineChart()

    // Mutate then capture the mutated state.
    await chart.updateOptions({ xaxis: { min: 1, max: 3 } }, false, false)
    chart.hideSeries('B')
    const mutated = chart.perspectives.capture()
    expect(mutated.window.xaxis).toEqual({ min: 1, max: 3 })
    expect(mutated.view.collapsed).toContain(1)

    // Reset to a clean baseline.
    chart.showSeries('B')
    await chart.updateOptions({ xaxis: { min: undefined, max: undefined } }, false, false)
    expect(chart.w.globals.collapsedSeriesIndices).not.toContain(1)

    // Apply the mutated capture → the state comes back.
    chart.perspectives.apply(mutated, { animate: false })
    expect(chart.w.config.xaxis.min).toBe(1)
    expect(chart.w.config.xaxis.max).toBe(3)
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// toURL / fromURL
// ---------------------------------------------------------------------------

describe('toURL / fromURL', () => {
  it('toURL embeds an #apex= token that fromURL round-trips', () => {
    const chart = lineChart()
    const url = chart.perspectives.toURL()
    expect(url).toContain('#apex=')

    const fromUrl = ApexCharts.perspectives.fromURL(url)
    expect(fromUrl).toEqual(chart.perspectives.capture())
    chart.destroy()
  })

  it('fromURL returns null when no token fragment is present', () => {
    expect(ApexCharts.perspectives.fromURL('https://example.com/page')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// save / list / delete
// ---------------------------------------------------------------------------

describe('save / list / delete', () => {
  it('saves, lists and deletes named perspectives', () => {
    const chart = lineChart()
    const id = chart.perspectives.save('Q3 anomaly')

    const list = chart.perspectives.list()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(id)
    expect(list[0].name).toBe('Q3 anomaly')
    expect(list[0].token.v).toBe(1)

    chart.perspectives.delete(id)
    expect(chart.perspectives.list()).toHaveLength(0)
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// Lifetime: survive update(), teardown on destroy()
// ---------------------------------------------------------------------------

describe('lifetime', () => {
  it('saved perspectives survive updateSeries()', async () => {
    const chart = lineChart()
    chart.perspectives.save('view')
    await chart.updateSeries([{ name: 'A', data: [1, 2, 3, 4, 5] }], false)
    expect(chart.perspectives.list()).toHaveLength(1)
    chart.destroy()
  })

  it('teardown() runs on full destroy()', () => {
    const chart = lineChart()
    chart.perspectives.save('view')
    const spy = vi.spyOn(chart.perspectives, 'teardown')
    chart.destroy()
    expect(spy).toHaveBeenCalled()
  })
})
