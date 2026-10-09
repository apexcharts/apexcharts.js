/**
 * Highlight filter on pie, donut and polarArea: each slice keeps its angle,
 * faded, and its part is the same wedge cut to the part's share of the
 * radius, solid in front.
 *
 * Runs bare charts and samples/vanilla-js/highlight/pie-highlight on virtual
 * time, so every frame can be read. What jsdom cannot see:
 *   - frame 0 of a pick is the chart as it was (each part starts as its
 *     whole, which sits at 0 under it), then the parts drain to size on the
 *     slices' own clock, the fade and the radius in step on every frame
 *   - re-picks, two updates in one frame and clears start from the screen
 *   - a clear lands on the plain chart, nothing of the feature left behind
 *   - a legend-hidden slice closes with its part; shown again, they open
 *     together
 *   - the pointer on a part (inside its whole, or past it on a polarArea) is
 *     on its slice: tooltip, hover band, centre label, click-to-explode
 *   - an exploded slice takes its part and edge along, through a circle
 *     resize too, and a cross-type morph never pairs a part
 */

import { test, expect } from '@playwright/test'
import {
  BUNDLE,
  loadSample,
  recordTransition,
  settles,
  checkAll,
  finite,
  noFlash,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance, installVirtualTime } from '../helpers/virtual-time.js'

const LABELS = ['North', 'South', 'East', 'West']
const VALUES = [40, 30, 20, 10]
const PICK = [20, 15, 5, null]
const REPICK = [10, 25, 15, 5]

/**
 * Render `options` on a bare page under virtual time with the highlight
 * filter loaded.
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
  // What settles() renders fresh, with its own target applied.
  await page.evaluate(() => {
    window.__opts0 = JSON.parse(JSON.stringify(window.chart.opts))
  })
  return errors
}

function circle(type, extra = {}) {
  return {
    series: VALUES,
    labels: LABELS,
    dataLabels: { enabled: true },
    legend: { position: 'bottom' },
    ...extra,
    chart: {
      type,
      height: 380,
      toolbar: { show: false },
      animations: { speed: 400, dynamicAnimation: { speed: 400 } },
      ...(extra.chart || {}),
    },
    highlightFilter: { data: null, ...(extra.highlightFilter || {}) },
  }
}

/** Slices, parts and labels on screen, read in the page every frame. */
function pieState(root = '#chart') {
  const r = document.querySelector(root)
  const outer = (d) => {
    const m = /A\s*([-\d.e]+)/.exec(d || '')
    return m ? parseFloat(m[1]) : null
  }
  const op = (el) => parseFloat(el.getAttribute('fill-opacity') ?? '1')
  const wholes = [...r.querySelectorAll('.apexcharts-pie-area')].map((el) => ({
    j: +el.getAttribute('j'),
    op: op(el),
    d: el.getAttribute('d') || '',
    r: outer(el.getAttribute('d')),
    tf: el.getAttribute('transform'),
    stroke: el.getAttribute('stroke'),
    sop: el.getAttribute('stroke-opacity'),
  }))
  const parts = [...r.querySelectorAll('.apexcharts-pie-highlight-part')].map(
    (el) => ({
      j: +el.previousElementSibling.getAttribute('j'),
      d: el.getAttribute('d') || '',
      r: outer(el.getAttribute('d')),
      op: op(el),
      tf: el.getAttribute('transform'),
    }),
  )
  const edges = [...r.querySelectorAll('.apexcharts-highlight-edge')].map(
    (el) => ({ tf: el.getAttribute('transform'), d: el.getAttribute('d') }),
  )
  const o = r.getBoundingClientRect()
  const labels = [...r.querySelectorAll('.apexcharts-pie-label')].map((t) => {
    const b = t.getBoundingClientRect()
    return {
      slice: +t.parentNode.getAttribute('data:slice'),
      text: t.textContent,
      at: [b.x + b.width / 2 - o.x, b.y + b.height / 2 - o.y],
      op: parseFloat(getComputedStyle(t).opacity),
    }
  })
  const centre = r.querySelector('.apexcharts-datalabel-value')?.textContent
  const pie = window.chart.ctx.pie
  const ct = window.chart.w.globals.circleTween
  return {
    wholes,
    parts,
    edges,
    labels,
    centre,
    cx: pie?.centerX,
    cy: pie?.centerY,
    circling: !!ct && !ct.done,
  }
}

/** Where a slice path's outer arc starts and ends, in degrees round the
 * centre. */
