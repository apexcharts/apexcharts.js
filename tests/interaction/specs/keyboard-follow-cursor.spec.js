/**
 * Keyboard focus on a chart whose tooltip follows the pointer puts the box
 * where the pointer would put it resting on the focused mark's centre.
 *
 * It used to go to the chart's top-left corner (style.left about -40px), or,
 * after any earlier hover, to where the mouse last was. The box reads the
 * chart's own pointer (`ttCtx.clientX/Y`) before the event, and keyboard
 * focus moved only the event onto the mark: the pointer stayed at the 0, 0 it
 * starts at, which `??` takes as a pointer. column/stacked-column-with-line
 * showed it. Heatmaps and treemaps (which follow the pointer by default) put
 * the box beside the cell instead of at the pointer, and a radar, which
 * follows it by default too, put it nowhere at all on the first focus.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

const TT = '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)'
const FOLLOW = { tooltip: { followCursor: true } }
const NO_ARROW = { tooltip: { followCursor: true, arrow: false } }

// Focus the chart's svg as a keyboard user would, then step to the `steps`th
// mark (`down` series further on), and read the box with the centre of the
// mark it captions.
async function focusMark(page, steps, down = 0) {
  await page.evaluate(() => {
    document.activeElement?.blur?.()
    document.querySelector('.apexcharts-svg').focus()
  })
  await page.waitForSelector(`${TT}.apexcharts-active`)
  for (let k = 0; k < steps; k++) await page.keyboard.press('ArrowRight')
  for (let k = 0; k < down; k++) await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(250)
  return page.evaluate((TT) => {
    const w = window.chart.w
    const focused = document.querySelector('.apexcharts-keyboard-focused')
    let at
    if (focused && focused.tagName !== 'g') {
      const r = focused.getBoundingClientRect()
      at = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    } else {
      // Nothing of the mark to measure (a line without markers, a canvas
      // cell): the pointer keyboard focus rests on it.
      const e = w.globals.tooltip.e
      at = { x: e.clientX, y: e.clientY }
    }
    const tt = document.querySelector(`${TT}.apexcharts-active`)
    const r = tt.getBoundingClientRect()
    return {
      at,
      left: parseFloat(tt.style.left),
      top: parseFloat(tt.style.top),
      box: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
      placement: tt.dataset.placement ?? null,
      ij: [w.interact.capturedSeriesIndex, w.interact.capturedDataPointIndex],
    }
  }, TT)
}

// Leave keyboard navigation and rest the mouse at `at`; read the box.
async function hoverAt(page, at) {
  await page.evaluate(() => document.activeElement?.blur?.())
  await page.mouse.move(at.x - 3, at.y - 3)
  await page.mouse.move(at.x, at.y)
  await page.waitForTimeout(250)
  return page.evaluate((TT) => {
    const tt = document.querySelector(`${TT}.apexcharts-active`)
    if (!tt) return null
    const w = window.chart.w
    return {
      left: parseFloat(tt.style.left),
      top: parseFloat(tt.style.top),
      placement: tt.dataset.placement ?? null,
      ij: [w.interact.capturedSeriesIndex, w.interact.capturedDataPointIndex],
    }
  }, TT)
}

// An earlier hover somewhere else on the plot, then off the chart: the
// pointer it leaves behind is what the box went back to.
async function hoverElsewhere(page) {
  const svg = await page
    .locator('.apexcharts-svg')
    .first()
    .evaluate((el) => el.getBoundingClientRect().toJSON())
  await page.mouse.move(svg.left + svg.width * 0.7, svg.top + svg.height * 0.6)
  await page.waitForTimeout(100)
  await page.mouse.move(2, 2)
  await page.waitForTimeout(150)
}

async function load(page, loadChart, type, file, options) {
  await loadChart(type, file)
  if (options?.chart?.renderer === 'canvas') {
    await page.addScriptTag({
      path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
    })
  }
  if (options) {
    await page.evaluate(
      (o) => window.chart.updateOptions(o, false, false),
      options,
    )
    await page.waitForTimeout(400)
  }
}

// `xOnly`: a box the keyboard holds off the mark vertically. Without an
// arrow a horizontal bar's box is centred on the bar, and a scatter point
// or a line marker with a focus ring keeps the box clear of it (Focus Not
// Obscured). `down`: how many series past the first the focused mark is.
const INTERSECT = {
  tooltip: { followCursor: true, shared: false, intersect: true },
}
const CASES = [
  ['timelines', 'simple'],
  ['timelines', 'multi-series'],
  ['timelines', 'multi-series-group-rows'],
  ['timelines', 'advanced'],
  ['timelines', 'simple', NO_ARROW, { xOnly: true }],
  ['treemap', 'basic'],
  ['treemap', 'distributed'],
  ['heatmap', 'basic', FOLLOW],
  [
    'heatmap',
    'basic',
    {
      ...FOLLOW,
      chart: { renderer: 'canvas', animations: { enabled: false } },
    },
  ],
  ['line', 'basic-line', FOLLOW],
  ['area', 'area-spline', FOLLOW],
  ['column', 'basic-column', FOLLOW],
  [
    'column',
    'basic-column',
    { tooltip: { followCursor: true, shared: false, intersect: true } },
  ],
  ['bar', 'basic-bar', FOLLOW],
  ['bar', 'basic-bar', NO_ARROW, { xOnly: true }],
  ['scatter', 'scatter-basic', FOLLOW, { xOnly: true }],
  ['radar', 'basic-radar'],
  ['radar', 'radar-multiple-series'],
  // The columns of a combo are hovered as bars, not as points of a line.
  ['column', 'stacked-column-with-line', null, { down: 1 }],
  ['column', 'stacked-column-with-line', null, { down: 3 }],
  ['mixed', 'line-column', INTERSECT],
  ['candlestick', 'candlestick-line', INTERSECT, { down: 1 }],
  // A line's own markers, one series' caption at a time: by the marker.
  ['slope', 'basic', null, { xOnly: true }],
  [
    'line',
    'basic-line',
    { markers: { size: 6 }, tooltip: { followCursor: true, shared: false } },
    { xOnly: true },
  ],
]

test.describe('Keyboard focus with tooltip.followCursor', () => {
  for (const [type, file, options, { xOnly = false, down = 0 } = {}] of CASES) {
    const name = `${type}/${file}${options ? ' ' + JSON.stringify(options) : ''}${down ? ` series +${down}` : ''}`
    test(`${name}: the box goes where the pointer on the mark puts it`, async ({
      page,
      loadChart,
    }) => {
      await load(page, loadChart, type, file, options)
      // First focus, nothing hovered yet, then a later focus after a hover.
      for (const [steps, before] of [
        [1, null],
        [2, hoverElsewhere],
      ]) {
        if (before) await before(page)
        const kb = await focusMark(page, steps, down)
        const ptr = await hoverAt(page, kb.at)
        const label = `${name}, mark ${kb.ij}`
        // Off the first series (the line of a combo); focus resumes where
        // it was left, so the second round goes on from there.
        if (down) expect(kb.ij[0], `${label}: series`).toBeGreaterThan(0)
        expect(ptr, `${label}: the pointer captions it`).not.toBeNull()
        expect(ptr.ij, `${label}: the same mark`).toEqual(kb.ij)
        expect(Math.abs(kb.left - ptr.left), `${label}: left`).toBeLessThan(2)
        if (!xOnly) {
          expect(Math.abs(kb.top - ptr.top), `${label}: top`).toBeLessThan(2)
          expect(kb.placement, `${label}: placement`).toBe(ptr.placement)
        }
      }
    })
  }

  test('scatter: the box held off the focused point is still next to it', async ({
    page,
    loadChart,
  }) => {
    await load(page, loadChart, 'scatter', 'scatter-basic', FOLLOW)
    const kb = await focusMark(page, 1)
    // beside the point, not over it
    expect(kb.box.bottom).toBeLessThan(kb.at.y)
    expect(kb.at.y - kb.box.bottom).toBeLessThan(30)
    expect(Math.abs(kb.box.left - kb.at.x)).toBeLessThan(15)
  })

  test('column/stacked-column-with-line: the box is at the focused point, not the corner', async ({
    page,
    loadChart,
  }) => {
    // Series 0 is the line; with shared off and no markers the pointer
    // captions only the columns, so the box is checked against the point.
    await load(page, loadChart, 'column', 'stacked-column-with-line')
    const chart = await page
      .locator('#chart')
      .evaluate((el) => el.getBoundingClientRect().toJSON())
    for (const [steps, before] of [
      [1, null],
      [2, hoverElsewhere],
    ]) {
      if (before) await before(page)
      const kb = await focusMark(page, steps)
      const { box, at } = kb
      const label = `mark ${kb.ij}`
      expect(kb.ij[0], label).toBe(0)
      // One side of the box on the point, as the pointer there would put it.
      const side = Math.min(
        Math.abs(box.left - at.x),
        Math.abs(box.right - at.x),
      )
      expect(side, `${label}: a side on the point`).toBeLessThan(15)
      const dy = Math.max(box.top - at.y, 0, at.y - box.bottom)
      expect(dy, `${label}: level with the point`).toBeLessThan(30)
      expect(box.left, `${label}: in the chart`).toBeGreaterThanOrEqual(
        chart.left,
      )
      expect(box.top, `${label}: in the chart`).toBeGreaterThanOrEqual(
        chart.top,
      )
      await page.evaluate(() => document.activeElement?.blur?.())
    }
  })

  test('a later hover still follows the mouse', async ({ page, loadChart }) => {
    await load(page, loadChart, 'line', 'basic-line', FOLLOW)
    const kb = await focusMark(page, 1)
    const a = await hoverAt(page, kb.at)
    const b = await hoverAt(page, { x: kb.at.x + 12, y: kb.at.y + 9 })
    expect(b.left - a.left).toBeCloseTo(12, 0)
    expect(b.top - a.top).toBeCloseTo(9, 0)
  })

  test('a sparkline: the box goes above or below the focused point, as the pointer puts it', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'basic-line')
    await page.evaluate(async () => {
      window.chart.destroy()
      window.chart = new ApexCharts(document.querySelector('#chart'), {
        chart: { type: 'line', height: 60, sparkline: { enabled: true } },
        series: [{ name: 'A', data: [12, 30, 18, 42, 25, 36, 20, 28] }],
        tooltip: { followCursor: true },
      })
      await window.chart.render()
    })
    await page.waitForFunction(() => window.chart.w.globals.animationEnded)
    for (const [steps, before] of [
      [1, null],
      [3, hoverElsewhere],
    ]) {
      if (before) await before(page)
      const kb = await focusMark(page, steps)
      const ptr = await hoverAt(page, kb.at)
      const label = `mark ${kb.ij}`
      expect(['top', 'bottom'], label).toContain(kb.placement)
      expect(kb.placement, label).toBe(ptr.placement)
      expect(Math.abs(kb.left - ptr.left), label).toBeLessThan(2)
      expect(Math.abs(kb.top - ptr.top), label).toBeLessThan(2)
    }
  })
})
