/**
 * Highlight filter: each value drawn faded with a part of it solid in front.
 *
 * Runs the samples in samples/vanilla-js/highlight on virtual time, so every
 * frame of a pick, a re-pick and a clear can be read. What jsdom cannot see:
 *   - frame 0 of a pick is the chart as it was (the parts start as their
 *     wholes, which sit at 0 under them), and the parts then drain to their
 *     size while the wholes fade in to the tint
 *   - a clear lands each part on its whole, at 0 under it, so the last frame
 *     with parts already looks like the plain chart
 *   - a re-pick starts each part where the last one left it
 *   - a clear grows the parts back into the wholes and lands on the plain chart
 *   - every transition rests exactly where a fresh render of its target would
 *   - the tooltip row, the legend toggle and the dashboard pick
 */

import { test, expect } from '@playwright/test'
import {
  loadSample,
  recordTransition,
  settles,
  finite,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

/** Wholes (opacity + box) and parts (box) on screen, read in the page. */
function highlightState() {
  const box = (el) => {
    const b = el.getBBox()
    return [b.x, b.y, b.width, b.height]
  }
  const wholes = [
    ...document.querySelectorAll('.apexcharts-series > .apexcharts-bar-area'),
  ].map((el) => ({
    op: parseFloat(el.getAttribute('fill-opacity') ?? '1'),
    box: box(el),
  }))
  const parts = [
    ...document.querySelectorAll('.apexcharts-bar-highlight-part'),
  ].map(box)
  return { wholes, parts }
}

const close = (a, b, tol = 1.5) => a.every((v, i) => Math.abs(v - b[i]) <= tol)

async function clickChannel(page, channel) {
  await page.locator(`[data-channel="${channel}"]`).click()
}

test.describe('Highlight filter: pick, re-pick, clear', () => {
  test('a pick starts from the screen and drains the parts to size', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    await clickChannel(page, '')
    await advance(page, 4000)

    const rec = await recordTransition(page, () => clickChannel(page, 'online'), {
      probe: highlightState,
    })
    const f0 = rec.probes[0]
    // Frame 0: each part exactly over its whole, the whole at 0 under it
    // (the part has the whole's own translucent paint, so the pair would
    // read darker than the screen).
    for (const w of f0.wholes) expect(w.op).toBeLessThan(0.01)
    expect(f0.parts.length).toBe(24)
    for (const p of f0.parts) {
      expect(f0.wholes.some((w) => close(w.box, p))).toBe(true)
    }
    // Rest: wholes faded, parts at their own size.
    const last = rec.probes[rec.probes.length - 1]
    for (const w of last.wholes) expect(w.op).toBeCloseTo(0.2, 2)
    expectNoViolations(finite(rec))
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('online') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a re-pick starts every part where the last one left it', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    const before = await page.evaluate(highlightState)
    const rec = await recordTransition(page, () => clickChannel(page, 'store'), {
      probe: highlightState,
    })
    const f0 = rec.probes[0]
    expect(f0.parts.length).toBe(before.parts.length)
    for (const p of before.parts) {
      expect(f0.parts.some((q) => close(q, p))).toBe(true)
    }
    // The wholes were faded and stay faded throughout.
    for (const fr of rec.probes) {
      for (const w of fr.wholes) expect(w.op).toBeCloseTo(0.2, 2)
    }
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('store') }),
      }),
    )
    expect(errors).toEqual([])
  })

  test('a clear grows the parts into the wholes and lands on the plain chart', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    const before = await page.evaluate(highlightState)
    const rec = await recordTransition(page, () => clickChannel(page, ''), {
      probe: highlightState,
    })
    const f0 = rec.probes[0]
    // Frame 0 is what was on screen: faded wholes, parts at their size.
    for (const w of f0.wholes) expect(w.op).toBeLessThan(0.21)
    for (const p of before.parts) {
      expect(f0.parts.some((q) => close(q, p))).toBe(true)
    }
    // The last frame is the plain chart: no parts, opaque wholes.
    const last = rec.probes[rec.probes.length - 1]
    expect(last.parts.length).toBe(0)
    for (const w of last.wholes) expect(w.op).toBeGreaterThan(0.99)
    const legend = await page.$$eval('.apexcharts-legend-text', (ns) =>
      ns.map((n) => n.textContent),
    )
    expect(legend).toEqual(['Americas', 'Europe', 'Asia Pacific'])
    expectNoViolations(
      await settles(page, rec, {
        transform: () => ({ series: window.seriesFor('') }),
      }),
    )
    expect(errors).toEqual([])
  })
})

