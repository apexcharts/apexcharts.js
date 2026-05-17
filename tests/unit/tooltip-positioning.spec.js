// @ts-nocheck
/**
 * Coverage for the tooltip refactor: arrow placement, first-paint
 * anti-flicker, rect-derived bar centering, horizontal-bar above/below
 * placement, axis-tooltip framing, marker SVG, and `KeyboardNavigation`
 * focus-modality guard. Companion to `tooltip.spec.js` — those tests cover
 * the legacy positioning math; this file covers the additions made in the
 * tooltip-modernization work.
 */
import { describe, it, expect, vi } from 'vitest'
import TooltipPosition from '../../src/modules/tooltip/Position.js'
import { renderMarkerSVG } from '../../src/modules/tooltip/Marker.js'
import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Minimal `w` + `ttCtx` factory tailored for Position.js paths. Lighter than
 * the one in `tooltip.spec.js` — we only fill what each test actually reads
 * and rely on overrides for the rest.
 */
function makeCtx(overrides = {}) {
  const w = {
    config: {
      tooltip: {
        followCursor: false,
        arrow: true,
        shared: false,
        intersect: true,
      },
      xaxis: { offsetY: 0, tooltip: { offsetY: 0 } },
      yaxis: [{ opposite: false, tooltip: { offsetX: 0 } }],
      chart: { accessibility: { enabled: false } },
    },
    globals: {
      isBarHorizontal: false,
      translateYAxisX: [80],
      tooltip: null, // set later if needed
      collapsedSeriesIndices: [],
    },
    layout: {
      gridWidth: 500,
      gridHeight: 300,
      translateX: 50,
      translateY: 20,
    },
    axisFlags: { isXNumeric: false },
    dom: {
      baseEl: document.createElement('div'),
      elWrap: document.createElement('div'),
    },
    ...overrides.w,
  }

  // Make elWrap measurable.
  w.dom.elWrap.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
  })

  const elGrid = document.createElement('div')
  elGrid.getBoundingClientRect = () => ({
    left: 50, // elWrap.left + translateX
    top: 20, // elWrap.top + translateY
    right: 550,
    bottom: 320,
    width: 500,
    height: 300,
  })

  const ttCtx = {
    w,
    ctx: { w },
    tooltipRect: { ttWidth: 100, ttHeight: 50 },
    fixedTooltip: false,
    xaxisTooltip: null,
    xaxisTooltipText: null,
    xcrosshairsWidth: 10,
    xaxisOffY: 0,
    yaxisTTEls: null,
    ycrosshairsHidden: null,
    getElTooltip: vi.fn(() => {
      const el = document.createElement('div')
      el.getBoundingClientRect = () => ({ width: 100, height: 50 })
      return el
    }),
    getElGrid: vi.fn(() => elGrid),
    ...overrides.ttCtx,
  }
  return { w, ttCtx, elGrid }
}

// ---------------------------------------------------------------------------
// Position.applyTooltipPosition — first-paint anti-flicker
// ---------------------------------------------------------------------------

