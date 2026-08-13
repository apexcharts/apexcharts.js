/**
 * Row explosion: `chart.rowSeries()` against the real morph capture (plan 21).
 *
 * The unit tests prove the row sources return the right rows in the right
 * order. What they cannot prove is that the order agrees with the order the
 * morph engine captures marks in, because that ordering comes out of the live
 * DOM. `_buildMapping` keys unit clusters onto captured marks positionally, so
 * cluster i bursts out of mark i: if the two orders disagree by even one slot,
 * every dot after that point leaves from the wrong bar, silently.
 *
 * These run in a real browser for that reason. An earlier jsdom-only pass over
 * this same geometry produced a test that passed vacuously.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

/** A seeded log-normal sample, built in the page. */
const MAKE_OBS = `(n, mu, sigma) => {
  let seed = 7
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  const out = []
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rand(), 1e-9), u2 = rand()
    out.push(Math.round(Math.exp(mu + Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma)))
  }
  return out
}`

/** Build a histogram in a clean container and return the live instance. */
const MAKE_CHART = `async (series, plotOptions) => {
  document.body.innerHTML = '<div id="probe" style="width:700px"></div>'
  const chart = new window.ApexCharts(document.querySelector('#probe'), {
    chart: { id: 'probe', type: 'histogram', height: 380 },
    series,
    plotOptions,
  })
  await chart.render()
  return chart
}`

test.describe('rowSeries() vs the morph capture', () => {
  test('one cluster per drawn bar, in the same order, empty bins included', async ({
    page,
    loadChart,
  }) => {
    await loadChart('histogram', 'latency-distribution')

    const r = await page.evaluate(
      async ([mkObs, mkChart]) => {
        const obs = eval(mkObs)
        const make = eval(mkChart)
        // A hole in the sample guarantees empty bins.
        const gapped = obs(300, 3.3, 0.5).filter((v) => v < 25 || v > 55)
        const chart = await make([{ name: 'Gapped', data: gapped }], {
          histogram: { bins: 20 },
        })

        const rows = chart.rowSeries()
        const counts = chart.w.histogramData.counts[0]
        // The marks the morph capture would walk, in its own order.
        const bars = document.querySelectorAll(
          '#probe .apexcharts-bar-series .apexcharts-series path[pathTo]',
        ).length

        return {
          bars,
          clusters: rows.length,
          emptyBins: counts.filter((c) => c === 0).length,
          perClusterMatchesPerBin:
            JSON.stringify(rows.map((c) => c.data.length)) === JSON.stringify(counts),
          totalRows: rows.reduce((n, c) => n + c.data.length, 0),
          sampleSize: gapped.length,
        }
      },
      [MAKE_OBS, MAKE_CHART],
    )

    expect(r.emptyBins).toBeGreaterThan(0)
    // The contract: one cluster per captured mark, positionally aligned.
    expect(r.clusters).toBe(r.bars)
    expect(r.perClusterMatchesPerBin).toBe(true)
    // Every observation is accounted for, none invented.
    expect(r.totalRows).toBe(r.sampleSize)
  })

  test('overlaid histogram stays aligned: clusters are series-major, like the DOM', async ({
    page,
    loadChart,
  }) => {
    await loadChart('histogram', 'latency-distribution')

    const r = await page.evaluate(
      async ([mkObs, mkChart]) => {
        const obs = eval(mkObs)
        const make = eval(mkChart)
        const chart = await make(
          [
            { name: 'Car', data: obs(300, 3.25, 0.5) },
            { name: 'Transit', data: obs(300, 3.45, 0.2) },
          ],
          { histogram: { bins: 10 } },
        )

        const rows = chart.rowSeries()
        const counts = chart.w.histogramData.counts

        // Walk the DOM the way the capture does: per series group, then paths
        // in order. The capture sorts by (realIndex, j), which this reproduces.
        const perSeriesBars = Array.from(
          document.querySelectorAll('#probe .apexcharts-bar-series .apexcharts-series'),
        ).map((g) => g.querySelectorAll('path[pathTo]').length)

        return {
          perSeriesBars,
          totalBars: perSeriesBars.reduce((a, b) => a + b, 0),
          clusters: rows.length,
          seriesMajor:
            JSON.stringify(rows.map((c) => c.data.length)) ===
            JSON.stringify([...counts[0], ...counts[1]]),
          firstClusterName: rows[0].name,
          crossoverName: rows[counts[0].length].name,
        }
      },
      [MAKE_OBS, MAKE_CHART],
    )

    expect(r.clusters).toBe(r.totalBars)
    expect(r.seriesMajor).toBe(true)
    // The crossover lands exactly where the second series' bars begin.
    expect(r.firstClusterName).toContain('Car')
    expect(r.crossoverName).toContain('Transit')
  })

  test('a collapsed series contributes no clusters, because it draws no bars', async ({
    page,
    loadChart,
  }) => {
    await loadChart('histogram', 'latency-distribution')

    const r = await page.evaluate(
      async ([mkObs, mkChart]) => {
        const obs = eval(mkObs)
        const make = eval(mkChart)
        const chart = await make(
          [
            { name: 'Car', data: obs(300, 3.25, 0.5) },
            { name: 'Transit', data: obs(300, 3.45, 0.2) },
          ],
          { histogram: { bins: 10 } },
        )
        const both = chart.rowSeries().length

        chart.toggleSeries('Transit')
        await new Promise((res) => setTimeout(res, 400))

        const bars = document.querySelectorAll(
          '#probe .apexcharts-bar-series .apexcharts-series path[pathTo]',
        ).length
        return { both, afterHide: chart.rowSeries().length, bars }
      },
      [MAKE_OBS, MAKE_CHART],
    )

    expect(r.afterHide).toBeLessThan(r.both)
    // Still one cluster per mark actually on screen.
    expect(r.afterHide).toBe(r.bars)
  })
})

