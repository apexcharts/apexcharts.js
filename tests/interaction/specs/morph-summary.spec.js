/**
 * boxPlot / violin <-> unit: a summary mark coming apart into its own sample.
 *
 * These are the second half of Tier B. `rowSeries()` (plan 21 P1) hands back
 * the observations behind each box; this pins that the morph engine can
 * actually capture those marks and hand each observation the part of the box it
 * came out of, and that the collapse is the inverse.
 *
 * The capture is the interesting part: unlike every other family, a summary
 * mark is not one path. A boxPlot draws two per category (the box and the
 * whisker line) and a violin draws one, so the branch unions whatever it finds
 * per (realIndex, j). Taking only the first would explode from the box while
 * ignoring its whiskers, which is invisible in jsdom and obvious on screen.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

const MAKE = `async (type, series, height) => {
  document.body.innerHTML = '<div id="probe" style="width:760px"></div>'
  const chart = new window.ApexCharts(document.querySelector('#probe'), {
    chart: {
      id: 'probe',
      type,
      height: height || 420,
      // The ENTRY stagger, not the morph. It delays each category in turn, so a
      // fixed settle leaves the later marks still growing and every DOM
      // measurement reads a partial box: mark 0 measured 140.9px tall while
      // mark 3 measured 42.2px of its eventual 146.8px. Nothing here is testing
      // the mount, so take it out rather than race it.
      animations: { animateGradually: { enabled: false } },
    },
    series,
  })
  await chart.render()
  // render() still resolves before the (un-staggered) entry animation ends, and
  // getBBox reads the LIVE path, so settle before measuring geometry.
  await new Promise((res) => setTimeout(res, 1100))
  return chart
}`

/** Five categories, 40 observations each, deterministic. */
const SAMPLES = `(() => {
  let seed = 11
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  return ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'].map((name, k) => ({
    x: name,
    points: Array.from({ length: 40 }, () => Math.round(30 + k * 8 + rand() * 25)),
  }))
})()`

