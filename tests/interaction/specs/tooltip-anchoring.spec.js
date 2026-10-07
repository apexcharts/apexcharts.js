/**
 * Where the tooltip box lands relative to what it captions, for three
 * placement defects that each put a correct box in the wrong place.
 *
 * 1. The pointer has to come from the event being handled. Pie/donut slices
 *    (and a treemap with followCursor) placed the box at `w.interact.clientX/Y`,
 *    which a listener on the chart's root fills in only AFTER the series
 *    listener has run. The first move into a slice therefore opened the box
 *    wherever the pointer had been before (hundreds of px away when it jumped
 *    in from the page corner), and a treemap box trailed the pointer by one
 *    event.
 *
 * 2. A point on the plot's top edge has y = 0, which is a position and not a
 *    missing value. `cy || gridHeight` sent a shared line tooltip (markers
 *    size 0) and a shared column tooltip to the plot BOTTOM for the series'
 *    highest point, and `cy > 0` skipped the hover dot for it.
 *
 * 3. `tooltip.arrow: false` should hide the arrow and nothing else. It used a
 *    grid-px rule without translateY, so on a chart with a title, subtitle or
 *    top legend the box rode up by their height; on a scatter it lifted the box
 *    1.4x its height above the marker.
 *
 * Every assertion is geometry read off the page (box vs point vs plot), since
 * in each case the box was shown with the right content, only elsewhere.
 * Charts are mounted ad hoc from the built UMD bundle with animations off, and
 * the tooltip's left/top transition is switched off so a box is read where it
 * lands rather than part way there.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = resolve(__dirname, '..', '..', '..', 'dist', 'apexcharts.js')

/** Mount a chart from an options source string; returns the page errors. */
async function mount(page, optsSrc, { width = 600 } = {}) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.setContent(
    `<style>
      body { margin: 0 }
      #chart { margin: 60px 0 0 60px }
      .apexcharts-tooltip { transition: none !important }
    </style>
    <div id="chart" style="width:${width}px"></div>`,
  )
  await page.addScriptTag({ path: distPath })
  await page.evaluate(async (src) => {
    const opts = eval(`(${src})`)
    opts.chart = { ...(opts.chart || {}), animations: { enabled: false } }
    window.chart = new window.ApexCharts(document.querySelector('#chart'), opts)
    await window.chart.render()
  }, optsSrc)
  // Not `animationEnded`: a treemap drawn with animations off never sets it.
  // With nothing animating, the chart is final once render() has resolved.
  await page.waitForTimeout(150)
  return errors
}

/** The plot area in client px, from the chart's own layout. */
const readPlot = (page) =>
  page.evaluate(() => {
    const w = window.chart.w
    const wrap = w.dom.elWrap.getBoundingClientRect()
    const left = wrap.left + w.layout.translateX
    const top = wrap.top + w.layout.translateY
    return {
      left,
      top,
      right: left + w.layout.gridWidth,
      bottom: top + w.layout.gridHeight,
      translateY: w.layout.translateY,
    }
  })

/** Data point (series s, index j) in client px, plus its grid-px y. */
const readPoint = (page, s, j) =>
  page.evaluate(
    ({ s, j }) => {
      const w = window.chart.w
      const wrap = w.dom.elWrap.getBoundingClientRect()
      const [px, py] = w.globals.pointsArray[s][j]
      return {
        x: wrap.left + w.layout.translateX + px,
        y: wrap.top + w.layout.translateY + py,
        gridY: py,
      }
    },
    { s, j },
  )

/** The tooltip box in client px, and whether it is showing. */
const readBox = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('.apexcharts-tooltip')
    const r = el.getBoundingClientRect()
    return {
      active: el.classList.contains('apexcharts-active'),
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      centreX: r.left + r.width / 2,
      centreY: r.top + r.height / 2,
    }
  })

/** Enter at a small offset, then move onto (x, y): the move the box answers. */
async function hover(page, x, y, settle = 200) {
  await page.mouse.move(x - 3, y - 3)
  await page.waitForTimeout(80)
  await page.mouse.move(x, y)
  await page.waitForTimeout(settle)
}

const WEEK = `['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']`

