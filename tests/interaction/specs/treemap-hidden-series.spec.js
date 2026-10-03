/**
 * Treemap, a series declared `hidden: true`.
 *
 * It reaches the draw with no data. The draw allocated each series' label row
 * inside the loop over its data, so an empty series left a HOLE in `labels`;
 * _averageLabelSize recursed into it and threw, render() rejected, and the
 * chart came up blank with nothing in the console. Hiding the LAST series got
 * away with it because a trailing hole is never visited.
 *
 * Second defect, same input: the hidden series still lays out as one
 * zero-size tile, which anchored its series-title plate, a "Beta" chip drawn at
 * its neighbour's position and covered only by luck when the neighbour's title
 * was wider.
 *
 * Found by the legend-toggle animation matrix: its `settles` check renders the
 * target state fresh, with the series declared hidden. Real layout is needed
 * (jsdom gives every tile zero area), hence an interaction spec.
 */

import { test, expect } from '@playwright/test'
import { mountChart } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NAMES = ['Alpha', 'Beta', 'Gamma']

function config(hidden) {
  return {
    chart: { type: 'treemap', height: 320, toolbar: { show: false } },
    legend: { show: true },
    series: NAMES.map((name, c) => ({
      name,
      hidden: name === hidden,
      data: ['C1', 'C2', 'C3', 'C4'].map((x, i) => ({ x, y: 40 + c * 15 + i * 7 })),
    })),
  }
}

/** Per series: tiles with real area, and the title text it draws. */
const readSeries = (page) =>
  page.evaluate((names) => {
    const out = {}
    document.querySelectorAll('.apexcharts-treemap-series').forEach((g) => {
      out[g.getAttribute('seriesName')] = {
        tiles: [...g.querySelectorAll('.apexcharts-treemap-rect')].filter((r) => {
          const b = r.getBBox()
          return b.width > 0 && b.height > 0
        }).length,
        titles: [...g.querySelectorAll('text')].map((t) => t.textContent).filter((t) => names.includes(t)),
      }
    })
    return out
  }, NAMES)

test.describe('Treemap with a series declared hidden', () => {
  test('control: nothing hidden draws every series with its title', async ({ page }) => {
    const errors = await mountChart(page, config(null))
    const s = await readSeries(page)
    for (const name of NAMES) expect(s[name], name).toEqual({ tiles: 4, titles: [name] })
    expect(errors).toEqual([])
  })

  for (const hidden of NAMES) {
    test(`${hidden} hidden: the others render, and ${hidden} draws nothing`, async ({ page }) => {
      const errors = await mountChart(page, config(hidden))
      const s = await readSeries(page)

      for (const name of NAMES.filter((n) => n !== hidden)) {
        expect(s[name], name).toEqual({ tiles: 4, titles: [name] })
      }
      expect(s[hidden]?.tiles ?? 0, `${hidden} tiles`).toBe(0)
      expect(s[hidden]?.titles ?? [], `${hidden} title`).toEqual([])
      expect(errors).toEqual([])
    })
  }

  // The treemap legend is hover-only, but the API toggles it. Hiding drew the
  // series away; showing it again did nothing, because the hidden group never
  // carried the collapsed class that showSeries() looks for.
  test('hideSeries() then showSeries() brings the series back', async ({ page }) => {
    const errors = await mountChart(page, config(null))
    await page.evaluate(() => window.chart.hideSeries('Beta'))
    await advance(page, 4000)
    expect((await readSeries(page)).Beta?.tiles ?? 0, 'hidden').toBe(0)
    await page.evaluate(() => window.chart.showSeries('Beta'))
    await advance(page, 4000)
    const s = await readSeries(page)
    for (const name of NAMES) expect(s[name], name).toEqual({ tiles: 4, titles: [name] })
    expect(errors).toEqual([])
  })
})
