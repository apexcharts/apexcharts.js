/**
 * Highlight filter on lines and areas: the whole dashed (a line) or faded
 * with its outline (an area), the part solid in front, built by the renderer
 * from the part row.
 *
 * Runs samples/vanilla-js/highlight/line-highlight and area-highlight (and a
 * few bare charts) on virtual time, so every frame can be read. What jsdom
 * cannot see:
 *   - frame 0 of a pick is the chart as it was: each part starts on its
 *     whole's shape, with the whole hidden under it, then the part moves to
 *     its own shape while the whole takes its dash or its fade
 *   - re-picks, two updates in one frame and mid-flight re-picks start from
 *     the screen
 *   - a clear lands each part on its whole and leaves the plain chart, with
 *     nothing of the feature left on the marks
 *   - legend collapse, stacked areas, zoom, length changes, the fast path,
 *     the mount reveal and the label ride
 */

import { test, expect } from '@playwright/test'
import {
  BUNDLE,
  loadSample,
  recordTransition,
  settles,
  finite,
  noJump,
  vanishesOnLanding,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance, installVirtualTime } from '../helpers/virtual-time.js'

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

/**
 * Each series of the first chart on the page: its own marks and its parts,
 * with the attributes the feature writes, read in the page every frame.
 */
function lineState() {
  const root = document.querySelector('.apexcharts-canvas')
  const read = (n) => ({
    d: n.getAttribute('d') || '',
    fill: n.getAttribute('fill'),
    fo: n.getAttribute('fill-opacity'),
    so: n.getAttribute('stroke-opacity'),
    sw: n.getAttribute('stroke-width'),
    da: n.getAttribute('stroke-dasharray'),
  })
  return [...root.querySelectorAll('.apexcharts-series')].map((g) => ({
    name: g.getAttribute('seriesName'),
    own: [...g.children]
      .filter(
        (n) =>
          n.tagName.toLowerCase() === 'path' &&
          /apexcharts-(line|area)\b/.test(n.getAttribute('class') || ''),
      )
      .map(read),
    parts: [...g.querySelectorAll('.apexcharts-line-highlight-part')].map(read),
    labels: [...g.querySelectorAll('text.apexcharts-datalabel')].map((t) => {
      const b = t.getBoundingClientRect()
      return {
        text: t.textContent,
        x: b.x + b.width / 2,
        y: b.y + b.height / 2,
      }
    }),
  }))
}

/** Every number in a path, so two paths can be compared within a tolerance. */
const nums = (d) =>
  (String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number)
const samePath = (a, b, tol = TOL) => {
  const x = nums(a)
  const y = nums(b)
  return x.length === y.length && x.every((v, k) => Math.abs(v - y[k]) <= tol)
}

const pickCustomer = (page, c) =>
  page.evaluate((c) => window.pickCustomer(window.chart, c), c)
const pickSource = (page, s) => page.evaluate((s) => window.pickSource(s), s)

