import { describe, it, expect, vi } from 'vitest'
import UpdateHelpers from '../../src/modules/helpers/UpdateHelpers.js'
import Localization from '../../src/modules/helpers/Localization.js'
import LegendHelpers from '../../src/modules/legend/Helpers.js'

// ---------------------------------------------------------------------------
// Minimal factory helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal `w` (chart context) for UpdateHelpers tests.
 * Only properties that the methods under test access are present.
 */
function makeW(overrides = {}) {
  const w = {
    config: {
      chart: { type: 'line', stacked: false, stackType: undefined },
      xaxis: { min: undefined, max: undefined, convertedCatToNumeric: false },
      yaxis: [
        { min: undefined, max: undefined },
        { min: undefined, max: undefined },
      ],
      series: [
        {
          name: 'A',
          color: '#f00',
          type: 'line',
          group: undefined,
          data: [1, 2, 3],
        },
        {
          name: 'B',
          color: '#00f',
          type: 'bar',
          group: undefined,
          data: [4, 5, 6],
        },
      ],
    },
    globals: {
      lastXAxis: { min: 0, max: 100 },
      lastYAxis: [
        { min: 10, max: 200 },
        { min: 0, max: 50 },
      ],
      zoomed: false,
      axisCharts: true,
      collapsedSeriesIndices: [],
      ancillaryCollapsedSeriesIndices: [],
      ...overrides.globals,
    },
  }
  return w
}

/** Build a minimal ctx (just enough for UpdateHelpers constructor). */
function makeCtx(w, opts = {}) {
  return {
    w,
    opts: {
      yaxis: w.config.yaxis,
      ...opts,
    },
  }
}

// ---------------------------------------------------------------------------
// UpdateHelpers._extendSeries
// ---------------------------------------------------------------------------

describe('UpdateHelpers._extendSeries', () => {
  /** All new fields present → use them; existing series just provides fallbacks. */
  it('uses new values when all fields are provided', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const result = uh._extendSeries(
      {
        name: 'X',
        color: '#abc',
        type: 'area',
        group: 'g1',
        hidden: true,
        data: [9, 8],
      },
      0, // series index 0
    )

    expect(result.name).toBe('X')
    expect(result.color).toBe('#abc')
    expect(result.type).toBe('area')
    expect(result.group).toBe('g1')
    expect(result.hidden).toBe(true)
    expect(result.data).toEqual([9, 8])
  })

  it('falls back to existing series values when new fields are absent', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    // Empty update object — everything should come from w.config.series[1]
    const result = uh._extendSeries({}, 1)

    expect(result.name).toBe('B')
    expect(result.color).toBe('#00f')
    expect(result.type).toBe('bar')
    expect(result.data).toEqual([4, 5, 6])
  })

  it('assigns zIndex from index when not provided', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const result = uh._extendSeries({}, 1)
    // when s.zIndex is undefined, zIndex defaults to the series index
    expect(result.zIndex).toBe(1)
  })

  it('uses explicit zIndex when provided', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const result = uh._extendSeries({ zIndex: 99 }, 0)
    expect(result.zIndex).toBe(99)
  })

  it('correctly sets hidden=false (falsy but defined) from new series', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    // hidden=false is defined → should use it, not fall back to ser?.hidden
    const result = uh._extendSeries({ hidden: false }, 0)
    expect(result.hidden).toBe(false)
  })

  it('merges all existing series fields into the result', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    // _extendSeries spreads w.config.series[i], so any extra keys survive
    w.config.series[0].customProp = 'kept'
    const result = uh._extendSeries({}, 0)
    expect(result.customProp).toBe('kept')
  })
})

// ---------------------------------------------------------------------------
// UpdateHelpers.forceXAxisUpdate
// ---------------------------------------------------------------------------