test.describe('boxPlot -> unit', () => {
  test('captures every box, unioning its two paths', async ({ page, loadChart }) => {
    await loadChart('boxPlot', 'boxplot-from-raw-observations')

    const r = await page.evaluate(
      async ([mk, samples]) => {
        const make = eval(mk)
        const chart = await make('boxPlot', [{ name: 'Devices', data: eval(samples) }])

        const paths = document.querySelectorAll('#probe .apexcharts-boxPlot-area').length
        const morph = chart.morphTypeChange
        const captured = morph._captureFromDOM('boxPlot')

        // Per (realIndex, j) box heights, from the capture's own bbox helper.
        const boxes = captured.marks.map((m) => {
          const b = morph._pathBBox(m.d)
          return {
            j: m.j,
            h: +(b.maxY - b.minY).toFixed(1),
            cx: ((b.minX + b.maxX) / 2).toFixed(1),
          }
        })

        // The same extent measured straight off the DOM, unioning by hand.
        const domExtent = {}
        document
          .querySelectorAll('#probe .apexcharts-boxPlot-area')
          .forEach((p) => {
            const j = p.getAttribute('j')
            const b = p.getBBox()
            const e = (domExtent[j] = domExtent[j] || {
              minX: 1e9,
              maxX: -1e9,
              minY: 1e9,
              maxY: -1e9,
            })
            e.minX = Math.min(e.minX, b.x)
            e.maxX = Math.max(e.maxX, b.x + b.width)
            e.minY = Math.min(e.minY, b.y)
            e.maxY = Math.max(e.maxY, b.y + b.height)
          })
        const domKeys = Object.keys(domExtent).sort((a, b) => +a - +b)
        const domHeights = domKeys.map(
          (j) => +(domExtent[j].maxY - domExtent[j].minY).toFixed(1),
        )
        const domCentres = domKeys.map(
          (j) => +((domExtent[j].minX + domExtent[j].maxX) / 2).toFixed(1),
        )

        return {
          paths,
          marks: captured.marks.length,
          js: captured.marks.map((m) => m.j),
          capturedHeights: boxes.map((b) => b.h),
          capturedCentres: boxes.map((b) => +b.cx),
          domHeights,
          domCentres,
        }
      },
      [MAKE, SAMPLES],
    )

    // Two paths per box, five boxes, but only five MARKS after the union.
    expect(r.paths).toBe(10)
    expect(r.marks).toBe(5)
    expect(r.js).toEqual([0, 1, 2, 3, 4])
    // The union reproduces the FULL box+whisker extent, not just the box: the
    // whisker path reaches further vertically than the box in every category,
    // so taking only the first path would come up short here.
    expect(r.capturedHeights).toEqual(r.domHeights)
    expect(r.capturedCentres).toEqual(r.domCentres)
  })

  test('every observation leaves from its own box, as a piece of it', async ({
    page,
    loadChart,
  }) => {
    await loadChart('boxPlot', 'boxplot-from-raw-observations')

    const r = await page.evaluate(
      async ([mk, samples]) => {
        const make = eval(mk)
        const data = eval(samples)
        const chart = await make('boxPlot', [{ name: 'Devices', data }])

        // Each box's full page-space extent (box + whisker paths).
        const byJ = {}
        document.querySelectorAll('#probe .apexcharts-boxPlot-area').forEach((p) => {
          const j = +p.getAttribute('j')
          const b = p.getBoundingClientRect()
          const e = (byJ[j] = byJ[j] || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 })
          e.x0 = Math.min(e.x0, b.x)
          e.y0 = Math.min(e.y0, b.y)
          e.x1 = Math.max(e.x1, b.x + b.width)
          e.y1 = Math.max(e.y1, b.y + b.height)
        })
        const boxes = Object.keys(byJ)
          .sort((a, b) => +a - +b)
          .map((j) => byJ[j])

        const rows = chart.rowSeries()
        chart.updateOptions({
          chart: { type: 'unit' },
          series: rows,
          plotOptions: { unit: { layout: 'scatter', unitValue: 1 } },
        })
        await new Promise((res) => requestAnimationFrame(res))

        // Union of each cluster's pieces, in the same page space. The cells
        // tile the box+whisker extent, so the unions must reproduce it.
        const unions = {}
        document.querySelectorAll('.apexcharts-morph-pieces rect').forEach((el) => {
          const i = el.getAttribute('data-i')
          const b = el.getBoundingClientRect()
          const u = (unions[i] = unions[i] || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9, n: 0 })
          u.x0 = Math.min(u.x0, b.x)
          u.y0 = Math.min(u.y0, b.y)
          u.x1 = Math.max(u.x1, b.x + b.width)
          u.y1 = Math.max(u.y1, b.y + b.height)
          u.n++
        })

        const drift = boxes.map((box, i) => {
          const u = unions[i]
          if (!u) return null
          return Math.max(
            Math.abs(u.x0 - box.x0),
            Math.abs(u.y0 - box.y0),
            Math.abs(u.x1 - box.x1),
            Math.abs(u.y1 - box.y1),
          )
        })

        await new Promise((res) => setTimeout(res, 1600))
        return {
          clusters: rows.length,
          pieceClusters: Object.keys(unions).length,
          piecesPerCluster: Object.keys(unions)
            .sort((a, b) => +a - +b)
            .map((i) => unions[i].n),
          maxDrift: Math.max(...drift.filter((d) => d != null)),
          ghost: document.querySelectorAll('.apexcharts-morph-ghost').length,
          settledDots: [...document.querySelectorAll('.apexcharts-unit-area')].filter(
            (d) => d.getAttribute('opacity') !== '0',
          ).length,
          settledPieces: document.querySelectorAll('.apexcharts-morph-pieces rect').length,
          expectedDots: data.reduce((n, d) => n + d.points.length, 0),
        }
      },
      [MAKE, SAMPLES],
    )

    expect(r.clusters).toBe(5)
    // One piece per observation, per box: the box is CUT into its sample.
    expect(r.pieceClusters).toBe(5)
    expect(r.piecesPerCluster).toEqual([40, 40, 40, 40, 40])
    // The pieces start as an exact tiling of the box+whisker extent (compared
    // in page space, so plot-origin differences cannot fake a pass).
    expect(r.maxDrift).toBeLessThan(1)
    // Ink is conserved: no fading photocopy.
    expect(r.ghost).toBe(0)
    // And every observation is on screen once the pieces have landed.
    expect(r.settledDots).toBe(r.expectedDots)
    expect(r.settledPieces).toBe(0)
  })
})