test.describe('Line highlight: pick, re-pick, clear', () => {
  test('a pick starts each part as its whole, which is hidden under it, then dashes it', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    await pickCustomer(page, '')
    await advance(page, 4000)
    const rec = await recordTransition(
      page,
      () => pickCustomer(page, 'first'),
      {
        probe: lineState,
      },
    )
    const before = rec.probeBefore
    const f0 = rec.probes[0]
    f0.forEach((s, i) => {
      expect(s.parts.length).toBe(1)
      // the part is the line on screen; the whole sits at 0 under it
      expect(samePath(s.parts[0].d, before[i].own[0].d)).toBe(true)
      expect(s.own[0].so).toBe('0')
    })
    // the whole comes back as the part leaves it, never ahead of it
    const ops = rec.probes.map((f) => parseFloat(f[0].own[0].so ?? '1'))
    ops.forEach(
      (o, k) => k && expect(o).toBeGreaterThanOrEqual(ops[k - 1] - 1e-6),
    )
    const last = rec.probes[rec.probes.length - 1]
    for (const s of last) {
      expect(s.own[0].so).toBe('1')
      expect(s.own[0].da).toBe('5')
    }
    expectNoViolations(finite(rec))
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('first') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a re-pick moves each part on from where it was; the whole stays dashed', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    const rec = await recordTransition(
      page,
      () => pickCustomer(page, 'first'),
      {
        probe: lineState,
      },
    )
    rec.probes[0].forEach((s, i) =>
      expect(samePath(s.parts[0].d, rec.probeBefore[i].parts[0].d)).toBe(true),
    )
    for (const f of rec.probes) {
      for (const s of f) {
        expect(s.own[0].da).toBe('5')
        expect(s.own[0].so).toBe('1')
      }
    }
    // it moves over several frames rather than landing at once
    const tops = rec.probes.map((f) => nums(f[0].parts[0].d)[1])
    expect(
      tops.some(
        (v) =>
          Math.abs(v - tops[0]) > 1 && Math.abs(v - tops[tops.length - 1]) > 1,
      ),
    ).toBe(true)
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('first') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a clear lands each part on its whole and leaves the plain chart', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    const rec = await recordTransition(page, () => pickCustomer(page, ''), {
      probe: lineState,
    })
    // the last frame with parts: each on its whole, the whole hidden under it
    let n = rec.probes.length - 1
    while (n > 0 && !rec.probes[n][0].parts.length) n--
    expect(n).toBeGreaterThan(2)
    rec.probes[n].forEach((s) => {
      expect(samePath(s.parts[0].d, s.own[0].d)).toBe(true)
      expect(parseFloat(s.own[0].so)).toBeLessThan(0.05)
    })
    // landed: the wholes carry exactly what a never-highlighted chart does
    const plain = await page.evaluate(async () => {
      const host = document.createElement('div')
      host.style.width = '720px'
      document.body.appendChild(host)
      const o = { ...window.chart.opts, series: window.seriesFor('') }
      o.chart = { ...o.chart, id: 'plain', animations: { enabled: false } }
      const c = new window.ApexCharts(host, o)
      await c.render()
      const out = [
        ...host.querySelectorAll('.apexcharts-series > .apexcharts-line'),
      ].map((p) =>
        [
          'fill-opacity',
          'stroke-opacity',
          'stroke-width',
          'stroke-dasharray',
        ].map((a) => p.getAttribute(a)),
      )
      c.destroy()
      host.remove()
      return out
    })
    const last = rec.probes[rec.probes.length - 1]
    expect(last.every((s) => s.parts.length === 0)).toBe(true)
    expect(
      last.map((s) => [s.own[0].fo, s.own[0].so, s.own[0].sw, s.own[0].da]),
    ).toEqual(plain)
    expect(await page.$$('.apexcharts-line-highlight-part')).toHaveLength(0)
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('two updates in one frame both start from the screen', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() => {
          window.pickCustomer(window.chart, 'first')
          window.pickCustomer(window.chart, 'returning')
        }),
      { probe: lineState },
    )
    rec.probes[0].forEach((s, i) => {
      expect(samePath(s.parts[0].d, rec.probeBefore[i].parts[0].d)).toBe(true)
      expect(s.own[0].so).toBe('1')
    })
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('returning') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a re-pick mid-flight starts from the screen', async ({ page }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    await pickCustomer(page, '')
    await advance(page, 4000)
    await pickCustomer(page, 'first')
    await advance(page, 150)
    const screen = await page.evaluate(lineState)
    // mid-flight: the wholes on their way back in
    expect(parseFloat(screen[0].own[0].so)).toBeGreaterThan(0.05)
    expect(parseFloat(screen[0].own[0].so)).toBeLessThan(0.95)
    const rec = await recordTransition(
      page,
      () => pickCustomer(page, 'returning'),
      {
        probe: lineState,
      },
    )
    rec.probes[0].forEach((s, i) => {
      expect(samePath(s.parts[0].d, screen[i].parts[0].d)).toBe(true)
      expect(
        Math.abs(parseFloat(s.own[0].so) - parseFloat(screen[i].own[0].so)),
      ).toBeLessThan(0.02)
    })
    expect(errors).toEqual([])
  })

  test('a re-pick in the middle of a clear starts from the screen', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    await pickCustomer(page, '')
    await advance(page, 150)
    const screen = await page.evaluate(lineState)
    // the clear is under way: parts on their way back into the wholes
    expect(screen[0].parts.length).toBe(1)
    const rec = await recordTransition(
      page,
      () => pickCustomer(page, 'first'),
      {
        probe: lineState,
      },
    )
    rec.probes[0].forEach((s, i) => {
      expect(samePath(s.parts[0].d, screen[i].parts[0].d)).toBe(true)
      expect(
        Math.abs(parseFloat(s.own[0].so) - parseFloat(screen[i].own[0].so)),
      ).toBeLessThan(0.02)
    })
    const last = rec.probes[rec.probes.length - 1]
    for (const s of last) expect(s.own[0].so).toBe('1')
    expect(errors).toEqual([])
  })

  test('a clear that has landed leaves nothing for the next update to start from', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    await pickCustomer(page, '')
    await advance(page, 4000)
    const left = await page.evaluate(() => {
      window.chart.updateSeries(
        window
          .seriesFor('')
          .map((s) => ({ ...s, data: s.data.map((v) => v + 5) })),
      )
      return window.chart.w.globals.prevHighlightParts.size
    })
    expect(left).toBe(0)
    expect(errors).toEqual([])
  })

  test('a same-count re-pick takes the fast path and animates', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    const fast0 = await page.evaluate(
      () => window.chart._updateStats?.fast ?? 0,
    )
    const rec = await recordTransition(
      page,
      () => pickCustomer(page, 'first'),
      {
        probe: lineState,
      },
    )
    const fast1 = await page.evaluate(
      () => window.chart._updateStats?.fast ?? 0,
    )
    expect(fast1).toBeGreaterThan(fast0)
    const tops = rec.probes.map((f) => nums(f[0].parts[0].d)[1])
    expect(new Set(tops.map((v) => v.toFixed(1))).size).toBeGreaterThan(3)
    expect(errors).toEqual([])
  })
})

