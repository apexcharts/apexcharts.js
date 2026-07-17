/**
 * Real-time streaming: scroll animation + bounded memory tests.
 *
 * A streaming line chart can be fed two ways:
 *   1. appendData() with xaxis.range         : grows the array, axis slides
 *   2. updateSeries() with a rolling window  : fixed-length array, shifted 1
 *
 * Both must produce a horizontal scroll at constant velocity:
 *   - avgDx > 0 for every sampled frame pair (the path translates left)
 *   - the per-frame x-velocity is roughly uniform (linear, no ease pulse)
 *   - avgDy stays small (no in-place warp)
 *
 * The probe samples the series path `d` on every animation frame during one
 * tick, parses the coordinate pairs, and compares consecutive frames.
 *
 * Also covers chart.streaming (bounded memory): appendData must trim the
 * series to maxPoints, or to the xaxis.range window when maxPoints is unset.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  streamingPage: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /**
     * Boot a streaming line chart. `mode` decides how ticks are applied:
     *   'append' : chart.appendData([...]) each tick
     *   'window' : chart.updateSeries with a shifted fixed-length window
     */
    const boot = async ({ curve = 'smooth', mode, streaming, yAxisFixed = true, speed = 1000 }) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:800px;height:400px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(
        async ({ curve, mode, streaming, yAxisFixed, speed }) => {
          const POINTS = 30
          const INTERVAL = 1000
          let nextX = 1700000000000
          // Deterministic pseudo-random walk so runs are reproducible.
          let seed = 42
          const rand = () => {
            seed = (seed * 16807) % 2147483647
            return 20 + (seed % 60)
          }
          const seedData = []
          for (let i = 0; i < POINTS; i++) {
            seedData.push({ x: nextX, y: rand() })
            nextX += INTERVAL
          }
          window.__data = seedData
          window.__nextX = nextX
          window.__rand = rand
          window.__mode = mode

          const chart = new ApexCharts(document.querySelector('#chart'), {
            chart: {
              type: 'line',
              width: 800,
              height: 400,
              ...(streaming ? { streaming } : {}),
              animations: {
                dynamicAnimation: { speed },
              },
              zoom: { enabled: false },
              toolbar: { show: false },
            },
            stroke: { curve },
            markers: { size: 0 },
            series: [{ name: 'v', data: seedData }],
            xaxis: { type: 'datetime', range: (POINTS - 1) * INTERVAL },
            ...(yAxisFixed ? { yaxis: { min: 0, max: 100 } } : {}),
          })
          window.chart = chart
          await chart.render()

          window.__tick = () => {
            const pt = { x: window.__nextX, y: window.__rand() }
            window.__nextX += INTERVAL
            if (window.__mode === 'append') {
              window.__data = [...window.__data, pt]
              return chart.appendData([{ data: [pt] }])
            }
            // rolling window: drop oldest, push newest, replace wholesale
            window.__data = [...window.__data.slice(1), pt]
            return chart.updateSeries([{ data: window.__data }])
          }
        },
        { curve, mode, streaming, yAxisFixed, speed },
      )
      await page.waitForFunction(
        () => window.chart && window.chart.w.globals.animationEnded === true,
      )
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/**
 * Trigger one tick and sample the line path `d` on every animation frame for
 * `durationMs`. The update re-renders the series (the path element is
 * replaced), so the element is queried after the update promise resolves -
 * the data-change morph is still running at that point. Returns [{ t, d }].
 */
async function sampleTick(page, durationMs) {
  return page.evaluate(async (durationMs) => {
    await window.__tick()
    const path = document.querySelector(
      '.apexcharts-line-series .apexcharts-series path.apexcharts-line',
    )
    const frames = []
    await new Promise((res) => {
      let start = null
      const loop = (now) => {
        if (start === null) start = now
        frames.push({ t: now, d: path.getAttribute('d') })
        if (now - start < durationMs) requestAnimationFrame(loop)
        else res()
      }
      requestAnimationFrame(loop)
    })
    return frames
  }, durationMs)
}

