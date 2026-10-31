/**
 * CSV export, the category column holds each row's own x.
 *
 * On a numeric x scale labelData.labels holds the axis ticks, one per tick,
 * and the export used to read row i's category from tick i: a line chart of
 * 1600 points under tickAmount 40 wrote 1, 40, 80, ... on its first 41 rows.
 * Ticks only exist where the axis is laid out against real text metrics, so
 * this runs in a browser as well as in the unit suite.
 */

import { test, expect } from '@playwright/test'
import { mountChart } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

/** Export the mounted chart's CSV, after `setup` ran in the page on its config. */
async function exportCsv(page, setup = '') {
  return page.evaluate((setup) => {
    const chart = window.chart
    if (setup) new Function('w', setup)(chart.w)
    let csv = ''
    chart.exports.triggerDownload = (href) => {
      csv = decodeURIComponent(href.replace(/^data:text\/csv;\s*charset=utf-8,/, '')).replace('﻿', '')
    }
    chart.exports.exportToCSV({})
    return csv
  }, setup)
}

const base = { chart: { height: 320, animations: { enabled: false }, toolbar: { show: false } }, dataLabels: { enabled: false } }

test('a long {x, y} series under a tickAmount writes every x, not the ticks', async ({ page }) => {
  const data = Array.from({ length: 1600 }, (_, i) => ({ x: i + 1, y: (i * 7) % 50 }))
  const errors = await mountChart(page, {
    ...base,
    chart: { ...base.chart, type: 'line' },
    xaxis: { tickAmount: 40 },
    series: [{ name: 'A', data }],
  })
  const rows = (await exportCsv(page)).split('\n').slice(1)
  expect(rows.slice(0, 4)).toEqual(['1,0', '2,7', '3,14', '4,21'])
  expect(rows.map((r) => r.split(',')[0])).toEqual(data.map((p) => String(p.x)))
  expect(errors).toEqual([])
})

test('a bar chart with Date x writes the epoch it plots', async ({ page }) => {
  const days = [Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2), Date.UTC(2024, 0, 3)]
  const errors = await mountChart(page, {
    ...base,
    chart: { ...base.chart, type: 'bar' },
    series: [{ name: 'A', data: days.map((t, i) => ({ x: new Date(t), y: i + 1 })) }],
  })
  expect(await exportCsv(page)).toBe(`category,A\n${days.map((t, i) => `${t},${i + 1}`).join('\n')}`)
  expect(errors).toEqual([])
})

test('csv.categoryFormatter gets each row of plain values as text', async ({ page }) => {
  const errors = await mountChart(page, {
    ...base,
    chart: { ...base.chart, type: 'line' },
    series: [{ name: 'A', data: [5, 6, 7] }],
  })
  const csv = await exportCsv(
    page,
    "w.config.chart.toolbar.export.csv.categoryFormatter = (c) => 'Day ' + c.padStart(2, '0')",
  )
  expect(csv).toBe('category,A\nDay 01,5\nDay 02,6\nDay 03,7')
  expect(errors).toEqual([])
})

test('a page label formatter runs on every row, past the last tick too', async ({ page }) => {
  const errors = await mountChart(page, { ...base, chart: { ...base.chart, type: 'line' }, series: [{ data: [1] }] })
  // A formatter cannot cross into the page as an option, so the chart under
  // test is built there.
  await page.evaluate((base) => {
    window.chart.destroy()
    window.chart = new window.ApexCharts(document.querySelector('#chart'), {
      ...base,
      chart: { ...base.chart, type: 'line' },
      xaxis: { tickAmount: 10, labels: { formatter: (v) => `${v}kg` } },
      series: [{ name: 'A', data: Array.from({ length: 200 }, (_, i) => ({ x: i + 1, y: i })) }],
    })
    window.chart.render()
  }, base)
  await advance(page, 1000)
  const cats = (await exportCsv(page)).split('\n').slice(1).map((r) => r.split(',')[0])
  expect(cats).toEqual(Array.from({ length: 200 }, (_, i) => `${i + 1}kg`))
  expect(errors).toEqual([])
})