test.describe('Line highlight: labels and markers', () => {
  test('part labels ride from the whole labels on a pick and back on a clear', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    await pickCustomer(page, '')
    await advance(page, 4000)
    const rec = await recordTransition(
      page,
      () => pickCustomer(page, 'first'),
      {
        probe: lineState,
      },
    )
    const near = (a, b) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2
    // frame 0: the part's labels stand where the whole's were (the text has
    // already changed); they then ride to the part's points
    rec.probes[0].forEach((s, i) => {
      expect(s.labels.length).toBe(rec.probeBefore[i].labels.length)
      s.labels.forEach((l, k) =>
        expect(near(l, rec.probeBefore[i].labels[k])).toBe(true),
      )
      expect(s.labels[0].text).not.toBe(rec.probeBefore[i].labels[0].text)
    })
    const last = rec.probes[rec.probes.length - 1]
    const ys = rec.probes.map((f) => f[0].labels[3].y)
    expect(ys.some((y) => y > ys[0] + 2 && y < ys[ys.length - 1] - 2)).toBe(
      true,
    )
    // and a clear rides the whole's labels back from the part's
    const back = await recordTransition(page, () => pickCustomer(page, ''), {
      probe: lineState,
    })
    back.probes[0].forEach((s, i) =>
      s.labels.forEach((l, k) => expect(near(l, last[i].labels[k])).toBe(true)),
    )
    expect(errors).toEqual([])
  })

  test('the markers stay on the whole line, and the tooltip lists each part', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    const onWhole = await page.evaluate(() => {
      const xs = window.chart.w.globals.seriesYvalues[0]
      const ms = [
        ...document.querySelectorAll('.apexcharts-series-markers-wrap'),
      ][0]
      return [...ms.querySelectorAll('.apexcharts-marker')].map((m, k) =>
        Math.abs(parseFloat(m.getAttribute('cy')) - xs[k]),
      )
    })
    for (const d of onWhole) expect(d).toBeLessThan(TOL)
    const box = await page
      .locator('.apexcharts-series > .apexcharts-line')
      .first()
      .boundingBox()
    await page.mouse.move(box.x + box.width * 0.43, box.y + box.height / 2)
    await advance(page, 400)
    const rows = await page.$$eval('.apexcharts-tooltip-series-group', (gs) =>
      gs
        .filter((g) => getComputedStyle(g).display !== 'none')
        .map((g) => ({
          name: g.querySelector('.apexcharts-tooltip-text-y-label')
            ?.textContent,
          value: g.querySelector('.apexcharts-tooltip-text-y-value')
            ?.textContent,
        })),
    )
    // Apr: online 290 returning, retail 240, each against its whole
    expect(rows.map((r) => r.name)).toEqual(['Online store: ', 'Retail: '])
    expect(rows[0].value).toMatch(/^290 \/ \d+$/)
    expect(rows[1].value).toMatch(/^240 \/ \d+$/)
    expect(errors).toEqual([])
  })
})

