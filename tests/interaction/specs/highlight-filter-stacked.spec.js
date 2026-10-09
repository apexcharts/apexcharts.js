/**
 * Highlight filter on stacked columns and bars: the whole stack drawn faded,
 * the parts as their own stack solid in front of it, from the same baseline.
 *
 * Runs samples/vanilla-js/highlight/stacked-highlight (and a few bare charts)
 * on virtual time, so every frame can be read. What jsdom cannot see:
 *   - frame 0 of a pick is the chart as it was (each part starts as its whole,
 *     which sits at 0 under it), then the part stack drains to size on one
 *     clock, every seam closed on every frame
 *   - re-picks, two updates in one frame and clears start from the screen
 *   - a clear lands on the plain chart, nothing of the feature left behind
 *   - the part stack's rounded cap stays on its outer edge while a part
 *     leaves and comes back, its mirror never dropped early
 *   - legend collapse, zoom, length changes, the fast path and the mount
 */

import { test, expect } from '@playwright/test'
import {
  BUNDLE,
  loadSample,
  recordTransition,
  settles,
  checkAll,
  finite,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance, installVirtualTime } from '../helpers/virtual-time.js'
import { PNG } from 'pngjs'

const TOL = 1.5

/**
 * Render `options` on a bare page under virtual time with the highlight
 * filter loaded. Without `settleMs` the mount is left at its first frame.
 */
async function mount(page, options, { settleMs = 4000 } = {}) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setContent('<div id="chart" style="width:720px"></div>')
  await installVirtualTime(page, { bare: true })
  await page.addScriptTag({ path: BUNDLE })
  await page.addScriptTag({
    path: BUNDLE.replace(/apexcharts\.js$/, 'features/highlight-filter.js'),
  })
  await page.evaluate((o) => {
    window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
    window.chart.render()
  }, options)
  if (settleMs) await advance(page, settleMs)
  return errors
}

/** Wholes and parts of the chart in #chart, and its stacked totals, read in
 * the page every frame. */
function stackState() {
  const root = document.querySelector('#chart')
  const radiusOf = (d) => {
    const toks = d.trim().split(/[\s,]+/)
    const pts = []
    let i = 0
    while (i < toks.length) {
      const c = toks[i]
      if (/^[MLC]$/i.test(c)) {
        const n = c.toUpperCase() === 'C' ? 6 : 2
        const nums = toks.slice(i + 1, i + 1 + n).map(Number)
        pts.push({ c: c.toUpperCase(), end: [nums[n - 2], nums[n - 1]] })
        i += 1 + n
      } else i += 1
    }
    let r = 0
    for (let k = 1; k < pts.length; k++) {
      if (pts[k].c === 'C') {
        r = Math.max(
          r,
          Math.abs(pts[k].end[0] - pts[k - 1].end[0]),
          Math.abs(pts[k].end[1] - pts[k - 1].end[1]),
        )
      }
    }
    return r
  }
  const read = (el) => {
    const b = el.getBBox()
    return {
      i: +el.getAttribute('index'),
      j: +el.getAttribute('j'),
      box: [b.x, b.y, b.width, b.height],
      op: parseFloat(el.getAttribute('fill-opacity') ?? '1'),
      flip:
        el.classList.contains('apexcharts-flip-y') ||
        el.classList.contains('apexcharts-flip-x'),
      held: el.classList.contains('apexcharts-flip-held'),
      radius: radiusOf(el.getAttribute('d') || ''),
      d: el.getAttribute('d'),
    }
  }
  return {
    wholes: [
      ...root.querySelectorAll('.apexcharts-series > .apexcharts-bar-area'),
    ].map(read),
    parts: [...root.querySelectorAll('.apexcharts-bar-highlight-part')].map(
      read,
    ),
    totals: [...root.querySelectorAll('.apexcharts-datalabel-total')].map(
      (t) => ({
        text: t.textContent,
        x: parseFloat(t.getAttribute('x')),
        y: parseFloat(t.getAttribute('y')),
        tf: t.getAttribute('transform') || '',
      }),
    ),
  }
}

const close = (a, b, tol = TOL) => a.every((v, k) => Math.abs(v - b[k]) <= tol)

/**
 * The part stack of every category is closed on every frame: each part with
 * height starts where the one below it ends (columns, all positive). A
 * category in `skip` is left out (one entering, whose layers each rise from
 * their own base, as the wholes do).
 */
function seamViolations(rec, skip = []) {
  const out = []
  rec.probes.forEach((f, n) => {
    const byJ = new Map()
    for (const p of f.parts) {
      if (p.box[3] < 0.5 || skip.includes(p.j)) continue
      if (!byJ.has(p.j)) byJ.set(p.j, [])
      byJ.get(p.j).push(p)
    }
    for (const [j, ps] of byJ) {
      ps.sort((a, b) => a.i - b.i)
      for (let k = 1; k < ps.length; k++) {
        const below = ps[k - 1].box
        const above = ps[k].box
        const gap = below[1] - (above[1] + above[3])
        if (Math.abs(gap) > TOL) {
          out.push(
            `frame ${n}: category ${j}, part ${ps[k].i} sits ${gap.toFixed(1)}px off part ${ps[k - 1].i}`,
          )
        }
      }
    }
  })
  return out
}

/**
 * A rounded part sits at the outer edge of its part stack, and never loses
 * its mirror while it still shows a radius (the first category).
 */