/**
 * How opaque the chart is inside each part, read in the page: the part's own
 * alpha over its whole's, composited. Also the plain alpha of the whole's
 * paint (what the screen shows without a pick), and each whole's stroke.
 */
function composite() {
  const alpha = (paint) => {
    const m = /rgba?\(([^)]*)\)/.exec(paint || '')
    if (!m) return 1
    const c = m[1].split(',').map(Number)
    return c.length > 3 ? c[3] : 1
  }
  const op = (el) => parseFloat(el.getAttribute('fill-opacity') ?? '1')
  const wholes = [
    ...document.querySelectorAll('.apexcharts-series > .apexcharts-bar-area'),
  ]
  const at = (el) => el.getAttribute('index') + '|' + el.getAttribute('j')
  const byDatum = new Map(wholes.map((w) => [at(w), w]))
  const parts = [
    ...document.querySelectorAll('.apexcharts-bar-highlight-part'),
  ].map((p) => {
    const w = byDatum.get(at(p))
    const ap = alpha(p.getAttribute('fill')) * op(p)
    const aw = alpha(w.getAttribute('fill')) * op(w)
    return {
      at: at(p),
      inside: ap + aw * (1 - ap),
      plain: alpha(w.getAttribute('fill')),
    }
  })
  const strokes = wholes.map((w) =>
    ['stroke', 'stroke-width', 'stroke-opacity']
      .map((a) => w.getAttribute(a))
      .join(' '),
  )
  return { parts, strokes }
}