test.describe('Line highlight: legend, zoom, length changes, mount', () => {
  test('hiding a highlighted series flattens its part with it; showing it raises both', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'line-highlight')
    const hide = await recordTransition(
      page,
      () =>
        page.locator('.apexcharts-legend-text', { hasText: 'Retail' }).click(),
      { probe: lineState },
    )
    expectNoViolations(vanishesOnLanding(hide, 'Retail'))
    // on every frame the part lies on the whole as it flattens
    const n = hide.probes.findIndex(
      (f) => f[1].parts[0] && samePath(f[1].parts[0].d, f[1].own[0].d, 0.5),
    )
    expect(n).toBeGreaterThan(-1)
    const show = await recordTransition(
      page,
      () =>
        page.locator('.apexcharts-legend-text', { hasText: 'Retail' }).click(),
      { probe: lineState },
    )
    expectNoViolations(finite(show))
    expectNoViolations(noJump(show))
    const last = show.probes[show.probes.length - 1]
    expect(last[1].parts.length).toBe(1)
    expectNoViolations(await settles(page, show))
    expect(errors).toEqual([])
  })

  test('a zoom keeps each part on its whole, on the same clock', async ({
    page,
  }) => {
    const T0 = Date.UTC(2026, 0, 1)
    const DAY = 864e5
    const errors = await mount(page, {
      chart: {
        type: 'line',
        height: 320,
        zoom: { enabled: true, autoScaleYaxis: true },
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'A',
          data: [10, 14, 12, 18, 30, 26, 34, 40].map((y, k) => ({
            x: T0 + k * DAY,
            y,
          })),
          highlightData: [4, 6, 5, 9, 14, 12, 16, 20],
        },
      ],
    })
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(
          ([t, day]) => window.chart.zoomX(t + day, t + 4 * day),
          [T0, DAY],
        ),
      { probe: lineState },
    )
    expectNoViolations(finite(rec))
    expectNoViolations(noJump(rec))
    const last = rec.probes[rec.probes.length - 1][0]
    const xs = (d) => nums(d).filter((_, k) => k % 2 === 0)
    expect(xs(last.parts[0].d)).toEqual(xs(last.own[0].d))
    // the axis covers the parts in view only
    expect(await page.evaluate(() => window.chart.w.globals.maxY)).toBeLessThan(
      40,
    )
    expect(errors).toEqual([])
  })

  test('points leaving and arriving under a pick: the part follows its whole', async ({
    page,
  }) => {
    const options = {
      chart: { type: 'area', height: 320, toolbar: { show: false } },
      stroke: { curve: 'straight' },
      dataLabels: { enabled: false },
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
      series: [
        {
          name: 'A',
          data: [10, 20, 15, 25, 30],
          highlightData: [5, 8, 6, 12, 14],
        },
      ],
    }
    const errors = await mount(page, options)
    const rec = await recordTransition(
      page,
      () =>
        page.evaluate(() =>
          window.chart.updateOptions({
            xaxis: { categories: ['b', 'c', 'd', 'e', 'f'] },
            series: [
              {
                name: 'A',
                data: [20, 15, 25, 30, 22],
                highlightData: [8, 6, 12, 14, 10],
              },
            ],
          }),
        ),
      { probe: lineState },
    )
    expectNoViolations(finite(rec))
    const last = rec.probes[rec.probes.length - 1][0]
    expect(last.parts.length).toBe(2)
    // the part's fill closes on its whole's baseline and spans its x
    const xs = (d) => nums(d).filter((_, k) => k % 2 === 0)
    expect(Math.min(...xs(last.parts[0].d))).toBeCloseTo(
      Math.min(...xs(last.own[0].d)),
      1,
    )
    expect(Math.max(...xs(last.parts[0].d))).toBeCloseTo(
      Math.max(...xs(last.own[0].d)),
      1,
    )
    await page.evaluate(
      (o) => (window.__opts0 = window.__frameLib.clone(o)),
      options,
    )
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({
          xaxis: { categories: ['b', 'c', 'd', 'e', 'f'] },
          series: [
            {
              name: 'A',
              data: [20, 15, 25, 30, 22],
              highlightData: [8, 6, 12, 14, 10],
            },
          ],
        }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a mount reveals the dashed whole and the solid part with one wipe', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      {
        chart: { type: 'line', height: 320, toolbar: { show: false } },
        stroke: { curve: 'smooth' },
        dataLabels: { enabled: false },
        xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
        series: [
          {
            name: 'A',
            data: [10, 30, 15, 35, 20],
            highlightData: [5, 12, 9, 14, 8],
          },
        ],
      },
      { settleMs: 0 },
    )
    const widths = () =>
      page.evaluate(() => {
        const w = (p) => {
          const m = /url\(#([^)]+)\)/.exec(p?.getAttribute('mask') || '')
          const r = m && document.getElementById(m[1])?.querySelector('rect')
          return r ? parseFloat(r.getAttribute('width')) : null
        }
        return [
          w(document.querySelector('.apexcharts-series > .apexcharts-line')),
          w(document.querySelector('.apexcharts-line-highlight-part')),
        ]
      })
    let seen = 0
    for (let k = 0; k < 60; k++) {
      await advance(page, 16)
      const [a, b] = await widths()
      if (a == null && b == null) continue
      seen++
      expect(a).not.toBeNull()
      expect(Math.abs(a - b)).toBeLessThan(0.01)
    }
    expect(seen).toBeGreaterThan(10)
    expect(errors).toEqual([])
  })
})

