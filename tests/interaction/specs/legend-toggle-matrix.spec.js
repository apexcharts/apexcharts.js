/**
 * Legend show/hide, every chart type, every frame.
 *
 * Toggling a series from the legend is the interaction most users touch on
 * most charts, and its animation is shared machinery: a change made for one
 * type (the -collapsing class for stacked bars) silently changes every other.
 * So every type in the default bundle runs the same two transitions, hiding
 * the middle series and showing it again, and every frame is checked against
 * the shared rules in helpers/frames.js:
 *
 *   finite, noJump, noFlash   always
 *   xStable                   types whose x axis a toggle leaves alone
 *   settles                   axis types (the target is the same options with
 *                             the series declared hidden; non-axis series are
 *                             bare numbers and cannot be declared hidden)
 *   motion                    hide: animatesOut; show: animatesIn
 *   exitTarget                the hidden series exits where its type says it
 *                             goes, `exit: 'baseline'` flat onto the baseline
 *                             (lines/areas), `exit: 'shrink'` shrunk to
 *                             nothing (points, radar), and then leaves nothing
 *                             behind
 *
 * KNOWN lists, per case and direction, the rules that currently fail because
 * of a real defect. Those are asserted to STILL fail, so fixing one turns the
 * test red with a message to delete its entry; every other rule stays fully
 * enforced on that case meanwhile. Never add to KNOWN to get a red test green
 * without filing the defect.
 *
 * One flag records behaviour that is by design, not a defect: `inert` (the
 * legend is hover-only, so a click must change nothing).
 *
 * Adding a chart type: add a CASES entry. Its KNOWN starts empty and the
 * matrix tells you what is wrong.
 */

