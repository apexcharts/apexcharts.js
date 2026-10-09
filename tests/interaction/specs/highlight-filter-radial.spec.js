/**
 * Highlight filter on radialBar and the gauge: a solid arc in front of its
 * faded ring from the same start (the default), a ring's band split in two
 * lanes (opt-in: the whole light outside, the part solid inside), or (the
 * first ring) a second needle pointing at it with the ring left as it is.
 *
 * Runs bare charts and samples/vanilla-js/highlight/gauge-highlight on
 * virtual time, so every frame can be read. What jsdom cannot see:
 *   - frame 0 of a pick is the chart as it was (an arc part starts as its
 *     whole, which sits at 0 under it; a needle starts where the gauge
 *     pointed, unseen), then the part moves on its ring's own clock: the
 *     fade and the arc, or the needle's angle and strength, in step on every
 *     frame, and on the needle shape in step with the gauge's own needle
 *   - re-picks, two updates in one frame and clears start from the screen
 *   - a clear lands on the plain chart, nothing of the feature left behind
 *   - an update without animation moves nothing, part or whole
 *   - a legend-hidden ring drains with its part
 *   - the pointer on a part past its whole is on its ring
 *   - a circle resized under a pick carries the parts and the needle, and a
 *     cross-type morph never pairs a part
 */

import { test, expect } from '@playwright/test'
import {
  BUNDLE,
  loadSample,
  recordTransition,
  settles,
  finite,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance, installVirtualTime } from '../helpers/virtual-time.js'

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
  await page.evaluate(() => {
    window.__opts0 = JSON.parse(JSON.stringify(window.chart.opts))
  })
  return errors
}

/** A gauge with the second needle (an arc gauge splits its arc unless
 * told otherwise; `split` leaves the indicator unset). */
function gauge(extra = {}, { split = false } = {}) {
  return {
    series: [70],
    labels: ['Score'],
    ...extra,
    chart: {
      type: 'gauge',
      height: 380,
      toolbar: { show: false },
      animations: { speed: 400, dynamicAnimation: { speed: 400 } },
      ...(extra.chart || {}),
    },
    highlightFilter: {
      data: null,
      ...(split ? {} : { radialBar: { indicator: 'needle' } }),
      ...(extra.highlightFilter || {}),
    },
  }
}

function rings(extra = {}) {
  return gauge(
    {
      series: [70, 50, 30],
      labels: ['A', 'B', 'C'],
      legend: { show: true, position: 'bottom' },
      ...extra,
      chart: { type: 'radialBar', ...(extra.chart || {}) },
    },
    { split: true },
  )
}

/** Rings, parts and needles on screen, read in the page every frame. */
function radialState(root = '#chart') {
  const r = document.querySelector(root)
  const hollow = r.querySelector('.apexcharts-radialbar-hollow')
  const cx = +hollow.getAttribute('cx')
  const cy = +hollow.getAttribute('cy')
  // Degrees clockwise from 12 o'clock, as the rings are laid out.
  const at = (x, y) =>
    ((((Math.atan2(+y - cy, +x - cx) * 180) / Math.PI + 90) % 360) + 360) % 360
  const arc = (d) => {
    const m =
      /M\s*([-\d.e]+)\s+([-\d.e]+)\s*A\s*([-\d.e]+)\s+[-\d.e]+\s+[-\d.e]+\s+([01])\s+[01]\s+([-\d.e]+)\s+([-\d.e]+)/.exec(
        d || '',
      )
    if (!m) return null
    const a0 = at(m[1], m[2])
    const a1 = at(m[5], m[6])
    let span = (a1 - a0 + 360) % 360
    if (m[4] === '1' && span < 180) span += 360
    if (span > 359.5 && m[4] === '0') span = 0
    return { start: a0, span, r: +m[3] }
  }
  const sop = (el) => parseFloat(el.getAttribute('stroke-opacity') ?? '1')
  const wholes = [
    ...r.querySelectorAll(
      '.apexcharts-radial-series .apexcharts-radialbar-area',
    ),
  ].map((el) => ({
    j: +el.getAttribute('j'),
    d: el.getAttribute('d') || '',
    arc: arc(el.getAttribute('d')),
    op: sop(el),
  }))
  const parts = [
    ...r.querySelectorAll('.apexcharts-radialbar-highlight-part'),
  ].map((el) => ({
    j: +el.previousElementSibling.getAttribute('j'),
    d: el.getAttribute('d') || '',
    arc: arc(el.getAttribute('d')),
    op: sop(el),
    show: parseFloat(el.getAttribute('opacity') ?? '1'),
  }))
  const rot = (g) => {
    const m = /rotate\(([-\d.e]+)\)/.exec(g?.getAttribute('transform') || '')
    return m ? parseFloat(m[1]) : null
  }
  // Each overflow tick: the angle it sits at and its strength.
  const ticks = [
    ...r.querySelectorAll('.apexcharts-radialbar-highlight-edge'),
  ].map((el) => {
    const n = (el.getAttribute('d') || '').match(/[-\d.e]+/g)?.map(Number)
    return {
      j: +el.previousElementSibling.previousElementSibling.getAttribute('j'),
      a: n ? at((n[0] + n[2]) / 2, (n[1] + n[3]) / 2) : null,
      len: n ? Math.hypot(n[2] - n[0], n[3] - n[1]) : 0,
      op: sop(el),
      show: parseFloat(el.getAttribute('opacity') ?? '1'),
    }
  })
  const ng = r.querySelector('.apexcharts-gauge-needle-highlight')
  const main = r.querySelector('.apexcharts-gauge-needle')
  return {
    wholes,
    parts,
    ticks,
    mainOp: main ? parseFloat(main.getAttribute('opacity') ?? '1') : null,
    needle: ng
      ? {
          a: rot(ng),
          op: parseFloat(ng.getAttribute('opacity') ?? '1'),
          // over the hollow, under the centre labels
          placed:
            !!ng.previousElementSibling?.classList.contains(
              'apexcharts-radialbar-hollow',
            ) &&
            !!ng.nextElementSibling?.classList.contains(
              'apexcharts-datalabels-group',
            ),
        }
      : null,
    main: main ? rot(main) : null,
    centre: r.querySelector('.apexcharts-datalabel-value')?.textContent,
  }
}

/** The gauge's own value-to-needle-angle mapping, on `window.chart`. */
const angleAt = (page, v) =>
  page.evaluate((v) => {
    const rb = window.chart.w.config.plotOptions.radialBar
    const end = rb.endAngle === 360 ? 359.99 : rb.endAngle
    const t = (Math.max(0, Math.min(100, v)) - 0) / 100
    return rb.startAngle + t * (end - rb.startAngle)
  }, v)

/** A fresh render of the chart's options with `patch` applied, animations
 * off, read with radialState. */
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

const pick = (page, data) =>
  page.evaluate(
    (d) => window.chart.updateOptions({ highlightFilter: { data: d } }),
    data,
  )
const target = (patch) => `() => (${JSON.stringify(patch)})`
const byJ = (list, j) => list.find((x) => x.j === j)
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol
/** Where x is between a and b, 0..1. */
const prog = (x, a, b) => (Math.abs(b - a) < 1e-6 ? 1 : (x - a) / (b - a))