test.describe('Area highlight', () => {
  test('a pick: frame 0 is the chart as it was, the wholes then fade with their outline', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'area-highlight')
    await pickSource(page, '')
    await advance(page, 4000)
    const rec = await recordTransition(page, () => pickSource(page, 'social'), {
      probe: lineState,
    })
    rec.probes[0].forEach((s, i) => {
      // [fill, stroke] for the whole and for the part
      expect(s.parts.length).toBe(2)
      expect(samePath(s.parts[0].d, rec.probeBefore[i].own[0].d)).toBe(true)
      expect(samePath(s.parts[1].d, rec.probeBefore[i].own[1].d)).toBe(true)
      expect(s.own[0].fo).toBe('0')
      expect(s.own[1].so).toBe('0')
    })
    const last = rec.probes[rec.probes.length - 1]
    for (const s of last) {
      expect(s.own[0].fo).toBe('0.2')
      expect(s.own[1].sw).toBe('1')
      expect(s.own[1].so).toBe('1')
    }
    expectNoViolations(finite(rec))
    expect(errors).toEqual([])
  })

  test('a clear lands on the plain areas', async ({ page }) => {
    const errors = await loadSample(page, 'highlight', 'area-highlight')
    const rec = await recordTransition(page, () => pickSource(page, ''), {
      probe: lineState,
    })
    const last = rec.probes[rec.probes.length - 1]
    for (const s of last) {
      expect(s.parts.length).toBe(0)
      expect(s.own[0].fo).toBe('1')
      expect(s.own[1].sw).toBe('2')
      expect(s.own[1].so).toBe('1')
    }
    expect(errors).toEqual([])
  })

  // (The demo page holds two charts with the same series names, which the
  // fresh-render comparison cannot tell apart, so it runs on a bare chart.)
  test('a pick and a clear each rest where a fresh render of their target does', async ({
    page,
  }) => {
    const rows = [
      [31, 40, 28, 51, 42, 60],
      [11, 32, 45, 32, 34, 52],
    ]
    const parts = [
      [12, 22, 10, 30, 21, 33],
      [6, 12, null, 14, 20, 25],
    ]
    const series = (on) =>
      rows.map((data, i) => ({
        name: 'S' + i,
        data,
        ...(on ? { highlightData: parts[i] } : {}),
      }))
    const options = {
      chart: { type: 'area', height: 320, toolbar: { show: false } },
      stroke: { curve: 'smooth' },
      dataLabels: { enabled: true },
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
      series: series(false),
    }
    const errors = await mount(page, options)
    for (const on of [true, false]) {
      const rec = await recordTransition(
        page,
        () => page.evaluate((s) => window.chart.updateSeries(s), series(on)),
        { probe: lineState },
      )
      expectNoViolations(finite(rec))
      expectNoViolations(noJump(rec))
      await page.evaluate(
        ([o, s]) =>
          (window.__opts0 = window.__frameLib.clone({ ...o, series: s })),
        [options, series(on)],
      )
      expectNoViolations(await settles(page, rec))
    }
    expect(errors).toEqual([])
  })

  /** The stacked chart's part fills, each as its tops (one y per point). */
  function stackedTops() {
    const root = document.querySelectorAll('.apexcharts-canvas')[1]
    const top = (d) => {
      const n = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
      const pts = []
      for (let k = 0; k + 1 < n.length; k += 2) pts.push([n[k], n[k + 1]])
      // the fill walks the top left to right, then closes along the base
      return pts.slice(0, 7).map((p) => p[1])
    }
    return [...root.querySelectorAll('.apexcharts-series')].map((g) => ({
      name: g.getAttribute('seriesName'),
      parts: [...g.querySelectorAll('.apexcharts-line-highlight-part')]
        .filter((p) => p.getAttribute('fill') !== 'none')
        .map((p) => top(p.getAttribute('d') || '')),
    }))
  }

  test('stacked: the part stack moves on one clock and stays a stack', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'area-highlight')
    await pickSource(page, '')
    await advance(page, 4000)
    const rec = await recordTransition(page, () => pickSource(page, 'social'), {
      probe: stackedTops,
    })
    // frame 0: each part is its whole on screen (the whole stack)
    const wholeTops = await page.evaluate(() => {
      const root = document.querySelectorAll('.apexcharts-canvas')[1]
      return [...root.querySelectorAll('.apexcharts-series')].map((g) => {
        const d = g
          .querySelector(':scope > .apexcharts-area')
          .getAttribute('pathFrom')
        const n = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number)
        return n.filter((_, k) => k % 2).slice(0, 7)
      })
    })
    rec.probes[0].forEach((s, i) =>
      s.parts[0].forEach((y, k) =>
        expect(Math.abs(y - wholeTops[i][k])).toBeLessThan(TOL),
      ),
    )
    // series are drawn last to first: Blog, Docs
    for (const f of rec.probes) {
      const by = Object.fromEntries(f.map((s) => [s.name, s.parts[0]]))
      // every frame: each part's top sits above the one below it, never under
      by.Blog.forEach((y, k) => expect(y).toBeLessThanOrEqual(by.Docs[k] + 0.5))
    }
    expect(errors).toEqual([])
  })

  test('stacked: hiding the bottom series flattens its part, the parts above slide down', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'area-highlight')
    const rec = await recordTransition(
      page,
      () =>
        page
          .locator('.apexcharts-legend-text', { hasText: 'Docs' })
          .nth(1)
          .click(),
      { probe: stackedTops },
    )
    const tops = rec.probes.map(
      (f) => f.find((s) => s.name === 'Blog').parts[0][0],
    )
    // the Blog part slides down over several frames, without a jump
    const travel = Math.abs(tops[tops.length - 1] - tops[0])
    expect(travel).toBeGreaterThan(10)
    tops.forEach(
      (y, k) =>
        k && expect(Math.abs(y - tops[k - 1])).toBeLessThan(0.6 * travel),
    )
    expect(errors).toEqual([])
  })
})

