/**
 * #4886: a stacked area series drawn wildly out of proportion.
 *
 * The title blames one series and the issue is filed under hidden series;
 * neither is the cause. In the reporter's data two series carry 12 points and
 * the third carries 9, and stacking resolved each series' baseline as
 * `prevSeriesY[previous][j + 1]` -- by data-point ORDINAL. On a numeric or
 * datetime axis every series carries its own x array, so from the first gap
 * onward the Nth point of one series is a different date from the Nth point of
 * another, and a series was stacked onto a baseline belonging to the wrong x.
 * Measured on the reporter's own data: up to 92px of displacement in a 387px
 * plot.
 *
 * The oracle here is the workaround that was posted on the issue: pad every
 * series onto the union of all x values with zeros. That makes the arrays equal
 * length, so ordinal and x agree and the old code was already right. Each test
 * therefore renders the SAME data twice, ragged and padded, and asserts the two
 * agree point for point. That is stronger than pinning pixel numbers, and it
 * cannot rot when the layout changes.
 *
 * Two of these cases were already correct before the fix and are kept as
 * invariants (a series that ends early, and equal-length series). Two more guard
 * the far commoner category axis, where the ordinal IS the identity and nothing
 * should have changed.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

/** The reporter's data, from the fiddle linked on the issue. */
const REPORTED = [
  {
    name: 'A',
    data: [
      [1667185200000, 45524967576.116],
      [1669777200000, 45115005658.0266],
      [1672455600000, 44154322623.6314],
      [1675134000000, 43112951647.9856],
      [1677553200000, 42322710425.876],
      [1680231600000, 41666388761.1247],
      [1682827200000, 44714151761.382],
      [1685505600000, 44689309406.4641],
      [1688097600000, 44422664542.7118],
      [1690776000000, 42999007751.5727],
      [1693454400000, 42900674201.1898],
      [1695783600000, 43372342771.4754],
    ],
  },
  {
    // the same series minus 1672455600000, 1675134000000 and 1688097600000
    name: 'B',
    data: [
      [1667185200000, 44670115],
      [1669777200000, 45136391],
      [1677553200000, 475632568],
      [1680231600000, 141043132],
      [1682827200000, 9497032806],
      [1685505600000, 11420832216],
      [1690776000000, -965438308],
      [1693454400000, -5945760271],
      [1695783600000, 3697090574],
    ],
  },
  {
    name: 'C',
    data: [
      [1667185200000, 14088553730.025],
      [1669777200000, 16344858569.64],
      [1672455600000, 15584725602.669],
      [1675134000000, 15868250637.274],
      [1677553200000, 14619213872.0675],
      [1680231600000, 13661880230.586],
      [1682827200000, 10986316416.95],
      [1685505600000, 10453902054.815],
      [1688097600000, 10325742369.09],
      [1690776000000, 10868373001.735],
      [1693454400000, 11095063861.59],
      [1695783600000, 11664033437.93],
    ],
  },
]

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  /**
   * Render a stacked chart and read the geometry back off its markers.
   * `pad: true` fills every series onto the union of all x with zeros.
   */
  render: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /**
     * @param {{series: any[], pad?: boolean, xaxisType?: string,
     *          curve?: string, categories?: string[]}} o
     */
    const render = async (o) => {
      await page.goto('about:blank')
      await page.setContent('<div id="chart" style="width:800px"></div>')
      await page.addScriptTag({ path: distPath })
      return page.evaluate(async (opt) => {
        let series = opt.series.map((s) => ({
          name: s.name,
          data: s.data.map((/** @type {any} */ p) => (Array.isArray(p) ? [...p] : p)),
        }))
        if (opt.pad) {
          const xs = [
            ...new Set(series.flatMap((s) => s.data.map((/** @type {any} */ d) => d[0]))),
          ].sort((a, b) => a - b)
          series = series.map((s) => {
            const m = new Map(s.data.map((/** @type {any} */ d) => [d[0], d[1]]))
            return {
              name: s.name,
              data: xs.map((x) => [x, m.has(x) ? m.get(x) : 0]),
            }
          })
        }
        window.chart = new ApexCharts(document.querySelector('#chart'), {
          chart: {
            type: 'area',
            stacked: true,
            height: 400,
            width: 800,
            animations: { enabled: false },
          },
          series,
          xaxis: {
            type: opt.xaxisType ?? 'numeric',
            ...(opt.categories ? { categories: opt.categories } : {}),
          },
          dataLabels: { enabled: false },
          markers: { size: 4 },
          stroke: { curve: opt.curve ?? 'straight' },
        })
        await window.chart.render()

        const gridHeight = window.chart.w.layout.gridHeight
        /** @type {Record<string, {x: number, y: number}[]>} */
        const out = {}
        document.querySelectorAll('.apexcharts-series').forEach((g) => {
          const pts = [...g.querySelectorAll('.apexcharts-marker')]
            .map((m) => ({
              x: +parseFloat(m.getAttribute('cx')).toFixed(1),
              y: +parseFloat(m.getAttribute('cy')).toFixed(1),
            }))
            // Drop the off-grid virtual point a null-bearing series parks below
            // the plot (#3641). It is not a data vertex, and counting it shifts
            // every comparison by one -- it made an earlier version of this
            // check report a mismatch on the FIRST series, which has no
            // baseline to get wrong.
            .filter((p) => p.y <= gridHeight + 0.5)
            .sort((a, b) => a.x - b.x)
          if (pts.length) out[g.getAttribute('seriesName')] = pts
        })
        return { gridHeight, series: out }
      }, o)
    }

    await use(render)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/**
 * Every point of the ragged render must sit where the padded render puts the
 * same x. Half a pixel of slack, which is well under the 39px to 157px the
 * ordinal lookup was out by.
 */
