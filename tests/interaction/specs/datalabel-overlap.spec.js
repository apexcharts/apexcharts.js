/**
 * Data labels must not land on top of each other.
 *
 * Reported from a dual-axis combo chart: a column series and a line series
 * whose values coincided printed both labels in the same place, so the chart
 * read "$59.53K$59.53K". A waterfall in the same report collided a different
 * way, between adjacent narrow bars in ONE series.
 *
 * `dataLabels.avoidOverlap` covers both. Two things make this measurable only
 * in a browser, which is why the guard lives here and not in the unit suite:
 *
 *  1. e2e cannot police it. Overlapping labels are baked into the reference
 *     PNG, so the diff is 0% and the sample passes forever while showing
 *     unreadable text. Exactly the reasoning in datalabel-overflow.spec.js.
 *
 *  2. On a multi-axis chart the two axes are scaled independently, so whether
 *     two labels collide is NOT a function of how close the values are. The
 *     `deltas` sweep below is the evidence: at +0.5% the labels collide, at
 *     +1% they are clear, and at +15% they collide again. Only measured pixel
 *     boxes can decide it, so the test measures pixel boxes.
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
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    const boot = async (options, width = 1100) => {
      await page.goto('about:blank')
      await page.setContent(
        `<div id="chart" style="width:${width}px;height:600px"></div>`,
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opts) => {
        // Functions do not survive Playwright's serialization, so the
        // formatters are rebuilt in the page.
        const money = (v) =>
          '$' +
          (v / 1000).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) +
          'K'
        if (opts.dataLabels) opts.dataLabels.formatter = money
        if (Array.isArray(opts.yaxis)) {
          opts.yaxis.forEach((y) => {
            y.labels = { ...y.labels, formatter: money }
          })
        }
        window.chart = new ApexCharts(document.querySelector('#chart'), opts)
        await window.chart.render()
      }, options)
      await page.waitForFunction(
        () => window.chart?.w?.globals?.animationEnded === true,
        { timeout: 8000 },
      )
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

const BASE = [51.02e3, 13.85e3, 11.63e3, 23.82e3, 59.53e3]
const CATS = ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026']

/**
 * The reported chart: a column series and a line series on two independent
 * y-axes, both printing labels with background pills.
 *
 * @param {number} delta fractional offset of the line series from the columns;
 *   0 is the reported case, where the two series carry identical values.
 * @param {any} [avoidOverlap] the option under test
 */
const comboOptions = (delta, avoidOverlap) => ({
  chart: { type: 'line', height: 600, animations: { enabled: false } },
  series: [
    { name: 'Bar', type: 'column', data: BASE.map((v) => +v.toFixed(2)) },
    {
      name: 'Line',
      type: 'line',
      data: BASE.map((v) => +(v * (1 + delta)).toFixed(2)),
    },
  ],
  xaxis: { categories: CATS },
  yaxis: [{ seriesName: 'Bar' }, { seriesName: 'Line', opposite: true }],
  colors: ['#8bc34a', '#ef9a9a'],
  fill: { opacity: [0.25, 1] },
  stroke: { width: [0, 1] },
  markers: { size: [0, 3] },
  dataLabels: {
    enabled: true,
    ...(avoidOverlap === undefined ? {} : { avoidOverlap }),
    background: { enabled: true, borderWidth: 0, opacity: 1 },
  },
  legend: { show: false },
  tooltip: { enabled: false },
})

/** Many narrow steps, wide currency labels, no background pills. */
const waterfallOptions = (avoidOverlap) => ({
  chart: { type: 'waterfall', height: 620, animations: { enabled: false } },
  series: [
    {
      name: 'Revenue',
      data: [
        168.5e6, 489.4e6, 1.9e9, -811.5e6, 389.5e6, -703e6, 358e6, 138.3e6,
        -312.7e6, -346.8e6, 390.3e6, 109.7e6, -8.4e6, 14.6e6,
      ].map((y, i) => ({ x: `Q${i + 1}`, y })),
    },
  ],
  dataLabels: {
    enabled: true,
    ...(avoidOverlap === undefined ? {} : { avoidOverlap }),
    background: { enabled: false },
    style: { fontSize: '11px' },
  },
  legend: { show: false },
  tooltip: { enabled: false },
})

