/**
 * Variable-length data transitions (enter / update / exit).
 *
 * When the number of data points changes on update, marks must reflow as one
 * coordinated motion instead of falling apart:
 *   - an appended column GROWS from the baseline of its final slot (no
 *     full-height pop) while survivors slide to their narrower slots on one
 *     shared clock;
 *   - a removed column leaves a ghost that shrinks/fades out, then removes
 *     itself;
 *   - an insert in the middle keeps datum identity (keyed join): survivors
 *     keep their values and slide, they do not morph into their neighbor;
 *   - an area fill NEVER tears mid-morph (no backward x jumps above the
 *     baseline: the union-anchor reconciliation regression);
 *   - line markers ride the morphing path (transform tween) and data labels
 *     hold hidden until the morph settles;
 *   - surviving axis tick labels slide to their new positions and new ones
 *     fade in, on the same clock as the marks.
 */

import { test, expect } from '../fixtures/base.js'

/** Trigger an update and sample the DOM every ~40ms, all inside the page. */
function sampleDuringUpdate(page, updateArg, sampler, durationMs = 700) {
  return page.evaluate(
    async ({ updateArg, samplerSrc, durationMs }) => {
      const sample = new Function('return (' + samplerSrc + ')')()
      const samples = []
      const t0 = performance.now()
      const timer = setInterval(() => {
        try {
          samples.push({ t: Math.round(performance.now() - t0), ...sample() })
        } catch (e) {
          samples.push({ t: Math.round(performance.now() - t0), error: String(e) })
        }
      }, 40)
      window.chart.updateOptions(updateArg, false, true)
      await new Promise((r) => setTimeout(r, durationMs))
      clearInterval(timer)
      // Let animations fully settle before the caller asserts final state.
      await new Promise((r) => setTimeout(r, 900 - durationMs > 0 ? 900 - durationMs : 200))
      return samples
    },
    { updateArg, samplerSrc: sampler.toString(), durationMs },
  )
}

