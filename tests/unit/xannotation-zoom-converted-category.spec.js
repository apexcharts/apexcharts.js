import { describe, test, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import Annotations from '../../src/modules/annotations/Annotations.js'
import Helpers from '../../src/modules/annotations/Helpers.js'

// A line chart whose x values are strings and which names no xaxis.type (an
// ISO date as a .NET DateTime serializes, Blazor-ApexCharts #557) gets a
// category axis converted to numeric. Its `labelData.labels` holds only the
// ticks of the visible window, so after a zoom an annotation end outside that
// window found no label to read, came back as the raw string, and was
// clipped to 0. A range whose window lay entirely inside it then drew 0px
// wide and vanished.

const settle = () => new Promise((r) => setTimeout(r, 0))

const HOURS = 24
const PER_HOUR = 6
// '2024-12-19T00:00:00', '2024-12-19T00:10:00', ... one point per 10 minutes
const iso = (/** @type {number} */ i) =>
  new Date(Date.UTC(2024, 11, 19) + i * 600000)
    .toISOString()
    .replace('.000Z', '')
// 1-based slot (the converted axis' x) of hour h
const slot = (/** @type {number} */ h) => h * PER_HOUR + 1

/** @type {any[]} */
let charts = []

afterEach(() => {
  charts.forEach((c) => {
    try {
      c.destroy()
    } catch (e) {
      // ignore teardown noise from jsdom
    }
  })
  charts = []
})

/**
 * @param {Record<string, any>} [extra]
 */
async function render(extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const data = Array.from({ length: HOURS * PER_HOUR }, (_, i) => ({
    x: iso(i),
    y: 50 + (i % 7),
  }))
  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type: 'line',
      width: 900,
      height: 400,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    series: [{ name: 'Net Profit', data }],
    annotations: {
      xaxis: [
        {
          id: 'band',
          x: iso(slot(0) - 1),
          x2: iso(slot(12) - 1),
          fillColor: '#fcba03',
        },
      ],
    },
    ...extra,
  })
  charts.push(chart)
  await chart.render()
  await settle()
  return chart
}

/** @param {any} chart @param {Record<string, any>} anno */
function x1x2(chart, anno) {
  const helpers = new Helpers(new Annotations(chart.w))
  return {
    x1: helpers.getX1X2('x1', anno),
    x2: anno.x2 === undefined ? undefined : helpers.getX1X2('x2', anno),
  }
}

/** @param {any} chart */
function bandRect(chart) {
  const rect = chart.el.querySelector('.apexcharts-annotation-rect.band')
  return {
    x: Number(rect.getAttribute('x')),
    width: Number(rect.getAttribute('width')),
  }
}

