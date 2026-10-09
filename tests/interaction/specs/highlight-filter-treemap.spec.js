/**
 * Highlight filter on treemaps: a tile keeps its box, faded, and its part is
 * the tile's bottom share, solid, drawn inside the tile's own fill (a
 * vertical gradient with a hard stop). Nested parents are frames.
 *
 * Runs bare charts and samples/vanilla-js/highlight/treemap-highlight on
 * virtual time, so every frame can be read. What jsdom cannot see:
 *   - frame 0 of a pick is the chart as it was (each tile solid, the faded
 *     rest at 0), then the share drains to the part as the rest fades in, on
 *     the tile's own clock: in step with the tile's box when both move, and
 *     with the shade colour easing in the stops, never written over
 *   - re-picks and two updates in one frame start from the screen
 *   - a clear lands on the plain DOM, nothing of the feature left behind
 *   - an update without animation moves nothing
 *   - the pointer anywhere on a tile, solid or faded, is on that tile
 *   - a white label takes the text colour the frame the solid share leaves it
 *   - a click-to-zoom carries the shares: ghosts ride off with theirs, no
 *     ghost is a highlighted tile, and frame 0 is the screen
 *   - nested re-picks ease on the full render, and parents never fade
 *   - a hidden series closes with the look it had (a treemap's legend does
 *     not toggle, so through hideSeries)
 *   - a mount draws the shares at rest from the first frame
 *   - a cross-type morph into a treemap starts plain
 */

import { test, expect } from '@playwright/test'
import {
  BUNDLE,
  loadSample,
  recordTransition,
  finite,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance, installVirtualTime } from '../helpers/virtual-time.js'

/**
 * Render `options` on a bare page under virtual time with the highlight
 * filter (and, when asked, the morph) loaded.
 */
async function mount(
  page,
  options,
  { settleMs = 4000, morph = false, canvas = false } = {},
) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setContent('<div id="chart" style="width:720px"></div>')
  await installVirtualTime(page, { bare: true })
  await page.addScriptTag({ path: BUNDLE })
  for (const f of [
    'highlight-filter',
    ...(morph ? ['morph'] : []),
    ...(canvas ? ['renderer-canvas'] : []),
  ]) {
    await page.addScriptTag({
      path: BUNDLE.replace(/apexcharts\.js$/, `features/${f}.js`),
    })
  }
  await page.evaluate((o) => {
    window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
    window.chart.render()
  }, options)
  if (settleMs) await advance(page, settleMs)
  return errors
}

const SPEED = 400

function flat(extra = {}) {
  return {
    series: [
      {
        name: 'S',
        data: [
          { x: 'A', y: 40 },
          { x: 'B', y: 30 },
          { x: 'C', y: 20 },
          { x: 'D', y: 10 },
        ],
      },
    ],
    legend: { show: false },
    dataLabels: { enabled: true },
    ...extra,
    chart: {
      type: 'treemap',
      height: 360,
      toolbar: { show: false },
      animations: { speed: SPEED, dynamicAnimation: { speed: SPEED } },
      ...(extra.chart || {}),
    },
  }
}

/** The series with each point's part from `parts` (null for none). */
const withParts = (series, parts) =>
  series.map((s, i) => ({
    ...s,
    data: s.data.map((d, j) =>
      parts?.[i]?.[j] === undefined ? d : { ...d, highlight: parts[i][j] },
    ),
  }))

const NESTED = [
  {
    name: 'Shop',
    data: [
      {
        x: 'Apparel',
        children: [
          { x: 'Jackets', y: 40 },
          { x: 'Tees', y: 20 },
        ],
      },
      {
        x: 'Home',
        children: [
          { x: 'Lamps', y: 30 },
          { x: 'Rugs', y: 10 },
        ],
      },
    ],
  },
]

/**
 * Every tile on screen and what it paints, read in the page every frame. A
 * plain tile is a share of 1 in its fill colour.
 */