test.describe('the pointer comes from the event, not the last root mousemove', () => {
  for (const type of ['pie', 'donut']) {
    test(`${type}: the FIRST move into a slice opens the box over the pointer`, async ({
      page,
    }) => {
      const errors = await mount(
        page,
        `{
          chart: { type: '${type}', height: 300 },
          series: [44, 55, 41, 17, 15],
          labels: ['Direct', 'Search', 'Referral', 'Social', 'Email'],
          legend: { show: false },
        }`,
        { width: 400 },
      )
      // The pointer branch, not the slice-centroid one (intersect: true).
      expect(
        await page.evaluate(() => window.chart.w.config.tooltip.intersect),
      ).toBe(false)

      // On the ring at 82% of the radius, below-right of the centre: inside a
      // donut's ring as well as a pie, with room above for the box.
      const target = await page.evaluate(() => {
        const rs = [...document.querySelectorAll('.apexcharts-pie-area')].map(
          (p) => p.getBoundingClientRect(),
        )
        const left = Math.min(...rs.map((r) => r.left))
        const right = Math.max(...rs.map((r) => r.right))
        const top = Math.min(...rs.map((r) => r.top))
        const bottom = Math.max(...rs.map((r) => r.bottom))
        const d = ((right - left) / 2) * 0.82 * Math.SQRT1_2
        const x = (left + right) / 2 + d
        const y = (top + bottom) / 2 + d
        const hit = document.elementFromPoint(x, y)
        return { x, y, onSlice: !!hit?.closest('.apexcharts-pie-area') }
      })
      expect(target.onSlice, 'the target point is not on a slice').toBe(true)

      // Parked outside the chart, then ONE move straight onto the slice: no
      // steps and no nudge, so the root listener has never seen this pointer
      // when the slice's listener places the box.
      await page.mouse.move(5, 5)
      await page.waitForTimeout(150)
      await page.mouse.move(target.x, target.y)
      await page.waitForTimeout(120)

      const box = await readBox(page)
      expect(box.active).toBe(true)
      expect(
        Math.abs(box.centreX - target.x),
        'box centre x vs pointer x',
      ).toBeLessThanOrEqual(3)
      // Resting 10px above the pointer.
      const above = target.y - box.bottom
      expect(above, 'box bottom above the pointer').toBeGreaterThanOrEqual(8)
      expect(above, 'box bottom above the pointer').toBeLessThanOrEqual(14)
      expect(errors).toHaveLength(0)
    })
  }

  test('treemap with followCursor: the box tracks the latest pointer, not the previous one', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      `{
        chart: { type: 'treemap', height: 400 },
        series: [{ data: [
          { x: 'Retail', y: 600 },
          { x: 'Online', y: 100 },
          { x: 'Partners', y: 80 },
          { x: 'Other', y: 60 },
        ] }],
        legend: { show: false },
      }`,
    )
    expect(
      await page.evaluate(() => window.chart.w.config.tooltip.followCursor),
    ).toBe(true)

    // Three points well inside the largest tile, so the box shows the same
    // label throughout and no plot-edge clamp is involved.
    const tile = await page.evaluate(() => {
      const rs = [...document.querySelectorAll('.apexcharts-treemap-rect')].map(
        (r) => r.getBoundingClientRect(),
      )
      rs.sort((a, b) => b.width * b.height - a.width * a.height)
      const r = rs[0]
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
    })
    const p0 = { x: tile.cx - 40, y: tile.cy - 30 }
    const p1 = { x: tile.cx - 10, y: tile.cy + 10 }
    const p2 = { x: tile.cx + 30, y: tile.cy - 20 }

    // An edge of the box sits on the pointer (which edge depends on the tile).
    const offBy = (box, p) =>
      Math.max(
        Math.min(Math.abs(box.left - p.x), Math.abs(box.right - p.x)),
        Math.min(Math.abs(box.top - p.y), Math.abs(box.bottom - p.y)),
      )

    await hover(page, p0.x, p0.y)
    await page.mouse.move(p1.x, p1.y)
    await page.waitForTimeout(120)
    const b1 = await readBox(page)
    expect(b1.active).toBe(true)
    expect(offBy(b1, p1), 'after move 1, box vs pointer').toBeLessThanOrEqual(2)

    await page.mouse.move(p2.x, p2.y)
    await page.waitForTimeout(120)
    const b2 = await readBox(page)
    expect(offBy(b2, p2), 'after move 2, box vs pointer').toBeLessThanOrEqual(2)
    // and not where the pointer was one event earlier
    expect(
      offBy(b2, p1),
      'after move 2, box vs the previous pointer',
    ).toBeGreaterThan(10)
    expect(errors).toHaveLength(0)
  })
})

