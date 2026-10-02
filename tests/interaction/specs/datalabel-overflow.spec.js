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

    const boot = async (options, width = 500) => {
      await page.goto('about:blank')
      await page.setContent(
        `<div id="chart" style="width:${width}px;height:360px"></div>`,
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(async (opts) => {
        // The formatter has to be built here: functions do not survive
        // Playwright's serialization of the options object. `__fmt` picks
        // which one, since the crop cases below want a long value rather than
        // the category-name one the clamp cases are built around.
        const fmt = opts.__fmt
        delete opts.__fmt
        opts.dataLabels.formatter =
          fmt === 'long-value'
            ? (val) => `$${val},000,000.00`
            : (val, o) => `${o.w.globals.labels[o.dataPointIndex]}:  ${val}`
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

/**
 * The LAST data label must not run off the right of the canvas (#5036), and
 * must not be un-centred when it had room to stay put.
 *
 * The guard that does this lived in `plotDataLabelsText` and got both
 * directions wrong:
 *
 *  1. It tested the `textAnchor` LOCAL, which only the line/area path passes.
 *     The bar path leaves it undefined and lets the `||` fallback at the
 *     drawText call pick the configured value, so the guard was unreachable
 *     for bar and column: a narrow column chart clipped its last label clean
 *     off the canvas with nothing to catch it.
 *
 *  2. It tested `x === w.layout.gridWidth` rather than whether the label
 *     actually overflows. A line's last point sits exactly on the plot's
 *     right edge, so the two look equivalent, but a label may legitimately
 *     sit in the margin beside the plot, and only the canvas edge crops it.
 *     On a dual-axis chart, where that margin holds the second axis, it
 *     un-centred a label with ~140px to spare.
 *
 * Both halves are measured here: the bar must survive widths that used to
 * clip it, and a label with room must keep its anchor.
 */

const lastLabelOptions = (type) => ({
  chart: { type, height: 320, animations: { enabled: false } },
  series: [{ name: 'S', data: [30, 41, 35, 51] }],
  xaxis: { categories: ['A', 'B', 'C', 'D'] },
  // Long enough that the last label needs more room than its own slot.
  __fmt: 'long-value',
  dataLabels: { enabled: true, avoidOverlap: false },
  yaxis: { labels: { show: false } },
  legend: { show: false },
  tooltip: { enabled: false },
})

/** The last drawn label, with how far it escapes the canvas. */
const readLastLabel = (page) =>
  page.evaluate(() => {
    const svg = document.querySelector('.apexcharts-svg').getBoundingClientRect()
    const ls = [...document.querySelectorAll('.apexcharts-datalabel')].filter(
      (t) => (t.textContent || '').trim() !== '',
    )
    const last = ls[ls.length - 1]
    if (!last) return null
    const r = last.getBoundingClientRect()
    return {
      text: last.textContent.trim(),
      anchor: last.getAttribute('text-anchor'),
      overRight: +(r.right - svg.right).toFixed(2),
    }
  })

test.describe('the last data label is kept on the canvas', () => {
  // 280 and 240 are the widths at which a column's last label used to run
  // off the canvas by 0.7px and 5.7px respectively.
  for (const width of [420, 360, 320, 280, 240]) {
    for (const type of ['bar', 'line']) {
      test(`${type} at ${width}px keeps its last label on the canvas`, async ({
        boot,
        page,
      }) => {
        await boot(lastLabelOptions(type), width)
        const last = await readLastLabel(page)
        expect(last, 'no label drawn at all').not.toBeNull()
        expect(
          last.overRight,
          `"${last.text}" escapes ${last.overRight}px past the canvas`,
        ).toBeLessThanOrEqual(0.5)
      })
    }
  }

  test('a label with room to spare keeps its anchor', async ({
    boot,
    page,
  }) => {
    // The reported case: a dual-axis chart, whose right margin holds the
    // second axis, so the last point sits well inside the canvas. Every
    // label should stay centred on its own mark.
    await boot(
      {
        chart: { type: 'line', height: 360, animations: { enabled: false } },
        series: [
          { name: 'Booked', type: 'column', data: [51, 13, 11, 23, 59] },
          { name: 'Invoiced', type: 'line', data: [51, 13, 11, 23, 59] },
        ],
        xaxis: { categories: ['May', 'Jun', 'Jul', 'Aug', 'Sep'] },
        yaxis: [
          { seriesName: 'Booked' },
          { seriesName: 'Invoiced', opposite: true },
        ],
        stroke: { width: [0, 2] },
        markers: { size: [0, 4] },
        __fmt: 'long-value',
        dataLabels: { enabled: true, avoidOverlap: false },
        legend: { show: false },
        tooltip: { enabled: false },
      },
      650,
    )

    const anchors = await page.evaluate(() =>
      [...document.querySelectorAll('.apexcharts-datalabel')]
        .filter((t) => (t.textContent || '').trim() !== '')
        .map((t) => t.getAttribute('text-anchor')),
    )
    expect(anchors).toHaveLength(10)
    // Not one of them is flipped: the old coordinate test flipped the line
    // series' last label and left the column's alone, so the two labels for
    // the same category disagreed by half a label width.
    expect([...new Set(anchors)]).toEqual(['middle'])
  })
})