import { test, expect } from '@playwright/test'
import {
  mountChart,
  recordTransition,
  toggleLegend,
  finite,
  noJump,
  noFlash,
  xStable,
  animatesOut,
  animatesIn,
  exitsToBaseline,
  exitsShrunk,
  vanishesOnLanding,
  settles,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NAMES = ['Alpha', 'Beta', 'Gamma']
const TOGGLED = 'Beta'
const N = 8
const CATS = Array.from({ length: N }, (_, i) => `C${i + 1}`)
const v = (c, i) => 40 + c * 15 + ((i * 37 + c * 11) % 45)
const catSeries = () => NAMES.map((name, c) => ({ name, data: CATS.map((_, i) => v(c, i)) }))

function base(extra) {
  return {
    dataLabels: { enabled: false },
    legend: { show: true, position: 'top' },
    ...extra,
    chart: {
      height: 320,
      toolbar: { show: false },
      animations: { dynamicAnimation: { speed: 350 } },
      ...(extra.chart || {}),
    },
  }
}

// Defect tags, so a KNOWN entry says what it is waiting on (none open).
/**
 * @type {Record<string, { o: any, x?: boolean, nonAxis?: boolean, inert?: boolean, exit?: 'baseline' | 'shrink',
 *   known?: { hide?: string[], show?: string[] } }>}
 */
const CASES = {
  line: {
    o: base({ chart: { type: 'line' }, series: catSeries(), xaxis: { categories: CATS } }),
    x: true,
    exit: 'baseline',
  },
  'line, datetime pairs': {
    o: base({
      chart: { type: 'line' },
      series: NAMES.map((name, c) => ({ name, data: CATS.map((_, i) => [Date.UTC(2026, 0, i + 1), v(c, i)]) })),
      xaxis: { type: 'datetime' },
    }),
    x: true,
    exit: 'baseline',
  },
  // An axis that does not reach zero: the hidden line must flatten onto the
  // bottom of the plot, not fall away toward a zero far below it.
  'line, axis above zero': {
    o: base({
      chart: { type: 'line' },
      series: NAMES.map((name, c) => ({ name, data: CATS.map((_, i) => 900 + v(c, i)) })),
      xaxis: { categories: CATS },
    }),
    x: true,
    exit: 'baseline',
  },
  area: {
    o: base({ chart: { type: 'area' }, series: catSeries(), xaxis: { categories: CATS } }),
    x: true,
    exit: 'baseline',
  },
  'line, stacked': {
    o: base({ chart: { type: 'line', stacked: true }, series: catSeries(), xaxis: { categories: CATS } }),
    x: true,
  },
  'area, stacked': {
    o: base({ chart: { type: 'area', stacked: true }, series: catSeries(), xaxis: { categories: CATS } }),
    x: true,
  },
  // The dashboard showcase's shape: the collapsed series used to carry no x.
  'area, stacked, datetime pairs': {
    o: base({
      chart: { type: 'area', stacked: true },
      series: NAMES.map((name, c) => ({ name, data: CATS.map((_, i) => [Date.UTC(2026, 0, i + 1), v(c, i)]) })),
      xaxis: { type: 'datetime' },
    }),
    x: true,
  },
  'area, stacked 100%': {
    o: base({ chart: { type: 'area', stacked: true, stackType: '100%' }, series: catSeries(), xaxis: { categories: CATS } }),
    x: true,
  },
  column: { o: base({ chart: { type: 'bar' }, series: catSeries(), xaxis: { categories: CATS } }) },
  'column, stacked': {
    o: base({ chart: { type: 'bar', stacked: true }, series: catSeries(), xaxis: { categories: CATS } }),
  },
  'column, stacked 100%': {
    o: base({ chart: { type: 'bar', stacked: true, stackType: '100%' }, series: catSeries(), xaxis: { categories: CATS } }),
  },
  'bar, horizontal': {
    o: base({ chart: { type: 'bar' }, plotOptions: { bar: { horizontal: true } }, series: catSeries(), xaxis: { categories: CATS } }),
  },
  'bar, horizontal stacked': {
    o: base({
      chart: { type: 'bar', stacked: true },
      plotOptions: { bar: { horizontal: true } },
      series: catSeries(),
      xaxis: { categories: CATS },
    }),
  },
  'combo, column + line': {
    o: base({
      chart: { type: 'line' },
      series: NAMES.map((name, c) => ({ name, type: c === 2 ? 'line' : 'column', data: CATS.map((_, i) => v(c, i)) })),
      xaxis: { categories: CATS },
    }),
  },
  'combo, dual y-axis': {
    o: base({
      chart: { type: 'line' },
      series: NAMES.map((name, c) => ({
        name,
        type: c === 0 ? 'area' : 'line',
        data: CATS.map((_, i) => v(c, i) * (c === 2 ? 40 : 1)),
      })),
      yaxis: [{ seriesName: 'Alpha' }, { seriesName: 'Beta', show: false }, { seriesName: 'Gamma', opposite: true }],
      xaxis: { categories: CATS },
    }),
    x: true,
    exit: 'baseline',
  },
  scatter: {
    o: base({
      chart: { type: 'scatter' },
      series: NAMES.map((name, c) => ({ name, data: CATS.map((_, i) => [i * 10 + c, v(c, i)]) })),
      xaxis: { type: 'numeric' },
    }),
    x: true,
    // Points have no line to flatten: they shrink away in place and grow back.
    exit: 'shrink',
  },
  bubble: {
    o: base({
      chart: { type: 'bubble' },
      series: NAMES.map((name, c) => ({
        name,
        data: CATS.map((_, i) => [i * 10 + c, v(c, i), 10 + ((i * 7) % 20)]),
      })),
      xaxis: { type: 'numeric' },
    }),
    // Points have no line to flatten: they shrink away in place and grow back.
    exit: 'shrink',
  },
  rangeArea: {
    o: base({
      chart: { type: 'rangeArea' },
      series: NAMES.map((name, c) => ({ name, data: CATS.map((x, i) => ({ x, y: [v(c, i) - 20, v(c, i) + 10] })) })),
    }),
    x: true,
    exit: 'baseline',
  },
  rangeBar: {
    o: base({
      chart: { type: 'rangeBar' },
      plotOptions: { bar: { horizontal: true } },
      series: NAMES.map((name, c) => ({
        name,
        data: ['Design', 'Build', 'Test'].map((x, i) => ({
          x,
          y: [Date.UTC(2026, 0, 1 + i * 5 + c), Date.UTC(2026, 0, 4 + i * 5 + c * 2)],
        })),
      })),
      xaxis: { type: 'datetime' },
    }),
  },
  candlestick: {
    o: base({
      chart: { type: 'candlestick' },
      series: NAMES.map((name, c) => ({
        name,
        data: CATS.map((_, i) => {
          const o = v(c, i)
          return { x: Date.UTC(2026, 0, i + 1), y: [o, o + 12, o - 9, o + (i % 2 ? 6 : -5)] }
        }),
      })),
      xaxis: { type: 'datetime' },
    }),
  },
  boxPlot: {
    o: base({
      chart: { type: 'boxPlot' },
      series: NAMES.map((name, c) => ({
        name,
        type: 'boxPlot',
        data: CATS.slice(0, 5).map((x, i) => ({
          x,
          y: [10 + c * 5 + i, 20 + c * 5 + i, 30 + c * 5 + i, 40 + c * 5 + i, 50 + c * 5 + i],
        })),
      })),
    }),
  },

  radar: {
    o: base({ chart: { type: 'radar' }, series: catSeries(), xaxis: { categories: CATS } }),
    // Every value to zero: the polygon collapses into the center and grows back.
    exit: 'shrink',
  },
  treemap: {
    o: base({
      chart: { type: 'treemap' },
      series: NAMES.map((name, c) => ({ name, data: CATS.slice(0, 4).map((x, i) => ({ x, y: v(c, i) })) })),
    }),
    // By design the treemap legend is hover-only (Legend.js: clickAllowed), so
    // a click must leave the chart exactly as it was.
    inert: true,
  },
  pie: { o: base({ chart: { type: 'pie' }, series: [44, 33, 23], labels: NAMES }), nonAxis: true },
  donut: { o: base({ chart: { type: 'donut' }, series: [44, 33, 23], labels: NAMES }), nonAxis: true },
  polarArea: { o: base({ chart: { type: 'polarArea' }, series: [44, 33, 23], labels: NAMES }), nonAxis: true },
  radialBar: { o: base({ chart: { type: 'radialBar' }, series: [74, 53, 33], labels: NAMES }), nonAxis: true },
}

for (const [id, c] of Object.entries(CASES)) {
  test.describe(`Legend toggle matrix: ${id}`, () => {
    if (c.inert) {
      test('a legend click changes nothing', async ({ page }) => {
        const errors = await mountChart(page, c.o)
        const rec = await recordTransition(page, () => toggleLegend(page, TOGGLED))
        const msg = `${id}: its legend toggles now. Drop \`inert\` and make it a real case.`
        expect(noJump(rec), msg).toEqual([])
        expect(await settles(page, rec), msg).toEqual([])
        expect(errors).toEqual([])
      })
      return
    }
    for (const dir of /** @type {const} */ (['hide', 'show'])) {
      test(`${dir} ${TOGGLED}`, async ({ page }) => {
        const errors = await mountChart(page, c.o)
        if (dir === 'show') {
          await toggleLegend(page, TOGGLED)
          await advance(page, 4000)
        }
        const rec = await recordTransition(page, () => toggleLegend(page, TOGGLED))

        /** @type {Record<string, string[]>} */
        const results = {
          finite: finite(rec),
          noFlash: noFlash(rec),
          noJump: noJump(rec),
          motion: dir === 'hide' ? animatesOut(rec, TOGGLED) : animatesIn(rec, TOGGLED),
        }
        if (dir === 'hide') results.vanishes = vanishesOnLanding(rec, TOGGLED)
        if (dir === 'hide' && c.exit === 'baseline') results.exitTarget = exitsToBaseline(rec, TOGGLED)
        if (dir === 'hide' && c.exit === 'shrink') results.exitTarget = exitsShrunk(rec, TOGGLED)
        if (c.x) results.xStable = xStable(rec)
        if (!c.nonAxis) {
          results.settles = await settles(page, rec, { hidden: dir === 'hide' ? [TOGGLED] : [] })
        }

        const known = c.known?.[dir] || []
        for (const k of known) {
          expect(results[k], `unknown rule "${k}" in KNOWN for ${id} ${dir}`).toBeDefined()
        }
        for (const [rule, violations] of Object.entries(results)) {
          if (known.includes(rule)) {
            expect(
              violations.length,
              `${id}, ${dir}: "${rule}" passes now. The defect is fixed: delete it from KNOWN.`,
            ).toBeGreaterThan(0)
          } else {
            expect(violations, `${id}, ${dir}: ${rule}\n${violations.slice(0, 12).join('\n')}`).toEqual([])
          }
        }
        expect(errors).toEqual([])
      })
    }
  })
}