/**
 * Every data label of the first chart (or of `sel`), per series: where it is
 * drawn in the plot's own space (its x/y plus any translate it carries), its
 * painted opacity, and its transform.
 */
function labelProbe(sel) {
  const root = document.querySelector(sel || '.apexcharts-canvas')
  const shift = (el) => {
    let x = 0
    let y = 0
    const re = /translate\(\s*(-?[\d.e-]+)[\s,]+(-?[\d.e-]+)\s*\)/g
    let m
    while ((m = re.exec(el.getAttribute('transform') || ''))) {
      x += parseFloat(m[1])
      y += parseFloat(m[2])
    }
    return [x, y]
  }
  const painted = (el) => {
    let o = 1
    for (let n = el; n && n !== root; n = n.parentElement) {
      o *= parseFloat(getComputedStyle(n).opacity)
    }
    return o
  }
  return [...root.querySelectorAll('.apexcharts-series')].map((g) => {
    const whole =
      g.querySelector(':scope > .apexcharts-line') ||
      g.querySelector(':scope > .apexcharts-area')
    return {
      name: g.getAttribute('seriesName'),
      d: whole ? whole.getAttribute('d') || '' : '',
      // (the label pass lifts each series' labels above every series)
      labels: [
        ...root.querySelectorAll(
          `.apexcharts-datalabels[data\\:realIndex="${g.getAttribute('data:realIndex')}"] text`,
        ),
      ].map((t) => {
        const [dx, dy] = shift(t)
        return {
          text: t.textContent,
          x: parseFloat(t.getAttribute('x')) + dx,
          y: parseFloat(t.getAttribute('y')) + dy,
          op: painted(t),
          tf: t.getAttribute('transform'),
        }
      }),
    }
  })
}

/**
 * Where two readings of the labels disagree: every label painted in one is
 * painted at the same place (within `tol`) and about as strongly in the other.
 */
function labelsDiffer(a, b, { tol = 1, what = 'frame 0' } = {}) {
  const out = []
  const seen = (s) => s.labels.filter((l) => l.op > 0.05)
  a.forEach((s, i) => {
    const want = seen(b[i])
    const got = seen(s)
    if (got.length !== want.length) {
      out.push(
        `${s.name}: ${got.length} labels painted at ${what}, ${want.length} on screen`,
      )
    }
    got.forEach((l) => {
      const m = want
        .map((w) => [w, Math.hypot(w.x - l.x, w.y - l.y)])
        .sort((p, q) => p[1] - q[1])[0]
      if (!m || m[1] > tol || Math.abs(m[0].op - l.op) > 0.1) {
        out.push(
          `${s.name}: label ${l.text} at (${l.x.toFixed(1)}, ${l.y.toFixed(1)}) op ${l.op.toFixed(2)} has no match` +
            (m
              ? ` (nearest ${m[0].text} at (${m[0].x.toFixed(1)}, ${m[0].y.toFixed(1)}) op ${m[0].op.toFixed(2)})`
              : ''),
        )
      }
    })
  })
  return out
}

