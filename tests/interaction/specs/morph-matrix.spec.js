/**
 * Every pair the engine offers, driven, in both directions.
 *
 * The other morph specs assert COUNTS: how many pieces, how many ghosts, which
 * marks were held hidden. Two shipped bugs slipped through all of them because
 * counts were right and nothing moved: a treemap taking from a sunburst grew
 * its tiles from zero, and a type change into a boxPlot or violin drew straight
 * at its final geometry. Both were reported by a human clicking buttons.
 *
 * So this file asserts MOTION, and states it as one property that holds for
 * every pair the engine claims:
 *
 *   1. Frame one of the new chart occupies where the old chart was.
 *   2. Something keeps moving after that.
 *   3. Nothing is left behind: no overlay, no mark still hidden.
 *
 * Which thing moves depends on the pair, and the table below says which:
 *
 *   'shape'   1:1 marks. The mark itself travels, and no exit layer is built.
 *   'pieces'  one mark becomes many (or many become one). The piece layer
 *             carries the motion; the incoming marks wait hidden for it.
 *   'ghost'   the documented fallback, where a photocopy of the old chart
 *             fades over the new one. It conserves nothing, so it is asserted
 *             as itself rather than as a morph.
 *
 * Coverage is by FAMILY PAIR (the axis the engine branches on) with the types
 * varied so every one of the fifteen appears as both a source and a target.
 * The full ordered cross product is about 110 transitions and would say little
 * the family pair does not.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// Fixtures. Plain data only, so the whole config crosses into the page as an
// argument rather than as a string to eval.
// ---------------------------------------------------------------------------

const LABELS = ['Direct', 'Search', 'Referral', 'Social', 'Email']
const VALUES = [55, 44, 41, 33, 27]

/** Deterministic observations, so a histogram bins the same way every run. */
const OBSERVATIONS = (() => {
  let seed = 20260814
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return Array.from({ length: 120 }, () => Math.round(20 + rand() * 60))
})()

/** Three samples, for the summary family. */
const SAMPLES = (() => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return ['Alpha', 'Bravo', 'Charlie'].map((x, k) => ({
    x,
    points: Array.from({ length: 24 }, () => Math.round(20 + k * 10 + rand() * 20)),
  }))
})()

/** n clusters of `per` objects each: the unit family's series shape. */
const unitSeries = (n, per) =>
  Array.from({ length: n }, (_, i) => ({
    name: LABELS[i] || `G${i}`,
    data: Array.from({ length: per }, (_, k) => ({ id: `${i}-${k}` })),
  }))

const LEAVES = [
  {
    data: [
      { x: 'Tops', y: 34 },
      { x: 'Denim', y: 30 },
      { x: 'Outerwear', y: 24 },
      { x: 'Kitchen', y: 12 },
      { x: 'Bedding', y: 10 },
      { x: 'Decor', y: 12 },
      { x: 'Camping', y: 26 },
      { x: 'Cycling', y: 15 },
      { x: 'Running', y: 11 },
    ],
  },
]

const TREE = [
  {
    data: [
      {
        x: 'Apparel',
        y: 88,
        children: [
          { x: 'Tops', y: 34 },
          { x: 'Denim', y: 30 },
          { x: 'Outerwear', y: 24 },
        ],
      },
      {
        x: 'Home',
        y: 34,
        children: [
          { x: 'Kitchen', y: 12 },
          { x: 'Bedding', y: 10 },
          { x: 'Decor', y: 12 },
        ],
      },
      {
        x: 'Outdoor',
        y: 52,
        children: [
          { x: 'Camping', y: 26 },
          { x: 'Cycling', y: 15 },
          { x: 'Running', y: 11 },
        ],
      },
    ],
  },
]

/**
 * One entry per chart type: what to feed it, where its marks are, and how many
 * marks that comes to. `clusters` picks the unit variant that matches the
 * counterpart's mark count, since a unit chart is one series per cluster.
 * @param {string} type
 * @param {number} clusters
 */