function expectMatchesPadded(ragged, padded) {
  for (const name of Object.keys(padded.series)) {
    const got = ragged.series[name]
    expect(got, `series ${name} did not render`).toBeTruthy()
    const oracle = new Map(padded.series[name].map((p) => [p.x, p.y]))
    for (const p of got) {
      expect(
        oracle.has(p.x),
        `series ${name}: no padded point at x=${p.x}`,
      ).toBe(true)
      expect(
        p.y,
        `series ${name} at x=${p.x}: ragged ${p.y} vs padded ${oracle.get(p.x)}`,
      ).toBeCloseTo(oracle.get(p.x), 1)
    }
  }
}

/** No vertex may land outside the plot. */
function expectOnPlot(r) {
  for (const [name, pts] of Object.entries(r.series)) {
    const off = pts.filter((p) => p.y < -0.5 || p.y > r.gridHeight + 0.5)
    expect(
      off,
      `series ${name} drew ${off.length} point(s) outside the plot: ${JSON.stringify(off)}`,
    ).toEqual([])
  }
}

const A5 = { name: 'A', data: [[1, 10], [2, 10], [3, 10], [4, 10], [5, 10]] }
const C5 = { name: 'C', data: [[1, 20], [2, 20], [3, 20], [4, 20], [5, 20]] }

