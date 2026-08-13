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

  test('every observation leaves from its own box', async ({ page, loadChart }) => {
    await loadChart('boxPlot', 'boxplot-from-raw-observations')

    const r = await page.evaluate(
      async ([mk, samples]) => {
        const make = eval(mk)
        const data = eval(samples)
        const chart = await make('boxPlot', [{ name: 'Devices', data }])

        const boxCentres = Array.from(
          document.querySelectorAll('#probe .apexcharts-series'),
        ).length
          ? (() => {
              const byJ = {}
              document
                .querySelectorAll('#probe .apexcharts-boxPlot-area')
                .forEach((p) => {
                  const j = +p.getAttribute('j')
                  const b = p.getBBox()
                  const e = (byJ[j] = byJ[j] || { min: 1e9, max: -1e9 })
                  e.min = Math.min(e.min, b.x)
                  e.max = Math.max(e.max, b.x + b.width)
                })
              return Object.keys(byJ)
                .sort((a, b) => +a - +b)
                .map((j) => (byJ[j].min + byJ[j].max) / 2)
            })()
          : []

        const rows = chart.rowSeries()
        chart.updateOptions({
          chart: { type: 'unit' },
          series: rows,
          plotOptions: { unit: { layout: 'scatter', unitValue: 1 } },
        })

        const grab = () => {
          const out = {}
          document
            .querySelectorAll('.apexcharts-svg:not(.apexcharts-morph-ghost) .apexcharts-unit-area')
            .forEach((d) => {
              const i = +d.getAttribute('i')
              const cx = d.getAttribute('cx')
              const x =
                cx != null ? +cx : +d.getAttribute('x') + (+d.getAttribute('width') || 0) / 2
              ;(out[i] = out[i] || []).push(x)
            })
          return out
        }

        await new Promise((res) => requestAnimationFrame(res))
        const start = grab()
        const ghost = document.querySelectorAll('.apexcharts-morph-ghost').length
        const liveDots = document.querySelectorAll(
          '.apexcharts-svg:not(.apexcharts-morph-ghost) .apexcharts-unit-area',
        ).length

        const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length
        const keys = Object.keys(start).map(Number).sort((a, b) => a - b)
        const startMeans = keys.map((k) => mean(start[k]))

        // Translate-invariant: box-to-box spacing vs cluster-to-cluster spacing.
        const gapErrors = []
        for (let n = 1; n < keys.length; n++) {
          gapErrors.push(
            Math.abs(
              boxCentres[keys[n]] -
                boxCentres[keys[n - 1]] -
                (startMeans[n] - startMeans[n - 1]),
            ),
          )
        }

        return {
          clusters: rows.length,
          liveDots,
          expectedDots: data.reduce((n, d) => n + d.points.length, 0),
          ghost,
          maxGapError: gapErrors.length ? Math.max(...gapErrors) : null,
          comparedGaps: gapErrors.length,
          // Every dot of a cluster leaves from ONE vertical line, spread along
          // the box's height rather than sprayed from a single point.
          maxStartSpreadX: Math.max(
            ...keys.map((k) => Math.max(...start[k]) - Math.min(...start[k])),
          ),
        }
      },
      [MAKE, SAMPLES],
    )

    expect(r.clusters).toBe(5)
    expect(r.liveDots).toBe(r.expectedDots)
    // The boxes are still on screen, exiting, because nothing inherits them.
    expect(r.ghost).toBe(1)
    // Cluster i really did leave from box i: box-to-box spacing and
    // cluster-to-cluster spacing agree. Compared as gaps rather than absolute
    // positions, because the two chart types have different plot origins.
    expect(r.comparedGaps).toBe(4)
    expect(r.maxGapError).toBeLessThan(2)
    // All 40 dots of a cluster start on the same vertical line.
    expect(r.maxStartSpreadX).toBeLessThan(0.5)
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

        chart.updateOptions({
          chart: { type: 'unit' },
          series: rows,
          plotOptions: { unit: { layout: 'scatter', unitValue: 1 } },
        })
        await new Promise((res) => requestAnimationFrame(res))

        return {
          paths: document.querySelectorAll('#probe .apexcharts-violin-area').length,
          marks: captured.marks.length,
          clusters: rows.length,
          liveDots: document.querySelectorAll(
            '.apexcharts-svg:not(.apexcharts-morph-ghost) .apexcharts-unit-area',
          ).length,
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
    expect(r.ghost).toBe(1)
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
    }
  })
  console.log('SUMMARY PAIRS ' + JSON.stringify(r))
  expect(r.toUnit).toBe(true)
  expect(r.fromUnit).toBe(true)
  // Mechanically plausible, never driven: claiming a morph nobody has watched
  // is worse than not offering it.
  expect(r.toBar).toBe(false)
  expect(r.toPie).toBe(false)
  expect(r.toViolin).toBe(false)
})