/**
 * Every drawn data label as the viewer sees it: the background pill when there
 * is one, otherwise the glyph box. Hidden labels are excluded, which is what
 * makes the "nothing collides" assertion non-vacuous alongside the count.
 */
const readLabels = (page) =>
  page.evaluate(() => {
    const groups = [...document.querySelectorAll('g.apexcharts-datalabels')]
    const grid = document
      .querySelector('.apexcharts-grid')
      .getBoundingClientRect()

    return [...document.querySelectorAll('text.apexcharts-datalabel')]
      .filter((t) => (t.textContent || '').trim() !== '')
      .filter((t) => getComputedStyle(t).display !== 'none')
      .map((t) => {
        // The pill is inserted immediately before its text.
        const prev = t.previousElementSibling
        const pill =
          prev && prev.tagName.toLowerCase() === 'rect' ? prev : null
        const r = (pill ?? t).getBoundingClientRect()
        return {
          series: groups.indexOf(t.closest('g.apexcharts-datalabels')),
          text: t.textContent.trim(),
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          overTop: +(grid.top - r.top).toFixed(2),
          overBottom: +(r.bottom - grid.bottom).toFixed(2),
        }
      })
      .filter((l) => l.w > 0)
  })

/** Overlapping pairs, described well enough to debug from the failure alone. */
const collisions = (labels) => {
  const out = []
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = labels[i]
      const b = labels[j]
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
      if (ox > 0.5 && oy > 0.5) {
        out.push(
          `"${a.text}"(s${a.series}) x "${b.text}"(s${b.series}) ` +
            `overlap ${ox.toFixed(1)}x${oy.toFixed(1)}px`,
        )
      }
    }
  }
  return out
}

test.describe('dataLabels.avoidOverlap on a dual-axis combo chart', () => {
  // 0 is the reported case. The rest are the deltas the repro sweep found to
  // collide; 0.01 and 0.04 do not collide and are here so the pass is also
  // shown to leave a clean chart alone.
  const deltas = [0, 0.002, 0.005, 0.01, 0.04, 0.15, -0.01, -0.05]

  for (const delta of deltas) {
    test(`line series offset ${delta * 100}% — no label overlaps`, async ({
      boot,
      page,
    }) => {
      await boot(comboOptions(delta, true))
      const labels = await readLabels(page)

      // Guard the guard: both series must still print all five labels, so a
      // chart that solved the collision by hiding everything cannot pass.
      expect(labels).toHaveLength(BASE.length * 2)
      expect(collisions(labels)).toEqual([])
    })
  }

  test('the collision is real with the option off (the tests are not vacuous)', async ({
    boot,
    page,
  }) => {
    await boot(comboOptions(0, false))
    const labels = await readLabels(page)
    expect(labels).toHaveLength(BASE.length * 2)
    // One collision per category: every pair of coincident labels.
    expect(collisions(labels)).toHaveLength(BASE.length)
  })

  test('the option is on by default', async ({ boot, page }) => {
    // The reported chart configures nothing; it has to come out clean.
    await boot(comboOptions(0, undefined))
    const labels = await readLabels(page)
    expect(labels).toHaveLength(BASE.length * 2)
    expect(collisions(labels)).toEqual([])
  })

  test('separated labels stay inside the plot', async ({ boot, page }) => {
    // The September pair sits hard against the top of the grid, so the upper
    // label has nowhere to go and the push has to run downwards instead.
    await boot(comboOptions(0, true))
    for (const l of await readLabels(page)) {
      expect(l.overTop, `"${l.text}" pushed above the plot`).toBeLessThan(24)
      expect(l.overBottom, `"${l.text}" pushed below the plot`).toBeLessThan(24)
    }
  })

  test('a label stays next to its own mark', async ({ boot, page }) => {
    // De-overlapping is only worth doing while the label still reads as its
    // mark's. maxShift is what bounds that, so compare against the unmoved
    // layout, which now takes an explicit `false`.
    await boot(comboOptions(0, false))
    const before = await readLabels(page)
    await boot(comboOptions(0, true))
    const after = await readLabels(page)

    expect(after).toHaveLength(before.length)
    for (let i = 0; i < before.length; i++) {
      const moved = Math.abs(after[i].y - before[i].y)
      expect(moved, `"${before[i].text}" travelled ${moved.toFixed(1)}px`)
        .toBeLessThanOrEqual(before[i].h + 1)
    }
  })

  test('honours an explicit gap', async ({ boot, page }) => {
    await boot(comboOptions(0, { gap: 10 }))
    const labels = (await readLabels(page)).sort((a, b) => a.x - b.x || a.y - b.y)
    expect(collisions(labels)).toEqual([])

    // Each category's pair should now be a clear 10px apart.
    for (let i = 0; i < labels.length; i += 2) {
      const [top, bottom] =
        labels[i].y < labels[i + 1].y
          ? [labels[i], labels[i + 1]]
          : [labels[i + 1], labels[i]]
      expect(bottom.y - (top.y + top.h)).toBeGreaterThanOrEqual(9)
    }
  })
})

