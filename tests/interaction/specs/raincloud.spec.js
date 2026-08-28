/**
 * `chart.type: 'raincloud'` render + interaction.
 *
 * Uses the basic-raincloud fixture (samples/vanilla-js/raincloud/
 * basic-raincloud.html): four groups of raw observations, drawn as the classic
 * three-layer raincloud (rain left, five-number box middle, half-density cloud
 * right). The fixture loads the type the way a script-tag user does — the full
 * bundle plus dist/features/raincloud.js — so this suite is also the check
 * that the UMD add-on channel actually feeds the alias. Covers what jsdom
 * cannot see:
 *   - the three lanes land in px order (rain < box < cloud) per category
 *   - the shared tooltip carries the five-number summary
 *   - trial mode: a premium type without a key renders WITH the watermark
 */

import { test, expect } from '../fixtures/base.js'

test.describe('Raincloud: render + tooltip + licensing', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('raincloud', 'basic-raincloud')
  })

  test('draws all three layers for every group', async ({ page }) => {
    const counts = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.apexcharts-violin-area')]
      return {
        bodies: all.filter(
          (p) => !p.classList.contains('apexcharts-raincloud-box'),
        ).length,
        boxes: all.filter((p) =>
          p.classList.contains('apexcharts-raincloud-box'),
        ).length,
        rains: document.querySelectorAll('.apexcharts-violin-points').length,
      }
    })
    expect(counts.bodies).toBe(4)
    expect(counts.boxes).toBe(8) // whiskers + box per group
    expect(counts.rains).toBe(4)
  })

  test('lanes land in order: rain left of the box, box left of the cloud', async ({
    page,
  }) => {
    const order = await page.evaluate(() => {
      const bodies = [
        ...document.querySelectorAll(
          '.apexcharts-violin-area:not(.apexcharts-raincloud-box)',
        ),
      ]
      const boxes = [
        ...document.querySelectorAll('.apexcharts-raincloud-box'),
      ]
      const rains = [
        ...document.querySelectorAll('.apexcharts-violin-points'),
      ]
      // First group only: its body, the UNION of its two box paths (the
      // whisker caps span only part of the lane; the filled box spans all of
      // it), and its rain path.
      const j0 = (els) => els.filter((el) => el.getAttribute('j') === '0')
      const body = bodies[0].getBoundingClientRect()
      const boxRects = j0(boxes).map((el) => el.getBoundingClientRect())
      const rain = rains[0].getBoundingClientRect()
      return {
        rainRight: rain.right,
        boxLeft: Math.min(...boxRects.map((r) => r.left)),
        boxRight: Math.max(...boxRects.map((r) => r.right)),
        bodyLeft: body.left,
        bodyRight: body.right,
      }
    })
    // rain lane ends before the box lane; the cloud begins at the box's edge
    // and extends past it. Tolerances cover stroke widths.
    expect(order.rainRight).toBeLessThanOrEqual(order.boxLeft + 2)
    expect(order.bodyLeft).toBeLessThanOrEqual(order.boxRight + 2)
    expect(order.bodyRight).toBeGreaterThan(order.boxRight + 4)
  })

  test('hovering a group shows the five-number tooltip', async ({ page }) => {
    const body = page.locator(
      '.apexcharts-violin-area:not(.apexcharts-raincloud-box)',
    ).first()
    await body.hover({ force: true })
    const tooltip = page.locator('.apexcharts-tooltip')
    await expect(tooltip).toContainText('Median')
    await expect(tooltip).toContainText('Q1')
    await expect(tooltip).toContainText('Q3')
    await expect(tooltip).toContainText('Observations')
  })

  test('trial mode: the premium type renders fully but watermarked', async ({
    page,
  }) => {
    // The sample sets no license key, so the chart must carry the trial
    // watermark while still drawing everything (never degraded, never blocked).
    await expect(page.locator('[data-apexcharts-watermark]')).toHaveCount(1)
  })
})

test.describe('Raincloud: layout variations switcher', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('raincloud', 'raincloud-variations')
  })

  const layerCounts = async (page) =>
    page.evaluate(() => {
      const all = [...document.querySelectorAll('.apexcharts-violin-area')]
      const bodies = all.filter(
        (p) => !p.classList.contains('apexcharts-raincloud-box'),
      )
      const xs = (el) =>
        (el.getAttribute('d').match(/-?\d+(?:\.\d+)?/g) || [])
          .map(Number)
          .filter((_, i) => i % 2 === 0)
      const bodyXs = xs(bodies[0])
      return {
        bodies: bodies.length,
        boxes: all.length - bodies.length,
        rains: document.querySelectorAll('.apexcharts-violin-points').length,
        bodyWidth: Math.max(...bodyXs) - Math.min(...bodyXs),
      }
    })

  test('each layout draws exactly its layers, and hidden lanes reflow', async ({
    page,
  }) => {
    // classic (initial): 3 bodies, 2 box paths each, 3 rain paths
    let c = await layerCounts(page)
    expect(c).toMatchObject({ bodies: 3, boxes: 6, rains: 3 })
    const classicWidth = c.bodyWidth

    await page.click('button[data-layout="cloud-rain"]')
    await page.waitForTimeout(300)
    c = await layerCounts(page)
    expect(c).toMatchObject({ bodies: 3, boxes: 0, rains: 3 })
    expect(c.bodyWidth).toBeGreaterThan(classicWidth) // box lane reflowed

    await page.click('button[data-layout="cloud-box"]')
    await page.waitForTimeout(300)
    c = await layerCounts(page)
    expect(c).toMatchObject({ bodies: 3, boxes: 6, rains: 0 })
    expect(c.bodyWidth).toBeGreaterThan(classicWidth) // rain lane reflowed

    await page.click('button[data-layout="overlay"]')
    await page.waitForTimeout(300)
    c = await layerCounts(page)
    expect(c).toMatchObject({ bodies: 3, boxes: 6, rains: 3 })

    // and back to classic without residue
    await page.click('button[data-layout="classic"]')
    await page.waitForTimeout(300)
    c = await layerCounts(page)
    expect(c).toMatchObject({ bodies: 3, boxes: 6, rains: 3 })
    expect(Math.abs(c.bodyWidth - classicWidth)).toBeLessThan(2)
  })
})