test.describe('Highlight filter: frame 0 composites like the screen', () => {
  test('a pick: inside every part the chart is exactly as opaque as before', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    await clickChannel(page, '')
    await advance(page, 4000)
    const rec = await recordTransition(page, () => clickChannel(page, 'online'), {
      probe: composite,
    })
    const f0 = rec.probes[0]
    expect(f0.parts.length).toBe(24)
    for (const p of f0.parts) {
      // the bars' default paint is translucent, so a whole left at full
      // strength under its part would read darker
      expect(p.plain).toBeLessThan(1)
      expect(p.inside).toBeCloseTo(p.plain, 3)
    }
    // the wholes keep the stroke they were drawn with on frame 0
    expect(f0.strokes).toEqual(rec.probeBefore.strokes)
    expect(errors).toEqual([])
  })

  test('a clear: the last frame with parts already reads as the plain chart', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    const rec = await recordTransition(page, () => clickChannel(page, ''), {
      probe: composite,
    })
    // The parts leave on their bars' staggered clocks, so each is read on
    // the last frame it is drawn.
    const last = new Map()
    rec.probes.forEach((f, n) => f.parts.forEach((p) => last.set(p.at, [p, n])))
    expect(last.size).toBe(24)
    for (const [p, n] of last.values()) {
      expect(n).toBeGreaterThan(2)
      expect(Math.abs(p.inside - p.plain)).toBeLessThan(0.01)
    }
    expect(rec.probes[rec.probes.length - 1].parts.length).toBe(0)
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter: datums without a part, datums that leave', () => {
  /** Pick a channel with the Americas 2015 part set to `first` (in the page,
   * where the sample's data lives). */
  const pickWithFirst = (page, first, channel = 'online') =>
    page.evaluate(
      ([v, ch]) =>
        window.chart.updateSeries(
          window.seriesFor(ch).map((s, i) =>
            i === 0
              ? { ...s, highlightData: [v, ...s.highlightData.slice(1)] }
              : s,
          ),
        ),
      [first, channel],
    )

  /** The Americas 2015 whole (opacity) and part (height), read in the page. */
  function firstDatum() {
    const g = document.querySelectorAll('.apexcharts-series')[0]
    const whole = g.querySelector(':scope > .apexcharts-bar-area')
    const part = [...g.querySelectorAll('.apexcharts-bar-highlight-part')].find(
      (n) => n.getAttribute('j') === '0',
    )
    return {
      op: parseFloat(whole.getAttribute('fill-opacity') ?? '1'),
      partH: part ? part.getBBox().height : null,
    }
  }

  test('a re-pick keeps a whole without a part faded on every frame', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    await pickWithFirst(page, null)
    await advance(page, 4000)
    const rec = await recordTransition(
      page,
      () => pickWithFirst(page, null, 'store'),
      { probe: firstDatum },
    )
    for (const f of rec.probes) expect(f.op).toBeCloseTo(0.2, 2)
    expect(errors).toEqual([])
  })

  test('a part arriving at a faded datum rises from its baseline', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    await pickWithFirst(page, null)
    await advance(page, 4000)
    const rec = await recordTransition(page, () => pickWithFirst(page, 30), {
      probe: firstDatum,
    })
    expect(rec.probes[0].partH).toBeLessThan(1)
    expect(rec.probes[rec.probes.length - 1].partH).toBeGreaterThan(10)
    for (const f of rec.probes) expect(f.op).toBeCloseTo(0.2, 2)
    expect(errors).toEqual([])
  })

  test('a clear eases a whole without a part back with the rest', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    await pickWithFirst(page, null)
    await advance(page, 4000)
    const rec = await recordTransition(page, () => clickChannel(page, ''), {
      probe: firstDatum,
    })
    const ops = rec.probes.map((f) => f.op)
    expect(ops[0]).toBeCloseTo(0.2, 2)
    // it eases: some frame sits strictly between the tint and full strength
    expect(ops.some((o) => o > 0.25 && o < 0.95)).toBe(true)
    expect(ops[ops.length - 1]).toBeGreaterThan(0.99)
    expect(errors).toEqual([])
  })

  test('a datum that leaves takes its faded whole and its part with it', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    // drop 2022 while the pick stays
    const dropLast = () =>
      page.evaluate(() =>
        window.chart.updateOptions({
          xaxis: { categories: window.YEARS.slice(0, 7) },
          series: window.seriesFor('online').map((s) => ({
            ...s,
            data: s.data.slice(0, 7),
            highlightData: s.highlightData.slice(0, 7),
          })),
        }),
      )
    const rec = await recordTransition(page, dropLast, {
      probe: () => ({
        ghosts: [...document.querySelectorAll('.apexcharts-bar-ghost')].map((n) => ({
          op: parseFloat(n.getAttribute('fill-opacity') ?? '1'),
          t: n.style.transform,
        })),
        partGhosts: [...document.querySelectorAll('.apexcharts-highlight-ghost')].map(
          (n) => n.style.transform,
        ),
      }),
    })
    const f0 = rec.probes[0]
    expect(f0.ghosts.length).toBe(3)
    for (const g of f0.ghosts) expect(g.op).toBeCloseTo(0.2, 2)
    expect(f0.partGhosts.length).toBe(3)
    // the parts ride their wholes' transform on every frame
    for (const f of rec.probes) {
      expect(f.partGhosts.slice().sort()).toEqual(f.ghosts.map((g) => g.t).sort())
    }
    const last = rec.probes[rec.probes.length - 1]
    expect(last.ghosts.length).toBe(0)
    expect(last.partGhosts.length).toBe(0)
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter: reading the chart', () => {
  test('the shared tooltip lists each region with its own part', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    const col = page.locator('.apexcharts-series > .apexcharts-bar-area').nth(2)
    const b = await col.boundingBox()
    await page.mouse.move(b.x + b.width / 2, b.y + b.height - 4)
    await advance(page, 400)
    const rows = await page.$$eval('.apexcharts-tooltip-series-group', (gs) =>
      gs
        .filter((g) => getComputedStyle(g).display !== 'none')
        .map((g) => ({
          name: g.querySelector('.apexcharts-tooltip-text-y-label')?.textContent,
          value: g.querySelector('.apexcharts-tooltip-text-y-value')?.textContent,
          // the marker is the bar in small: half solid, half faded, outlined
          swatch:
            g.querySelector('.apexcharts-tooltip-marker').style.boxShadow !== '' &&
            getComputedStyle(g.querySelector('.apexcharts-tooltip-marker svg')).display === 'none',
          subRows: g.querySelector('.apexcharts-tooltip-text-goals-value')?.textContent?.trim() || '',
        })),
    )
    // 2017: Americas 66 (online 50), Europe 29 (21), Asia Pacific 28 (22)
    expect(rows).toEqual([
      { name: 'Americas: ', value: '50 / 66', swatch: true, subRows: '' },
      { name: 'Europe: ', value: '21 / 29', swatch: true, subRows: '' },
      { name: 'Asia Pacific: ', value: '22 / 28', swatch: true, subRows: '' },
    ])
    // a clear puts the plain rows and markers back
    await clickChannel(page, '')
    await advance(page, 4000)
    await page.mouse.move(b.x + b.width / 2, b.y + b.height - 4)
    await page.mouse.move(b.x + b.width / 2 + 1, b.y + b.height - 6)
    await advance(page, 400)
    const plain = await page.$$eval('.apexcharts-tooltip-series-group', (gs) =>
      gs
        .filter((g) => getComputedStyle(g).display !== 'none')
        .map((g) => [
          g.querySelector('.apexcharts-tooltip-text-y-value')?.textContent,
          g.querySelector('.apexcharts-tooltip-marker').style.boxShadow,
        ]),
    )
    expect(plain).toEqual([
      ['66', ''],
      ['29', ''],
      ['28', ''],
    ])
    expect(errors).toEqual([])
  })

  test('clicking a series legend item hides its whole and part together', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'column-highlight')
    const legend = await page.$$eval('.apexcharts-legend-text', (ns) =>
      ns.map((n) => n.textContent),
    )
    expect(legend).toEqual(['Americas', 'Europe', 'Asia Pacific'])
    await page
      .locator('.apexcharts-legend-text', { hasText: 'Europe' })
      .click()
    await advance(page, 4000)
    const state = await page.evaluate(() => ({
      collapsed: window.chart.w.globals.collapsedSeriesIndices,
      europeParts: [
        ...document.querySelectorAll(
          '.apexcharts-series[seriesName="Europe"] .apexcharts-bar-highlight-part',
        ),
      ].filter((n) => {
        const b = n.getBBox()
        return b.width > 0.5 && b.height > 0.5
      }).length,
    }))
    expect(state.collapsed).toEqual([1])
    expect(state.europeParts).toBe(0)
    expect(errors).toEqual([])
  })

  test('an average past its whole stretches the axis and traces the whole edge', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'bar-highlight')
    const r = await page.evaluate(() => ({
      maxY: window.chart.w.globals.maxY,
      edges: document.querySelectorAll('.apexcharts-highlight-edge').length,
    }))
    // Premium: Seattle 61 > 42, Austin 48 > 31, Boston 27 > 12
    expect(r.maxY).toBeGreaterThanOrEqual(61)
    expect(r.edges).toBe(3)
    expect(errors).toEqual([])
  })

  test('a funnel label that does not fit its part switches to the text colour', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'funnel-highlight')
    const fills = await page.$$eval('.apexcharts-datalabel', (ns) =>
      ns.map((n) => n.getAttribute('fill')),
    )
    // The two widest stages fit their labels; the narrow ones do not.
    expect(fills[0]).toBe('#fff')
    expect(fills[fills.length - 1]).not.toBe('#fff')
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter: hovering any part of a bar', () => {
  /** Screen boxes of every part, read while the chart is SVG. */
  const partBoxes = (page) =>
    page.$$eval('.apexcharts-bar-highlight-part', (ns) =>
      ns.map((n) => {
        const r = n.getBoundingClientRect()
        return { j: n.getAttribute('j'), x: r.x, y: r.y, w: r.width, h: r.height }
      }),
    )
  async function titleAt(page, x, y) {
    await page.mouse.move(2, 2)
    await advance(page, 100)
    await page.mouse.move(x - 2, y - 2)
    await page.mouse.move(x, y)
    await advance(page, 300)
    return page.evaluate(() =>
      document.querySelector('.apexcharts-tooltip').classList.contains('apexcharts-active')
        ? document.querySelector('.apexcharts-tooltip-title')?.textContent
        : null,
    )
  }
  const STORES = ['Seattle', 'Denver', 'Austin', 'Chicago', 'Boston', 'Miami']

  test('the tooltip shows over a part past its whole and across zero', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'bar-highlight')
    // Seattle 61 over 42 and Boston 27 over 12 reach past their wholes;
    // Miami's +6 sits on the other side of zero from its -9.
    for (const b of await partBoxes(page)) {
      for (const fx of [0.1, 0.5, 0.9]) {
        expect(await titleAt(page, b.x + b.w * fx, b.y + b.h / 2)).toBe(
          STORES[+b.j],
        )
      }
    }
    expect(errors).toEqual([])
  })

  test('the canvas renderer finds the part as its bar too', async ({ page }) => {
    const errors = await loadSample(page, 'highlight', 'bar-highlight')
    const boxes = await partBoxes(page)
    await page.addScriptTag({ path: 'dist/features/renderer-canvas.js' })
    await page.evaluate(() =>
      window.chart.updateOptions({ chart: { renderer: 'canvas' } }),
    )
    await advance(page, 4000)
    expect(await page.$$eval('.apexcharts-highlight-hit', (n) => n.length)).toBe(0)
    for (const b of boxes) {
      expect(await titleAt(page, b.x + b.w * 0.9, b.y + b.h / 2)).toBe(
        STORES[+b.j],
      )
    }
    expect(errors).toEqual([])
  })

  test('moving from the whole onto its overhang stays on the bar; a click there selects it once', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'bar-highlight')
    await page.evaluate(() => {
      window.__sel = []
      window.__clicks = 0
      window.chart.addEventListener('dataPointSelection', (e, c, o) =>
        window.__sel.push(o.dataPointIndex),
      )
      window.chart.addEventListener('click', () => window.__clicks++)
    })
    const s = (await partBoxes(page))[0]
    const y = s.y + s.h / 2
    await page.mouse.move(s.x + s.w * 0.3, y)
    await advance(page, 300)
    const seen = []
    for (let k = 0; k <= 10; k++) {
      await page.mouse.move(s.x + s.w * (0.3 + k * 0.065), y)
      await advance(page, 40)
      seen.push(
        await page.evaluate(() =>
          document.querySelector('.apexcharts-tooltip').classList.contains('apexcharts-active'),
        ),
      )
    }
    expect(seen.every(Boolean)).toBe(true)
    await page.mouse.click(s.x + s.w * 0.95, y)
    await advance(page, 300)
    expect(
      await page.evaluate(() => [window.__sel, window.__clicks]),
    ).toEqual([[0], 1])
    expect(errors).toEqual([])
  })
})

test.describe('Highlight filter: filter by', () => {
  test('a product click filters the quarters by it, a second click clears', async ({
    page,
  }) => {
    const errors = await loadSample(page, 'highlight', 'filter-by-dashboard')
    const quarters = () =>
      page.evaluate(() => ApexCharts.getChartByID('quarters').highlightFilter.isActive())

    expect(await quarters()).toBe(false)
    await page.locator('#chart .apexcharts-bar-area').nth(1).click()
    await advance(page, 4000)
    expect(await quarters()).toBe(true)
    expect(await page.locator('#readout').textContent()).toContain('Phones')
    // Phones' North share in Q1 is 55 of 127.
    expect(
      await page.evaluate(() =>
        ApexCharts.getChartByID('quarters').highlightFilter.valueAt(0, 0),
      ),
    ).toBe(55)

    await page.locator('#chart .apexcharts-bar-area').nth(1).click()
    await advance(page, 4000)
    expect(await quarters()).toBe(false)
    expect(errors).toEqual([])
  })
})
