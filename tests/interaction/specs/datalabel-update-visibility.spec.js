/**
 * Bar data labels across an updateSeries(), in a real browser.
 *
 * With label motion off, the labels wait for the bars: hidden while the bars
 * morph, shown once they land. With nothing animating (animations off, or the
 * OS asking for reduced motion) there is nothing to wait for, and they must be
 * shown straight away. They used to stay hidden for good in that case, on any
 * chart that had not been re-rendered before the update.
 */

import { test, expect } from '@playwright/test'
import { mountChart } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const options = (extra) => ({
  chart: { type: 'bar', height: 300, toolbar: { show: false }, ...extra.chart },
  plotOptions: { bar: { horizontal: true } },
  dataLabels: { enabled: true, ...extra.dataLabels },
  series: [{ name: 'p95', data: [120, 180, 90, 240] }],
  xaxis: { categories: ['A', 'B', 'C', 'D'], max: 500 },
})

const hidden = (page) =>
  page.evaluate(() => {
    const groups = [...document.querySelectorAll('.apexcharts-datalabels')]
    return { groups: groups.length, hidden: groups.filter((g) => g.classList.contains('apexcharts-element-hidden')).length }
  })

const update = (page) => page.evaluate(() => window.chart.updateSeries([{ name: 'p95', data: [140, 160, 110, 220] }]))

test.describe('Bar data labels across updateSeries()', () => {
  test('with label motion off, they wait for the bars to land', async ({ page }) => {
    const errors = await mountChart(page, options({ dataLabels: { animate: { enabled: false } } }))
    await update(page)
    await advance(page, 50)
    const during = await hidden(page)
    expect(during.groups).toBeGreaterThan(0)
    expect(during.hidden).toBe(during.groups)
    await advance(page, 1000)
    expect((await hidden(page)).hidden).toBe(0)
    expect(errors).toEqual([])
  })

  test('with animations off, they are shown at once', async ({ page }) => {
    const errors = await mountChart(page, options({ chart: { animations: { enabled: false } } }))
    await update(page)
    await advance(page, 20)
    const after = await hidden(page)
    expect(after.groups).toBeGreaterThan(0)
    expect(after.hidden).toBe(0)
    expect(errors).toEqual([])
  })

  test('under prefers-reduced-motion, they are shown at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors = await mountChart(page, options({}))
    await update(page)
    await advance(page, 20)
    const after = await hidden(page)
    expect(after.groups).toBeGreaterThan(0)
    expect(after.hidden).toBe(0)
    expect(errors).toEqual([])
  })
})