function cornerViolations(rec, R = 0.5) {
  const out = []
  rec.probes.forEach((f, n) => {
    const row = f.parts.filter((p) => p.j === 0 && p.box[3] > 1)
    if (row.length < 2) return
    const lowest = row.reduce((a, b) => (a.box[1] > b.box[1] ? a : b))
    const highest = row.reduce((a, b) => (a.box[1] < b.box[1] ? a : b))
    for (const p of row) {
      if (p.radius <= R) continue
      const outer = p.flip ? lowest : highest
      if (outer.i !== p.i) {
        out.push(
          `frame ${n}: part ${p.i} has r=${p.radius.toFixed(1)} on an interior seam`,
        )
      }
    }
    if (n > 0) {
      for (const p of row) {
        const was = rec.probes[n - 1].parts.find(
          (q) => q.i === p.i && q.j === 0,
        )
        if (was && was.flip && !p.flip && p.radius > R) {
          out.push(
            `frame ${n}: part ${p.i} lost its mirror with r=${p.radius.toFixed(1)}`,
          )
        }
      }
    }
  })
  return out
}

const pick = (page, source) =>
  page.evaluate((s) => window.pickSource(s), source)

/**
 * The stacked sample with only its first chart: the frame rules read every
 * series group on the page by name, and the 100% chart below repeats the
 * names. A pick then updates the one chart left.
 */
async function loadStacked(page) {
  const errors = await loadSample(page, 'highlight', 'stacked-highlight')
  await page.evaluate(() => {
    window.ApexCharts.getChartByID('shares').destroy()
    document.querySelector('#chart2').remove()
    window.pickSource = (s) => window.chart.updateSeries(window.seriesFor(s))
  })
  return errors
}

test.describe('Stacked highlight: pick, re-pick, clear', () => {
  test('a first pick starts from the screen and drains the part stack, seams closed', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    await pick(page, '')
    await advance(page, 4000)
    const rec = await recordTransition(page, () => pick(page, 'social'), {
      probe: stackState,
    })
    const f0 = rec.probes[0]
    expect(f0.parts.length).toBe(12)
    // Frame 0: each part on its whole's exact shape, the whole at 0 under it.
    for (const p of f0.parts) {
      const w = f0.wholes.find((x) => x.i === p.i && x.j === p.j)
      expect(close(p.box, w.box)).toBe(true)
      expect(w.op).toBeLessThan(0.01)
    }
    expect(seamViolations(rec)).toEqual([])
    const last = rec.probes[rec.probes.length - 1]
    for (const w of last.wholes) expect(w.op).toBeCloseTo(0.2, 2)
    expectNoViolations(finite(rec))
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('social') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a re-pick moves the part stack on from the screen, seams closed', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const before = await page.evaluate(stackState)
    const rec = await recordTransition(page, () => pick(page, 'email'), {
      probe: stackState,
    })
    const f0 = rec.probes[0]
    for (const p of before.parts) {
      expect(
        f0.parts.some((q) => q.i === p.i && q.j === p.j && close(q.box, p.box)),
      ).toBe(true)
    }
    for (const fr of rec.probes) {
      for (const w of fr.wholes) expect(w.op).toBeCloseTo(0.2, 2)
    }
    expect(seamViolations(rec)).toEqual([])
    // The totals state the new part sums at rest.
    const last = rec.probes[rec.probes.length - 1]
    expect(last.totals.map((t) => t.text)).toEqual([
      '16',
      '16',
      '18',
      '17',
      '19',
      '20',
    ])
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('email') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('two updates in one frame both start from the screen', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const before = await page.evaluate(stackState)
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() => {
          window.pickSource('social')
          window.pickSource('email')
        }),
      { probe: stackState },
    )
    const f0 = rec.probes[0]
    for (const p of before.parts) {
      expect(
        f0.parts.some((q) => q.i === p.i && q.j === p.j && close(q.box, p.box)),
      ).toBe(true)
    }
    expect(seamViolations(rec)).toEqual([])
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('email') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a clear grows the parts into the wholes and leaves the plain chart', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const rec = await recordTransition(page, () => pick(page, ''), {
      probe: stackState,
    })
    expect(seamViolations(rec)).toEqual([])
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts.length).toBe(0)
    for (const w of last.wholes) expect(w.op).toBeGreaterThan(0.99)
    // Nothing of the feature is left: the wholes carry exactly the
    // attributes a never-highlighted render gives them.
    const attrs = (sel) =>
      [
        ...document.querySelectorAll(
          sel + ' .apexcharts-series > .apexcharts-bar-area',
        ),
      ].map((n) =>
        [
          'fill-opacity',
          'stroke',
          'stroke-width',
          'stroke-opacity',
          'class',
          'd',
        ]
          .map((a) => n.getAttribute(a))
          .join(' | '),
      )
    const now = await page.evaluate(attrs, '#chart')
    const fresh = await page.evaluate(async (src) => {
      const read = (0, eval)(`(${src})`)
      const o = window.__frameLib.clone(window.__opts0)
      o.series = window.seriesFor('')
      o.chart = { ...o.chart, id: 'fresh', animations: { enabled: false } }
      const host = document.createElement('div')
      host.id = '__fresh'
      host.style.width = window.chart.el.getBoundingClientRect().width + 'px'
      document.body.appendChild(host)
      const c = new window.ApexCharts(host, o)
      c.render()
      await window.__vt.advance(1000)
      const out = read('#__fresh')
      c.destroy()
      host.remove()
      return out
    }, attrs.toString())
    expect(now).toEqual(fresh)
    expect(
      await page.evaluate(
        () => document.querySelectorAll('#chart .apexcharts-flip-held').length,
      ),
    ).toBe(0)
    expect(errors).toEqual([])
  })
})