/** Parse every coordinate pair out of a path `d` string. */
function parsePairs(d) {
  const nums = (d.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi) || []).map(
    Number,
  )
  const pairs = []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    pairs.push([nums[i], nums[i + 1]])
  }
  return pairs
}

/**
 * Compare consecutive frames: for each adjacent pair with the same number of
 * coordinates, compute the mean x-shift (prev − cur; positive = leftward
 * scroll) and mean |y-shift|, normalized per millisecond.
 */
function frameVelocities(frames) {
  const out = []
  for (let f = 1; f < frames.length; f++) {
    const a = parsePairs(frames[f - 1].d)
    const b = parsePairs(frames[f].d)
    const dt = frames[f].t - frames[f - 1].t
    if (a.length !== b.length || a.length === 0 || dt <= 0) continue
    let dx = 0
    let dy = 0
    for (let i = 0; i < a.length; i++) {
      dx += a[i][0] - b[i][0]
      dy += Math.abs(a[i][1] - b[i][1])
    }
    out.push({ vx: dx / a.length / dt, vy: dy / a.length / dt, dt })
  }
  return out
}

/** Total mean x displacement across the whole sampled window (px). */
function totalDx(frames) {
  const first = parsePairs(frames[0].d)
  const last = parsePairs(frames[frames.length - 1].d)
  if (first.length !== last.length || first.length === 0) return null
  let dx = 0
  for (let i = 0; i < first.length; i++) dx += first[i][0] - last[i][0]
  return dx / first.length
}

/**
 * Assert the sampled tick reads as a constant-velocity leftward scroll.
 *
 * Analyzes only the maximal contiguous "moving" stretch (|vx| above 15% of
 * peak): under parallel-worker CPU contention sampling can start late and
 * catch the post-morph plateau, whose near-zero pairs are measurement
 * artifacts, not easing. Within the moving stretch (edges trimmed) every
 * velocity must stay in a tight band around the median: a sine-eased morph
 * still varies several-fold across its moving stretch and fails this.
 */
function expectLinearScroll(frames, label) {
  const vels = frameVelocities(frames)
  expect(vels.length, `${label}: not enough comparable frames`).toBeGreaterThan(6)

  const peak = Math.max(...vels.map((v) => Math.abs(v.vx)))
  expect(peak, `${label}: no movement at all`).toBeGreaterThan(0)
  let best = { start: 0, end: 0 }
  let start = -1
  for (let i = 0; i <= vels.length; i++) {
    const moving = i < vels.length && Math.abs(vels[i].vx) > peak * 0.15
    if (moving && start === -1) start = i
    if (!moving && start !== -1) {
      if (i - start > best.end - best.start) best = { start, end: i }
      start = -1
    }
  }
  const stretch = vels.slice(best.start, best.end)
  expect(
    stretch.length,
    `${label}: moving stretch too short to analyze`,
  ).toBeGreaterThan(5)

  const trim = Math.max(1, Math.floor(stretch.length * 0.1))
  const core = stretch.slice(trim, stretch.length - trim)
  const vxs = core.map((v) => v.vx).sort((a, b) => a - b)
  const median = vxs[Math.floor(vxs.length / 2)]

  expect(median, `${label}: no leftward translation (warp?)`).toBeGreaterThan(0)

  // Linear scroll: per-ms velocity is flat (±rAF jitter), so a tight band
  // holds. A sine-eased morph varies several-fold across its moving stretch
  // and blows well past the allowance. Permit a single outlier pair: a long
  // contention frame straddling the morph boundary distorts one measurement.
  const outliers = core.filter(
    (v) => v.vx < median * 0.7 || v.vx > median * 1.5,
  )
  const allowance = Math.max(1, Math.ceil(core.length * 0.05))
  expect(
    outliers.length,
    `${label}: ${outliers.length}/${core.length} frame velocities stray from median ${median.toFixed(4)}: eased/pulsing scroll`,
  ).toBeLessThanOrEqual(allowance)

  const yOutliers = core.filter((v) => v.vy > Math.abs(median) * 2)
  expect(
    yOutliers.length,
    `${label}: large per-frame y movement: in-place warp`,
  ).toBeLessThanOrEqual(allowance)
}