describe('x range annotation on a zoomed converted category axis (#557)', () => {
  test('the axis under test is a converted category axis', async () => {
    const chart = await render()
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(true)
  })

  test('a window inside the range clamps both ends to the grid edges', async () => {
    const chart = await render()
    chart.zoomX(slot(2), slot(6))
    await settle()
    const w = chart.w
    expect(w.globals.minX).toBe(slot(2))
    // The window's labels no longer list either end of the band.
    expect(w.labelData.labels).not.toContain(slot(0))
    expect(w.labelData.labels).not.toContain(slot(12))

    const { x1, x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    expect(x1).toEqual({ x: 0, clipped: true })
    expect(x2).toEqual({ x: w.layout.gridWidth, clipped: true })

    const rect = bandRect(chart)
    expect(rect.x).toBe(0)
    expect(rect.width).toBeCloseTo(w.layout.gridWidth, 6)
  })

  test('a window overlapping the range fills from the left edge to x2', async () => {
    const chart = await render()
    chart.zoomX(slot(10), slot(14))
    await settle()
    const w = chart.w
    const { x1, x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    expect(x1).toEqual({ x: 0, clipped: true })
    // x2 (hour 12) sits halfway through the 10:00 to 14:00 window
    expect(x2.clipped).toBe(false)
    expect(x2.x).toBeCloseTo(w.layout.gridWidth / 2, 0)
    expect(bandRect(chart).width).toBeCloseTo(x2.x, 6)
  })

  test('a window overlapping the start of the range fills from x to the right edge', async () => {
    const chart = await render({
      annotations: {
        xaxis: [
          { id: 'band', x: iso(slot(13) - 1), x2: iso(slot(20) - 1) },
        ],
      },
    })
    chart.zoomX(slot(10), slot(14))
    await settle()
    const w = chart.w
    const { x1, x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    // x (hour 13) sits three quarters through the 10:00 to 14:00 window.
    // Clamping the off-window x2 to 0 used to swap the ends and paint the
    // band over 10:00 to 13:00, the part of the window it does not cover.
    expect(x1.clipped).toBe(false)
    expect(x1.x).toBeCloseTo((w.layout.gridWidth * 3) / 4, 0)
    expect(x2).toEqual({ x: w.layout.gridWidth, clipped: true })
    const rect = bandRect(chart)
    expect(rect.x).toBeCloseTo(x1.x, 6)
    expect(rect.x + rect.width).toBeCloseTo(w.layout.gridWidth, 6)
  })

  test('a window past the range draws it 0px wide at the left edge', async () => {
    const chart = await render()
    chart.zoomX(slot(14), slot(18))
    await settle()
    const { x1, x2 } = x1x2(chart, chart.w.config.annotations.xaxis[0])
    expect(x1).toEqual({ x: 0, clipped: true })
    expect(x2).toEqual({ x: 0, clipped: true })
    expect(bandRect(chart).width).toBe(0)
  })

  test('a window before the range draws it 0px wide at the right edge', async () => {
    const chart = await render({
      annotations: {
        xaxis: [
          { id: 'band', x: iso(slot(13) - 1), x2: iso(slot(20) - 1) },
        ],
      },
    })
    chart.zoomX(slot(2), slot(6))
    await settle()
    const w = chart.w
    const { x1, x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    expect(x1).toEqual({ x: w.layout.gridWidth, clipped: true })
    expect(x2).toEqual({ x: w.layout.gridWidth, clipped: true })
    expect(bandRect(chart).width).toBe(0)
  })

  test('an in-window end is placed where it was before the fix', async () => {
    const chart = await render()
    chart.zoomX(slot(10), slot(14))
    await settle()
    const w = chart.w
    // hour 12 is a tick of the window, so it is still read off its label
    const idx = w.labelData.labels.indexOf(slot(12))
    expect(idx).toBeGreaterThan(-1)
    const label = chart.el.querySelector(
      `.apexcharts-xaxis-texts-g text:nth-child(${idx + 1})`,
    )
    const { x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    expect(x2.x).toBe(parseFloat(label.getAttribute('x')))
  })

  test('x line and point annotations outside the window are hidden, not misplaced', async () => {
    const chart = await render({
      annotations: {
        xaxis: [{ id: 'line-out', x: iso(slot(1) - 1) }],
        points: [
          {
            id: 'point-out',
            x: iso(slot(1) - 1),
            y: 50,
            marker: { size: 6 },
          },
          {
            id: 'point-in',
            x: iso(slot(4) - 1),
            y: 50,
            marker: { size: 6 },
          },
        ],
      },
    })
    chart.zoomX(slot(2), slot(6))
    await settle()
    const w = chart.w
    const [out, inside] = w.config.annotations.points
    expect(x1x2(chart, w.config.annotations.xaxis[0]).x1.clipped).toBe(true)
    expect(x1x2(chart, out).x1.clipped).toBe(true)
    const placed = x1x2(chart, inside).x1
    expect(placed.clipped).toBe(false)
    // hour 4 sits halfway through the 02:00 to 06:00 window
    expect(placed.x).toBeCloseTo(w.layout.gridWidth / 2, 0)

    expect(chart.el.querySelectorAll('.apexcharts-xaxis-annotations line').length).toBe(0)
    expect(chart.el.querySelectorAll('.point-out').length).toBe(0)
    expect(chart.el.querySelectorAll('.point-in').length).toBeGreaterThan(0)
  })

  test('a string that names no category still clips', async () => {
    const chart = await render()
    chart.zoomX(slot(2), slot(6))
    await settle()
    const { x1 } = x1x2(chart, { x: 'not-a-category' })
    expect(x1).toEqual({ x: 0, clipped: true })
  })

  test('unzoomed, the band spans its categories as before', async () => {
    const chart = await render()
    const w = chart.w
    const { x1, x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    expect(x1.x).toBeCloseTo(0, 6)
    // hour 12 of a 24h (143 step) axis
    expect(x2.x).toBeCloseTo(
      ((slot(12) - 1) / (HOURS * PER_HOUR - 1)) * w.layout.gridWidth,
      6,
    )
  })
})

describe('numeric and datetime axes are unaffected', () => {
  test('a datetime range zoomed inside fills the grid', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const t = (/** @type {number} */ i) => Date.UTC(2024, 11, 19) + i * 600000
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'line',
        width: 900,
        height: 400,
        animations: { enabled: false },
        toolbar: { show: false },
      },
      series: [
        {
          data: Array.from({ length: 144 }, (_, i) => ({ x: t(i), y: i % 7 })),
        },
      ],
      xaxis: { type: 'datetime' },
      annotations: { xaxis: [{ id: 'band', x: t(0), x2: t(72) }] },
    })
    charts.push(chart)
    await chart.render()
    await settle()
    chart.zoomX(t(12), t(36))
    await settle()
    const w = chart.w
    expect(w.config.xaxis.convertedCatToNumeric).toBe(false)
    const { x1, x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    expect(x1).toEqual({ x: 0, clipped: true })
    expect(x2).toEqual({ x: w.layout.gridWidth, clipped: true })
  })

  test('a numeric range keeps its projected position', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'line',
        width: 900,
        height: 400,
        animations: { enabled: false },
        toolbar: { show: false },
      },
      series: [
        { data: Array.from({ length: 50 }, (_, i) => ({ x: i, y: i % 7 })) },
      ],
      xaxis: { type: 'numeric' },
      annotations: { xaxis: [{ id: 'band', x: 10, x2: 20 }] },
    })
    charts.push(chart)
    await chart.render()
    await settle()
    chart.zoomX(15, 30)
    await settle()
    const w = chart.w
    const { x1, x2 } = x1x2(chart, w.config.annotations.xaxis[0])
    expect(x1).toEqual({ x: 0, clipped: true })
    expect(x2.clipped).toBe(false)
    expect(x2.x).toBeCloseTo(
      ((20 - w.globals.minX) / w.globals.xRange) * w.layout.gridWidth,
      6,
    )
  })
})
