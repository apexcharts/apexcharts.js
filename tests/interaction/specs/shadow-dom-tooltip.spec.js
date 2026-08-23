/**
 * #3237: inside a shadow root (a web component), the tooltip freezes on the
 * previously hovered point instead of following the cursor.
 *
 * Two things have to line up for it, which is why the reported CodePen can look
 * perfectly healthy:
 *
 *  1. the chart is in a shadow root, so events that leave it are RETARGETED to
 *     the host element once dispatch finishes, and
 *  2. the move is coalesced. Tooltip.onSeriesHover draws immediately only if the
 *     last draw was over 20ms ago, otherwise it defers via setTimeout. At a
 *     normal mouse sampling rate (~8-16ms) roughly every other move is
 *     deferred, and a deferred move reads `e.target` after dispatch, where it
 *     is now the host `<div>`. Every `apexcharts-*-area` class check fails, so
 *     handleBarTooltip returns early and the card stays where it was.
 *
 * Hover slowly and every move takes the immediate branch, where the target is
 * still correct: the bug vanishes. So each test here establishes the truth with
 * an unhurried hover, then repeats it with two moves dispatched back to back so
 * the second one is guaranteed to land inside the coalescing window. The
 * pointer ends up in the same place either way, so the tooltip must too.
 *
 * The light-DOM cases are controls: nothing is retargeted there, and they
 * passed before the fix as well.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const CATS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const SERIES = [
  { name: 'a', data: [30, 40, 35, 50, 49, 60, 70] },
  { name: 'b', data: [23, 12, 54, 61, 32, 56, 20] },
]

const test = base.extend({
  /**
   * Renders a chart either in the light DOM or inside an open shadow root, and
   * hands back the centre of every element matching `sel`.
   */
  chart: async ({ page }, use) => {
    await page.goto('about:blank')
    await page.setContent('<div id="mount"></div>')
    await page.addScriptTag({ path: distPath })

    /**
     * @param {{host: 'light'|'shadow', options: any, sel: string}} args
     * @returns {Promise<{x: number, y: number}[]>}
     */
    const build = ({ host, options, sel }) =>
      page.evaluate(
        async ({ host, options, sel, CATS }) => {
          if (window.chart) window.chart.destroy()
          const mount = document.getElementById('mount')
          mount.innerHTML = ''
          let root = mount
          if (host === 'shadow') {
            const el = document.createElement('div')
            mount.appendChild(el)
            root = el.attachShadow({ mode: 'open' })
          }
          const target = document.createElement('div')
          target.style.width = '600px'
          root.appendChild(target)

          window.chart = new ApexCharts(target, {
            ...options,
            chart: {
              ...options.chart,
              height: 380,
              animations: { enabled: false },
            },
            xaxis: { categories: CATS },
            dataLabels: { enabled: false },
          })
          await window.chart.render()
          // Everything the assertions read lives under this root, shadow or not.
          window.chartRoot = root

          return [...root.querySelectorAll(sel)].map((n) => {
            const b = n.getBoundingClientRect()
            return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
          })
        },
        { host, options, sel, CATS },
      )

    await use(build)
  },
})

/** Position and text of the tooltip, wherever it lives. */
const readTooltip = (page) =>
  page.evaluate(() => {
    const tt = window.chartRoot.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    if (!tt) return null
    return {
      left: Math.round(parseFloat(tt.style.left) || 0),
      top: Math.round(parseFloat(tt.style.top) || 0),
      text: tt.textContent.replace(/\s+/g, ' ').trim(),
    }
  })

/**
 * Raw CDP moves: page.mouse.move() is fine too, but this keeps the two moves in
 * `burst` as close together as the transport allows.
 */
async function mover(page) {
  const cdp = await page.context().newCDPSession(page)
  return (/** @type {{x: number, y: number}} */ p) =>
    cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y })
}

/** Unhurried hover: every move is over 20ms from the last, so none is deferred. */
async function settledHover(page, move, to) {
  await move({ x: 5, y: 5 })
  await page.waitForTimeout(160)
  await move(to)
  await page.waitForTimeout(200)
  await move({ x: to.x + 1, y: to.y })
  await page.waitForTimeout(200)
  return readTooltip(page)
}