test.describe('Highlight filter, gauge: the second needle', () => {
  test('a pick fades the needle in from where the gauge pointed, on the ring clock', async ({
    page,
  }) => {
    const errors = await mount(page, gauge())
    const before = await page.evaluate(radialState)
    expect(before.needle).toBe(null)
    const from = await angleAt(page, 70)
    const to = await angleAt(page, 40)
    // The value moves too, so the needle can be held to the arc's clock.
    const patch = {
      series: [60],
      highlightFilter: { data: [40], radialBar: { indicator: 'needle' } },
    }
    const rec = await recordTransition(
      page,
      () => page.evaluate((p) => window.chart.updateOptions(p), patch),
      { probe: radialState },
    )
    const f0 = rec.probes[0]
    // Frame 0: the gauge as it was, the needle unseen where it pointed.
    expect(f0.needle.op).toBe(0)
    expect(near(f0.needle.a, from, 0.01)).toBe(true)
    expect(f0.needle.placed).toBe(true)
    const w0 = before.wholes[0].arc.span
    const last = rec.probes[rec.probes.length - 1]
    const w1 = last.wholes[0].arc.span
    let moving = 0
    for (const fr of rec.probes) {
      // The ring keeps its look (the needle states the part).
      expect(fr.wholes[0].op).toBe(1)
      expect(fr.parts.length).toBe(0)
      const e = prog(fr.needle.a, from, to)
      expect(near(fr.needle.op, Math.min(1, e), 0.02)).toBe(true)
      const ew = prog(fr.wholes[0].arc.span, w0, w1)
      if (e > 0.05 && e < 0.95) moving++
      expect(near(e, ew, 0.03)).toBe(true)
    }
    expect(moving).toBeGreaterThan(6)
    expect(last.needle.op).toBe(1)
    expect(near(last.needle.a, to, 0.01)).toBe(true)
    expect(last.centre).toBe('40%')
    expectNoViolations(finite(rec))
    expectNoViolations(await settles(page, rec, { transform: target(patch) }))
    const want = await fresh(page, patch)
    expect(want.needle.a).toBeCloseTo(last.needle.a, 5)
    expect(errors).toEqual([])
  })

  test('the needle shape: the second needle moves with the gauge needle, on mount and on a pick', async ({
    page,
  }) => {
    const opts = gauge({
      plotOptions: { radialBar: { shape: 'needle' } },
      highlightFilter: { data: [20] },
    })
    // Mounted with a pick: both sweep from the start on the spring.
    const errors = await mount(page, opts, { settleMs: 0 })
    const mounted = await recordTransition(page, async () => {}, {
      probe: radialState,
      ms: 1200,
    })
    const start = -135
    const m1 = await angleAt(page, 70)
    const p1 = await angleAt(page, 20)
    let swept = 0
    let over = false
    for (const fr of mounted.probes) {
      if (fr.main == null || fr.needle == null) continue
      const em = prog(fr.main, start, m1)
      const ep = prog(fr.needle.a, start, p1)
      if (em > 0.05 && em < 0.95) swept++
      if (em > 1.001) over = true
      expect(near(em, ep, 0.02)).toBe(true)
      expect(fr.needle.op).toBe(1)
    }
    expect(swept).toBeGreaterThan(4)
    expect(over).toBe(true)
    await advance(page, 3000)
    await page.evaluate(() => {
      window.__opts0 = JSON.parse(JSON.stringify(window.chart.opts))
    })
    // A re-pick with a new value: both needles ease out together.
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            series: [50],
            highlightFilter: { data: [80] },
          }),
        ),
      { probe: radialState },
    )
    const m2 = await angleAt(page, 50)
    const p2 = await angleAt(page, 80)
    let moving = 0
    for (const fr of rec.probes) {
      const em = prog(fr.main, m1, m2)
      const ep = prog(fr.needle.a, p1, p2)
      if (em > 0.05 && em < 0.95) moving++
      expect(near(em, ep, 0.02)).toBe(true)
    }
    expect(moving).toBeGreaterThan(4)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a clear fades the needle out onto the gauge reading and leaves the plain gauge', async ({
    page,
  }) => {
    const errors = await mount(page, gauge({ highlightFilter: { data: [40] } }))
    const before = await page.evaluate(radialState)
    const rec = await recordTransition(page, () => pick(page, null), {
      probe: radialState,
    })
    expect(near(rec.probes[0].needle.a, before.needle.a, 0.01)).toBe(true)
    expect(rec.probes[0].needle.op).toBe(1)
    const to = await angleAt(page, 70)
    for (const fr of rec.probes) {
      if (!fr.needle) continue
      const e = prog(fr.needle.a, before.needle.a, to)
      expect(near(fr.needle.op, 1 - e, 0.02)).toBe(true)
    }
    const last = rec.probes[rec.probes.length - 1]
    expect(last.needle).toBe(null)
    expect(last.centre).toBe('70%')
    expectNoViolations(finite(rec))
    expectNoViolations(
      await settles(page, rec, {
        transform: target({ highlightFilter: { data: null } }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a gauge hidden from the legend takes its needle with it', async ({
    page,
  }) => {
    const errors = await mount(page, gauge({ highlightFilter: { data: [40] } }))
    const before = await page.evaluate(radialState)
    const rec = await recordTransition(
      page,
      () => page.evaluate(() => window.chart.toggleSeries('Score')),
      { probe: radialState },
    )
    expect(near(rec.probes[0].needle.a, before.needle.a, 0.01)).toBe(true)
    expect(rec.probes[0].needle.op).toBe(1)
    let op = 1
    for (const fr of rec.probes) {
      if (!fr.needle) continue
      // it fades as it falls back to the start, never pointing there plain
      expect(fr.needle.op).toBeLessThanOrEqual(op + 1e-6)
      op = fr.needle.op
    }
    expect(rec.probes[rec.probes.length - 1].needle).toBe(null)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a filled hollow never covers the needle', async ({ page }) => {
    const errors = await mount(
      page,
      gauge({
        plotOptions: { radialBar: { hollow: { background: '#ffffff' } } },
        highlightFilter: { data: [40] },
      }),
    )
    const s = await page.evaluate(radialState)
    expect(s.needle.placed).toBe(true)
    // the needle's middle is painted on screen, not the hollow
    const hit = await page.evaluate(() => {
      const shape = document.querySelector(
        '.apexcharts-gauge-needle-highlight-shape',
      )
      shape.parentNode.setAttribute('pointer-events', 'all')
      const b = shape.getBoundingClientRect()
      const el = document.elementFromPoint(
        b.left + b.width / 2,
        b.top + b.height / 2,
      )
      shape.parentNode.setAttribute('pointer-events', 'none')
      return el === shape
    })
    expect(hit).toBe(true)
    expect(errors).toEqual([])
  })

  test('a re-pick mid-flight, or twice in one frame, starts the needle from the screen', async ({
    page,
  }) => {
    const errors = await mount(page, gauge({ highlightFilter: { data: [40] } }))
    const first = await recordTransition(page, () => pick(page, [90]), {
      probe: radialState,
      ms: 160,
    })
    const mid = first.probes[first.probes.length - 1]
    const second = await recordTransition(page, () => pick(page, [10]), {
      probe: radialState,
    })
    expect(near(second.probes[0].needle.a, mid.needle.a, 0.5)).toBe(true)
    expect(second.probes[0].needle.op).toBe(1)
    const screen = await page.evaluate(radialState)
    const both = await recordTransition(
      page,
      () =>
        page.evaluate(() => {
          window.chart.updateOptions({ highlightFilter: { data: [60] } })
          window.chart.updateOptions({ highlightFilter: { data: [30] } })
        }),
      { probe: radialState },
    )
    expect(near(both.probes[0].needle.a, screen.needle.a, 0.01)).toBe(true)
    const last = both.probes[both.probes.length - 1]
    expect(near(last.needle.a, await angleAt(page, 30), 0.01)).toBe(true)
    expectNoViolations(finite(both))
    expect(errors).toEqual([])
  })

  test('an update without animation moves nothing, needle or ring', async ({
    page,
  }) => {
    const errors = await mount(page, gauge({ highlightFilter: { data: [40] } }))
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() => {
          window.chart.updateSeries([50], false)
        }),
      { probe: radialState, ms: 600 },
    )
    const last = rec.probes[rec.probes.length - 1]
    for (const fr of rec.probes) {
      expect(fr.wholes[0].d).toBe(last.wholes[0].d)
      expect(fr.needle.a).toBe(last.needle.a)
      expect(fr.needle.op).toBe(1)
    }
    expect(errors).toEqual([])
  })

  test('an export mid-flight leaves the needle where it is, as the gauge needle', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      gauge({ plotOptions: { radialBar: { shape: 'needle' } } }),
    )
    const first = await recordTransition(page, () => pick(page, [40]), {
      probe: radialState,
      ms: 160,
    })
    const mid = first.probes[first.probes.length - 1]
    const exp = await page.evaluate(async () => {
      const svg = await window.chart.getSvgString()
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
      const g = doc.querySelector('.apexcharts-gauge-needle-highlight')
      return {
        tf: g.getAttribute('transform'),
        op: g.getAttribute('opacity'),
        main: doc
          .querySelector('.apexcharts-gauge-needle')
          .getAttribute('transform'),
        mainOp: doc
          .querySelector('.apexcharts-gauge-needle')
          .getAttribute('opacity'),
      }
    })
    // The gauge's own needle: its fade lands, as every fade does.
    expect(exp.mainOp).toBe('0.2')
    // The needle's strength and angle are one motion on its own runner (the
    // gauge's own needle is not landed either): both are where they were.
    expect(exp.tf).toBe(`rotate(${mid.needle.a})`)
    expect(+exp.op).toBeCloseTo(mid.needle.op, 6)
    expect(mid.needle.op).toBeLessThan(0.95)
    const rest = await recordTransition(page, async () => {}, {
      probe: radialState,
    })
    expect(near(rest.probes[0].needle.a, mid.needle.a, 0.01)).toBe(true)
    const last = rest.probes[rest.probes.length - 1]
    expect(near(last.needle.a, await angleAt(page, 40), 0.01)).toBe(true)
    expect(last.needle.op).toBe(1)
    expectNoViolations(finite(rest))
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter, rings: the part arcs', () => {
  for (const inverse of [false, true]) {
    test(`a pick starts each part as its ring and drains it on the ring clock${inverse ? ' (inverse order)' : ''}`, async ({
      page,
    }) => {
      const errors = await mount(
        page,
        rings({ plotOptions: { radialBar: { inverseOrder: inverse } } }),
      )
      const PICK = [40, 80, null]
      const rec = await recordTransition(page, () => pick(page, PICK), {
        probe: radialState,
      })
      const f0 = rec.probes[0]
      expect(f0.parts.length).toBe(2)
      for (const p of f0.parts) {
        const w = byJ(f0.wholes, p.j)
        expect(p.d).toBe(w.d)
        expect(w.op).toBeLessThan(0.01)
      }
      expect(byJ(f0.wholes, 2).op).toBe(1)
      const last = rec.probes[rec.probes.length - 1]
      let moving = 0
      for (const fr of rec.probes) {
        for (const p of fr.parts) {
          const e = byJ(fr.wholes, p.j).op / 0.2
          const from = byJ(f0.parts, p.j).arc.span
          const to = byJ(last.parts, p.j).arc.span
          if (e > 0.05 && e < 0.95) moving++
          expect(near(p.arc.span, from + (to - from) * e, 1)).toBe(true)
        }
      }
      expect(moving).toBeGreaterThan(6)
      for (const w of last.wholes) expect(w.op).toBeCloseTo(0.2, 3)
      expectNoViolations(finite(rec))
      expectNoViolations(
        await settles(page, rec, {
          transform: target({ highlightFilter: { data: PICK } }),
        }),
      )
      const want = await fresh(page, { highlightFilter: { data: PICK } })
      want.parts.forEach((p) => expect(byJ(last.parts, p.j).d).toBe(p.d))
      expect(errors).toEqual([])
    })
  }

  test('a re-pick mid-flight, twice in one frame, and a clear mid-flight start from the screen', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({ highlightFilter: { data: [40, 80, 10] } }),
    )
    const first = await recordTransition(page, () => pick(page, [60, 20, 25]), {
      probe: radialState,
      ms: 160,
    })
    const mid = first.probes[first.probes.length - 1]
    const second = await recordTransition(
      page,
      () => pick(page, [10, 45, 25]),
      {
        probe: radialState,
      },
    )
    for (const p of mid.parts) {
      expect(
        near(byJ(second.probes[0].parts, p.j).arc.span, p.arc.span, 0.5),
      ).toBe(true)
    }
    const screen = await page.evaluate(radialState)
    const both = await recordTransition(
      page,
      () =>
        page.evaluate(() => {
          window.chart.updateOptions({ highlightFilter: { data: [50, 50, 5] } })
          window.chart.updateOptions({
            highlightFilter: { data: [20, 30, 15] },
          })
        }),
      { probe: radialState },
    )
    for (const p of screen.parts) {
      expect(
        near(byJ(both.probes[0].parts, p.j).arc.span, p.arc.span, 0.5),
      ).toBe(true)
    }
    const half = await recordTransition(page, () => pick(page, [60, 10, 28]), {
      probe: radialState,
      ms: 160,
    })
    const was = half.probes[half.probes.length - 1]
    const clear = await recordTransition(page, () => pick(page, null), {
      probe: radialState,
    })
    for (const p of was.parts) {
      expect(
        near(byJ(clear.probes[0].parts, p.j).arc.span, p.arc.span, 0.5),
      ).toBe(true)
    }
    for (const w of was.wholes) {
      expect(near(byJ(clear.probes[0].wholes, w.j).op, w.op, 0.02)).toBe(true)
    }
    const last = clear.probes[clear.probes.length - 1]
    expect(last.parts.length).toBe(0)
    for (const w of last.wholes) expect(w.op).toBe(1)
    expectNoViolations(finite(clear))
    expectNoViolations(
      await settles(page, clear, {
        transform: target({ highlightFilter: { data: null } }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a clear grows each part back into its ring, which comes back as it lands', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({ highlightFilter: { data: [40, 80, 10] } }),
    )
    const before = await page.evaluate(radialState)
    const rec = await recordTransition(page, () => pick(page, null), {
      probe: radialState,
    })
    for (const p of before.parts) {
      expect(byJ(rec.probes[0].parts, p.j).d).toBe(p.d)
    }
    for (const fr of rec.probes) {
      for (const p of fr.parts) {
        // the whole fades out under the part as the part reaches it
        const w = byJ(fr.wholes, p.j)
        const e = 1 - w.op / 0.2
        const from = byJ(before.parts, p.j).arc.span
        const to = w.arc.span
        expect(near(p.arc.span, from + (to - from) * e, 1)).toBe(true)
      }
    }
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts.length).toBe(0)
    for (const w of last.wholes) expect(w.op).toBe(1)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('an export mid-flight lands the fades only, and a clear lands plain', async ({
    page,
  }) => {
    const errors = await mount(page, rings())
    const PICK = [40, 80, null]
    const exported = () =>
      page.evaluate(async () => {
        const svg = await window.chart.getSvgString()
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        return {
          wholes: [
            ...doc.querySelectorAll(
              '.apexcharts-radial-series .apexcharts-radialbar-area',
            ),
          ].map((n) => +(n.getAttribute('stroke-opacity') ?? 1)),
          parts: [
            ...doc.querySelectorAll('.apexcharts-radialbar-highlight-part'),
          ].map((n) => n.getAttribute('d')),
        }
      })
    const first = await recordTransition(page, () => pick(page, PICK), {
      probe: radialState,
      ms: 160,
    })
    const mid = first.probes[first.probes.length - 1]
    const exp = await exported()
    // The rings land faded (the one without a part too); the part arcs are
    // where they were and land with their rings.
    expect(exp.wholes).toEqual([0.2, 0.2, 0.2])
    expect(exp.parts).toEqual(mid.parts.map((p) => p.d))
    const rest = await recordTransition(page, async () => {}, {
      probe: radialState,
    })
    rest.probes[0].parts.forEach((p, k) =>
      expect(near(p.arc.span, mid.parts[k].arc.span, 0.01)).toBe(true),
    )
    for (const fr of rest.probes) {
      expect(fr.wholes.map((w) => w.op)).toEqual([0.2, 0.2, 0.2])
    }
    const landed = rest.probes[rest.probes.length - 1].parts
    expect(
      mid.parts.every((p, k) => Math.abs(p.arc.span - landed[k].arc.span) > 3),
    ).toBe(true)
    expectNoViolations(finite(rest))
    expectNoViolations(
      await settles(page, rest, {
        transform: target({ highlightFilter: { data: PICK } }),
      }),
    )

    await recordTransition(page, () => pick(page, null), { ms: 160 })
    const out = await exported()
    expect(out.parts.length).toBe(0)
    expect(out.wholes).toEqual([1, 1, 1])
    const after = await recordTransition(page, async () => {}, {
      probe: radialState,
    })
    for (const fr of after.probes) {
      expect(fr.parts.length).toBe(0)
      for (const w of fr.wholes) expect(w.op).toBe(1)
    }
    expectNoViolations(
      await settles(page, after, {
        transform: target({ highlightFilter: { data: null } }),
      }),
    )
    expect(errors).toEqual([])
  })

  test("an export mid-flight leaves each part's angle to its arc: a re-pick starts from the screen", async ({
    page,
  }) => {
    const errors = await mount(
      page,
      gauge(
        { highlightFilter: { data: [40], radialBar: { indicator: 'arc' } } },
        { split: true },
      ),
    )
    await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            series: [60],
            highlightFilter: { data: [90] },
          }),
        ),
      { ms: 160 },
    )
    await page.evaluate(() => window.chart.dataURI({ type: 'svg' }))
    const moved = await recordTransition(page, async () => {}, {
      probe: radialState,
      ms: 112,
    })
    const screen = moved.probes[moved.probes.length - 1].parts[0].arc.span
    // still on its way to 90
    expect(screen).toBeLessThan((await angleAt(page, 90)) + 135 - 3)
    const rec = await recordTransition(page, () => pick(page, [20]), {
      probe: radialState,
    })
    expect(near(rec.probes[0].parts[0].arc.span, screen, 0.5)).toBe(true)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a ring that ended where the dial starts keeps its arc through its delay', async ({
    page,
  }) => {
    for (const data of [null, [80, 40, 60]]) {
      const errors = await mount(
        page,
        rings({
          plotOptions: { radialBar: { startAngle: -90, endAngle: 90 } },
          highlightFilter: { data },
        }),
      )
      const rec = await recordTransition(
        page,
        () => page.evaluate(() => window.chart.updateSeries([70, 50, 31])),
        { probe: radialState },
      )
      for (const fr of rec.probes) {
        // ring B (50 on a half circle) ends at 0 degrees
        expect(byJ(fr.wholes, 1).d, JSON.stringify(data)).not.toBe('')
      }
      expect(errors).toEqual([])
    }
  })

  test('mounted with a pick, the parts sweep with their rings, faded from frame 0', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({ highlightFilter: { data: [40, 80, 10] } }),
      {
        settleMs: 0,
      },
    )
    const rec = await recordTransition(page, async () => {}, {
      probe: radialState,
      ms: 1500,
    })
    const last = rec.probes[rec.probes.length - 1]
    let swept = 0
    for (const fr of rec.probes) {
      for (const w of fr.wholes) expect(w.op).toBeCloseTo(0.2, 3)
      for (const p of fr.parts) {
        const w = byJ(fr.wholes, p.j)
        if (!p.arc || !w.arc) continue
        const ew = w.arc.span / byJ(last.wholes, p.j).arc.span
        const ep = p.arc.span / byJ(last.parts, p.j).arc.span
        if (ew > 0.05 && ew < 0.95) swept++
        expect(near(ep, ew, 0.02)).toBe(true)
        expect(near(p.arc.start, w.arc.start, 0.01)).toBe(true)
      }
    }
    expect(swept).toBeGreaterThan(10)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a legend-hidden ring drains with its part, and an unanimated update moves nothing', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({ highlightFilter: { data: [40, 80, 10] } }),
    )
    const before = await page.evaluate(radialState)
    const hide = await recordTransition(
      page,
      () => page.locator('.apexcharts-legend-series[seriesName="B"]').click(),
      { probe: radialState },
    )
    let draining = 0
    for (const fr of hide.probes) {
      const w = byJ(fr.wholes, 1)
      const p = byJ(fr.parts, 1)
      if (!p || !p.arc || !w.arc) continue
      const ew = 1 - w.arc.span / byJ(before.wholes, 1).arc.span
      const ep = 1 - p.arc.span / byJ(before.parts, 1).arc.span
      if (ew > 0.05 && ew < 0.95) draining++
      expect(near(ep, ew, 0.02)).toBe(true)
    }
    expect(draining).toBeGreaterThan(5)
    const last = hide.probes[hide.probes.length - 1]
    expect(byJ(last.parts, 1)).toBe(undefined)
    expectNoViolations(finite(hide))

    const quiet = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.highlightFilter.set([20, 20, 20], { animate: false }),
        ),
      { probe: radialState, ms: 600 },
    )
    const end = quiet.probes[quiet.probes.length - 1]
    for (const fr of quiet.probes) {
      fr.parts.forEach((p) => expect(p.d).toBe(byJ(end.parts, p.j).d))
      fr.wholes.forEach((w) => expect(w.op).toBe(byJ(end.wholes, w.j).op))
    }
    expect(errors).toEqual([])
  })
})

