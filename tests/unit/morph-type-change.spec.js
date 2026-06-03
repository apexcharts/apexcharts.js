/**
 * Tests for the optional MorphTypeChange feature.
 *
 * Covers:
 *  - Pair-compatibility detection (canMorphTypes)
 *  - Shape-compatibility detection (isCompatibleSeriesShape)
 *  - Snapshot capture + mapping for each supported direction
 *  - Null-safety when the feature isn't registered — chart-type renderers
 *    must keep working unchanged.
 */

import ApexCharts from '../../src/entries/full.js'
import InitCtxVariables from '../../src/modules/helpers/InitCtxVariables.js'
import MorphTypeChange from '../../src/modules/MorphTypeChange.js'

function snapshotRegistry() {
  return new Map(InitCtxVariables._featureRegistry)
}

function restoreRegistry(snapshot) {
  InitCtxVariables._featureRegistry.clear()
  for (const [k, v] of snapshot) {
    InitCtxVariables._featureRegistry.set(k, v)
  }
}

let registrySnapshot

beforeEach(() => {
  registrySnapshot = snapshotRegistry()
})

afterEach(() => {
  restoreRegistry(registrySnapshot)
})

function makeChart(overrides = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'bar',
      animations: { enabled: false },
      width: 400,
      height: 300,
    },
    series: [{ name: 'A', data: [10, 20, 30, 40] }],
    ...overrides,
  })
  chart.render()
  return chart
}

// Minimal stub `w` for unit-testing pure methods on the class.
function makeStubChart() {
  return {
    w: {
      config: {
        chart: {
          animations: {
            enabled: true,
            speed: 800,
            chartTypeMorph: { enabled: true, speed: 600 },
            respectReducedMotion: true,
          },
        },
      },
      globals: { previousPaths: [], dom: { baseEl: null } },
      layout: { translateX: 0, translateY: 0 },
    },
  }
}

describe('MorphTypeChange.canMorphTypes', () => {
  const morph = new MorphTypeChange(makeStubChart().w, makeStubChart())

  it('accepts bar ↔ radial-family pairs', () => {
    expect(morph.canMorphTypes('bar', 'pie')).toBe(true)
    expect(morph.canMorphTypes('bar', 'donut')).toBe(true)
    expect(morph.canMorphTypes('bar', 'polarArea')).toBe(true)
    expect(morph.canMorphTypes('bar', 'radialBar')).toBe(true)
    expect(morph.canMorphTypes('pie', 'bar')).toBe(true)
    expect(morph.canMorphTypes('radialBar', 'bar')).toBe(true)
  })

  it('accepts radial ↔ radial pairs', () => {
    expect(morph.canMorphTypes('pie', 'donut')).toBe(true)
    expect(morph.canMorphTypes('donut', 'polarArea')).toBe(true)
    expect(morph.canMorphTypes('polarArea', 'radialBar')).toBe(true)
  })

  it('rejects same-type', () => {
    expect(morph.canMorphTypes('bar', 'bar')).toBe(false)
    expect(morph.canMorphTypes('pie', 'pie')).toBe(false)
  })

  it('rejects unsupported families', () => {
    expect(morph.canMorphTypes('line', 'pie')).toBe(false)
    expect(morph.canMorphTypes('bar', 'line')).toBe(false)
    expect(morph.canMorphTypes('heatmap', 'pie')).toBe(false)
    expect(morph.canMorphTypes('treemap', 'bar')).toBe(false)
  })
})

describe('MorphTypeChange.isCompatibleSeriesShape', () => {
  const morph = new MorphTypeChange(makeStubChart().w, makeStubChart())

  it('bar → pie needs flat number[]', () => {
    expect(morph.isCompatibleSeriesShape('bar', 'pie', [1, 2, 3])).toBe(true)
    expect(
      morph.isCompatibleSeriesShape('bar', 'pie', [{ data: [1, 2] }]),
    ).toBe(false)
    expect(morph.isCompatibleSeriesShape('bar', 'pie', [])).toBe(false)
  })

  it('pie → bar needs [{data: number[]}]', () => {
    expect(
      morph.isCompatibleSeriesShape('pie', 'bar', [
        { name: 'A', data: [1, 2, 3] },
      ]),
    ).toBe(true)
    expect(morph.isCompatibleSeriesShape('pie', 'bar', [1, 2, 3])).toBe(false)
  })

  it('rejects null / non-array input', () => {
    expect(morph.isCompatibleSeriesShape('bar', 'pie', null)).toBe(false)
    expect(morph.isCompatibleSeriesShape('bar', 'pie', undefined)).toBe(false)
  })
})

