/**
 * An update that lands while a cross-type piece morph is still flying.
 *
 * A mark coming apart into unit dots (or dots assembling into a mark) runs on
 * a piece layer the morph drives itself. An update in the middle of it used to
 * drop that layer and draw the new chart from where the morph was GOING: every
 * piece still in the air jumped to its dot's slot, or every mosaic still
 * assembling snapped to its solid mark, on the first frame.
 *
 * Now the morph hands each piece's on-screen place to the next render: a dot
 * starts where its piece is, and a mark starts as the box its tiles cover.
 * Checked on the virtual clock, for every update path (data, options, the
 * legend's toggle) in both directions, mid-flight and with some pieces landed:
 * the render the update mounts starts exactly where the screen was, and on the
 * frame after it nothing moves more than a few px further than it moved on the
 * frame before.
 */

import { test, expect } from '@playwright/test'
import { BUNDLE, TOL } from '../helpers/frames.js'
import { installVirtualTime, advance, FRAME_MS } from '../helpers/virtual-time.js'
import { addAddons } from '../helpers/addons.js'

const LABELS = ['Direct', 'Search', 'Referral', 'Social', 'Email']
const VALUES = [55, 48, 44, 41, 37]

/** Three deterministic samples for the boxPlot side. */
const samples = (shift = 0) => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return ['Alpha', 'Bravo', 'Charlie'].map((x, k) => ({
    x,
    points: Array.from({ length: 24 }, () => Math.round(20 + k * 10 + rand() * 20) + shift),
  }))
}

/** n clusters of `per` objects, keyed by id so dots keep their identity. */
const unitSeries = (n, per) =>
  Array.from({ length: n }, (_, i) => ({
    name: LABELS[i],
    data: Array.from({ length: per }, (_, k) => ({ id: `${i}-${k}` })),
  }))

const UNIT_PLOT = {
  unit: {
    layout: 'columns',
    size: 6,
    transition: 'identity',
    clusterLabels: { show: false },
  },
}

/**
 * What each type is drawn from, and the data an update sends it. Unit takes
 * one more object in its first cluster on an update, so the layout reflows.
 */
function fixture(type, n, updated) {
  if (type === 'unit') {
    const series = unitSeries(n, 4)
    if (updated) series[0].data.push({ id: '0-new' })
    return { series, plotOptions: UNIT_PLOT, labels: [] }
  }
  if (type === 'bar') {
    return {
      series: [{ name: 'Orders', data: VALUES.slice(0, n).map((v) => v + (updated ? 6 : 0)) }],
      labels: LABELS.slice(0, n),
    }
  }
  if (type === 'pie') {
    return {
      series: VALUES.slice(0, n).map((v, i) => v + (updated && i === 0 ? 20 : 0)),
      labels: LABELS.slice(0, n),
    }
  }
  if (type === 'boxPlot') {
    return { series: [{ name: 'Days', data: samples(updated ? 3 : 0) }], labels: [] }
  }
  throw new Error(`no fixture for ${type}`)
}

/**
 * Self-contained, runs in the page: the screen box of every visible piece,
 * dot and mark, keyed so a piece and the dot or mark it stands for share a
 * key. Pieces carry the key they fly for; a dot's is its datum id; a mark's
 * is `realIndex:j`, as the morph keys them.
 */
function probe() {
  const root = document.querySelector('#chart')
  const out = {}
  const add = (k, el) => {
    const b = el.getBoundingClientRect()
    if (!(b.width > 0 || b.height > 0)) return
    const e = (out[k] = out[k] || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 })
    e.x0 = Math.min(e.x0, b.x)
    e.y0 = Math.min(e.y0, b.y)
    e.x1 = Math.max(e.x1, b.x + b.width)
    e.y1 = Math.max(e.y1, b.y + b.height)
  }
  const hidden = (el) =>
    el.hasAttribute('data-piece-hidden') ||
    el.getAttribute('opacity') === '0' ||
    getComputedStyle(el).opacity === '0' ||
    el.closest('.apexcharts-unit-exits, .apexcharts-series-collapsed')
  root.querySelectorAll('.apexcharts-morph-pieces rect').forEach((el) => {
    add(el.getAttribute('data-key'), el)
  })
  root.querySelectorAll('.apexcharts-unit-area').forEach((el) => {
    if (!hidden(el)) add(`id:${el.getAttribute('i')}-${el.getAttribute('j')}`, el)
  })
  root.querySelectorAll('.apexcharts-series').forEach((g) => {
    const ri = g.getAttribute('data:realIndex')
    g.querySelectorAll('.apexcharts-bar-area, .apexcharts-boxPlot-area').forEach((el, order) => {
      const j = el.getAttribute('j') ?? order
      if (!hidden(el)) add(`${ri}:${j}`, el)
    })
  })
  root.querySelectorAll('.apexcharts-pie-area').forEach((el, i) => {
    if (!hidden(el)) add(`${i}:0`, el)
  })
  return out
}

/**
 * How far each key present in both probes moved between them. A piece and the
 * dot it becomes differ in shape, so unit keys compare centres; a mosaic and
 * its mark compare edge by edge.
 */
function moves(a, b, centres) {
  const out = {}
  for (const k of Object.keys(a)) {
    const p = a[k]
    const q = b[k]
    if (!q) continue
    out[k] = centres
      ? Math.hypot((p.x0 + p.x1 - q.x0 - q.x1) / 2, (p.y0 + p.y1 - q.y0 - q.y1) / 2)
      : Math.max(
          Math.abs(p.x0 - q.x0),
          Math.abs(p.y0 - q.y0),
          Math.abs(p.x1 - q.x1),
          Math.abs(p.y1 - q.y1),
        )
  }
  return out
}