test.describe('a point on the plot top (y = 0) is a position, not a missing value', () => {
  const LINE = (tooltip) => `{
    chart: { type: 'line', height: 350 },
    series: [
      { name: 'Sessions', data: [30, 55, 100, 45, 70, 20, 60] },
      { name: 'Signups', data: [10, 25, 40, 20, 35, 15, 30] },
    ],
    xaxis: { categories: ${WEEK} },
    yaxis: { min: 0, max: 100 },
    dataLabels: { enabled: false },
    tooltip: ${tooltip},
  }`

  test('shared line: the box over the highest point is at the plot top, never the bottom', async ({
    page,
  }) => {
    const errors = await mount(page, LINE(`{ shared: true, intersect: false }`))
    const plot = await readPlot(page)
    const point = await readPoint(page, 0, 2)
    expect(point.gridY, 'the hovered point sits on the plot top').toBe(0)

    await hover(page, point.x, (plot.top + plot.bottom) / 2)
    const box = await readBox(page)
    expect(box.active).toBe(true)

    const overlapsPoint = box.top <= point.y && box.bottom >= point.y
    const atPlotTop = Math.abs(box.top - plot.top) <= 2
    expect(
      overlapsPoint || atPlotTop,
      `box ${box.top}..${box.bottom}, point ${point.y}, plot top ${plot.top}`,
    ).toBe(true)
    expect(
      Math.abs(box.bottom - plot.bottom),
      'box sits at the plot bottom',
    ).toBeGreaterThan(2)
    expect(errors).toHaveLength(0)
  })

  test('shared: false, intersect: false: the hover dot is drawn on a y = 0 point', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      LINE(`{ shared: false, intersect: false }`),
    )
    const plot = await readPlot(page)
    const point = await readPoint(page, 0, 2)
    expect(point.gridY).toBe(0)

    // Just under the point, so series 0 is the one captured.
    await hover(page, point.x, plot.top + 6)
    expect((await readBox(page)).active).toBe(true)

    const dot = await page.evaluate(() => {
      const p = document.querySelector(
        ".apexcharts-series[data\\:realIndex='0'] .apexcharts-series-markers path",
      )
      if (!p) return null
      const r = p.getBoundingClientRect()
      return {
        d: p.getAttribute('d') || '',
        w: r.width,
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      }
    })
    expect(dot, 'no hover-dot path for series 0').not.toBeNull()
    expect(dot.d.trim(), 'hover dot has no path').not.toBe('')
    expect(dot.w).toBeGreaterThan(0)
    expect(Math.abs(dot.x - point.x), 'dot x vs point x').toBeLessThanOrEqual(3)
    expect(Math.abs(dot.y - point.y), 'dot y vs point y').toBeLessThanOrEqual(3)
    expect(errors).toHaveLength(0)
  })

  test('shared column: a bar reaching the y-axis max puts the box at the plot top', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      `{
        chart: { type: 'bar', height: 350 },
        series: [
          { name: 'Revenue', data: [40, 100, 60, 75] },
          { name: 'Cost', data: [30, 50, 20, 45] },
        ],
        xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
        yaxis: { min: 0, max: 100 },
        dataLabels: { enabled: false },
        tooltip: { shared: true, intersect: false },
      }`,
    )
    const plot = await readPlot(page)
    const bar = await page.evaluate(() => {
      const p = document.querySelector(
        ".apexcharts-bar-series .apexcharts-series[rel='1'] path[j='1']",
      )
      const r = p.getBoundingClientRect()
      return { x: r.left + r.width / 2, top: r.top }
    })
    expect(
      Math.abs(bar.top - plot.top),
      'the Q2 bar reaches the plot top',
    ).toBeLessThanOrEqual(1)

    await hover(page, bar.x, (plot.top + plot.bottom) / 2)
    const box = await readBox(page)
    expect(box.active).toBe(true)
    expect(
      Math.abs(box.top - plot.top),
      `box top ${box.top} vs plot top ${plot.top} (plot bottom ${plot.bottom})`,
    ).toBeLessThanOrEqual(2)
    expect(errors).toHaveLength(0)
  })
})