test.describe('Stacked highlight: corners', () => {
  test('the part stack keeps its cap on the outer edge while its top part leaves and returns', async ({
    page,
  }) => {
    const errors = await mount(page, {
      chart: {
        type: 'bar',
        height: 360,
        stacked: true,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: { borderRadius: 10, borderRadiusWhenStacked: 'all' },
      },
      dataLabels: { enabled: false },
      series: [
        { name: 'A', data: [40, 30], highlightData: [20, 15] },
        { name: 'B', data: [30, 30], highlightData: [15, 10] },
        { name: 'C', data: [20, 30], highlightData: [10, 12] },
      ],
      xaxis: { categories: ['x', 'y'] },
    })
    const setTop = (v) =>
      page.evaluate(
        (top) =>
          window.chart.updateSeries([
            { name: 'A', data: [40, 30], highlightData: [20, 15] },
            { name: 'B', data: [30, 30], highlightData: [15, 10] },
            { name: 'C', data: [20, 30], highlightData: [top, 12] },
          ]),
        v,
      )
    const out = await recordTransition(page, () => setTop(null), {
      probe: stackState,
    })
    // the cap is there to be handed over: rounded parts on the way
    expect(
      out.probes.some((f) => f.parts.some((p) => p.j === 0 && p.radius > 0.5)),
    ).toBe(true)
    expect(cornerViolations(out)).toEqual([])
    expect(seamViolations(out)).toEqual([])
    const back = await recordTransition(page, () => setTop(10), {
      probe: stackState,
    })
    expect(cornerViolations(back)).toEqual([])
    expect(seamViolations(back)).toEqual([])
    // At rest the baseline part is mirrored (rounded at its bottom) and the
    // top one is not.
    const rest = back.probes[back.probes.length - 1].parts.filter(
      (p) => p.j === 0,
    )
    expect(rest.find((p) => p.i === 0).flip).toBe(true)
    expect(rest.find((p) => p.i === 2).flip).toBe(false)
    expect(rest.some((p) => p.held)).toBe(false)
    expect(errors).toEqual([])
  })
})

test.describe('Stacked highlight: reading the chart', () => {
  test('the shared tooltip lists each device with its own part', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const col = page
      .locator('#chart .apexcharts-series > .apexcharts-bar-area')
      .nth(2)
    const b = await col.boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height - 4)
    await advance(page, 400)
    const rows = await page.$$eval(
      '#chart .apexcharts-tooltip-series-group',
      (gs) =>
        gs
          .filter((g) => getComputedStyle(g).display !== 'none')
          .map((g) => ({
            name: g.querySelector('.apexcharts-tooltip-text-y-label')
              ?.textContent,
            value: g.querySelector('.apexcharts-tooltip-text-y-value')
              ?.textContent,
          })),
    )
    // March, search: Desktop 48 (23), Mobile 66 (28)
    expect(rows).toEqual([
      { name: 'Desktop: ', value: '23 / 48' },
      { name: 'Mobile: ', value: '28 / 66' },
    ])
    expect(errors).toEqual([])
  })
})

