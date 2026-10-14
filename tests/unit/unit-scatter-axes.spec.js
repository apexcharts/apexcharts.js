import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import '../../src/entries/unit.js'
import ApexCharts from '../../src/entries/standard.js'
import Graphics from '../../src/modules/Graphics.js'

// What users saw on unit scatter / beeswarm axes:
// - ticks 0.001 .. 0.005 all read "0" except the last (labels were fixed
//   at two decimals);
// - a pinned beeswarm range with one far outlier drew ~2000 ticks and
//   gridlines;
// - a 2D scatter with a pinned window drew points outside it over the axis
//   labels or off the chart;
// - long beeswarm lane labels ran off the left edge of a fixed 92px gutter.

let chart

async function mount(series, scatter, width = 600) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), {
    chart: { type: 'unit', width, height: 400, animations: { enabled: false } },
    series,
    plotOptions: { unit: { layout: 'scatter', scatter } },
  })
  await chart.render()
  return chart
}

const q = (sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]

afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

describe('scatter ticks', () => {
  it('labels small steps with enough decimals to tell them apart', async () => {
    await mount([{ name: 'A', data: [0.001, 0.003, 0.005] }], {
      xMin: 0.001,
      xMax: 0.005,
      tickAmount: 5,
    })
    const labels = q('.apexcharts-unit-tick').map((t) => t.textContent)
    expect(labels).toEqual(['0.001', '0.002', '0.003', '0.004', '0.005'])
  })

  it('keeps two decimals for ordinary fractional steps', async () => {
    await mount([{ name: 'A', data: [0, 1] }], { xMin: 0, xMax: 1, tickAmount: 5 })
    expect(q('.apexcharts-unit-tick').map((t) => t.textContent)).toEqual([
      '0',
      '0.25',
      '0.5',
      '0.75',
      '1',
    ])
  })

  it('re-scales a pinned range that a far outlier would stretch to thousands of ticks', async () => {
    await mount([{ name: 'A', data: [0.2, 0.5, 0.8, 500] }], { xMin: 0, xMax: 1, tickAmount: 5 })
    const ticks = q('.apexcharts-unit-tick')
    expect(ticks.length).toBeLessThan(12)
    expect(+ticks[ticks.length - 1].textContent).toBeGreaterThanOrEqual(500)
  })

  it('still extends a pinned range by whole steps for a near outlier', async () => {
    await mount([{ name: 'A', data: [0.2, 1.3] }], { xMin: 0, xMax: 1, tickAmount: 5 })
    expect(q('.apexcharts-unit-tick').map((t) => t.textContent)).toEqual([
      '0',
      '0.25',
      '0.5',
      '0.75',
      '1',
      '1.25',
      '1.5',
    ])
  })
})

describe('2D scatter with a pinned window', () => {
  it('extends the window like the beeswarm so every point stays in the plot', async () => {
    await mount([{ name: 'A', data: [{ x: 5, y: 5 }, { x: 50, y: 50 }, { x: 200, y: -40 }] }], {
      y: 'value',
      xMin: 0,
      xMax: 100,
      yMin: 0,
      yMax: 100,
    })
    const { gridWidth, gridHeight } = chart.w.layout
    q('.apexcharts-unit-area').forEach((d) => {
      expect(+d.getAttribute('cx')).toBeLessThanOrEqual(gridWidth)
      expect(+d.getAttribute('cy')).toBeLessThanOrEqual(gridHeight)
    })
    const labels = q('.apexcharts-unit-tick').map((t) => t.textContent)
    expect(labels).toContain('200')
    expect(labels).toContain('-50')
  })

  it.each([{ yMin: 0 }, { xMin: 0 }, { xMin: 0, yMin: 0 }, { yMax: 100 }])(
    'keeps nice ticks when only one end is pinned (%o)',
    async (pin) => {
      await mount(
        [
          {
            name: 'A',
            data: [
              { x: 3.2, y: 12.7 },
              { x: 41.9, y: 87.3 },
              { x: 77.1, y: 55.5 },
            ],
          },
        ],
        { y: 'value', ...pin },
      )
      const labels = q('.apexcharts-unit-tick').map((t) => +t.textContent)
      expect(labels).toContain(0)
      labels.forEach((v) => expect(v % 20).toBe(0))
    },
  )
})

it('steps a beeswarm with one pinned end by a nice spacing', async () => {
  await mount([{ name: 'A', data: [12, 47, 90] }], { xMin: 0 })
  expect(q('.apexcharts-unit-tick').map((t) => t.textContent)).toEqual([
    '0',
    '20',
    '40',
    '60',
    '80',
    '100',
  ])
})

describe('beeswarm lane labels', () => {
  const lanes = (names) => names.map((name, i) => ({ name, data: [10 + i, 20 + i] }))
  const laneX = () => +q('.apexcharts-unit-lane-label')[0].getAttribute('x')
  // jsdom cannot measure text: 7px per character at the drawn 12px / 600.
  beforeEach(() => {
    vi.spyOn(Graphics.prototype, 'getTextRects').mockImplementation((text) => ({
      width: String(text).length * 7,
      height: 14,
    }))
  })

  it('sizes the gutter to the widest label', async () => {
    await mount(lanes(['A', 'B']), {})
    const narrow = laneX()
    chart.destroy()
    await mount(lanes(['Customer Success', 'B']), {})
    const wide = laneX()
    expect(narrow).toBeLessThan(60)
    expect(wide).toBeGreaterThan(narrow + 60)
    // Right-aligned at x, so the label starts inside the chart.
    expect(wide - 'Customer Success'.length * 7).toBeGreaterThanOrEqual(0)
  })

  it('shortens a label wider than a third of the plot with an ellipsis', async () => {
    await mount(lanes(['Customer Success and Retention Operations', 'B']), {})
    const label = q('.apexcharts-unit-lane-label')[0].textContent
    expect(label.endsWith('…')).toBe(true)
    expect(label.length).toBeLessThan(30)
    expect(laneX()).toBeLessThanOrEqual(chart.w.layout.gridWidth / 3)
  })
})
