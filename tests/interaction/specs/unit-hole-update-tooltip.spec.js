/**
 * An open unit tooltip, kept across an update, describes the mark under the
 * pointer AFTER the update, on a chart whose glyphs have holes.
 *
 * An update shows an open tooltip again at the same pointer (Tooltip#hoverAt),
 * through the listener a move there would reach now. A unit chart has a
 * plot-wide listener only when a glyph has a hole (the hole is plot, which no
 * series group hears). hoverAt handed that listener back as it was, never
 * looking at what was under the pointer now, so the unit tooltip read the
 * mark the LAST move had landed on: a node the update had replaced, or one
 * holding another datum by then. The box went on naming that mark, and stayed
 * open over empty plot, until the pointer moved again.
 *
 * Only a real browser can show it: the replay finds the mark under the
 * pointer with elementsFromPoint, which jsdom does not have. The oracle is
 * the browser itself: after the update, the replayed tooltip must read
 * exactly as a fresh hover at the same point does.
 */

import { test, expect } from '@playwright/test'
import { dirname, resolve } from 'path'
import { BUNDLE } from '../helpers/frames.js'

const UNIT = resolve(dirname(BUNDLE), 'unit.js')

// A ring in a 24 box: ink between radius 4.8 and 10, hole inside 4.8.
const RING = {
  path:
    'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z' +
    'm0 5.2a4.8 4.8 0 1 1 0 9.6a4.8 4.8 0 1 1 0-9.6Z',
  viewBox: [0, 0, 24, 24],
  fillRule: 'evenodd',
}

// A disc: the same outline with no hole.
const DISC = { path: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20Z', viewBox: [0, 0, 24, 24] }

// Each mark names its own person, so a tooltip naming the wrong one shows.
// Rings and discs alternate, as saved and lost do in a chart of people: a
// disc has no hole, so only its ink answers for it.
const people = (name, n) => ({
  name,
  data: Array.from({ length: n }, (_, k) => ({
    id: `${name}-${k}`,
    name: `${name}-${k}`,
    mark: k % 2 ? DISC : RING,
  })),
})
const reversed = (s) => ({ ...s, data: [...s.data].reverse() })
const BEFORE = [people('A', 6), people('B', 3)]
const UPDATES = {
  // The same marks in reverse order: another person sits under the pointer.
  'the marks change places': BEFORE.map(reversed),
  // Most of the marks go: the pointer is left over empty plot.
  'a series is removed': [people('B', 3)],
}

async function mount(page) {
  await page.setContent(`<!doctype html>
    <body style="margin:0">
      <div id="stage" style="width:640px;margin:40px 0 0 40px"></div>
    </body>`)
  await page.addScriptTag({ path: BUNDLE })
  await page.addScriptTag({ path: UNIT })
  await page.evaluate(
    ({ series, mark }) => {
      window.chart = new window.ApexCharts(document.querySelector('#stage'), {
        chart: { type: 'unit', height: 360, animations: { enabled: false } },
        series,
        plotOptions: {
          unit: {
            layout: 'packed',
            shape: 'pictogram',
            pictogram: { mark },
            clusterLabels: { show: false },
          },
        },
      })
      return window.chart.render()
    },
    { series: BEFORE, mark: RING },
  )
  await page.waitForTimeout(50)
}

/**
 * Points on screen, on the ink and in the hole of every glyph, each checked
 * against the browser's own fill of the glyph.
 */
function probes(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('path.apexcharts-unit-area')].flatMap((el, n) => {
      const m = el.getScreenCTM()
      const at = (x, y, where) => {
        const local = new DOMPoint(x, y)
        // The probe is what it says: ink is filled, the hole is not.
        if (el.isPointInFill(local) !== (where === 'ink')) return []
        const p = local.matrixTransform(m)
        return [{ x: p.x, y: p.y, where, glyph: n }]
      }
      return [...at(19.4, 12, 'ink'), ...at(12, 12, 'hole')]
    }),
  )
}

/** Is the tooltip open, and what does it say? */
function tooltip(page) {
  return page.evaluate(() => {
    const t = document.querySelector('.apexcharts-tooltip')
    return t && t.classList.contains('apexcharts-active') ? t.textContent.trim() : null
  })
}

/** The tooltip a fresh hover at `p` opens, read after leaving the chart. */
async function freshHover(page, p) {
  await page.mouse.move(2, 2)
  await page.waitForTimeout(120)
  await page.mouse.move(p.x, p.y)
  await page.waitForTimeout(120)
  return tooltip(page)
}

for (const [label, after] of Object.entries(UPDATES)) {
  test(`unit chart with ring glyphs: the replay reads the mark under the pointer when ${label}`, async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await mount(page)
    const points = await probes(page)
    // Every glyph contributes an ink point, and each of the five rings a hole.
    expect(points.filter((p) => p.where === 'ink').length).toBe(9)
    expect(points.filter((p) => p.where === 'hole').length).toBe(5)

    const outcomes = []
    for (const p of points) {
      await page.evaluate((s) => window.chart.updateSeries(s), BEFORE)
      await page.waitForTimeout(30)
      const before = await freshHover(page, p)
      expect(before, `the ${p.where} of glyph ${p.glyph} opens its tooltip`).not.toBeNull()

      // Read as the update lands, before the pointer can move again: a
      // browser that sends its own move when the page changes under a still
      // pointer (Chromium) would otherwise correct the box a frame later and
      // hide the replay's answer, which is all the others ever show.
      const replayed = await page.evaluate(async (s) => {
        await window.chart.updateSeries(s)
        const t = document.querySelector('.apexcharts-tooltip')
        return t && t.classList.contains('apexcharts-active') ? t.textContent.trim() : null
      }, after)
      const fresh = await freshHover(page, p)
      expect(
        replayed,
        `the ${p.where} of glyph ${p.glyph}: the replay reads as a fresh hover there`,
      ).toBe(fresh)
      outcomes.push({ before, fresh })
    }

    // The update really changed what is under the pointer, so the comparison
    // above is not two reads of an unchanged chart: another person there
    // after the reorder, empty plot after the removal.
    expect(
      outcomes.some((o) =>
        label === 'the marks change places'
          ? o.fresh !== null && o.fresh !== o.before
          : o.fresh === null,
      ),
    ).toBe(true)
    expect(errors).toEqual([])
  })
}
