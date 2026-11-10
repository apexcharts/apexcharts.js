/**
 * A tooltip open under a resting pointer stays open across a live update,
 * and shows the new data at that pointer, crosshair included (#2883).
 *
 * Only a data-only updateSeries kept the box, and only for the built-in rows.
 * Every other update (updateOptions, appendData, an updateSeries that changes
 * the point count, any update of a custom tooltip) built a new, closed box, so
 * on a chart fed once a second the tooltip vanished until the pointer moved.
 */

import { test, expect } from '@playwright/test'
import { mountChart } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const visits = [30, 40, 35, 50, 49, 60, 70, 91]

const options = {
  chart: { type: 'line', height: 320, toolbar: { show: false } },
  series: [{ name: 'Visits', data: visits }],
  tooltip: { shared: true, intersect: false },
}

/** Rest the pointer on the last point: after an append it is the new one. */
async function hoverLastPoint(page) {
  const { x, y } = await page.evaluate(() => {
    const w = window.chart.w
    const r = w.dom.Paper.node.getBoundingClientRect()
    const j = w.globals.seriesXvalues[0].length - 1
    return {
      x: r.left + w.layout.translateX + w.globals.seriesXvalues[0][j],
      y: r.top + w.layout.translateY + w.globals.seriesYvalues[0][j],
    }
  })
  await page.mouse.move(x - 4, y)
  await page.mouse.move(x, y)
  await advance(page, 100)
  return x
}

function tooltipState() {
  const tip = document.querySelector('.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)')
  const xc = document.querySelector('.apexcharts-xcrosshairs')
  const xr = xc?.getBoundingClientRect()
  return {
    open: !!tip?.classList.contains('apexcharts-active'),
    value: tip?.querySelector('.apexcharts-tooltip-text-y-value')?.textContent ?? null,
    crosshair: !!xc?.classList.contains('apexcharts-active'),
    crosshairX: xr ? xr.left + xr.width / 2 : null,
  }
}

const UPDATES = [
  ['updateSeries with one more point', () => window.chart.updateSeries([{ name: 'Visits', data: [30, 40, 35, 50, 49, 60, 70, 91, 12] }]), '12'],
  ['updateOptions with new series', () => window.chart.updateOptions({ series: [{ name: 'Visits', data: [5, 6, 7, 8, 9, 10, 11, 64] }] }), '64'],
  ['updateOptions that leaves the data alone', () => window.chart.updateOptions({ title: { text: 'Visits per day' } }), '91'],
  ['appendData', () => window.chart.appendData([{ data: [77] }]), '77'],
]

for (const [name, update, value] of UPDATES) {
  test(`${name}: the tooltip and crosshair stay open on the new data`, async ({ page }) => {
    const errors = await mountChart(page, options)
    const x = await hoverLastPoint(page)
    expect((await page.evaluate(tooltipState)).open).toBe(true)

    await page.evaluate(update)
    await advance(page, 2000)

    const after = await page.evaluate(tooltipState)
    expect(after.open).toBe(true)
    expect(after.value).toBe(value)
    expect(after.crosshair).toBe(true)
    expect(Math.abs(after.crosshairX - x)).toBeLessThan(2)
    expect(errors).toEqual([])
  })
}

test('a custom tooltip stays open across a data-only update', async ({ page }) => {
  const errors = await mountChart(page, options)
  await page.evaluate(() =>
    window.chart.updateOptions({
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex }) =>
          `<div class="apexcharts-tooltip-text-y-value">${series[seriesIndex][dataPointIndex]}</div>`,
      },
    }),
  )
  await advance(page, 2000)
  await hoverLastPoint(page)
  expect(await page.evaluate(tooltipState)).toMatchObject({ open: true, value: '91' })

  await page.evaluate(() => window.chart.updateSeries([{ name: 'Visits', data: [5, 6, 7, 8, 9, 10, 11, 64] }]))
  await advance(page, 2000)

  expect(await page.evaluate(tooltipState)).toMatchObject({ open: true, value: '64', crosshair: true })
  expect(errors).toEqual([])
})

test('a tooltip the pointer has left stays closed across an update', async ({ page }) => {
  const errors = await mountChart(page, options)
  await hoverLastPoint(page)
  await page.mouse.move(5, 5)
  await advance(page, 100)
  expect((await page.evaluate(tooltipState)).open).toBe(false)

  await page.evaluate(() => window.chart.appendData([{ data: [77] }]))
  await advance(page, 2000)

  expect(await page.evaluate(tooltipState)).toMatchObject({ open: false, crosshair: false })
  expect(errors).toEqual([])
})