describe('UpdateHelpers.forceXAxisUpdate', () => {
  it('writes min and max from options.xaxis into w.config.xaxis and lastXAxis', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const options = { xaxis: { min: 5, max: 80 } }
    uh.forceXAxisUpdate(options)

    expect(w.config.xaxis.min).toBe(5)
    expect(w.config.xaxis.max).toBe(80)
    expect(w.globals.lastXAxis.min).toBe(5)
    expect(w.globals.lastXAxis.max).toBe(80)
  })

  it('does not touch xaxis min/max when they are absent from options', () => {
    const w = makeW()
    w.config.xaxis.min = 10
    w.config.xaxis.max = 90
    const uh = new UpdateHelpers(w, makeCtx(w))

    // options.xaxis has neither min nor max
    uh.forceXAxisUpdate({ xaxis: {} })

    expect(w.config.xaxis.min).toBe(10)
    expect(w.config.xaxis.max).toBe(90)
  })

  it('updates xaxis.categories when a non-empty array is supplied', () => {
    const w = makeW()
    w.config.xaxis.categories = []
    const uh = new UpdateHelpers(w, makeCtx(w))

    uh.forceXAxisUpdate({ xaxis: { categories: ['Jan', 'Feb', 'Mar'] } })

    expect(w.config.xaxis.categories).toEqual(['Jan', 'Feb', 'Mar'])
  })

  it('does not touch categories when the provided array is empty', () => {
    const w = makeW()
    w.config.xaxis.categories = ['A', 'B']
    const uh = new UpdateHelpers(w, makeCtx(w))

    uh.forceXAxisUpdate({ xaxis: { categories: [] } })

    // empty array → no update
    expect(w.config.xaxis.categories).toEqual(['A', 'B'])
  })

  it('returns the (possibly mutated) options object', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))
    const options = { xaxis: { min: 1, max: 9 } }

    const result = uh.forceXAxisUpdate(options)
    expect(result).toBe(options)
  })
})

// ---------------------------------------------------------------------------
// UpdateHelpers.forceYAxisUpdate
// ---------------------------------------------------------------------------

describe('UpdateHelpers.forceYAxisUpdate', () => {
  it('forces min=0 / max=100 on every yaxis entry for 100% stacked charts', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const options = {
      chart: { stacked: true, stackType: '100%' },
      yaxis: [
        { min: -50, max: 200 },
        { min: 5, max: 80 },
      ],
    }

    uh.forceYAxisUpdate(options)

    expect(options.yaxis[0].min).toBe(0)
    expect(options.yaxis[0].max).toBe(100)
    expect(options.yaxis[1].min).toBe(0)
    expect(options.yaxis[1].max).toBe(100)
  })

  it('handles a single-object yaxis (non-array) for 100% stacked', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const options = {
      chart: { stacked: true, stackType: '100%' },
      yaxis: { min: -20, max: 120 }, // object, not array
    }

    uh.forceYAxisUpdate(options)

    expect(options.yaxis.min).toBe(0)
    expect(options.yaxis.max).toBe(100)
  })

  it('does not touch yaxis when chart is stacked but stackType is not 100%', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const options = {
      chart: { stacked: true, stackType: 'normal' },
      yaxis: [{ min: -50, max: 200 }],
    }

    uh.forceYAxisUpdate(options)

    // no change
    expect(options.yaxis[0].min).toBe(-50)
    expect(options.yaxis[0].max).toBe(200)
  })

  it('does not touch yaxis when chart is not stacked at all', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))

    const options = {
      chart: { stacked: false },
      yaxis: [{ min: 0, max: 50 }],
    }

    uh.forceYAxisUpdate(options)

    expect(options.yaxis[0].min).toBe(0)
    expect(options.yaxis[0].max).toBe(50)
  })

  it('returns the options object', () => {
    const w = makeW()
    const uh = new UpdateHelpers(w, makeCtx(w))
    const options = { chart: { stacked: false }, yaxis: [] }

    const result = uh.forceYAxisUpdate(options)
    expect(result).toBe(options)
  })
})

// ---------------------------------------------------------------------------
// UpdateHelpers.revertDefaultAxisMinMax
// ---------------------------------------------------------------------------