test.describe('the explode itself', () => {
  test('histogram -> unit via rowSeries(): the pieces leave from their own bin', async ({
    page,
    loadChart,
  }) => {
    await loadChart('histogram', 'latency-distribution')

    const r = await page.evaluate(
      async ([mkObs, mkChart]) => {
        const obs = eval(mkObs)
        const make = eval(mkChart)
        const sample = obs(240, 3.3, 0.45)
        const chart = await make([{ name: 'Latency', data: sample }], {
          histogram: { bins: 12 },
        })

        // Bar extents in PAGE space, before the change, so the comparison
        // cannot be faked by the two chart types' differing plot origins.
        const barRects = Array.from(
          document.querySelectorAll('#probe .apexcharts-bar-series path[pathTo]'),
        ).map((p) => {
          const b = p.getBoundingClientRect()
          return b.width > 0 ? { x0: b.x, x1: b.x + b.width } : null
        })

        const rows = chart.rowSeries()
        chart.updateOptions({
          chart: { type: 'unit' },
          series: rows,
          plotOptions: { unit: { layout: 'packed', unitValue: 1 } },
        })
        await new Promise((res) => requestAnimationFrame(res))

        // The pieces at their start: one per observation, grouped per bin,
        // each group tiling the bar it is coming out of.
        const groups = {}
        document.querySelectorAll('.apexcharts-morph-pieces rect').forEach((el) => {
          const i = +el.getAttribute('data-i')
          const b = el.getBoundingClientRect()
          const g = (groups[i] = groups[i] || { x0: 1e9, x1: -1e9, n: 0 })
          g.x0 = Math.min(g.x0, b.x)
          g.x1 = Math.max(g.x1, b.x + b.width)
          g.n++
        })
        const keys = Object.keys(groups).map(Number).sort((a, b) => a - b)
        const pieceCount = keys.reduce((n, k) => n + groups[k].n, 0)
        const hiddenDots = document.querySelectorAll(
          '.apexcharts-unit-area[data-piece-hidden]',
        ).length

        // Each cluster's pieces UNION to exactly its bar's horizontal extent:
        // the mark was cut, not approximated. (The centroid of the cells is
        // not a valid statistic here; an unequal remainder row shifts it while
        // the tiling stays exact.) Absolute comparison is valid because both
        // sides were measured in page space.
        const extentErrors = keys
          .map((k) => {
            const bar = barRects[k]
            if (!bar) return null
            return Math.max(
              Math.abs(groups[k].x0 - bar.x0),
              Math.abs(groups[k].x1 - bar.x1),
            )
          })
          .filter((e) => e != null)
        const unionCentres = keys.map((k) => (groups[k].x0 + groups[k].x1) / 2)

        await new Promise((res) => setTimeout(res, 1600))
        return {
          sampleSize: sample.length,
          clusters: rows.length,
          pieceCount,
          hiddenDots,
          compared: extentErrors.length,
          maxExtentError: extentErrors.length ? Math.max(...extentErrors) : null,
          ascending: unionCentres.every((x, n) => n === 0 || x > unionCentres[n - 1]),
          ghostPresent: document.querySelectorAll('.apexcharts-morph-ghost').length,
          settledVisible: [...document.querySelectorAll('.apexcharts-unit-area')].filter(
            (d) => d.getAttribute('opacity') !== '0',
          ).length,
          settledPieces: document.querySelectorAll('.apexcharts-morph-pieces rect').length,
        }
      },
      [MAKE_OBS, MAKE_CHART],
    )

    // Ink is conserved: one piece per observation cut out of the bars, no
    // fading photocopy, and the real dots wait hidden for their pieces.
    expect(r.pieceCount).toBe(r.sampleSize)
    expect(r.hiddenDots).toBe(r.sampleSize)
    expect(r.ghostPresent).toBe(0)

    // Cluster i's pieces tile exactly bar i's extent, and the clusters march
    // left to right with their bins.
    expect(r.compared).toBeGreaterThan(5)
    expect(r.maxExtentError).toBeLessThan(2)
    expect(r.ascending).toBe(true)

    // And after the flight every observation is visible, nothing left over.
    expect(r.settledVisible).toBe(r.sampleSize)
    expect(r.settledPieces).toBe(0)
  })

  test('collapsing back: units -> histogram conserves the sample', async ({
    page,
    loadChart,
  }) => {
    await loadChart('histogram', 'latency-distribution')

    const r = await page.evaluate(
      async ([mkObs, mkChart]) => {
        const obs = eval(mkObs)
        const make = eval(mkChart)
        const sample = obs(240, 3.3, 0.45)
        const chart = await make([{ name: 'Latency', data: sample }], {
          histogram: { bins: 12 },
        })
        const before = chart.w.histogramData.counts[0].slice()

        chart.updateOptions({
          chart: { type: 'unit' },
          series: chart.rowSeries(),
          plotOptions: { unit: { layout: 'packed', unitValue: 1 } },
        })
        await new Promise((res) => setTimeout(res, 900))
        const dots = document.querySelectorAll('.apexcharts-unit-area').length

        chart.updateOptions({
          chart: { type: 'histogram' },
          series: [{ name: 'Latency', data: sample }],
        })
        await new Promise((res) => setTimeout(res, 900))

        return { before, dots, after: chart.w.histogramData.counts[0], sample: sample.length }
      },
      [MAKE_OBS, MAKE_CHART],
    )

    expect(r.dots).toBe(r.sample)
    // Round trip: the bins are exactly what they were.
    expect(r.after).toEqual(r.before)
  })
})
