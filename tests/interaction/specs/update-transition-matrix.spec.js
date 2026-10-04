/**
 * Updates, every chart type, every frame.
 *
 * The legend matrix covers the one interaction everybody touches; this one
 * covers everything else that re-renders a chart: new values, a longer
 * series, options that change the layout, zoom and its reset, a resize, and
 * the switches that turn the animation off. Each runs on every type where it
 * applies, recorded frame by frame and checked against the shared rules in
 * helpers/frames.js:
 *
 *   finite, noFlash         always
 *   noJump, noLayoutShift,  whenever the update animates: frame 0 is what was
 *   chromeSteady            on screen, and the plot and its chrome only ease
 *   animates                the update visibly moves (it is not applied at
 *                           frame 0)
 *   snaps                   the update was asked not to animate: it is final
 *                           from the next frame on, nothing tweens or pops in
 *                           late
 *   noStaleStart            a redraw from scratch starts from the screen or
 *                           from nothing, never from an older update's shapes
 *   settles                 the final frame matches a fresh render of the
 *                           target state
 *
 * Starting state matters as much as the update: the chart keeps flags across
 * updates (whether it was ever re-rendered, whether data changed, whether the
 * last update animated), so some cases first put the chart through another
 * update and test the one after it.
 *
 * KNOWN lists, per case and operation, the rules that currently fail because
 * of a real defect, asserted to STILL fail (as in the legend matrix): fixing
 * one turns the test red until its entry is deleted. No defect is open.
 */