describe('Position.applyTooltipPosition', () => {
  it('sets style.left/top on the tooltip element', () => {
    const { ttCtx } = makeCtx()
    const el = document.createElement('div')
    const pos = new TooltipPosition(ttCtx)

    pos.applyTooltipPosition(el, { x: 123, y: 45 })

    expect(el.style.left).toBe('123px')
    expect(el.style.top).toBe('45px')
  })

  it('writes data-placement when supplied', () => {
    const { ttCtx } = makeCtx()
    const el = document.createElement('div')
    const pos = new TooltipPosition(ttCtx)

    pos.applyTooltipPosition(el, { x: 0, y: 0, placement: 'top' })

    expect(el.dataset.placement).toBe('top')
  })

  it('writes --apx-tt-arrow-y and --apx-tt-arrow-x CSS vars when supplied', () => {
    const { ttCtx } = makeCtx()
    const el = document.createElement('div')
    const pos = new TooltipPosition(ttCtx)

    pos.applyTooltipPosition(el, { x: 0, y: 0, arrowY: 30, arrowX: 50 })

    expect(el.style.getPropertyValue('--apx-tt-arrow-y')).toBe('30px')
    expect(el.style.getPropertyValue('--apx-tt-arrow-x')).toBe('50px')
  })

  it('first paint: blocks transition inline so left/top do not animate from prior coords', () => {
    const { ttCtx } = makeCtx()
    const el = document.createElement('div')
    const pos = new TooltipPosition(ttCtx)

    expect(el.dataset.positioned).toBeUndefined()
    pos.applyTooltipPosition(el, { x: 50, y: 50 })

    // Synchronous: inline `transition-property: none` is applied to block
    // the CSS `left/top` transition during first paint. Cleared later via
    // requestAnimationFrame (we don't drive RAF in tests, so the inline
    // value remains visible — that's the contract for jsdom).
    expect(el.style.transitionProperty).toBe('none')
    // And `data-positioned="true"` is set after the position is committed.
    expect(el.dataset.positioned).toBe('true')
  })

  it('second paint (already positioned): does NOT touch transition-property', () => {
    const { ttCtx } = makeCtx()
    const el = document.createElement('div')
    el.dataset.positioned = 'true'
    const pos = new TooltipPosition(ttCtx)

    pos.applyTooltipPosition(el, { x: 50, y: 50 })

    expect(el.style.transitionProperty).toBe('')
    expect(el.dataset.positioned).toBe('true')
  })

  it('arrowY/arrowX are not written when not provided (no junk CSS vars)', () => {
    const { ttCtx } = makeCtx()
    const el = document.createElement('div')
    const pos = new TooltipPosition(ttCtx)

    pos.applyTooltipPosition(el, { x: 0, y: 0 })

    expect(el.style.getPropertyValue('--apx-tt-arrow-y')).toBe('')
    expect(el.style.getPropertyValue('--apx-tt-arrow-x')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// Position.computeTooltipPosition — placement + arrow vertical anchor
// ---------------------------------------------------------------------------

describe('Position.computeTooltipPosition (arrow mode)', () => {
  it('returns placement="right" when cx is on the left half of the grid', () => {
    const { ttCtx } = makeCtx()
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 100, 5)
    expect(r.placement).toBe('right')
  })

  it('returns placement="left" when cx is on the right half of the grid', () => {
    const { ttCtx } = makeCtx()
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(300, 100, 5)
    expect(r.placement).toBe('left')
  })

  it('arrow mode anchors the tooltip vertically on the data point (elWrap coords)', () => {
    const { ttCtx, w } = makeCtx()
    w.config.tooltip.arrow = true
    const pos = new TooltipPosition(ttCtx)

    // cy=100 (grid-local) → elWrap-local 100 + translateY(20) = 120
    // y = pointY - ttH/2 + pointSize/2 = 120 - 25 + 0.5 = 95.5
    const r = pos.computeTooltipPosition(50, 100, 1)
    expect(r.y).toBe(120 - 50 / 2 + 1 / 2)
  })

  it('returns arrowY clamped between 10 and ttH-10', () => {
    const { ttCtx } = makeCtx()
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 100, 5)
    expect(r.arrowY).toBeGreaterThanOrEqual(10)
    expect(r.arrowY).toBeLessThanOrEqual(50 - 10)
  })

  it('clamps y to gridTop when point is above the grid', () => {
    const { ttCtx, w } = makeCtx()
    w.config.tooltip.arrow = true
    const pos = new TooltipPosition(ttCtx)

    // cy=-100 → pointY=-80; y=-80 - 25 = -105 → clamp to translateY=20
    const r = pos.computeTooltipPosition(50, -100, 1)
    expect(r.y).toBe(20)
  })

  it('clamps y to gridBottom - ttH when point is below the grid', () => {
    const { ttCtx, w } = makeCtx()
    w.config.tooltip.arrow = true
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 500, 1)
    // gridBottom = translateY + gridHeight = 20 + 300 = 320; max y = 320 - 50 = 270
    expect(r.y).toBe(270)
  })

  it('returns null when cx is NaN', () => {
    const { ttCtx } = makeCtx()
    const pos = new TooltipPosition(ttCtx)

    expect(pos.computeTooltipPosition(NaN, 50, 5)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Position._datapointCenterXFromBars — rect-derived center for numeric x
// ---------------------------------------------------------------------------

describe('Position._datapointCenterXFromBars', () => {
  it('returns null when no bars at index j', () => {
    const { ttCtx } = makeCtx()
    const pos = new TooltipPosition(ttCtx)
    const r = pos._datapointCenterXFromBars(0, { left: 0 })
    expect(r).toBeNull()
  })

  it('returns the rect-derived horizontal center for a single bar', () => {
    const { ttCtx, w } = makeCtx()
    const bar = document.createElement('div')
    bar.getBoundingClientRect = () => ({
      left: 100,
      right: 140,
      top: 0,
      bottom: 100,
      width: 40,
      height: 100,
    })
    // querySelectorAll is patched to short-circuit the j=N attribute query —
    // the helper only iterates whatever the selector returns.
    w.dom.baseEl.querySelectorAll = vi.fn(() => [bar])

    const pos = new TooltipPosition(ttCtx)
    // gridRect.left = 50 (elGrid screen-left)
    const r = pos._datapointCenterXFromBars(2, { left: 50 })

    // union: left=100, right=140 → center=120 → grid-local = 120 - 50 = 70
    expect(r).toBe(70)
  })

  it('returns the union center across multiple bars at the same index (grouped column)', () => {
    const { ttCtx, w } = makeCtx()
    const a = document.createElement('div')
    a.getBoundingClientRect = () => ({
      left: 100,
      right: 130,
      top: 0,
      bottom: 50,
      width: 30,
      height: 50,
    })
    const b = document.createElement('div')
    b.getBoundingClientRect = () => ({
      left: 135,
      right: 165,
      top: 0,
      bottom: 50,
      width: 30,
      height: 50,
    })
    w.dom.baseEl.querySelectorAll = vi.fn(() => [a, b])

    const pos = new TooltipPosition(ttCtx)
    const r = pos._datapointCenterXFromBars(0, { left: 50 })

    // union: left=100, right=165 → center=132.5 → grid-local = 132.5 - 50 = 82.5
    expect(r).toBe(82.5)
  })

  it('skips bars whose parent series is collapsed', () => {
    const { ttCtx, w } = makeCtx()
    const collapsedParent = document.createElement('div')
    collapsedParent.classList.add('apexcharts-series-collapsed')
    const collapsedBar = document.createElement('div')
    collapsedBar.getBoundingClientRect = () => ({
      left: 0,
      right: 1000, // would skew the union catastrophically
      top: 0,
      bottom: 50,
      width: 1000,
      height: 50,
    })
    collapsedParent.appendChild(collapsedBar)

    const visibleParent = document.createElement('div')
    const visibleBar = document.createElement('div')
    visibleBar.getBoundingClientRect = () => ({
      left: 100,
      right: 140,
      top: 0,
      bottom: 50,
      width: 40,
      height: 50,
    })
    visibleParent.appendChild(visibleBar)

    w.dom.baseEl.querySelectorAll = vi.fn(() => [collapsedBar, visibleBar])

    const pos = new TooltipPosition(ttCtx)
    const r = pos._datapointCenterXFromBars(0, { left: 50 })

    // Should ignore the collapsed bar entirely → center 120 → grid-local 70
    expect(r).toBe(70)
  })

  it('returns null when only zero-sized bars are found', () => {
    const { ttCtx, w } = makeCtx()
    const zeroBar = document.createElement('div')
    zeroBar.getBoundingClientRect = () => ({
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0,
    })
    w.dom.baseEl.querySelectorAll = vi.fn(() => [zeroBar])

    const pos = new TooltipPosition(ttCtx)
    expect(pos._datapointCenterXFromBars(0, { left: 0 })).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Position.placeHorizontalSharedTooltip — top/bottom placement
// ---------------------------------------------------------------------------

describe('Position.placeHorizontalSharedTooltip', () => {
  function setupBars(rects) {
    const bars = rects.map((r) => {
      const el = document.createElement('div')
      el.getBoundingClientRect = () => ({
        left: r.left,
        top: r.top,
        right: r.left + r.width,
        bottom: r.top + r.height,
        width: r.width,
        height: r.height,
      })
      return el
    })
    return bars
  }

  it('returns false when no tooltip element exists', () => {
    const { ttCtx } = makeCtx()
    ttCtx.getElTooltip = vi.fn(() => null)
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeHorizontalSharedTooltip(0)).toBe(false)
  })

  it('returns false when no bars are found', () => {
    const { ttCtx, w } = makeCtx()
    w.dom.baseEl.querySelectorAll = vi.fn(() => [])
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeHorizontalSharedTooltip(0)).toBe(false)
  })

  it('places tooltip ABOVE bar row when there is room', () => {
    const { ttCtx, w } = makeCtx()
    // gridRect is at screen (50, 20). Bar row at screen top=120,bottom=140.
    // grid-local bar.top = 100, bottom = 120. Room above (100 > ttHeight=50+arrow).
    const bars = setupBars([{ left: 70, top: 120, width: 100, height: 20 }])
    w.dom.baseEl.querySelectorAll = vi.fn(() => bars)

    const tooltipEl = document.createElement('div')
    ttCtx.getElTooltip = vi.fn(() => tooltipEl)

    const pos = new TooltipPosition(ttCtx)
    expect(pos.placeHorizontalSharedTooltip(0)).toBe(true)
    expect(tooltipEl.dataset.placement).toBe('top')
  })

  it('FLIPS to below when bar is too close to grid top', () => {
    const { ttCtx, w } = makeCtx()
    // gridRect is at screen (50, 20). Bar row at screen top=22,bottom=42.
    // No room above (only 2px), should flip below.
    const bars = setupBars([{ left: 70, top: 22, width: 100, height: 20 }])
    w.dom.baseEl.querySelectorAll = vi.fn(() => bars)

    const tooltipEl = document.createElement('div')
    ttCtx.getElTooltip = vi.fn(() => tooltipEl)

    const pos = new TooltipPosition(ttCtx)
    pos.placeHorizontalSharedTooltip(0)
    expect(tooltipEl.dataset.placement).toBe('bottom')
  })

  it('centers tooltip horizontally on the bar row', () => {
    const { ttCtx, w } = makeCtx()
    // Bar at screen left=110,right=190 → center 150 in screen
    // Converted to elWrap-local: center 150 - elWrap.left(0) = 150
    // ttW=100 → finalX = 150 - 50 = 100
    const bars = setupBars([{ left: 110, top: 150, width: 80, height: 20 }])
    w.dom.baseEl.querySelectorAll = vi.fn(() => bars)

    const tooltipEl = document.createElement('div')
    ttCtx.getElTooltip = vi.fn(() => tooltipEl)

    const pos = new TooltipPosition(ttCtx)
    pos.placeHorizontalSharedTooltip(0)
    expect(parseFloat(tooltipEl.style.left)).toBe(100)
  })

  it('skips bars in collapsed series when computing the union', () => {
    const { ttCtx, w } = makeCtx()
    const collapsedParent = document.createElement('div')
    collapsedParent.classList.add('apexcharts-series-collapsed')
    const skippedBar = document.createElement('div')
    skippedBar.getBoundingClientRect = () => ({
      left: 0,
      right: 1000,
      top: 200,
      bottom: 220,
      width: 1000,
      height: 20,
    })
    collapsedParent.appendChild(skippedBar)

    const visibleBar = document.createElement('div')
    visibleBar.getBoundingClientRect = () => ({
      left: 110,
      top: 150,
      right: 190,
      bottom: 170,
      width: 80,
      height: 20,
    })

    w.dom.baseEl.querySelectorAll = vi.fn(() => [skippedBar, visibleBar])

    const tooltipEl = document.createElement('div')
    ttCtx.getElTooltip = vi.fn(() => tooltipEl)

    const pos = new TooltipPosition(ttCtx)
    pos.placeHorizontalSharedTooltip(0)
    // Should center on the visible bar only (skip the collapsed wide one).
    expect(parseFloat(tooltipEl.style.left)).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Marker.renderMarkerSVG — inline-SVG marker renderer
// ---------------------------------------------------------------------------

describe('renderMarkerSVG', () => {
  it('returns an SVG element string for `circle` shape (default)', () => {
    const out = renderMarkerSVG('circle')
    expect(out).toMatch(/^<svg /)
    expect(out).toContain('<circle')
    expect(out).toContain('currentColor')
  })

  it('returns rect markup for `square` and `rect`', () => {
    expect(renderMarkerSVG('square')).toContain('<rect')
    expect(renderMarkerSVG('rect')).toContain('<rect')
  })

  it('returns path markup for `diamond`, `triangle`, `star`, `sparkle`', () => {
    for (const shape of ['diamond', 'triangle', 'star', 'sparkle']) {
      expect(renderMarkerSVG(shape)).toContain('<path')
    }
  })

  it('returns stroked path markup for `cross` and `plus`', () => {
    expect(renderMarkerSVG('cross')).toContain('stroke="currentColor"')
    expect(renderMarkerSVG('plus')).toContain('stroke="currentColor"')
  })

  it('falls back to circle for an unknown shape', () => {
    const out = renderMarkerSVG('totally-not-a-shape')
    expect(out).toContain('<circle')
  })

  it('marks the SVG as aria-hidden so it does not pollute screen readers', () => {
    expect(renderMarkerSVG('circle')).toContain('aria-hidden="true"')
  })
})

// ---------------------------------------------------------------------------
// Integration: arrow rendered (or skipped) per tooltip config
// ---------------------------------------------------------------------------

describe('Tooltip arrow integration', () => {
  function lineChart(extras = {}) {
    return createChartWithOptions({
      chart: { type: 'line', ...extras.chart },
      series: extras.series || [{ name: 'A', data: [1, 2, 3] }],
      xaxis: extras.xaxis || { categories: ['Jan', 'Feb', 'Mar'] },
      tooltip: extras.tooltip || {},
    })
  }

  it('renders the arrow element by default on a single-series axis chart', () => {
    const chart = lineChart()
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).not.toBeNull()
  })

  it('skips the arrow when tooltip.arrow=false', () => {
    const chart = lineChart({ tooltip: { arrow: false } })
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).toBeNull()
  })

  it('skips the arrow when followCursor is enabled', () => {
    const chart = lineChart({ tooltip: { followCursor: true } })
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).toBeNull()
  })

  it('skips the arrow when fixed.enabled is true', () => {
    const chart = lineChart({
      tooltip: { fixed: { enabled: true, position: 'topRight' } },
    })
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).toBeNull()
  })

  it('skips the arrow on shared multi-series VERTICAL (non-horizontal) charts', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [4, 5, 6] },
      ],
      tooltip: { shared: true },
    })
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).toBeNull()
  })

  it('still renders the arrow on shared multi-series HORIZONTAL bar charts', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true } },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [4, 5, 6] },
      ],
      // shared+intersect is mutually exclusive in Config validation;
      // explicitly disable intersect to opt into shared mode.
      tooltip: { shared: true, intersect: false },
    })
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).not.toBeNull()
  })

  it('skips the arrow on non-axis charts (pie)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie' },
      labels: ['A', 'B', 'C'],
      series: [1, 2, 3],
    })
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).toBeNull()
  })

  it('skips the arrow when fillSeriesColor is true', () => {
    const chart = lineChart({ tooltip: { fillSeriesColor: true } })
    const arrow = chart.el.querySelector('.apexcharts-tooltip-arrow')
    expect(arrow).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Integration: tooltip options surface (arrow, style.background)
// ---------------------------------------------------------------------------

describe('Tooltip options surface', () => {
  it('exposes tooltip.arrow=true as the resolved default', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
    })
    expect(chart.w.config.tooltip.arrow).toBe(true)
  })

  it('honors a user-supplied tooltip.style.background override', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
      tooltip: { style: { background: '#abcdef' } },
    })
    expect(chart.w.config.tooltip.style.background).toBe('#abcdef')
  })
})

