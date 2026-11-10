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

// An intersect tooltip hovers a mark (a column, a marker), not the plot, and
// every update draws new marks. The one now under the pointer is what the
// tooltip shows, and none there closes it, as moving onto or off a mark does.
const columns = {
  chart: { type: 'bar', height: 320, toolbar: { show: false } },
  series: [{ name: 'Visits', data: visits }],
}
const markers = {
  ...options,
  markers: { size: 6 },
  tooltip: { shared: false, intersect: true },
}

/** Rest the pointer 10px above the foot of column j. */
async function hoverColumnFoot(page, j) {
  const r = await page.locator(`.apexcharts-bar-area[j="${j}"]`).boundingBox()
  await page.mouse.move(r.x + r.width / 2, r.y + r.height - 14)
  await page.mouse.move(r.x + r.width / 2, r.y + r.height - 10)
  await advance(page, 100)
}

/** Rest the pointer on the centre of the marker of point j. */
async function hoverMarker(page, j) {
  const r = await page.locator(`.apexcharts-series-markers .apexcharts-marker[rel="${j}"]`).boundingBox()
  await page.mouse.move(r.x + r.width / 2 - 3, r.y + r.height / 2)
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2)
  await advance(page, 100)
}

// With animations off a heatmap still grows its cells in at an update, so
// none is under the pointer at first.
const heatRows = (d) => [{ name: 'Visits', data: d.map((y, i) => ({ x: `d${i}`, y })) }]
const cells = {
  chart: { type: 'heatmap', height: 320, toolbar: { show: false }, animations: { enabled: false } },
  series: heatRows(visits),
}

/** Rest the pointer on the centre of cell j. */
async function hoverCell(page, j) {
  const r = await page.locator(`.apexcharts-heatmap-rect[j="${j}"]`).boundingBox()
  await page.mouse.move(r.x + r.width / 2 - 3, r.y + r.height / 2)
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2)
  await advance(page, 100)
}

const grown = [30, 40, 35, 80, 49, 60, 70, 91]
const MARKS = [
  ['a column that grows under the pointer, updateSeries', columns, hoverColumnFoot, 3, (d) => window.chart.updateSeries([{ name: 'Visits', data: d }]), grown, { open: true, value: '80', crosshair: true }],
  ['a column that grows under the pointer, updateOptions', columns, hoverColumnFoot, 3, (d) => window.chart.updateOptions({ series: [{ name: 'Visits', data: d }] }), grown, { open: true, value: '80', crosshair: true }],
  ['a column that shrinks below the pointer', columns, hoverColumnFoot, 3, (d) => window.chart.updateSeries([{ name: 'Visits', data: d }]), [30, 40, 35, 1, 49, 60, 70, 91], { open: false, crosshair: false }],
  ['a marker still under the pointer, updateSeries', markers, hoverMarker, 3, (d) => window.chart.updateSeries([{ name: 'Visits', data: d }]), [30, 40, 35, 51, 49, 60, 70, 91], { open: true, value: '51' }],
  // the first point keeps its place at the left edge as the axis grows
  ['a marker still under the pointer, appendData', markers, hoverMarker, 0, () => window.chart.appendData([{ data: [77] }]), null, { open: true, value: '30' }],
  ['a heatmap cell back under the pointer once the cells have landed', cells, hoverCell, 3, (d) => window.chart.updateOptions({ series: d }), heatRows(grown), { open: true, value: '80' }],
]

for (const [name, opts, hover, j, update, data, want] of MARKS) {
  test(`intersect, ${name}`, async ({ page }) => {
    const errors = await mountChart(page, opts)
    await hover(page, j)
    expect((await page.evaluate(tooltipState)).open).toBe(true)

    await page.evaluate(update, data)
    await advance(page, 2000)

    expect(await page.evaluate(tooltipState)).toMatchObject(want)
    expect(errors).toEqual([])
  })
}

