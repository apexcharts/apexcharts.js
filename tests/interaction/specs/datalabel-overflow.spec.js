/**
 * A bar data label must stay inside the plot area.
 *
 * e2e cannot police this. An overflowing label is baked into the reference
 * PNG, so the diff is 0% and the sample passes forever while visibly showing
 * clipped text. Three defects hid behind that, all of them in the clamp at the
 * end of `calculateBarsDataLabelsPosition`:
 *
 *  1. The clamp branched on the CONFIGURED `textAnchor`, but
 *     `drawCalculatedDataLabels` swaps start<->end for negative values on a
 *     horizontal bar. So for every negative series it guarded the opposite edge
 *     to the one the text was about to cross, and the label ran off the chart.
 *
 *  2. `getTextRects` measures via `drawText` without a weight, i.e. at
 *     'regular'. Data labels render at `fontWeight: 600`. Bolder is wider, so
 *     every width the clamp worked from was 3-7% short and the "clamped"
 *     label still poked out by a few pixels.
 *
 *  3. The `position:'center'` branch pre-shifts positive labels by
 *     `Math.max(textRects.width / 2, ...)`, which only makes sense for a
 *     'middle' anchor; with 'end' the text extends a FULL width to the left,
 *     so it escaped past the left edge.
 *
 * The matrix below is the same 3x3x3 (position x textAnchor x sign) grid the
 * samples/source/tests/position-* demos cover, but measured rather than
 * eyeballed, and squeezed into a narrower plot so the clamp is actually under
 * pressure. Each case also includes a near-zero value, which is the datum that
 * exposed all three defects: its bar has no width to hold the label, so the
 * label sits hard against the baseline with nothing to clamp it but the rule.
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

    const boot = async (options) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:500px;height:360px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opts) => {
        // The formatter has to be built here: functions do not survive
        // Playwright's serialization of the options object.
        opts.dataLabels.formatter = (val, o) =>
          `${o.w.globals.labels[o.dataPointIndex]}:  ${val}`
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

const CATEGORIES = [
  'United Kingdom',
  'United States',
  'South Korea',
  'Netherlands',
  'India',
]

// A near-zero value (index 2) is the important one: its bar cannot hold the
// label, so placement falls entirely to the clamp.
const DATA = {
  pos: [400, 1100, 1, 470, 1380],
  neg: [-400, -1100, -1, -470, -1380],
  mixed: [-400, 1100, -1, 470, -1380],
}

/**
 * @param {'top'|'center'|'bottom'} position
 * @param {'start'|'middle'|'end'} textAnchor
 * @param {'pos'|'neg'|'mixed'} sign
 * @param {Record<string, any>} [extra] merged into `dataLabels.style`
 */
const options = (position, textAnchor, sign, extra = {}) => ({
  chart: { type: 'bar', height: 360, animations: { enabled: false } },
  plotOptions: { bar: { horizontal: true, dataLabels: { position } } },
  // `boot` installs a deliberately long formatter (category name + value) so
  // the label is wider than most of the bars it has to sit on.
  dataLabels: {
    enabled: true,
    textAnchor,
    style: { colors: ['#333'], ...extra },
  },
  yaxis: { labels: { show: false } },
  xaxis: { categories: CATEGORIES },
  series: [{ name: 'S', data: DATA[sign] }],
})

/**
 * Every drawn data label, with how far it escapes the plot area on each side.
 * Positive `overLeft`/`overRight` means the glyph box crosses that edge.
 */
const readLabels = (page) =>
  page.evaluate(() => {
    const grid = document.querySelector('.apexcharts-grid').getBoundingClientRect()
    return Array.from(document.querySelectorAll('.apexcharts-datalabel'))
      .filter((t) => (t.textContent || '').trim() !== '')
      .map((t) => {
        const r = t.getBoundingClientRect()
        return {
          text: t.textContent.trim(),
          anchor: t.getAttribute('text-anchor'),
          overLeft: +(grid.left - r.left).toFixed(2),
          overRight: +(r.right - grid.right).toFixed(2),
        }
      })
  })

/** Labels are clamped to the plot edge exactly; allow only sub-pixel slack. */
const TOLERANCE = 1.5

/**
 * @param {{text: string, overLeft: number, overRight: number}[]} labels
 */
const escapees = (labels) =>
  labels
    .filter((l) => l.overLeft > TOLERANCE || l.overRight > TOLERANCE)
    .map(
      (l) =>
        `"${l.text}" escapes ${
          l.overLeft > l.overRight
            ? `${l.overLeft.toFixed(1)}px past the left`
            : `${l.overRight.toFixed(1)}px past the right`
        }`,
    )

test.describe('Bar data labels stay inside the plot area', () => {
  for (const position of ['top', 'center', 'bottom']) {
    for (const textAnchor of ['start', 'middle', 'end']) {
      for (const sign of ['pos', 'neg', 'mixed']) {
        test(`position:${position} textAnchor:${textAnchor} ${sign} values`, async ({
          boot,
          page,
        }) => {
          await boot(options(position, textAnchor, sign))
          const labels = await readLabels(page)

          // Guard the guard: a chart that drew nothing would pass vacuously.
          expect(labels).toHaveLength(CATEGORIES.length)
          expect(escapees(labels)).toEqual([])
        })
      }
    }
  }
})

test.describe('the specific defects', () => {
  test('a negative series clamps against the anchor it RENDERS with, not the configured one', async ({
    boot,
    page,
  }) => {
    // textAnchor 'end' + negative values renders as 'start', so the text grows
    // RIGHT of its anchor point. Clamping the configured 'end' guarded the left
    // edge and let the widest label run off the right of the chart.
    await boot(options('center', 'end', 'neg'))
    const labels = await readLabels(page)

    expect(labels.every((l) => l.anchor === 'start')).toBe(true)
    expect(escapees(labels)).toEqual([])
  })

  test('the mirror case: configured start, rendered end, must not escape left', async ({
    boot,
    page,
  }) => {
    await boot(options('top', 'start', 'neg'))
    const labels = await readLabels(page)

    expect(labels.every((l) => l.anchor === 'end')).toBe(true)
    expect(escapees(labels)).toEqual([])
  })

  test('a positive `center` + `end` label does not escape past the left edge', async ({
    boot,
    page,
  }) => {
    // The `Math.max(textRects.width / 2, ...)` pre-shift assumes a 'middle'
    // anchor. With 'end' the text needs a full width of room to its left.
    await boot(options('center', 'end', 'pos'))
    expect(escapees(await readLabels(page))).toEqual([])
  })

  test('labels are measured at the weight they render at', async ({
    boot,
    page,
  }) => {
    // The clamp can only be as good as the width it is given. Measuring a
    // heavy label at 'regular' under-reports it, and the label is clamped to a
    // spot that still overflows. 900 exaggerates a gap that exists at the
    // default 600 too.
    for (const fontWeight of [400, 600, 900]) {
      await boot(options('center', 'end', 'neg', { fontWeight }))
      const labels = await readLabels(page)
      expect(
        escapees(labels),
        `overflow at fontWeight ${fontWeight}`,
      ).toEqual([])
    }
  })

  test('a label still fits when it is wider than its own bar and the plot is tight', async ({
    boot,
    page,
  }) => {
    // Every bar tiny, so no bar can hold its label and all five clamp at once.
    const opts = options('center', 'end', 'pos')
    opts.series = [{ name: 'S', data: [1, 2, 1, 2, 1] }]
    await boot(opts)

    const labels = await readLabels(page)
    expect(labels).toHaveLength(CATEGORIES.length)
    expect(escapees(labels)).toEqual([])
  })
})
