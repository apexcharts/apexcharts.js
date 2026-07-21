/**
 * Selection / brush geometry consistency (regression guard for the recurring
 * "the brush and the bars underneath don't line up" bug).
 *
 * The whole point: there is ONE px<->data mapping (src/modules/AxisMapping.js),
 * bars are laid out with it, and every selection gesture reads the range back
 * with it. So for ANY gesture, the range reported by chart.events.selection must
 * equal the range implied by the final selection rect's pixel edges under that
 * SAME mapping (bar center at (x - minX) / xRatio px from the plot origin, no
 * barPadForNumericAxis in the mapping). If a future edit reintroduces a per-path
 * offset (barPad, niceMin, a grid-box reference), reported and rect-implied
 * diverge and these tests fail.
 *
 * Covered gestures: new drag, dragging the existing rect, resize handle, and a
 * preselected chart.selection.xaxis. Plus the crossfilter edge-bin case: a full
 * plot-width brush must include EVERY bin (both edges), and edge slivers must be
 * able to isolate the first / last bin (the "last column can never be fully
 * selected" complaint).
 *
 * Charts are built inline (like the crossfilter grouped-members test) so the
 * fixture is self-contained; we load an existing sample only to get dist +
 * console-error tracking.
 */

import { test, expect } from '../fixtures/base.js'

const DAY = 86400000

// Build a datetime bar histogram with chart.selection + events.selection capture
// in a fresh div. Returns nothing; the instance is window.geo.
async function buildGeoChart(page) {
  await page.evaluate((DAY) => {
    document.querySelectorAll('#geo-host').forEach((n) => n.remove())
    const host = document.createElement('div')
    host.id = 'geo-host'
    document.body.appendChild(host)
    const START = Date.UTC(2023, 0, 2)
    const data = []
    for (let i = 0; i < 18; i++) data.push({ x: START + i * 7 * DAY, y: (i % 7) + 2 })
    window.__geoSel = null
    window.geo = new window.ApexCharts(host, {
      series: [{ name: 'h', data }],
      chart: {
        id: 'geo',
        type: 'bar',
        height: 300,
        width: 720,
        animations: { enabled: false },
        zoom: { enabled: false },
        toolbar: {
          autoSelected: 'selection',
          tools: { selection: true, zoom: false, pan: false },
        },
        selection: { enabled: true, type: 'x' },
        events: {
          selection: (_c, opts) => {
            window.__geoSel = { min: opts.xaxis.min, max: opts.xaxis.max }
          },
        },
      },
      plotOptions: { bar: { columnWidth: '90%' } },
      dataLabels: { enabled: false },
      xaxis: { type: 'datetime' },
    })
    return window.geo.render()
  }, DAY)
  await page.waitForFunction(() => window.geo && window.geo.w.globals.animationEnded === true, {
    timeout: 10_000,
  })
}

// Inject the shared-mapping helpers used by the assertions.
async function injectMappingHelpers(page) {
  await page.evaluate(() => {
    // Range implied by the CURRENT selection rect under the bar-placement
    // mapping: data = minX + (screenX - (svgLeft + translateX)) * xRatio.
    window.__geoRectImplied = () => {
      const w = window.geo.w
      const svg = window.geo.el.querySelector('.apexcharts-svg').getBoundingClientRect()
      const plotOriginX = svg.left + w.layout.translateX
      const xRatio = (w.globals.maxX - w.globals.minX) / w.layout.gridWidth
      const rect = window.geo.el
        .querySelector('.apexcharts-selection-rect')
        .getBoundingClientRect()
      return {
        min: w.globals.minX + (rect.left - plotOriginX) * xRatio,
        max: w.globals.minX + (rect.right - plotOriginX) * xRatio,
        xRatio,
        rectLeft: rect.left,
        rectRight: rect.right,
      }
    }
    // Bars whose center is inside the rect must have data inside the reported
    // range and vice-versa. Bars whose center sits within 1px of a rect edge are
    // boundary cases (rounding) and are excluded.
    window.__geoBarMismatch = (rep) => {
      const w = window.geo.w
      const rect = window.geo.el
        .querySelector('.apexcharts-selection-rect')
        .getBoundingClientRect()
      const bars = Array.from(window.geo.el.querySelectorAll('.apexcharts-bar-area'))
      const seriesX = w.globals.seriesX[0]
      let mism = 0
      bars.forEach((b, i) => {
        const bb = b.getBoundingClientRect()
        const cx = bb.left + bb.width / 2
        if (cx > rect.left - 1 && cx < rect.left + 1) return
        if (cx > rect.right - 1 && cx < rect.right + 1) return
        const inRect = cx >= rect.left && cx <= rect.right
        const inData = seriesX[i] >= rep.min && seriesX[i] <= rep.max
        if (inRect !== inData) mism++
      })
      return mism
    }
  })
}