test.describe('Stacked highlight: legend', () => {
  test('collapsing the bottom series shrinks its part with its whole, the rest slide down on one clock', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const rec = await recordTransition(
      page,
      () => page.locator('#chart .apexcharts-legend-series').nth(0).click(),
      { probe: stackState },
    )
    expect(seamViolations(rec)).toEqual([])
    expectNoViolations(checkAll(rec), 'collapse Desktop')
    expectNoViolations(
      await settles(page, rec, {
        hidden: ['Desktop'],
        transform: () => ({ series: window.seriesFor('search') }),
      }),
    )
    // and back
    const back = await recordTransition(
      page,
      () => page.locator('#chart .apexcharts-legend-series').nth(0).click(),
      { probe: stackState },
    )
    expect(seamViolations(back)).toEqual([])
    expectNoViolations(checkAll(back), 'show Desktop')
    expectNoViolations(
      await settles(page, back, {
        transform: () => ({ series: window.seriesFor('search') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('hovering a legend item dims the other series parts, not its own', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    await page.locator('#chart .apexcharts-legend-series').nth(1).hover()
    await advance(page, 600)
    const ops = await page.evaluate(() =>
      [...document.querySelectorAll('#chart .apexcharts-series')].map((g) => {
        const p = g.querySelector('.apexcharts-bar-highlight-part')
        return window.__frameLib.effectiveOpacity(p)
      }),
    )
    expect(ops[1]).toBeGreaterThan(0.99)
    expect(ops[0]).toBeLessThan(0.5)
    await page.mouse.move(5, 5)
    await advance(page, 600)
    const after = await page.evaluate(() =>
      [
        ...document.querySelectorAll('#chart .apexcharts-bar-highlight-part'),
      ].every((p) => window.__frameLib.effectiveOpacity(p) > 0.99),
    )
    expect(after).toBe(true)
    expect(errors).toEqual([])
  })
})

const DAY = 86400000
const T0 = Date.UTC(2026, 0, 1)
const dated = (vals) => vals.map((y, k) => ({ x: T0 + k * DAY, y }))

test.describe('Stacked highlight: updates', () => {
  test('a zoom keeps the parts on their wholes and the axis over the part stack', async ({
    page,
  }) => {
    const errors = await mount(page, {
      chart: {
        type: 'bar',
        height: 360,
        stacked: true,
        zoom: { enabled: true, autoScaleYaxis: true },
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'A',
          data: dated([10, 10, 10, 10, 10, 10]),
          highlightData: [5, 5, 5, 5, 40, 40],
        },
        {
          name: 'B',
          data: dated([10, 10, 10, 10, 10, 10]),
          highlightData: [5, 5, 5, 5, 40, 40],
        },
      ],
    })
    expect(
      await page.evaluate(() => window.chart.w.globals.maxY),
    ).toBeGreaterThanOrEqual(80)
    const rec = await recordTransition(
      page,
      () => page.evaluate((t) => window.chart.zoomX(t, t + 3 * 86400000), T0),
      { probe: stackState },
    )
    expectNoViolations(finite(rec))
    expect(seamViolations(rec)).toEqual([])
    const maxY = await page.evaluate(() => window.chart.w.globals.maxY)
    // only parts in view raise the axis: 5 + 5 in the window
    expect(maxY).toBeLessThan(40)
    expect(maxY).toBeGreaterThanOrEqual(20)
    expect(errors).toEqual([])
  })

  test('a category leaving takes its part with it; one arriving rises from its own part base', async ({
    page,
  }) => {
    const errors = await mount(page, {
      chart: {
        type: 'bar',
        height: 360,
        stacked: true,
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      series: [
        {
          name: 'A',
          data: [
            { x: 'p', y: 20 },
            { x: 'q', y: 30 },
            { x: 'r', y: 25 },
          ],
          highlightData: [10, 12, 8],
        },
        {
          name: 'B',
          data: [
            { x: 'p', y: 20 },
            { x: 'q', y: 30 },
            { x: 'r', y: 25 },
          ],
          highlightData: [6, 9, 7],
        },
      ],
    })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateSeries([
            {
              name: 'A',
              data: [
                { x: 'q', y: 30 },
                { x: 'r', y: 25 },
                { x: 's', y: 40 },
              ],
              highlightData: [12, 8, 20],
            },
            {
              name: 'B',
              data: [
                { x: 'q', y: 30 },
                { x: 'r', y: 25 },
                { x: 's', y: 40 },
              ],
              highlightData: [9, 7, 15],
            },
          ]),
        ),
      { probe: stackState },
    )
    // Each part of the new category starts with no height at its own base
    // in the part stack (as each whole rises from its own base in the whole
    // stack): the top part on the bottom part's top at rest, not on the
    // bottom whole's.
    const f0 = rec.probes[0]
    const last = rec.probes[rec.probes.length - 1]
    const entering = f0.parts.filter((p) => p.j === 2)
    expect(entering.length).toBe(2)
    for (const p of entering) expect(p.box[3]).toBeLessThan(1)
    const restLow = last.parts.find((p) => p.i === 0 && p.j === 2).box
    const wholeLow = last.wholes.find((p) => p.i === 0 && p.j === 2).box
    const top = entering.find((p) => p.i === 1).box
    expect(Math.abs(top[1] - restLow[1])).toBeLessThan(TOL)
    expect(Math.abs(top[1] - wholeLow[1])).toBeGreaterThan(10)
    expect(last.parts.length).toBe(6)
    // the leaving category drew nothing of its own by the end
    expect(last.wholes.length).toBe(6)
    expect(seamViolations(rec, [2])).toEqual([])
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a same-count re-pick takes the fast path and morphs the parts', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const fast0 = await page.evaluate(
      () => window.chart._updateStats?.fast ?? 0,
    )
    const rec = await recordTransition(page, () => pick(page, 'social'), {
      probe: stackState,
    })
    const fast1 = await page.evaluate(
      () => window.chart._updateStats?.fast ?? 0,
    )
    expect(fast1).toBeGreaterThan(fast0)
    // the parts move over several frames rather than landing at once
    const h = (f) => f.parts.find((p) => p.i === 0 && p.j === 0).box[3]
    const heights = rec.probes.map(h)
    expect(
      heights.some(
        (v) => v < heights[0] - 1 && v > heights[heights.length - 1] + 1,
      ),
    ).toBe(true)
    expect(seamViolations(rec)).toEqual([])
    expect(errors).toEqual([])
  })

  test('a mount with a pick raises the parts from the part stack, wholes already faded', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      {
        chart: {
          type: 'bar',
          height: 360,
          stacked: true,
          toolbar: { show: false },
        },
        dataLabels: { enabled: false },
        series: [
          { name: 'A', data: [40, 30], highlightData: [20, 15] },
          { name: 'B', data: [30, 30], highlightData: [15, 10] },
        ],
        xaxis: { categories: ['x', 'y'] },
      },
      { settleMs: 0 },
    )
    const rows = []
    for (let k = 0; k < 90; k++) {
      rows.push(await page.evaluate(stackState))
      await advance(page, 16)
    }
    const rest = rows[rows.length - 1]
    for (const w of rest.wholes) expect(w.op).toBeCloseTo(0.2, 2)
    // the second part rises from where the first part ends at rest, never
    // from the whole stack's seam
    const firstTop = rest.parts.find((p) => p.i === 0 && p.j === 0).box[1]
    for (const f of rows) {
      const p = f.parts.find((q) => q.i === 1 && q.j === 0)
      if (!p) continue
      expect(Math.abs(p.box[1] + p.box[3] - firstTop)).toBeLessThan(TOL)
    }
    expect(errors).toEqual([])
  })
})