function arcAngles(d, cx, cy) {
  const m =
    /M\s*([-\d.e]+)\s+([-\d.e]+)\s*A\s*[-\d.e]+\s+[-\d.e]+\s+[-\d.e]+\s+[01]\s+[01]\s+([-\d.e]+)\s+([-\d.e]+)/.exec(
      d || '',
    )
  if (!m) return null
  const a = (x, y) => (Math.atan2(+y - cy, +x - cx) * 180) / Math.PI
  return [a(m[1], m[2]), a(m[3], m[4])]
}

const pick = (page, data) =>
  page.evaluate(
    (d) => window.chart.updateOptions({ highlightFilter: { data: d } }),
    data,
  )
const target = (data) =>
  `() => ({ highlightFilter: { data: ${JSON.stringify(data)} } })`
const byJ = (list, j) => list.find((x) => x.j === j)
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol

test.describe('Highlight filter, circles: pick, re-pick, clear', () => {
  for (const type of ['pie', 'donut']) {
    test(`${type}: a pick starts from the screen and drains the parts on one clock`, async ({
      page,
    }) => {
      const errors = await mount(page, circle(type))
      const before = await page.evaluate(pieState)
      const rec = await recordTransition(page, () => pick(page, PICK), {
        probe: pieState,
      })
      const f0 = rec.probes[0]
      // Frame 0: each part exactly on its whole, the whole at 0 under it, so
      // the pair composites to the chart as it was. The slice with no part
      // is still plain.
      expect(f0.parts.length).toBe(3)
      for (const p of f0.parts) {
        const w = byJ(f0.wholes, p.j)
        expect(p.d).toBe(w.d)
        expect(w.op).toBeLessThan(0.01)
        expect(p.op).toBe(byJ(before.wholes, p.j).op)
      }
      expect(byJ(f0.wholes, 3).op).toBe(1)
      // Every frame: the part's radius and its whole's fade are at the same
      // point of the same curve (the whole fades 0 -> 0.2 as the part goes
      // from the rim to its size).
      const last = rec.probes[rec.probes.length - 1]
      let moving = 0
      for (const fr of rec.probes) {
        for (const p of fr.parts) {
          const e = byJ(fr.wholes, p.j).op / 0.2
          const to = byJ(last.parts, p.j).r
          const from = f0.parts.find((q) => q.j === p.j).r
          if (e > 0.05 && e < 0.95) moving++
          expect(near(p.r, from + (to - from) * e, 1.5)).toBe(true)
        }
      }
      expect(moving).toBeGreaterThan(6)
      for (const w of last.wholes) expect(w.op).toBeCloseTo(0.2, 2)
      // The labels ride from where they were, and land with the parts.
      for (const l of f0.labels) {
        const was = before.labels.find((b) => b.slice === l.slice)
        expect(
          near(l.at[0], was.at[0], 1.5) && near(l.at[1], was.at[1], 1.5),
        ).toBe(true)
      }
      // (noJump would count the whole at frame 0 as painted: it is
      // fill-opacity 0 under a stroke of width 0. Frame 0 is checked above.)
      expectNoViolations([...finite(rec), ...noFlash(rec)], `${type} pick`)
      expectNoViolations(await settles(page, rec, { transform: target(PICK) }))
      // The labels rest where a fresh render of the pick puts them.
      await page.evaluate((data) => {
        const host = document.createElement('div')
        host.id = 'fresh'
        host.style.cssText = 'width:720px;position:absolute;left:0;top:0'
        document.body.appendChild(host)
        const o = JSON.parse(JSON.stringify(window.__opts0))
        o.highlightFilter = { data }
        o.chart.animations = { enabled: false }
        window.fresh = new window.ApexCharts(host, o)
        window.fresh.render()
      }, PICK)
      await advance(page, 500)
      const want = await page.evaluate(() => {
        const s = window.__probe('#fresh')
        window.fresh.destroy()
        document.querySelector('#fresh').remove()
        return s
      })
      expect(want.labels.length).toBe(last.labels.length)
      want.labels.forEach((l, k) => {
        expect(l.text).toBe(last.labels[k].text)
        expect(near(l.at[0], last.labels[k].at[0], 1.5)).toBe(true)
        expect(near(l.at[1], last.labels[k].at[1], 1.5)).toBe(true)
      })
      expect(errors).toEqual([])
    })
  }

  test('donut: the centre states the parts, and the wholes again on a clear', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('donut', {
        plotOptions: {
          pie: { donut: { labels: { show: true, total: { show: true } } } },
        },
      }),
    )
    expect((await page.evaluate(pieState)).centre).toBe('100')
    await pick(page, PICK)
    await advance(page, 1000)
    expect((await page.evaluate(pieState)).centre).toBe('40')
    await pick(page, null)
    await advance(page, 1000)
    expect((await page.evaluate(pieState)).centre).toBe('100')
    expect(errors).toEqual([])
  })

  test('donut: a re-pick, mid-flight or twice in one frame, starts every part from the screen', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('donut', { highlightFilter: { data: PICK } }),
    )
    // Mid-flight: the second update starts each part where the first left it.
    const first = await recordTransition(page, () => pick(page, REPICK), {
      probe: pieState,
      ms: 160,
    })
    const mid = first.probes[first.probes.length - 1]
    const second = await recordTransition(page, () => pick(page, PICK), {
      probe: pieState,
    })
    for (const p of mid.parts) {
      expect(near(byJ(second.probes[0].parts, p.j).r, p.r, 1)).toBe(true)
    }
    expectNoViolations(checkAll(second), 'second re-pick')
    expectNoViolations(await settles(page, second, { transform: target(PICK) }))

    // Two updates in one frame: the second starts from the screen too.
    const screen = await page.evaluate(pieState)
    const both = await recordTransition(
      page,
      () =>
        page.evaluate(
          ([a, b]) => {
            window.chart.updateOptions({ highlightFilter: { data: a } })
            window.chart.updateOptions({ highlightFilter: { data: b } })
          },
          [REPICK, [30, 5, 10, 5]],
        ),
      { probe: pieState },
    )
    for (const p of screen.parts) {
      expect(near(byJ(both.probes[0].parts, p.j).r, p.r, 1)).toBe(true)
    }
    expectNoViolations(finite(both))
    expectNoViolations(
      await settles(page, both, { transform: target([30, 5, 10, 5]) }),
    )
    expect(errors).toEqual([])
  })

  test('pie: a clear grows the parts into the wholes and lands on the plain chart', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('pie', { highlightFilter: { data: PICK } }),
    )
    const before = await page.evaluate(pieState)
    const rec = await recordTransition(page, () => pick(page, null), {
      probe: pieState,
    })
    const f0 = rec.probes[0]
    for (const p of before.parts)
      expect(near(byJ(f0.parts, p.j).r, p.r, 1)).toBe(true)
    for (const w of f0.wholes) expect(w.op).toBeLessThan(0.21)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts.length).toBe(0)
    expect(last.edges.length).toBe(0)
    // Nothing of the feature left on the wholes: their own paint, as a
    // render that never highlighted draws it.
    for (const w of last.wholes) {
      expect(w.op).toBe(1)
      expect(w.stroke).toBe('#fff')
      expect(w.sop).toBe('1')
    }
    expectNoViolations(checkAll(rec), 'clear')
    expectNoViolations(await settles(page, rec, { transform: target(null) }))
    expect(errors).toEqual([])
  })

  test('a re-pick sent without animation lands at once, and the next starts from the screen', async ({
    page,
  }) => {
    for (const type of ['pie', 'donut', 'polarArea']) {
      const errors = await mount(page, circle(type))
      await pick(page, PICK)
      await advance(page, 1500)
      // The faded look (polarArea's own fill opacity is under 1).
      const faded = (await page.evaluate(pieState)).wholes[0].op
      expect(faded).toBeLessThan(0.21)
      // Nothing captured the landed pick, so the map from before it (empty)
      // must not make this a first pick.
      const rec = await recordTransition(
        page,
        () =>
          page.evaluate(
            (d) => window.chart.highlightFilter.set(d, { animate: false }),
            REPICK,
          ),
        { probe: pieState, ms: 600 },
      )
      const last = rec.probes[rec.probes.length - 1]
      expect(last.parts.length).toBe(4)
      for (const fr of rec.probes) {
        for (const w of fr.wholes) expect(w.op).toBeCloseTo(faded, 3)
        for (const p of fr.parts) {
          expect(near(p.r, byJ(last.parts, p.j).r, 0.5)).toBe(true)
        }
      }
      expectNoViolations(
        await settles(page, rec, { transform: target(REPICK) }),
        `${type} set without animation`,
      )
      // The next animated pick starts from that screen.
      const screen = await page.evaluate(pieState)
      const next = await recordTransition(page, () => pick(page, PICK), {
        probe: pieState,
      })
      for (const p of next.probes[0].parts) {
        expect(near(p.r, byJ(screen.parts, p.j).r, 1)).toBe(true)
      }
      for (const w of next.probes[0].wholes) {
        expect(w.op).toBeCloseTo(faded, 3)
      }
      expectNoViolations(finite(next), `${type} pick after`)
      expectNoViolations(await settles(page, next, { transform: target(PICK) }))
      expect(errors).toEqual([])
    }
  })

  test("enter: 'baseline' raises the parts from the centre, or from the hole", async ({
    page,
  }) => {
    for (const type of ['pie', 'donut']) {
      const errors = await mount(
        page,
        circle(type, { highlightFilter: { enter: 'baseline' } }),
      )
      const rec = await recordTransition(page, () => pick(page, PICK), {
        probe: pieState,
        ms: 600,
      })
      const base = await page.evaluate(() => window.chart.ctx.pie.donutSize)
      const f0 = rec.probes[0]
      for (const p of f0.parts) {
        expect(near(p.r, type === 'donut' ? base : 0, 0.5)).toBe(true)
        // the whole is as it was, and fades on the parts' clock
        expect(byJ(f0.wholes, p.j).op).toBe(1)
      }
      const last = rec.probes[rec.probes.length - 1]
      for (const w of last.wholes) expect(w.op).toBeCloseTo(0.2, 2)
      expectNoViolations(finite(rec))
      expectNoViolations(await settles(page, rec, { transform: target(PICK) }))
      expect(errors).toEqual([])
    }
  })

  test('donut: a clear mid-flight continues from the screen and lands plain', async ({
    page,
  }) => {
    const errors = await mount(page, circle('donut'))
    const first = await recordTransition(page, () => pick(page, PICK), {
      probe: pieState,
      ms: 160,
    })
    const mid = first.probes[first.probes.length - 1]
    const rec = await recordTransition(page, () => pick(page, null), {
      probe: pieState,
    })
    for (const p of mid.parts)
      expect(near(byJ(rec.probes[0].parts, p.j).r, p.r, 1)).toBe(true)
    for (const w of mid.wholes) {
      expect(near(byJ(rec.probes[0].wholes, w.j).op, w.op, 0.02)).toBe(true)
    }
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts.length).toBe(0)
    for (const w of last.wholes) {
      expect(w.op).toBe(1)
      expect(w.stroke).toBe('#fff')
    }
    expectNoViolations(finite(rec))
    expectNoViolations(await settles(page, rec, { transform: target(null) }))
    expect(errors).toEqual([])
  })

  test('donut: an export mid-flight lands the fades only, and a clear lands plain', async ({
    page,
  }) => {
    const errors = await mount(page, circle('donut'))
    // The slices and parts an export holds, read from its SVG string.
    const exported = () =>
      page.evaluate(async () => {
        const svg = await window.chart.getSvgString()
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        const outer = (d) => parseFloat(/A\s*([-\d.e]+)/.exec(d || '')[1])
        return {
          wholes: [...doc.querySelectorAll('.apexcharts-pie-area')].map(
            (n) => +(n.getAttribute('fill-opacity') ?? 1),
          ),
          parts: [
            ...doc.querySelectorAll('.apexcharts-pie-highlight-part'),
          ].map((n) => outer(n.getAttribute('d'))),
        }
      })
    const first = await recordTransition(page, () => pick(page, PICK), {
      probe: pieState,
      ms: 160,
    })
    const mid = first.probes[first.probes.length - 1]
    const exp = await exported()
    // The fades land (on screen too), the parts are where they were: their
    // shape moves on with its slice and lands with it.
    for (const o of exp.wholes) expect(o).toBeCloseTo(0.2, 6)
    expect(exp.parts.length).toBe(3)
    mid.parts.forEach((p, k) =>
      expect(near(exp.parts[k], p.r, 0.01)).toBe(true),
    )
    const rest = await recordTransition(page, async () => {}, {
      probe: pieState,
    })
    rest.probes[0].parts.forEach((p, k) =>
      expect(near(p.r, mid.parts[k].r, 0.01)).toBe(true),
    )
    for (const fr of rest.probes) {
      for (const w of fr.wholes) expect(w.op).toBeCloseTo(0.2, 6)
    }
    const landed = rest.probes[rest.probes.length - 1].parts
    expect(exp.parts.every((r, k) => r - landed[k].r > 5)).toBe(true)
    expectNoViolations(finite(rest))
    expectNoViolations(await settles(page, rest, { transform: target(PICK) }))

    // A clear has nothing to show but the plain chart: it lands.
    await recordTransition(page, () => pick(page, null), { ms: 160 })
    const out = await exported()
    expect(out.parts.length).toBe(0)
    for (const o of out.wholes) expect(o).toBe(1)
    const after = await recordTransition(page, async () => {}, {
      probe: pieState,
    })
    for (const fr of after.probes) {
      expect(fr.parts.length).toBe(0)
      for (const w of fr.wholes) expect(w.op).toBe(1)
    }
    expectNoViolations(await settles(page, after, { transform: target(null) }))
    expect(errors).toEqual([])
  })

  test('pie: mounted with a pick, the parts sweep with their slices, faded from frame 0', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('pie', { highlightFilter: { data: PICK } }),
      {
        settleMs: 0,
      },
    )
    const rec = await recordTransition(page, async () => {}, {
      probe: pieState,
      ms: 900,
    })
    let swept = 0
    for (const fr of rec.probes) {
      for (const w of fr.wholes) expect(w.op).toBeCloseTo(0.2, 2)
      // Each part sweeps its whole's angles, at its own radius.
      for (const p of fr.parts) {
        const wa = arcAngles(byJ(fr.wholes, p.j).d, fr.cx, fr.cy)
        const pa = arcAngles(p.d, fr.cx, fr.cy)
        if (!wa || !pa) continue
        swept++
        expect(near(pa[0], wa[0], 0.5) && near(pa[1], wa[1], 0.5)).toBe(true)
      }
    }
    expect(swept).toBeGreaterThan(20)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts.length).toBe(3)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('pie: a legend-hidden slice closes with its part, and they open together again', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('pie', { highlightFilter: { data: PICK } }),
    )
    const hide = await recordTransition(
      page,
      () =>
        page.locator('.apexcharts-legend-series[seriesName="South"]').click(),
      { probe: pieState },
    )
    // Every frame the part of South closes with its whole, on its angles.
    let closing = 0
    for (const fr of hide.probes) {
      const p = byJ(fr.parts, 1)
      const wa = arcAngles(byJ(fr.wholes, 1).d, fr.cx, fr.cy)
      const pa = p && arcAngles(p.d, fr.cx, fr.cy)
      if (!wa || !pa) continue
      closing++
      expect(near(pa[0], wa[0], 0.5) && near(pa[1], wa[1], 0.5)).toBe(true)
    }
    expect(closing).toBeGreaterThan(5)
    const last = hide.probes[hide.probes.length - 1]
    expect(byJ(last.parts, 1)?.d || '').toBe('')
    expect(byJ(last.wholes, 1).d).toBe('')
    expectNoViolations(finite(hide))
    // The rest is where a fresh chart with South hidden draws it (settles()
    // cannot hide a slice of a numeric series, so the fresh chart hides it).
    await page.evaluate((data) => {
      const host = document.createElement('div')
      host.id = 'fresh'
      host.style.cssText = 'width:720px;position:absolute;left:0;top:0'
      document.body.appendChild(host)
      const o = JSON.parse(JSON.stringify(window.__opts0))
      o.highlightFilter = { data }
      o.chart.animations = { enabled: false }
      window.fresh = new window.ApexCharts(host, o)
      window.fresh.render()
      window.fresh.toggleSeries('South')
    }, PICK)
    await advance(page, 500)
    const want = await page.evaluate(() => {
      const s = window.__probe('#fresh')
      window.fresh.destroy()
      document.querySelector('#fresh').remove()
      return s
    })
    for (const w of want.wholes) expect(byJ(last.wholes, w.j).d).toBe(w.d)
    for (const p of want.parts) {
      if (p.d) expect(near(byJ(last.parts, p.j).r, p.r, 0.5)).toBe(true)
    }
    const show = await recordTransition(
      page,
      () =>
        page.locator('.apexcharts-legend-series[seriesName="South"]').click(),
      { probe: pieState },
    )
    const end = show.probes[show.probes.length - 1]
    expect(byJ(end.parts, 1).r).toBeGreaterThan(5)
    expectNoViolations(checkAll(show), 'show South')
    expectNoViolations(await settles(page, show, { transform: target(PICK) }))
    expect(errors).toEqual([])
  })
})