// Assert reported == rect-implied to < 1px worth of data, and bars are consistent.
async function assertConsistent(page, label) {
  const r = await page.evaluate(() => {
    if (!window.__geoSel) return null
    const ri = window.__geoRectImplied()
    return {
      rep: window.__geoSel,
      ri,
      diffMinPx: (window.__geoSel.min - ri.min) / ri.xRatio,
      diffMaxPx: (window.__geoSel.max - ri.max) / ri.xRatio,
      barMismatch: window.__geoBarMismatch(window.__geoSel),
      rectWidth: ri.rectRight - ri.rectLeft,
    }
  })
  expect(r, `${label}: events.selection never fired`).not.toBeNull()
  expect(r.rectWidth, `${label}: selection rect has no width`).toBeGreaterThan(10)
  // reported x-range equals the rect-implied range under the shared mapping
  expect(Math.abs(r.diffMinPx), `${label}: reported.min vs rect min`).toBeLessThan(1)
  expect(Math.abs(r.diffMaxPx), `${label}: reported.max vs rect max`).toBeLessThan(1)
  // bars under the rect match the reported range
  expect(r.barMismatch, `${label}: bars inconsistent with reported range`).toBe(0)
}

test.describe('Selection geometry: reported range matches the rect under one mapping', () => {
  test.beforeEach(async ({ loadChart }) => {
    // Any sample that loads dist/apexcharts.js works; this one is selection-ish.
    await loadChart('misc', 'crossfilter-range-brush')
  })

  test('new drag: reported range == rect-implied range == bars', async ({ page }) => {
    await buildGeoChart(page)
    await injectMappingHelpers(page)
    await page.evaluate(() => {
      const svg = window.geo.el.querySelector('.apexcharts-svg')
      const g = window.geo.el.querySelector('.apexcharts-grid').getBoundingClientRect()
      const fire = (t, x) =>
        svg.dispatchEvent(
          new MouseEvent(t, {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: g.top + g.height / 2, button: 0, buttons: 1, which: 1,
          }),
        )
      fire('mousedown', g.left + g.width * 0.28)
      fire('mousemove', g.left + g.width * 0.5)
      fire('mousemove', g.left + g.width * 0.66)
      fire('mouseup', g.left + g.width * 0.66)
    })
    await page.waitForTimeout(200)
    await assertConsistent(page, 'new-drag')
  })

  test('dragging the existing rect: reported range follows the moved rect', async ({ page }) => {
    await buildGeoChart(page)
    await injectMappingHelpers(page)
    // draw a selection first
    await page.evaluate(() => {
      const svg = window.geo.el.querySelector('.apexcharts-svg')
      const g = window.geo.el.querySelector('.apexcharts-grid').getBoundingClientRect()
      const fire = (t, x) =>
        svg.dispatchEvent(new MouseEvent(t, {
          bubbles: true, cancelable: true, view: window,
          clientX: x, clientY: g.top + g.height / 2, button: 0, buttons: 1, which: 1,
        }))
      fire('mousedown', g.left + g.width * 0.3)
      fire('mousemove', g.left + g.width * 0.5)
      fire('mouseup', g.left + g.width * 0.5)
    })
    await page.waitForTimeout(150)
    // drag the rect body to the right (svg.js draggable: mousedown on rect,
    // document mousemove/up)
    await page.evaluate(() => {
      window.__geoSel = null
      const rectNode = window.geo.el.querySelector('.apexcharts-selection-rect')
      const rb = rectNode.getBoundingClientRect()
      const cy = rb.top + rb.height / 2
      const sx = rb.left + rb.width / 2
      rectNode.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true, cancelable: true, view: window,
        clientX: sx, clientY: cy, button: 0, buttons: 1, which: 1,
      }))
      for (let i = 1; i <= 5; i++)
        document.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, cancelable: true, view: window,
          clientX: sx + i * 14, clientY: cy, button: 0, buttons: 1, which: 1,
        }))
      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true, cancelable: true, view: window, clientX: sx + 70, clientY: cy,
      }))
    })
    await page.waitForTimeout(200)
    await assertConsistent(page, 'drag-rect')
  })

  test('resize handle: reported range follows the resized rect', async ({ page }) => {
    await buildGeoChart(page)
    await injectMappingHelpers(page)
    await page.evaluate(() => {
      const svg = window.geo.el.querySelector('.apexcharts-svg')
      const g = window.geo.el.querySelector('.apexcharts-grid').getBoundingClientRect()
      const fire = (t, x) =>
        svg.dispatchEvent(new MouseEvent(t, {
          bubbles: true, cancelable: true, view: window,
          clientX: x, clientY: g.top + g.height / 2, button: 0, buttons: 1, which: 1,
        }))
      fire('mousedown', g.left + g.width * 0.35)
      fire('mousemove', g.left + g.width * 0.6)
      fire('mouseup', g.left + g.width * 0.6)
    })
    await page.waitForTimeout(150)
    // grab the right ('r') handle (4th of t,b,l,r,...) and drag it outward
    await page.evaluate(() => {
      window.__geoSel = null
      const groups = window.geo.el.querySelectorAll('.svg_select_points > g')
      const rHandle = groups[3]
      const hb = rHandle.getBoundingClientRect()
      const cx = hb.left + hb.width / 2
      const cy = hb.top + hb.height / 2
      rHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true, cancelable: true, view: window,
        clientX: cx, clientY: cy, button: 0, buttons: 1, which: 1,
      }))
      for (let i = 1; i <= 5; i++)
        document.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, cancelable: true, view: window,
          clientX: cx + i * 14, clientY: cy, button: 0, buttons: 1, which: 1,
        }))
      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true, cancelable: true, view: window, clientX: cx + 70, clientY: cy,
      }))
    })
    await page.waitForTimeout(200)
    await assertConsistent(page, 'resize')
  })

  test('preselected chart.selection.xaxis: drawn rect matches the configured range', async ({
    page,
  }) => {
    await injectMappingHelpers(page) // (re-injected after build below)
    const r = await page.evaluate((DAY) => {
      document.querySelectorAll('#geo-host').forEach((n) => n.remove())
      const host = document.createElement('div')
      host.id = 'geo-host'
      document.body.appendChild(host)
      const START = Date.UTC(2023, 0, 2)
      const data = []
      for (let i = 0; i < 18; i++) data.push({ x: START + i * 7 * DAY, y: (i % 7) + 2 })
      window.__geoSel = null
      window.geo = new window.ApexCharts(host, {
        series: [{ name: 'h', data }],
        chart: {
          id: 'geo',
          type: 'bar',
          height: 300,
          width: 720,
          animations: { enabled: false },
          zoom: { enabled: false },
          toolbar: {
            autoSelected: 'selection',
            tools: { selection: true, zoom: false, pan: false },
          },
          selection: {
            enabled: true,
            type: 'x',
            xaxis: { min: data[4].x, max: data[13].x },
          },
          events: {
            selection: (_c, opts) => {
              window.__geoSel = { min: opts.xaxis.min, max: opts.xaxis.max }
            },
          },
        },
        plotOptions: { bar: { columnWidth: '90%' } },
        dataLabels: { enabled: false },
        xaxis: { type: 'datetime' },
      })
      return window.geo.render().then(() => ({ cfgMin: data[4].x, cfgMax: data[13].x }))
    }, DAY)
    await page.waitForFunction(() => window.geo && window.geo.w.globals.animationEnded === true)
    await injectMappingHelpers(page)

    const geo = await page.evaluate(
      ({ cfgMin, cfgMax }) => {
        const ri = window.__geoRectImplied()
        return {
          fired: !!window.__geoSel,
          repMin: window.__geoSel && window.__geoSel.min,
          repMax: window.__geoSel && window.__geoSel.max,
          cfgMin,
          cfgMax,
          rectImpliedMinDiffPx: (ri.min - cfgMin) / ri.xRatio,
          rectImpliedMaxDiffPx: (ri.max - cfgMax) / ri.xRatio,
          rectWidth: ri.rectRight - ri.rectLeft,
        }
      },
      r,
    )
    // events.selection fires with the configured range
    expect(geo.fired).toBe(true)
    expect(geo.repMin).toBe(geo.cfgMin)
    expect(geo.repMax).toBe(geo.cfgMax)
    // and the DRAWN rect sits exactly at the configured range under the mapping
    expect(geo.rectWidth).toBeGreaterThan(10)
    expect(Math.abs(geo.rectImpliedMinDiffPx)).toBeLessThan(1)
    expect(Math.abs(geo.rectImpliedMaxDiffPx)).toBeLessThan(1)
  })
})