test.describe('tooltip.arrow: false hides the arrow, it does not move the box', () => {
  const LINE = (arrow, chrome) => `{
    chart: { type: 'line', height: 400 },
    series: [{ name: 'Visitors', data: [20, 45, 60, 50, 35, 55, 40] }],
    xaxis: { categories: ${WEEK} },
    yaxis: { min: 0, max: 100 },
    dataLabels: { enabled: false },
    tooltip: { arrow: ${arrow} },
    ${
      chrome
        ? `title: { text: 'Weekly visitors', style: { fontSize: '30px' } },
           subtitle: { text: 'All regions, rolling 7 days', style: { fontSize: '20px' } },
           legend: { show: true, showForSingleSeries: true, position: 'top', fontSize: '18px' },`
        : `legend: { show: false },`
    }
  }`

  /** Hover Thursday (value 50, mid-plot) and read the box and the point. */
  async function measure(page, arrow, chrome) {
    const errors = await mount(page, LINE(arrow, chrome))
    const plot = await readPlot(page)
    const point = await readPoint(page, 0, 3)
    await hover(page, point.x, (plot.top + plot.bottom) / 2)
    const box = await readBox(page)
    expect(box.active).toBe(true)
    expect(errors).toHaveLength(0)
    return { box, point, plot }
  }

  for (const chrome of [false, true]) {
    const label = chrome
      ? 'with a large title, subtitle and top legend'
      : 'bare'
    test(`line chart, ${label}: centred on the point, same top as arrow mode`, async ({
      page,
    }) => {
      const off = await measure(page, false, chrome)
      if (chrome) {
        // The case that broke: a lot of chart above the plot.
        expect(off.plot.translateY).toBeGreaterThan(90)
      }
      expect(
        Math.abs(off.box.centreY - off.point.y),
        `box centre ${off.box.centreY} vs point ${off.point.y}`,
      ).toBeLessThanOrEqual(6)

      const on = await measure(page, true, chrome)
      expect(
        Math.abs(on.box.top - off.box.top),
        `arrow on top ${on.box.top} vs off top ${off.box.top}`,
      ).toBeLessThanOrEqual(1)
    })
  }

  test('scatter: the box sits beside the hovered marker, centred on it', async ({
    page,
  }) => {
    const errors = await mount(
      page,
      `{
        chart: { type: 'scatter', height: 400 },
        series: [{ name: 'Samples', data: [
          [10, 20], [20, 62], [30, 48], [40, 75], [50, 35], [60, 52], [70, 85], [80, 30],
        ] }],
        xaxis: { type: 'numeric', min: 0, max: 90, tickAmount: 9 },
        yaxis: { min: 0, max: 100 },
        tooltip: { arrow: false },
      }`,
    )
    const plot = await readPlot(page)
    const marker = await page.evaluate(() => {
      const m = document.querySelector(
        ".apexcharts-series[data\\:realIndex='0'] .apexcharts-marker[rel='2']",
      )
      const r = m.getBoundingClientRect()
      return {
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
      }
    })

    await hover(page, marker.x, marker.y)
    const box = await readBox(page)
    expect(box.active).toBe(true)

    // Re-read the marker: hovering enlarges it, and the box has to clear that.
    const grown = await page.evaluate(() => {
      const r = document
        .querySelector(
          ".apexcharts-series[data\\:realIndex='0'] .apexcharts-marker[rel='2']",
        )
        .getBoundingClientRect()
      return { left: r.left, right: r.right }
    })
    const beside = box.left >= grown.right - 1 || box.right <= grown.left + 1
    expect(
      beside,
      `box ${box.left}..${box.right} overlaps marker ${grown.left}..${grown.right}`,
    ).toBe(true)

    const clamped =
      Math.abs(box.top - plot.top) <= 1 ||
      Math.abs(box.bottom - plot.bottom) <= 1
    if (!clamped) {
      expect(
        Math.abs(box.centreY - marker.y),
        `box centre ${box.centreY} vs marker ${marker.y}`,
      ).toBeLessThanOrEqual(6)
    }
    expect(errors).toHaveLength(0)
  })
})