function fixture(type, clusters) {
  const RADIAL = ['pie', 'donut', 'polarArea', 'radialBar', 'gauge']
  if (RADIAL.includes(type)) {
    const ringed = type === 'radialBar' || type === 'gauge'
    return {
      series: VALUES.slice(),
      labels: LABELS,
      // A ring is a STROKED arc, so its client rect carries half the stroke on
      // every side while a filled path's does not. Frame one can therefore only
      // be compared to within that stroke, whichever way the pair runs.
      stroked: ringed,
      // The track shares the value arc's class, so a visible one would double
      // the mark count and, being a full ring, inflate every hull measured
      // here. Nothing about the morph depends on it.
      plotOptions: ringed ? { radialBar: { track: { show: false } } } : undefined,
      sel: ringed ? '.apexcharts-radialbar-area' : '.apexcharts-pie-area',
      marks: 5,
    }
  }
  if (type === 'histogram') {
    return {
      // Five bins, so the histogram has the same mark count as everything else
      // and a positional pairing is legible. Its x is numeric, so no labels.
      series: [{ name: 'Orders', data: OBSERVATIONS }],
      plotOptions: { histogram: { bins: 5 } },
      sel: '.apexcharts-bar-area',
      marks: 5,
    }
  }
  if (type === 'bar' || type === 'funnel' || type === 'pyramid') {
    return {
      series: [{ name: 'Orders', data: VALUES.slice() }],
      labels: LABELS,
      sel: '.apexcharts-bar-area',
      marks: 5,
    }
  }
  if (type === 'unit' || type === 'waffle') {
    return {
      series: unitSeries(clusters, 4),
      plotOptions: {
        unit: {
          layout: type === 'waffle' ? 'grid' : 'columns',
          size: 6,
          transition: 'identity',
          clusterLabels: { show: false },
        },
      },
      sel: '.apexcharts-unit-area',
      marks: clusters * 4,
    }
  }
  if (type === 'boxPlot' || type === 'violin') {
    return {
      series: [{ name: 'Days', data: SAMPLES }],
      sel: `.apexcharts-${type}-area`,
      // A boxPlot draws two paths per category, so its marks are unioned by j.
      unionByJ: true,
      marks: 3,
    }
  }
  if (type === 'treemap') {
    return {
      series: LEAVES,
      sel: '.apexcharts-treemap-rect',
      marks: 9,
    }
  }
  if (type === 'sunburst') {
    return {
      series: TREE,
      // Leaves are the level a flat partition corresponds to; the parent rings
      // have no counterpart and sweep in behind.
      sel: '.apexcharts-sunburst-arc[data\\:leaf="true"]',
      marks: 9,
    }
  }
  throw new Error(`no fixture for ${type}`)
}

/**
 * The matrix. Every family pair in both directions, with the types rotated so
 * all fifteen appear on each side at least once.
 */
const MATRIX = [
  // bar family <-> radial family
  { from: 'bar', to: 'pie', kind: 'shape' },
  { from: 'pie', to: 'funnel', kind: 'shape' },
  { from: 'funnel', to: 'donut', kind: 'shape' },
  { from: 'donut', to: 'pyramid', kind: 'shape' },
  { from: 'pyramid', to: 'polarArea', kind: 'shape' },
  { from: 'polarArea', to: 'bar', kind: 'shape' },
  { from: 'histogram', to: 'radialBar', kind: 'shape' },
  { from: 'gauge', to: 'histogram', kind: 'shape' },
  // within the bar family, and within the radial family
  { from: 'bar', to: 'funnel', kind: 'shape' },
  { from: 'pyramid', to: 'histogram', kind: 'shape' },
  { from: 'radialBar', to: 'gauge', kind: 'shape' },
  { from: 'gauge', to: 'donut', kind: 'shape' },
  { from: 'pie', to: 'polarArea', kind: 'shape' },
  // one mark becomes many, and back
  { from: 'bar', to: 'unit', kind: 'pieces', clusters: 5 },
  { from: 'unit', to: 'bar', kind: 'pieces', clusters: 5 },
  { from: 'pie', to: 'unit', kind: 'pieces', clusters: 5 },
  { from: 'unit', to: 'pie', kind: 'pieces', clusters: 5 },
  { from: 'donut', to: 'waffle', kind: 'pieces', clusters: 5 },
  { from: 'waffle', to: 'pyramid', kind: 'pieces', clusters: 5 },
  // a summary and its sample
  { from: 'boxPlot', to: 'unit', kind: 'pieces', clusters: 3 },
  { from: 'unit', to: 'boxPlot', kind: 'pieces', clusters: 3 },
  { from: 'violin', to: 'unit', kind: 'pieces', clusters: 3 },
  { from: 'unit', to: 'violin', kind: 'pieces', clusters: 3 },
  // the two summaries of one sample
  { from: 'boxPlot', to: 'violin', kind: 'shape' },
  { from: 'violin', to: 'boxPlot', kind: 'shape' },
  // one partition, two projections
  { from: 'treemap', to: 'sunburst', kind: 'shape' },
  { from: 'sunburst', to: 'treemap', kind: 'shape' },
  // The one pair that conserves nothing. Both states are the SAME renderer, so
  // there is no mark to hand over and the fallback fade covers the swap. The
  // gallery demo sidesteps it by changing the layout instead of the type.
  { from: 'unit', to: 'waffle', kind: 'ghost', clusters: 5 },
]