/** A point on ring `i` of `window[chart]`, in page coordinates, at value
 * `v` along it (on the ring's middle line). */
function ringPoint({ chart, i, v }) {
  const c = window[chart]
  const whole = [
    ...c.el.querySelectorAll(
      '.apexcharts-radial-series .apexcharts-radialbar-area',
    ),
  ].find((n) => n.getAttribute('j') === String(i))
  const hollow = c.el.querySelector('.apexcharts-radialbar-hollow')
  const cx = +hollow.getAttribute('cx')
  const cy = +hollow.getAttribute('cy')
  const R = parseFloat(/A\s*([-\d.e]+)/.exec(whole.getAttribute('d'))[1])
  const rb = c.w.config.plotOptions.radialBar
  const ang = rb.startAngle + (v / 100) * (rb.endAngle - rb.startAngle)
  const rad = ((ang - 90) * Math.PI) / 180
  const x = cx + R * Math.cos(rad)
  const y = cy + R * Math.sin(rad)
  const m = whole.getScreenCTM()
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
}

test.describe('Highlight filter, rings: the pointer on a part', () => {
  test('a part past its ring is hovered as its ring: tooltip, centre, no leave', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({
        tooltip: { enabled: true },
        plotOptions: { radialBar: { dataLabels: { total: { show: true } } } },
        highlightFilter: { data: [40, 80, 10] },
      }),
    )
    await page.evaluate(() => {
      window.__left = 0
      window.chart.el
        .querySelectorAll(
          '.apexcharts-radial-series .apexcharts-radialbar-area',
        )
        .forEach((n) => n.addEventListener('mouseleave', () => window.__left++))
    })
    const state = () =>
      page.evaluate(() => {
        const tip = window.chart.el.querySelector('.apexcharts-tooltip')
        return {
          active: tip.classList.contains('apexcharts-active'),
          text: tip.textContent,
          centre: window.chart.el.querySelector('.apexcharts-datalabel-value')
            ?.textContent,
          left: window.__left,
        }
      })
    // Ring B: 80 against 50, drawn past the faded ring from 50 to 80.
    const past = await page.evaluate(ringPoint, { chart: 'chart', i: 1, v: 65 })
    await page.mouse.move(past.x - 3, past.y - 3)
    await advance(page, 50)
    await page.mouse.move(past.x, past.y)
    await advance(page, 300)
    let s = await state()
    expect(s.active).toBe(true)
    expect(s.text).toContain('80 / 50')
    expect(s.centre).toBe('80%')
    // Along the ring into the stretch where the part covers the faded ring,
    // and back: still on ring B.
    const walk = []
    for (let v = 65; v >= 20; v -= 1.5) walk.push(v)
    for (let v = 20; v <= 75; v += 1.5) walk.push(v)
    for (const v of walk) {
      const pt = await page.evaluate(ringPoint, { chart: 'chart', i: 1, v })
      await page.mouse.move(pt.x, pt.y)
      await advance(page, 16)
    }
    s = await state()
    expect(s.active).toBe(true)
    expect(s.left).toBe(0)
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter, gauge and rings: the circle moving', () => {
  test('a circle resized under a pick carries the needle and the parts', async ({
    page,
  }) => {
    for (const opts of [
      gauge({ highlightFilter: { data: [40] } }),
      rings({ highlightFilter: { data: [40, 80, 10] } }),
    ]) {
      const errors = await mount(page, opts)
      const probe = () => {
        const s = window.__probeRadial()
        const ct = window.chart.w.globals.circleTween
        const g = document.querySelector('.apexcharts-gauge-needle-highlight')
        const hollow = document.querySelector('.apexcharts-radialbar-hollow')
        const scr = (el, x, y) => {
          const m = el.getScreenCTM()
          return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]
        }
        const cx = +hollow.getAttribute('cx')
        const cy = +hollow.getAttribute('cy')
        // Where the needle's pivot is on screen, against the circle's centre.
        let pivot = null
        if (g) {
          const [ox, oy] = g
            .getAttribute('transform-origin')
            .split(' ')
            .map(Number)
          const p = scr(g.firstChild, ox, oy)
          const c = scr(hollow, ox, oy)
          pivot = Math.hypot(p[0] - c[0], p[1] - c[1])
        }
        // Each part's start point on screen, against its ring's.
        const drift = [
          ...document.querySelectorAll('.apexcharts-radialbar-highlight-part'),
        ].map((p) => {
          const a = p.getPointAtLength(0)
          const w = p.previousElementSibling.getPointAtLength(0)
          const pa = scr(p, a.x, a.y)
          const wa = scr(p.previousElementSibling, w.x, w.y)
          return Math.hypot(pa[0] - wa[0], pa[1] - wa[1])
        })
        return { ...s, circling: !!ct && !ct.done, pivot, drift, cx, cy }
      }
      await page.evaluate((src) => {
        window.__probeRadial = (0, eval)(`(${src})`)
      }, radialState.toString())
      const rec = await recordTransition(
        page,
        () =>
          page.evaluate(() =>
            window.chart.updateOptions({
              title: { text: 'Score', style: { fontSize: '22px' } },
            }),
          ),
        { probe },
      )
      expect(rec.probes.filter((fr) => fr.circling).length).toBeGreaterThan(5)
      for (const fr of rec.probes) {
        if (fr.pivot != null) expect(fr.pivot).toBeLessThan(0.5)
        for (const d of fr.drift) expect(d).toBeLessThan(0.5)
      }
      const last = rec.probes[rec.probes.length - 1]
      if (last.needle) expect(last.needle.op).toBe(1)
      expectNoViolations(finite(rec))
      expect(errors).toEqual([])
    }
  })

  test('a column morphing into rings with a pick pairs no part, and the parts come in after', async ({
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
      series: [{ name: 'Goal', data: [70, 50, 30] }],
      xaxis: { categories: ['A', 'B', 'C'] },
      legend: { show: false },
      dataLabels: { enabled: false },
    })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            chart: { type: 'radialBar' },
            series: [70, 50, 30],
            labels: ['A', 'B', 'C'],
            xaxis: { categories: [] },
            highlightFilter: { data: [40, 80, null] },
          }),
        ),
      {
        probe: () => ({
          parts: [
            ...document.querySelectorAll(
              '.apexcharts-radialbar-highlight-part',
            ),
          ].map((n) => parseFloat(n.getAttribute('opacity') ?? '1')),
          ghosts: document.querySelectorAll(
            '.apexcharts-morph-ghost .apexcharts-highlight-part, .apexcharts-morph-pieces .apexcharts-highlight-part',
          ).length,
          wholes: [
            ...document.querySelectorAll(
              '.apexcharts-radial-series .apexcharts-radialbar-area',
            ),
          ].map((n) => parseFloat(n.getAttribute('stroke-opacity') ?? '1')),
        }),
        ms: 2000,
      },
    )
    for (const fr of rec.probes) expect(fr.ghosts).toBe(0)
    // The parts come in from nothing once the morph has landed.
    expect(rec.probes[0].parts.every((o) => o === 0)).toBe(true)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts).toEqual([1, 1])
    for (const o of last.wholes) expect(o).toBeCloseTo(0.2, 3)
    expect(errors).toEqual([])
  })
})

/** Degrees apart on the circle. */
const turn = (a, b) => Math.abs(((((a - b) % 360) + 540) % 360) - 180)
/** Where ring j's whole ends this frame, in degrees from 12 o'clock. */
const wholeEnd = (fr, j) => {
  const w = byJ(fr.wholes, j)
  return (w.arc.start + w.arc.span) % 360
}