test.describe('Stacked highlight: horizontal', () => {
  test('a horizontal stack mirrors its parts and rides its total to the part edge and back', async ({
    page,
  }) => {
    const errors = await mount(page, {
      chart: {
        type: 'bar',
        height: 300,
        stacked: true,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 10,
          borderRadiusWhenStacked: 'all',
          dataLabels: { total: { enabled: true } },
        },
      },
      dataLabels: {
        enabled: false,
        animate: { enabled: true },
        countUp: { enabled: true },
      },
      series: [
        { name: 'A', data: [40, 30] },
        { name: 'B', data: [30, 30] },
      ],
      xaxis: { categories: ['x', 'y'] },
    })
    const series = (parts) => [
      {
        name: 'A',
        data: [40, 30],
        ...(parts ? { highlightData: parts[0] } : {}),
      },
      {
        name: 'B',
        data: [30, 30],
        ...(parts ? { highlightData: parts[1] } : {}),
      },
    ]
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(
          (s) => window.chart.updateSeries(s),
          series([
            [20, 10],
            [10, 10],
          ]),
        ),
      { probe: stackState },
    )
    const rest = rec.probes[rec.probes.length - 1]
    // the baseline part is rounded at its baseline end, by the mirror
    expect(rest.parts.find((p) => p.i === 0 && p.j === 0).flip).toBe(true)
    // the total rides from the whole edge to the part edge, counting down
    const t0 = rec.probes[0].totals[0]
    const tN = rest.totals[0]
    expect(tN.text).toBe('30')
    const xs = rec.probes.map((f) => {
      const t = f.totals[0]
      const m = /translate\(([-\d.]+)/.exec(t.tf)
      return t.x + (m ? parseFloat(m[1]) : 0)
    })
    expect(xs[0]).toBeGreaterThan(xs[xs.length - 1] + 20)
    expect(xs.some((x) => x < xs[0] - 1 && x > xs[xs.length - 1] + 1)).toBe(
      true,
    )
    expect(t0.text).not.toBe('30')
    const texts = rec.probes.map((f) => f.totals[0].text)
    expect(texts.some((t) => +t > 30 && +t < 70)).toBe(true)
    // and back on a clear
    const clear = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), series(null)),
      { probe: stackState },
    )
    const end = clear.probes[clear.probes.length - 1]
    expect(end.parts.length).toBe(0)
    expect(end.totals[0].text).toBe('70')
    const cx = clear.probes.map((f) => {
      const t = f.totals[0]
      const m = /translate\(([-\d.]+)/.exec(t.tf)
      return t.x + (m ? parseFloat(m[1]) : 0)
    })
    expect(cx[cx.length - 1]).toBeGreaterThan(cx[0] + 20)
    expect(errors).toEqual([])
  })
})

/** Wholes and parts as painted: each part's box, each whole's fill and
 * outline strength. */
function paintState() {
  const root = document.querySelector('#chart')
  const box = (el) => {
    const b = el.getBBox()
    return [b.x, b.y, b.width, b.height]
  }
  const num = (el, a, d) => {
    const v = parseFloat(el.getAttribute(a))
    return isFinite(v) ? v : d
  }
  return {
    wholes: [
      ...root.querySelectorAll('.apexcharts-series > .apexcharts-bar-area'),
    ].map((el) => ({
      i: +el.getAttribute('index'),
      j: +el.getAttribute('j'),
      op: num(el, 'fill-opacity', 1),
      stroke: el.getAttribute('stroke'),
      sw: num(el, 'stroke-width', 0),
      so: num(el, 'stroke-opacity', 1),
    })),
    parts: [...root.querySelectorAll('.apexcharts-bar-highlight-part')].map(
      (el) => ({
        i: +el.getAttribute('index'),
        j: +el.getAttribute('j'),
        box: box(el),
      }),
    ),
  }
}

/**
 * What differs between the screen and the first frame of the next update:
 * every part with height has a part at the same datum on the same box, and
 * every whole keeps its fill and outline strength.
 */
function screenViolations(screen, f0) {
  const out = []
  for (const p of screen.parts) {
    if (p.box[3] < 0.5 && p.box[2] < 0.5) continue
    const q = f0.parts.find((x) => x.i === p.i && x.j === p.j)
    if (!q || !close(q.box, p.box)) {
      out.push(
        `part ${p.i}|${p.j} was at ${p.box.map((v) => v.toFixed(1))}, frame 0 ${q ? q.box.map((v) => v.toFixed(1)) : 'none'}`,
      )
    }
  }
  for (const w of screen.wholes) {
    const v = f0.wholes.find((x) => x.i === w.i && x.j === w.j)
    if (!v) continue
    if (Math.abs(v.op - w.op) > 0.01) {
      out.push(
        `whole ${w.i}|${w.j} fill ${w.op.toFixed(3)} -> ${v.op.toFixed(3)}`,
      )
    }
    const ink = (x) => (x.stroke && x.stroke !== 'none' ? x.sw * x.so : 0)
    if (Math.abs(ink(v) - ink(w)) > 0.01) {
      out.push(
        `whole ${w.i}|${w.j} outline ${ink(w).toFixed(3)} -> ${ink(v).toFixed(3)}`,
      )
    }
  }
  return out
}

const W = [
  [12, 9, 14, 10],
  [8, -5, 6, 7],
  [5, 7, -4, 9],
]
const P1 = [
  [6, 3, 7, 5],
  [4, -2, 2, 3],
  [2, 4, -1, 6],
]
const P2 = [
  [3, 6, 4, 8],
  [6, -4, 5, 2],
  [4, 2, -3, 3],
]
const withParts = (P) =>
  W.map((data, i) => ({
    name: 'S' + i,
    data,
    ...(P ? { highlightData: P[i] } : {}),
  }))

const midFlight = (extra = {}) => ({
  chart: {
    type: 'bar',
    height: 360,
    stacked: true,
    toolbar: { show: false },
    ...(extra.chart || {}),
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      dataLabels: { total: { enabled: true } },
      ...(extra.bar || {}),
    },
  },
  dataLabels: { enabled: true },
  series: withParts(null),
  xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
})

const setParts = (page, P) =>
  page.evaluate((s) => window.chart.updateSeries(s), withParts(P))

