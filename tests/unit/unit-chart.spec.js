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
import { LicenseManager } from 'apex-commons'
import { installTestSigningKey, signedKey } from './utils/license-keys.js'
import {
  premiumFeaturesInUse,
  _resetPremiumSignals,
} from '../../src/modules/license/LicenseEnforcer.js'

const WM = '[data-apexcharts-watermark]'
installTestSigningKey()
// Premium plan: the unit type is a Premium-and-above entitlement, so the key
// that removes the watermark must be on the premium (or enterprise) plan.
const VALID_KEY = signedKey('2020-01-01', '2099-01-01', 'premium')

function resetLicense() {
  LicenseManager.licenseKey = null
  LicenseManager.validationResult = null
  LicenseManager._resetSignatureState()
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

  it('clusterLabels.position places the label above (top) or below (bottom)', () => {
    const mk = (position) =>
      unitChart({
        series: [40, 30],
        labels: ['A', 'B'],
        // curved:false so both placements are straight labels with a y attr.
        plotOptions: {
          unit: { clusterLabels: { show: true, curved: false, position } },
        },
      })
    const firstClusterDotYs = (chart) => {
      const g = chart.w.dom.baseEl.querySelector(
        '.apexcharts-unit .apexcharts-series',
      )
      return [...g.querySelectorAll('circle.apexcharts-unit-area')].map((d) =>
        parseFloat(d.getAttribute('cy')),
      )
    }
    const labelY = (chart) =>
      parseFloat(
        chart.w.dom.baseEl
          .querySelector('.apexcharts-unit-label')
          .getAttribute('y'),
      )

    const top = mk('top')
    const bottom = mk('bottom')
    // A 'top' label clears the top of its cluster; a 'bottom' label clears the
    // bottom (y grows downward in SVG).
    expect(labelY(top)).toBeLessThan(Math.min(...firstClusterDotYs(top)))
    expect(labelY(bottom)).toBeGreaterThan(Math.max(...firstClusterDotYs(bottom)))
    // A bottom label is never curved (no arc riding the crown).
    expect(
      bottom.w.dom.baseEl
        .querySelector('.apexcharts-unit-label')
        .querySelector('textPath'),
    ).toBeNull()
    top.destroy()
    bottom.destroy()
  })

  it('columns clusterLabels.position:bottom reserves room below the bars (on-canvas)', () => {
    const chart = unitChart({
      series: [120, 60, 30],
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: {
          layout: 'columns',
          clusterLabels: { show: true, position: 'bottom' },
        },
      },
    })
    const g = chart.w.dom.baseEl.querySelector(
      '.apexcharts-unit .apexcharts-series',
    )
    const dotYs = [...g.querySelectorAll('.apexcharts-unit-area')].map((d) =>
      parseFloat(d.getAttribute('cy')),
    )
    const labelY = parseFloat(
      chart.w.dom.baseEl
        .querySelector('.apexcharts-unit-label')
        .getAttribute('y'),
    )
    // Label sits below the tallest bar's lowest dot and the layout reserved
    // enough room that it stays within the plot height (not clipped).
    expect(labelY).toBeGreaterThan(Math.max(...dotYs))
    expect(labelY).toBeLessThanOrEqual(chart.w.globals.gridHeight)
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

describe('Unit chart — grid (waffle) layout', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  it('lays all units into one grid, filled in category order', () => {
    const chart = unitChart({
      series: [30, 20, 10],
      labels: ['A', 'B', 'C'],
      plotOptions: { unit: { layout: 'grid', grid: { columns: 10 } } },
    })
    // 60 units -> 60 cells in a single grid.
    expect(dotCount(chart)).toBe(60)
    // Keyed by physical slot (like packed), not category "i:j".
    expect(chart._unitPrevDots.has('slot:0')).toBe(true)
    expect(chart._unitPrevDots.has('slot:59')).toBe(true)
    expect(chart._unitPrevDots.has('1:5')).toBe(false)
    // A single grid carries no per-category cluster labels (legend does).
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label').length,
    ).toBe(0)
    chart.destroy()
  })

  it('grid rows are `columns` wide (row-major placement)', () => {
    const chart = unitChart({
      series: [25],
      labels: ['A'],
      plotOptions: { unit: { layout: 'grid', grid: { columns: 5 } } },
    })
    const xs = [
      ...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area'),
    ].map((d) => parseFloat(d.getAttribute('cx')))
    // exactly `columns` distinct x positions (a 5-wide lattice)
    const distinctX = new Set(xs.map((x) => Math.round(x)))
    expect(distinctX.size).toBe(5)
    chart.destroy()
  })

  it('grid.total makes a fixed-cell percentage waffle (sums to exactly total)', () => {
    const chart = unitChart({
      series: [7, 11, 5], // sum 23 -> largest-remainder scaled to 100
      labels: ['A', 'B', 'C'],
      plotOptions: { unit: { layout: 'grid', grid: { columns: 10, total: 100 } } },
    })
    expect(dotCount(chart)).toBe(100)
    chart.destroy()
  })

  it("chart.type:'waffle' aliases to unit + grid + square", () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'waffle', width: 400, height: 400 },
      series: [50, 30, 20],
      labels: ['A', 'B', 'C'],
    })
    chart.render()
    // Normalized to the unit renderer, original alias preserved.
    expect(chart.w.config.chart.type).toBe('unit')
    expect(chart.w.config.chart.requestedType).toBe('waffle')
    // Grid + square presets applied (only because the user did not set them).
    expect(chart.w.config.plotOptions.unit.layout).toBe('grid')
    expect(chart.w.config.plotOptions.unit.shape).toBe('square')
    // One square cell per unit.
    expect(
      chart.w.dom.baseEl.querySelectorAll('rect.apexcharts-unit-area').length,
    ).toBe(100)
    chart.destroy()
  })

  it('waffle alias does not clobber an explicit layout/shape', () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'waffle', width: 400, height: 400 },
      series: [40, 20],
      labels: ['A', 'B'],
      plotOptions: { unit: { shape: 'circle' } },
    })
    chart.render()
    expect(chart.w.config.plotOptions.unit.layout).toBe('grid') // still preset
    expect(chart.w.config.plotOptions.unit.shape).toBe('circle') // user wins
    expect(
      chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area').length,
    ).toBe(60)
    chart.destroy()
  })
})