import { test, expect } from '@playwright/test'
import {
  mountChart,
  recordTransition,
  finite,
  noJump,
  noFlash,
  noLayoutShift,
  chromeSteady,
  snaps,
  animates,
  noStaleStart,
  settles,
  probes,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NAMES = ['Alpha', 'Beta', 'Gamma']
const N = 8
const CATS = Array.from({ length: N + 1 }, (_, i) => `C${i + 1}`)
const TASKS = ['Design', 'Build', 'Test', 'Ship']
const DAY = 864e5
const T0 = Date.UTC(2026, 0, 1)
/** Value of series c at point i under seed s (0 mounts, 1 is the update). */
const v = (c, i, s) => 40 + c * 15 + ((i * 37 + c * 11 + s * 29) % 45)

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

const byName = (pt) => NAMES.map((name, c) => ({ name, data: Array.from({ length: pt.n }, (_, i) => pt.f(c, i)) }))

/**
 * Each case: `o` options minus series, `series(s, n)` the series under seed s
 * with n points, `zoom` the x window when the type zooms, and flags:
 * nonAxis, fixedLength (no `longer`), append (appendData applies), colorOnly
 * (a values update changes colours only, so `animates` does not apply).
 *
 * @type {Record<string, { o: any, series: (s: number, n: number) => any, zoom?: [number, number],
 *   nonAxis?: boolean, fixedLength?: boolean, append?: boolean, colorOnly?: boolean,
 *   known?: Record<string, string[] | Record<string, RegExp>> }>}
 */
const CASES = {
  line: {
    o: base({ chart: { type: 'line' } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
    append: true,
  },
  // Markers only: with no path, the markers ARE the marks, and nothing but
  // the line's own reveal ever showed them after an update.
  'line, markers only': {
    o: base({ chart: { type: 'line' }, stroke: { show: false }, markers: { size: 5 } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
  },
  'line, datetime': {
    o: base({ chart: { type: 'line' }, xaxis: { type: 'datetime' } }),
    series: (s, n) => byName({ n, f: (c, i) => [T0 + i * DAY, v(c, i, s)] }),
    zoom: [T0 + 2 * DAY, T0 + 6 * DAY],
    append: true,
  },
  area: {
    o: base({ chart: { type: 'area' } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
  },
  'area, datetime': {
    o: base({ chart: { type: 'area' }, xaxis: { type: 'datetime' } }),
    series: (s, n) => byName({ n, f: (c, i) => [T0 + i * DAY, v(c, i, s)] }),
    zoom: [T0 + 2 * DAY, T0 + 6 * DAY],
  },
  'area, stacked': {
    o: base({ chart: { type: 'area', stacked: true } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
  },
  column: {
    o: base({ chart: { type: 'bar' } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
    append: true,
  },
  'column, stacked': {
    o: base({ chart: { type: 'bar', stacked: true } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
  },
  'column, datetime': {
    o: base({ chart: { type: 'bar' }, xaxis: { type: 'datetime' } }),
    series: (s, n) => byName({ n, f: (c, i) => [T0 + i * DAY, v(c, i, s)] }),
    zoom: [T0 + 2 * DAY, T0 + 6 * DAY],
  },
  // A numeric x axis insets the plot by half a bar on each side. The fast
  // path used to zero that pad, so the outermost bars of a group read as off
  // screen and were dropped on any same-length update.
  'column, numeric': {
    o: base({ chart: { type: 'bar' }, xaxis: { type: 'numeric' } }),
    series: (s, n) => byName({ n, f: (c, i) => [i * 10, v(c, i, s)] }),
    zoom: [20, 60],
  },
  'bar, horizontal': {
    o: base({ chart: { type: 'bar' }, plotOptions: { bar: { horizontal: true } } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
  },
  'combo, column + line': {
    o: base({ chart: { type: 'line' } }),
    series: (s, n) =>
      byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }).map((x, c) => ({
        ...x,
        type: c === 2 ? 'line' : 'column',
      })),
  },
  scatter: {
    o: base({ chart: { type: 'scatter' }, xaxis: { type: 'numeric' } }),
    series: (s, n) => byName({ n, f: (c, i) => [i * 10 + c, v(c, i, s)] }),
    zoom: [20, 60],
    append: true,
  },
  bubble: {
    o: base({ chart: { type: 'bubble' }, xaxis: { type: 'numeric' } }),
    series: (s, n) => byName({ n, f: (c, i) => [i * 10 + c, v(c, i, s), 10 + ((i * 7 + s * 5) % 20)] }),
  },
  rangeArea: {
    o: base({ chart: { type: 'rangeArea' } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: [v(c, i, s) - 20, v(c, i, s) + 10] }) }),
  },
  rangeBar: {
    o: base({ chart: { type: 'rangeBar' }, plotOptions: { bar: { horizontal: true } }, xaxis: { type: 'datetime' } }),
    series: (s, n) =>
      byName({
        n: Math.min(n, TASKS.length) - (n > N ? 0 : 1),
        f: (c, i) => ({ x: TASKS[i], y: [T0 + (i * 5 + c + s) * DAY, T0 + (i * 5 + 3 + c * 2 + s * 2) * DAY] }),
      }),
  },
  candlestick: {
    o: base({ chart: { type: 'candlestick' }, xaxis: { type: 'datetime' } }),
    series: (s, n) =>
      byName({
        n,
        f: (c, i) => {
          const o = v(c, i, s)
          return { x: T0 + i * DAY, y: [o, o + 12, o - 9, o + (i % 2 ? 6 : -5)] }
        },
      }),
    zoom: [T0 + 2 * DAY, T0 + 6 * DAY],
    append: true,
  },
  boxPlot: {
    o: base({ chart: { type: 'boxPlot' } }),
    series: (s, n) =>
      byName({
        n: Math.min(n, 6) - (n > N ? 0 : 1),
        f: (c, i) => {
          const b = 10 + c * 5 + i + s * 3
          return { x: CATS[i], y: [b, b + 10, b + 20, b + 30, b + 40] }
        },
      }),
  },
  heatmap: {
    o: base({ chart: { type: 'heatmap' } }),
    series: (s, n) => byName({ n, f: (c, i) => ({ x: CATS[i], y: v(c, i, s) }) }),
    // A new value is a new colour, which the recorder does not measure: the
    // cells stay put, so `animates` cannot see a values update.
    colorOnly: true,
  },
  radar: {
    o: base({ chart: { type: 'radar' }, xaxis: { categories: CATS.slice(0, N) } }),
    series: (s, n) => byName({ n, f: (c, i) => v(c, i, s) }),
    fixedLength: true,
  },
  treemap: {
    o: base({ chart: { type: 'treemap' } }),
    series: (s) => byName({ n: 4, f: (c, i) => ({ x: `${NAMES[c][0]}${i}`, y: v(c, i, s) }) }),
    fixedLength: true,
  },
  // Nested data draws parent rects and headers ahead of the tiles in each
  // series group, so a capture that takes rects by position starts the tiles
  // from the parents' shapes.
  'treemap, nested': {
    o: base({ chart: { type: 'treemap' } }),
    series: (s) =>
      NAMES.map((name, c) => ({
        name,
        data: [0, 1].map((g) => ({
          x: `${name[0]}G${g}`,
          children: [0, 1, 2].map((i) => ({ x: `${name[0]}${g}${i}`, y: v(c, g * 3 + i, s) })),
        })),
      })),
    fixedLength: true,
  },
  pie: {
    o: base({ chart: { type: 'pie' }, labels: NAMES }),
    series: (s) => NAMES.map((_, c) => v(c, 0, s)),
    nonAxis: true,
    fixedLength: true,
  },
  donut: {
    o: base({ chart: { type: 'donut' }, labels: NAMES }),
    series: (s) => NAMES.map((_, c) => v(c, 0, s)),
    nonAxis: true,
    fixedLength: true,
  },
  polarArea: {
    o: base({ chart: { type: 'polarArea' }, labels: NAMES }),
    series: (s) => NAMES.map((_, c) => v(c, 0, s)),
    nonAxis: true,
    fixedLength: true,
  },
  radialBar: {
    o: base({ chart: { type: 'radialBar' }, labels: NAMES }),
    series: (s) => NAMES.map((_, c) => 30 + v(c, 0, s) / 2),
    nonAxis: true,
    fixedLength: true,
  },
}

const TITLE = { text: 'Quarterly results', style: { fontSize: '18px' } }
const seriesIs = (series) => `() => ({ series: ${JSON.stringify(series)} })`

/**
 * The operations. `applies` filters cases; `mount` adjusts the options
 * mounted; `prep` puts the chart in its starting state; `act` is the update
 * recorded; `rules` the checks, with `target` (settles' transform source) and
 * `width` for the fresh render.
 */
const OPS = {
  values: {
    act: (page, c) => page.evaluate((s) => window.chart.updateSeries(s), c.series(1, N)),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'animates', 'settles'],
    target: (c) => seriesIs(c.series(1, N)),
  },
  'values, dynamicAnimation off': {
    mount: (o) => ({ ...o, chart: { ...o.chart, animations: { dynamicAnimation: { enabled: false } } } }),
    act: (page, c) => page.evaluate((s) => window.chart.updateSeries(s), c.series(1, N)),
    rules: ['finite', 'noFlash', 'snaps', 'settles'],
    target: (c) => seriesIs(c.series(1, N)),
  },
  'values, animate false': {
    act: (page, c) => page.evaluate((s) => window.chart.updateSeries(s, false), c.series(1, N)),
    rules: ['finite', 'noFlash', 'snaps', 'settles'],
    target: (c) => seriesIs(c.series(1, N)),
  },
  'values, after updateOptions': {
    prep: (page) => page.evaluate((t) => window.chart.updateOptions({ title: t }), TITLE),
    act: (page, c) => page.evaluate((s) => window.chart.updateSeries(s), c.series(1, N)),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'animates', 'settles'],
    target: (c) => `() => ({ title: ${JSON.stringify(TITLE)}, series: ${JSON.stringify(c.series(1, N))} })`,
  },
  longer: {
    applies: (c) => !c.fixedLength,
    act: (page, c) => page.evaluate((s) => window.chart.updateSeries(s), c.series(0, N + 1)),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'settles'],
    target: (c) => seriesIs(c.series(0, N + 1)),
  },
  'options, title': {
    act: (page) => page.evaluate((t) => window.chart.updateOptions({ title: t }), TITLE),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'settles'],
    target: () => `() => ({ title: ${JSON.stringify(TITLE)} })`,
  },
  // Two updates from one handler, neither awaited (a wrapper whose options
  // and series both changed): the first one's render never reaches the
  // screen, so both have to start from what was painted before them.
  'options and values, same tick': {
    act: (page, c) =>
      page.evaluate(
        ([t, s]) => {
          window.chart.updateOptions({ title: t })
          window.chart.updateSeries(s)
        },
        [TITLE, c.series(1, N)],
      ),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'settles'],
    target: (c) => `() => ({ title: ${JSON.stringify(TITLE)}, series: ${JSON.stringify(c.series(1, N))} })`,
  },
  // The second one after awaiting the first: the first has applied its
  // transitions by then (and used up what it captured), but still nothing has
  // been painted, so the second starts from the same screen.
  'options then values, awaited': {
    act: (page, c) =>
      page.evaluate(
        async ([t, s]) => {
          await window.chart.updateOptions({ title: t })
          window.chart.updateSeries(s)
        },
        [TITLE, c.series(1, N)],
      ),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'settles'],
    target: (c) => `() => ({ title: ${JSON.stringify(TITLE)}, series: ${JSON.stringify(c.series(1, N))} })`,
  },
  // Two value updates in one tick (two messages from a feed): the second
  // starts from the values on screen, not the first's, which never showed.
  'values twice, same tick': {
    act: (page, c) =>
      page.evaluate(
        ([a, b]) => {
          window.chart.updateSeries(a)
          window.chart.updateSeries(b)
        },
        [c.series(2, N), c.series(1, N)],
      ),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'settles'],
    target: (c) => seriesIs(c.series(1, N)),
  },
  'options, redraw after an update': {
    applies: (c) => !c.nonAxis,
    prep: (page, c) => page.evaluate((s) => window.chart.updateSeries(s), c.series(1, N)),
    act: (page) => page.evaluate((t) => window.chart.updateOptions({ title: t }, true), TITLE),
    // From scratch replays the mount animation, which may start transparent:
    // noFlash does not apply, noStaleStart says where it may start.
    rules: ['finite', 'noStaleStart', 'settles'],
    target: (c) => `() => ({ title: ${JSON.stringify(TITLE)}, series: ${JSON.stringify(c.series(1, N))} })`,
  },
  'options, redraw unanimated after an update': {
    prep: (page, c) => page.evaluate((s) => window.chart.updateSeries(s), c.series(1, N)),
    act: (page) => page.evaluate((t) => window.chart.updateOptions({ title: t }, true, false), TITLE),
    rules: ['finite', 'noFlash', 'snaps', 'settles'],
    target: (c) => `() => ({ title: ${JSON.stringify(TITLE)}, series: ${JSON.stringify(c.series(1, N))} })`,
  },
  'appendData, after an unanimated update': {
    applies: (c) => c.append,
    prep: (page, c) => page.evaluate((s) => window.chart.updateSeries(s, false), c.series(0, N)),
    act: (page, c) =>
      page.evaluate(
        (rows) => window.chart.appendData(rows.map((data) => ({ data }))),
        c.series(0, N + 1).map((s) => [s.data[N]]),
      ),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'animates', 'settles'],
    target: (c) => seriesIs(c.series(0, N + 1)),
  },
  zoom: {
    applies: (c) => !!c.zoom,
    act: (page, c) => page.evaluate(([a, b]) => window.chart.zoomX(a, b), c.zoom),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'settles'],
    target: (c) => `(o) => ({ xaxis: { ...o.xaxis, min: ${c.zoom[0]}, max: ${c.zoom[1]} } })`,
  },
  'zoom, reset': {
    applies: (c) => !!c.zoom,
    prep: (page, c) => page.evaluate(([a, b]) => window.chart.zoomX(a, b), c.zoom),
    act: (page) => page.evaluate(() => window.chart.resetSeries()),
    rules: ['finite', 'noJump', 'noFlash', 'noLayoutShift', 'chromeSteady', 'settles'],
    target: () => null,
  },
  resize: {
    act: (page) =>
      page.evaluate(() => {
        document.querySelector('#chart').style.width = '540px'
        window.dispatchEvent(new Event('resize'))
      }),
    rules: ['finite', 'noFlash', 'settles'],
    target: () => null,
    width: 540,
  },
}

for (const [id, c] of Object.entries(CASES)) {
  test.describe(`Update matrix: ${id}`, () => {
    for (const [op, spec] of Object.entries(OPS)) {
      if (spec.applies && !spec.applies(c)) continue
      test(op, async ({ page }) => {
        const mounted = { ...c.o, series: c.series(0, N) }
        const errors = await mountChart(page, spec.mount ? spec.mount(mounted) : mounted)
        if (spec.prep) {
          await spec.prep(page, c)
          await advance(page, 4000)
        }
        const rec = await recordTransition(page, () => spec.act(page, c), { probe: probes.chromeEdges })

        /** @type {Record<string, () => string[] | Promise<string[]>>} */
        const RULES = {
          finite: () => finite(rec),
          noJump: () => noJump(rec),
          noFlash: () => noFlash(rec),
          noLayoutShift: () => noLayoutShift(rec),
          chromeSteady: () => chromeSteady(rec),
          animates: () => animates(rec),
          snaps: () => snaps(rec),
          noStaleStart: () => noStaleStart(rec),
          settles: () => {
            const t = spec.target(c)
            return settles(page, rec, { ...(t ? { transform: t } : {}), width: spec.width })
          },
        }
        // A KNOWN entry is a list of rules, or { rule: RegExp } to say which
        // violations the defect explains: the rest of that rule stays enforced.
        const knownRaw = c.known?.[op] || []
        /** @type {Record<string, RegExp | null>} */
        const known = Array.isArray(knownRaw)
          ? Object.fromEntries(knownRaw.map((k) => [k, null]))
          : knownRaw
        for (const k of Object.keys(known)) {
          expect(spec.rules, `unknown rule "${k}" in KNOWN for ${id} / ${op}`).toContain(k)
        }
        for (const rule of spec.rules) {
          if (rule === 'animates' && c.colorOnly) continue
          const violations = await RULES[rule]()
          if (rule in known) {
            expect(
              violations.length,
              `${id} / ${op}: "${rule}" passes now. The defect is fixed: delete it from KNOWN.`,
            ).toBeGreaterThan(0)
            const match = known[rule]
            if (match) {
              const other = violations.filter((v) => !match.test(v))
              expect(other, `${id} / ${op}: ${rule}, beyond the KNOWN defect\n${other.slice(0, 12).join('\n')}`).toEqual([])
            }
          } else {
            expect(violations, `${id} / ${op}: ${rule}\n${violations.slice(0, 12).join('\n')}`).toEqual([])
          }
        }
        expect(errors).toEqual([])
      })
    }
  })
}

// After a cross-type morph into a treemap its tiles are <path>s (that still
// carry their box attributes): the next update must start each tile from its
// own box, which the tile capture reads by class, not by tag.
test('treemap: an update after a cross-type morph starts the tiles in place', async ({ page }) => {
  const series = (s) => [{ name: 'A', data: ['p', 'q', 'r', 's'].map((x, i) => ({ x, y: v(0, i, s) })) }]
  const errors = await mountChart(page, base({ chart: { type: 'bar' }, series: series(0) }))
  await page.evaluate(() => window.chart.updateOptions({ chart: { type: 'treemap' } }))
  await advance(page, 4000)
  const rec = await recordTransition(page, () => page.evaluate((s) => window.chart.updateSeries(s), series(1)))
  expect(noJump(rec)).toEqual([])
  expect(errors).toEqual([])
})