/** The labels a fresh render of `options` (animations off) draws. */
async function freshLabels(page, options) {
  return page.evaluate(
    async ([o, src]) => {
      const host = document.createElement('div')
      host.id = '__freshLabels'
      host.style.width = '720px'
      document.body.appendChild(host)
      o.chart = { ...o.chart, id: 'fresh', animations: { enabled: false } }
      const c = new window.ApexCharts(host, o)
      c.render()
      await window.__vt.advance(500)
      const out = (0, eval)(`(${src})`)('#__freshLabels .apexcharts-canvas')
      c.destroy()
      host.remove()
      return out
    },
    [options, labelProbe.toString()],
  )
}

test.describe('Line highlight: labels start where they are drawn', () => {
  const two = (on, bump = 0) => [
    {
      name: 'A',
      data: [12, 18, 9, 22, 15, 17],
      ...(on
        ? { highlightData: [6, 9, 3, 10, 7, 8].map((v) => v + bump) }
        : {}),
    },
    {
      name: 'B',
      data: [5, 9, 14, 8, 11, 6],
      ...(on
        ? { highlightData: [2, 4, null, 3, 5, 1].map((v) => v && v + bump) }
        : {}),
    },
  ]
  const base = (type, stacked = false) => ({
    chart: { type, stacked, height: 320, toolbar: { show: false } },
    legend: { show: true },
    dataLabels: { enabled: true },
    xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
  })

  for (const [name, type, stacked] of [
    ['line', 'line', false],
    ['area', 'area', false],
    ['stacked area', 'area', true],
  ]) {
    test(`${name}: showing a hidden series under a pick rises its part labels and lands them clean`, async ({
      page,
    }) => {
      const options = { ...base(type, stacked), series: two(true) }
      const errors = await mount(page, options)
      const legend = page.locator('.apexcharts-legend-text', { hasText: 'B' })
      await legend.click()
      await advance(page, 4000)
      const rec = await recordTransition(page, () => legend.click(), {
        probe: labelProbe,
      })
      const pts = (d) => {
        const n = (String(d).match(/-?\d+(\.\d+)?(e-?\d+)?/g) || []).map(Number)
        const ys = n.filter((_, k) => k % 2)
        return { lo: Math.min(...ys), hi: Math.max(...ys) }
      }
      // frame 0: B's labels come in from its hidden shape, unpainted, never
      // from below it
      // (a stack draws its series last to first)
      const B = (f) => f.find((s) => s.name === 'B')
      const f0 = B(rec.probes[0])
      expect(f0.labels.length).toBe(5)
      const shape = pts(f0.d)
      for (const l of f0.labels) {
        expect(l.op).toBeLessThan(0.05)
        expect(l.y).toBeLessThanOrEqual(shape.hi + 2)
      }
      // at rest: where a fresh render puts them, with nothing left on them
      const last = rec.probes[rec.probes.length - 1]
      const fresh = await freshLabels(page, options)
      expect(B(last).labels.every((l) => l.tf == null)).toBe(true)
      expectNoViolations(labelsDiffer(last, fresh, { what: 'rest' }))
      expect(errors).toEqual([])
    })
  }

  test('labels the overlap pass moved ride from where they were drawn, both ways', async ({
    page,
  }) => {
    const rows = (on) => [
      {
        name: 'A',
        data: [10, 12, 11, 13, 12, 14],
        ...(on ? { highlightData: [5, 6, 5, 7, 6, 7] } : {}),
      },
      {
        name: 'B',
        data: [11, 12, 12, 12, 13, 13],
        ...(on ? { highlightData: [6, 6, 6, 6, 7, 7] } : {}),
      },
    ]
    const options = { ...base('line'), series: rows(false) }
    const errors = await mount(page, options)
    for (const on of [true, false]) {
      const rec = await recordTransition(
        page,
        () => page.evaluate((s) => window.chart.updateSeries(s), rows(on)),
        { probe: labelProbe },
      )
      expectNoViolations(labelsDiffer(rec.probes[0], rec.probeBefore))
      const fresh = await freshLabels(page, { ...options, series: rows(on) })
      expectNoViolations(
        labelsDiffer(rec.probes[rec.probes.length - 1], fresh, {
          what: 'rest',
        }),
      )
    }
    expect(errors).toEqual([])
  })

  test('stacked area: every pick starts its labels on the screen', async ({
    page,
  }) => {
    const three = (bump) => [
      {
        name: 'A',
        data: [30, 40, 35, 50, 49, 60],
        ...(bump == null
          ? {}
          : { highlightData: [10, 15, 12, 20, 18, 25].map((v) => v + bump) }),
      },
      {
        name: 'B',
        data: [20, 25, 22, 30, 28, 26],
        ...(bump == null
          ? {}
          : { highlightData: [8, 10, 9, 12, 11, 10].map((v) => v + bump) }),
      },
      {
        name: 'C',
        data: [15, 18, 20, 16, 22, 24],
        ...(bump == null
          ? {}
          : { highlightData: [5, 7, 8, 6, 9, 10].map((v) => v + bump) }),
      },
    ]
    const options = { ...base('area', true), series: three(null) }
    const errors = await mount(page, options)
    const update = (bump) =>
      page.evaluate((s) => window.chart.updateSeries(s), three(bump))
    // a pick, a re-pick, a re-pick mid-flight, two in one frame, a clear
    const steps = [
      [null, () => update(0)],
      [null, () => update(4)],
      [
        async () => {
          await update(-2)
          await advance(page, 150)
        },
        () => update(3),
      ],
      [
        null,
        () =>
          page.evaluate(
            ([a, b]) => {
              window.chart.updateSeries(a)
              window.chart.updateSeries(b)
            },
            [three(1), three(5)],
          ),
      ],
      [null, () => update(null)],
    ]
    for (const [prep, step] of steps) {
      if (prep) await prep()
      const rec = await recordTransition(page, step, { probe: labelProbe })
      expectNoViolations(labelsDiffer(rec.probes[0], rec.probeBefore))
    }
    expect(errors).toEqual([])
  })

  test('a label whose part is null fades in on a clear and out on a pick', async ({
    page,
  }) => {
    const options = { ...base('line'), series: two(false) }
    const errors = await mount(page, options)
    for (const on of [true, false]) {
      const rec = await recordTransition(
        page,
        () => page.evaluate((s) => window.chart.updateSeries(s), two(on)),
        { probe: labelProbe },
      )
      expectNoViolations(labelsDiffer(rec.probes[0], rec.probeBefore))
      // the label at the null part ('14') goes or comes over several frames
      const ops = rec.probes.map(
        (f) => f[1].labels.find((l) => l.text === '14')?.op ?? 0,
      )
      expect(ops.some((o) => o > 0.1 && o < 0.9)).toBe(true)
      expect(ops[ops.length - 1]).toBe(on ? 0 : 1)
      await advance(page, 2000)
      expect(await page.$$('.apexcharts-highlight-label-exit')).toHaveLength(0)
    }
    // caught halfway out by a clear, it comes back from where it got to
    await page.evaluate((s) => window.chart.updateSeries(s), two(true))
    await advance(page, 150)
    const back = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), two(false)),
      { probe: labelProbe },
    )
    const half = back.probeBefore[1].labels.find((l) => l.text === '14')
    expect(half.op).toBeGreaterThan(0.1)
    expect(half.op).toBeLessThan(0.9)
    expectNoViolations(labelsDiffer(back.probes[0], back.probeBefore))
    await advance(page, 2000)
    expect(await page.$$('.apexcharts-highlight-label-exit')).toHaveLength(0)
    expect(errors).toEqual([])
  })
})

