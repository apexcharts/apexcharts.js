// The trellis grid card resolves the hovered point the way the panel's own
// tooltip does (tooltip/Utils.getNearestValues):
// - numeric and datetime x follow the data x under the pointer (the nearest
//   point), not a uniform spread of n points over the plot, so a zoomed
//   window or irregular spacing no longer shows another point's values;
// - horizontal bars run their categories down the y axis, so the row under
//   the pointer wins, not the pointer's x along the value axis.
// Category x keeps the divisor rules (trellis-tooltip-hover-index.spec.js).
import { describe, it, expect } from 'vitest'
import TrellisTooltip from '../../src/modules/trellis/TrellisTooltip.js'

/** A numeric-x panel whose state agrees with itself. */
const numericPanel = ({ xs, minX, maxX, gridWidth, type = 'line' }) => ({
  w: {
    config: {
      chart: { type },
      xaxis: {
        type: 'datetime',
        tickPlacement: 'on',
        convertedCatToNumeric: false,
      },
    },
    axisFlags: { isXNumeric: true },
    globals: {
      dataPoints: xs.length,
      barPadForNumericAxis: 0,
      minX,
      maxX,
      seriesX: [xs.slice()],
      isBarHorizontal: false,
    },
    layout: { gridWidth, gridHeight: 100, translateX: 0, translateY: 0 },
    dom: {},
  },
})

const tooltip = (trellis = {}) =>
  new TrellisTooltip(/** @type {any} */ (trellis))

describe('trellis grid tooltip: numeric x', () => {
  it('irregular x spacing resolves the point under the pointer', () => {
    const chart = numericPanel({
      xs: [0, 1, 2, 10],
      minX: 0,
      maxX: 10,
      gridWidth: 400,
    })
    const tt = tooltip()
    // points at px 0, 40, 80, 400
    expect(tt._hoverIndex(chart, 45, 0)).toBe(1)
    expect(tt._hoverIndex(chart, 70, 0)).toBe(2)
    expect(tt._hoverIndex(chart, 300, 0)).toBe(3)
  })

  it('a zoomed window maps its edges to the visible points', () => {
    const xs = Array.from({ length: 200 }, (_, i) => i)
    // zoomed to x 180..199, 20 px per day
    const chart = numericPanel({ xs, minX: 180, maxX: 199, gridWidth: 380 })
    const tt = tooltip()
    expect(tt._hoverIndex(chart, 0, 0)).toBe(180)
    expect(tt._hoverIndex(chart, 205, 0)).toBe(190)
    expect(tt._hoverIndex(chart, 380, 0)).toBe(199)
  })

  it('numeric-x bars resolve by x too, not by slot', () => {
    const chart = numericPanel({
      xs: [0, 1, 2, 10],
      minX: 0,
      maxX: 10,
      gridWidth: 400,
      type: 'bar',
    })
    expect(tooltip()._hoverIndex(chart, 300, 0)).toBe(3)
  })

  it('skips a series hidden from the legend (empty x array)', () => {
    const chart = numericPanel({
      xs: [0, 1, 2, 10],
      minX: 0,
      maxX: 10,
      gridWidth: 400,
    })
    chart.w.globals.seriesX = [[], [0, 1, 2, 10]]
    expect(tooltip()._hoverIndex(chart, 300, 0)).toBe(3)
  })
})

describe('trellis grid tooltip: horizontal bars', () => {
  const chart = {
    w: {
      config: {
        chart: { type: 'bar' },
        plotOptions: { bar: { horizontal: true } },
        xaxis: { tickPlacement: 'on', convertedCatToNumeric: false },
      },
      axisFlags: { isXNumeric: false },
      globals: {
        dataPoints: 6,
        barPadForNumericAxis: 0,
        isBarHorizontal: true,
      },
      layout: { gridWidth: 400, gridHeight: 300, translateX: 0, translateY: 0 },
      dom: {},
    },
  }
  const tt = tooltip()

  it('sliding along the top bar keeps the top category', () => {
    // six 50px rows; y=25 is the first category
    expect(tt._hoverIndex(chart, 10, 25)).toBe(0)
    expect(tt._hoverIndex(chart, 390, 25)).toBe(0)
  })

  it('moving down between bars changes the category', () => {
    expect(tt._hoverIndex(chart, 10, 75)).toBe(1)
    expect(tt._hoverIndex(chart, 10, 275)).toBe(5)
    expect(tt._hoverIndex(chart, 10, 300)).toBe(5)
  })
})