// ---------------------------------------------------------------------------
// KeyboardNavigation._onFocus — bail out for mouse-induced focus
// ---------------------------------------------------------------------------

describe('KeyboardNavigation._onFocus', () => {
  function chartWithKeyboardNav() {
    return createChartWithOptions({
      chart: {
        type: 'line',
        accessibility: { enabled: true, keyboard: { enabled: true } },
      },
      series: [{ data: [1, 2, 3] }],
    })
  }

  it('does NOT activate when focus follows a recent pointerdown (mouse click)', () => {
    const chart = chartWithKeyboardNav()
    const kn = chart.ctx?.keyboardNavigation
    if (!kn) return // accessibility module not loaded in this build
    // Simulate a click: pointerdown then focus, fired in the same ms-frame
    kn._onPointerDown()
    kn.active = false
    kn._onFocus()
    expect(kn.active).toBe(false)
  })

  it('DOES activate when focus arrives with no recent pointer activity (keyboard tab)', () => {
    const chart = chartWithKeyboardNav()
    const kn = chart.ctx?.keyboardNavigation
    if (!kn) return
    // Push the last pointer-down well into the past so the 100 ms window
    // has elapsed and the focus reads as keyboard-driven.
    kn._lastPointerDownAt = 0
    kn.active = false
    kn._onFocus()
    expect(kn.active).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Integration: tooltip body has CSS variables / data-positioned flow
// ---------------------------------------------------------------------------

describe('Tooltip element DOM contract', () => {
  function lineChart() {
    return createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
    })
  }

  it('starts WITHOUT data-positioned attribute on a freshly rendered chart', () => {
    const chart = lineChart()
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip.dataset.positioned).toBeUndefined()
  })

  it('tooltip-fill-series class applied when fillSeriesColor is enabled', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
      tooltip: { fillSeriesColor: true },
    })
    const tooltip = chart.el.querySelector('.apexcharts-tooltip')
    expect(tooltip.classList.contains('apexcharts-tooltip-fill-series')).toBe(
      true,
    )
  })

  it('renders inline SVG markers in tooltip series groups (not unicode glyphs)', () => {
    const chart = lineChart()
    const marker = chart.el.querySelector('.apexcharts-tooltip-marker')
    expect(marker).not.toBeNull()
    // The new Marker.renderMarkerSVG output is inserted as innerHTML.
    expect(marker.innerHTML).toContain('<svg')
  })
})