describe('Unit chart - grid small multiples (split waffles)', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  // filled (coloured) cells of the t-th visible tile, in draw order
  const tileGroup = (chart, t) =>
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit .apexcharts-series')[t]
  const filledIn = (g) => g.querySelectorAll('.apexcharts-unit-area').length
  const trackCells = (chart) =>
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-track-cell').length

  it('renders one tile per visible category with its own label + track backdrop', () => {
    const chart = unitChart({
      series: [40, 20, 10],
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: { layout: 'grid', shape: 'square', grid: { split: true, columns: 10, total: 100 } },
      },
    })
    // 3 tiles = 3 series groups + 3 per-tile labels.
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit .apexcharts-series').length,
    ).toBe(3)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-label').length,
    ).toBe(3)
    // Track = every tile's full 100-cell lattice, drawn behind the fills.
    expect(trackCells(chart)).toBe(300)
    chart.destroy()
  })

  it('default denominator is the largest count (leader fills its tile)', () => {
    const chart = unitChart({
      series: [40, 20, 10],
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: { layout: 'grid', shape: 'square', grid: { split: true, columns: 10, total: 100 } },
      },
    })
    // max=40 -> A fills all 100, B = round(20/40*100)=50, C = 25.
    expect(filledIn(tileGroup(chart, 0))).toBe(100)
    expect(filledIn(tileGroup(chart, 1))).toBe(50)
    expect(filledIn(tileGroup(chart, 2))).toBe(25)
    expect(dotCount(chart)).toBe(175)
    chart.destroy()
  })

  it('grid.max makes true "of N" percentage tiles (value fills value cells)', () => {
    const chart = unitChart({
      series: [35, 23, 15],
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: {
          layout: 'grid',
          shape: 'square',
          grid: { split: true, columns: 10, total: 100, max: 100 },
        },
      },
    })
    expect(filledIn(tileGroup(chart, 0))).toBe(35)
    expect(filledIn(tileGroup(chart, 1))).toBe(23)
    expect(filledIn(tileGroup(chart, 2))).toBe(15)
    chart.destroy()
  })

  it('keys each tile by a physical per-tile slot (tile*cells + localCell)', () => {
    const chart = unitChart({
      series: [40, 20],
      labels: ['A', 'B'],
      plotOptions: {
        unit: { layout: 'grid', shape: 'square', grid: { split: true, columns: 10, total: 100 } },
      },
    })
    // Tile 0 (leader) owns slots 0..99; tile 1 (50 filled) owns 100..149.
    expect(chart._unitPrevDots.has('slot:0')).toBe(true)
    expect(chart._unitPrevDots.has('slot:100')).toBe(true)
    expect(chart._unitPrevDots.has('slot:149')).toBe(true)
    expect(chart._unitPrevDots.has('slot:150')).toBe(false)
    // Never per-category "i:j" keying in a grid.
    expect(chart._unitPrevDots.has('0:0')).toBe(false)
    chart.destroy()
  })

  it('drops the tile of a hidden/zero category and re-flows the rest', () => {
    const chart = unitChart({
      series: [30, 0, 10],
      labels: ['A', 'B', 'C'],
      plotOptions: {
        unit: { layout: 'grid', shape: 'square', grid: { split: true, columns: 10, total: 100 } },
      },
    })
    // Only 2 visible tiles (B has no value) -> 2 groups + 2*100 track cells.
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit .apexcharts-series').length,
    ).toBe(2)
    expect(trackCells(chart)).toBe(200)
    chart.destroy()
  })

  it('fades exit ghosts in place on a shrink (on their own cells, no drift to centre)', () => {
    // Exits only render when animating; build with animations on (the shared
    // util force-disables them), like the base exit-ghost test.
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'unit', width: 520, height: 300, animations: { enabled: true, speed: 400 } },
      series: [80, 60],
      labels: ['A', 'B'],
      plotOptions: {
        unit: {
          layout: 'grid',
          shape: 'square',
          grid: { split: true, columns: 10, total: 100, max: 100 },
        },
      },
    })
    chart.render()
    // Shrink both tiles: (80-50) + (60-40) = 50 cells removed -> 50 ghosts,
    // created at their old slots before the rAF fade removes them.
    chart.updateSeries([50, 40])
    const ghosts = [
      ...chart.w.dom.baseEl.querySelectorAll('rect.apexcharts-unit-exit'),
    ]
    expect(ghosts.length).toBe(50)
    // Every ghost sits exactly on a grid cell (a track-cell position), proving
    // it fades in place rather than drifting toward the plot centre.
    const trackXY = new Set(
      [...chart.w.dom.baseEl.querySelectorAll('rect.apexcharts-unit-track-cell')].map(
        (c) =>
          `${Math.round(parseFloat(c.getAttribute('x')))},${Math.round(
            parseFloat(c.getAttribute('y')),
          )}`,
      ),
    )
    const allOnGrid = ghosts.every((g) =>
      trackXY.has(
        `${Math.round(parseFloat(g.getAttribute('x')))},${Math.round(
          parseFloat(g.getAttribute('y')),
        )}`,
      ),
    )
    expect(allOnGrid).toBe(true)
    chart.destroy()
  })

  it('arranges tiles in a trellis (neighbouring tiles are offset in x)', () => {
    const chart = unitChart({
      series: [50, 40, 30, 20],
      labels: ['A', 'B', 'C', 'D'],
      plotOptions: {
        unit: { layout: 'grid', shape: 'square', grid: { split: true, columns: 10, total: 100 } },
      },
    })
    const meanX = (g) => {
      const xs = [...g.querySelectorAll('rect.apexcharts-unit-area')].map((d) =>
        parseFloat(d.getAttribute('x')),
      )
      return xs.reduce((a, b) => a + b, 0) / xs.length
    }
    // 4 tiles -> a 2x2 trellis, so tile 1 sits to the RIGHT of tile 0.
    expect(meanX(tileGroup(chart, 1))).toBeGreaterThan(meanX(tileGroup(chart, 0)))
    chart.destroy()
  })
})