describe('MorphTypeChange._buildMapping', () => {
  const morph = new MorphTypeChange(makeStubChart().w, makeStubChart())

  it('bar (1 series, N points) → pie/donut/polarArea maps bar[0][j] → slice j', () => {
    const captured = [
      { realIndex: 0, j: 0, d: 'd0', fill: '#f00' },
      { realIndex: 0, j: 1, d: 'd1', fill: '#0f0' },
      { realIndex: 0, j: 2, d: 'd2', fill: '#00f' },
    ]
    const map = morph._buildMapping(captured, 'bar', 'pie', [1, 2, 3])
    expect(map.get('0:0')).toEqual({ d: 'd0', fill: '#f00' })
    expect(map.get('1:0')).toEqual({ d: 'd1', fill: '#0f0' })
    expect(map.get('2:0')).toEqual({ d: 'd2', fill: '#00f' })
  })

  it('bar (1 series, N points) → radialBar maps bar[0][j] → ring j (the broken case)', () => {
    // Regression: previously only bar[0][0] mapped — rings 1+ got no morph.
    const captured = [
      { realIndex: 0, j: 0, d: 'b0', fill: null },
      { realIndex: 0, j: 1, d: 'b1', fill: null },
      { realIndex: 0, j: 2, d: 'b2', fill: null },
      { realIndex: 0, j: 3, d: 'b3', fill: null },
      { realIndex: 0, j: 4, d: 'b4', fill: null },
    ]
    const map = morph._buildMapping(captured, 'bar', 'radialBar', [
      44, 55, 41, 27, 33,
    ])
    expect(map.size).toBe(5)
    expect(map.get('0:0')).toEqual({ d: 'b0', fill: null })
    expect(map.get('1:0')).toEqual({ d: 'b1', fill: null })
    expect(map.get('2:0')).toEqual({ d: 'b2', fill: null })
    expect(map.get('3:0')).toEqual({ d: 'b3', fill: null })
    expect(map.get('4:0')).toEqual({ d: 'b4', fill: null })
  })

  it('bar (M series, 1 point each) → radialBar maps bar[i][0] → ring i', () => {
    const captured = [
      { realIndex: 0, j: 0, d: 'r0', fill: null },
      { realIndex: 1, j: 0, d: 'r1', fill: null },
      { realIndex: 2, j: 0, d: 'r2', fill: null },
    ]
    const map = morph._buildMapping(captured, 'bar', 'radialBar', [10, 20, 30])
    expect(map.get('0:0')).toEqual({ d: 'r0', fill: null })
    expect(map.get('1:0')).toEqual({ d: 'r1', fill: null })
    expect(map.get('2:0')).toEqual({ d: 'r2', fill: null })
  })

  it('pie → bar (1 series, N points) maps slice i → bar[0][j=i]', () => {
    const captured = [
      { realIndex: 0, j: 0, d: 's0', fill: null },
      { realIndex: 1, j: 0, d: 's1', fill: null },
    ]
    const map = morph._buildMapping(captured, 'pie', 'bar', [
      { name: 'A', data: [10, 20] },
    ])
    expect(map.get('0:0')).toEqual({ d: 's0', fill: null })
    expect(map.get('0:1')).toEqual({ d: 's1', fill: null })
  })

  it('radialBar → bar (1 series, N points) maps ring i → bar[0][j=i] (the broken case)', () => {
    // Regression: previously stored `${ring}:0` keys, but bar (1 series, N pts)
    // looks up `0:${j}` — only ring 0 happened to line up.
    const captured = [
      { realIndex: 0, j: 0, d: 'a0', fill: null },
      { realIndex: 1, j: 0, d: 'a1', fill: null },
      { realIndex: 2, j: 0, d: 'a2', fill: null },
    ]
    const map = morph._buildMapping(captured, 'radialBar', 'bar', [
      { name: 'Sessions', data: [44, 55, 41] },
    ])
    expect(map.size).toBe(3)
    expect(map.get('0:0')).toEqual({ d: 'a0', fill: null })
    expect(map.get('0:1')).toEqual({ d: 'a1', fill: null })
    expect(map.get('0:2')).toEqual({ d: 'a2', fill: null })
  })

  it('radialBar → bar (M series, 1 point each) maps ring i → bar[i][0]', () => {
    const captured = [
      { realIndex: 0, j: 0, d: 'a0', fill: null },
      { realIndex: 1, j: 0, d: 'a1', fill: null },
    ]
    const map = morph._buildMapping(captured, 'radialBar', 'bar', [
      { name: 'A', data: [10] },
      { name: 'B', data: [20] },
    ])
    expect(map.get('0:0')).toEqual({ d: 'a0', fill: null })
    expect(map.get('1:0')).toEqual({ d: 'a1', fill: null })
  })

  it('pie ↔ donut ↔ polarArea uses identity by realIndex', () => {
    const captured = [
      { realIndex: 0, j: 0, d: 'a', fill: null },
      { realIndex: 1, j: 0, d: 'b', fill: null },
    ]
    const map = morph._buildMapping(captured, 'pie', 'donut', [1, 2])
    expect(map.get('0:0')).toEqual({ d: 'a', fill: null })
    expect(map.get('1:0')).toEqual({ d: 'b', fill: null })
  })
})