test.describe('Highlight filter, rings: the overflow tick', () => {
  test("a tick fades in where a part passes its whole, riding the whole's end on the ring clock", async ({
    page,
  }) => {
    const errors = await mount(page, rings())
    // Ring B's whole moves (50 to 40) as its part (80) passes it.
    const patch = {
      series: [70, 40, 30],
      highlightFilter: { data: [40, 80, 10] },
    }
    const rec = await recordTransition(
      page,
      () => page.evaluate((p) => window.chart.updateOptions(p), patch),
      { probe: radialState },
    )
    expect(rec.probes[0].ticks.map((t) => t.op)).toEqual([0])
    let moving = 0
    for (const fr of rec.probes) {
      // only ring B overflows
      expect(fr.ticks.map((t) => t.j)).toEqual([1])
      const t = fr.ticks[0]
      // on the whole's end, across the track, every frame
      expect(turn(t.a, wholeEnd(fr, 1))).toBeLessThan(0.3)
      expect(t.len).toBeGreaterThan(4)
      // its strength on the ring's fade (the whole rises from 0 to 0.2)
      const e = byJ(fr.wholes, 1).op / 0.2
      if (e > 0.05 && e < 0.95) moving++
      expect(near(t.op, 0.75 * e, 0.02)).toBe(true)
    }
    expect(moving).toBeGreaterThan(5)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.ticks[0].op).toBe(0.75)
    // the whole's end has moved, and the tick with it
    expect(turn(rec.probes[0].ticks[0].a, last.ticks[0].a)).toBeGreaterThan(20)
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('it fades out when the overflow ends, and a legend-hidden ring takes it along', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({ highlightFilter: { data: [40, 80, 10] } }),
    )
    const before = await page.evaluate(radialState)
    expect(before.ticks.map((t) => [t.j, t.op])).toEqual([[1, 0.75]])
    const within = await recordTransition(
      page,
      () => pick(page, [40, 30, 10]),
      { probe: radialState },
    )
    const from = byJ(before.parts, 1).arc.span
    let fading = 0
    for (const fr of within.probes) {
      const t = byJ(fr.ticks, 1)
      if (!t) continue
      const e = prog(byJ(fr.parts, 1).arc.span, from, 0.3 * 360)
      if (e > 0.05 && e < 0.95) fading++
      expect(near(t.op, 0.75 * (1 - e), 0.03)).toBe(true)
      expect(turn(t.a, wholeEnd(fr, 1))).toBeLessThan(0.3)
    }
    expect(fading).toBeGreaterThan(5)
    expect(within.probes[within.probes.length - 1].ticks).toEqual([])
    expectNoViolations(finite(within))

    await pick(page, [40, 80, 10])
    await advance(page, 1500)
    const shown = await page.evaluate(radialState)
    const hide = await recordTransition(
      page,
      () => page.locator('.apexcharts-legend-series[seriesName="B"]').click(),
      { probe: radialState },
    )
    let draining = 0
    for (const fr of hide.probes) {
      const t = byJ(fr.ticks, 1)
      if (!t) continue
      const e = 1 - byJ(fr.wholes, 1).arc.span / byJ(shown.wholes, 1).arc.span
      if (e > 0.05 && e < 0.95) draining++
      expect(turn(t.a, wholeEnd(fr, 1))).toBeLessThan(0.3)
      expect(near(t.op, 0.75 * (1 - e), 0.03)).toBe(true)
    }
    expect(draining).toBeGreaterThan(5)
    expect(hide.probes[hide.probes.length - 1].ticks).toEqual([])
    expectNoViolations(finite(hide))
    expect(errors).toEqual([])
  })

  test('mounted with a pick it sweeps with its whole; a resize carries it', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({ highlightFilter: { data: [40, 80, 10] } }),
      { settleMs: 0 },
    )
    const mounted = await recordTransition(page, async () => {}, {
      probe: radialState,
      ms: 1500,
    })
    let swept = 0
    for (const fr of mounted.probes) {
      const t = byJ(fr.ticks, 1)
      const w = byJ(fr.wholes, 1)
      if (!t || !w.arc) continue
      if (w.arc.span > 5 && w.arc.span < 175) swept++
      expect(turn(t.a, wholeEnd(fr, 1))).toBeLessThan(0.3)
      expect(t.op).toBe(0.75)
    }
    expect(swept).toBeGreaterThan(5)
    await advance(page, 1000)

    // A circle eased to a new size keeps the tick on its whole's end on
    // screen, every frame.
    const probe = () => {
      const t = document.querySelector('.apexcharts-radialbar-highlight-edge')
      const whole = t.previousElementSibling.previousElementSibling
      const scr = (el, x, y) => {
        const m = el.getScreenCTM()
        return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]
      }
      const n = t
        .getAttribute('d')
        .match(/[-\d.e]+/g)
        .map(Number)
      const mid = scr(t, (n[0] + n[2]) / 2, (n[1] + n[3]) / 2)
      const p = whole.getPointAtLength(whole.getTotalLength())
      const end = scr(whole, p.x, p.y)
      const ct = window.chart.w.globals.circleTween
      return {
        off: Math.hypot(mid[0] - end[0], mid[1] - end[1]),
        circling: !!ct && !ct.done,
      }
    }
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            title: { text: 'Goals', style: { fontSize: '22px' } },
          }),
        ),
      { probe },
    )
    expect(rec.probes.filter((fr) => fr.circling).length).toBeGreaterThan(5)
    for (const fr of rec.probes) expect(fr.off).toBeLessThan(0.5)
    expect(errors).toEqual([])
  })

  test('an export mid-flight lands its strength, never its angle', async ({
    page,
  }) => {
    const errors = await mount(page, rings())
    const patch = {
      series: [70, 40, 30],
      highlightFilter: { data: [40, 80, 10] },
    }
    await recordTransition(
      page,
      () => page.evaluate((p) => window.chart.updateOptions(p), patch),
      { ms: 160 },
    )
    const exp = await page.evaluate(async () => {
      const t = document.querySelector('.apexcharts-radialbar-highlight-edge')
      const live = t.getAttribute('d')
      const svg = await window.chart.getSvgString()
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
      const x = doc.querySelector('.apexcharts-radialbar-highlight-edge')
      return {
        live,
        d: x.getAttribute('d'),
        op: x.getAttribute('stroke-opacity'),
        screen: t.getAttribute('stroke-opacity'),
      }
    })
    expect(exp.d).toBe(exp.live)
    expect(exp.op).toBe('0.75')
    expect(exp.screen).toBe('0.75')
    // and the tick goes on riding its whole's end
    const rest = await recordTransition(page, async () => {}, {
      probe: radialState,
    })
    let moved = 0
    for (const fr of rest.probes) {
      const t = byJ(fr.ticks, 1)
      expect(turn(t.a, wholeEnd(fr, 1))).toBeLessThan(0.3)
      expect(t.op).toBe(0.75)
      if (turn(t.a, rest.probes[0].ticks[0].a) > 1) moved++
    }
    expect(moved).toBeGreaterThan(2)
    expectNoViolations(finite(rest))
    expect(errors).toEqual([])
  })

  test('a column morphing into rings pairs no tick; it comes in with the parts', async ({
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
      series: [{ name: 'Goal', data: [70, 50, 30] }],
      xaxis: { categories: ['A', 'B', 'C'] },
      legend: { show: false },
      dataLabels: { enabled: false },
    })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            chart: { type: 'radialBar' },
            series: [70, 50, 30],
            labels: ['A', 'B', 'C'],
            xaxis: { categories: [] },
            highlightFilter: { data: [40, 80, null] },
          }),
        ),
      {
        probe: () => ({
          ticks: [
            ...document.querySelectorAll(
              '.apexcharts-radialbar-highlight-edge',
            ),
          ].map((n) => parseFloat(n.getAttribute('opacity') ?? '1')),
          ghosts: document.querySelectorAll(
            '.apexcharts-morph-ghost .apexcharts-highlight-edge, .apexcharts-morph-pieces .apexcharts-highlight-edge',
          ).length,
        }),
        ms: 2000,
      },
    )
    for (const fr of rec.probes) expect(fr.ghosts).toBe(0)
    const seen = rec.probes.filter((fr) => fr.ticks.length)
    expect(seen[0].ticks).toEqual([0])
    expect(rec.probes[rec.probes.length - 1].ticks).toEqual([1])
    expect(errors).toEqual([])
  })
})

test.describe("Highlight filter, needle gauge: the gauge's own needle", () => {
  const dial = (extra = {}) =>
    gauge({
      ...extra,
      plotOptions: { radialBar: { shape: 'needle' } },
    })

  test('a pick fades it on its own clock, in step with its swing, and a clear restores it', async ({
    page,
  }) => {
    const errors = await mount(page, dial())
    const m0 = await angleAt(page, 70)
    const m1 = await angleAt(page, 50)
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            series: [50],
            highlightFilter: { data: [80] },
          }),
        ),
      { probe: radialState },
    )
    expect(rec.probes[0].mainOp).toBe(1)
    let moving = 0
    for (const fr of rec.probes) {
      const ea = prog(fr.main, m0, m1)
      const eo = prog(fr.mainOp, 1, 0.2)
      if (ea > 0.05 && ea < 0.95) moving++
      expect(near(ea, eo, 0.02)).toBe(true)
      // the part's needle stays solid once it is in
      if (fr.needle && fr.needle.op === 1) expect(fr.needle.op).toBe(1)
    }
    expect(moving).toBeGreaterThan(5)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.mainOp).toBeCloseTo(0.2, 6)
    expect(last.needle.op).toBe(1)

    // A clear: back to solid as the part's needle fades out, one clock.
    const out = await recordTransition(page, () => pick(page, null), {
      probe: radialState,
    })
    let back = 0
    for (const fr of out.probes) {
      if (!fr.needle) continue
      const em = prog(fr.mainOp, 0.2, 1)
      if (em > 0.05 && em < 0.95) back++
      expect(near(em, 1 - fr.needle.op, 0.02)).toBe(true)
    }
    expect(back).toBeGreaterThan(5)
    const end = out.probes[out.probes.length - 1]
    expect(end.mainOp).toBe(1)
    expect(end.needle).toBe(null)
    expectNoViolations(finite(out))
    expect(errors).toEqual([])
  })

  test('the reading sits under the pivot, where neither needle crosses it', async ({
    page,
  }) => {
    const errors = await mount(page, dial({ highlightFilter: { data: [40] } }))
    const gap = await page.evaluate(() => {
      const g = document.querySelector('.apexcharts-gauge-needle')
      const [, cy] = g.getAttribute('transform-origin').split(' ').map(Number)
      const v = document.querySelector('.apexcharts-datalabel-value')
      const b = v.getBBox()
      const r = parseFloat(
        /A\s*([-\d.e]+)/.exec(g.firstChild.getAttribute('d'))[1],
      )
      return b.y - (cy + r)
    })
    expect(gap).toBeGreaterThan(4)
    expect(errors).toEqual([])
  })

  for (const [whole, part] of [
    [3, 97],
    [97, 3],
  ]) {
    test(`at either end of the dial the reading clears both needles, inside the chart (${whole} / ${part})`, async ({
      page,
    }) => {
      const errors = await mount(
        page,
        dial({ series: [whole], highlightFilter: { data: [part] } }),
      )
      const s = await page.evaluate(() => {
        const box = (el) => {
          const b = el.getBoundingClientRect()
          return { l: b.left, r: b.right, t: b.top, b: b.bottom }
        }
        const label = box(document.querySelector('.apexcharts-datalabel-value'))
        const needles = [
          '.apexcharts-gauge-needle-shape',
          '.apexcharts-gauge-needle-highlight-shape',
        ].map((sel) => box(document.querySelector(sel)))
        return {
          label,
          needles,
          svg: box(document.querySelector('#chart svg')),
          text: document.querySelector('.apexcharts-datalabel-value')
            .textContent,
        }
      })
      expect(s.text).toBe(`${part}%`)
      for (const n of s.needles) {
        const cross =
          n.l < s.label.r &&
          s.label.l < n.r &&
          n.t < s.label.b &&
          s.label.t < n.b
        expect(cross).toBe(false)
      }
      expect(s.label.b).toBeLessThanOrEqual(s.svg.b)
      expect(errors).toEqual([])
    })
  }

  test("the part's needle is on the gauge needle's own frames: a pick, a re-pick and a clear, sent from a timer", async ({
    page,
  }) => {
    const errors = await mount(page, dial())
    // Sent from a timer mid-frame, as a live feed does: the render's own
    // moment is the clock, not the frame after it.
    const steps = [
      [{ series: [30], highlightFilter: { data: [60] } }, 70, 60],
      [{ series: [80], highlightFilter: { data: [20] } }, 60, 20],
      [{ series: [50], highlightFilter: { data: null } }, null, null],
    ]
    for (const [patch, from, to] of steps) {
      const m0 = (await page.evaluate(radialState)).main
      const a0 = from == null ? 0 : await angleAt(page, from)
      const a1 = to == null ? 0 : await angleAt(page, to)
      const rec = await recordTransition(
        page,
        () =>
          page.evaluate((p) => {
            setTimeout(() => window.chart.updateOptions(p), 8)
          }, patch),
        { probe: radialState },
      )
      const m1 = rec.probes[rec.probes.length - 1].main
      let moving = 0
      for (const fr of rec.probes) {
        if (!fr.needle) continue
        const em = prog(fr.main, m0, m1)
        if (em > 0.02 && em < 0.98) moving++
        // a needle on its way out is held to the gauge's by its strength
        const ep = from == null ? 1 - fr.needle.op : prog(fr.needle.a, a0, a1)
        expect(near(em, ep, 0.002), JSON.stringify(patch)).toBe(true)
      }
      expect(moving).toBeGreaterThan(4)
      await advance(page, 1000)
    }
    expect(errors).toEqual([])
  })

  test('a column morphing into a needle gauge with a pick holds its own needle solid until the part comes in', async ({
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
      series: [{ name: 'Score', data: [70] }],
      xaxis: { categories: ['Score'] },
      dataLabels: { enabled: false },
    })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            chart: { type: 'gauge' },
            series: [70],
            labels: ['Score'],
            xaxis: { categories: [] },
            plotOptions: { radialBar: { shape: 'needle' } },
            highlightFilter: { data: [30] },
          }),
        ),
      {
        // the column has no hollow yet, so not radialState
        probe: () => {
          const op = (g) =>
            g ? parseFloat(g.getAttribute('opacity') ?? '1') : null
          const n = op(
            document.querySelector('.apexcharts-gauge-needle-highlight'),
          )
          return {
            mainOp: op(document.querySelector('.apexcharts-gauge-needle')),
            needle: n == null ? null : { op: n },
          }
        },
        ms: 2000,
      },
    )
    let both = 0
    for (const fr of rec.probes) {
      if (fr.mainOp == null || !fr.needle) continue
      // the gauge's own needle gives way exactly as the part's comes in
      const eo = prog(fr.mainOp, 1, 0.2)
      expect(near(eo, fr.needle.op, 0.02)).toBe(true)
      if (eo > 0.05 && eo < 0.95) both++
    }
    expect(both).toBeGreaterThan(4)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.mainOp).toBeCloseTo(0.2, 6)
    expect(last.needle.op).toBe(1)
    expect(errors).toEqual([])
  })
})