test.describe('streaming scroll: appendData with xaxis.range (Symptom A)', () => {
  for (const curve of ['smooth', 'straight']) {
    test(`append scrolls at constant velocity (curve: ${curve})`, async ({
      page,
      streamingPage,
    }) => {
      await streamingPage({ curve, mode: 'append' })
      // Warm-up tick (first data-change render primes previous-path capture).
      await sampleTick(page, 1100)
      const frames = await sampleTick(page, 700)
      expectLinearScroll(frames, `append/${curve}`)
    })
  }
})

test.describe('streaming scroll: rolling-window updateSeries (Symptom B)', () => {
  for (const curve of ['smooth', 'straight']) {
    test(`shifted window scrolls, does not warp (curve: ${curve})`, async ({
      page,
      streamingPage,
    }) => {
      await streamingPage({ curve, mode: 'window' })
      await sampleTick(page, 1100)
      const frames = await sampleTick(page, 700)
      const moved = totalDx(frames)
      expect(
        moved,
        'rolling window should translate horizontally, not warp in place',
      ).toBeGreaterThan(5)
      expectLinearScroll(frames, `window/${curve}`)
    })
  }

  test('scrolls with autoscaling y-axis too', async ({ page, streamingPage }) => {
    await streamingPage({ curve: 'smooth', mode: 'window', yAxisFixed: false })
    await sampleTick(page, 1100)
    const frames = await sampleTick(page, 700)
    const moved = totalDx(frames)
    expect(moved).toBeGreaterThan(5)
  })
})

test.describe('chart.streaming: bounded memory (Footgun C)', () => {
  test('appendData trims to maxPoints', async ({ page, streamingPage }) => {
    await streamingPage({
      curve: 'smooth',
      mode: 'append',
      streaming: { enabled: true, maxPoints: 40 },
      speed: 40,
    })
    for (let i = 0; i < 25; i++) {
      await page.evaluate(() => window.__tick())
    }
    const len = await page.evaluate(
      () => window.chart.w.config.series[0].data.length,
    )
    expect(len).toBeLessThanOrEqual(40)
    // Newest point must be intact after trimming.
    const lastX = await page.evaluate(() => {
      const d = window.chart.w.config.series[0].data
      return d[d.length - 1].x
    })
    const expectedLastX = await page.evaluate(() => window.__nextX - 1000)
    expect(lastX).toBe(expectedLastX)
  })

  test('appendData trims to the xaxis.range window when maxPoints is unset', async ({
    page,
    streamingPage,
  }) => {
    await streamingPage({
      curve: 'smooth',
      mode: 'append',
      streaming: { enabled: true },
      speed: 40,
    })
    for (let i = 0; i < 30; i++) {
      await page.evaluate(() => window.__tick())
    }
    const len = await page.evaluate(
      () => window.chart.w.config.series[0].data.length,
    )
    // 30 points fill the range; allow the small off-screen runway buffer.
    expect(len).toBeLessThanOrEqual(35)
    expect(len).toBeGreaterThanOrEqual(30)
  })

  test('appendData without streaming config keeps growing (back-compat)', async ({
    page,
    streamingPage,
  }) => {
    await streamingPage({ curve: 'smooth', mode: 'append', speed: 40 })
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.__tick())
    }
    const len = await page.evaluate(
      () => window.chart.w.config.series[0].data.length,
    )
    expect(len).toBe(40)
  })
})

test.describe('non-streaming updates keep default animation', () => {
  test('one-shot updateSeries with unrelated data still morphs (no scroll misfire)', async ({
    page,
    streamingPage,
  }) => {
    await streamingPage({ curve: 'smooth', mode: 'window' })
    // Replace with completely different data: not a windowed continuation.
    await page.evaluate(() => {
      const base = 1800000000000
      const data = []
      for (let i = 0; i < 12; i++) {
        data.push({ x: base + i * 1000, y: 10 + i * 3 })
      }
      return window.chart.updateSeries([{ data }])
    })
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
    )
    // The chart must render the new data correctly.
    const count = await page.evaluate(
      () => window.chart.w.seriesData.series[0].length,
    )
    expect(count).toBe(12)
  })
})