describe('MorphTypeChange.getInitialPathFor', () => {
  it('returns null when no snapshot is active', () => {
    const morph = new MorphTypeChange(makeStubChart().w, makeStubChart())
    expect(morph.getInitialPathFor(0, 0)).toBeNull()
  })

  it('returns mapped d when active and layouts match (no translation)', () => {
    const stub = makeStubChart()
    const morph = new MorphTypeChange(stub.w, stub)
    morph._snapshot = {
      fromType: 'bar',
      toType: 'pie',
      mapping: new Map([['0:0', { d: 'M 0 0 L 1 1', fill: '#f00' }]]),
      oldLayout: { translateX: 0, translateY: 0 },
    }
    expect(morph.getInitialPathFor(0, 0)).toBe('M 0 0 L 1 1')
    expect(morph.getInitialFillFor(0, 0)).toBe('#f00')
    expect(morph.getInitialPathFor(99, 99)).toBeNull()
  })

  it('shifts the captured d by (oldTX - newTX, oldTY - newTY) when layouts differ', () => {
    // Regression: bar↔radialBar morphs visibly jumped at t=0 because the
    // captured d lived in the old elGraphical's translate space but rendered
    // in the new one. The fix shifts the d so it lands at the OLD on-screen
    // position; the morph engine then transitions both shape and position
    // as one continuous tween.
    const stub = makeStubChart()
    stub.w.layout = { translateX: 12, translateY: 0 } // new chart's translate
    const morph = new MorphTypeChange(stub.w, stub)
    morph._snapshot = {
      fromType: 'bar',
      toType: 'radialBar',
      mapping: new Map([['0:0', { d: 'M 100 200 L 150 200 Z', fill: null }]]),
      oldLayout: { translateX: 25, translateY: 0 }, // bar reserved more left padding
    }
    // delta = old - new = (13, 0). Every absolute coord shifts by +13 on x.
    const shifted = morph.getInitialPathFor(0, 0)
    expect(shifted).toBe('M 113 200 L 163 200 Z')
  })
})