// Scatter flags its animation over as it draws, while its markers still
// ride to their new places, and the replay looks for the mark under the
// pointer once they have landed. The browser may or may not send its own
// mouseout as the marker leaves the resting pointer: held back here, so that
// the replay alone decides.
test('intersect, a scatter marker that rides away from the pointer', async ({ page }) => {
  const errors = await mountChart(page, {
    chart: { type: 'scatter', height: 320, toolbar: { show: false } },
    series: [{ name: 'Visits', data: visits.map((y, i) => [i + 1, y]) }],
  })
  await hoverMarker(page, 3)
  expect((await page.evaluate(tooltipState)).open).toBe(true)
  await page.evaluate(() => {
    for (const p of ['mouse', 'pointer'])
      for (const t of ['over', 'out', 'enter', 'leave', 'move'])
        window.addEventListener(p + t, (e) => e.stopImmediatePropagation(), true)
  })

  // the x axis grows to 30, and the marker of x 4 moves far left
  await page.evaluate(() => window.chart.appendData([{ data: [[30, 77]] }]))
  await advance(page, 2000)

  expect(await page.evaluate(tooltipState)).toMatchObject({ open: false, crosshair: false })
  expect(errors).toEqual([])
})

// A bar's data label waits for its bar's stagger before it rides and
// counts. An update that comes first replaces that render, and the label
// tweens it still held back never start: the replay looks for the mark once
// the new render alone has stopped. The browser's own pointer events are
// held back, as for the scatter marker.
test('intersect, a column that shrinks below the pointer before the labels of a slower update start', async ({ page }) => {
  const errors = await mountChart(page, {
    ...columns,
    chart: { ...columns.chart, animations: { dynamicAnimation: { speed: 4000 } } },
    dataLabels: { enabled: true, animate: { enabled: true }, countUp: { enabled: true } },
  })
  await hoverColumnFoot(page, 3)
  expect((await page.evaluate(tooltipState)).open).toBe(true)
  await page.evaluate(() => {
    for (const p of ['mouse', 'pointer'])
      for (const t of ['over', 'out', 'enter', 'leave', 'move'])
        window.addEventListener(p + t, (e) => e.stopImmediatePropagation(), true)
  })

  await page.evaluate((d) => window.chart.updateSeries([{ name: 'Visits', data: d }]), grown)
  // the last labels' starts are 125 to 175 ms off
  await advance(page, 100)
  await page.evaluate(() =>
    window.chart.updateOptions({
      chart: { animations: { dynamicAnimation: { speed: 100 } } },
      series: [{ name: 'Visits', data: [30, 40, 35, 1, 49, 60, 70, 91] }],
    }),
  )
  // before: open until the held-back label tweens landed, 4 s on
  await advance(page, 1000)

  expect(await page.evaluate(tooltipState)).toMatchObject({ open: false, crosshair: false })
  expect(
    await page.evaluate(() => {
      const gl = window.chart.w.globals
      return { moving: gl.liveTweens?.size ?? 0, replay: !!gl.tooltip.pendingReplay }
    }),
  ).toEqual({ moving: 0, replay: false })
  expect(errors).toEqual([])
})

// A key pressed during the tween hands the tooltip to the keyboard: the
// pointer's replay, still waiting for the tween, must not close it.
test('intersect, a key pressed during the tween keeps the keyboard tooltip', async ({ page }) => {
  const errors = await mountChart(page, columns)
  await hoverColumnFoot(page, 3)
  expect((await page.evaluate(tooltipState)).open).toBe(true)

  await page.evaluate((d) => {
    window.chart.updateSeries([{ name: 'Visits', data: d }])
  }, grown)
  await advance(page, 50)
  await page.evaluate(() => document.querySelector('.apexcharts-svg').focus())
  await page.keyboard.press('Home')
  await advance(page, 2000)

  expect(await page.evaluate(tooltipState)).toMatchObject({ open: true, value: '30' })
  expect(errors).toEqual([])
})

// A tooltip the keyboard opened over columns has no pointer to look under:
// an update closes it in its own frame, rather than leave the old value up
// until the columns land.
test('intersect, a tooltip the keyboard opened closes with the update', async ({ page }) => {
  const errors = await mountChart(page, columns)
  await page.evaluate(() => document.querySelector('.apexcharts-svg').focus())
  await page.keyboard.press('Home')
  await advance(page, 200)
  expect(await page.evaluate(tooltipState)).toMatchObject({ open: true, value: '30' })

  await page.evaluate((d) => {
    window.chart.updateSeries([{ name: 'Visits', data: [86, ...d.slice(1)] }])
  }, visits)
  await advance(page, 50)

  expect((await page.evaluate(tooltipState)).open).toBe(false)
  expect(errors).toEqual([])
})