describe('Unit chart - scatter (beeswarm) layout', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  const laneGroup = (chart, t) =>
    chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit .apexcharts-series')[t]
  const cxs = (g) =>
    [...g.querySelectorAll('circle.apexcharts-unit-area')].map((d) =>
      parseFloat(d.getAttribute('cx')),
    )
  const centers = (g) =>
    [...g.querySelectorAll('circle.apexcharts-unit-area')].map((d) => ({
      x: parseFloat(d.getAttribute('cx')),
      y: parseFloat(d.getAttribute('cy')),
    }))

  it('renders one lane per category, one dot per datum, with axis chrome', () => {
    const chart = unitChart({
      series: [
        { name: 'A', data: [10, 40, 70, 100] },
        { name: 'B', data: [20, 50, 80] },
      ],
      plotOptions: { unit: { layout: 'scatter' } },
    })
    expect(dotCount(chart)).toBe(7)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit .apexcharts-series').length,
    ).toBe(2)
    // A drawn value axis: gridlines/ticks + one lane label per category.
    expect(chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-axis').length).toBe(1)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-lane-label').length,
    ).toBe(2)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-tick').length,
    ).toBeGreaterThan(1)
    // Scatter uses per-category (i:j) keying, never physical slots.
    expect(chart._unitPrevDots.has('0:0')).toBe(true)
    expect([...chart._unitPrevDots.keys()].some((k) => k.startsWith('slot:'))).toBe(
      false,
    )
    chart.destroy()
  })

  it('positions dots on the X value axis (larger value -> larger x)', () => {
    const chart = unitChart({
      series: [{ name: 'A', data: [0, 25, 50, 75, 100] }],
      plotOptions: {
        unit: { layout: 'scatter', scatter: { xMin: 0, xMax: 100 } },
      },
    })
    // The lane's dots are drawn in datum (ascending value) order, so cx must be
    // monotonically increasing across the sorted values.
    const xs = cxs(laneGroup(chart, 0))
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1])
    }
    // Min value hugs the left of the plot; max value the right.
    expect(xs[xs.length - 1] - xs[0]).toBeGreaterThan(
      chart.w.layout.gridWidth * 0.5,
    )
    chart.destroy()
  })

  it('vertical orientation puts value on Y (upward) and lanes across X', () => {
    const chart = unitChart({
      series: [
        { name: 'A', data: [0, 25, 50, 75, 100] },
        { name: 'B', data: [10, 40, 90] },
      ],
      plotOptions: {
        unit: {
          layout: 'scatter',
          scatter: { orientation: 'vertical', xMin: 0, xMax: 100 },
        },
      },
    })
    // Value grows UPWARD: ascending values -> monotonically DECREASING cy.
    const ys = centers(laneGroup(chart, 0)).map((p) => p.y)
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeLessThan(ys[i - 1])
    }
    // Lanes are columns across X: lane B sits to the right of lane A.
    const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
    const aCx = mean(centers(laneGroup(chart, 0)).map((p) => p.x))
    const bCx = mean(centers(laneGroup(chart, 1)).map((p) => p.x))
    expect(bCx).toBeGreaterThan(aCx)
    // Axis chrome + one lane label per category still drawn.
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-lane-label').length,
    ).toBe(2)
    chart.destroy()
  })

  it('vertical swarm packing keeps equal-value dots from overlapping', () => {
    const data = new Array(12).fill(50)
    const chart = unitChart({
      series: [{ name: 'A', data }],
      plotOptions: {
        unit: {
          layout: 'scatter',
          size: 4,
          scatter: { orientation: 'vertical', xMin: 0, xMax: 100 },
        },
      },
    })
    const g0 = laneGroup(chart, 0)
    const pts = centers(g0)
    const r = parseFloat(
      g0.querySelector('circle.apexcharts-unit-area').getAttribute('r'),
    )
    let minGap = Infinity
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        minGap = Math.min(
          minGap,
          Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y),
        )
      }
    }
    expect(minGap).toBeGreaterThanOrEqual(2 * r - 0.01)
    // Spread horizontally off the centre line (not a single column).
    expect(new Set(pts.map((p) => Math.round(p.x))).size).toBeGreaterThan(1)
    chart.destroy()
  })

  // The value domain must ALWAYS contain every datum: a user xMin/xMax only
  // frames the axis and is extended by whole tick-steps when data would fall
  // outside, so no dot is ever drawn beyond the axis (where it cannot be
  // hovered). Verified on BOTH the X value axis (horizontal) and the Y value
  // axis (vertical).
  const tickCoords = (chart, attr) =>
    [...chart.w.dom.baseEl.querySelectorAll('text.apexcharts-unit-tick')].map((t) =>
      parseFloat(t.getAttribute(attr)),
    )

  it('horizontal domain contains data outside a user xMin/xMax (no dot past the axis)', () => {
    const chart = unitChart({
      // -30 and 130 fall OUTSIDE the framed [0, 100].
      series: [{ name: 'A', data: [-30, 20, 60, 130] }],
      plotOptions: {
        unit: {
          layout: 'scatter',
          size: 4,
          scatter: { xMin: 0, xMax: 100, tickAmount: 5 },
        },
      },
    })
    const xs = tickCoords(chart, 'x')
    const left = Math.min(...xs)
    const right = Math.max(...xs)
    // Every dot centre stays between the extreme ticks (value axis is X here;
    // swarm packing only shifts the perpendicular axis, so cx = value exactly).
    centers(laneGroup(chart, 0)).forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(left - 0.5)
      expect(p.x).toBeLessThanOrEqual(right + 0.5)
    })
    chart.destroy()
  })

  it('vertical domain contains data outside a user xMin/xMax (no dot below the axis)', () => {
    const chart = unitChart({
      series: [{ name: 'A', data: [-30, 20, 60, 130] }],
      plotOptions: {
        unit: {
          layout: 'scatter',
          size: 4,
          scatter: { orientation: 'vertical', xMin: 0, xMax: 100, tickAmount: 5 },
        },
      },
    })
    const ys = tickCoords(chart, 'y')
    const top = Math.min(...ys)
    const bottom = Math.max(...ys)
    // Value axis is Y: every dot centre stays between the top and bottom ticks,
    // so none spills below the lane baseline (the reported bug).
    centers(laneGroup(chart, 0)).forEach((p) => {
      expect(p.y).toBeGreaterThanOrEqual(top - 0.5)
      expect(p.y).toBeLessThanOrEqual(bottom + 0.5)
    })
    chart.destroy()
  })

  it('swarm packing keeps equal-value dots from overlapping', () => {
    // 12 identical values would stack on one x without a beeswarm spread.
    const data = new Array(12).fill(50)
    const chart = unitChart({
      series: [{ name: 'A', data }],
      plotOptions: {
        unit: { layout: 'scatter', size: 4, scatter: { xMin: 0, xMax: 100 } },
      },
    })
    const g0 = laneGroup(chart, 0)
    const pts = centers(g0)
    const r = parseFloat(
      g0.querySelector('circle.apexcharts-unit-area').getAttribute('r'),
    )
    let minGap = Infinity
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
        if (d < minGap) minGap = d
      }
    }
    // No pair closer than ~2r (allow a hair of float slack).
    expect(minGap).toBeGreaterThanOrEqual(2 * r - 0.01)
    // ...and they are spread vertically off the centre line (not a single row).
    const ys = pts.map((p) => Math.round(p.y))
    expect(new Set(ys).size).toBeGreaterThan(1)
    chart.destroy()
  })

  it('drops an empty category lane and re-flows the rest', () => {
    const chart = unitChart({
      series: [
        { name: 'A', data: [10, 20, 30] },
        { name: 'B', data: [] }, // no units -> no lane
        { name: 'C', data: [40, 50] },
      ],
      plotOptions: { unit: { layout: 'scatter' } },
    })
    // Only 2 lanes (A, C); B contributes nothing.
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-lane-label').length,
    ).toBe(2)
    expect(dotCount(chart)).toBe(5)
    chart.destroy()
  })

  it('nice-numbers the X axis to cover the data', () => {
    const chart = unitChart({
      series: [{ name: 'A', data: [3, 47, 84] }],
      plotOptions: { unit: { layout: 'scatter' } },
    })
    const ax = chart.w.config.plotOptions.unit // sanity: config intact
    expect(ax.layout).toBe('scatter')
    // The instance stashes the resolved axis; max tick must cover the data max.
    const unit = chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-tick')
    const tickVals = [...unit].map((t) => parseFloat(t.textContent))
    expect(Math.max(...tickVals)).toBeGreaterThanOrEqual(84)
    expect(Math.min(...tickVals)).toBeLessThanOrEqual(3)
    chart.destroy()
  })

  it('2D mode places points by (x, y) on two axes (y grows upward)', () => {
    const chart = unitChart({
      series: [{ name: 'S', data: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 0, y: 100 }] }],
      plotOptions: {
        unit: {
          layout: 'scatter',
          size: 4,
          scatter: { y: 'value', xMin: 0, xMax: 100, yMin: 0, yMax: 100 },
        },
      },
    })
    const dots = [
      ...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area'),
    ].map((c) => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy') }))
    expect(dots.length).toBe(3)
    // dot1 (x=100) is right of dot0 (x=0); same y so same cy.
    expect(dots[1].x).toBeGreaterThan(dots[0].x)
    expect(Math.abs(dots[1].y - dots[0].y)).toBeLessThan(1)
    // dot2 (y=100) sits ABOVE dot0 (smaller cy); same x so same cx.
    expect(dots[2].y).toBeLessThan(dots[0].y)
    expect(Math.abs(dots[2].x - dots[0].x)).toBeLessThan(1)
    // Two axes of ticks (x + y) and NO lane labels in 2D.
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-tick').length,
    ).toBeGreaterThanOrEqual(8)
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-lane-label').length,
    ).toBe(0)
    chart.destroy()
  })

  it('sizeRange makes bubbles scaled (by area) from the sizeField', () => {
    const chart = unitChart({
      series: [{ name: 'S', data: [{ x: 10, y: 10, z: 1 }, { x: 20, y: 20, z: 100 }] }],
      plotOptions: {
        unit: { layout: 'scatter', scatter: { y: 'value', sizeRange: [4, 20] } },
      },
    })
    const rs = [
      ...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area'),
    ]
      .map((c) => +c.getAttribute('r'))
      .sort((a, b) => a - b)
    // smallest z -> rMin, largest z -> rMax.
    expect(rs[0]).toBeCloseTo(4, 1)
    expect(rs[1]).toBeCloseTo(20, 1)
    chart.destroy()
  })

  it('bubble beeswarm packs varying-radius dots with no overlap', () => {
    // 12 dots at the SAME x with a spread of sizes: must stack without overlap
    // using each pair's own r_i + r_j.
    const data = []
    for (let i = 0; i < 12; i++) data.push({ value: 50, z: 1 + i * 9 })
    const chart = unitChart({
      series: [{ name: 'S', data }],
      plotOptions: {
        unit: { layout: 'scatter', scatter: { sizeRange: [3, 10], xMin: 0, xMax: 100 } },
      },
    })
    const pts = [
      ...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area'),
    ].map((c) => ({
      x: +c.getAttribute('cx'),
      y: +c.getAttribute('cy'),
      r: +c.getAttribute('r'),
    }))
    let worst = Infinity // min (gap - (ri+rj)) across pairs
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)
        worst = Math.min(worst, d - (pts[i].r + pts[j].r))
      }
    }
    expect(worst).toBeGreaterThanOrEqual(-0.5)
    chart.destroy()
  })

  it('applies fill.opacity so overlapping bubbles read through each other', () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'unit', width: 500, height: 360 },
      series: [{ name: 'S', data: [{ x: 10, y: 10 }, { x: 20, y: 20 }] }],
      fill: { opacity: 0.6 },
      plotOptions: { unit: { layout: 'scatter', scatter: { y: 'value' } } },
    })
    chart.render()
    const c = chart.w.dom.baseEl.querySelector('circle.apexcharts-unit-area')
    expect(c.getAttribute('fill-opacity')).toBe('0.6')
    chart.destroy()

    // Default unit dots stay solid (Defaults.unit fill.opacity = 1 -> no attr).
    const solid = unitChart({
      series: [10, 10],
      labels: ['A', 'B'],
      plotOptions: { unit: { clusterLabels: { show: false } } },
    })
    expect(
      solid.w.dom.baseEl
        .querySelector('circle.apexcharts-unit-area')
        .getAttribute('fill-opacity'),
    ).toBe(null)
    solid.destroy()
  })
})