/**
 * A point on slice `i` of `window[chart]`, in page coordinates: in the
 * middle of its solid part ('part'), or of the ring between its part and its
 * whole ('tint': the faded rest of the slice, or on a polarArea part past
 * its whole, the stretch past the whole).
 */
function slicePoint({ chart, i, where }) {
  const c = window[chart]
  const pie = c.ctx.pie
  const whole = c.el.querySelectorAll('.apexcharts-pie-area')[i]
  const next = whole.nextElementSibling
  const part =
    next && next.classList.contains('apexcharts-pie-highlight-part')
      ? next
      : null
  const outer = (d) => parseFloat(/A\s*([-\d.e]+)/.exec(d)[1])
  const R = outer(whole.getAttribute('d'))
  const r = part ? outer(part.getAttribute('d')) : 0
  const base = pie.chartType === 'donut' ? pie.donutSize : 0
  const rad = where === 'part' ? (base + r) / 2 : (r + R) / 2
  const a0 = +whole.getAttribute('data:startAngle')
  const span = +whole.getAttribute('data:angle')
  const ang = ((a0 + span / 2 - 90) * Math.PI) / 180
  const x = pie.centerX + rad * Math.cos(ang)
  const y = pie.centerY + rad * Math.sin(ang)
  const m = whole.getScreenCTM()
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
}