test.describe('Line highlight: the whole moves on from the screen', () => {
  test('a re-pick mid-flight that moves the axis starts the wholes where they are', async ({
    page,
  }) => {
    const rows = (bump) => [
      {
        name: 'A',
        data: [12, 18, 9, 22, 15, 17],
        ...(bump == null
          ? {}
          : { highlightData: [6, 9, 3, 10, 7, 8].map((v) => v + bump) }),
      },
      {
        name: 'B',
        data: [5, 9, 14, 8, 11, 6],
        ...(bump == null
          ? {}
          : {
              highlightData: [2, 4, null, 3, 5, 1].map((v) => v && v + bump),
            }),
      },
    ]
    const errors = await mount(page, {
      chart: { type: 'line', height: 320, toolbar: { show: false } },
      dataLabels: { enabled: false },
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
      series: rows(null),
    })
    await page.evaluate((s) => window.chart.updateSeries(s), rows(0))
    await advance(page, 200)
    const rec = await recordTransition(
      page,
      () => page.evaluate((s) => window.chart.updateSeries(s), rows(2)),
      { probe: lineState },
    )
    rec.probes[0].forEach((s, i) => {
      expect(samePath(s.own[0].d, rec.probeBefore[i].own[0].d)).toBe(true)
      expect(samePath(s.parts[0].d, rec.probeBefore[i].parts[0].d)).toBe(true)
    })
    expectNoViolations(noJump(rec))
    expect(errors).toEqual([])
  })
})