describe('Unit chart - arc (parliament / hemicycle) layout', () => {
  beforeEach(() => resetLicense())
  afterEach(() => resetLicense())

  const PARTIES = [40, 55, 25, 70, 30] // 220 seats, 5 parties
  const arcChart = (arc, series) =>
    unitChart({
      chart: { width: 640, height: 380 },
      series: series || PARTIES,
      labels: ['A', 'B', 'C', 'D', 'E'],
      plotOptions: { unit: { layout: 'arc', ...(arc ? { arc } : {}) } },
    })

  // Every seat across every party group, tagged with its category index.
  function arcSeats(chart) {
    const groups = chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-unit .apexcharts-series',
    )
    const seats = []
    groups.forEach((g, cat) => {
      g.querySelectorAll('circle.apexcharts-unit-area').forEach((d) => {
        seats.push({
          cat,
          x: parseFloat(d.getAttribute('cx')),
          y: parseFloat(d.getAttribute('cy')),
        })
      })
    })
    return seats
  }

  // Recover the arc centre from the rendered seats: it is symmetric about
  // x = gw/2, and the outer row's width is ~2r, its top ~r above the centre, so
  // cy = topmost + halfWidth. Accurate to sub-pixel for a symmetric semicircle.
  function arcCentre(seats, gw) {
    const xs = seats.map((s) => s.x)
    const ys = seats.map((s) => s.y)
    const r = (Math.max(...xs) - Math.min(...xs)) / 2
    return { cx: gw / 2, cy: Math.min(...ys) + r }
  }

  it('renders exactly count seats per party, summing to the total', () => {
    const chart = arcChart()
    const groups = chart.w.dom.baseEl.querySelectorAll(
      '.apexcharts-unit .apexcharts-series',
    )
    PARTIES.forEach((n, i) => {
      expect(
        groups[i].querySelectorAll('circle.apexcharts-unit-area').length,
      ).toBe(n)
    })
    expect(dotCount(chart)).toBe(220)
    chart.destroy()
  })

  it('keeps every seat inside the plot box', () => {
    const chart = arcChart()
    const seats = arcSeats(chart)
    expect(seats.length).toBe(220)
    seats.forEach((s) => {
      expect(s.x).toBeGreaterThanOrEqual(0)
      expect(s.x).toBeLessThanOrEqual(640)
      expect(s.y).toBeGreaterThanOrEqual(0)
      expect(s.y).toBeLessThanOrEqual(380)
    })
    chart.destroy()
  })

  it('a default sweep is a wide, shallow dome (a semicircle)', () => {
    const s = arcSeats(arcChart())
    const w = Math.max(...s.map((d) => d.x)) - Math.min(...s.map((d) => d.x))
    const h = Math.max(...s.map((d) => d.y)) - Math.min(...s.map((d) => d.y))
    expect(h).toBeLessThan(w * 0.65) // dome, not a disc
  })

  it('a full circle (endAngle 360) is roughly square', () => {
    const s = arcSeats(arcChart({ startAngle: 0, endAngle: 360 }))
    const w = Math.max(...s.map((d) => d.x)) - Math.min(...s.map((d) => d.x))
    const h = Math.max(...s.map((d) => d.y)) - Math.min(...s.map((d) => d.y))
    expect(h).toBeGreaterThan(w * 0.85)
  })

  it('each party is a contiguous angular wedge (no interleaving)', () => {
    const chart = arcChart()
    const seats = arcSeats(chart)
    const { cx, cy } = arcCentre(seats, 640)
    // Angle from the top, radialBar-style: atan2(dx, -dy), so a semicircle spans
    // -pi/2 .. pi/2 left-to-right. A wedge layout gives one contiguous run per
    // party, never a party split into two runs.
    seats.sort(
      (p, q) =>
        Math.atan2(p.x - cx, -(p.y - cy)) - Math.atan2(q.x - cx, -(q.y - cy)),
    )
    let runs = 0
    for (let i = 0; i < seats.length; i++) {
      if (i === 0 || seats[i].cat !== seats[i - 1].cat) runs++
    }
    expect(runs).toBe(PARTIES.length)
    chart.destroy()
  })

  it('respects an explicit row count', () => {
    const seats = arcSeats(arcChart({ rows: 3 }))
    const { cx, cy } = arcCentre(seats, 640)
    const radii = seats
      .map((s) => Math.hypot(s.x - cx, s.y - cy))
      .sort((a, b) => a - b)
    // Each row is one exact radius; count bands (a gap jump starts a new band).
    let bands = 0
    for (let i = 0; i < radii.length; i++) {
      if (i === 0 || radii[i] - radii[i - 1] > 6) bands++
    }
    expect(bands).toBe(3)
  })

  it('packs seats without overlap', () => {
    const chart = arcChart()
    const seats = arcSeats(chart)
    const r = parseFloat(
      chart.w.dom.baseEl
        .querySelector('circle.apexcharts-unit-area')
        .getAttribute('r'),
    )
    let minD = Infinity
    for (let i = 0; i < seats.length; i++) {
      for (let j = i + 1; j < seats.length; j++) {
        const d = Math.hypot(seats[i].x - seats[j].x, seats[i].y - seats[j].y)
        if (d < minD) minD = d
      }
    }
    // Centres are at least ~2r apart (spacing 1.05 -> ~2.1r); float slack aside,
    // no two seats stack.
    expect(minD).toBeGreaterThan(2 * r * 0.95)
    chart.destroy()
  })

  it('conserves the chamber size when seats shift between parties', () => {
    // Same total, different split: the slot-keyed transition just moves the
    // party boundary, so the seat count is conserved (no phantom enters/exits).
    const chart = arcChart(undefined, [50, 50, 25, 70, 25]) // 220
    expect(dotCount(chart)).toBe(220)
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

  it("packed layout keys dots by physical spiral slot, not category (i:j)", () => {
    // A packed blob has no stable per-category slot (the outer group's spiral
    // indices are offset by the inner group's count), so keying "i:j" there
    // would re-spin the whole outer ring whenever the inner count moves. It
    // keys by physical slot instead.
    const chart = unitChart({
      series: [10, 20],
      labels: ['Inner', 'Outer'],
      plotOptions: { unit: { layout: 'packed', clusterLabels: { show: false } } },
    })
    expect(chart._unitPrevDots.size).toBe(30)
    expect(chart._unitPrevDots.has('slot:0')).toBe(true)
    expect(chart._unitPrevDots.has('slot:29')).toBe(true)
    expect(chart._unitPrevDots.has('1:5')).toBe(false)
    chart.destroy()
  })

  it('packed slots stay put when the inner group count changes (no re-spin)', () => {
    // Regression guard: shrinking the inner (minority) group must not fling the
    // outer group across the disc. Each key's stored position is the point the
    // next update tweens FROM/TO, so a key that keeps its position barely moves
    // on screen. With the old category keying an outer dot ("1:j") chorded clear
    // across the disc (~a full diameter); with slot keying it only shifts by the
    // small change in the fitted spiral step.
    const chart = unitChart({
      series: [80, 160],
      labels: ['Inner', 'Outer'],
      plotOptions: {
        unit: { layout: 'packed', sortByGroup: true, clusterLabels: { show: false } },
      },
    })
    const pts = [...chart._unitPrevDots.values()]
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
    const R = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)))
    const before = new Map([...chart._unitPrevDots].map(([k, v]) => [k, { x: v.x, y: v.y }]))

    // Inner 80 -> 40: with category keying this re-spins the whole outer ring.
    chart.updateSeries([40, 160])

    let maxShift = 0
    chart._unitPrevDots.forEach((v, k) => {
      const b = before.get(k)
      if (b) maxShift = Math.max(maxShift, Math.hypot(v.x - b.x, v.y - b.y))
    })
    // A shared physical slot barely moves; a cross-disc chord would be ~1.5x R.
    expect(maxShift).toBeLessThan(R * 0.35)
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

  it('collapses an OBJECT-FORM category too (regression: was a silent no-op)', () => {
    // Object form ({ name, data }) is the form required for per-unit colours,
    // tooltips, scatter and bubble sizing. Its dot count comes from data.length,
    // so collapsing must empty the data array — writing `.y = 0` (as the shared
    // non-axis path did) was ignored and the dots stayed rendered.
    const chart = unitChart({
      chart: { animations: { enabled: false } },
      series: [
        { name: 'A', data: [10, 20, 30] }, // 3 dots
        { name: 'B', data: [40, 50, 60, 70] }, // 4 dots
        { name: 'C', data: [80, 90] }, // 2 dots
      ],
      plotOptions: { unit: { layout: 'grouped', clusterLabels: { show: false } } },
    })
    expect(catDots(chart, 1)).toBe(4)
    expect(legendInactive(chart, 2)).toBe(false)

    chart.legend.legendHelpers.toggleDataSeries(1, false)
    expect(chart.w.globals.collapsedSeriesIndices).toContain(1)
    expect(catDots(chart, 1)).toBe(0) // its dots are actually removed now
    expect(catDots(chart, 0)).toBe(3) // the others stay
    expect(legendInactive(chart, 2)).toBe(true)

    // Clicking again restores the original data verbatim.
    chart.legend.legendHelpers.toggleDataSeries(1, true)
    expect(chart.w.globals.collapsedSeriesIndices).not.toContain(1)
    expect(catDots(chart, 1)).toBe(4)
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

describe('Unit chart — gather motion', () => {
  let warnSpy
  beforeEach(() => {
    resetLicense()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
    resetLicense()
  })

  /**
   * A unit chart with animations ON (the shared util force-disables them), so
   * the gather actually runs.
   */
  function animatedUnitChart(unitOpts = {}, series = [40, 40]) {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'unit',
        width: 500,
        height: 360,
        animations: { enabled: true, speed: 400 },
      },
      series,
      labels: ['A', 'B'],
      plotOptions: { unit: { clusterLabels: { show: false }, ...unitOpts } },
    })
    chart.render()
    return chart
  }

  /**
   * Hand control of the frame clock to the test: rAF callbacks queue instead of
   * being scheduled, and `performance.now` reads the clock we advance. Without
   * this the gather never runs a frame under jsdom, so every spring would stay
   * at rest and the interruption case could not be observed at all.
   */
  function installFrameClock() {
    let now = 1000
    let pending = []
    let nextId = 1
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        pending.push({ id: nextId, cb })
        return nextId++
      })
    const caf = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((id) => {
        pending = pending.filter((p) => p.id !== id)
      })
    const perf = vi.spyOn(performance, 'now').mockImplementation(() => now)
    return {
      frame(ms = 16) {
        now += ms
        const due = pending
        pending = []
        due.forEach((p) => p.cb(now))
      },
      restore() {
        raf.mockRestore()
        caf.mockRestore()
        perf.mockRestore()
      },
    }
  }

  it('springs the gather by default and keys the springs like the slots', () => {
    const chart = animatedUnitChart()
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      expect(chart._unitSprings instanceof Map).toBe(true)
      // One spring pair per dot, keyed exactly like the slot map.
      expect(chart._unitSprings.size).toBe(chart._unitPrevDots.size)
      for (const key of chart._unitPrevDots.keys()) {
        expect(chart._unitSprings.has(key)).toBe(true)
      }
    } finally {
      clock.restore()
      chart.destroy()
    }
  })

  it('carries position AND velocity through an interrupted gather', () => {
    const chart = animatedUnitChart()
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      // Let the dots pick up real speed before interrupting.
      clock.frame(16)
      clock.frame(16)
      clock.frame(16)

      // A dot that is genuinely in flight (both moving and off its target).
      const key = [...chart._unitSprings.keys()].find((k) => {
        const s = chart._unitSprings.get(k)
        return Math.abs(s.x.velocity) > 1 || Math.abs(s.y.velocity) > 1
      })
      expect(key).toBeDefined()
      const before = chart._unitSprings.get(key)
      const live = { x: before.x.value, y: before.y.value }
      const vel = { x: before.x.velocity, y: before.y.velocity }

      // The slot this dot was travelling TOWARDS — what the old tween would
      // have restarted it from.
      const oldTarget = { x: before.x.target, y: before.y.target }
      expect(Math.hypot(live.x - oldTarget.x, live.y - oldTarget.y)).toBeGreaterThan(1)

      // Interrupt mid-flight.
      chart.updateSeries([70, 10])

      const after = chart._unitSprings.get(key)
      expect(after.x.value).toBeCloseTo(live.x, 6)
      expect(after.y.value).toBeCloseTo(live.y, 6)
      expect(after.x.velocity).toBeCloseTo(vel.x, 6)
      expect(after.y.velocity).toBeCloseTo(vel.y, 6)
    } finally {
      clock.restore()
      chart.destroy()
    }
  })

  it('places an interrupted mark at its live position, not its old slot', () => {
    const chart = animatedUnitChart()
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      clock.frame(16)
      clock.frame(16)
      clock.frame(16)

      const key = [...chart._unitSprings.keys()].find((k) => {
        const s = chart._unitSprings.get(k)
        return Math.abs(s.x.velocity) > 1 || Math.abs(s.y.velocity) > 1
      })
      const live = { ...chart._unitSprings.get(key) }
      const liveX = live.x.value
      const liveY = live.y.value

      chart.updateSeries([70, 10])

      // The dot the new render drew for this key starts on screen where the
      // old one actually was. Under the tween this was `_unitPrevDots`, i.e.
      // the slot it had not reached yet — a visible jump on every interruption.
      const dots = [...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area')]
      const seeded = dots.some(
        (c) =>
          Math.abs(parseFloat(c.getAttribute('cx')) - liveX) < 1e-6 &&
          Math.abs(parseFloat(c.getAttribute('cy')) - liveY) < 1e-6,
      )
      expect(seeded).toBe(true)
    } finally {
      clock.restore()
      chart.destroy()
    }
  })

  it('settles every mark exactly on its slot', () => {
    const chart = animatedUnitChart()
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      // Well past the stagger + settle window for speed 400.
      for (let i = 0; i < 200; i++) clock.frame(16)

      for (const [key, slot] of chart._unitPrevDots) {
        const s = chart._unitSprings.get(key)
        expect(s.x.value).toBe(slot.x)
        expect(s.y.value).toBe(slot.y)
        expect(s.x.velocity).toBe(0)
      }
      // The loop released itself rather than spinning forever.
      expect(chart.w.globals.unitGatherRAF).toBe(null)
    } finally {
      clock.restore()
      chart.destroy()
    }
  })

  it('gather.motion "tween" opts out of springs', () => {
    const chart = animatedUnitChart({ gather: { motion: 'tween' } })
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      expect(chart._unitSprings).toBe(null)
      // Still animates: the tween path drives the same rAF loop.
      expect(chart.w.globals.unitGatherRAF).not.toBe(null)
    } finally {
      clock.restore()
      chart.destroy()
    }
  })

  it('an explicit gather.easing keeps its curve (implies tween)', () => {
    const chart = animatedUnitChart({ gather: { easing: 'outBack' } })
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      expect(chart._unitSprings).toBe(null)
    } finally {
      clock.restore()
      chart.destroy()
    }
  })

  it('gather.motion "spring" wins over an explicit easing', () => {
    const chart = animatedUnitChart({ gather: { easing: 'outBack', motion: 'spring' } })
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      expect(chart._unitSprings instanceof Map).toBe(true)
    } finally {
      clock.restore()
      chart.destroy()
    }
  })

  it('a slower chart.animations.speed makes a softer spring, not a bouncier one', () => {
    // Damping ratio c / (2 * sqrt(k)) is what decides overshoot; `speed` must
    // rescale the spring in time and leave that alone.
    const ratio = (s) => s.damping / (2 * Math.sqrt(s.stiffness))

    document.body.innerHTML = '<div id="chart"></div>'
    const fast = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'unit', width: 500, height: 360, animations: { enabled: true, speed: 400 } },
      series: [40, 40],
      labels: ['A', 'B'],
      plotOptions: { unit: { clusterLabels: { show: false } } },
    })
    fast.render()
    const clock = installFrameClock()
    try {
      fast.updateSeries([10, 70])
      const a = fast._unitSprings.values().next().value.x
      fast.destroy()

      document.body.innerHTML = '<div id="chart"></div>'
      const slow = new ApexCharts(document.querySelector('#chart'), {
        chart: { type: 'unit', width: 500, height: 360, animations: { enabled: true, speed: 1600 } },
        series: [40, 40],
        labels: ['A', 'B'],
        plotOptions: { unit: { clusterLabels: { show: false } } },
      })
      slow.render()
      slow.updateSeries([10, 70])
      const b = slow._unitSprings.values().next().value.x

      expect(b.stiffness).toBeLessThan(a.stiffness)
      expect(b.damping).toBeLessThan(a.damping)
      expect(ratio(b)).toBeCloseTo(ratio(a), 10)
      slow.destroy()
    } finally {
      clock.restore()
    }
  })

  it('drops stale springs when a render places its marks outright', () => {
    const chart = animatedUnitChart()
    const clock = installFrameClock()
    try {
      chart.updateSeries([10, 70])
      clock.frame(16)
      expect(chart._unitSprings.size).toBeGreaterThan(0)

      // A non-animated render (updateSeries(..., false), a resize, animations
      // off) repositions every mark directly, so the springs no longer describe
      // anything on screen and must not be carried into the next gather.
      chart.updateSeries([30, 30], false)
      expect(chart._unitSprings).toBe(null)
    } finally {
      clock.restore()
      chart.destroy()
    }
  })
})