test.describe('Stacked series with ragged x arrays (#4886)', () => {
  test("the reporter's own data stacks on the right dates", async ({
    render,
  }) => {
    const ragged = await render({ series: REPORTED, xaxisType: 'datetime' })
    const padded = await render({
      series: REPORTED,
      pad: true,
      xaxisType: 'datetime',
    })

    // pre-fix the deltas ran to 92px of a 387px plot
    expectMatchesPadded(ragged, padded)
    expectOnPlot(ragged)
    // and B really is the short one, so this was the ragged case
    expect(ragged.series.B).toHaveLength(9)
    expect(ragged.series.A).toHaveLength(12)
  })

  test('a middle series missing interior x values', async ({ render }) => {
    const series = [A5, { name: 'B', data: [[1, 5], [2, 5], [5, 5]] }, C5]

    // pre-fix: C off by 39.2px at two of its five points
    expectMatchesPadded(
      await render({ series }),
      await render({ series, pad: true }),
    )
  })

  test('a middle series that starts late', async ({ render }) => {
    const series = [A5, { name: 'B', data: [[4, 5], [5, 5]] }, C5]

    // pre-fix: C off by 39.2px at four of its five points
    expectMatchesPadded(
      await render({ series }),
      await render({ series, pad: true }),
    )
  })

  test('the FIRST series is the short one', async ({ render }) => {
    // the worst of the set: the baseline series has no value at three of the x
    // the series above it draws, so every ordinal is offset. Pre-fix B was out
    // by 157px of a ~360px plot.
    const series = [
      { name: 'A', data: [[3, 10], [4, 10]] },
      { name: 'B', data: [[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]] },
    ]

    expectMatchesPadded(
      await render({ series }),
      await render({ series, pad: true }),
    )
  })

  test('a middle series that ends early (already correct, kept as an invariant)', async ({
    render,
  }) => {
    // This one the ordinal lookup got right by accident: the draw loop runs
    // dataPoints - 1 times for EVERY series, so a short series still leaves a
    // full-length yArrj sitting on the running baseline past its own end.
    const series = [A5, { name: 'B', data: [[1, 5], [2, 5]] }, C5]

    expectMatchesPadded(
      await render({ series }),
      await render({ series, pad: true }),
    )
  })

  test('equal-length series are untouched (invariant)', async ({ render }) => {
    const series = [
      { name: 'A', data: [[1, 10], [2, 12], [3, 8], [4, 14], [5, 9]] },
      { name: 'B', data: [[1, 5], [2, 7], [3, 3], [4, 6], [5, 4]] },
      { name: 'C', data: [[1, 20], [2, 18], [3, 22], [4, 17], [5, 21]] },
    ]

    // padding is a no-op here, so this asserts the fix changed nothing in the
    // case that every existing stacked chart is in
    expectMatchesPadded(
      await render({ series }),
      await render({ series, pad: true }),
    )
  })

  test('a null in a middle series no longer throws the next series off the plot', async ({
    render,
  }) => {
    // Same root cause, different trigger, and the reason this fix is not gated
    // to ragged arrays only. With a smooth curve a null pushes `null` into
    // yArrj, and the ordinal lookup handed that straight to the next series as
    // its baseline, where it coerced to 0 and drew the point at the very top of
    // the plot. Pre-fix: 2 of C's 5 points landed outside the plot.
    const r = await render({
      series: [
        A5,
        { name: 'B', data: [[1, 5], [2, null], [3, 5], [4, null], [5, 5]] },
        C5,
      ],
      curve: 'smooth',
    })

    expectOnPlot(r)
  })

  test('hiding a middle series matches never having it (#4984 shape)', async ({
    page,
    render,
  }) => {
    // #4984 reports a stacked area at the wrong y "when there are hidden
    // series" and may be this same bug seen through ragged data, so the
    // collapsed path is checked on ragged arrays specifically. Folding a series
    // into the running stack top skips collapsed ones, and this is what says so.
    await render({
      series: [A5, { name: 'B', data: [[1, 5], [2, 5], [5, 5]] }, C5],
    })

    const tops = () =>
      page.evaluate(() => {
        const gh = window.chart.w.layout.gridHeight
        const g = [...document.querySelectorAll('.apexcharts-series')].find(
          (n) => n.getAttribute('seriesName') === 'C',
        )
        return [...g.querySelectorAll('.apexcharts-marker')]
          .map((m) => ({
            x: +parseFloat(m.getAttribute('cx')).toFixed(1),
            y: +parseFloat(m.getAttribute('cy')).toFixed(1),
          }))
          .filter((p) => p.y <= gh + 0.5)
          .sort((a, b) => a.x - b.x)
          .map((p) => p.y)
      })

    // With B visible, C's top must sit higher where B contributes and drop back
    // where B has no point at all.
    const visible = await tops()
    expect(new Set(visible).size).toBe(2)

    await page.evaluate(() => window.chart.toggleSeries('B'))
    await page.waitForTimeout(350)
    const hidden = await tops()

    // Same chart built without B at all: the oracle for "B hidden".
    const absent = (
      await render({ series: [A5, C5] })
    ).series.C.map((p) => p.y)

    expect(hidden).toEqual(absent)
  })

  test('a series declared hidden in the config does not corrupt the stack (#4984)', async ({
    page,
  }) => {
    // #4984, from the config the reporter eventually supplied: a category axis,
    // four equal-length series, the third `hidden: true` in the CONFIG rather
    // than toggled off later. Nothing to do with ragged x, but it lives in the
    // same walk-back-to-a-baseline code and it shipped broken, so it is guarded
    // here rather than left to the next refactor to rediscover.
    //
    // Fixed in 6.9.0 by 39d56302c, which believed itself behaviour-neutral. On
    // 6.8.0 the top series' SECOND point is drawn at y=115.3 instead of 57.7:
    // the walk skipped past B to A, so D stacked on 7 units instead of 12, and
    // 15/25 of a 288.3px plot is 115.3. The first point looks right either way,
    // because it comes from determineFirstPrevY and never walks.
    await page.goto('about:blank')
    await page.setContent('<div id="chart" style="width:700px"></div>')
    await page.addScriptTag({ path: distPath })

    const tops = async (hideThird) =>
      page.evaluate(async (hideThird) => {
        /** @param {string} name @param {number} v @param {boolean} h */
        const mk = (name, v, h) => ({
          name,
          hidden: h,
          data: [
            { x: 'a', y: v },
            { x: 'b', y: v },
          ],
        })
        document.querySelector('#chart').innerHTML = ''
        window.chart = new ApexCharts(document.querySelector('#chart'), {
          chart: {
            type: 'area',
            stacked: true,
            height: 380,
            width: 700,
            animations: { enabled: false },
          },
          xaxis: { categories: ['a', 'b'] },
          series: hideThird
            ? [mk('A', 7, false), mk('B', 5, false), mk('C', 4, true), mk('D', 8, false)]
            : [mk('A', 7, false), mk('B', 5, false), mk('D', 8, false)],
          dataLabels: { enabled: false },
          markers: { size: 5 },
          stroke: { curve: 'straight' },
        })
        await window.chart.render()
        const g = [...document.querySelectorAll('.apexcharts-series')].find(
          (n) => n.getAttribute('seriesName') === 'D',
        )
        return [...g.querySelectorAll('.apexcharts-marker')]
          .map((m) => ({
            x: +parseFloat(m.getAttribute('cx')).toFixed(1),
            y: +parseFloat(m.getAttribute('cy')).toFixed(1),
          }))
          .sort((a, b) => a.x - b.x)
          .map((p) => p.y)
      }, hideThird)

    const withHidden = await tops(true)
    const withoutIt = await tops(false)

    // hiding it must be indistinguishable from never declaring it
    expect(withHidden).toEqual(withoutIt)
    // and specifically: both points at the same height, since the data is flat.
    // Pre-6.9.0 the second one alone was wrong, so an equality check that only
    // looked at point 0 would have passed.
    expect(new Set(withHidden).size).toBe(1)
  })

  test('a category axis is unaffected (invariant)', async ({ render }) => {
    // On a category axis every series is indexed against the shared category
    // list, so the ordinal already IS the x identity and this code path must not
    // move. Shorter series simply run out, which reads as null.
    const r = await render({
      series: [
        { name: 'A', data: [10, 10, 10, 10, 10] },
        { name: 'B', data: [5, 5, 5] },
        { name: 'C', data: [20, 20, 20, 20, 20] },
      ],
      xaxisType: 'category',
      categories: ['a', 'b', 'c', 'd', 'e'],
    })

    expectOnPlot(r)
    // C stacks on A alone past B's end, and on A+B where B has values, so its
    // top must step DOWN (larger y) once B drops out
    const c = r.series.C
    expect(c).toHaveLength(5)
    expect(c[3].y).toBeGreaterThan(c[2].y)
  })
})