// 640px is the reported chart's width. Fourteen steps in that space makes the
// labels wider than the bars they belong to, which is the whole failure mode;
// at the 1100px the combo tests use there is room and nothing collides.
const WATERFALL_WIDTH = 640

test.describe('dataLabels.avoidOverlap on a dense waterfall', () => {
  test('adjacent steps in one series do not collide', async ({ boot, page }) => {
    await boot(waterfallOptions(true), WATERFALL_WIDTH)
    const labels = await readLabels(page)
    expect(labels).toHaveLength(14)
    expect(collisions(labels)).toEqual([])
  })

  test('the same chart collides with the option off', async ({ boot, page }) => {
    await boot(waterfallOptions(false), WATERFALL_WIDTH)
    expect(collisions(await readLabels(page)).length).toBeGreaterThan(0)
  })

  test('a waterfall configuring nothing comes out clean', async ({
    boot,
    page,
  }) => {
    await boot(waterfallOptions(), WATERFALL_WIDTH)
    expect(collisions(await readLabels(page))).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// The rest of the matrix. These are the cases an audit across chart types,
// orientations and label positions turned up, each of which was a defect
// before it was a test.
// ---------------------------------------------------------------------------

/** Two series a hair apart, so their labels land on each other. */
const CLOSE = [
  { name: 'S1', data: [30, 41, 35, 51, 49, 62] },
  { name: 'S2', data: [31, 40, 36, 50, 50, 61] },
]
const CLOSE_CATS = ['A', 'B', 'C', 'D', 'E', 'F']

/** @param {string} type @param {any} [extra] */
const simple = (type, extra = {}) => ({
  chart: { type, height: 420, animations: { enabled: false } },
  series: CLOSE,
  xaxis: { categories: CLOSE_CATS },
  dataLabels: { enabled: true },
  tooltip: { enabled: false },
  ...extra,
})

test.describe('avoidOverlap across chart types', () => {
  for (const type of ['line', 'area']) {
    test(`${type}: coincident labels separate and none are lost`, async ({
      boot,
      page,
    }) => {
      await boot(simple(type, { dataLabels: { enabled: true, avoidOverlap: false } }))
      const before = await readLabels(page)
      expect(collisions(before).length).toBeGreaterThan(0)

      await boot(simple(type))
      const after = await readLabels(page)
      expect(after).toHaveLength(before.length)
      expect(collisions(after)).toEqual([])
    })
  }

  test('radar is left alone: its labels ring a centre, not a value axis', async ({
    boot,
    page,
  }) => {
    // Nudging these vertically runs out of budget on a small polygon and the
    // pass started deleting labels. Radial types opt out entirely, so the
    // chart renders exactly as it did before the feature existed.
    await boot(simple('radar', { dataLabels: { enabled: true, avoidOverlap: false } }))
    const before = await readLabels(page)
    await boot(simple('radar'))
    const after = await readLabels(page)

    expect(after).toHaveLength(before.length)
    for (let i = 0; i < before.length; i++) {
      expect(after[i].y).toBeCloseTo(before[i].y, 1)
      expect(after[i].x).toBeCloseTo(before[i].x, 1)
    }
  })
})

test.describe('avoidOverlap separates along the value axis', () => {
  const horizontalOptions = (avoidOverlap) => ({
    chart: { type: 'bar', height: 300, animations: { enabled: false } },
    plotOptions: { bar: { horizontal: true, dataLabels: { position: 'top' } } },
    series: [
      { name: 'S1', data: Array.from({ length: 9 }, (_, i) => 30 + i) },
      { name: 'S2', data: Array.from({ length: 9 }, (_, i) => 31 + i) },
    ],
    xaxis: { categories: Array.from({ length: 9 }, (_, i) => 'R' + i) },
    dataLabels: {
      enabled: true,
      ...(avoidOverlap === undefined ? {} : { avoidOverlap }),
    },
    tooltip: { enabled: false },
  })

  test('a horizontal bar moves its labels sideways, never across rows', async ({
    boot,
    page,
  }) => {
    // On a horizontal bar the vertical axis is the CATEGORY axis, so a
    // vertical nudge walks a label into the neighbouring row. It also could
    // not separate thin rows within budget, and dropped 8 of 18 labels.
    await boot(horizontalOptions(false))
    const before = await readLabels(page)
    expect(collisions(before).length).toBeGreaterThan(0)

    await boot(horizontalOptions(true))
    const after = await readLabels(page)

    expect(after).toHaveLength(before.length)
    expect(collisions(after)).toEqual([])
    for (let i = 0; i < before.length; i++) {
      expect(after[i].y, `"${before[i].text}" changed row`).toBeCloseTo(
        before[i].y,
        1,
      )
    }
    expect(after.some((l, i) => Math.abs(l.x - before[i].x) > 0.5)).toBe(true)
  })

  test('no label is pushed outside the plot, where it would be clipped', async ({
    boot,
    page,
  }) => {
    await boot(horizontalOptions(true))
    const grid = await page.evaluate(() => {
      const r = document.querySelector('.apexcharts-grid').getBoundingClientRect()
      return { left: r.left, right: r.right }
    })
    for (const l of await readLabels(page)) {
      expect(l.x + l.w, `"${l.text}" pushed past the right edge`)
        .toBeLessThanOrEqual(grid.right + 1)
    }
  })
})

test.describe('avoidOverlap never deletes a value by default', () => {
  const crowded = (avoidOverlap) => ({
    chart: { type: 'line', height: 260, animations: { enabled: false } },
    // Five series carrying the SAME values: five labels per category on one
    // pixel row, which needs five label-heights of separation and has a
    // budget of about one.
    series: Array.from({ length: 5 }, (_, s) => ({
      name: 'S' + s,
      data: [40, 41, 42],
    })),
    xaxis: { categories: ['A', 'B', 'C'] },
    dataLabels: {
      enabled: true,
      ...(avoidOverlap === undefined ? {} : { avoidOverlap }),
    },
    tooltip: { enabled: false },
  })

  test('an unseparable pile keeps every label', async ({ boot, page }) => {
    await boot(crowded(false))
    const before = await readLabels(page)
    await boot(crowded(true))
    const after = await readLabels(page)

    expect(after).toHaveLength(before.length)
    expect(after.length).toBe(15)
  })

  test('hide:true opts into dropping what cannot be separated', async ({
    boot,
    page,
  }) => {
    await boot(crowded({ hide: true }))
    const after = await readLabels(page)
    expect(after.length).toBeLessThan(15)
    expect(collisions(after)).toEqual([])
  })
})