/**
 * Land on `from`, let it settle, then fire two moves without awaiting the first
 * so the one that reaches `to` goes down the setTimeout branch.
 */
async function racedHover(page, move, from, to) {
  await move({ x: 5, y: 5 })
  await page.waitForTimeout(160)
  await move(from)
  await page.waitForTimeout(200)
  await Promise.all([move({ x: from.x + 1, y: from.y }), move(to)])
  await page.waitForTimeout(300)
  return readTooltip(page)
}

const CASES = [
  {
    name: 'bar, default options',
    sel: '.apexcharts-bar-area',
    from: 3,
    to: 8,
    options: { chart: { type: 'bar' }, series: SERIES },
  },
  {
    name: 'bar, tooltip.intersect',
    sel: '.apexcharts-bar-area',
    from: 3,
    to: 8,
    options: {
      chart: { type: 'bar' },
      series: SERIES,
      tooltip: { intersect: true, shared: false },
    },
  },
  {
    name: 'line markers, tooltip.intersect',
    sel: '.apexcharts-marker',
    from: 2,
    to: 9,
    options: {
      chart: { type: 'line' },
      series: SERIES,
      markers: { size: 7 },
      tooltip: { intersect: true, shared: false },
    },
  },
  {
    name: 'heatmap cell',
    sel: '.apexcharts-heatmap-rect',
    from: 2,
    to: 9,
    options: { chart: { type: 'heatmap' }, series: SERIES },
  },
  {
    name: 'treemap cell',
    sel: '.apexcharts-treemap-rect',
    from: 0,
    to: 3,
    options: {
      chart: { type: 'treemap' },
      series: [{ data: CATS.map((x, i) => ({ x, y: 10 + i * 9 })) }],
    },
  },
]

test.describe('Tooltip inside a shadow root (#3237)', () => {
  for (const host of ['shadow', 'light']) {
    for (const c of CASES) {
      test(`${host} DOM: ${c.name} follows a coalesced move`, async ({
        page,
        chart,
      }) => {
        const pts = await chart({ host, options: c.options, sel: c.sel })
        expect(pts.length).toBeGreaterThan(Math.max(c.from, c.to))
        const move = await mover(page)

        const settled = await settledHover(page, move, pts[c.to])
        expect(settled, 'no tooltip element').not.toBeNull()
        expect(settled.text).not.toBe('')

        const raced = await racedHover(page, move, pts[c.from], pts[c.to])

        // Before the fix, every shadow case here reported the tooltip for
        // `from` (both the text and the coordinates), because the move onto
        // `to` was read after retargeting and discarded.
        expect(raced.text).toBe(settled.text)
        expect(raced.left).toBeCloseTo(settled.left, 0)
        expect(raced.top).toBeCloseTo(settled.top, 0)
      })
    }
  }

  test('shadow DOM: the deferred read is what breaks, and it is now stamped', async ({
    page,
    chart,
  }) => {
    // Guards the mechanism rather than the symptom: a listener bound inside a
    // shadow tree sees the real target during dispatch and the HOST afterwards,
    // which is the whole reason the tooltip needs to note it down early.
    await chart({
      host: 'shadow',
      options: { chart: { type: 'bar' }, series: SERIES },
      sel: '.apexcharts-bar-area',
    })

    const seen = await page.evaluate(async () => {
      const bar = window.chartRoot.querySelector('.apexcharts-bar-area')
      return new Promise((res) => {
        bar.addEventListener('mousemove', (e) => {
          const during = e.target.tagName
          setTimeout(() => {
            res({
              during,
              after: e.target.tagName,
              stamped: e.apexHoverTarget
                ? e.apexHoverTarget.getAttribute('class')
                : null,
              composedPathAfter: e.composedPath().length,
            })
          }, 1)
        })
        bar.dispatchEvent(
          new MouseEvent('mousemove', { bubbles: true, composed: true }),
        )
      })
    })

    expect(seen.during).toBe('path')
    expect(seen.after).toBe('DIV') // retargeted to the host
    expect(seen.composedPathAfter).toBe(0) // and composedPath() is no help
    expect(seen.stamped).toContain('apexcharts-bar-area')
  })
})