test.describe('violin -> unit', () => {
  test('captures each violin (one path per mark) and explodes it', async ({
    page,
    loadChart,
  }) => {
    await loadChart('violin', 'violin-with-jitter')

    const r = await page.evaluate(
      async ([mk, samples]) => {
        const make = eval(mk)
        const data = eval(samples).map((d) => ({ x: d.x, y: d.points }))
        const chart = await make('violin', [{ name: 'Devices', data }])

        const captured = chart.morphTypeChange._captureFromDOM('violin')
        const rows = chart.rowSeries()
        // Counted BEFORE the type change: afterwards the violins are gone,
        // and nothing clones them any more (pieces replaced the photocopy).
        const paths = document.querySelectorAll('#probe .apexcharts-violin-area').length

        chart.updateOptions({
          chart: { type: 'unit' },
          series: rows,
          plotOptions: { unit: { layout: 'scatter', unitValue: 1 } },
        })
        await new Promise((res) => requestAnimationFrame(res))

        return {
          paths,
          marks: captured.marks.length,
          clusters: rows.length,
          liveDots: document.querySelectorAll(
            '.apexcharts-svg .apexcharts-unit-area',
          ).length,
          pieces: document.querySelectorAll('.apexcharts-morph-pieces rect').length,
          expectedDots: data.reduce((n, d) => n + d.y.length, 0),
          ghost: document.querySelectorAll('.apexcharts-morph-ghost').length,
        }
      },
      [MAKE, SAMPLES],
    )

    // One path per violin, so marks == paths here (unlike boxPlot).
    expect(r.marks).toBe(r.paths)
    expect(r.marks).toBe(5)
    expect(r.clusters).toBe(5)
    expect(r.liveDots).toBe(r.expectedDots)
    // The silhouettes come apart as pieces (one per observation), not as a
    // fading photocopy.
    expect(r.pieces).toBe(r.expectedDots)
    expect(r.ghost).toBe(0)
  })
})

test.describe('collapse: unit -> boxPlot', () => {
  test('the boxes grow out of the dot cloud, not up from the baseline', async ({
    page,
    loadChart,
  }) => {
    await loadChart('boxPlot', 'boxplot-from-raw-observations')

    const r = await page.evaluate(
      async ([mk, samples]) => {
        const make = eval(mk)
        const data = eval(samples)
        const chart = await make('boxPlot', [{ name: 'Devices', data }])

        chart.updateOptions({
          chart: { type: 'unit' },
          series: chart.rowSeries(),
          plotOptions: { unit: { layout: 'scatter', unitValue: 1 } },
        })
        await new Promise((res) => setTimeout(res, 1100))

        // Where each cluster's dots sit, before collapsing.
        const cloudY = {}
        document.querySelectorAll('.apexcharts-unit-area').forEach((d) => {
          const i = +d.getAttribute('i')
          const cy = d.getAttribute('cy')
          const y = cy != null ? +cy : +d.getAttribute('y')
          const e = (cloudY[i] = cloudY[i] || { min: 1e9, max: -1e9 })
          e.min = Math.min(e.min, y)
          e.max = Math.max(e.max, y)
        })

        chart.updateOptions({ chart: { type: 'boxPlot' }, series: [{ name: 'Devices', data }] })
        await new Promise((res) => requestAnimationFrame(res))

        // A box growing from the baseline is a zero-height line at the axis; a
        // box growing from its cloud already has the cloud's height.
        const firstFrame = {}
        document.querySelectorAll('#probe .apexcharts-boxPlot-area').forEach((p) => {
          const j = +p.getAttribute('j')
          const b = p.getBBox()
          const e = (firstFrame[j] = firstFrame[j] || { min: 1e9, max: -1e9 })
          e.min = Math.min(e.min, b.y)
          e.max = Math.max(e.max, b.y + b.height)
        })

        const heights = Object.keys(firstFrame)
          .sort((a, b) => +a - +b)
          .map((j) => firstFrame[j].max - firstFrame[j].min)

        await new Promise((res) => setTimeout(res, 1200))
        const settled = document.querySelectorAll('#probe .apexcharts-boxPlot-area').length

        return {
          heights,
          cloudHeights: Object.keys(cloudY)
            .sort((a, b) => +a - +b)
            .map((i) => cloudY[i].max - cloudY[i].min),
          settled,
          ghost: document.querySelectorAll('.apexcharts-morph-ghost').length,
        }
      },
      [MAKE, SAMPLES],
    )

    expect(r.settled).toBe(10)
    // Every box has real height on its very first frame, which it cannot have
    // if it started collapsed on the baseline.
    expect(Math.min(...r.heights)).toBeGreaterThan(10)
    // And no ghost is left behind afterwards.
    expect(r.ghost).toBe(0)
  })
})