function tmState(root = '#chart') {
  const r = document.querySelector(root)
  const rgb = (c) => (c.match(/[\d.]+/g) || []).slice(0, 4).map(Number)
  const look = (n) => {
    const fill = n.getAttribute('fill') || ''
    const m = /^url\(#([^)]+)\)$/.exec(fill)
    if (!m) return { s: 1, f: 1, c: rgb(fill), url: false }
    const g = document.getElementById(m[1])
    const st = g ? [...g.querySelectorAll('stop')] : []
    if (st.length !== 4)
      return { s: NaN, f: NaN, c: [], url: true, missing: true }
    return {
      s: +st[1].getAttribute('offset'),
      f: +st[2].getAttribute('stop-opacity'),
      c: rgb(st[0].getAttribute('stop-color')),
      url: true,
    }
  }
  const tiles = [
    ...r.querySelectorAll(
      '.apexcharts-treemap .apexcharts-series .apexcharts-treemap-rect',
    ),
  ].map((n) => {
    const lb = n.nextElementSibling?.classList.contains(
      'apexcharts-data-labels',
    )
      ? n.nextElementSibling.querySelector('text')
      : null
    const tb = lb?.getBBox()
    const y = +n.getAttribute('y')
    const h = +n.getAttribute('height')
    return {
      key:
        n.closest('.apexcharts-series').getAttribute('data:realIndex') +
        n.getAttribute('data:key'),
      j: +n.getAttribute('j'),
      box: ['x', 'y', 'width', 'height'].map((a) => +n.getAttribute(a)),
      ...look(n),
      hl: n.classList.contains('apexcharts-highlight-tile'),
      share: n.getAttribute('data:hl-share'),
      label: lb ? lb.getAttribute('fill') : null,
      // the share at which the solid edge reaches the label's top
      need: tb && h > 0 ? (y + h - tb.y) / h : null,
    }
  })
  const ghosts = [...r.querySelectorAll('.apexcharts-treemap-ghosts rect')].map(
    (n) => ({
      ...look(n),
      hl:
        n.classList.contains('apexcharts-highlight-tile') ||
        n.hasAttribute('data:hl-share'),
    }),
  )
  return {
    tiles,
    ghosts,
    grads: [...r.querySelectorAll('linearGradient')].filter(
      (g) => !g.closest('.apexcharts-treemap-ghosts'),
    ).length,
    parents: [...r.querySelectorAll('.apexcharts-treemap-parent-rect')].map(
      (n) => n.getAttribute('fill') + '|' + n.getAttribute('fill-opacity'),
    ),
    headers: [...r.querySelectorAll('.apexcharts-treemap-parent-label')].map(
      (n) => n.textContent,
    ),
  }
}

/** A fresh render of the chart's options with `patch` applied, animations
 * off, read with tmState. */
async function fresh(page, patch) {
  await page.evaluate((patch) => {
    const host = document.createElement('div')
    host.id = 'fresh'
    host.style.cssText = 'width:720px;position:absolute;left:0;top:0'
    document.body.appendChild(host)
    const o = JSON.parse(JSON.stringify(window.__opts0))
    Object.assign(o, patch)
    o.chart.animations = { enabled: false }
    window.fresh = new window.ApexCharts(host, o)
    window.fresh.render()
  }, patch)
  await advance(page, 500)
  return page.evaluate(() => {
    const s = window.__probe('#fresh')
    window.fresh.destroy()
    document.querySelector('#fresh').remove()
    return s
  })
}
const remember = (page) =>
  page.evaluate(() => {
    window.__opts0 = JSON.parse(JSON.stringify(window.chart.opts))
  })

const near = (a, b, tol = 0.01) => Math.abs(a - b) <= tol
const sameColour = (a, b, tol = 1.5) =>
  a.length >= 3 &&
  b.length >= 3 &&
  [0, 1, 2].every((k) => Math.abs(a[k] - b[k]) <= tol)
/** Where x is between a and b, 0..1. */
const prog = (x, a, b) => (Math.abs(b - a) < 1e-6 ? 1 : (x - a) / (b - a))
const byKey = (st) => new Map(st.tiles.map((t) => [t.key, t]))
/** Two tiles paint the same: the same colour, and the same share where the
 * faded rest shows. */
function samePaint(a, b, tol = 0.01) {
  if (!sameColour(a.c, b.c)) return false
  if (a.s >= 1 - tol && b.s >= 1 - tol) return true
  return near(a.s, b.s, tol) && near(a.f, b.f, tol)
}
function expectSameScreen(got, want, label) {
  const w = byKey(want)
  for (const t of got.tiles) {
    const o = w.get(t.key)
    expect(o, `${label}: ${t.key} is new`).toBeTruthy()
    expect(
      samePaint(t, o),
      `${label}: ${t.key} paints ${JSON.stringify([t.s, t.f, t.c])}, was ${JSON.stringify([o.s, o.f, o.c])}`,
    ).toBe(true)
  }
}

test.describe('Highlight filter, treemap', () => {
  test('a first pick starts as the tiles on screen and drains each to its share on the tile clock (fast path)', async ({
    page,
  }) => {
    const opts = flat()
    const errors = await mount(page, opts)
    const fast0 = await page.evaluate(() => window.chart._updateStats.fast)
    const parts = [[10, 21, null, 10]]
    const series = withParts(opts.series, parts)
    const rec = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), series),
      { probe: tmState },
    )
    expect(await page.evaluate(() => window.chart._updateStats.fast)).toBe(
      fast0 + 1,
    )
    const before = rec.probeBefore
    expectSameScreen(rec.probes[0], before, 'frame 0')
    const share = { '0/0:A': 0.25, '0/1:B': 0.7, '0/2:C': 0, '0/3:D': 1 }
    let moving = 0
    for (const fr of rec.probes) {
      /** one clock: every tile's share and fade, and across tiles */
      const es = []
      for (const t of fr.tiles) {
        expect(t.url).toBe(true)
        const ef = t.f / 0.2
        if (share[t.key] < 1) {
          const e = prog(t.s, 1, share[t.key])
          expect(
            near(e, ef, 0.02),
            `${t.key}: share at ${e}, fade at ${ef}`,
          ).toBe(true)
          es.push(e)
        }
      }
      expect(Math.max(...es) - Math.min(...es)).toBeLessThan(0.02)
      if (es[0] > 0.05 && es[0] < 0.95) moving++
    }
    expect(moving).toBeGreaterThan(6)
    await remember(page)
    const last = rec.probes[rec.probes.length - 1]
    const want = await fresh(page, { series })
    expectSameScreen(last, want, 'landed')
    for (const t of last.tiles) {
      expect(t.hl).toBe(true)
      expect(t.share).toBe(
        String(
          parts[0][t.j] == null
            ? ''
            : parts[0][t.j] / opts.series[0].data[t.j].y,
        ),
      )
    }
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a pick that also moves the tiles and their shades: share, box and colour on one clock (120 tiles)', async ({
    page,
  }) => {
    const n = 120
    const data = (k) =>
      Array.from({ length: n }, (_, j) => ({
        x: 'T' + j,
        y: 5 + ((j * 37 + k * 11) % 50),
      }))
    const opts = flat({
      series: [{ name: 'S', data: data(0) }],
      dataLabels: { enabled: false },
    })
    const errors = await mount(page, opts)
    const series = [
      {
        name: 'S',
        data: data(1).map((d, j) => ({ ...d, highlight: d.y * ((j % 5) / 4) })),
      },
    ]
    const rec = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), series),
      { probe: tmState },
    )
    const before = byKey(rec.probeBefore)
    expectSameScreen(rec.probes[0], rec.probeBefore, 'frame 0')
    const last = byKey(rec.probes[rec.probes.length - 1])
    let checked = 0
    let shaded = 0
    for (const fr of rec.probes) {
      for (const t of fr.tiles) {
        const a = before.get(t.key)
        const b = last.get(t.key)
        // the box's progress (its height or width, whichever moved most)
        const k =
          Math.abs(b.box[3] - a.box[3]) > Math.abs(b.box[2] - a.box[2]) ? 3 : 2
        if (Math.abs(b.box[k] - a.box[k]) < 4 || b.s > 0.95) continue
        const eb = prog(t.box[k], a.box[k], b.box[k])
        const es = prog(t.s, 1, b.s)
        expect(
          near(eb, es, 0.03),
          `${t.key}: box at ${eb}, share at ${es}`,
        ).toBe(true)
        checked++
        // the shade eases in the stops: never the old or the new colour
        // mid-flight when the two differ, and the fill stays the gradient
        expect(t.url).toBe(true)
        if (es > 0.2 && es < 0.8 && !sameColour(a.c, b.c, 6)) {
          if (!sameColour(t.c, a.c, 2) && !sameColour(t.c, b.c, 2)) shaded++
        }
      }
    }
    expect(checked).toBeGreaterThan(80)
    expect(shaded).toBeGreaterThan(10)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a re-pick mid-flight, and two updates in one frame, start from the screen', async ({
    page,
  }) => {
    const opts = flat()
    const errors = await mount(page, opts)
    const s1 = withParts(opts.series, [[10, 15, 5, 2]])
    const s2 = withParts(opts.series, [[30, 3, 18, null]])
    await page.evaluate((s) => window.chart.updateSeries(s), s1)
    await advance(page, 130)
    const rec = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), s2),
      { probe: tmState },
    )
    expectSameScreen(rec.probes[0], rec.probeBefore, 're-pick frame 0')
    // the screen was mid-flight, not at either end
    expect(rec.probeBefore.tiles[0].s).toBeGreaterThan(0.26)
    expect(rec.probeBefore.tiles[0].s).toBeLessThan(0.99)
    await advance(page, 2000)
    // two updates from one handler
    const s3 = withParts(opts.series, [[2, 25, 10, 5]])
    const rec2 = await recordTransition(
      page,
      () =>
        page.evaluate((s) => {
          window.chart.updateOptions({ highlightFilter: { fadeOpacity: 0.3 } })
          window.chart.updateSeries(s)
        }, s3),
      { probe: tmState },
    )
    expectSameScreen(rec2.probes[0], rec2.probeBefore, 'two updates, frame 0')
    const last = rec2.probes[rec2.probes.length - 1]
    expect(near(last.tiles[0].s, 0.05)).toBe(true)
    expect(near(last.tiles[0].f, 0.3)).toBe(true)
    expectNoViolations(finite(rec2))
    expect(errors).toEqual([])
  })

  test('a clear grows each share back over its tile and lands on the never-highlighted DOM', async ({
    page,
  }) => {
    const opts = flat()
    const errors = await mount(page, {
      ...opts,
      series: withParts(opts.series, [[10, 15, null, 4]]),
    })
    const plainHTML = () =>
      page.evaluate(() =>
        [
          ...document.querySelectorAll(
            '#chart .apexcharts-treemap .apexcharts-series',
          ),
        ]
          .map((g) => g.outerHTML)
          .join(''),
      )
    const rec = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), opts.series),
      { probe: tmState },
    )
    expectSameScreen(rec.probes[0], rec.probeBefore, 'frame 0')
    const was = byKey(rec.probeBefore)
    let moving = 0
    for (const fr of rec.probes.slice(0, -1)) {
      for (const t of fr.tiles) {
        if (!t.url) continue
        const a = was.get(t.key)
        const e = prog(t.s, a.s, 1)
        expect(
          near(1 - t.f / a.f, e, 0.02),
          `${t.key}: share ${e}, fade ${t.f}`,
        ).toBe(true)
        if (t.key === '0/0:A' && e > 0.05 && e < 0.95) moving++
      }
    }
    expect(moving).toBeGreaterThan(6)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.tiles.every((t) => !t.url && !t.hl && t.share == null)).toBe(
      true,
    )
    expect(last.grads).toBe(0)
    const got = await plainHTML()
    // the same options never highlighted, drawn and moved the same way
    await page.evaluate((o) => {
      window.chart.destroy()
      document.querySelector('#chart').innerHTML = ''
      window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
      window.chart.render()
    }, opts)
    await advance(page, 2000)
    expect(got).toBe(await plainHTML())
    expect(errors).toEqual([])
  })

  test('an export mid-flight lands the fade only, the share moves on; a clear lands plain', async ({
    page,
  }) => {
    const opts = flat()
    const errors = await mount(page, opts)
    await remember(page)
    const series = withParts(opts.series, [[10, 21, null, 10]])
    // Each tile's share and fade as the export holds them (its gradient is
    // in the exported copy's own defs).
    const exported = () =>
      page.evaluate(async () => {
        const svg = await window.chart.getSvgString()
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        return [...doc.querySelectorAll('.apexcharts-treemap-rect')].map(
          (n) => {
            const m = /^url\(#([^)]+)\)$/.exec(n.getAttribute('fill') || '')
            const st = m ? [...doc.querySelectorAll(`[id="${m[1]}"] stop`)] : []
            return st.length === 4
              ? {
                  s: +st[1].getAttribute('offset'),
                  f: +st[2].getAttribute('stop-opacity'),
                }
              : { s: 1, f: 1, plain: !m }
          },
        )
      })
    const first = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), series),
      { probe: tmState, ms: 160 },
    )
    const mid = first.probes[first.probes.length - 1]
    const exp = await exported()
    exp.forEach((t, k) => {
      expect(t.f).toBeCloseTo(0.2, 6)
      expect(near(t.s, mid.tiles[k].s, 1e-6)).toBe(true)
    })
    const rest = await recordTransition(page, async () => {}, {
      probe: tmState,
    })
    // The share continues from where it was, the fade stays landed.
    rest.probes[0].tiles.forEach((t, k) =>
      expect(near(t.s, mid.tiles[k].s, 0.01)).toBe(true),
    )
    for (const fr of rest.probes) {
      for (const t of fr.tiles) expect(t.f).toBeCloseTo(0.2, 6)
    }
    const last = rest.probes[rest.probes.length - 1]
    expect(
      mid.tiles.filter((t, k) => Math.abs(t.s - last.tiles[k].s) > 0.1).length,
    ).toBe(3)
    expectSameScreen(last, await fresh(page, { series }), 'landed')
    expectNoViolations(finite(rest))

    // A clear has nothing to show but the plain tiles: it lands.
    await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), opts.series),
      { ms: 160 },
    )
    expect((await exported()).every((t) => t.plain)).toBe(true)
    const after = await recordTransition(page, async () => {}, {
      probe: tmState,
    })
    for (const fr of after.probes) {
      expect(fr.tiles.every((t) => !t.url && !t.hl)).toBe(true)
    }
    expect(errors).toEqual([])
  })

  test('the canvas renderer asked for: a treemap still draws in SVG and its shares move with its tiles', async ({
    page,
  }) => {
    const opts = flat({ chart: { type: 'treemap', renderer: 'canvas' } })
    opts.chart = { ...flat().chart, renderer: 'canvas' }
    const errors = await mount(page, opts, { canvas: true })
    expect(await page.evaluate(() => window.chart.ctx.renderer?.kind)).toBe(
      'canvas',
    )
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(
          (s) => window.chart.updateSeries(s),
          withParts(opts.series, [[10, 15, 5, 2]]),
        ),
      { probe: tmState },
    )
    expectSameScreen(rec.probes[0], rec.probeBefore, 'frame 0')
    let moving = 0
    for (const fr of rec.probes) {
      const e = prog(fr.tiles[0].s, 1, 0.25)
      expect(near(e, fr.tiles[0].f / 0.2, 0.02)).toBe(true)
      if (e > 0.05 && e < 0.95) moving++
    }
    expect(moving).toBeGreaterThan(6)
    expect(errors).toEqual([])
  })

  test('an update without animation moves nothing', async ({ page }) => {
    const opts = flat()
    const errors = await mount(page, opts)
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(
          (s) => window.chart.updateSeries(s, false),
          withParts(opts.series, [[10, 15, 5, 2]]),
        ),
      { probe: tmState, ms: 300 },
    )
    const last = rec.probes[rec.probes.length - 1]
    for (const fr of rec.probes) {
      fr.tiles.forEach((t, k) => expect(samePaint(t, last.tiles[k])).toBe(true))
    }
    expect(near(last.tiles[0].s, 0.25)).toBe(true)
    expect(errors).toEqual([])
  })

  test("the pointer anywhere on a tile, solid or faded, shows its row: part / whole, the tile's own colour", async ({
    page,
  }) => {
    const opts = flat({ plotOptions: { treemap: { distributed: true } } })
    const errors = await mount(page, {
      ...opts,
      series: withParts(opts.series, [[10, 15, 5, 2]]),
    })
    for (const j of [0, 1, 2]) {
      const box = await page
        .locator(`#chart .apexcharts-treemap-rect[j="${j}"]`)
        .boundingBox()
      const own = await page.evaluate((j) => {
        const n = document.querySelector(
          `#chart .apexcharts-treemap-rect[j="${j}"]`,
        )
        const g = document.getElementById(
          /url\(#([^)]+)\)/.exec(n.getAttribute('fill'))[1],
        )
        return g.querySelector('stop').getAttribute('stop-color')
      }, j)
      // near the bottom (the solid share) and near the top (the faded rest)
      for (const fy of [0.92, 0.08]) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height * fy)
        await advance(page, 120)
        const tip = await page.evaluate(() => {
          const t = document.querySelector('#chart .apexcharts-tooltip')
          return {
            on: t.classList.contains('apexcharts-active'),
            text: t.querySelector('.apexcharts-tooltip-text-y-value')
              ?.textContent,
            swatch: t.querySelector('.apexcharts-tooltip-marker')?.style
              .boxShadow,
          }
        })
        expect(tip.on, `tile ${j} at ${fy}`).toBe(true)
        const part = [10, 15, 5][j]
        const whole = [40, 30, 20][j]
        expect(tip.text).toBe(`${part} / ${whole}`)
        const rgb = (c) => (c.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
        expect(rgb(tip.swatch)).toEqual(rgb(own))
      }
      await page.mouse.move(0, 0)
      await advance(page, 120)
    }
    expect(errors).toEqual([])
  })

  test('a white label takes the text colour once the solid share leaves its top, and back on a clear', async ({
    page,
  }) => {
    const opts = flat()
    const errors = await mount(page, opts)
    const fore = await page.evaluate(
      () => window.chart.w.config.chart.foreColor,
    )
    const check = (rec, label) => {
      let flips = 0
      let prev = null
      for (const fr of rec.probes) {
        const t = fr.tiles.find((x) => x.key === '0/0:A')
        if (prev != null && t.label !== prev) flips++
        prev = t.label
        if (!t.url || Math.abs(t.s - t.need) < 0.02) continue
        expect(t.label, `${label}: share ${t.s}, top at ${t.need}`).toBe(
          t.s >= t.need ? '#fff' : fore,
        )
      }
      expect(flips, label).toBe(1)
    }
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(
          (s) => window.chart.updateSeries(s),
          withParts(opts.series, [[4, 15, 5, 2]]),
        ),
      { probe: tmState },
    )
    check(rec, 'pick')
    const rec2 = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), opts.series),
      { probe: tmState },
    )
    check(rec2, 'clear')
    expect(rec2.probes[rec2.probes.length - 1].tiles[0].label).toBe('#fff')
    expect(errors).toEqual([])
  })

  test('a mount with a pick grows the tiles with their shares at rest from the first frame', async ({
    page,
  }) => {
    const opts = flat()
    const errors = await mount(
      page,
      { ...opts, series: withParts(opts.series, [[10, 15, 5, 2]]) },
      { settleMs: 0 },
    )
    const rec = await recordTransition(page, async () => {}, {
      probe: tmState,
      ms: 1200,
    })
    let growing = 0
    for (const fr of rec.probes) {
      for (const t of fr.tiles) {
        expect(t.url).toBe(true)
        expect(near(t.f, 0.2)).toBe(true)
        expect(near(t.s, [0.25, 0.5, 0.25, 0.2][t.j])).toBe(true)
      }
      if (
        fr.tiles[0] &&
        fr.tiles[0].box[2] > 1 &&
        fr.tiles[0].box[2] <
          rec.probes[rec.probes.length - 1].tiles[0].box[2] - 2
      )
        growing++
    }
    expect(growing).toBeGreaterThan(4)
    expect(errors).toEqual([])
  })

  test('a hidden series closes with the look it had, and comes back with its parts', async ({
    page,
  }) => {
    const opts = flat({
      legend: { show: true },
      series: [
        {
          name: 'One',
          data: [
            { x: 'A', y: 40, highlight: 10 },
            { x: 'B', y: 30, highlight: 15 },
          ],
        },
        {
          name: 'Two',
          data: [
            { x: 'C', y: 20, highlight: 5 },
            { x: 'D', y: 10, highlight: 8 },
          ],
        },
      ],
    })
    const errors = await mount(page, opts)
    const rec = await recordTransition(
      page,
      () => page.evaluate(() => window.chart.hideSeries('Two')),
      { probe: tmState },
    )
    const was = byKey(rec.probeBefore)
    // The hidden series closes as one tile of nothing under a key of its
    // own: it is held to the tile that stood at its series and index.
    const si = (t) => t.key.split('/')[0]
    let placeholder = 0
    for (const fr of rec.probes) {
      for (const t of fr.tiles) {
        let a = was.get(t.key)
        if (!a) {
          placeholder++
          a = rec.probeBefore.tiles.find((b) => si(b) === si(t) && b.j === t.j)
        }
        expect(a, `${t.key} has a tile it stood for`).toBeTruthy()
        expect(t.url, `${t.key} is still drawn with its part`).toBe(true)
        expect(
          samePaint(t, a),
          `${t.key} kept its look while it closed: ${JSON.stringify([t.s, t.f, t.c])}, was ${JSON.stringify([a.s, a.f, a.c])}`,
        ).toBe(true)
      }
    }
    expect(placeholder).toBeGreaterThan(0)
    const end = byKey(rec.probes[rec.probes.length - 1])
    expect(end.has('1/0:C') || end.has('1/1:D')).toBe(false)
    const back = await recordTransition(
      page,
      () => page.evaluate(() => window.chart.showSeries('Two')),
      { probe: tmState },
    )
    const last = byKey(back.probes[back.probes.length - 1])
    expect(near(last.get('1/0:C').s, 0.25)).toBe(true)
    expect(near(last.get('1/1:D').s, 0.8)).toBe(true)
    expect(near(last.get('0/1:B').s, 0.5)).toBe(true)
    expectNoViolations(finite(back))
    expect(errors).toEqual([])
  })

  test('nested: a re-pick eases on the full render, parents never fade, headers add up the new parts', async ({
    page,
  }) => {
    const opts = flat({
      series: NESTED,
      plotOptions: {
        treemap: {
          parents: {
            header: {
              formatter: (name, o) =>
                o.node.highlight?.value != null
                  ? `${name} ${o.node.highlight.value}/${o.node.highlight.total}`
                  : name,
            },
          },
        },
      },
    })
    // the formatter cannot be sent as JSON: built in the page
    const errors = await mount(page, { ...opts, plotOptions: {} })
    await page.evaluate(() => {
      window.chart.updateOptions(
        {
          plotOptions: {
            treemap: {
              parents: {
                header: {
                  formatter: (name, o) =>
                    o.node.highlight?.value != null
                      ? `${name} ${o.node.highlight.value}/${o.node.highlight.total}`
                      : name,
                },
              },
            },
          },
        },
        false,
        false,
      )
    })
    await page.evaluate(() =>
      window.chart.highlightFilter.set([[10, 5, null, 8]], { animate: false }),
    )
    await advance(page, 1000)
    const full0 = await page.evaluate(() => window.chart._updateStats.full)
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.highlightFilter.set([[30, 20, 15, 1]]),
        ),
      { probe: tmState },
    )
    expect(
      await page.evaluate(() => window.chart._updateStats.full),
    ).toBeGreaterThan(full0)
    expectSameScreen(rec.probes[0], rec.probeBefore, 'frame 0')
    let moving = 0
    for (const fr of rec.probes) {
      expect(fr.parents).toEqual(rec.probeBefore.parents)
      const t = fr.tiles.find((x) => x.key.endsWith('Jackets'))
      const e = prog(t.s, 0.25, 0.75)
      if (e > 0.05 && e < 0.95) moving++
    }
    expect(moving).toBeGreaterThan(6)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.headers.join('|')).toContain('Apparel 50/60')
    expect(last.headers.join('|')).toContain('Home 16/40')
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('click-to-zoom and back carry the shares: ghosts ride off with theirs, and none is a highlighted tile', async ({
    page,
  }) => {
    const opts = flat({
      series: withNested([[10, 5, 15, 8]]),
      plotOptions: { treemap: { zoom: { enabled: true } } },
    })
    const errors = await mount(page, opts)
    for (const [label, act] of [
      [
        'zoom in',
        () =>
          page
            .locator('#chart .apexcharts-treemap-parent-header')
            .nth(1)
            .click(),
      ],
      [
        'breadcrumb back',
        () =>
          page
            .locator(
              '#chart .apexcharts-breadcrumb .apexcharts-breadcrumb-item',
            )
            .first()
            .click(),
      ],
    ]) {
      const rec = await recordTransition(page, act, { probe: tmState })
      const was = byKey(rec.probeBefore)
      // frame 0 is the screen: what stays paints as it did, and what rides
      // off paints as it did too
      for (const t of rec.probes[0].tiles) {
        const a = was.get(t.key)
        if (a) expect(samePaint(t, a), `${label}: ${t.key}`).toBe(true)
      }
      let ghosts = 0
      for (const fr of rec.probes) {
        for (const t of fr.tiles) {
          const a = was.get(t.key)
          // a zoom changes no share
          if (a)
            expect(
              near(t.s, a.s) && near(t.f, a.f),
              `${label}: ${t.key} share moved`,
            ).toBe(true)
        }
        for (const gh of fr.ghosts) {
          expect(gh.hl, `${label}: a ghost is still a highlighted tile`).toBe(
            false,
          )
          expect(gh.missing, `${label}: a ghost lost its gradient`).toBeFalsy()
          if (gh.url) ghosts++
        }
      }
      // zooming in leaves the other branch behind; zooming out leaves nothing
      if (label === 'zoom in') {
        expect(
          ghosts,
          `${label}: ghosts ride off with their shares`,
        ).toBeGreaterThan(0)
      }
      await advance(page, 1500)
    }
    expectNoViolations(
      finite(await recordTransition(page, async () => {}, { ms: 100 })),
    )
    expect(errors).toEqual([])
  })

  test('the sample: a parent header tooltip states the part of its group', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'treemap-highlight')
    const box = await page
      .locator('.apexcharts-treemap-parent-header')
      .first()
      .boundingBox()
    await page.mouse.move(box.x + 8, box.y + box.height / 2)
    await advance(page, 150)
    const row = await page.evaluate(
      () =>
        document.querySelector(
          '.apexcharts-tooltip .apexcharts-tooltip-text-y-value',
        )?.textContent,
    )
    expect(row).toBe('$134k / $280k')
    // a region pick through set() re-reads every leaf
    await page.locator('[data-region="west"]').click()
    await advance(page, 1500)
    const st = await page.evaluate(
      () =>
        document.querySelector('.apexcharts-treemap-parent-label').textContent,
    )
    expect(st).toBe('Apparel  $77k / $280k')
    expect(errors).toEqual([])
  })

  test('a cross-type morph into a treemap starts plain and fills in on the morph clock', async ({
    page,
  }) => {
    const opts = {
      series: [
        {
          name: 'Shop',
          data: NESTED[0].data.map((g) => ({
            ...g,
            children: g.children.map((c, k) => ({
              ...c,
              highlight: c.y * (k ? 0.2 : 0.6),
            })),
          })),
        },
      ],
      chart: {
        type: 'sunburst',
        height: 360,
        toolbar: { show: false },
        animations: { speed: SPEED, dynamicAnimation: { speed: SPEED } },
      },
      legend: { show: false },
    }
    const errors = await mount(page, opts, { morph: true })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({ chart: { type: 'treemap' } }),
        ),
      { probe: tmState, ms: 2500 },
    )
    const f0 = rec.probes[0]
    expect(f0.tiles.length).toBe(4)
    for (const t of f0.tiles) expect(t.s >= 0.999 || !t.url).toBe(true)
    const last = rec.probes[rec.probes.length - 1]
    for (const t of last.tiles)
      expect(
        near(
          t.s,
          t.key.endsWith('Jackets') || t.key.endsWith('Lamps') ? 0.6 : 0.2,
        ),
      ).toBe(true)
    expectNoViolations(finite(rec))
    // and back: the sunburst draws as it always does, nothing pointing at a
    // tile's gradient
    const out = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({ chart: { type: 'sunburst' } }),
        ),
      { ms: 2500 },
    )
    expectNoViolations(finite(out))
    const urls = await page.evaluate(
      () =>
        [
          ...document.querySelectorAll('#chart .apexcharts-sunburst path'),
        ].filter((n) =>
          /url\(#SvgjsGradient/.test(n.getAttribute('fill') || ''),
        ).length,
    )
    expect(urls).toBe(0)
    expect(errors).toEqual([])
  })
})

function withNested(parts) {
  let k = 0
  return [
    {
      ...NESTED[0],
      data: NESTED[0].data.map((g) => ({
        ...g,
        children: g.children.map((c) => ({ ...c, highlight: parts[0][k++] })),
      })),
    },
  ]
}