/** Hover page point `pt` and read the tooltip. */
async function hoverAt(page, pt) {
  await page.mouse.move(pt.x - 2, pt.y - 2)
  await advance(page, 50)
  await page.mouse.move(pt.x, pt.y)
  await advance(page, 300)
  return page.evaluate(() => {
    const tip = window.chart.el.querySelector('.apexcharts-tooltip')
    return {
      active: !!tip?.classList.contains('apexcharts-active'),
      text: tip?.textContent || '',
    }
  })
}

/** The middle of a needle (the part's, or the gauge's own) on the page. */
function needleMid(sel) {
  const g = document.querySelector(sel)
  const n = g.firstChild
    .getAttribute('d')
    .match(/[-\d.e]+/g)
    .map(Number)
  // M base A ... base L tipX tipY: the pivot is the base's middle
  const [x0, y0] = g.getAttribute('transform-origin').split(' ').map(Number)
  const tipY = n[10]
  const m = g.getScreenCTM()
  const x = x0
  const y = (y0 + tipY) / 2
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
}

test.describe('Highlight filter, radial: the tooltip under a pick', () => {
  for (const renderer of ['svg', 'canvas']) {
    test(`every piece of a ring shows its row: faded whole, solid part, the tick (${renderer})`, async ({
      page,
    }) => {
      const errors = await mount(
        page,
        rings({
          chart: { renderer },
          highlightFilter: { data: [40, 80, 10] },
        }),
      )
      // Ring A: faded alone past its part, and under its part.
      for (const v of [55, 20]) {
        const s = await hoverAt(
          page,
          await page.evaluate(ringPoint, { chart: 'chart', i: 0, v }),
        )
        expect(s.active).toBe(true)
        expect(s.text).toContain('40 / 70')
      }
      // Ring B: on the tick at its whole's end, and on the part past it.
      for (const v of [50, 65]) {
        const pt = await page.evaluate(ringPoint, { chart: 'chart', i: 1, v })
        if (v === 50) {
          const under = await page.evaluate(
            ({ x, y }) =>
              document.elementFromPoint(x, y)?.getAttribute('class') || '',
            pt,
          )
          // the tick takes no pointer: the part under it does
          expect(under).toContain('apexcharts-radialbar-highlight-part')
        }
        const s = await hoverAt(page, pt)
        expect(s.active).toBe(true)
        expect(s.text).toContain('80 / 50')
      }
      // A clear gives the chart its own setting back: no tooltip.
      await pick(page, null)
      await advance(page, 1500)
      const s = await hoverAt(
        page,
        await page.evaluate(ringPoint, { chart: 'chart', i: 0, v: 55 }),
      )
      expect(s.active).toBe(false)
      expect(
        await page.evaluate(() => window.chart.w.config.tooltip.enabled),
      ).toBe(false)
      expect(errors).toEqual([])
    })
  }

  test('on a needle gauge, either needle shows the ring', async ({ page }) => {
    const errors = await mount(
      page,
      gauge({
        plotOptions: {
          radialBar: { shape: 'needle', needle: { length: '95%' } },
        },
        highlightFilter: { data: [30] },
      }),
    )
    for (const sel of [
      '.apexcharts-gauge-needle-highlight',
      '.apexcharts-gauge-needle',
    ]) {
      await page.mouse.move(5, 5)
      await advance(page, 300)
      const pt = await page.evaluate(needleMid, sel)
      const under = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('class'),
        pt,
      )
      expect(under, sel).toContain(sel.slice(1) + '-shape')
      const s = await hoverAt(page, pt)
      expect(s.active, sel).toBe(true)
      expect(s.text).toContain('30 / 70')
    }
    expect(errors).toEqual([])
  })

  test('a pick and a clear in one tick leave no tooltip on the cleared chart', async ({
    page,
  }) => {
    const errors = await mount(page, rings())
    await page.evaluate(() => {
      window.chart.highlightFilter.set([40, 80, 10])
      window.chart.highlightFilter.clear()
    })
    await advance(page, 1500)
    const s = await hoverAt(
      page,
      await page.evaluate(ringPoint, { chart: 'chart', i: 0, v: 55 }),
    )
    expect(
      await page.evaluate(() => window.chart.highlightFilter.isActive()),
    ).toBe(false)
    expect(s.active).toBe(false)
    expect(errors).toEqual([])
  })

  test("a page's own tooltip.enabled false keeps it off", async ({ page }) => {
    const errors = await mount(
      page,
      rings({
        tooltip: { enabled: false },
        highlightFilter: { data: [40, 80, 10] },
      }),
    )
    const s = await hoverAt(
      page,
      await page.evaluate(ringPoint, { chart: 'chart', i: 0, v: 55 }),
    )
    expect(s.active).toBe(false)
    expect(errors).toEqual([])
  })
})

/** Each ring's lanes and tracks, and the centre, read in the page every
 * frame. Radii are read off the arcs; `w` is the stroke width. */
function laneState(root = '#chart') {
  const r = document.querySelector(root)
  const hollow = r.querySelector('.apexcharts-radialbar-hollow')
  const cx = +hollow.getAttribute('cx')
  const cy = +hollow.getAttribute('cy')
  const at = (x, y) =>
    ((((Math.atan2(+y - cy, +x - cx) * 180) / Math.PI + 90) % 360) + 360) % 360
  const arc = (d) => {
    const m =
      /M\s*([-\d.e]+)\s+([-\d.e]+)\s*A\s*([-\d.e]+)\s+[-\d.e]+\s+[-\d.e]+\s+([01])\s+[01]\s+([-\d.e]+)\s+([-\d.e]+)/.exec(
        d || '',
      )
    if (!m) return null
    const a0 = at(m[1], m[2])
    const a1 = at(m[5], m[6])
    let span = (a1 - a0 + 360) % 360
    if (m[4] === '1' && span < 180) span += 360
    if (span > 359.5 && m[4] === '0') span = 0
    return { start: a0, span, r: +m[3] }
  }
  const read = (el) =>
    el
      ? {
          d: el.getAttribute('d') || '',
          arc: arc(el.getAttribute('d')),
          w: +el.getAttribute('stroke-width'),
          op: parseFloat(el.getAttribute('stroke-opacity') ?? '1'),
          show: parseFloat(el.getAttribute('opacity') ?? '1'),
          cls: el.getAttribute('class'),
        }
      : null
  const tracks = [...r.querySelectorAll('.apexcharts-tracks > g')]
  // tracks are laid out outermost first, as the rings are drawn
  const inv = window.chart.w.config.plotOptions.radialBar.inverseOrder
  const rings = [
    ...r.querySelectorAll(
      '.apexcharts-radial-series .apexcharts-radialbar-area',
    ),
  ].map((el) => {
    const j = +el.getAttribute('j')
    const g = el.parentNode
    const tg = tracks[inv ? tracks.length - 1 - j : j]
    return {
      j,
      ...read(el),
      whole: read(g.querySelector('.apexcharts-radialbar-highlight-whole')),
      part: read(
        g.querySelector(
          '.apexcharts-radialbar-highlight-lane.apexcharts-radialbar-highlight-part',
        ),
      ),
      track: read(tg?.querySelector('.apexcharts-radialbar-area')),
      inner: read(tg?.querySelector('.apexcharts-radialbar-highlight-track')),
    }
  })
  const line = r.querySelector('.apexcharts-datalabel-whole')
  return {
    rings,
    ticks: r.querySelectorAll('.apexcharts-radialbar-highlight-edge').length,
    centre: r.querySelector('.apexcharts-datalabel-value')?.textContent,
    line: line
      ? {
          text: line.textContent,
          // its own fade is on its fill (muted at 0.6); a moving circle's
          // on its opacity
          op:
            (parseFloat(line.getAttribute('opacity') ?? '1') *
              parseFloat(line.getAttribute('fill-opacity') ?? '0.6')) /
            0.6,
        }
      : null,
  }
}

/** A single dial split in lanes (opt-in: unset, it shares its track). An
 * indicator in `extra` still wins. */
const dial = (extra = {}) =>
  gauge(
    {
      ...extra,
      highlightFilter: {
        ...(extra.highlightFilter || {}),
        radialBar: {
          indicator: 'lanes',
          ...(extra.highlightFilter?.radialBar || {}),
        },
      },
    },
    { split: true },
  )
const ring0 = (s) => s.rings[0]

/** A point in the middle of ring `i`'s lane (`'whole'`, `'part'`) or of the
 * gap between them (`'gap'`), at value `v` along it, in page coordinates, on
 * `window[chart]`. */
function lanePoint({ i, v, lane, chart = 'chart' }) {
  const c = window[chart]
  const g = [...c.el.querySelectorAll('.apexcharts-radial-series')].find(
    (n) => n.getAttribute('data:realIndex') === String(i),
  )
  const hollow = c.el.querySelector('.apexcharts-radialbar-hollow')
  const cx = +hollow.getAttribute('cx')
  const cy = +hollow.getAttribute('cy')
  const at = (cls) => {
    const n = g.querySelector(cls)
    return {
      r: parseFloat(/A\s*([-\d.e]+)/.exec(n.getAttribute('d'))[1]),
      w: +n.getAttribute('stroke-width'),
    }
  }
  const wl = at('.apexcharts-radialbar-highlight-whole')
  const pl = at(
    '.apexcharts-radialbar-highlight-lane.apexcharts-radialbar-highlight-part',
  )
  const R =
    lane === 'whole'
      ? wl.r
      : lane === 'part'
        ? pl.r
        : (wl.r - wl.w / 2 + (pl.r + pl.w / 2)) / 2
  const rb = c.w.config.plotOptions.radialBar
  const ang = rb.startAngle + (v / 100) * (rb.endAngle - rb.startAngle)
  const rad = ((ang - 90) * Math.PI) / 180
  const x = cx + R * Math.cos(rad)
  const y = cy + R * Math.sin(rad)
  const m = hollow.getScreenCTM()
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
}