test.describe('Stacked highlight: mid-flight', () => {
  for (const [name, extra] of [
    ['column', {}],
    ['horizontal', { bar: { horizontal: true } }],
    ['100%', { chart: { stackType: '100%' } }],
    // the unstacked columns share the capture, so they are held to it too
    ['unstacked', { chart: { stacked: false } }],
  ]) {
    test(`${name}: a re-pick mid-flight starts from the screen`, async ({
      page,
    }) => {
      const errors = await mount(page, midFlight(extra))
      await setParts(page, P1)
      // Some parts are mid-drain, the later categories not started yet
      // (the stagger), their wholes still covered.
      await advance(page, 250)
      const screen = await page.evaluate(paintState)
      const rec = await recordTransition(page, () => setParts(page, P2), {
        probe: paintState,
      })
      expect(screenViolations(screen, rec.probes[0])).toEqual([])
      expectNoViolations(finite(rec))
      // and it lands on a fresh render of the second pick
      await page.evaluate((s) => {
        window.__opts0 = window.__frameLib.clone(window.chart.opts)
        window.__target = s
      }, withParts(P2))
      expectNoViolations(
        await settles(page, rec, {
          transform: () => ({ series: window.__target }),
        }),
      )
      expect(errors).toEqual([])
    })
  }

  test('a re-pick in the middle of a clear starts from the screen', async ({
    page,
  }) => {
    const errors = await mount(page, midFlight())
    await setParts(page, P1)
    await advance(page, 4000)
    await setParts(page, null)
    await advance(page, 250)
    const screen = await page.evaluate(paintState)
    // the clear is under way: parts growing back into their wholes
    expect(screen.parts.length).toBeGreaterThan(0)
    const rec = await recordTransition(page, () => setParts(page, P2), {
      probe: paintState,
    })
    expect(screenViolations(screen, rec.probes[0])).toEqual([])
    const last = rec.probes[rec.probes.length - 1]
    for (const w of last.wholes) expect(w.op).toBeCloseTo(0.2, 2)
    expect(errors).toEqual([])
  })

  test('a clear that has landed leaves nothing for the next update to start from', async ({
    page,
  }) => {
    const errors = await mount(page, midFlight())
    await setParts(page, P1)
    await advance(page, 4000)
    await setParts(page, null)
    await advance(page, 4000)
    const left = await page.evaluate(() => {
      window.chart.updateSeries(
        window.chart.w.config.series.map((s) => ({
          ...s,
          data: s.data.map((v) => v + 1),
        })),
      )
      return window.chart.w.globals.prevHighlightParts.size
    })
    expect(left).toBe(0)
    expect(errors).toEqual([])
  })

  test('a series the legend hides keeps its outline on frame 0 and fades it on the way down', async ({
    page,
  }) => {
    const errors = await mount(page, {
      ...midFlight(),
      series: withParts(P1),
    })
    const screen = await page.evaluate(paintState)
    const rec = await recordTransition(
      page,
      () => page.evaluate(() => window.chart.toggleSeries('S0')),
      { probe: paintState },
    )
    const f0 = rec.probes[0]
    const s0 = (f) => f.wholes.filter((w) => w.i === 0)
    for (const w of s0(screen)) {
      const v = s0(f0).find((x) => x.j === w.j)
      expect(v.stroke).toBe(w.stroke)
      expect(v.sw).toBe(w.sw)
      expect(v.so).toBeCloseTo(w.so, 2)
    }
    // part way down the outline is fading, not gone
    const mid = rec.probes[Math.floor(rec.probes.length / 4)]
    expect(
      s0(mid).some((w) => w.stroke === s0(screen)[0].stroke && w.so > 0.05),
    ).toBe(true)
    // and at rest the hidden whole has its own stroke, as a fresh render
    // draws it
    const last = s0(rec.probes[rec.probes.length - 1])
    const fresh = await page.evaluate(async (P) => {
      const host = document.createElement('div')
      host.style.width = '720px'
      document.body.appendChild(host)
      const o = {
        chart: {
          type: 'bar',
          height: 360,
          stacked: true,
          toolbar: { show: false },
          animations: { enabled: false },
        },
        plotOptions: {
          bar: { borderRadius: 6, dataLabels: { total: { enabled: true } } },
        },
        dataLabels: { enabled: true },
        series: P,
        xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
      }
      o.series[0].hidden = true
      const c = new window.ApexCharts(host, o)
      c.render()
      await window.__vt.advance(1000)
      const out = [
        ...host.querySelectorAll('.apexcharts-series > .apexcharts-bar-area'),
      ]
        .filter((el) => el.getAttribute('index') === '0')
        .map((el) =>
          ['stroke', 'stroke-width', 'stroke-opacity']
            .map((a) => el.getAttribute(a))
            .join(' | '),
        )
      c.destroy()
      host.remove()
      return out
    }, withParts(P1))
    const now = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '#chart .apexcharts-series > .apexcharts-bar-area',
        ),
      ]
        .filter((el) => el.getAttribute('index') === '0')
        .map((el) =>
          ['stroke', 'stroke-width', 'stroke-opacity']
            .map((a) => el.getAttribute(a))
            .join(' | '),
        ),
    )
    expect(last.length).toBe(fresh.length)
    expect(now).toEqual(fresh)
    expect(errors).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Solid parts: "whole faded, part solid in front". A bar's fill carries its
// fill opacity in its colour (rgba 0.85), and a part that copied it let the
// faded whole stack under it show through: a dark line inside each Mobile part
// where the Desktop whole's top edge runs, and the faded Desktop tint below it.
// The part is drawn in the whole's ink; its alpha starts at the whole's on a
// first pick (frame 0 is the screen), comes up to 1 on the pick's clock, and
// goes back down on a clear before the part leaves.
// ---------------------------------------------------------------------------

/** Each bar part's and whole's effective opacity (its colour's alpha times
 * its fill-opacity), read in the page every frame. */
function alphaState() {
  const root = document.querySelector('#chart')
  const alphaOf = (c) => {
    const m = /^rgba\(([^)]+)\)$/i.exec(c || '')
    return m ? parseFloat(m[1].split(',')[3]) : 1
  }
  const eff = (n) =>
    alphaOf(n.getAttribute('fill')) *
    parseFloat(n.getAttribute('fill-opacity') ?? '1')
  const read = (n) => {
    const b = n.getBBox()
    return {
      i: +n.getAttribute('index'),
      j: +n.getAttribute('j'),
      a: eff(n),
      box: [b.x, b.y, b.width, b.height],
    }
  }
  return {
    parts: [...root.querySelectorAll('.apexcharts-bar-highlight-part')].map(
      read,
    ),
    wholes: [
      ...root.querySelectorAll('.apexcharts-series > .apexcharts-bar-area'),
    ].map(read),
  }
}