describe('UpdateHelpers.revertDefaultAxisMinMax', () => {
  it('restores xaxis min/max from lastXAxis when not zoomed and no opts', () => {
    const w = makeW()
    w.globals.lastXAxis = { min: 5, max: 95 }
    w.globals.zoomed = false
    const uh = new UpdateHelpers(w, makeCtx(w))

    uh.revertDefaultAxisMinMax()

    expect(w.config.xaxis.min).toBe(5)
    expect(w.config.xaxis.max).toBe(95)
  })

  it('uses opts.xaxis min/max when opts is provided', () => {
    const w = makeW()
    w.globals.lastXAxis = { min: 0, max: 100 }
    const uh = new UpdateHelpers(w, makeCtx(w))

    uh.revertDefaultAxisMinMax({ xaxis: { min: 20, max: 60 } })

    expect(w.config.xaxis.min).toBe(20)
    expect(w.config.xaxis.max).toBe(60)
  })

  it('restores yaxis min/max from lastYAxis when zoomed', () => {
    const w = makeW()
    w.globals.zoomed = true
    w.globals.lastYAxis = [
      { min: 10, max: 200 },
      { min: 0, max: 50 },
    ]
    const uh = new UpdateHelpers(w, makeCtx(w))

    uh.revertDefaultAxisMinMax()

    expect(w.config.yaxis[0].min).toBe(10)
    expect(w.config.yaxis[0].max).toBe(200)
    expect(w.config.yaxis[1].min).toBe(0)
    expect(w.config.yaxis[1].max).toBe(50)
  })

  it('falls back to ctx.opts.yaxis when lastYAxis entry is missing and not zoomed', () => {
    const w = makeW()
    w.globals.zoomed = false
    w.globals.lastYAxis = [] // no last axis stored
    const ctx = makeCtx(w, {
      yaxis: [
        { min: 1, max: 10 },
        { min: 2, max: 20 },
      ],
    })
    const uh = new UpdateHelpers(w, ctx)

    uh.revertDefaultAxisMinMax()

    // should pull from ctx.opts.yaxis
    expect(w.config.yaxis[0].min).toBe(1)
    expect(w.config.yaxis[0].max).toBe(10)
    expect(w.config.yaxis[1].min).toBe(2)
    expect(w.config.yaxis[1].max).toBe(20)
  })

  it('uses opts.yaxis when provided as override', () => {
    const w = makeW()
    w.globals.zoomed = false
    const uh = new UpdateHelpers(w, makeCtx(w))

    uh.revertDefaultAxisMinMax({
      yaxis: [
        { min: 99, max: 999 },
        { min: 0, max: 1 },
      ],
    })

    expect(w.config.yaxis[0].min).toBe(99)
    expect(w.config.yaxis[0].max).toBe(999)
  })
})

// ---------------------------------------------------------------------------
// Localization.setCurrentLocaleValues
// ---------------------------------------------------------------------------

describe('Localization.setCurrentLocaleValues', () => {
  /** Build a minimal ctx for Localization. */
  function makeLocCtx(locales = []) {
    const w = {
      config: {
        chart: { locales },
      },
      globals: {
        locale: null,
      },
    }
    return { w }
  }

  it('sets w.globals.locale from a matching locale entry', () => {
    const ctx = makeLocCtx([
      {
        name: 'fr',
        options: {
          months: ['Janvier', 'Février'],
          toolbar: { download: 'Télécharger' },
        },
      },
    ])
    const loc = new Localization(ctx.w)

    loc.setCurrentLocaleValues('fr')

    // The locale options should be merged and stored in globals
    expect(ctx.w.globals.locale).toBeDefined()
    // Our custom French month should be present
    expect(ctx.w.globals.locale.months[0]).toBe('Janvier')
  })

  it('merges the custom locale with the built-in English defaults', () => {
    // Provide only a partial locale — the rest should come from the English defaults
    const ctx = makeLocCtx([
      {
        name: 'partial',
        options: {
          toolbar: { download: 'Save' },
        },
      },
    ])
    const loc = new Localization(ctx.w)
    loc.setCurrentLocaleValues('partial')

    // 'toolbar.download' was overridden
    expect(ctx.w.globals.locale.toolbar.download).toBe('Save')
    // English default 'months' should still be present since we did not override it
    expect(Array.isArray(ctx.w.globals.locale.months)).toBe(true)
    expect(ctx.w.globals.locale.months.length).toBe(12)
  })

  it('throws when the locale name is not found in chart.locales', () => {
    const ctx = makeLocCtx([{ name: 'de', options: {} }])
    const loc = new Localization(ctx.w)

    expect(() => loc.setCurrentLocaleValues('es')).toThrow(
      'Wrong locale name provided',
    )
  })

  it('uses the "en" built-in locale directly when name matches English defaults', () => {
    // An empty options object should still produce a valid locale after merge
    const ctx = makeLocCtx([{ name: 'en', options: {} }])
    const loc = new Localization(ctx.w)

    loc.setCurrentLocaleValues('en')

    expect(ctx.w.globals.locale).not.toBeNull()
    expect(typeof ctx.w.globals.locale.toolbar).toBe('object')
  })
})