test.describe('Highlight filter, lanes: a single dial splits in two', () => {
  test('a first pick splits the band from the screen, on the ring clock', async ({
    page,
  }) => {
    const errors = await mount(page, dial())
    const before = await page.evaluate(laneState)
    expect(ring0(before).whole).toBe(null)
    const rec = await recordTransition(page, () => pick(page, [40]), {
      probe: laneState,
    })
    const b = ring0(before)
    const f0 = ring0(rec.probes[0])
    // Frame 0 is the screen: the whole's lane is the ring, the part's has
    // no width yet, the ring is hidden under them, the track is whole.
    expect(f0.op).toBe(0)
    expect(f0.whole.d).toBe(b.d)
    expect(f0.whole.w).toBeCloseTo(b.w, 6)
    expect(f0.whole.op).toBe(b.op)
    expect(f0.part.w).toBe(0)
    expect(f0.track.d).toBe(b.track.d)
    expect(f0.track.w).toBeCloseTo(b.track.w, 6)
    expect(f0.inner.w).toBe(0)
    expect(rec.probes[0].line.op).toBe(0)
    const last = ring0(rec.probes[rec.probes.length - 1])
    let moving = 0
    for (const fr of rec.probes) {
      const r = ring0(fr)
      // the ring stays hidden; the split, the whole lane's strength, the
      // part's sweep from the whole's end, the tracks and the centre's
      // second line all move on one clock
      expect(r.op).toBe(0)
      const s = r.part.w / last.part.w
      if (s > 0.05 && s < 0.95) moving++
      expect(near(prog(r.whole.op, 1, 0.45), s, 0.02)).toBe(true)
      expect(near(prog(r.whole.w, b.w, last.whole.w), s, 0.02)).toBe(true)
      expect(near(prog(r.inner.w, 0, last.inner.w), s, 0.02)).toBe(true)
      expect(near(fr.line.op, s, 0.02)).toBe(true)
      if (r.part.arc) {
        expect(
          near(prog(r.part.arc.span, b.arc.span, last.part.arc.span), s, 0.02),
        ).toBe(true)
      }
      // the lanes never overlap: the part's outer edge stays inside the
      // whole's inner edge
      expect(r.part.arc ? r.part.arc.r + r.part.w / 2 : 0).toBeLessThanOrEqual(
        r.whole.arc.r - r.whole.w / 2 + 1e-6,
      )
    }
    expect(moving).toBeGreaterThan(6)
    expect(last.whole.op).toBeCloseTo(0.45, 6)
    expect(rec.probes[rec.probes.length - 1].line).toEqual({
      text: '/ 70%',
      op: 1,
    })
    expect(rec.probes[rec.probes.length - 1].centre).toBe('40%')
    expectNoViolations(finite(rec))
    const want = await fresh(page, {
      highlightFilter: { data: [40], radialBar: { indicator: 'lanes' } },
    })
    for (const k of ['whole', 'part', 'track', 'inner']) {
      expect(last[k].d, k).toBe(ring0(want)[k].d)
      expect(last[k].w, k).toBeCloseTo(ring0(want)[k].w, 6)
    }
    expect(errors).toEqual([])
  })

  test('a re-pick sweeps only the part lane; a whole update moves both on the ring clock', async ({
    page,
  }) => {
    const errors = await mount(page, dial({ highlightFilter: { data: [40] } }))
    const repick = await recordTransition(page, () => pick(page, [60]), {
      probe: laneState,
    })
    const f0 = ring0(repick.probes[0])
    let swept = 0
    for (const fr of repick.probes) {
      const r = ring0(fr)
      expect(r.whole.d).toBe(f0.whole.d)
      expect(r.whole.w).toBe(f0.whole.w)
      expect(r.whole.op).toBeCloseTo(0.45, 6)
      expect(r.part.w).toBe(f0.part.w)
      expect(r.inner.d).toBe(f0.inner.d)
      if (r.part.arc.span !== f0.part.arc.span) swept++
      expect(fr.line.op).toBe(1)
    }
    expect(swept).toBeGreaterThan(6)
    // The whole moves to 50 and the part to 30, together.
    const both = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            series: [50],
            highlightFilter: { data: [30] },
          }),
        ),
      { probe: laneState },
    )
    const a = ring0(both.probes[0])
    const z = ring0(both.probes[both.probes.length - 1])
    let moving = 0
    for (const fr of both.probes) {
      const r = ring0(fr)
      const ew = prog(r.whole.arc.span, a.whole.arc.span, z.whole.arc.span)
      const ep = prog(r.part.arc.span, a.part.arc.span, z.part.arc.span)
      if (ew > 0.05 && ew < 0.95) moving++
      expect(near(ew, ep, 0.02)).toBe(true)
      // on the ring's own (hidden) arc's clock
      expect(near(r.whole.arc.span, r.arc.span, 0.5)).toBe(true)
    }
    expect(moving).toBeGreaterThan(6)
    expect(both.probes[both.probes.length - 1].line.text).toBe('/ 50%')
    expectNoViolations(finite(both))
    expect(errors).toEqual([])
  })

  test('a clear merges the lanes back into the band, from the screen, and lands plain', async ({
    page,
  }) => {
    const errors = await mount(page, dial({ highlightFilter: { data: [40] } }))
    const half = await recordTransition(page, () => pick(page, [90]), {
      probe: laneState,
      ms: 160,
    })
    const mid = ring0(half.probes[half.probes.length - 1])
    const clear = await recordTransition(page, () => pick(page, null), {
      probe: laneState,
    })
    const c0 = ring0(clear.probes[0])
    // Frame 0 is the screen, mid-flight as it was.
    expect(near(c0.part.arc.span, mid.part.arc.span, 0.5)).toBe(true)
    expect(c0.whole.w).toBeCloseTo(mid.whole.w, 3)
    expect(near(c0.whole.op, mid.whole.op, 0.02)).toBe(true)
    const frames = clear.probes.map(ring0)
    let merging = 0
    for (let k = 0; k < frames.length; k++) {
      const r = frames[k]
      // the ring stays hidden until its lanes have merged into it, and is
      // back the frame they leave
      if (!r.whole) {
        expect(r.op).toBe(1)
        continue
      }
      expect(r.op).toBe(0)
      const s = r.part.w / mid.part.w
      if (s > 0.05 && s < 0.95) merging++
      expect(near(prog(r.whole.op, 1, mid.whole.op), s, 0.03)).toBe(true)
      if (clear.probes[k].line) {
        expect(near(clear.probes[k].line.op, s, 0.03)).toBe(true)
      }
    }
    expect(merging).toBeGreaterThan(6)
    const last = clear.probes[clear.probes.length - 1]
    expect(ring0(last).whole).toBe(null)
    expect(ring0(last).part).toBe(null)
    expect(ring0(last).inner).toBe(null)
    expect(ring0(last).op).toBe(1)
    expect(last.line).toBe(null)
    expect(last.centre).toBe('70%')
    const plain = await fresh(page, { highlightFilter: { data: null } })
    expect(ring0(last).track.d).toBe(ring0(plain).track.d)
    expect(ring0(last).track.w).toBeCloseTo(ring0(plain).track.w, 6)
    expectNoViolations(finite(clear))
    expectNoViolations(
      await settles(page, clear, {
        transform: target({ highlightFilter: { data: null } }),
      }),
    )
    // Two updates in one frame start from the screen too.
    await pick(page, [40])
    await advance(page, 1500)
    const screen = ring0(await page.evaluate(laneState))
    const twice = await recordTransition(
      page,
      () =>
        page.evaluate(() => {
          window.chart.updateOptions({ highlightFilter: { data: [60] } })
          window.chart.updateOptions({ highlightFilter: { data: [20] } })
        }),
      { probe: laneState },
    )
    const t0 = ring0(twice.probes[0])
    expect(near(t0.part.arc.span, screen.part.arc.span, 0.5)).toBe(true)
    expect(t0.whole.d).toBe(screen.whole.d)
    expect(t0.part.w).toBe(screen.part.w)
    expect(errors).toEqual([])
  })

  test('an export mid-flight lands the lane strength, never a shape', async ({
    page,
  }) => {
    const errors = await mount(page, dial())
    const first = await recordTransition(page, () => pick(page, [40]), {
      probe: laneState,
      ms: 160,
    })
    const mid = ring0(first.probes[first.probes.length - 1])
    const exp = await page.evaluate(async () => {
      const svg = await window.chart.getSvgString()
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
      const q = (s) => doc.querySelector(s)
      return {
        whole: +q('.apexcharts-radialbar-highlight-whole').getAttribute(
          'stroke-opacity',
        ),
        wholeW: +q('.apexcharts-radialbar-highlight-whole').getAttribute(
          'stroke-width',
        ),
        partD: q(
          '.apexcharts-radialbar-highlight-lane.apexcharts-radialbar-highlight-part',
        ).getAttribute('d'),
        line: [
          q('.apexcharts-datalabel-whole').getAttribute('opacity'),
          q('.apexcharts-datalabel-whole').getAttribute('fill-opacity'),
        ],
      }
    })
    expect(exp.whole).toBeCloseTo(0.45, 6)
    expect(exp.line).toEqual([null, '0.6'])
    expect(exp.partD).toBe(mid.part.d)
    expect(exp.wholeW).toBeCloseTo(mid.whole.w, 6)
    // the shapes go on from where they were
    const rest = await recordTransition(page, async () => {}, {
      probe: laneState,
    })
    expect(
      near(ring0(rest.probes[0]).part.arc.span, mid.part.arc.span, 1),
    ).toBe(true)
    for (const fr of rest.probes) {
      expect(ring0(fr).whole.op).toBeCloseTo(0.45, 6)
    }
    const end = ring0(rest.probes[rest.probes.length - 1])
    expect(end.part.w).toBeGreaterThan(mid.part.w + 1)
    expectNoViolations(finite(rest))
    // Mid-clear, an export lands the clear: the plain ring and its whole
    // track, on screen too, and nothing moves after it.
    await recordTransition(page, () => pick(page, null), { ms: 160 })
    await page.evaluate(() => window.chart.getSvgString())
    const after = await recordTransition(page, async () => {}, {
      probe: laneState,
    })
    const plain = ring0(await fresh(page, { highlightFilter: { data: null } }))
    for (const fr of after.probes) {
      const r = ring0(fr)
      expect(r.whole).toBe(null)
      expect(r.inner).toBe(null)
      expect(r.op).toBe(1)
      expect(r.track.d).toBe(plain.track.d)
      expect(r.track.w).toBeCloseTo(plain.track.w, 6)
      expect(fr.line).toBe(null)
    }
    expect(errors).toEqual([])
  })

  test('mounted with a pick the lanes sweep with the ring; an unanimated update moves nothing; a resize carries them', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      dial({ highlightFilter: { data: [40] } }),
      {
        settleMs: 0,
      },
    )
    const mounted = await recordTransition(page, async () => {}, {
      probe: laneState,
      ms: 1200,
    })
    const end = ring0(mounted.probes[mounted.probes.length - 1])
    let swept = 0
    for (const fr of mounted.probes) {
      const r = ring0(fr)
      // split from frame 0, the whole lane at its rest strength
      expect(r.part.w).toBeCloseTo(end.part.w, 6)
      expect(r.whole.op).toBeCloseTo(0.45, 6)
      if (!r.whole.arc || !r.part.arc) continue
      const ew = r.whole.arc.span / end.whole.arc.span
      const ep = r.part.arc.span / end.part.arc.span
      if (ew > 0.05 && ew < 0.95) swept++
      expect(near(ew, ep, 0.02)).toBe(true)
    }
    expect(swept).toBeGreaterThan(5)
    const quiet = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.highlightFilter.set([20], { animate: false }),
        ),
      { probe: laneState, ms: 600 },
    )
    const q = ring0(quiet.probes[quiet.probes.length - 1])
    for (const fr of quiet.probes) {
      expect(ring0(fr).part.d).toBe(q.part.d)
      expect(ring0(fr).whole.d).toBe(q.whole.d)
    }
    // A resize under the pick: the circle moves, the lanes ride it.
    await page.evaluate((src) => {
      window.__laneState = (0, eval)(`(${src})`)
    }, laneState.toString())
    const moved = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            title: { text: 'Score', style: { fontSize: '22px' } },
          }),
        ),
      {
        probe: () => {
          const ring = document.querySelector('.apexcharts-radialbar-slice-0')
          const lane = document.querySelector(
            '.apexcharts-radialbar-highlight-whole',
          )
          const scr = (el) => {
            const p = el.getPointAtLength(0)
            const m = el.getScreenCTM()
            return [m.a * p.x + m.c * p.y + m.e, m.b * p.x + m.d * p.y + m.f]
          }
          const ct = window.chart.w.globals.circleTween
          const a = scr(lane)
          const b = scr(ring)
          return {
            circling: !!ct && !ct.done,
            // the lane's start against the ring's, along the radius only
            drift: Math.abs(
              Math.hypot(a[0] - b[0], a[1] - b[1]) -
                Math.abs(
                  parseFloat(/A\s*([-\d.e]+)/.exec(ring.getAttribute('d'))[1]) -
                    parseFloat(
                      /A\s*([-\d.e]+)/.exec(lane.getAttribute('d'))[1],
                    ),
                ) *
                  (ring.getScreenCTM().a || 1),
            ),
            op: +lane.getAttribute('stroke-opacity'),
          }
        },
      },
    )
    expect(moved.probes.filter((fr) => fr.circling).length).toBeGreaterThan(5)
    for (const fr of moved.probes) {
      expect(fr.drift).toBeLessThan(0.5)
      expect(fr.op).toBeCloseTo(0.45, 6)
    }
    expect(errors).toEqual([])
  })

  test('a ring with no part, or a part of 0, still splits, its inner lane empty', async ({
    page,
  }) => {
    for (const data of [[null], [0]]) {
      const errors = await mount(page, dial({ highlightFilter: { data } }))
      const r = ring0(await page.evaluate(laneState))
      expect(r.op).toBe(0)
      expect(r.whole.op).toBeCloseTo(0.45, 6)
      expect(r.part.d).toBe('')
      expect(r.inner.w).toBeGreaterThan(2)
      expect(r.inner.arc.span).toBeCloseTo(r.track.arc.span, 3)
      expect(errors).toEqual([])
    }
  })

  test('a column morphing into a gauge with a pick: the ring moves in whole, then splits', async ({
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
      series: [{ name: 'Score', data: [70] }],
      xaxis: { categories: ['Score'] },
      legend: { show: false },
      dataLabels: { enabled: false },
    })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            chart: { type: 'radialBar' },
            series: [70],
            labels: ['Score'],
            xaxis: { categories: [] },
            highlightFilter: { data: [40], radialBar: { indicator: 'lanes' } },
          }),
        ),
      {
        probe: () => {
          const q = (s) => document.querySelector(s)
          const wl = q('.apexcharts-radialbar-highlight-whole')
          const pl = q(
            '.apexcharts-radialbar-highlight-lane.apexcharts-radialbar-highlight-part',
          )
          const ring = q('.apexcharts-radial-series .apexcharts-radialbar-area')
          return {
            ghosts: document.querySelectorAll(
              '.apexcharts-morph-ghost .apexcharts-highlight-part, .apexcharts-morph-pieces .apexcharts-highlight-part',
            ).length,
            shown: wl ? parseFloat(wl.getAttribute('opacity') ?? '1') : null,
            ring: ring
              ? parseFloat(ring.getAttribute('stroke-opacity') ?? '1')
              : null,
            partW: pl ? +pl.getAttribute('stroke-width') : null,
            op: wl ? +wl.getAttribute('stroke-opacity') : null,
          }
        },
        ms: 2000,
      },
    )
    let waiting = 0
    let split = 0
    for (const fr of rec.probes) {
      expect(fr.ghosts).toBe(0)
      if (fr.shown === null) continue
      // until the lanes show, the ring is on screen; once they do, it hides
      if (fr.shown === 0) {
        waiting++
        expect(fr.ring).toBe(1)
      } else {
        expect(fr.ring).toBe(0)
        if (fr.partW > 0 && fr.op > 0.46) split++
      }
    }
    expect(waiting).toBeGreaterThan(5)
    expect(split).toBeGreaterThan(3)
    const last = rec.probes[rec.probes.length - 1]
    expect(last.op).toBeCloseTo(0.45, 6)
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter, lanes: several rings (opt-in)', () => {
  const laneRings = (data) =>
    rings({
      highlightFilter: { data, radialBar: { indicator: 'lanes' } },
    })

  test('each ring splits in a pair; the gap inside a pair is the narrower', async ({
    page,
  }) => {
    for (const [margin, inverseOrder] of [
      [5, false],
      [0, false],
      [5, true],
    ]) {
      const errors = await mount(page, {
        ...laneRings([40, 80, null]),
        plotOptions: { radialBar: { track: { margin }, inverseOrder } },
      })
      const s = await page.evaluate(laneState)
      expect(s.ticks).toBe(0)
      const edges = s.rings.map((r) => ({
        outIn: r.whole.arc.r - r.whole.w / 2,
        out: r.whole.arc.r + r.whole.w / 2,
        inn: r.inner.arc.r - r.inner.w / 2,
        inOut: r.inner.arc.r + r.inner.w / 2,
      }))
      for (const r of s.rings) {
        // each lane on its own track
        expect(r.track.arc.r).toBeCloseTo(r.whole.arc.r, 3)
        expect(r.inner.arc.r).toBeCloseTo(
          r.part.arc ? r.part.arc.r : r.inner.arc.r,
          3,
        )
      }
      for (let j = 0; j < edges.length; j++) {
        const inside = edges[j].outIn - edges[j].inOut
        expect(inside).toBeGreaterThan(0.5)
        if (j + 1 < edges.length) {
          const between = edges[j].inn - edges[j + 1].out
          expect(between).toBeGreaterThan(inside * 2)
        }
      }
      // ring B is past its whole: marked by the class, no tick
      expect(byJ(s.rings, 1).part.cls).toContain(
        'apexcharts-highlight-overflow',
      )
      expect(byJ(s.rings, 0).part.cls).not.toContain(
        'apexcharts-highlight-overflow',
      )
      expect(errors).toEqual([])
    }
  })

  test('a legend-hidden ring merges as it drains, and comes back split', async ({
    page,
  }) => {
    const errors = await mount(page, laneRings([40, 80, 10]))
    const before = await page.evaluate(laneState)
    const hide = await recordTransition(
      page,
      () => page.locator('.apexcharts-legend-series[seriesName="B"]').click(),
      { probe: laneState },
    )
    let draining = 0
    const b0 = byJ(before.rings, 1)
    for (const fr of hide.probes.slice(0, -1)) {
      const r = byJ(fr.rings, 1)
      if (!r.whole) continue
      const s = 1 - r.part.w / b0.part.w
      if (s > 0.05 && s < 0.95) draining++
      if (r.whole.arc) {
        expect(near(1 - r.whole.arc.span / b0.whole.arc.span, s, 0.03)).toBe(
          true,
        )
      }
      // the other rings stay as they were
      expect(byJ(fr.rings, 0).whole.d).toBe(byJ(before.rings, 0).whole.d)
    }
    expect(draining).toBeGreaterThan(5)
    const last = hide.probes[hide.probes.length - 1]
    expect(byJ(last.rings, 1).whole).toBe(null)
    expect(byJ(last.rings, 1).inner).toBe(null)
    // its track is whole again
    const plain = byJ(
      (await fresh(page, { highlightFilter: { data: null } })).rings,
      1,
    )
    expect(byJ(last.rings, 1).track.d).toBe(plain.track.d)
    expect(byJ(last.rings, 1).track.w).toBeCloseTo(plain.track.w, 6)
    expectNoViolations(finite(hide))
    const show = await recordTransition(
      page,
      () => page.locator('.apexcharts-legend-series[seriesName="B"]').click(),
      { probe: laneState },
    )
    const s0 = byJ(show.probes[0].rings, 1)
    expect(s0.part.w).toBe(0)
    const end = byJ(show.probes[show.probes.length - 1].rings, 1)
    expect(end.part.d).toBe(b0.part.d)
    expect(end.whole.d).toBe(b0.whole.d)
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter, lanes: the pointer and the centre', () => {
  for (const renderer of ['svg', 'canvas']) {
    test(`each lane shows its own row, and crossing the gap keeps the tooltip (${renderer})`, async ({
      page,
    }) => {
      const errors = await mount(
        page,
        dial({ chart: { renderer }, highlightFilter: { data: [40] } }),
      )
      await page.evaluate(() => {
        window.__left = 0
        window.chart.el
          .querySelector('.apexcharts-radialbar-slice-0')
          .addEventListener('mouseleave', () => window.__left++)
      })
      const part = await hoverAt(
        page,
        await page.evaluate(lanePoint, { i: 0, v: 20, lane: 'part' }),
      )
      expect(part.active).toBe(true)
      expect(part.text).toContain('40 / 70')
      const whole = await hoverAt(
        page,
        await page.evaluate(lanePoint, { i: 0, v: 20, lane: 'whole' }),
      )
      expect(whole.active).toBe(true)
      expect(whole.text).toContain('70 (part 40)')
      // On the whole lane past the part's end, still the whole's row.
      const past = await hoverAt(
        page,
        await page.evaluate(lanePoint, { i: 0, v: 55, lane: 'whole' }),
      )
      expect(past.text).toContain('70 (part 40)')
      // From the whole lane in to the part lane across the gap, a pixel at a
      // time: the tooltip never goes off, and the ring is never left.
      const a = await page.evaluate(lanePoint, { i: 0, v: 30, lane: 'whole' })
      const b = await page.evaluate(lanePoint, { i: 0, v: 30, lane: 'part' })
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2)
      const seen = new Set()
      for (let k = 0; k <= n; k++) {
        await page.mouse.move(
          a.x + ((b.x - a.x) * k) / n,
          a.y + ((b.y - a.y) * k) / n,
        )
        await advance(page, 16)
        const s = await page.evaluate(() => {
          const tip = window.chart.el.querySelector('.apexcharts-tooltip')
          return {
            active: tip.classList.contains('apexcharts-active'),
            text: tip.textContent,
          }
        })
        expect(s.active).toBe(true)
        seen.add(s.text.includes('(part 40)') ? 'whole' : 'part')
      }
      expect([...seen].sort()).toEqual(['part', 'whole'])
      expect(await page.evaluate(() => window.__left)).toBe(0)
      // The gap itself is on the ring.
      const gap = await page.evaluate(lanePoint, { i: 0, v: 30, lane: 'gap' })
      const under = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('class'),
        gap,
      )
      expect(under).toContain('apexcharts-radialbar-slice-0')
      expect(errors).toEqual([])
    })
  }

  test('a part past its whole is hovered as its ring, on the part lane past the whole', async ({
    page,
  }) => {
    const errors = await mount(page, dial({ highlightFilter: { data: [90] } }))
    const s = await hoverAt(
      page,
      await page.evaluate(lanePoint, { i: 0, v: 82, lane: 'part' }),
    )
    expect(s.active).toBe(true)
    expect(s.text).toContain('90 / 70')
    expect(errors).toEqual([])
  })

  for (const type of ['gauge', 'radialBar']) {
    test(`the centre's whole line sits clear under the value (${type})`, async ({
      page,
    }) => {
      const errors = await mount(
        page,
        dial({ chart: { type }, highlightFilter: { data: [40] } }),
      )
      const box = await page.evaluate(() => {
        const r = (s) => {
          const b = document.querySelector(s).getBoundingClientRect()
          return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }
        }
        return {
          value: r('.apexcharts-datalabel-value'),
          line: r('.apexcharts-datalabel-whole'),
          svg: r('.apexcharts-svg'),
          text: document.querySelector('.apexcharts-datalabel-whole')
            .textContent,
        }
      })
      expect(box.text).toBe('/ 70%')
      expect(box.line.top).toBeGreaterThanOrEqual(box.value.bottom - 2)
      expect(box.line.bottom).toBeLessThan(box.svg.bottom)
      // smaller than the value
      expect(box.line.bottom - box.line.top).toBeLessThan(
        box.value.bottom - box.value.top,
      )
      expect(errors).toEqual([])
    })
  }
})

