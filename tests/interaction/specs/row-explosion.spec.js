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
  test('histogram -> unit via rowSeries(): dots leave from their own bin', async ({
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

        // Bar centres, in the outgoing chart's own space, before the change.
        const barCentres = Array.from(
          document.querySelectorAll('#probe .apexcharts-bar-series path[pathTo]'),
        ).map((p) => {
          const b = p.getBBox()
          return b.width > 0 ? b.x + b.width / 2 : null
        })

        const rows = chart.rowSeries()
        chart.updateOptions({
          chart: { type: 'unit' },
          series: rows,
          plotOptions: { unit: { layout: 'packed', unitValue: 1 } },
        })
        // Group dot x's by the `i` attribute the renderer stamps, which is the
        // cluster index.
        const byCluster = () => {
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
        const widest = (g) =>
          Math.max(...Object.values(g).map((xs) => Math.max(...xs) - Math.min(...xs)))
        const meansOf = (g) =>
          Object.keys(g)
            .map(Number)
            .sort((a, b) => a - b)
            .map((k) => g[k].reduce((s, x) => s + x, 0) / g[k].length)

        await new Promise((res) => requestAnimationFrame(res))
        const start = byCluster()
        const startSpread = widest(start)
        const startMeans = meansOf(start)
        const ghostPresent = document.querySelectorAll('.apexcharts-morph-ghost').length
        const liveDots = document.querySelectorAll(
          '.apexcharts-svg:not(.apexcharts-morph-ghost) .apexcharts-unit-area',
        ).length

        await new Promise((res) => setTimeout(res, 1400))
        const settledSpread = widest(byCluster())

        // Translate-invariant alignment: the gaps between where clusters START
        // must match the gaps between the bars they came out of. Comparing
        // absolute x would only measure the two charts' differing plot origins.
        const filled = []
        barCentres.forEach((c, k) => {
          if (c != null && start[k] && start[k].length) filled.push(k)
        })
        const gapErrors = []
        for (let n = 1; n < filled.length; n++) {
          const barGap = barCentres[filled[n]] - barCentres[filled[n - 1]]
          const dotGap =
            startMeans[filled.indexOf(filled[n])] === undefined
              ? NaN
              : start[filled[n]].reduce((s, x) => s + x, 0) / start[filled[n]].length -
                start[filled[n - 1]].reduce((s, x) => s + x, 0) / start[filled[n - 1]].length
          gapErrors.push(Math.abs(barGap - dotGap))
        }

        return {
          liveDots,
          sampleSize: sample.length,
          clusters: rows.length,
          startSpread,
          settledSpread,
          maxGapError: gapErrors.length ? Math.max(...gapErrors) : null,
          comparedGaps: gapErrors.length,
          ascending: startMeans.every((x, i) => i === 0 || x > startMeans[i - 1]),
          ghostPresent,
        }
      },
      [MAKE_OBS, MAKE_CHART],
    )

    // No observation lost or invented on the way through the explode.
    expect(r.liveDots).toBe(r.sampleSize)

    // Each cluster starts collapsed onto its bar's centre line and fans out
    // from there. Sampled one frame in, so it is already slightly open: the
    // property is that it is still far tighter than where it ends up.
    expect(r.startSpread).toBeLessThan(r.settledSpread * 0.5)

    // The alignment itself: cluster-to-cluster spacing at the burst matches
    // bar-to-bar spacing, so cluster i really did leave from bar i.
    expect(r.comparedGaps).toBeGreaterThan(3)
    expect(r.maxGapError).toBeLessThan(2)

    expect(r.ascending).toBe(true)
    // The outgoing bars are still on screen, exiting.
    expect(r.ghostPresent).toBe(1)
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
