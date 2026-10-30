import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A line chart with numeric x values and no xaxis.type is converted to a
// numeric axis, and the conversion writes tickAmount: 'dataPoints' as its
// default. Since 8.3 'dataPoints' gives a single series one tick per point
// (239fd9ba1), so this default drew a label for every one of 400 points.
// The automatic value keeps the count it had before (and in 6.5.0): the
// default 10, or one per integer on a range shorter than 30. A tickAmount of
// 'dataPoints' the user sets still gives one tick per point.

const SIZES = [5, 10, 30, 100, 400, 1600]

// x = 1..n and x = 0, 10, 20, ...: one short range, one wide
const SPACINGS = {
  unit: (i) => i + 1,
  tens: (i) => i * 10,
}

const points = (n, f, shape = 'xy') =>
  Array.from({ length: n }, (_, i) =>
    shape === 'pair' ? [f(i), (i * 7) % 11] : { x: f(i), y: (i * 7) % 11 },
  )

const xLabels = () => document.querySelectorAll('.apexcharts-xaxis-label')

let chart
afterEach(() => {
  chart?.destroy()
  chart = undefined
})

const line = (series, xaxis, chartOpts = {}) =>
  (chart = createChartWithOptions({
    chart: { type: 'line', width: 800, height: 300, ...chartOpts },
    series,
    ...(xaxis ? { xaxis } : {}),
  }))

// What 6.5.0 and 8.0 to 8.2 drew for the automatic 'dataPoints' on one series
const before83 = (n, spacing) => {
  const range = Math.round(SPACINGS[spacing](n - 1) - SPACINGS[spacing](0))
  return range < 30 ? range : 10
}

describe('automatic tickAmount on a numeric x axis with no xaxis.type', () => {
  for (const spacing of Object.keys(SPACINGS)) {
    for (const n of SIZES) {
      it(`${n} points, ${spacing} spacing: the count it had before 8.3`, () => {
        const c = line([{ data: points(n, SPACINGS[spacing]) }])
        const x = c.w.config.xaxis
        expect(x.convertedCatToNumeric).toBe(true)
        expect(x.tickAmount).toBe('dataPoints')

        const want = before83(n, spacing)
        expect(c.w.globals.xTickAmount).toBe(want)
        expect(c.w.globals.xAxisScale.result.length).toBe(want + 1)
        expect(xLabels().length).toBe(want + 1)
      })
    }
  }

  it('a short range still gets one tick per point', () => {
    line([{ data: points(5, SPACINGS.unit) }])
    expect([...xLabels()].map((t) => t.textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ])
  })

  it('[x, y] pairs are treated the same as { x, y } objects', () => {
    const c = line([{ data: points(400, SPACINGS.unit, 'pair') }])
    expect(c.w.globals.xTickAmount).toBe(10)
    expect(xLabels().length).toBe(11)
  })

  it('the 400-point axis ends on the data, labels spread across the width', () => {
    const c = line([{ data: points(400, SPACINGS.unit) }])
    const gl = c.w.globals
    expect(gl.xAxisScale.result[0]).toBe(gl.minX)
    expect(gl.xAxisScale.niceMax).toBe(gl.maxX)
    const xs = [...xLabels()].map((t) => +t.getAttribute('x'))
    expect(xs[xs.length - 1] - xs[0]).toBeGreaterThan(gl.gridWidth * 0.9)
  })
})

describe("an explicit tickAmount: 'dataPoints' keeps one tick per point", () => {
  for (const n of SIZES) {
    it(`${n} points, no xaxis.type`, () => {
      const c = line([{ data: points(n, SPACINGS.tens) }], {
        tickAmount: 'dataPoints',
      })
      expect(c.w.globals.xTickAmount).toBe(n - 1)
    })
  }

  it("on xaxis.type: 'numeric'", () => {
    const c = line([{ data: points(400, SPACINGS.unit) }], {
      type: 'numeric',
      tickAmount: 'dataPoints',
    })
    expect(c.w.globals.xTickAmount).toBe(399)
  })
})

describe('cases the automatic value never changed', () => {
  it('several series keep one tick per point, as in 6.5.0', () => {
    const data = points(100, SPACINGS.unit)
    const c = line([{ data }, { data }])
    expect(c.w.globals.xTickAmount).toBe(99)
  })

  it('a single series of category names keeps one tick per name', () => {
    const c = line([
      {
        data: Array.from({ length: 40 }, (_, i) => ({
          x: `c${i}`,
          y: i % 5,
        })),
      },
    ])
    expect(c.w.globals.xTickAmount).toBe(39)
  })

  it('a numeric tickAmount is used as given', () => {
    const c = line([{ data: points(400, SPACINGS.unit) }], { tickAmount: 4 })
    expect(c.w.globals.xTickAmount).toBe(4)
  })

  it("xaxis.type: 'numeric' with no tickAmount sizes ticks to the width", () => {
    const c = line([{ data: points(400, SPACINGS.unit) }], { type: 'numeric' })
    expect(c.w.config.xaxis.tickAmount).toBeUndefined()
    expect(c.w.globals.xTickAmount).toBe(Math.round(c.w.globals.svgWidth / 150))
  })
})

describe('the automatic value across updates', () => {
  it('stays automatic through re-renders, data and option updates', async () => {
    const c = line([{ data: points(400, SPACINGS.unit) }])
    await c.render()
    expect(c.w.globals.xTickAmount).toBe(10)

    await c.updateSeries([{ data: points(600, SPACINGS.tens) }])
    expect(c.w.globals.xTickAmount).toBe(10)

    await c.updateOptions({ xaxis: { labels: { rotate: -30 } } })
    expect(c.w.globals.xTickAmount).toBe(10)

    await c.updateOptions({ title: { text: 't' } })
    expect(c.w.globals.xTickAmount).toBe(10)
  })

  it("an update asking for 'dataPoints' makes it the user's", async () => {
    const c = line([{ data: points(40, SPACINGS.tens) }])
    await c.render()
    expect(c.w.globals.xTickAmount).toBe(10)

    await c.updateOptions({ xaxis: { tickAmount: 'dataPoints' } })
    expect(c.w.globals.xTickAmount).toBe(39)

    // and an unrelated update afterwards does not take it back
    await c.updateOptions({ xaxis: { labels: { rotate: -30 } } })
    expect(c.w.globals.xTickAmount).toBe(39)
    await c.updateSeries([{ data: points(50, SPACINGS.tens) }])
    expect(c.w.globals.xTickAmount).toBe(49)
  })

  it('zoom and reset keep the automatic count', async () => {
    const c = line([{ data: points(400, SPACINGS.unit) }], undefined, {
      zoom: { enabled: true },
    })
    await c.render()
    c.zoomX(50, 250)
    expect(c.w.globals.minX).toBe(50)
    expect(c.w.globals.maxX).toBe(250)
    expect(c.w.globals.xTickAmount).toBe(10)
    c.resetSeries()
    expect(c.w.globals.xTickAmount).toBe(10)
    expect(c.w.globals.xAxisScale.result.length).toBe(11)
  })
})