test.describe('Highlight filter, lanes: the centre over time', () => {
  const lineOp = () => {
    const n = document.querySelector('.apexcharts-datalabel-whole')
    const ct = window.chart.w.globals.circleTween
    return {
      circling: !!ct && !ct.done,
      op: n
        ? (parseFloat(n.getAttribute('opacity') ?? '1') *
            parseFloat(n.getAttribute('fill-opacity') ?? '0.6')) /
          0.6
        : null,
    }
  }

  for (const mid of [false, true]) {
    test(`a circle moving under the whole line leaves it at full strength (${mid ? 'a title mid-pick' : 'a pick with a title'})`, async ({
      page,
    }) => {
      const errors = await mount(page, dial({ title: { text: 'All regions' } }))
      const rec = await recordTransition(
        page,
        async () => {
          if (mid) {
            await pick(page, [40])
            await advance(page, 130)
          }
          await page.evaluate((mid) => {
            window.chart.updateOptions({
              title: { text: 'Americas', style: { fontSize: '34px' } },
              ...(mid ? {} : { highlightFilter: { data: [40] } }),
            })
          }, mid)
        },
        { probe: lineOp, ms: 1500 },
      )
      expect(rec.probes.filter((fr) => fr.circling).length).toBeGreaterThan(5)
      // it rises and never drops back, landing with the circle and after it
      for (let k = 1; k < rec.probes.length; k++) {
        expect(rec.probes[k].op).toBeGreaterThanOrEqual(
          rec.probes[k - 1].op - 1e-6,
        )
      }
      expect(rec.probes[rec.probes.length - 1].op).toBe(1)
      await advance(page, 500)
      expect((await page.evaluate(lineOp)).op).toBe(1)
      expect(errors).toEqual([])
    })
  }

  test('a clear, or a part gone, holds the value on the part until the line has left', async ({
    page,
  }) => {
    const errors = await mount(page, dial({ highlightFilter: { data: [30] } }))
    await page.evaluate(() => window.chart.updateSeries([50]))
    await advance(page, 1500)
    for (const [data, held, after] of [
      [null, '30%', '50%'],
      [[40], null, '40%'],
      [[null], '40%', '50%'],
    ]) {
      const rec = await recordTransition(page, () => pick(page, data), {
        probe: laneState,
      })
      let leaving = 0
      for (const fr of rec.probes) {
        if (held && fr.line) {
          // never "50% / 50%": the value stays on the part it states the
          // whole of while the line fades
          expect(fr.centre).toBe(held)
          expect(fr.line.text).toBe('/ 50%')
          if (fr.line.op > 0.05 && fr.line.op < 0.95) leaving++
        } else expect(fr.centre).toBe(after)
      }
      if (held) expect(leaving).toBeGreaterThan(5)
      const last = rec.probes[rec.probes.length - 1]
      expect(last.centre).toBe(after)
      expect(last.line?.text ?? null).toBe(held ? null : '/ 50%')
      expectNoViolations(finite(rec))
      await advance(page, 500)
    }
    expect(errors).toEqual([])
  })

  for (const indicator of ['lanes', 'arc']) {
    test(`a dial morphing out under a pick starts from the screen: its part is the mark, the rest leaves as a ghost (${indicator})`, async ({
      page,
    }) => {
      const errors = await mount(
        page,
        dial({
          chart: {
            animations: {
              speed: 400,
              dynamicAnimation: { speed: 400 },
              chartTypeMorph: { enabled: true, speed: 500 },
            },
          },
          highlightFilter: { data: [40], radialBar: { indicator } },
        }),
      )
      // The part as a filled band, as the morph takes a ring, on screen.
      const was = await page.evaluate(() => {
        const p = document.querySelector('.apexcharts-radialbar-highlight-part')
        const g = window.chart.w.globals.circleGeometry
        const n = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        n.setAttribute(
          'd',
          window.chart.ctx.morphTypeChange._radialArcToFilledSegment(
            p.getAttribute('d'),
            +p.getAttribute('stroke-width'),
            g.cx,
            g.cy,
          ),
        )
        p.parentNode.appendChild(n)
        const b = n.getBoundingClientRect()
        n.remove()
        return [b.left, b.top, b.right, b.bottom]
      })
      const rec = await recordTransition(
        page,
        () =>
          page.evaluate(() =>
            window.chart.updateOptions({
              chart: { type: 'bar' },
              series: [{ name: 'Score', data: [70] }],
              xaxis: { categories: ['Score'] },
            }),
          ),
        {
          probe: () => {
            const bar = document.querySelector('#chart .apexcharts-bar-area')
            const g = document.querySelector('.apexcharts-morph-ghost')
            const b = bar?.getBoundingClientRect()
            const ring = g?.querySelector('.apexcharts-radialbar-area')
            return {
              bar: b ? [b.left, b.top, b.right, b.bottom] : null,
              ghost: !!g,
              wholeLane: g
                ? +(
                    g
                      .querySelector('.apexcharts-radialbar-highlight-whole')
                      ?.getAttribute('stroke-opacity') ?? -1
                  )
                : null,
              ring: ring ? +ring.getAttribute('stroke-opacity') : null,
              partInGhost: g
                ? g.querySelectorAll('.apexcharts-radialbar-highlight-part')
                    .length
                : null,
              tracks: g
                ? g.querySelectorAll('.apexcharts-tracks').length
                : null,
            }
          },
          ms: 1200,
        },
      )
      const f0 = rec.probes[0]
      // the incoming mark is the part on screen, where it was
      for (let k = 0; k < 4; k++)
        expect(near(f0.bar[k], was[k], 1.5)).toBe(true)
      // the rest of the pick's look is over it, as it was, and fades
      expect(f0.ghost).toBe(true)
      expect(f0.partInGhost).toBe(0)
      expect(f0.tracks).toBe(0)
      if (indicator === 'lanes') expect(f0.wholeLane).toBeCloseTo(0.45, 6)
      else expect(f0.ring).toBeCloseTo(0.2, 6)
      expect(rec.probes[rec.probes.length - 1].ghost).toBe(false)
      expect(errors).toEqual([])
    })
  }
})