/** The largest change of any part's alpha between two recorded frames. */
function maxAlphaStep(rec) {
  let max = 0
  for (let n = 1; n < rec.probes.length; n++) {
    for (const p of rec.probes[n].parts) {
      const was = rec.probes[n - 1].parts.find(
        (q) => q.i === p.i && q.j === p.j,
      )
      if (was) max = Math.max(max, Math.abs(p.a - was.a))
    }
  }
  return max
}

/**
 * Where the Desktop whole's edge runs inside each Mobile part of a chart, in
 * page px: for columns a vertical strip at the part's centre across the edge,
 * for horizontal bars a strip along the part across the edge. Also the
 * part's effective opacity, its groups' included.
 */
function edgeStrips(sel) {
  const root = document.querySelector(sel)
  // the second chart is the horizontal 100% one
  const horizontal = sel === '#chart2'
  const at = (n) => `${n.getAttribute('index')}|${n.getAttribute('j')}`
  const wholes = new Map(
    [...root.querySelectorAll('.apexcharts-series > .apexcharts-bar-area')].map(
      (n) => [at(n), n.getBoundingClientRect()],
    ),
  )
  const alphaOf = (c) => {
    const m = /^rgba\(([^)]+)\)$/i.exec(c || '')
    return m ? parseFloat(m[1].split(',')[3]) : 1
  }
  return [...root.querySelectorAll('.apexcharts-bar-highlight-part')]
    .filter((n) => n.getAttribute('index') === '1')
    .map((n) => {
      const p = n.getBoundingClientRect()
      const w = wholes.get(`0|${n.getAttribute('j')}`)
      // the Desktop whole's far edge: its top on columns, its right on bars
      const edge = horizontal ? w.right : w.top
      const x = horizontal ? edge : p.left + p.width / 2
      // (a horizontal part carries its label across its middle)
      const y = horizontal ? p.top + 3 : edge
      // (a part takes no pointer, so it is read itself: what it paints
      // with, its own strength and every group's above it)
      let a =
        alphaOf(n.getAttribute('fill')) *
        parseFloat(n.getAttribute('fill-opacity') ?? '1')
      for (let e = n; e && e !== root; e = e.parentElement) {
        a *= parseFloat(getComputedStyle(e).opacity)
      }
      return {
        j: +n.getAttribute('j'),
        horizontal,
        part: [p.left, p.top, p.right, p.bottom],
        edge,
        x,
        y,
        a,
      }
    })
}

/** RGB of the screenshot pixel at page (x, y). */
const pixel = (png, x, y) => {
  const k = (Math.round(y) * png.width + Math.round(x)) * 4
  return [png.data[k], png.data[k + 1], png.data[k + 2]]
}