// ---------------------------------------------------------------------------
// LegendHelpers._getSeriesBasedOnCollapsedState
// ---------------------------------------------------------------------------

describe('LegendHelpers._getSeriesBasedOnCollapsedState', () => {
  function makeLgCtx(overrides = {}) {
    const w = {
      config: {
        chart: { type: 'line' },
        series: [
          { name: 'A', data: [1, 2, 3] },
          { name: 'B', data: [4, 5, 6] },
          { name: 'C', data: [7, 8, 9] },
        ],
      },
      globals: {
        axisCharts: true,
        collapsedSeriesIndices: [],
        ancillaryCollapsedSeriesIndices: [],
        allSeriesCollapsed: false,
        ...overrides,
      },
    }
    return { w, ctx: { w } }
  }

  it('does not modify series when none are collapsed', () => {
    const { w, ctx } = makeLgCtx()
    const helpers = new LegendHelpers({ w, ctx })

    const series = [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [4, 5, 6] },
    ]
    const result = helpers._getSeriesBasedOnCollapsedState(series)

    expect(result[0].data).toEqual([1, 2, 3])
    expect(result[1].data).toEqual([4, 5, 6])
    expect(w.globals.allSeriesCollapsed).toBe(false)
  })

  it('zeroes out data for collapsed axis-chart series', () => {
    const { w, ctx } = makeLgCtx({
      collapsedSeriesIndices: [1],
    })
    const helpers = new LegendHelpers({ w, ctx })

    const series = [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [4, 5, 6] }, // index 1 is collapsed
    ]
    helpers._getSeriesBasedOnCollapsedState(series)

    expect(series[1].data).toEqual([])
    expect(series[0].data).toEqual([1, 2, 3]) // untouched
  })

  it('sets allSeriesCollapsed=true when every series is collapsed', () => {
    const { w, ctx } = makeLgCtx({
      collapsedSeriesIndices: [0, 1],
    })
    const helpers = new LegendHelpers({ w, ctx })

    const series = [
      { name: 'A', data: [1, 2] },
      { name: 'B', data: [3, 4] },
    ]
    helpers._getSeriesBasedOnCollapsedState(series)

    expect(w.globals.allSeriesCollapsed).toBe(true)
  })

  it('zeroes out non-axis series (pie) to 0 numeric for collapsed indices', () => {
    const { w, ctx } = makeLgCtx({
      axisCharts: false,
      collapsedSeriesIndices: [0],
    })
    const helpers = new LegendHelpers({ w, ctx })

    const series = [44, 55, 13] // pie series: plain numbers
    helpers._getSeriesBasedOnCollapsedState(series)

    expect(series[0]).toBe(0)
    expect(series[1]).toBe(55) // untouched
    expect(series[2]).toBe(13) // untouched
  })

  it('considers ancillaryCollapsedSeriesIndices in the collapsed count for axis charts', () => {
    const { w, ctx } = makeLgCtx({
      collapsedSeriesIndices: [0],
      ancillaryCollapsedSeriesIndices: [1],
    })
    const helpers = new LegendHelpers({ w, ctx })

    const series = [
      { name: 'A', data: [1] }, // collapsed via collapsedSeriesIndices
      { name: 'B', data: [2] }, // collapsed via ancillary
    ]
    helpers._getSeriesBasedOnCollapsedState(series)

    // Both should have empty data
    expect(series[0].data).toEqual([])
    expect(series[1].data).toEqual([])
    expect(w.globals.allSeriesCollapsed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// LegendHelpers.getSeriesAfterCollapsing
// ---------------------------------------------------------------------------

describe('LegendHelpers.getSeriesAfterCollapsing', () => {
  function makeLgCtxFull(overrides = {}) {
    const series = [
      { name: 'A', type: 'line', data: [10, 20, 30] },
      { name: 'B', type: 'bar', data: [40, 50, 60] },
    ]
    const w = {
      config: {
        chart: { type: 'line' },
        series,
        yaxis: [
          { show: true, showAlways: false },
          { show: true, showAlways: false },
        ],
      },
      globals: {
        axisCharts: true,
        collapsedSeries: [],
        collapsedSeriesIndices: [],
        ancillaryCollapsedSeries: [],
        ancillaryCollapsedSeriesIndices: [],
        risingSeries: [],
        allSeriesCollapsed: false,
        // seriesYAxisReverseMap maps series → yaxis index
        seriesYAxisReverseMap: [0, 1],
        ...overrides,
      },
    }
    return { w, ctx: { w } }
  }

  it('adds the series to collapsedSeries and records its index', () => {
    const { w, ctx } = makeLgCtxFull()
    const helpers = new LegendHelpers({ w, ctx })

    helpers.getSeriesAfterCollapsing({ realIndex: 0 })

    expect(w.globals.collapsedSeriesIndices).toContain(0)
    expect(w.globals.collapsedSeries[0].index).toBe(0)
    expect(w.globals.collapsedSeries[0].data).toEqual([10, 20, 30])
  })

  it('stores the series type with the collapse data', () => {
    const { w, ctx } = makeLgCtxFull()
    const helpers = new LegendHelpers({ w, ctx })

    helpers.getSeriesAfterCollapsing({ realIndex: 1 })

    expect(w.globals.collapsedSeries[0].type).toBe('bar')
  })

  it('does not add duplicate collapsed entries for the same realIndex', () => {
    const { w, ctx } = makeLgCtxFull()
    const helpers = new LegendHelpers({ w, ctx })

    helpers.getSeriesAfterCollapsing({ realIndex: 0 })
    helpers.getSeriesAfterCollapsing({ realIndex: 0 }) // called again

    expect(w.globals.collapsedSeriesIndices.filter((i) => i === 0).length).toBe(
      1,
    )
  })

  it('routes to ancillaryCollapsedSeries when yaxis.showAlways is true', () => {
    const { w, ctx } = makeLgCtxFull()
    w.config.yaxis[0].showAlways = true // axis stays visible even when collapsed
    const helpers = new LegendHelpers({ w, ctx })

    helpers.getSeriesAfterCollapsing({ realIndex: 0 })

    expect(w.globals.ancillaryCollapsedSeriesIndices).toContain(0)
    expect(w.globals.collapsedSeriesIndices).not.toContain(0)
  })

  it('sets allSeriesCollapsed when all series are collapsed', () => {
    const { w, ctx } = makeLgCtxFull()
    const helpers = new LegendHelpers({ w, ctx })

    helpers.getSeriesAfterCollapsing({ realIndex: 0 })
    helpers.getSeriesAfterCollapsing({ realIndex: 1 })

    expect(w.globals.allSeriesCollapsed).toBe(true)
  })

  it('returns a series array with collapsed series zeroed out', () => {
    const { w, ctx } = makeLgCtxFull()
    const helpers = new LegendHelpers({ w, ctx })

    const result = helpers.getSeriesAfterCollapsing({ realIndex: 0 })

    // collapsed series should have empty data in the returned array
    expect(Array.isArray(result)).toBe(true)
    expect(result[0].data).toEqual([])
    expect(result[1].data).toEqual([40, 50, 60])
  })
})

// ---------------------------------------------------------------------------
// LegendHelpers.riseCollapsedSeries
// ---------------------------------------------------------------------------

describe('LegendHelpers.riseCollapsedSeries', () => {
  function makeLgCtxFull(overrides = {}) {
    const series = [
      { name: 'A', type: 'line', data: [10, 20, 30] },
      { name: 'B', type: 'bar', data: [40, 50, 60] },
    ]
    const w = {
      config: {
        chart: {
          type: 'line',
          animations: { dynamicAnimation: { enabled: false } },
        },
        series,
      },
      globals: {
        axisCharts: true,
        collapsedSeries: [],
        collapsedSeriesIndices: [],
        ancillaryCollapsedSeries: [],
        ancillaryCollapsedSeriesIndices: [],
        risingSeries: [],
        allSeriesCollapsed: false,
        ...overrides,
      },
    }
    // Create a stub for updateHelpers._updateSeries so we can verify it is called
    const updateHelperStub = { _updateSeries: vi.fn() }
    const ctx = { w, updateHelpers: updateHelperStub }
    // lgCtx must have updateSeries callback (set by Legend constructor)
    const lgCtx = {
      w,
      ctx,
      updateSeries: (...a) => ctx.updateHelpers._updateSeries(...a),
      printDataLabelsInner: () => {},
    }
    return { w, ctx, lgCtx, updateHelperStub }
  }

  it('does nothing and never calls _updateSeries when collapsedSeries is empty', () => {
    const { lgCtx, updateHelperStub } = makeLgCtxFull()
    const helpers = new LegendHelpers(lgCtx)

    helpers.riseCollapsedSeries([], [], 0)

    expect(updateHelperStub._updateSeries).not.toHaveBeenCalled()
  })

  it('restores original data for a matching realIndex from collapsedSeries', () => {
    const originalData = [10, 20, 30]
    const { w, lgCtx } = makeLgCtxFull({
      collapsedSeries: [{ index: 0, data: originalData.slice(), type: 'line' }],
      collapsedSeriesIndices: [0],
    })
    const helpers = new LegendHelpers(lgCtx)

    helpers.riseCollapsedSeries(
      w.globals.collapsedSeries,
      w.globals.collapsedSeriesIndices,
      0,
    )

    // The config series should have the original data restored
    expect(w.config.series[0].data).toEqual(originalData)
  })

  it('removes the entry from collapsedSeries and collapsedSeriesIndices after rising', () => {
    const { w, lgCtx } = makeLgCtxFull({
      collapsedSeries: [{ index: 1, data: [4, 5, 6], type: 'bar' }],
      collapsedSeriesIndices: [1],
    })
    const helpers = new LegendHelpers(lgCtx)

    helpers.riseCollapsedSeries(
      w.globals.collapsedSeries,
      w.globals.collapsedSeriesIndices,
      1,
    )

    expect(w.globals.collapsedSeries.length).toBe(0)
    expect(w.globals.collapsedSeriesIndices.length).toBe(0)
  })

  it('adds the risen realIndex to risingSeries', () => {
    const { w, lgCtx } = makeLgCtxFull({
      collapsedSeries: [{ index: 0, data: [1], type: 'line' }],
      collapsedSeriesIndices: [0],
      risingSeries: [],
    })
    const helpers = new LegendHelpers(lgCtx)

    helpers.riseCollapsedSeries(
      w.globals.collapsedSeries,
      w.globals.collapsedSeriesIndices,
      0,
    )

    expect(w.globals.risingSeries).toContain(0)
  })

  it('calls _updateSeries when a series is risen', () => {
    const { w, lgCtx, updateHelperStub } = makeLgCtxFull({
      collapsedSeries: [{ index: 0, data: [1, 2], type: 'line' }],
      collapsedSeriesIndices: [0],
    })
    const helpers = new LegendHelpers(lgCtx)

    helpers.riseCollapsedSeries(
      w.globals.collapsedSeries,
      w.globals.collapsedSeriesIndices,
      0,
    )

    expect(updateHelperStub._updateSeries).toHaveBeenCalledOnce()
  })

  it('only rises the matching series, leaving unrelated collapsed entries intact', () => {
    const { w, lgCtx } = makeLgCtxFull({
      collapsedSeries: [
        { index: 0, data: [10], type: 'line' },
        { index: 1, data: [40], type: 'bar' },
      ],
      collapsedSeriesIndices: [0, 1],
    })
    const helpers = new LegendHelpers(lgCtx)

    // Only rise series at realIndex=0
    helpers.riseCollapsedSeries(
      w.globals.collapsedSeries,
      w.globals.collapsedSeriesIndices,
      0,
    )

    // Index 1 should remain collapsed
    expect(w.globals.collapsedSeriesIndices).toContain(1)
    expect(w.globals.collapsedSeries.find((s) => s.index === 1)).toBeDefined()
  })
})