describe('Unit chart — custom layout (position provider)', () => {
  let warnSpy
  beforeEach(() => {
    resetLicense()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
    ApexCharts.unregisterUnitLayout('ring')
    resetLicense()
  })

  const positionsOf = (chart) =>
    [...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area')].map((c) => ({
      x: parseFloat(c.getAttribute('cx')),
      y: parseFloat(c.getAttribute('cy')),
    }))

  /** Places every mark on a circle, purely from the objects it is handed. */
  const ring = (objects, rect) => {
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const rad = Math.min(rect.width, rect.height) / 2 - 10
    return objects.map((o, i) => {
      const t = (i / objects.length) * Math.PI * 2
      return { id: o.id, x: cx + rad * Math.cos(t), y: cy + rad * Math.sin(t) }
    })
  }

  function customChart(positions, extra = {}) {
    return unitChart({
      series: [6, 6],
      labels: ['A', 'B'],
      plotOptions: {
        unit: {
          layout: 'custom',
          positions,
          clusterLabels: { show: false },
          ...extra,
        },
      },
    })
  }

  it('places every mark where the provider says', () => {
    const seen = []
    const chart = customChart((objects, rect) => {
      seen.push({ count: objects.length, rect })
      return ring(objects, rect)
    })

    expect(seen).toHaveLength(1)
    expect(seen[0].count).toBe(12)
    // The rect is the plot area, in the same space as the returned coordinates.
    expect(seen[0].rect.width).toBeGreaterThan(0)
    expect(seen[0].rect.height).toBeGreaterThan(0)

    const pts = positionsOf(chart)
    expect(pts).toHaveLength(12)
    // Every mark sits on the ring the provider described.
    const cx = seen[0].rect.width / 2
    const cy = seen[0].rect.height / 2
    const rad = Math.min(seen[0].rect.width, seen[0].rect.height) / 2 - 10
    pts.forEach((p) => {
      expect(Math.hypot(p.x - cx, p.y - cy)).toBeCloseTo(rad, 6)
    })
    chart.destroy()
  })

  it('hands the provider each mark\'s identity and datum', () => {
    let objects = []
    const chart = unitChart({
      series: [{ data: [{ id: 'tx', name: 'Texas', y: 3 }, { id: 'ca', name: 'California', y: 2 }] }],
      plotOptions: {
        unit: { layout: 'custom', positions: (o, r) => { objects = o; return ring(o, r) },
          clusterLabels: { show: false } },
      },
    })
    // Ids come from the data, so a provider can address a specific unit rather
    // than a positional slot.
    expect(objects.map((o) => o.id)).toContain('tx')
    expect(objects.map((o) => o.id)).toContain('ca')
    const tx = objects.find((o) => o.id === 'tx')
    expect(tx.datum.name).toBe('Texas')
    expect(tx.seriesIndex).toBe(0)
    expect(typeof tx.index).toBe('number')
    expect(tx.r).toBeGreaterThan(0)
    chart.destroy()
  })

  it('falls back to positional ids without per-unit data', () => {
    let objects = []
    const chart = customChart((o, r) => { objects = o; return ring(o, r) })
    expect(objects[0].id).toBe('0:0')
    expect(objects.some((o) => o.id === '1:0')).toBe(true)
    chart.destroy()
  })

  it('resolves a layout registered by name', () => {
    ApexCharts.registerUnitLayout('ring', ring)
    const chart = customChart('ring')
    expect(positionsOf(chart)).toHaveLength(12)
    chart.destroy()
  })

  it('drops marks the provider omits, so they animate out', () => {
    // Half the marks get no position at all.
    const chart = customChart((objects, rect) =>
      ring(objects, rect).filter((_, i) => i % 2 === 0),
    )
    expect(positionsOf(chart)).toHaveLength(6)
    chart.destroy()
  })

  it('ignores ids that match no mark', () => {
    const chart = customChart((objects, rect) => [
      ...ring(objects, rect),
      { id: 'nobody', x: 1, y: 1 },
    ])
    expect(positionsOf(chart)).toHaveLength(12)
    chart.destroy()
  })

  it('drops a non-finite position rather than leaving the mark stale', () => {
    const chart = customChart((objects, rect) =>
      ring(objects, rect).map((p, i) => (i === 0 ? { ...p, x: NaN } : p)),
    )
    expect(positionsOf(chart)).toHaveLength(11)
    chart.destroy()
  })

  it('honours a per-mark radius from the provider', () => {
    const chart = customChart((objects, rect) =>
      ring(objects, rect).map((p, i) => ({ ...p, r: i === 0 ? 12 : 4 })),
    )
    const radii = [...chart.w.dom.baseEl.querySelectorAll('circle.apexcharts-unit-area')].map(
      (c) => parseFloat(c.getAttribute('r')),
    )
    expect(radii).toContain(12)
    expect(radii).toContain(4)
    chart.destroy()
  })

  it('keeps identity across a custom -> packed relayout', () => {
    const data = [{ id: 'a', y: 1 }, { id: 'b', y: 1 }, { id: 'c', y: 1 }]
    const chart = unitChart({
      series: [{ data }],
      plotOptions: {
        unit: { layout: 'custom', positions: ring, transition: 'identity',
          clusterLabels: { show: false } },
      },
    })
    expect([...chart._unitPrevDots.keys()].sort()).toEqual(['id:a', 'id:b', 'id:c'])

    // The SAME keys must survive the switch to a built-in layout, which is what
    // lets a mark migrate between arrangements instead of being rebuilt.
    chart.updateOptions({ plotOptions: { unit: { layout: 'packed' } } })
    expect([...chart._unitPrevDots.keys()].sort()).toEqual(['id:a', 'id:b', 'id:c'])
    chart.destroy()
  })

  it('swaps one shape for another on every update, not just the first', () => {
    // The identical-options skip in update() compared configs with
    // JSON.stringify, which drops functions - so a second update that changed
    // ONLY the provider stringified identically to the first and was skipped.
    // A page cycling through shapes then froze on whichever it reached second.
    const left = (objects, rect) =>
      objects.map((o) => ({ id: o.id, x: rect.x + 10, y: rect.y + 10 }))
    const right = (objects, rect) =>
      objects.map((o) => ({ id: o.id, x: rect.x + rect.width - 10, y: rect.y + 10 }))

    const chart = customChart(ring)
    const unit = (positions) => ({
      plotOptions: {
        unit: { layout: 'custom', positions, clusterLabels: { show: false } },
      },
    })

    chart.updateOptions(unit(left))
    expect(positionsOf(chart)[0].x).toBeCloseTo(10, 6)

    // Same shape of options, different function: this is the update that used
    // to vanish.
    chart.updateOptions(unit(right))
    expect(positionsOf(chart)[0].x).toBeGreaterThan(100)

    // And back again, so the skip is not merely deferred by one update.
    chart.updateOptions(unit(left))
    expect(positionsOf(chart)[0].x).toBeCloseTo(10, 6)
    chart.destroy()
  })

  it('still skips an update that repeats the same provider', () => {
    let calls = 0
    const counted = (objects, rect) => {
      calls++
      return ring(objects, rect)
    }
    const chart = customChart(ring)
    const same = {
      plotOptions: {
        unit: {
          layout: 'custom',
          positions: counted,
          clusterLabels: { show: false },
        },
      },
    }
    chart.updateOptions(same)
    expect(calls).toBe(1)
    // Identical options, including the same function identity: no re-render.
    chart.updateOptions(same)
    expect(calls).toBe(1)
    chart.destroy()
  })

  it('warns and falls back to grouped when no provider is given', () => {
    const chart = unitChart({
      series: [6, 6],
      labels: ['A', 'B'],
      plotOptions: { unit: { layout: 'custom', clusterLabels: { show: false } } },
    })
    expect(positionsOf(chart)).toHaveLength(12)
    expect(warnSpy.mock.calls.flat().join(' ')).toMatch(/positions/)
    chart.destroy()
  })

  it('warns and falls back when a named layout is not registered', () => {
    const chart = customChart('missing-layout')
    expect(positionsOf(chart)).toHaveLength(12)
    expect(warnSpy.mock.calls.flat().join(' ')).toMatch(/registerUnitLayout/)
    chart.destroy()
  })

  it('survives a provider that throws', () => {
    const chart = customChart(() => {
      throw new Error('provider exploded')
    })
    // Still a chart, laid out by the grouped fallback.
    expect(positionsOf(chart)).toHaveLength(12)
    expect(warnSpy.mock.calls.flat().join(' ')).toMatch(/threw/)
    chart.destroy()
  })

  it('survives a provider that returns the wrong shape', () => {
    const chart = customChart(() => 'not an array')
    expect(positionsOf(chart)).toHaveLength(12)
    chart.destroy()
  })

  it('still resolves every built-in layout to a full set of finite positions', () => {
    // Guards the dispatch chain the 'custom' branch was threaded into. The
    // real per-layout geometry cover is the rest of this file.
    for (const layout of ['grouped', 'packed', 'columns', 'grid', 'arc']) {
      const chart = unitChart({
        series: [10, 20, 5],
        labels: ['A', 'B', 'C'],
        plotOptions: { unit: { layout, clusterLabels: { show: false } } },
      })
      const pts = positionsOf(chart)
      expect(pts.length).toBeGreaterThan(0)
      pts.forEach((p) => {
        expect(isFinite(p.x)).toBe(true)
        expect(isFinite(p.y)).toBe(true)
      })
      chart.destroy()
    }
  })

  it('keeps each dot pointing at its OWN datum when a layout omits marks', () => {
    // `_layoutCustom` used to push positions with no dataPointIndex, so the
    // draw pass fell back to the loop index. A provider is allowed to omit
    // marks (that is how a mark exits), and every dot after an omitted one then
    // reported the PREVIOUS datum in its tooltip.
    const skipB = (objects, rect) =>
      objects
        .filter((o) => o.id !== 'b')
        .map((o, i) => ({ id: o.id, x: rect.x + 20 + i * 30, y: rect.y + 30 }))
    const chart = unitChart({
      series: [
        {
          name: 'S',
          data: [
            { id: 'a', value: 1 },
            { id: 'b', value: 2 },
            { id: 'c', value: 3 },
          ],
        },
      ],
      plotOptions: {
        unit: { layout: 'custom', positions: skipB, clusterLabels: { show: false } },
      },
    })
    const els = [...chart.w.dom.baseEl.querySelectorAll('.apexcharts-unit-area')]
    expect(els).toHaveLength(2)
    // The survivors report their own indices: 'a' is j=0, 'c' is j=2.
    expect(els.map((e) => e.getAttribute('j'))).toEqual(['0', '2'])
    chart.destroy()
  })

  it('centres a square on its OWN radius when a layout sizes marks per mark', () => {
    // `_drawDot` sized the rect from the dot's own radius, but `_placeDot`
    // converted centre -> top-left using the chart-wide `_lastDotR`. Any layout
    // handing back per-mark radii drew every square off its slot by the
    // difference.
    const R = [6, 14]
    const twoSizes = (objects, rect) =>
      objects.map((o, i) => ({
        id: o.id,
        x: rect.x + 40 + i * 80,
        y: rect.y + 40,
        r: R[i],
      }))
    const chart = unitChart({
      series: [{ name: 'S', data: [{ id: 'a' }, { id: 'b' }] }],
      plotOptions: {
        unit: {
          layout: 'custom',
          positions: twoSizes,
          shape: 'square',
          clusterLabels: { show: false },
        },
      },
    })
    const rects = [...chart.w.dom.baseEl.querySelectorAll('rect.apexcharts-unit-area')]
    expect(rects).toHaveLength(2)
    rects.forEach((el, i) => {
      const side = Number(el.getAttribute('width'))
      const cx = Number(el.getAttribute('x')) + side / 2
      const cy = Number(el.getAttribute('y')) + side / 2
      expect(side).toBeCloseTo(R[i] * 2, 5)
      expect(cx).toBeCloseTo(40 + i * 80, 5)
      expect(cy).toBeCloseTo(40, 5)
    })
    chart.destroy()
  })
})