test.describe('the pieces follow the silhouette, not the bounding box', () => {
  // Three TALL violins with strong bellies (a single category makes one fat
  // violin, wider than tall, and the divider then runs its bands the other
  // way): tip bands and belly bands of one mark must measure very
  // differently, which is exactly what a bounding-box grid cannot do. This is
  // the regression the feature was reported on: the dissolve used to stamp a
  // rectangle over the curve at frame one, and the reverse used to assemble
  // one.
  const THREE_VIOLINS = `[{ name: 'Readings', data: (() => {
    let seed = 29
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    return ['A', 'B', 'C'].map((x) => ({
      x,
      points: Array.from({ length: 60 }, () => {
        const u1 = Math.max(rand(), 1e-9), u2 = rand()
        return Math.round(60 + 14 * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2))
      }),
    }))
  })() }]`

  /** Band one mark's pieces by y and return each band's x-span, top down. */
  const BAND_SPANS = `(rects) => {
    const bands = new Map()
    rects.forEach((el) => {
      const y = parseFloat(el.getAttribute('y'))
      const x = parseFloat(el.getAttribute('x'))
      const w = parseFloat(el.getAttribute('width'))
      const key = Math.round(y / 8)
      const b = bands.get(key) || { x0: 1e9, x1: -1e9 }
      b.x0 = Math.min(b.x0, x)
      b.x1 = Math.max(b.x1, x + w)
      bands.set(key, b)
    })
    return [...bands.entries()].sort((a, b) => a[0] - b[0]).map(([, b]) => b.x1 - b.x0)
  }`

  test('violin -> unit: the outgoing cells taper with the curve', async ({
    page,
    loadChart,
  }) => {
    await loadChart('violin', 'violin-with-jitter')

    const r = await page.evaluate(
      async ([mk, series, bandSpans]) => {
        const make = eval(mk)
        const spansOf = eval(bandSpans)
        const chart = await make('violin', eval(series))

        chart.updateOptions({
          chart: { type: 'unit' },
          series: chart.rowSeries(),
          plotOptions: { unit: { layout: 'packed', unitValue: 1 } },
        })
        await new Promise((res) => requestAnimationFrame(res))

        // The middle violin's pieces only: one mark, one silhouette.
        const spans = spansOf([
          ...document.querySelectorAll('.apexcharts-morph-pieces rect[data-i="1"]'),
        ])
        await new Promise((res) => setTimeout(res, 1600))
        return { spans }
      },
      [MAKE, THREE_VIOLINS, BAND_SPANS],
    )

    const spans = r.spans
    expect(spans.length).toBeGreaterThan(8)
    const belly = Math.max(...spans)
    const tip = Math.min(spans[0], spans[spans.length - 1])
    // The end bands are slivers against the belly. A bounding-box grid makes
    // every band identical, which is the failure this pins out.
    expect(tip).toBeLessThan(belly * 0.45)
  })

  test('unit -> violin: the assembling mosaic is violin-shaped and grid-clipped', async ({
    page,
    loadChart,
  }) => {
    await loadChart('violin', 'violin-with-jitter')

    const r = await page.evaluate(
      async ([mk, series, bandSpans]) => {
        const make = eval(mk)
        const spansOf = eval(bandSpans)
        const data = eval(series)
        const chart = await make('violin', data)

        chart.updateOptions({
          chart: { type: 'unit' },
          series: chart.rowSeries(),
          plotOptions: { unit: { layout: 'packed', unitValue: 1 } },
        })
        await new Promise((res) => setTimeout(res, 1600))

        chart.updateOptions({ chart: { type: 'violin' }, series: data })
        await new Promise((res) => requestAnimationFrame(res))

        const clip =
          document
            .querySelector('.apexcharts-morph-pieces')
            ?.getAttribute('clip-path') ?? ''

        // Watch the flight and keep the latest frame where most of the middle
        // mark's tiles have squared onto their cells (rx ~ 0): those sit at
        // exact cell geometry, so their bands ARE the mosaic's silhouette.
        let spans = []
        for (let k = 0; k < 240; k++) {
          await new Promise((res) => requestAnimationFrame(res))
          const all = document.querySelectorAll('.apexcharts-morph-pieces rect')
          if (!all.length && k > 5) break
          const landed = [
            ...document.querySelectorAll(
              '.apexcharts-morph-pieces rect[data-key="0:1"]',
            ),
          ].filter((el) => parseFloat(el.getAttribute('rx')) < 0.5)
          if (landed.length >= 45) spans = spansOf(landed)
        }
        await new Promise((res) => setTimeout(res, 800))
        return { clip, spans }
      },
      [MAKE, THREE_VIOLINS, BAND_SPANS],
    )

    // The overlay is clipped like the marks it stands in for, so the mosaic
    // cannot stick out past the plot the way the raw bounding box does.
    expect(r.clip).toContain('gridRectBarMask')

    const spans = r.spans
    expect(spans.length).toBeGreaterThan(8)
    const belly = Math.max(...spans)
    const tip = Math.min(spans[0], spans[spans.length - 1])
    expect(tip).toBeLessThan(belly * 0.45)
  })
})