test.describe('Highlight filter, rings: a morph out under a pick', () => {
  test('a ring with no part comes out of nothing; one with a part from it', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      rings({
        chart: {
          animations: {
            speed: 400,
            dynamicAnimation: { speed: 400 },
            chartTypeMorph: { enabled: true, speed: 500 },
          },
        },
        highlightFilter: { data: [40, null, 20] },
      }),
    )
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            chart: { type: 'bar' },
            series: [{ name: 'Score', data: [70, 50, 30] }],
            xaxis: { categories: ['A', 'B', 'C'] },
          }),
        ),
      {
        probe: () =>
          [...document.querySelectorAll('#chart .apexcharts-bar-area')].map(
            (n) => {
              const b = n.getBoundingClientRect()
              return { w: b.width, h: b.height }
            },
          ),
        ms: 1200,
      },
    )
    const [a, none, c] = rec.probes[0]
    expect(Math.min(none.w, none.h)).toBeLessThan(1.5)
    expect(Math.min(a.w, a.h)).toBeGreaterThan(10)
    expect(Math.min(c.w, c.h)).toBeGreaterThan(5)
    // and grows to its bar
    const end = rec.probes[rec.probes.length - 1][1]
    expect(end.h).toBeGreaterThan(50)
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter, gauge sample', () => {
  test('the sums share their tracks and fit inside; the averages split in lanes and add a needle; a clear lands plain', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'gauge-highlight')
    const read = () =>
      page.evaluate(() => {
        const of = (c) => ({
          lanes: c.el.querySelectorAll('.apexcharts-radialbar-highlight-lane')
            .length,
          parts: c.el.querySelectorAll('.apexcharts-radialbar-highlight-part')
            .length,
          ticks: c.el.querySelectorAll('.apexcharts-radialbar-highlight-edge')
            .length,
          over: c.el.querySelectorAll('.apexcharts-highlight-overflow').length,
          needle: !!c.el.querySelector('.apexcharts-gauge-needle-highlight'),
          centre: c.el.querySelector('.apexcharts-datalabel-value').textContent,
          line:
            c.el.querySelector('.apexcharts-datalabel-whole')?.textContent ??
            null,
        })
        const own = window.chart3.el.querySelector('.apexcharts-gauge-needle')
        return {
          shipped: of(window.chart),
          goals: of(window.chart1),
          satisfaction: of(window.chart2),
          sameDay: {
            ...of(window.chart3),
            own: parseFloat(own.getAttribute('opacity') ?? '1'),
          },
        }
      })
    const none = { lanes: 0, ticks: 0, over: 0, line: null }
    // Sums, on the default shared track: every part fits inside its whole
    // (no lanes, no tick, no overflow), for every region.
    const sums = {
      americas: { shipped: '4,100', goals: '30%' },
      europe: { shipped: '3,200', goals: '24%' },
      apac: { shipped: '2,000', goals: '17%' },
    }
    // Averages: the satisfaction gauge in lanes (Americas ahead, 84 of 78;
    // Asia Pacific behind) and the needle gauge's second needle.
    const averages = {
      americas: { satisfaction: '84%', over: 1, sameDay: '71%' },
      europe: { satisfaction: '71%', over: 0, sameDay: '58%' },
      apac: { satisfaction: '66%', over: 0, sameDay: '49%' },
    }
    for (const region of ['europe', 'apac', 'americas']) {
      await page.mouse.move(2, 2)
      await page.locator(`[data-region="${region}"]`).click()
      await advance(page, 1500)
      expect(await read()).toEqual({
        shipped: {
          ...none,
          parts: 1,
          needle: false,
          centre: sums[region].shipped,
        },
        goals: { ...none, parts: 3, needle: false, centre: sums[region].goals },
        satisfaction: {
          ...none,
          lanes: 2,
          parts: 1,
          over: averages[region].over,
          needle: false,
          centre: averages[region].satisfaction,
          line: 'company 78%',
        },
        sameDay: {
          ...none,
          parts: 0,
          needle: true,
          centre: averages[region].sameDay,
          own: 0.2,
        },
      })
    }
    // the shared track: the shipped gauge's whole faded, its part solid
    expect(
      await page.evaluate(() =>
        [
          window.chart.el.querySelector(
            '.apexcharts-radial-series .apexcharts-radialbar-area',
          ),
          window.chart.el.querySelector('.apexcharts-radialbar-highlight-part'),
        ].map((n) => n.getAttribute('stroke-opacity')),
      ),
    ).toEqual(['0.2', '1'])
    // the satisfaction gauge's tooltip reads the region on the inner lane,
    // the company on the outer one (it sits below the sums: scrolled to)
    await page.evaluate(() =>
      window.chart2.el.scrollIntoView({ block: 'center' }),
    )
    for (const [lane, text] of [
      ['part', '84 / 78'],
      ['whole', '78 (part 84)'],
    ]) {
      await page.mouse.move(2, 2)
      await advance(page, 300)
      const at = await page.evaluate(lanePoint, {
        i: 0,
        v: 40,
        lane,
        chart: 'chart2',
      })
      await page.mouse.move(at.x - 2, at.y - 2)
      await advance(page, 50)
      await page.mouse.move(at.x, at.y)
      await advance(page, 300)
      expect(
        await page.evaluate(
          () =>
            window.chart2.el.querySelector('.apexcharts-tooltip').textContent,
        ),
      ).toContain(text)
    }
    await page.mouse.move(2, 2)
    await page.locator('[data-region=""]').click()
    await advance(page, 1500)
    expect(await read()).toEqual({
      shipped: { ...none, parts: 0, needle: false, centre: '9,300' },
      goals: { ...none, parts: 0, needle: false, centre: '72%' },
      satisfaction: { ...none, parts: 0, needle: false, centre: '78%' },
      sameDay: { ...none, parts: 0, needle: false, centre: '64%', own: 1 },
    })
    expect(errors).toEqual([])
  })
})