const worst = (m) => Math.max(0, ...Object.values(m))

const PAIRS = [
  { from: 'bar', to: 'unit', n: 5 },
  { from: 'pie', to: 'unit', n: 5 },
  { from: 'boxPlot', to: 'unit', n: 3 },
  { from: 'unit', to: 'bar', n: 5 },
  { from: 'unit', to: 'pie', n: 5 },
  { from: 'unit', to: 'boxPlot', n: 3 },
]

// A morph of 900 ms: pieces fly for 600 of it behind a 300 ms stagger, so at
// 350 ms every piece is in the air, and at 700 ms the first have landed (a
// dot revealed, a mosaic complete) while the last are still flying.
const SPEED = 900

/** The update, as each path makes it. */
const ACTIONS = {
  updateSeries: (to, n) => ({ kind: 'updateSeries', arg: fixture(to, n, true).series }),
  // Not a type change. Into marks, a title moves the plot, so the hand-over
  // must carry the mosaics across a new plot origin too. A unit chart does
  // not ease its plot origin on any update yet (its dots move with a title
  // even at rest), so into dots the option leaves the plot where it is.
  updateOptions: (to) => ({
    kind: 'updateOptions',
    arg: to === 'unit' ? { tooltip: { theme: 'dark' } } : { title: { text: 'Mid-flight update' } },
  }),
  // What a legend click calls. A bar or boxPlot here is one series, and
  // hiding it would leave nothing to compare, so those pairs skip it.
  toggleSeries: (to) =>
    to === 'bar' || to === 'boxPlot' ? null : { kind: 'toggleSeries', arg: LABELS[1] },
}

const CASES = []
for (const pair of PAIRS) {
  for (const [name, make] of Object.entries(ACTIONS)) {
    const action = make(pair.to, pair.n)
    if (!action) continue
    CASES.push({ ...pair, action, at: 350 })
    if (name === 'updateSeries') CASES.push({ ...pair, action, at: 700 })
  }
}

test.describe('An update mid piece-morph carries the pieces on', () => {
  for (const c of CASES) {
    test(`${c.from} -> ${c.to}, ${c.action.kind} at ${c.at} ms`, async ({ page }) => {
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.setContent('<div id="chart" style="width:720px"></div>')
      await installVirtualTime(page, { bare: true })
      await page.addScriptTag({ path: BUNDLE })
      await addAddons(page, 'unit')

      const from = fixture(c.from, c.n, false)
      const to = fixture(c.to, c.n, false)
      await page.evaluate(
        ({ type, f, speed }) => {
          window.chart = new window.ApexCharts(document.querySelector('#chart'), {
            chart: {
              type,
              height: 420,
              toolbar: { show: false },
              animations: {
                animateGradually: { enabled: false },
                chartTypeMorph: { enabled: true, speed },
              },
            },
            labels: f.labels,
            legend: { show: false },
            dataLabels: { enabled: false },
            plotOptions: f.plotOptions || {},
            series: f.series,
          })
          window.chart.render()
        },
        { type: c.from, f: from, speed: SPEED },
      )
      await advance(page, 2000)

      await page.evaluate(
        ({ type, t }) => {
          window.chart.updateOptions({
            chart: { type },
            labels: t.labels,
            plotOptions: t.plotOptions || {},
            series: t.series,
          })
        },
        { type: c.to, t: to },
      )
      await advance(page, c.at - FRAME_MS)
      const prev = await page.evaluate(probe)
      await advance(page, FRAME_MS)

      const pieces = await page.evaluate(
        () => document.querySelectorAll('#chart .apexcharts-morph-pieces rect').length,
      )
      expect(pieces, 'pieces still flying when the update lands').toBeGreaterThan(0)

      const before = await page.evaluate(probe)
      await page.evaluate(async ({ kind, arg }) => {
        window.chart[kind](arg)
        // Let the update's promise chain mount the render; no time passes.
        for (let i = 0; i < 10; i++) await Promise.resolve()
      }, c.action)
      const mounted = await page.evaluate(probe)
      await advance(page, FRAME_MS)
      const after = await page.evaluate(probe)

      const centres = c.to === 'unit'
      // The render the update mounted starts exactly where the screen was.
      const atMount = moves(before, mounted, centres)
      expect(Object.keys(atMount).length, 'keys on screen both sides').toBeGreaterThanOrEqual(c.n)
      expect(worst(atMount), 'the update starts from the screen').toBeLessThan(TOL)

      // And the frame after it moves each key no further than the frame
      // before did, give or take a few px: the motion carries on, it does
      // not restart from where the morph was headed.
      const was = moves(prev, before, centres)
      const now = moves(before, after, centres)
      const jumps = Object.keys(now).map((k) => now[k] - (was[k] ?? 0))
      expect(Math.max(0, ...jumps), 'nothing jumps on the frame after the update').toBeLessThan(4)

      // And the transition still finishes: nothing left hidden, no pieces.
      await advance(page, 2500)
      const left = await page.evaluate(() => ({
        pieces: document.querySelectorAll('#chart .apexcharts-morph-pieces').length,
        hidden: document.querySelectorAll('#chart [data-piece-hidden]').length,
      }))
      expect(left).toEqual({ pieces: 0, hidden: 0 })
      expect(errors).toEqual([])
    })
  }
})