// ===========================================================================
// The other summary of the same sample.
//
// A box and a violin are two readings of one set of observations, so this is an
// ordinary 1:1 shape morph: no pieces, no ghost, the outgoing mark IS the
// incoming mark's first frame. What made it worth its own tests is that it
// could not animate at all until recently: both types ship with
// `dynamicAnimation.enabled: false` (an index-based morph on a data CHANGE
// reads as churn) and the cross-type morph was gated on the same flag, so the
// new chart drew straight at its final geometry.
// ===========================================================================
test.describe('boxPlot <-> violin', () => {
  /** Per-category union of a selector's marks, in page space. */
  const UNION = `(sel) => {
    const byJ = {}
    document.querySelectorAll(sel).forEach((p) => {
      const j = p.getAttribute('j')
      const b = p.getBoundingClientRect()
      const e = (byJ[j] = byJ[j] || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 })
      e.x0 = Math.min(e.x0, b.x)
      e.y0 = Math.min(e.y0, b.y)
      e.x1 = Math.max(e.x1, b.x + b.width)
      e.y1 = Math.max(e.y1, b.y + b.height)
    })
    return Object.keys(byJ).sort((a, b) => +a - +b).map((j) => byJ[j])
  }`

  /**
   * @param {any} page
   * @param {string} from
   * @param {string} to
   */
  const drive = (page, from, to) =>
    page.evaluate(
      async ([mk, samples, unionFn, fromType, toType]) => {
        const make = eval(mk)
        const union = eval(unionFn)
        const series = [{ name: 'Devices', data: eval(samples) }]
        const chart = await make(fromType, series)

        const before = union(`#probe .apexcharts-${fromType}-area`)
        chart.updateOptions({ chart: { type: toType }, series })
        await new Promise((res) => requestAnimationFrame(res))

        const sel = `#probe .apexcharts-${toType}-area`
        const first = union(sel)
        // Distinct heights over the flight: a frozen mark reports one.
        const heights = new Set()
        for (let k = 0; k < 45; k++) {
          await new Promise((res) => requestAnimationFrame(res))
          const el = document.querySelector(sel)
          if (el) heights.add(Math.round(el.getBoundingClientRect().height))
        }
        await new Promise((res) => setTimeout(res, 1400))
        return {
          before,
          first,
          settled: union(sel),
          steps: heights.size,
          pieces: document.querySelectorAll('#probe .apexcharts-morph-pieces rect')
            .length,
          ghosts: document.querySelectorAll('#probe .apexcharts-morph-ghost').length,
        }
      },
      [MAKE, SAMPLES, UNION, from, to],
    )

  /** How far apart two unions are, worst edge. */
  const gap = (a, b) =>
    Math.max(
      ...a.map((m, i) =>
        Math.max(
          Math.abs(m.x0 - b[i].x0),
          Math.abs(m.y0 - b[i].y0),
          Math.abs(m.x1 - b[i].x1),
          Math.abs(m.y1 - b[i].y1),
        ),
      ),
    )

  test('the box unfolds into the density, whiskers and all', async ({
    page,
    loadChart,
  }) => {
    await loadChart('boxPlot', 'boxplot-from-raw-observations')
    const r = await drive(page, 'boxPlot', 'violin')

    expect(r.before.length).toBe(5)
    expect(r.first.length).toBe(r.before.length)
    // Frame one IS the box, whiskers included: the capture unions both of a
    // box's paths, so the silhouette the violin grows from covers the whole
    // extent rather than the body alone.
    expect(gap(r.first, r.before)).toBeLessThan(1.5)
    // It travels rather than jumping.
    expect(r.steps).toBeGreaterThan(3)
    // And it arrives somewhere else: a density is not a rectangle.
    expect(gap(r.settled, r.first)).toBeGreaterThan(2)
    // 1:1 marks, so no exit layer of any kind.
    expect(r.pieces).toBe(0)
    expect(r.ghosts).toBe(0)
  })

  test('the density folds back into the box', async ({ page, loadChart }) => {
    await loadChart('violin', 'basic-violin')
    const r = await drive(page, 'violin', 'boxPlot')

    expect(r.before.length).toBe(5)
    expect(r.first.length).toBe(r.before.length)
    expect(gap(r.first, r.before)).toBeLessThan(1.5)
    expect(r.steps).toBeGreaterThan(3)
    expect(gap(r.settled, r.first)).toBeGreaterThan(2)
    expect(r.pieces).toBe(0)
    expect(r.ghosts).toBe(0)
  })
})

test('summary pairs stay closed against untested targets', async ({ page, loadChart }) => {
  await loadChart('boxPlot', 'boxplot-from-raw-observations')
  const r = await page.evaluate(() => {
    const chart = Object.values(window.Apex._chartInstances)[0].chart
    const m = chart.morphTypeChange
    return {
      toUnit: m.canMorphTypes('boxPlot', 'unit'),
      fromUnit: m.canMorphTypes('unit', 'violin'),
      toBar: m.canMorphTypes('boxPlot', 'bar'),
      toPie: m.canMorphTypes('boxPlot', 'pie'),
      toViolin: m.canMorphTypes('boxPlot', 'violin'),
      fromViolin: m.canMorphTypes('violin', 'boxPlot'),
    }
  })
  console.log('SUMMARY PAIRS ' + JSON.stringify(r))
  expect(r.toUnit).toBe(true)
  expect(r.fromUnit).toBe(true)
  // The two summaries of one sample, driven and pinned above.
  expect(r.toViolin).toBe(true)
  expect(r.fromViolin).toBe(true)
  // Mechanically plausible, never driven: claiming a morph nobody has watched
  // is worse than not offering it.
  expect(r.toBar).toBe(false)
  expect(r.toPie).toBe(false)
})