// ─── crossfilter edge bins ──────────────────────────────────────────────────

// Build a range-binned crossfilter histogram (datetime, weekly bins) in a fresh
// div. window.cfhist = the histogram instance; coordinator id = 'geocf'.
async function buildCfHistogram(page) {
  await page.evaluate((DAY) => {
    document.querySelectorAll('#cf-host').forEach((n) => n.remove())
    const host = document.createElement('div')
    host.id = 'cf-host'
    document.body.appendChild(host)
    const START = Date.UTC(2023, 0, 2)
    const records = []
    for (let i = 0; i < 364; i++) records.push({ t: START + i * DAY })
    window.ApexCharts.crossfilter({ id: 'geocf', records })
    window.cfhist = new window.ApexCharts(host, {
      series: [],
      chart: {
        id: 'geohist',
        type: 'bar',
        height: 300,
        width: 720,
        animations: { enabled: false },
        zoom: { enabled: false },
        toolbar: {
          autoSelected: 'selection',
          tools: { selection: true, zoom: false, pan: false },
        },
        selection: { enabled: true, type: 'x' },
        link: {
          id: 'geocf',
          dimension: (r) => r.t,
          bins: { width: 7 * DAY },
          dimOpacity: 0.15,
        },
      },
      plotOptions: { bar: { columnWidth: '95%' } },
      dataLabels: { enabled: false },
      xaxis: { type: 'datetime' },
    })
    return window.cfhist.render()
  }, DAY)
  await page.waitForFunction(
    () => window.cfhist && window.cfhist.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
}

// Brush between two fractions of the PLOT width (0 = left plot edge / minX,
// 1 = right plot edge / maxX). Fractions are relative to translateX..+gridWidth,
// NOT the grid element's bounding box (which is inset by barPad and would skew
// edge coordinates).
function brushCf(page, fromFrac, toFrac) {
  return page.evaluate(
    ({ fromFrac, toFrac }) => {
      const w = window.cfhist.w
      const svg = window.cfhist.el.querySelector('.apexcharts-svg')
      const svgRect = svg.getBoundingClientRect()
      const originX = svgRect.left + w.layout.translateX
      const midY =
        svg.getBoundingClientRect().top + w.layout.translateY + w.layout.gridHeight / 2
      const fire = (t, x) =>
        svg.dispatchEvent(new MouseEvent(t, {
          bubbles: true, cancelable: true, view: window,
          clientX: x, clientY: midY, button: 0, buttons: 1, which: 1,
        }))
      const x0 = originX + w.layout.gridWidth * fromFrac
      const x1 = originX + w.layout.gridWidth * toFrac
      fire('mousedown', x0)
      fire('mousemove', (x0 + x1) / 2)
      fire('mousemove', x1)
      fire('mouseup', x1)
    },
    { fromFrac, toFrac },
  )
}

test.describe('Crossfilter range histogram: every bin is reachable', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'crossfilter-range-brush')
  })

  test('a full-width brush includes every bin (both edges), dims nothing', async ({
    page,
  }) => {
    await buildCfHistogram(page)
    // sanity: weekly bins really were produced (config survived the merge)
    const nBins = await page.evaluate(
      () => window.cfhist.w.config.series[0].data.length,
    )
    expect(nBins).toBeGreaterThanOrEqual(52) // ~52 weekly bins over a year

    await brushCf(page, -0.05, 1.05) // drag slightly beyond both grid edges
    await page.waitForTimeout(300)

    const r = await page.evaluate(() => {
      const cf = window.ApexCharts.getCrossfilter('geocf')
      return {
        total: cf.state().total,
        filteredCount: cf.state().filteredCount,
        totalBars: window.cfhist.el.querySelectorAll('.apexcharts-bar-area').length,
        dimmed: window.cfhist.el.querySelectorAll(
          '.apexcharts-bar-area.apexcharts-crossfilter-dimmed',
        ).length,
      }
    })
    expect(r.filteredCount).toBe(r.total) // no record excluded
    expect(r.dimmed).toBe(0) // no bin dimmed -> every bin fully inside the brush
  })

  test('a partial brush dims exactly the bins outside the reported range', async ({
    page,
  }) => {
    // Every bar's dimmed state must agree with whether its bin lies outside the
    // crossfilter's [min,max] filter, under the SAME edges the bars were binned
    // with. Guards that the pixel->data brush mapping and the bin-dim math stay
    // in sync (a mapping drift would dim the wrong columns).
    await buildCfHistogram(page)
    await brushCf(page, 0.3, 0.7)
    await page.waitForTimeout(300)

    const r = await page.evaluate(() => {
      const w = window.cfhist.w
      const cf = window.ApexCharts.getCrossfilter('geocf')
      const filter = cf.filterOf(w.globals.chartID) // [min,max]
      const dim = cf.dims.get(w.globals.chartID)
      const edges = dim.edges
      const bars = Array.from(window.cfhist.el.querySelectorAll('.apexcharts-bar-area'))
      let mismatch = 0
      let dimmedCount = 0
      bars.forEach((b, i) => {
        const isDimmed = b.classList.contains('apexcharts-crossfilter-dimmed')
        if (isDimmed) dimmedCount++
        // bin i spans [edges[i], edges[i+1]]; dimmed iff fully outside [min,max]
        const outside = edges[i + 1] <= filter[0] || edges[i] >= filter[1]
        if (isDimmed !== outside) mismatch++
      })
      return { filter, mismatch, dimmedCount, nBars: bars.length }
    })
    expect(r.filter).not.toBeNull()
    expect(r.mismatch).toBe(0) // every bar dimmed iff its bin is outside the range
    // a middle brush leaves the edge bins dimmed and a middle band lit
    expect(r.dimmedCount).toBeGreaterThan(0)
    expect(r.dimmedCount).toBeLessThan(r.nBars)
  })

  test('the first and last bins are both fully reachable by the brush', async ({
    page,
  }) => {
    // The core "first column lights up prematurely / last column can never be
    // fully selected" complaint: with the domain pinned to the outer bin edges,
    // brushing the right half must fully include the LAST bin and brushing the
    // left half must fully include the FIRST bin.
    await buildCfHistogram(page)

    await brushCf(page, 0.5, 1.05) // right half + past the right edge
    await page.waitForTimeout(300)
    const right = await page.evaluate(() => {
      const bars = Array.from(window.cfhist.el.querySelectorAll('.apexcharts-bar-area'))
      const dimmed = (b) => b.classList.contains('apexcharts-crossfilter-dimmed')
      return { lastDimmed: dimmed(bars[bars.length - 1]), firstDimmed: dimmed(bars[0]) }
    })
    expect(right.lastDimmed).toBe(false) // last column fully included
    expect(right.firstDimmed).toBe(true) // left half excluded

    await brushCf(page, -0.05, 0.5) // left half + past the left edge
    await page.waitForTimeout(300)
    const left = await page.evaluate(() => {
      const bars = Array.from(window.cfhist.el.querySelectorAll('.apexcharts-bar-area'))
      const dimmed = (b) => b.classList.contains('apexcharts-crossfilter-dimmed')
      return { firstDimmed: dimmed(bars[0]), lastDimmed: dimmed(bars[bars.length - 1]) }
    })
    expect(left.firstDimmed).toBe(false) // first column fully included
    expect(left.lastDimmed).toBe(true) // right half excluded
  })
})
