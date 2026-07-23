/**
 * Tests for the premium Unit (dot-cluster / pictogram) chart type.
 *
 * Covers:
 *  - Rendering: one dot per unit, grouped + packed layouts, dot counts
 *  - Phyllotaxis layout determinism (pure _spiral math)
 *  - unitValue (waffle) scaling + maxUnits proportional clip
 *  - Premium gating: watermark without a license, none with a valid key
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
import Unit from '../../src/charts/Unit.js'
import { LicenseManager } from '../../src/modules/license/LicenseManager.js'
import {
  premiumFeaturesInUse,
  _resetPremiumSignals,
} from '../../src/modules/license/LicenseEnforcer.js'

const WM = '[data-apexcharts-watermark]'
const VALID_KEY = LicenseManager.generateLicenseKey('2020-01-01', '2099-01-01')

function resetLicense() {
  LicenseManager.licenseKey = null
  LicenseManager.validationResult = null
  _resetPremiumSignals()
  if (typeof window !== 'undefined' && window.Apex) delete window.Apex.license
}

function hasWatermark(chart) {
  return !!chart.w.dom.elWrap.querySelector(WM)
}

function dotCount(chart) {
  return chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area').length
}

function unitChart(options = {}) {
  const opts = {
    chart: { type: 'unit', width: 600, height: 400, ...(options.chart || {}) },
    series: options.series || [276, 266, 3],
    labels: options.labels || ['Republican', 'Democrat', 'Independent'],
  }
  // Only set plotOptions when provided - passing `undefined` would clobber the
  // default plotOptions object during the config merge.
  if (options.plotOptions) opts.plotOptions = options.plotOptions
  return createChartWithOptions(opts)
}

describe('Unit chart — rendering', () => {
  let warnSpy
  beforeEach(() => {
    resetLicense()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
    resetLicense()
  })

  it('renders one dot per unit (grouped), total = sum of values', () => {
    const chart = unitChart()
    expect(dotCount(chart)).toBe(276 + 266 + 3)
    chart.destroy()
  })

  it('groups dots under one .apexcharts-series per category', () => {
    const chart = unitChart()
    const groups = chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-unit .apexcharts-series',
    )
    expect(groups.length).toBe(3)
    // First category cluster holds its own dot count.
    expect(groups[0].querySelectorAll('.apexcharts-unit-area').length).toBe(276)
    chart.destroy()
  })

  it('packed layout renders the same total in a single blob', () => {
    const chart = unitChart({
      series: [65, 835],
      labels: ['Female', 'Male'],
      plotOptions: { unit: { layout: 'packed' } },
    })
    expect(dotCount(chart)).toBe(900)
    chart.destroy()
  })

  it('renders one cluster label per cluster in grouped mode', () => {
    const chart = unitChart()
    const labels = chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label')
    expect(labels.length).toBe(3)
    expect(labels[0].textContent).toContain('Republican')
    chart.destroy()
  })

  it('curves large-cluster labels (textPath) and straightens tiny ones', () => {
    const chart = unitChart()
    const labels = chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label')
    // Republican (276): long label fits the big arc -> curved (has a textPath).
    expect(labels[0].querySelector('textPath')).toBeTruthy()
    // Independent (3): label can't fit the tiny arc -> straight (no textPath).
    expect(labels[2].querySelector('textPath')).toBeNull()
    expect(labels[2].textContent).toContain('Independent')
    chart.destroy()
  })

  it('unitValue scales counts down (1 dot = N units)', () => {
    const chart = unitChart({
      series: [1000, 2000],
      labels: ['A', 'B'],
      plotOptions: { unit: { unitValue: 100, clusterLabels: { show: false } } },
    })
    // 1000/100 = 10, 2000/100 = 20
    expect(dotCount(chart)).toBe(30)
    chart.destroy()
  })

  it('maxUnits clips total proportionally and warns once', () => {
    const chart = unitChart({
      series: [400, 400],
      labels: ['A', 'B'],
      plotOptions: { unit: { maxUnits: 100, clusterLabels: { show: false } } },
    })
    expect(dotCount(chart)).toBeLessThanOrEqual(100)
    expect(warnSpy).toHaveBeenCalled()
    chart.destroy()
  })

  it('persists per-dot slots across renders (keyed old->new transition)', () => {
    const chart = unitChart({
      series: [10, 20],
      labels: ['A', 'B'],
      plotOptions: { unit: { clusterLabels: { show: false } } },
    })
    // The map that lets the next update tween each dot from its previous slot.
    expect(chart._unitPrevDots instanceof Map).toBe(true)
    expect(chart._unitPrevDots.size).toBe(30)
    // A known key exists (category 1, dot 5) with a finite position.
    const slot = chart._unitPrevDots.get('1:5')
    expect(slot && isFinite(slot.x) && isFinite(slot.y)).toBe(true)

    // On update the stored slots refresh to the new counts.
    chart.updateSeries([15, 15])
    expect(chart._unitPrevDots.size).toBe(30)
    chart.destroy()
  })

  it('spawns exit ghosts for removed dots on an animated shrink', () => {
    // Exits only render when animating, so build the chart with animations on
    // (the shared util force-disables them).
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'unit', width: 500, height: 360, animations: { enabled: true, speed: 400 } },
      series: [50, 50],
      labels: ['A', 'B'],
      plotOptions: { unit: { clusterLabels: { show: false } } },
    })
    chart.render()
    // Shrink A 50 -> 20 (30 removed) synchronously creates 30 ghost nodes
    // before the rAF fade removes them.
    chart.updateSeries([20, 50])
    const ghosts = chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-exit')
    expect(ghosts.length).toBe(30)
    chart.destroy()
  })

  it('shape:square renders <rect> dots', () => {
    const chart = unitChart({
      series: [10, 10],
      labels: ['A', 'B'],
      plotOptions: { unit: { shape: 'square', clusterLabels: { show: false } } },
    })
    const rects = chart.w.dom.baseEl.querySelectorAll('rect.apexcharts-unit-area')
    expect(rects.length).toBe(20)
    chart.destroy()
  })

  it('shape:image renders <image> icons sized from plotOptions.unit.image', () => {
    const src =
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'
    const chart = unitChart({
      series: [6, 6],
      labels: ['A', 'B'],
      plotOptions: {
        unit: {
          shape: 'image',
          image: { src, width: 18, height: 22 },
          clusterLabels: { show: false },
        },
      },
    })
    const imgs = chart.w.dom.baseEl.querySelectorAll('image.apexcharts-unit-area')
    expect(imgs.length).toBe(12)
    expect(imgs[0].getAttribute('width')).toBe('18')
    expect(imgs[0].getAttribute('height')).toBe('22')
    // No tint by default: icons keep their own colours (no recolour filter).
    expect(imgs[0].getAttribute('filter')).toBeNull()
    expect(
      chart.w.dom.baseEl.querySelectorAll('filter[id^="apexcharts-unit-tint-"]')
        .length,
    ).toBe(0)
    chart.destroy()
  })

  it('image.tint recolours each icon to its category colour via a filter', () => {
    const src =
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E'
    const chart = unitChart({
      series: [6, 6],
      labels: ['A', 'B'],
      plotOptions: {
        unit: {
          shape: 'image',
          image: { src, width: 18, height: 18, tint: true },
          clusterLabels: { show: false },
        },
      },
    })
    // One recolour filter per distinct category colour (two categories here).
    const filters = chart.w.dom.baseEl.querySelectorAll(
      'filter[id^="apexcharts-unit-tint-"]',
    )
    expect(filters.length).toBe(2)
    // Each icon references a filter, and the filter floods the category colour.
    const imgs = chart.w.dom.baseEl.querySelectorAll('image.apexcharts-unit-area')
    const catColor = (i) => chart.w.globals.colors[i]
    const floodOf = (imgEl) => {
      const id = imgEl.getAttribute('filter').match(/#(.+)\)/)[1]
      return chart.w.dom.baseEl
        .querySelector(`#${id} feFlood`)
        .getAttribute('flood-color')
    }
    const cat0 = [...imgs].find((el) => el.getAttribute('i') === '0')
    const cat1 = [...imgs].find((el) => el.getAttribute('i') === '1')
    expect(floodOf(cat0)).toBe(catColor(0))
    expect(floodOf(cat1)).toBe(catColor(1))
    chart.destroy()
  })
})

describe('Unit chart — columns layout (dot bars)', () => {
  let warnSpy
  beforeEach(() => {
    resetLicense()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
    resetLicense()
  })

  const clusterEl = (chart, i) =>
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit .apexcharts-series')[i]
  const cys = (g) =>
    [...g.querySelectorAll('.apexcharts-unit-area')].map((d) =>
      parseFloat(d.getAttribute('cy')),
    )

  it('renders one bar per category with the right dot total', () => {
    const chart = unitChart({
      series: [40, 20, 4],
      labels: ['A', 'B', 'C'],
      plotOptions: { unit: { layout: 'columns', clusterLabels: { show: false } } },
    })
    expect(dotCount(chart)).toBe(64)
    const groups = chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-unit .apexcharts-series',
    )
    expect(groups.length).toBe(3)
    chart.destroy()
  })

  it('stacks dots bottom-up: taller count reaches higher, shared baseline', () => {
    const chart = unitChart({
      series: [40, 4],
      labels: ['A', 'B'],
      plotOptions: { unit: { layout: 'columns', clusterLabels: { show: false } } },
    })
    const a = cys(clusterEl(chart, 0))
    const b = cys(clusterEl(chart, 1))
    // Both bars share a bottom row (baseline) within a dot radius.
    expect(Math.abs(Math.max(...a) - Math.max(...b))).toBeLessThan(6)
    // The 40-dot bar reaches higher up the plot (smaller y) than the 4-dot bar.
    expect(Math.min(...a)).toBeLessThan(Math.min(...b))
    chart.destroy()
  })

  it('a fixed size keeps one dot radius and fills the bar height (tall bars)', () => {
    const chart = unitChart({
      series: [120, 30],
      labels: ['A', 'B'],
      plotOptions: {
        unit: { layout: 'columns', size: 3, clusterLabels: { show: false } },
      },
    })
    const circles = [
      ...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area'),
    ]
    // Every dot is exactly the pinned size (no per-layout auto-resize).
    expect(circles.every((c) => parseFloat(c.getAttribute('r')) === 3)).toBe(true)
    // The tall bar (120) reaches well up the plot rather than sitting squat.
    const a = cys(clusterEl(chart, 0))
    const barH = Math.max(...a) - Math.min(...a)
    expect(barH).toBeGreaterThan(chart.w.layout.gridHeight * 0.4)
    chart.destroy()
  })

  it('centres the bar block vertically when fixed-size bars are shorter than the plot', () => {
    // Small fixed dots + a tall plot: the tallest bar is far shorter than the
    // available height. The block must be CENTRED (balanced gap above/below),
    // not bottom-anchored to the grid edge (which crowded the legend and dumped
    // all the slack at the top).
    const chart = unitChart({
      chart: { height: 600 },
      series: [8, 4],
      labels: ['A', 'B'],
      plotOptions: {
        unit: { layout: 'columns', size: 3, clusterLabels: { show: false } },
      },
    })
    const gh = chart.w.layout.gridHeight
    const r = 3
    const a = cys(clusterEl(chart, 0)) // the taller (8-dot) bar
    const topEdge = Math.min(...a) - r
    const bottomEdge = Math.max(...a) + r
    const labelSpace = 6 // clusterLabels hidden
    const bottomPad = Math.max(8, gh * 0.04)
    const gapAbove = topEdge - labelSpace
    const gapBelow = gh - bottomPad - bottomEdge
    // Real space remains BELOW the bar (was ~0 when bottom-anchored).
    expect(gapBelow).toBeGreaterThan(gh * 0.1)
    // The gaps above and below the block are close to equal (centred).
    expect(Math.abs(gapAbove - gapBelow)).toBeLessThan(gh * 0.08)
    chart.destroy()
  })

  it('columns.size:"auto" sizes dots independently of the pinned global size', () => {
    const base = {
      chart: { height: 500 },
      series: [30, 10],
      labels: ['A', 'B'],
    }
    // Pinned global size flows into columns (inherit): dots stay tiny.
    const pinned = unitChart({
      ...base,
      plotOptions: {
        unit: { layout: 'columns', size: 3, clusterLabels: { show: false } },
      },
    })
    const rOf = (c) =>
      parseFloat(
        c.w.dom.baseEl
          .querySelector('circle.apexcharts-unit-area')
          .getAttribute('r'),
      )
    expect(rOf(pinned)).toBe(3)
    pinned.destroy()

    // columns.size:'auto' ignores the pinned 3 and grows dots to fill height.
    const auto = unitChart({
      ...base,
      plotOptions: {
        unit: {
          layout: 'columns',
          size: 3,
          columns: { size: 'auto' },
          clusterLabels: { show: false },
        },
      },
    })
    expect(rOf(auto)).toBeGreaterThan(3)
    const a = cys(clusterEl(auto, 0)) // the tall 30-dot bar
    const barH = Math.max(...a) - Math.min(...a)
    expect(barH).toBeGreaterThan(auto.w.layout.gridHeight * 0.6)
    auto.destroy()
  })

  it('gives a bar a straight label, never a curved arc', () => {
    const chart = unitChart({
      series: [200, 50],
      labels: ['Republican', 'Democrat'],
      plotOptions: { unit: { layout: 'columns' } },
    })
    const labels = chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label')
    expect(labels.length).toBe(2)
    // Even the big 200-dot bar gets a straight label (no textPath).
    expect(labels[0].querySelector('textPath')).toBeNull()
    chart.destroy()
  })
})

describe('Unit chart — flow transition (regroup)', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  it("default 'group' keys dots per category (i:j)", () => {
    const chart = unitChart({
      series: [10, 20],
      labels: ['A', 'B'],
      plotOptions: { unit: { clusterLabels: { show: false } } },
    })
    expect(chart._unitPrevDots.has('1:5')).toBe(true)
    expect(chart._unitPrevDots.has('15')).toBe(false)
    chart.destroy()
  })

  it("'flow' keys dots by global draw order (0..total-1)", () => {
    const chart = unitChart({
      series: [10, 20],
      labels: ['A', 'B'],
      plotOptions: {
        unit: { transition: 'flow', clusterLabels: { show: false } },
      },
    })
    expect(chart._unitPrevDots.size).toBe(30)
    expect(chart._unitPrevDots.has('0')).toBe(true)
    expect(chart._unitPrevDots.has('29')).toBe(true)
    expect(chart._unitPrevDots.has('1:5')).toBe(false)
    chart.destroy()
  })

  it('conserves dots across a regroup (3 clusters -> 6 bars, same total)', () => {
    const chart = unitChart({
      series: [30, 20, 10], // 60 units
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: {
          layout: 'grouped',
          transition: 'flow',
          clusterLabels: { show: false },
        },
      },
    })
    expect(dotCount(chart)).toBe(60)

    // Regroup the SAME 60 units into 6 dot-bars.
    chart.updateOptions({
      series: [12, 10, 14, 8, 9, 7], // still 60
      labels: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
      plotOptions: {
        unit: {
          layout: 'columns',
          transition: 'flow',
          clusterLabels: { show: false },
        },
      },
    })
    expect(dotCount(chart)).toBe(60)
    expect(chart._unitPrevDots.size).toBe(60)
    // Global keys survive the regroup (dot #0 kept its identity, so it tweens
    // to a new slot rather than fading out and a new one fading in).
    expect(chart._unitPrevDots.has('0')).toBe(true)
    chart.destroy()
  })
})

describe('Unit chart — per-unit tooltip', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  const dotAt = (chart, i, j) =>
    [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area')].find(
      (d) => d.getAttribute('i') === String(i) && d.getAttribute('j') === String(j),
    )
  const ttText = (chart) =>
    chart.w.dom.baseEl.querySelector('.apexcharts-tooltip').textContent

  it('shows the individual dot (category + index), not the cluster aggregate', () => {
    const chart = unitChart({
      series: [10, 20],
      labels: ['A', 'B'],
      plotOptions: { unit: { clusterLabels: { show: false } } },
    })
    const tt = chart.w.globals.tooltip
    expect(tt).toBeTruthy()

    tt.renderUnitTooltip(dotAt(chart, 1, 4))
    expect(ttText(chart)).toContain('B')
    expect(ttText(chart)).toContain('#5 of 20') // j=4 -> #5, category count 20

    // A different dot yields DIFFERENT text (the bug was: identical for all).
    tt.renderUnitTooltip(dotAt(chart, 0, 2))
    expect(ttText(chart)).toContain('A')
    expect(ttText(chart)).toContain('#3 of 10')
    chart.destroy()
  })

  it('unitValue is spelled out in the default body', () => {
    const chart = unitChart({
      series: [1000],
      labels: ['People'],
      plotOptions: { unit: { unitValue: 100, clusterLabels: { show: false } } },
    })
    const tt = chart.w.globals.tooltip
    tt.renderUnitTooltip(dotAt(chart, 0, 3)) // 1000/100 = 10 dots
    expect(ttText(chart)).toContain('#4 of 10')
    expect(ttText(chart)).toContain('100 per dot')
    chart.destroy()
  })

  it('plotOptions.unit.tooltip.formatter receives the per-unit i/j', () => {
    const seen = []
    const chart = unitChart({
      series: [3, 3],
      labels: ['A', 'B'],
      plotOptions: {
        unit: {
          clusterLabels: { show: false },
          tooltip: {
            formatter: (o) => {
              seen.push([o.seriesIndex, o.dataPointIndex])
              return `${o.seriesName} unit ${o.dataPointIndex + 1}`
            },
          },
        },
      },
    })
    const tt = chart.w.globals.tooltip
    tt.renderUnitTooltip(dotAt(chart, 1, 2))
    expect(ttText(chart)).toContain('B unit 3')
    expect(seen).toContainEqual([1, 2])
    chart.destroy()
  })
})

describe('Unit chart — per-unit data (object form)', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  const dotAt = (chart, i, j) =>
    [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area')].find(
      (d) => d.getAttribute('i') === String(i) && d.getAttribute('j') === String(j),
    )
  const ttText = (chart) =>
    chart.w.dom.baseEl.querySelector('.apexcharts-tooltip').textContent

  const rosterChart = () =>
    unitChart({
      series: [
        {
          name: 'Alpha',
          data: [
            { name: 'a1', fillColor: '#ff0000' },
            { name: 'a2' },
            { name: 'a3' },
          ],
        },
        { name: 'Beta', data: [10, 20] }, // primitive per-unit values
      ],
      labels: [],
      plotOptions: { unit: { clusterLabels: { show: false } } },
    })

  it('one dot per datum; category count = data.length', () => {
    const chart = rosterChart()
    expect(dotCount(chart)).toBe(5) // 3 + 2
    const groups = chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-unit .apexcharts-series',
    )
    expect(groups.length).toBe(2)
    expect(groups[0].querySelectorAll('.apexcharts-unit-area').length).toBe(3)
    // Category names come from the series objects.
    expect(chart.w.seriesData.seriesNames).toEqual(['Alpha', 'Beta'])
    chart.destroy()
  })

  it('per-unit fillColor overrides the category colour for that dot only', () => {
    const chart = rosterChart()
    expect(dotAt(chart, 0, 0).getAttribute('fill')).toBe('#ff0000')
    // Sibling with no fillColor keeps the category colour (not red).
    expect(dotAt(chart, 0, 1).getAttribute('fill')).not.toBe('#ff0000')
    chart.destroy()
  })

  it('tooltip shows the unit’s own name / value', () => {
    const chart = rosterChart()
    const tt = chart.w.globals.tooltip
    tt.renderUnitTooltip(dotAt(chart, 0, 0))
    expect(ttText(chart)).toContain('Alpha') // title = category
    expect(ttText(chart)).toContain('a1') // body = unit's own name
    // Primitive datum shows its value.
    tt.renderUnitTooltip(dotAt(chart, 1, 1))
    expect(ttText(chart)).toContain('20')
    chart.destroy()
  })

  it('the formatter receives the resolved per-unit datum', () => {
    let got = null
    const chart = unitChart({
      series: [{ name: 'S', data: [{ name: 'x', score: 42 }] }],
      labels: [],
      plotOptions: {
        unit: {
          clusterLabels: { show: false },
          tooltip: {
            formatter: (o) => {
              got = o.datum
              return `${o.datum.name}: ${o.datum.score}`
            },
          },
        },
      },
    })
    chart.w.globals.tooltip.renderUnitTooltip(dotAt(chart, 0, 0))
    expect(got).toEqual({ name: 'x', score: 42 })
    expect(ttText(chart)).toContain('x: 42')
    chart.destroy()
  })

  it('object form updates back to flat counts cleanly (unitData reset)', () => {
    const chart = rosterChart()
    expect(chart.w.seriesData.unitData.length).toBe(2)
    chart.updateOptions({ series: [4, 6], labels: ['A', 'B'] })
    expect(dotCount(chart)).toBe(10)
    // Per-unit data is cleared, so tooltips fall back to position text.
    expect(chart.w.seriesData.unitData.length).toBe(0)
    chart.w.globals.tooltip.renderUnitTooltip(dotAt(chart, 0, 2))
    expect(ttText(chart)).toContain('#3 of 4')
    chart.destroy()
  })
})

describe('Unit chart — identity transition', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  it("'identity' keys dots by datum id/name and persists them across a regroup", () => {
    const chart = unitChart({
      series: [
        { name: 'A', data: [{ name: 'x1' }, { name: 'x2' }] },
        { name: 'B', data: [{ name: 'y1' }] },
      ],
      labels: [],
      plotOptions: {
        unit: { transition: 'identity', clusterLabels: { show: false } },
      },
    })
    // Keyed by the datum's name, not the category slot.
    expect(chart._unitPrevDots.has('id:x1')).toBe(true)
    expect(chart._unitPrevDots.has('id:y1')).toBe(true)
    expect(chart._unitPrevDots.has('0:0')).toBe(false)
    // Each slot records its radius so the next update can tween size.
    expect(typeof chart._unitPrevDots.get('id:x1').r).toBe('number')

    // Regroup the SAME three units into different categories; the identities
    // survive (they migrate, they are not destroyed + recreated).
    chart.updateOptions({
      series: [
        { name: 'G1', data: [{ name: 'x1' }, { name: 'y1' }] },
        { name: 'G2', data: [{ name: 'x2' }] },
      ],
    })
    expect(chart._unitPrevDots.size).toBe(3)
    expect(chart._unitPrevDots.has('id:x1')).toBe(true)
    expect(chart._unitPrevDots.has('id:x2')).toBe(true)
    expect(chart._unitPrevDots.has('id:y1')).toBe(true)
    chart.destroy()
  })

  it('falls back to global order for data with no id/name', () => {
    const chart = unitChart({
      series: [{ name: 'A', data: [5, 10] }], // primitives: no stable identity
      labels: [],
      plotOptions: {
        unit: { transition: 'identity', clusterLabels: { show: false } },
      },
    })
    expect(chart._unitPrevDots.has('g:0')).toBe(true)
    expect(chart._unitPrevDots.has('g:1')).toBe(true)
    chart.destroy()
  })
})

describe('Unit chart — bubble sizing (sizeByValue)', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  const allDots = (chart) => [
    ...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area'),
  ]
  const radiiOf = (chart, i) =>
    allDots(chart)
      .filter((d) => d.getAttribute('i') === String(i))
      .map((d) => parseFloat(d.getAttribute('r')))
  const rAt = (chart, i, j) =>
    parseFloat(
      allDots(chart)
        .find(
          (d) =>
            d.getAttribute('i') === String(i) && d.getAttribute('j') === String(j),
        )
        .getAttribute('r'),
    )

  const valued = (extra) =>
    unitChart({
      series: [{ name: 'A', data: [{ value: 0 }, { value: 100 }, { value: 50 }] }],
      labels: [],
      plotOptions: {
        unit: { clusterLabels: { show: false }, ...extra },
      },
    })

  it('is off by default: every dot shares one radius', () => {
    const chart = valued({})
    const rs = radiiOf(chart, 0)
    expect(rs.every((r) => r === rs[0])).toBe(true)
    chart.destroy()
  })

  it('linear scale maps value -> radius between min and max', () => {
    const chart = valued({
      sizeByValue: { enabled: true, minRadius: 4, maxRadius: 20, scale: 'linear' },
    })
    expect(rAt(chart, 0, 0)).toBeCloseTo(4, 5) // value 0 -> min
    expect(rAt(chart, 0, 1)).toBeCloseTo(20, 5) // value 100 -> max
    expect(rAt(chart, 0, 2)).toBeCloseTo(12, 5) // value 50 -> linear midpoint
    chart.destroy()
  })

  it('area scale makes AREA (not radius) proportional to value', () => {
    const chart = valued({
      sizeByValue: { enabled: true, minRadius: 4, maxRadius: 20 }, // area is default
    })
    expect(rAt(chart, 0, 0)).toBeCloseTo(4, 5)
    expect(rAt(chart, 0, 1)).toBeCloseTo(20, 5)
    // sqrt(4^2 + 0.5*(20^2 - 4^2)) = sqrt(16 + 192) = sqrt(208)
    expect(rAt(chart, 0, 2)).toBeCloseTo(Math.sqrt(208), 4)
    chart.destroy()
  })

  it('accepts primitive values, and stays uniform for flat counts', () => {
    const chart = unitChart({
      series: [{ name: 'A', data: [10, 40] }],
      labels: [],
      plotOptions: {
        unit: {
          clusterLabels: { show: false },
          sizeByValue: { enabled: true, minRadius: 5, maxRadius: 15, scale: 'linear' },
        },
      },
    })
    expect(rAt(chart, 0, 0)).toBeCloseTo(5, 5) // 10 -> min
    expect(rAt(chart, 0, 1)).toBeCloseTo(15, 5) // 40 -> max
    chart.destroy()

    // Flat counts have no per-unit values, so sizeByValue is inert (uniform).
    const chart2 = unitChart({
      series: [6, 6],
      labels: ['A', 'B'],
      plotOptions: {
        unit: {
          clusterLabels: { show: false },
          sizeByValue: { enabled: true, maxRadius: 12 },
        },
      },
    })
    const rs = radiiOf(chart2, 0)
    expect(rs.every((r) => r === rs[0])).toBe(true)
    chart2.destroy()
  })
})

describe('Unit chart — grouped cluster collision guard', () => {
  const mkUnit = (gw = 600) =>
    new Unit(
      { globals: {}, config: {}, layout: { gridWidth: gw, gridHeight: 400 } },
      {},
    )
  const noOverlap = (clusters) => {
    for (let i = 1; i < clusters.length; i++) {
      const gap =
        clusters[i].cx - clusters[i - 1].cx -
        (clusters[i].outerR + clusters[i - 1].outerR)
      if (gap < -0.5) return false
    }
    return true
  }
  const imgOpts = {
    shape: 'image',
    image: { width: 16, height: 16 },
    spacing: 1.2,
    clusterLabels: { show: true },
  }

  it('keeps equal-width cells for auto-sized clusters that fit', () => {
    const u = mkUnit()
    // Auto size (no fixed shape): each cluster shrinks to fit its own cell, so
    // the guard must NOT re-flow - centres stay at the equal-cell positions.
    const clusters = u._layoutGrouped([10, 10, 10], {
      spacing: 1.05,
      clusterLabels: { show: true },
    })
    expect(clusters.map((c) => Math.round(c.cx))).toEqual([100, 300, 500])
  })

  it('re-packs fixed-size clusters that would collide (no overlap when it fits)', () => {
    const u = mkUnit(700)
    // 16px icons with a lopsided 21/47/12 split: the middle blob outgrows its
    // equal cell and would collide with both neighbours in the naive layout.
    const equalGap = 700 / 3 // naive equal-cell centre spacing
    const clusters = u._layoutGrouped([21, 47, 12], imgOpts)
    // Guard re-flowed the row (centres are no longer the equal-cell spacing)...
    expect(Math.round(clusters[1].cx - clusters[0].cx)).not.toBe(
      Math.round(equalGap),
    )
    // ...and no two clusters overlap, all on-canvas.
    expect(noOverlap(clusters)).toBe(true)
    expect(clusters[0].cx - clusters[0].outerR).toBeGreaterThan(-1)
    expect(clusters[2].cx + clusters[2].outerR).toBeLessThanOrEqual(701)
  })

  it('keeps over-capacity fixed clusters on-canvas (anchored to the edges)', () => {
    const u = mkUnit(600)
    // Same icons in a much narrower plot: they genuinely cannot all fit. The
    // fallback anchors the first blob flush-left and the last flush-right so
    // nothing runs off the plot, even though the middle may crowd.
    const clusters = u._layoutGrouped([21, 47, 12], imgOpts)
    expect(clusters[0].cx - clusters[0].outerR).toBeCloseTo(0, 0)
    expect(clusters[2].cx + clusters[2].outerR).toBeCloseTo(600, 0)
    // Centres stay left-to-right.
    expect(clusters[0].cx).toBeLessThan(clusters[1].cx)
    expect(clusters[1].cx).toBeLessThan(clusters[2].cx)
  })
})

describe('Unit chart — legend toggle (hide/show a series)', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  const catDots = (chart, i) =>
    chart.w.dom.baseEl.querySelectorAll(`.apexcharts-unit-area[i="${i}"]`).length
  const legendInactive = (chart, rel) => {
    const marker = chart.w.dom.baseEl.querySelector(
      `.apexcharts-legend-series[rel="${rel}"] .apexcharts-legend-marker`,
    )
    return marker
      ? marker.classList.contains('apexcharts-inactive-legend')
      : null
  }

  it('clicking a legend item collapses that category and dims the item', () => {
    const chart = unitChart({
      chart: { animations: { enabled: false } },
      series: [30, 20, 10],
      labels: ['A', 'B', 'C'],
      plotOptions: { unit: { layout: 'grouped', clusterLabels: { show: false } } },
    })
    expect(catDots(chart, 1)).toBe(20)
    expect(legendInactive(chart, 2)).toBe(false)

    // This is exactly what Legend.onLegendClick invokes for a legend click.
    chart.legend.legendHelpers.toggleDataSeries(1, false)
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)
    expect(catDots(chart, 1)).toBe(0) // its dots are removed
    expect(catDots(chart, 0)).toBe(30) // the others stay
    expect(legendInactive(chart, 2)).toBe(true) // legend item dimmed

    // Clicking again restores it.
    chart.legend.legendHelpers.toggleDataSeries(1, true)
    expect(chart.w.globals.collapsedSeriesIndices).not.toContain(1)
    expect(catDots(chart, 1)).toBe(20)
    expect(legendInactive(chart, 2)).toBe(false)
    chart.destroy()
  })

  it('a storyboard-style beat after a legend hide does not crash + keeps the hide', () => {
    const chart = unitChart({
      chart: { animations: { enabled: false } },
      series: [30, 20, 10],
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: { layout: 'grouped', transition: 'flow', clusterLabels: { show: false } },
      },
    })
    chart.legend.legendHelpers.toggleDataSeries(1, false) // hide B (-> bare 0)
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)

    // Apply a hand-authored beat view (no `collapsed` field) + an option merge,
    // exactly what a storyboard beat does each scroll. Before the fix this threw
    // "Cannot create property 'data' on number '0'" in resetSeries ->
    // emptyCollapsedSeries and froze the storyboard on the deactivated state.
    expect(() =>
      chart.perspectives.apply(
        { view: { annotations: { static: {} } } },
        { mergeOptions: { plotOptions: { unit: { layout: 'packed' } } } },
      ),
    ).not.toThrow()
    // Chart re-rendered, and the user's hide persists across the beat (a beat that
    // does not mention the collapsed set leaves it untouched).
    expect(dotCount(chart)).toBe(40) // 30 + 10, B still hidden
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)
    chart.destroy()
  })

  it('a hidden series stays hidden across a beat that supplies fresh data (same categories)', () => {
    const chart = unitChart({
      chart: { animations: { enabled: false } },
      series: [30, 20, 10],
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: { layout: 'grouped', transition: 'flow', clusterLabels: { show: false } },
      },
    })
    chart.legend.legendHelpers.toggleDataSeries(1, false) // hide B
    expect(catDots(chart, 1)).toBe(0)

    // Beat with the SAME categories but NEW values: B must stay hidden even
    // though the beat re-supplies its data (regression: it used to reappear).
    chart.perspectives.apply(
      { view: { annotations: { static: {} } } },
      {
        mergeOptions: {
          series: [33, 22, 11],
          labels: ['A', 'B', 'C'],
          plotOptions: { unit: { layout: 'packed' } },
        },
      },
    )
    expect(catDots(chart, 1)).toBe(0)
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)

    // Beat that REGROUPS into different categories: B no longer exists, so the
    // collapse is dropped and every new category shows.
    chart.perspectives.apply(
      { view: { annotations: { static: {} } } },
      {
        mergeOptions: {
          series: [5, 6, 7, 8],
          labels: ['W', 'X', 'Y', 'Z'],
          plotOptions: { unit: { layout: 'grouped' } },
        },
      },
    )
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
    expect(dotCount(chart)).toBe(26) // 5+6+7+8, all visible
    chart.destroy()
  })
})

describe('Unit chart — hidden (empty) category re-flow', () => {
  // A legend-toggled series collapses to a zero count; the layouts must give it
  // no cell/bar slot so the remaining, visible clusters re-flow to fill the row
  // (no gap where the hidden one was).
  const mk = (gw = 600) =>
    new Unit(
      { globals: {}, config: {}, layout: { gridWidth: gw, gridHeight: 400 } },
      {},
    )
  const opts = { spacing: 1.05, clusterLabels: { show: false } }

  it('grouped: a zero-count category claims no cell; visible clusters re-centre', () => {
    const c = mk(600)._layoutGrouped([10, 0, 10], opts)
    // Two visible categories share the row -> centres at 1/4 and 3/4 of the
    // width (NOT the 3-cell 1/6, 5/6 positions that would leave a middle gap).
    expect(Math.round(c[0].cx)).toBe(150)
    expect(Math.round(c[2].cx)).toBe(450)
    expect(c[1].dots.length).toBe(0)
  })

  it('columns: a zero-count category claims no bar slot; visible bars re-flow', () => {
    const c = mk(600)._layoutColumns([10, 0, 10], opts)
    expect(Math.round(c[0].cx)).toBe(150)
    expect(Math.round(c[2].cx)).toBe(450)
    expect(c[1].dots.length).toBe(0)
  })
})

describe('Unit chart — colour parsing (_rgb)', () => {
  const u = new Unit({ globals: {}, config: {}, layout: {} }, {})

  it('parses #rrggbb, #rgb, rgb() and rgba(); null on garbage', () => {
    expect(u._rgb('#ff0000')).toEqual([255, 0, 0])
    expect(u._rgb('#0f0')).toEqual([0, 255, 0])
    expect(u._rgb('rgb(1, 2, 3)')).toEqual([1, 2, 3])
    expect(u._rgb('rgba(10,20,30,0.5)')).toEqual([10, 20, 30])
    expect(u._rgb('not-a-color')).toBeNull()
  })
})

describe('Unit chart — bar->unit morph (explode)', () => {
  let warnSpy
  beforeEach(() => {
    resetLicense()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
    resetLicense()
  })

  it('bursts each cluster from the outgoing bar centre', () => {
    document.body.innerHTML = '<div id="chart"></div>'
    // Huge speed pins the dots at their seed (t ~ 0) so we can read the burst
    // origin before the tween advances.
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'bar',
        width: 600,
        height: 400,
        animations: { enabled: true, speed: 100000, chartTypeMorph: { enabled: true, speed: 100000 } },
      },
      series: [{ name: 'S', data: [200, 200, 6] }],
      plotOptions: { bar: { distributed: true } },
      xaxis: { categories: ['A', 'B', 'C'] },
      dataLabels: { enabled: false },
      legend: { show: false },
    })
    chart.render()
    expect(chart.morphTypeChange.canMorphTypes('bar', 'unit')).toBe(true)

    chart.updateOptions({
      chart: { type: 'unit' },
      series: [200, 200, 6],
      labels: ['A', 'B', 'C'],
      plotOptions: { unit: { layout: 'grouped', clusterLabels: { show: false } } },
    })

    // The tiny 3rd bar sits near the plot bottom; its cluster is mid-height.
    // Every Independent dot must seed at the bar centre, proving the burst
    // origin (not a centre-gather).
    const center2 = chart.morphTypeChange.getInitialCenterFor(2)
    expect(center2).toBeTruthy()
    const c3 = chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-unit .apexcharts-series',
    )[2]
    const dots = [...c3.querySelectorAll('.apexcharts-unit-area')]
    expect(dots.length).toBe(6)
    dots.forEach((d) => {
      expect(Math.abs(parseFloat(d.getAttribute('cy')) - center2.y)).toBeLessThan(2)
    })
    // And that origin is well below the cluster's own mid-height slot.
    expect(center2.y).toBeGreaterThan(chart.w.layout.gridHeight / 2 + 40)
    chart.destroy()
  })
})

describe('Unit chart — phyllotaxis layout', () => {
  // Pure geometry: no DOM needed, just the _spiral math.
  const u = new Unit({ globals: {}, config: {}, layout: {} }, {})
  const GOLDEN = Math.PI * (3 - Math.sqrt(5))

  it('is deterministic and matches the sunflower formula', () => {
    const step = 5
    const pts = u._spiral(100, 100, 3, step, 0)
    expect(pts.length).toBe(3)
    for (let i = 0; i < 3; i++) {
      const r = step * Math.sqrt(i + 0.5)
      const theta = i * GOLDEN
      expect(pts[i].x).toBeCloseTo(100 + r * Math.cos(theta), 6)
      expect(pts[i].y).toBeCloseTo(100 + r * Math.sin(theta), 6)
    }
  })

  it('radius grows with sqrt(index) (monotonic, packed disc)', () => {
    const pts = u._spiral(0, 0, 50, 4, 0)
    const radii = pts.map((p) => Math.hypot(p.x, p.y))
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThanOrEqual(radii[i - 1] - 1e-9)
    }
  })

  it('startIndex offsets the spiral (used for packed sub-groups)', () => {
    const a = u._spiral(0, 0, 1, 4, 5)
    const r = 4 * Math.sqrt(5 + 0.5)
    const theta = 5 * GOLDEN
    expect(a[0].x).toBeCloseTo(r * Math.cos(theta), 6)
    expect(a[0].y).toBeCloseTo(r * Math.sin(theta), 6)
  })
})

describe('Unit chart — premium gating', () => {
  let warnSpy
  let errorSpy
  beforeEach(() => {
    resetLicense()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    resetLicense()
  })

  it('flags "unit" as a premium feature in use', () => {
    const chart = unitChart()
    expect(premiumFeaturesInUse(chart.w, chart)).toContain('unit')
    chart.destroy()
  })

  it('watermarks a unit chart when no license is set', () => {
    const chart = unitChart()
    expect(hasWatermark(chart)).toBe(true)
    chart.destroy()
  })

  it('a valid per-chart license removes the watermark', () => {
    const chart = unitChart({ chart: { license: VALID_KEY } })
    expect(hasWatermark(chart)).toBe(false)
    chart.destroy()
  })

  it('a valid global license removes the watermark', () => {
    ApexCharts.setLicense(VALID_KEY)
    const chart = unitChart()
    expect(hasWatermark(chart)).toBe(false)
    chart.destroy()
  })
})