/** The tooltip of `window[chart]`, the hover band, the centre value and how
 * often each slice has been left. */
function hoverState(chart) {
  const c = window[chart]
  const tip = c.el.querySelector('.apexcharts-tooltip')
  return {
    active: tip.classList.contains('apexcharts-active'),
    text: tip.textContent,
    band: c.el.querySelector('.apexcharts-pie-hover-outline')?.style.opacity,
    centre: c.el.querySelector('.apexcharts-datalabel-value')?.textContent,
    left: window.__left || 0,
  }
}

async function hoverAt(page, pt) {
  await page.mouse.move(pt.x - 2, pt.y - 2)
  await advance(page, 50)
  await page.mouse.move(pt.x, pt.y)
  await advance(page, 300)
}

test.describe('Highlight filter, circles: the pointer on a part', () => {
  test('donut: a solid part is its slice: tooltip, band, centre, no leave, click to explode', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'pie-highlight')
    // Every leave of a slice is counted: moving between a part and its
    // faded rest is staying on the slice.
    await page.evaluate(() => {
      window.__left = 0
      window.chart.el
        .querySelectorAll('.apexcharts-pie-area')
        .forEach((n) => n.addEventListener('mouseleave', () => window.__left++))
    })
    const at = (where) =>
      page.evaluate(slicePoint, { chart: 'chart', i: 0, where })
    await hoverAt(page, await at('part'))
    let s = await page.evaluate(hoverState, 'chart')
    expect(s.active).toBe(true)
    expect(s.text).toContain('2,500 / 4,200')
    expect(s.band).toBe('1')
    expect(s.centre).toBe('2,500')
    for (const where of ['tint', 'part', 'tint', 'part']) {
      const pt = await at(where)
      await page.mouse.move(pt.x, pt.y, { steps: 4 })
      await advance(page, 50)
    }
    s = await page.evaluate(hoverState, 'chart')
    expect(s.left).toBe(0)
    expect(s.active).toBe(true)
    expect(s.band).toBe('1')
    // Click the solid part: the slice comes out, its part and label with it.
    await page.mouse.down()
    await page.mouse.up()
    await advance(page, 600)
    const moved = await page.evaluate(() => {
      const w = window.chart.el.querySelector('.apexcharts-pie-area')
      return {
        whole: w.getAttribute('transform'),
        part: w.nextElementSibling.getAttribute('transform'),
        label:
          window.chart.ctx.pie.sliceLabelGroups[0].getAttribute('transform'),
      }
    })
    expect(moved.whole).toMatch(/^translate\(/)
    expect(moved.whole).not.toMatch(/^translate\(0 0\)$/)
    expect(moved.part).toBe(moved.whole)
    expect(moved.label).toBe(moved.whole)
    expect(errors).toEqual([])
  })

  test("a part takes its whole's selection however it is made: click, another click, the API", async ({
    page,
  }) => {
    for (const [type, extra] of [
      ['polarArea', {}],
      ['pie', { plotOptions: { pie: { expandOnClick: false } } }],
    ]) {
      const errors = await mount(
        page,
        circle(type, { ...extra, highlightFilter: { data: [20, 15, 5, 2] } }),
      )
      for (const i of [0, 1]) {
        const pt = await page.evaluate(slicePoint, {
          chart: 'chart',
          i,
          where: 'part',
        })
        await hoverAt(page, pt)
        await page.mouse.down()
        await page.mouse.up()
        await advance(page, 300)
      }
      await page.evaluate(() => window.chart.toggleDataPointSelection(2))
      await page.mouse.move(1, 1)
      await advance(page, 600)
      const f = await page.evaluate(() =>
        [...window.chart.el.querySelectorAll('.apexcharts-pie-area')].map(
          (n) => [
            n.getAttribute('filter'),
            n.nextElementSibling.getAttribute('filter'),
          ],
        ),
      )
      // Slice 1's click took slice 0's selection off, the API added slice 2.
      expect(f[0][0]).toBe(null)
      expect(f[2][0]).toMatch(/^url\(/)
      for (const [whole, part] of f) expect(part).toBe(whole)
      expect(errors).toEqual([])
    }
  })

  test('polarArea: the sums fit inside their slices; a part past its whole (an average) is hovered as its slice', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'pie-highlight')
    // The sums come first: on the orders polar area every device's part
    // fits inside its channel (no overflow), whichever device is picked.
    // The averages follow: there Desktop spends more than every channel.
    const overflowing = (c) =>
      page.evaluate(
        (c) =>
          window[c].el.querySelectorAll(
            '.apexcharts-pie-highlight-part.apexcharts-highlight-overflow',
          ).length,
        c,
      )
    for (const device of ['mobile', 'desktop', 'tablet']) {
      await page.locator(`[data-device="${device}"]`).click()
      await advance(page, 1500)
      expect(await overflowing('chart1')).toBe(0)
    }
    await page.locator('[data-device="desktop"]').click()
    await advance(page, 1500)
    expect(await overflowing('chart2')).toBe(5)
    // The averages sit below the sums: bring the chart into view to hover it.
    await page.evaluate(() =>
      window.chart2.el.scrollIntoView({ block: 'center' }),
    )
    await page.evaluate(() => {
      window.__left = 0
      window.chart2.el
        .querySelectorAll('.apexcharts-pie-area')
        .forEach((n) => n.addEventListener('mouseleave', () => window.__left++))
    })
    // Organic: $81 for desktop against $66 overall, drawn past the whole.
    await hoverAt(
      page,
      await page.evaluate(slicePoint, { chart: 'chart2', i: 0, where: 'tint' }),
    )
    let s = await page.evaluate(hoverState, 'chart2')
    expect(s.active).toBe(true)
    expect(s.text).toContain('$81 / $66')
    const inside = await page.evaluate(slicePoint, {
      chart: 'chart2',
      i: 0,
      where: 'part',
    })
    await page.mouse.move(inside.x, inside.y, { steps: 4 })
    await advance(page, 300)
    s = await page.evaluate(hoverState, 'chart2')
    expect(s.active).toBe(true)
    expect(s.left).toBe(0)
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter, circles: slices that move', () => {
  const OVER = [60, 15, 5, null]

  test('donut: an exploded slice takes its part and edge out and back', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('donut', { highlightFilter: { data: OVER } }),
    )
    const tf = () =>
      page.evaluate(() => {
        const w = window.chart.el.querySelector('.apexcharts-pie-area')
        const p = w.nextElementSibling
        return [w, p, p.nextElementSibling].map((n) =>
          n.getAttribute('transform'),
        )
      })
    const pt = await page.evaluate(slicePoint, {
      chart: 'chart',
      i: 0,
      where: 'part',
    })
    await page.mouse.click(pt.x, pt.y)
    await advance(page, 600)
    const out = await tf()
    expect(out[0]).not.toMatch(/^translate\(0 0\)$/)
    expect(out[1]).toBe(out[0])
    expect(out[2]).toBe(out[0])
    await page.mouse.click(pt.x, pt.y)
    await advance(page, 600)
    expect(await tf()).toEqual([
      'translate(0 0)',
      'translate(0 0)',
      'translate(0 0)',
    ])
    // toggleDataPointSelection moves the part too.
    await page.evaluate(() => window.chart.toggleDataPointSelection(0))
    await advance(page, 600)
    const api = await tf()
    expect(api[1]).toBe(api[0])
    expect(api[0]).not.toMatch(/^translate\(0 0\)$/)
    expect(errors).toEqual([])
  })

  test('donut: the circle resized under a pick carries the parts, an exploded one at its offset', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('donut', { highlightFilter: { data: OVER } }),
    )
    await page.evaluate(() => window.chart.toggleDataPointSelection(0))
    await advance(page, 600)
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            title: { text: 'Sessions', style: { fontSize: '22px' } },
          }),
        ),
      { probe: pieState },
    )
    // The update has to move the circle for this to mean anything.
    expect(rec.probes.filter((fr) => fr.circling).length).toBeGreaterThan(5)
    // Every frame, the part and its edge sit at their slice's offset, which
    // the circle's scale is taken back out of while it moves.
    const offsets = new Set()
    for (const fr of rec.probes) {
      const w = byJ(fr.wholes, 0)
      expect(w.tf).toMatch(/^translate\(/)
      offsets.add(w.tf)
      expect(byJ(fr.parts, 0).tf).toBe(w.tf)
      for (const e of fr.edges) expect(e.tf).toBe(w.tf)
    }
    expect(offsets.size).toBeGreaterThan(3)
    // Nothing of the move is left on a label.
    const texts = await page.evaluate(() =>
      [...window.chart.el.querySelectorAll('.apexcharts-pie-label')].map((t) =>
        t.getAttribute('transform'),
      ),
    )
    for (const t of texts) expect(t).toBe(null)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('polarArea: a re-pick past every whole widens the scale with nothing jumping', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('polarArea', { highlightFilter: { data: [20, 15, 5, 5] } }),
    )
    const before = await page.evaluate(pieState)
    const rec = await recordTransition(page, () => pick(page, [80, 15, 5, 5]), {
      probe: pieState,
    })
    const f0 = rec.probes[0]
    for (const w of before.wholes)
      expect(near(byJ(f0.wholes, w.j).r, w.r, 1)).toBe(true)
    for (const p of before.parts)
      expect(near(byJ(f0.parts, p.j).r, p.r, 1)).toBe(true)
    const last = rec.probes[rec.probes.length - 1]
    // every whole shrank with the wider scale, on the same clock as the parts
    for (const w of before.wholes)
      expect(byJ(last.wholes, w.j).r).toBeLessThan(w.r - 1)
    expectNoViolations(checkAll(rec), 'polar re-pick')
    expectNoViolations(
      await settles(page, rec, { transform: target([80, 15, 5, 5]) }),
    )
    expect(errors).toEqual([])
  })

  test('pie: the fade and the radius stay in step whatever dynamicAnimation.easing says', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      circle('pie', {
        chart: {
          animations: {
            speed: 400,
            easing: 'easeinout',
            dynamicAnimation: { speed: 400, easing: 'linear' },
          },
        },
      }),
    )
    const rec = await recordTransition(page, () => pick(page, PICK), {
      probe: pieState,
    })
    const f0 = rec.probes[0]
    const last = rec.probes[rec.probes.length - 1]
    for (const fr of rec.probes) {
      for (const p of fr.parts) {
        const e = byJ(fr.wholes, p.j).op / 0.2
        const from = byJ(f0.parts, p.j).r
        const to = byJ(last.parts, p.j).r
        expect(near(p.r, from + (to - from) * e, 1.5)).toBe(true)
      }
    }
    expect(errors).toEqual([])
  })

  test('a column morphing into a donut with a pick pairs no part, and the parts come in after', async ({
    page,
  }) => {
    const errors = await mount(page, {
      chart: {
        type: 'bar',
        height: 380,
        toolbar: { show: false },
        animations: {
          animateGradually: { enabled: false },
          chartTypeMorph: { enabled: true, speed: 500 },
          dynamicAnimation: { speed: 400 },
        },
      },
      series: [{ name: 'Sessions', data: VALUES }],
      xaxis: { categories: LABELS },
      legend: { show: false },
      dataLabels: { enabled: false },
    })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(
          ([v, l, d]) =>
            window.chart.updateOptions({
              chart: { type: 'donut' },
              series: v,
              labels: l,
              xaxis: { categories: [] },
              highlightFilter: { data: d },
            }),
          [VALUES, LABELS, PICK],
        ),
      {
        probe: () => ({
          parts: [
            ...document.querySelectorAll('.apexcharts-pie-highlight-part'),
          ].map((n) => parseFloat(n.getAttribute('opacity') ?? '1')),
          ghosts: document.querySelectorAll(
            '.apexcharts-morph-ghost .apexcharts-highlight-part, .apexcharts-morph-pieces .apexcharts-highlight-part',
          ).length,
          wholes: [...document.querySelectorAll('.apexcharts-pie-area')].map(
            (n) => parseFloat(n.getAttribute('fill-opacity') ?? '1'),
          ),
        }),
        ms: 1600,
      },
    )
    expect(rec.probes[0].parts.every((o) => o === 0)).toBe(true)
    // The wholes are faded from the first frame (their own fill opacity,
    // 0.85 carried over from the columns, times 0.2), and stay so.
    for (const fr of rec.probes) {
      expect(fr.ghosts).toBe(0)
      for (const o of fr.wholes) expect(o).toBeCloseTo(0.85 * 0.2, 3)
    }
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts.length).toBe(3)
    expect(last.parts.every((o) => o === 1)).toBe(true)
    expect(errors).toEqual([])
  })
})