/** Runs one transition in the page and reports what moved. */
const DRIVE = async (cfg) => {
  document.body.innerHTML = '<div id="probe" style="width:760px"></div>'

  const boxesOf = (sel, unionByJ) => {
    const els = [...document.querySelectorAll(`#probe ${sel}`)]
    if (!unionByJ) {
      return els.map((el) => {
        const b = el.getBoundingClientRect()
        return { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height }
      })
    }
    const byJ = {}
    els.forEach((el) => {
      const j = el.getAttribute('j')
      const b = el.getBoundingClientRect()
      const e = (byJ[j] = byJ[j] || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 })
      e.x0 = Math.min(e.x0, b.x)
      e.y0 = Math.min(e.y0, b.y)
      e.x1 = Math.max(e.x1, b.x + b.width)
      e.y1 = Math.max(e.y1, b.y + b.height)
    })
    return Object.keys(byJ)
      .sort((a, b) => +a - +b)
      .map((j) => byJ[j])
  }

  const hull = (list) =>
    list.length
      ? list.reduce(
          (u, b) => ({
            x0: Math.min(u.x0, b.x0),
            y0: Math.min(u.y0, b.y0),
            x1: Math.max(u.x1, b.x1),
            y1: Math.max(u.y1, b.y1),
          }),
          { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 },
        )
      : null

  const PIECES = '#probe .apexcharts-morph-pieces rect'
  const GHOST = '#probe .apexcharts-morph-ghost'
  const raf = () => new Promise((res) => requestAnimationFrame(res))

  const chart = new window.ApexCharts(document.querySelector('#probe'), {
    chart: {
      id: 'probe',
      type: cfg.fromType,
      height: 430,
      toolbar: { show: false },
      animations: {
        // The ENTRY stagger, not the morph: it would leave later marks still
        // growing when the capture is taken.
        animateGradually: { enabled: false },
        chartTypeMorph: { enabled: true, speed: 900 },
      },
    },
    // Passed on both sides, empty where the type has no use for them: a
    // category list left over from the outgoing chart would make the incoming
    // one draw a mark per label rather than per row.
    labels: cfg.fromLabels,
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: cfg.fromPlot || {},
    series: cfg.fromSeries,
  })
  await chart.render()
  await new Promise((res) => setTimeout(res, 1100))

  const before = boxesOf(cfg.fromSel, cfg.fromUnionByJ)

  chart.updateOptions({
    chart: { type: cfg.toType },
    labels: cfg.toLabels,
    plotOptions: cfg.toPlot || {},
    series: cfg.toSeries,
  })
  await raf()

  const firstMarks = boxesOf(cfg.toSel, cfg.toUnionByJ)
  const firstPieces = boxesOf('.apexcharts-morph-pieces rect', false)
  const first = {
    marks: firstMarks.length,
    pieces: document.querySelectorAll(PIECES).length,
    ghosts: document.querySelectorAll(GHOST).length,
    hidden: document.querySelectorAll('#probe [data-piece-hidden]').length,
  }

  // What the transition claims will move. A mark held hidden for its mosaic is
  // static on purpose, so for the piece pairs the sample follows a piece.
  const movingSel =
    cfg.kind === 'pieces' ? '.apexcharts-morph-pieces rect' : cfg.toSel
  const signatures = new Set()
  for (let k = 0; k < 50; k++) {
    await raf()
    const el = document.querySelector(`#probe ${movingSel}`)
    if (!el) continue
    const b = el.getBoundingClientRect()
    signatures.add(
      `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)},${Math.round(b.height)}`,
    )
  }

  await new Promise((res) => setTimeout(res, 1600))
  const settledMarks = boxesOf(cfg.toSel, cfg.toUnionByJ)

  return {
    before,
    beforeHull: hull(before),
    firstHull: hull(cfg.kind === 'pieces' ? firstPieces : firstMarks),
    firstMarks,
    first,
    steps: signatures.size,
    settled: {
      marks: settledMarks.length,
      hull: hull(settledMarks),
      pieces: document.querySelectorAll(PIECES).length,
      ghosts: document.querySelectorAll(GHOST).length,
      hidden: document.querySelectorAll('#probe [data-piece-hidden]').length,
    },
  }
}