test.describe('Dynamic updates with changing data length', () => {
  test('appended columns grow from the baseline while survivors reflow together', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'basic-column')

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [
          { data: [44, 55, 57, 56, 61, 58, 63, 60, 66, 70] },
          { data: [76, 85, 101, 98, 87, 105, 91, 114, 94, 99] },
          { data: [35, 41, 36, 26, 45, 48, 52, 53, 41, 44] },
        ],
        xaxis: {
          categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        },
      },
      () => {
        const series = document.querySelector(
          '.apexcharts-bar-series .apexcharts-series',
        )
        const bars = series.querySelectorAll('.apexcharts-bar-area')
        const last = bars[bars.length - 1]
        const first = bars[0]
        return {
          count: bars.length,
          lastH: last ? last.getBBox().height : 0,
          firstX: first ? first.getBBox().x : 0,
        }
      },
    )

    const mid = samples.filter((s) => s.t > 20 && s.t < 200 && !s.error)
    expect(mid.length).toBeGreaterThan(0)
    // The new 10th bar exists right away but starts near the baseline.
    mid.forEach((s) => expect(s.count).toBe(10))
    const finalH = samples[samples.length - 1].lastH
    expect(mid[0].lastH).toBeLessThan(finalH * 0.5)
    // Survivors reflow: the first bar's x moves left over the transition.
    const firstXs = samples.filter((s) => !s.error).map((s) => s.firstX)
    expect(Math.max(...firstXs) - Math.min(...firstXs)).toBeGreaterThan(1)
    // It ends at full height.
    expect(finalH).toBeGreaterThan(0)
  })

  test('removed columns exit via a shrinking ghost', async ({ page, loadChart }) => {
    await loadChart('column', 'basic-column')

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [
          { data: [44, 55, 57, 56, 61, 58, 63, 60] },
          { data: [76, 85, 101, 98, 87, 105, 91, 114] },
          { data: [35, 41, 36, 26, 45, 48, 52, 53] },
        ],
        xaxis: {
          categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
        },
      },
      () => ({
        ghosts: document.querySelectorAll('.apexcharts-bar-ghost').length,
        bars: document.querySelectorAll(
          '.apexcharts-bar-series .apexcharts-series:first-child .apexcharts-bar-area',
        ).length,
      }),
    )

    // One ghost per series appears during the transition (the exiting Oct
    // column of each of the 3 series) and every ghost removes itself.
    const during = samples.filter((s) => s.t > 20 && s.t < 200 && !s.error)
    expect(Math.max(...during.map((s) => s.ghosts))).toBe(3)
    const settled = await page.evaluate(() => ({
      ghosts: document.querySelectorAll('.apexcharts-bar-ghost').length,
      bars: document.querySelectorAll(
        '.apexcharts-bar-series .apexcharts-series:first-child .apexcharts-bar-area',
      ).length,
    }))
    expect(settled.ghosts).toBe(0)
    expect(settled.bars).toBe(8)
  })

  test('insert in the middle keeps datum identity (keyed join)', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'basic-column')

    // Insert a new category between Mar and Apr. Apr keeps its value (57 in
    // the first series): with index pairing it would have morphed into 57's
    // neighbor instead.
    await page.evaluate(async () => {
      window.chart.updateOptions(
        {
          series: [
            { data: [44, 55, 30, 57, 56, 61, 58, 63, 60, 66] },
            { data: [76, 85, 60, 101, 98, 87, 105, 91, 114, 94] },
            { data: [35, 41, 20, 36, 26, 45, 48, 52, 53, 41] },
          ],
          xaxis: {
            categories: ['Feb', 'Mar', 'New', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
          },
        },
        false,
        true,
      )
      await new Promise((r) => setTimeout(r, 900))
    })

    const state = await page.evaluate(() => {
      const bars = [
        ...document.querySelectorAll(
          '.apexcharts-bar-series .apexcharts-series:first-child .apexcharts-bar-area',
        ),
      ]
      const byKey = {}
      bars.forEach((b) => {
        byKey[b.getAttribute('data:pathKey')] = parseFloat(b.getAttribute('val'))
      })
      return byKey
    })
    expect(state['c:New']).toBe(30)
    expect(state['c:Apr']).toBe(57)
    expect(state['c:Oct']).toBe(66)
  })

  test('area fills never tear during a length change (smooth curve, datetime axis)', async ({
    page,
    loadChart,
  }) => {
    await loadChart('area', 'area-spline')

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [
          { data: [31, 40, 28, 51, 42, 109, 100, 65] },
          { data: [11, 32, 45, 32, 34, 52, 41, 60] },
        ],
        xaxis: {
          categories: [
            '2018-09-19T00:00:00.000Z',
            '2018-09-19T01:30:00.000Z',
            '2018-09-19T02:30:00.000Z',
            '2018-09-19T03:30:00.000Z',
            '2018-09-19T04:30:00.000Z',
            '2018-09-19T05:30:00.000Z',
            '2018-09-19T06:30:00.000Z',
            '2018-09-19T07:30:00.000Z',
          ],
        },
      },
      () => {
        const fill = document.querySelector(
          '.apexcharts-area-series .apexcharts-series path.apexcharts-area[fill]:not([fill="none"])',
        )
        return {
          d: fill ? fill.getAttribute('d') : null,
          bottom: window.chart.w.layout.gridHeight,
        }
      },
      600,
    )

    // Parse each sampled fill path: the boundary must never jump backwards in
    // x while above the baseline (the fill-tear signature).
    const worst = samples
      .filter((s) => s.d)
      .reduce((acc, s) => {
        const pts = []
        const re = /([MLCZz])([^MLCZz]*)/g
        let m
        while ((m = re.exec(s.d)) !== null) {
          if (m[1].toUpperCase() === 'Z') continue
          const nums = (m[2].match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi) || []).map(
            parseFloat,
          )
          if (m[1] === 'C') {
            for (let i = 0; i + 5 < nums.length; i += 6) pts.push([nums[i + 4], nums[i + 5]])
          } else {
            for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i], nums[i + 1]])
          }
        }
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1]
          const [x1, y1] = pts[i]
          if (y0 >= s.bottom - 3 && y1 >= s.bottom - 3) continue
          acc = Math.max(acc, x0 - x1)
        }
        return acc
      }, 0)
    expect(worst).toBeLessThan(1.5)
  })

  test('markers ride the morphing line; data labels hold until it settles', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'line-with-data-labels')

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [
          { data: [28, 29, 33, 36, 32, 32, 33, 38] },
          { data: [12, 11, 14, 18, 17, 13, 13, 16] },
        ],
        xaxis: {
          categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        },
      },
      () => ({
        tweening: [...document.querySelectorAll('.apexcharts-marker')].filter((n) =>
          n.getAttribute('transform'),
        ).length,
        labelsHidden: [...document.querySelectorAll('.apexcharts-datalabels')].some((n) =>
          n.classList.contains('apexcharts-element-hidden'),
        ),
      }),
    )

    const during = samples.filter((s) => s.t > 20 && s.t < 200 && !s.error)
    // Surviving markers carry a translate tween mid-morph.
    expect(Math.max(...during.map((s) => s.tweening))).toBeGreaterThan(0)
    // Data labels stay hidden through the morph.
    expect(during.every((s) => s.labelsHidden)).toBe(true)

    const settled = await page.evaluate(() => ({
      tweening: [...document.querySelectorAll('.apexcharts-marker')].filter((n) =>
        n.getAttribute('transform'),
      ).length,
      anyHidden: [...document.querySelectorAll('.apexcharts-datalabels')].some((n) =>
        n.classList.contains('apexcharts-element-hidden'),
      ),
      markers: document.querySelectorAll('.apexcharts-marker').length,
    }))
    expect(settled.tweening).toBe(0)
    expect(settled.anyHidden).toBe(false)
    // 8 points x 2 series (plus per-series start-point markers).
    expect(settled.markers).toBeGreaterThanOrEqual(16)
  })

  test('surviving axis labels slide to their new slots; new ones fade in', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'basic-column')

    const samples = await sampleDuringUpdate(
      page,
      {
        series: [
          { data: [44, 55, 57, 56, 61, 58, 63, 60, 66, 70] },
          { data: [76, 85, 101, 98, 87, 105, 91, 114, 94, 99] },
          { data: [35, 41, 36, 26, 45, 48, 52, 53, 41, 44] },
        ],
        xaxis: {
          categories: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
        },
      },
      () => {
        // Labels render as <text><tspan>Mar</tspan><title>Mar</title></text>,
        // so match on the tspan.
        const texts = [
          ...document.querySelectorAll('.apexcharts-xaxis-texts-g text'),
        ]
        const byTspan = (name) =>
          texts.find((t) => t.querySelector('tspan')?.textContent === name)
        const mar = byTspan('Mar')
        const nov = byTspan('Nov')
        return {
          marX: mar ? parseFloat(mar.getAttribute('x')) : null,
          novOpacity: nov ? (nov.style.opacity === '' ? 1 : parseFloat(nov.style.opacity)) : null,
        }
      },
    )

    // Content-based (not time-window) checks so async mount timing under
    // parallel workers cannot flake them: post-update samples are those where
    // the entering Nov label already exists.
    const valid = samples.filter((s) => !s.error && s.marX != null)
    expect(valid.length).toBeGreaterThan(0)
    const finalMarX = valid[valid.length - 1].marX
    const postUpdate = valid.filter((s) => s.novOpacity != null)
    expect(postUpdate.length).toBeGreaterThan(0)
    // Mar spends part of the transition away from its final slot (sliding);
    // without the axis transition every post-update sample sits at final x.
    const sliding = postUpdate.filter((s) => Math.abs(s.marX - finalMarX) > 2)
    expect(sliding.length).toBeGreaterThan(0)
    // The entering Nov label fades in rather than popping.
    const novFading = postUpdate.filter((s) => s.novOpacity < 0.9)
    expect(novFading.length).toBeGreaterThan(0)
  })

  test('axis ticks also transition on zoom (identity join, datum set unchanged)', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'zoomable-timeseries')

    const res = await page.evaluate(async () => {
      const grab = () => {
        const out = {}
        document
          .querySelectorAll(
            '.apexcharts-xaxis-texts-g text:not(.apexcharts-tick-ghost)',
          )
          .forEach((t) => {
            const txt = t.querySelector('tspan')?.textContent
            if (txt) {
              out[txt] = {
                x: parseFloat(t.getAttribute('x')),
                op: t.style.opacity === '' ? 1 : parseFloat(t.style.opacity),
              }
            }
          })
        return out
      }
      const gl = window.chart.w.globals
      const span = gl.maxX - gl.minX
      const before = grab()
      const samples = []
      const t0 = performance.now()
      const timer = setInterval(() => {
        samples.push({
          t: Math.round(performance.now() - t0),
          labels: grab(),
          ghosts: document.querySelectorAll('.apexcharts-tick-ghost').length,
        })
      }, 45)
      window.chart.zoomX(gl.minX + span * 0.3, gl.minX + span * 0.62)
      await new Promise((r) => setTimeout(r, 900))
      clearInterval(timer)
      return {
        before,
        samples,
        final: grab(),
        finalGhosts: document.querySelectorAll('.apexcharts-tick-ghost').length,
      }
    })

    // A tick that survives the zoom (same text before and after) must spend
    // part of the transition away from its final position: it slides with
    // the stretching line instead of snapping.
    const survivors = Object.keys(res.final).filter((k) => res.before[k])
    expect(survivors.length).toBeGreaterThan(0)
    const slid = survivors.some((k) =>
      res.samples.some(
        (s) => s.labels[k] && Math.abs(s.labels[k].x - res.final[k].x) > 2,
      ),
    )
    expect(slid).toBe(true)

    // New finer-granularity ticks fade in rather than popping.
    const newTicks = Object.keys(res.final).filter((k) => !res.before[k])
    if (newTicks.length) {
      const faded = newTicks.some((k) =>
        res.samples.some((s) => s.labels[k] && s.labels[k].op < 0.9),
      )
      expect(faded).toBe(true)
    }

    // Outgoing ticks (texts with no new counterpart) ghost out mid-flight
    // and every ghost removes itself by the end.
    const retired = Object.keys(res.before).filter((k) => !res.final[k])
    if (retired.length) {
      expect(Math.max(...res.samples.map((s) => s.ghosts))).toBeGreaterThan(0)
    }
    expect(res.finalGhosts).toBe(0)
  })
})
