/**
 * `chart.type: 'dumbbell'` render + interaction.
 *
 * Uses the basic-dumbbell fixture (samples/vanilla-js/dumbbell/basic-dumbbell.html):
 * two measures over five categories, drawn as one interval per row with both
 * ends marked. Covers what jsdom cannot see, which for a dumbbell is nearly all
 * of it: the dots are placed from px geometry, and jsdom has none.
 *   - an end label at each end of the connector, in that end's own colour
 *   - the connector's gradient meeting each dot in its own colour
 *   - a legend click dropping one end and leaving a lollipop
 */

import { test, expect } from '../fixtures/base.js'

const BLUE = 'rgb(59, 130, 246)'
const RED = 'rgb(239, 68, 68)'

test.describe('Dumbbell: render + legend', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('dumbbell', 'basic-dumbbell')
  })

  test('marks both ends of every row', async ({ page }) => {
    const dots = await page.$$eval(
      '.apexcharts-rangebar-goals-markers line',
      (ns) => ns.map((n) => n.getAttribute('stroke')),
    )

    // Five rows, two measures.
    expect(dots).toHaveLength(10)
    expect(dots.filter((c) => c === '#3B82F6')).toHaveLength(5)
    expect(dots.filter((c) => c === '#EF4444')).toHaveLength(5)
  })

  test('writes each value at its own end, in its own colour', async ({
    page,
  }) => {
    const labels = await page.$$eval('.apexcharts-dumbbell-label', (ns) =>
      ns.map((n) => ({
        text: n.textContent,
        fill: getComputedStyle(n).fill,
      })),
    )

    expect(labels).toHaveLength(10)
    // Read through the value axis' own formatter, not raw.
    expect(labels[0]).toEqual({ text: '$96k', fill: BLUE })
    expect(labels[1]).toEqual({ text: '$148k', fill: RED })
  })

  test('the labels sit outside the dots, not over the connector', async ({
    page,
  }) => {
    const r = await page.evaluate(() => {
      const labels = [...document.querySelectorAll('.apexcharts-dumbbell-label')]
      const dots = [...document.querySelectorAll('.apexcharts-rangebar-goals-markers line')]
      const lowLabel = labels[0].getBoundingClientRect()
      const highLabel = labels[1].getBoundingClientRect()
      const lowDot = dots[0].getBoundingClientRect()
      const highDot = dots[1].getBoundingClientRect()
      return {
        lowIsLeftOfItsDot: lowLabel.right <= lowDot.left + 1,
        highIsRightOfItsDot: highLabel.left >= highDot.right - 1,
      }
    })

    expect(r.lowIsLeftOfItsDot).toBe(true)
    expect(r.highIsRightOfItsDot).toBe(true)
  })

  test('the connector meets each dot in that dot’s colour', async ({ page }) => {
    const stops = await page.evaluate(() => {
      const bar = document.querySelector('.apexcharts-rangebar-area')
      const id = bar.getAttribute('fill').match(/url\(["']?#([^"')]+)/)[1]
      const grad = document.getElementById(id)
      return {
        horizontal: grad.getAttribute('x1') !== grad.getAttribute('x2'),
        first: grad.querySelector('stop').getAttribute('stop-color'),
        last: [...grad.querySelectorAll('stop')].pop().getAttribute('stop-color'),
      }
    })

    // 2020 (blue) is the low end of every row in this fixture, so left to right
    // the connector runs blue to red.
    expect(stops.horizontal).toBe(true)
    expect(stops.first).toContain('59,130,246')
    expect(stops.last).toContain('239,68,68')
  })

  test('collapsing one measure leaves a lollipop, and restores', async ({
    page,
  }) => {
    const count = () =>
      page.evaluate(() => ({
        dots: document.querySelectorAll(
          '.apexcharts-rangebar-goals-markers line',
        ).length,
        labels: document.querySelectorAll('.apexcharts-dumbbell-label').length,
        connectors: [
          ...document.querySelectorAll('.apexcharts-rangebar-area'),
        ].filter((p) => (p.getAttribute('d') || '').trim().length > 1).length,
      }))

    await page.click('.apexcharts-legend-series[seriesname="2025"]')
    await page.waitForTimeout(600)

    const off = await count()
    expect(off.dots).toBe(5)
    expect(off.labels).toBe(5)

    await page.click('.apexcharts-legend-series[seriesname="2025"]')
    await page.waitForTimeout(600)

    const on = await count()
    expect(on.dots).toBe(10)
    expect(on.labels).toBe(10)
  })

  test('the tooltip names both measures and the gap', async ({ page }) => {
    const bar = await page.$('.apexcharts-rangebar-area')
    const box = await bar.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(400)

    const text = await page.$eval('.apexcharts-tooltip', (n) =>
      n.textContent.replace(/\s+/g, ' ').trim(),
    )

    expect(text).toContain('2020')
    expect(text).toContain('2025')
    expect(text).toContain('Difference')
  })
})