/** Worst-edge distance between two hulls. */
function hullGap(a, b) {
  if (!a || !b) return Infinity
  return Math.max(
    Math.abs(a.x0 - b.x0),
    Math.abs(a.y0 - b.y0),
    Math.abs(a.x1 - b.x1),
    Math.abs(a.y1 - b.y1),
  )
}

/** How far `inner` pokes outside `outer`, worst edge. */
function overhang(inner, outer) {
  if (!inner || !outer) return Infinity
  return Math.max(
    outer.x0 - inner.x0,
    outer.y0 - inner.y0,
    inner.x1 - outer.x1,
    inner.y1 - outer.y1,
  )
}

const area = (h) => (h ? Math.max(0, h.x1 - h.x0) * Math.max(0, h.y1 - h.y0) : 0)

test.describe('Every offered pair actually moves', () => {
  for (const row of MATRIX) {
    const clusters = row.clusters || 5
    const from = fixture(row.from, clusters)
    const to = fixture(row.to, clusters)

    test(`${row.from} -> ${row.to} (${row.kind})`, async ({ page, loadChart }) => {
      // Any sample serves as a host for the full bundle; the probe replaces it.
      await loadChart('bar', 'basic-bar')

      const r = await page.evaluate(DRIVE, {
        kind: row.kind,
        fromType: row.from,
        toType: row.to,
        fromSeries: from.series,
        toSeries: to.series,
        fromPlot: from.plotOptions,
        toPlot: to.plotOptions,
        fromSel: from.sel,
        toSel: to.sel,
        fromUnionByJ: !!from.unionByJ,
        toUnionByJ: !!to.unionByJ,
        fromLabels: from.labels || [],
        toLabels: to.labels || [],
      })

      // The outgoing chart drew what it was supposed to.
      expect(r.before.length, 'outgoing marks').toBe(from.marks)

      if (row.kind === 'ghost') {
        // Not a morph: the old chart is photocopied and faded out over the new
        // one. Asserted as itself so the day it becomes a real pair, this fails.
        expect(r.first.ghosts).toBe(1)
        expect(r.settled.ghosts).toBe(0)
        expect(r.settled.marks).toBe(to.marks)
        return
      }

      // 1. Frame one occupies where the old chart was. A shape pair is handed
      //    the outgoing path itself, so it matches to the pixel. A piece pair
      //    is cut from that path with axis-aligned cells, which INSCRIBE a
      //    curve rather than cover its bounding box: the test is that the
      //    mosaic sits inside the ink it came from and fills most of it.
      if (row.kind === 'shape') {
        const slack = from.stroked || to.stroked ? 8 : 2
        expect(
          hullGap(r.firstHull, r.beforeHull),
          'frame one is the old chart',
        ).toBeLessThan(slack)
      } else {
        expect(overhang(r.firstHull, r.beforeHull), 'pieces stay inside the mark').toBeLessThan(2)
        expect(
          area(r.firstHull) / area(r.beforeHull),
          'pieces fill the mark',
        ).toBeGreaterThan(0.7)
      }

      // 2. Something keeps moving. A frozen transition reports one signature,
      //    which is exactly what both shipped bugs did.
      expect(r.steps, 'distinct frames in flight').toBeGreaterThan(3)

      // 3. It ends somewhere else, and leaves nothing behind.
      expect(r.settled.marks, 'incoming marks').toBe(to.marks)
      expect(hullGap(r.settled.hull, r.firstHull), 'travelled').toBeGreaterThan(1)
      expect(r.settled.pieces, 'pieces cleared').toBe(0)
      expect(r.settled.ghosts, 'ghosts cleared').toBe(0)
      expect(r.settled.hidden, 'nothing left hidden').toBe(0)

      if (row.kind === 'shape') {
        // 1:1 marks: the mark itself is the animation, so no exit layer is
        // built at all, and mark k starts on mark k.
        expect(r.first.pieces, 'no piece layer').toBe(0)
        expect(r.first.ghosts, 'no ghost').toBe(0)
        expect(r.firstMarks.length).toBe(r.before.length)
      } else {
        // One mark becomes many: a cell per object, and every incoming mark
        // waits hidden until its mosaic lands.
        expect(r.first.pieces, 'a piece per object').toBeGreaterThan(0)
        expect(r.first.ghosts, 'pieces replace the fade').toBe(0)
        expect(r.first.hidden, 'incoming marks wait hidden').toBeGreaterThan(0)
      }
    })
  }
})