test.describe('Stacked highlight: parts are solid', () => {
  test('nothing of the whole stack shows through a part (pixels over the old line)', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'stacked-highlight')
    const shot = PNG.sync.read(await page.screenshot({ fullPage: true }))
    for (const sel of ['#chart', '#chart2']) {
      const strips = await page.evaluate(edgeStrips, sel)
      expect(strips.length).toBe(6)
      for (const s of strips) {
        // the edge runs inside the part, and the part is what paints there
        const [l, t, r, b] = s.part
        if (s.horizontal) {
          expect(s.edge).toBeGreaterThan(l + 2)
          expect(s.edge).toBeLessThan(r - 2)
        } else {
          expect(s.edge).toBeGreaterThan(t + 2)
          expect(s.edge).toBeLessThan(b - 2)
        }
        expect(s.a).toBeCloseTo(1, 6)
        // every pixel of a strip across the edge is the part's own colour:
        // up to 6px either side of it, kept 2px inside the part's own edges
        const lo = Math.max(s.horizontal ? l : t, s.edge - 6) + 2
        const hi = Math.min(s.horizontal ? r : b, s.edge + 6) - 2
        const at = (v) =>
          s.horizontal ? pixel(shot, v, t + 3) : pixel(shot, (l + r) / 2, v)
        const ref = at(hi)
        let worst = 0
        for (let v = lo; v <= hi; v += 0.5) {
          worst = Math.max(worst, ...at(v).map((c, k) => Math.abs(c - ref[k])))
        }
        expect(worst, `${sel} category ${s.j}`).toBeLessThanOrEqual(2)
        // and that colour is the series' own, opaque (#16a34a)
        expect(
          Math.max(...ref.map((v, k) => Math.abs(v - [22, 163, 74][k]))),
        ).toBeLessThanOrEqual(2)
      }
    }
    expect(errors).toEqual([])
  })

  test('a first pick: frame 0 paints as the whole did, the alpha eases up on the clock', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    await pick(page, '')
    await advance(page, 4000)
    const rec = await recordTransition(page, () => pick(page, 'social'), {
      probe: alphaState,
    })
    const f0 = rec.probes[0]
    expect(f0.parts.length).toBe(12)
    // frame 0: each part on its whole's exact shape and look, the whole at 0
    // under it, so the pair composites to the screen before the pick
    for (const p of f0.parts) {
      const w = f0.wholes.find((x) => x.i === p.i && x.j === p.j)
      expect(close(p.box, w.box)).toBe(true)
      expect(p.a).toBeCloseTo(0.85, 6)
      expect(w.a).toBeLessThan(0.01)
    }
    // up, never down, in small steps (no snap), solid at rest
    for (let n = 1; n < rec.probes.length; n++) {
      for (const p of rec.probes[n].parts) {
        const was = rec.probes[n - 1].parts.find(
          (q) => q.i === p.i && q.j === p.j,
        )
        expect(p.a).toBeGreaterThanOrEqual(was.a - 1e-9)
      }
    }
    expect(maxAlphaStep(rec)).toBeLessThan(0.04)
    const mid = rec.probes[Math.floor(rec.probes.length / 4)]
    expect(mid.parts.some((p) => p.a > 0.86 && p.a < 0.99)).toBe(true)
    const last = rec.probes[rec.probes.length - 1]
    for (const p of last.parts) expect(p.a).toBe(1)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a clear: the alpha eases back to the whole look, then the plain chart', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const rec = await recordTransition(page, () => pick(page, ''), {
      probe: alphaState,
    })
    const f0 = rec.probes[0]
    expect(f0.parts.length).toBe(12)
    for (const p of f0.parts) expect(p.a).toBe(1)
    for (let n = 1; n < rec.probes.length; n++) {
      for (const p of rec.probes[n].parts) {
        const was = rec.probes[n - 1].parts.find(
          (q) => q.i === p.i && q.j === p.j,
        )
        expect(p.a).toBeLessThanOrEqual(was.a + 1e-9)
      }
    }
    expect(maxAlphaStep(rec)).toBeLessThan(0.04)
    // the last frame with parts: each at the whole's look, on its whole's
    // shape, with the whole at 0 under it; the next frame is the plain chart
    const k = rec.probes.findIndex((f) => f.parts.length === 0)
    expect(k).toBeGreaterThan(1)
    const lastWith = rec.probes[k - 1]
    for (const p of lastWith.parts) {
      const w = lastWith.wholes.find((x) => x.i === p.i && x.j === p.j)
      expect(p.a).toBeLessThan(0.86)
      expect(close(p.box, w.box)).toBe(true)
    }
    for (const w of rec.probes[k].wholes) expect(w.a).toBeCloseTo(0.85, 6)
    expect(errors).toEqual([])
  })

  test('a re-pick, a legend hide and show, and a resize stay solid on every frame', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const solidThroughout = (rec) => {
      for (const f of rec.probes) for (const p of f.parts) expect(p.a).toBe(1)
    }
    solidThroughout(
      await recordTransition(page, () => pick(page, 'email'), {
        probe: alphaState,
      }),
    )
    solidThroughout(
      await recordTransition(
        page,
        () => page.evaluate(() => window.chart.toggleSeries('Desktop')),
        { probe: alphaState },
      ),
    )
    solidThroughout(
      await recordTransition(
        page,
        () => page.evaluate(() => window.chart.toggleSeries('Desktop')),
        { probe: alphaState },
      ),
    )
    solidThroughout(
      await recordTransition(
        page,
        () =>
          page.evaluate(() => {
            document.querySelector('#chart').style.width = '520px'
            window.dispatchEvent(new Event('resize'))
          }),
        { probe: alphaState },
      ),
    )
    expect(errors).toEqual([])
  })

  test('a re-pick mid-clear moves on from the alpha on screen', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    const clear = await recordTransition(page, () => pick(page, ''), {
      probe: alphaState,
      ms: 120,
    })
    const screen = clear.probes[clear.probes.length - 1]
    expect(screen.parts.some((p) => p.a < 0.99 && p.a > 0.86)).toBe(true)
    const rec = await recordTransition(page, () => pick(page, 'search'), {
      probe: alphaState,
    })
    for (const p of screen.parts) {
      const now = rec.probes[0].parts.find((q) => q.i === p.i && q.j === p.j)
      expect(now.a).toBeCloseTo(p.a, 6)
    }
    expect(maxAlphaStep(rec)).toBeLessThan(0.04)
    for (const p of rec.probes[rec.probes.length - 1].parts) expect(p.a).toBe(1)
    expect(errors).toEqual([])
  })

  test('without animation a pick lands solid at once', async ({ page }) => {
    const errors = await loadStacked(page)
    await pick(page, '')
    await advance(page, 4000)
    await page.evaluate(() =>
      window.chart.updateOptions(
        { chart: { animations: { enabled: false } } },
        false,
        false,
      ),
    )
    const rec = await recordTransition(page, () => pick(page, 'social'), {
      probe: alphaState,
    })
    expect(rec.probes[0].parts.length).toBe(12)
    for (const f of rec.probes) for (const p of f.parts) expect(p.a).toBe(1)
    expect(errors).toEqual([])
  })

  test('an export mid-pick lands the alpha with the fades; the shapes move on', async ({
    page,
  }) => {
    const errors = await loadStacked(page)
    await pick(page, '')
    await advance(page, 4000)
    const first = await recordTransition(page, () => pick(page, 'social'), {
      probe: alphaState,
      ms: 120,
    })
    const mid = first.probes[first.probes.length - 1]
    expect(mid.parts.every((p) => p.a < 0.99)).toBe(true)
    const exp = await page.evaluate(async () => {
      const svg = await window.chart.getSvgString()
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
      const alphaOf = (c) => {
        const m = /^rgba\(([^)]+)\)$/i.exec(c || '')
        return m ? parseFloat(m[1].split(',')[3]) : 1
      }
      return [...doc.querySelectorAll('.apexcharts-bar-highlight-part')].map(
        (n) =>
          alphaOf(n.getAttribute('fill')) *
          parseFloat(n.getAttribute('fill-opacity') ?? '1'),
      )
    })
    expect(exp.length).toBe(12)
    for (const a of exp) expect(a).toBe(1)
    // on screen too, and the shapes are still on their way
    const rest = await recordTransition(page, async () => {}, {
      probe: alphaState,
    })
    for (const f of rest.probes) for (const p of f.parts) expect(p.a).toBe(1)
    const moved = rest.probes[rest.probes.length - 1].parts.some((p) => {
      const was = mid.parts.find((q) => q.i === p.i && q.j === p.j)
      return !close(p.box, was.box)
    })
    expect(moved).toBe(true)
    expect(errors).toEqual([])
  })
})