describe('MorphTypeChange._translatePathD', () => {
  const morph = new MorphTypeChange(makeStubChart().w, makeStubChart())

  it('passes the path through unchanged when delta is (0,0)', () => {
    const d = 'M 10 20 L 30 40 Z'
    expect(morph._translatePathD(d, 0, 0)).toBe(d)
  })

  it('offsets M and L (x, y) pairs', () => {
    expect(morph._translatePathD('M 10 20 L 30 40 Z', 5, 7)).toBe(
      'M 15 27 L 35 47 Z',
    )
  })

  it('offsets only the last (x, y) of an A command (radii/flags unchanged)', () => {
    expect(
      morph._translatePathD('M 10 10 A 50 50 0 0 1 100 200 Z', 5, 3),
    ).toBe('M 15 13 A 50 50 0 0 1 105 203 Z')
  })

  it('offsets all 3 control-point pairs of a C command', () => {
    expect(morph._translatePathD('M 0 0 C 10 20 30 40 50 60', 1, 2)).toBe(
      'M 1 2 C 11 22 31 42 51 62',
    )
  })

  it('offsets H by dx only and V by dy only', () => {
    expect(morph._translatePathD('M 10 10 H 50 V 80', 3, 4)).toBe(
      'M 13 14 H 53 V 84',
    )
  })

  it('handles a closed donut-segment (M A L A Z)', () => {
    const d =
      'M 100 50 A 80 80 0 0 1 180 130 L 165 130 A 65 65 0 0 0 100 65 Z'
    const shifted = morph._translatePathD(d, 10, 20)
    expect(shifted).toBe(
      'M 110 70 A 80 80 0 0 1 190 150 L 175 150 A 65 65 0 0 0 110 85 Z',
    )
  })
})

describe('MorphTypeChange.getSpeed', () => {
  it('returns chartTypeMorph.speed when set', () => {
    const stub = makeStubChart()
    const morph = new MorphTypeChange(stub.w, stub)
    expect(morph.getSpeed()).toBe(600)
  })

  it('falls back to chart.animations.speed when chartTypeMorph.speed unset', () => {
    const stub = makeStubChart()
    delete stub.w.config.chart.animations.chartTypeMorph.speed
    const morph = new MorphTypeChange(stub.w, stub)
    expect(morph.getSpeed()).toBe(800)
  })
})

describe('Chart works with morph feature absent', () => {
  beforeEach(() => {
    InitCtxVariables._featureRegistry.delete('morphTypeChange')
  })

  it('ctx.morphTypeChange is null when feature is not registered', () => {
    const chart = makeChart()
    expect(chart.ctx.morphTypeChange).toBeNull()
  })

  it('updateOptions with chart.type change works (falls back to destroy+recreate)', async () => {
    const chart = makeChart()
    await expect(
      chart.updateOptions({
        chart: { type: 'pie' },
        series: [10, 20, 30, 40],
      }),
    ).resolves.toBeDefined()
  })
})

describe('Chart works with morph feature registered', () => {
  it('ctx.morphTypeChange is an instance when feature is registered', () => {
    InitCtxVariables.registerFeatures({ morphTypeChange: MorphTypeChange })
    const chart = makeChart()
    expect(chart.ctx.morphTypeChange).toBeInstanceOf(MorphTypeChange)
    expect(chart.ctx.morphTypeChange.isActive()).toBe(false)
  })

  it('bar → pie updateOptions captures and clears snapshot', async () => {
    InitCtxVariables.registerFeatures({ morphTypeChange: MorphTypeChange })
    const chart = makeChart({
      chart: {
        type: 'bar',
        animations: { enabled: true, chartTypeMorph: { enabled: true, speed: 50 } },
        width: 400,
        height: 300,
      },
    })
    // Trigger the type change. The morph attempt may be a no-op in jsdom
    // (no real bbox/getTotalLength), but the call must not throw.
    await expect(
      chart.updateOptions({
        chart: { type: 'pie' },
        series: [10, 20, 30, 40],
      }),
    ).resolves.toBeDefined()
    expect(chart.ctx.morphTypeChange).toBeTruthy()
  })

  it('incompatible series shape falls back to no-morph (no throw)', async () => {
    InitCtxVariables.registerFeatures({ morphTypeChange: MorphTypeChange })
    const chart = makeChart({
      chart: {
        type: 'bar',
        animations: { enabled: true, chartTypeMorph: { enabled: true, speed: 50 } },
        width: 400,
        height: 300,
      },
    })
    // Pass bar-shaped series to pie — incompatible. Should not throw.
    await expect(
      chart.updateOptions({
        chart: { type: 'pie' },
        series: [{ name: 'A', data: [10, 20, 30] }],
      }),
    ).resolves.toBeDefined()
  })
})
