import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Issue apexcharts/apexcharts.js#4787: a stepline null drops the step after
// that point, and also the horizontal run that belongs to the point before
// it. The run should stay; only the step after the null should go.

const DATA = [2, 4, 1, 2, 0, 2, 4, null, 2, 0]
const NULL_AT = 7

const chartOf = (data, curve, type = 'line') => {
  const chart = createChartWithOptions({
    chart: { type, width: 600, height: 300 },
    stroke: { curve },
    series: [{ data }],
  })
  const nodes = [
    ...chart.el.querySelectorAll(
      type === 'area' ? 'path.apexcharts-area' : 'path.apexcharts-line',
    ),
  ]
  const stroke =
    nodes.find((n) => n.getAttribute('fill') === 'none') || nodes[0]
  const fill = nodes.find((n) => n.getAttribute('fill') !== 'none')
  return {
    chart,
    line: stroke?.getAttribute('d') || '',
    area: fill?.getAttribute('d') || '',
    xs: chart.w.globals.seriesXvalues[0].slice(),
    ys: chart.w.globals.seriesYvalues[0].slice(),
  }
}

describe('stepline with a null datum', () => {
  it('keeps the horizontal run up to the null and drops only the step after it', () => {
    const filled = chartOf(
      DATA.map((v, i) => (i === NULL_AT ? DATA[NULL_AT - 1] : v)),
      'stepline',
    )
    const gapped = chartOf(DATA, 'stepline')
    const xNull = filled.xs[NULL_AT]
    const xPrev = filled.xs[NULL_AT - 1]
    const yPrev = filled.ys[NULL_AT - 1]
    const xNext = gapped.xs[NULL_AT + 1]
    const yNext = gapped.ys[NULL_AT + 1]

    // The run at the value before the null reaches the null's x, and the
    // next command is a fresh subpath at the following point. No vertical
    // step crosses the gap.
    expect(gapped.line).toContain(`H ${xPrev} V ${yPrev} H ${xNull}`)
    expect(gapped.line.split(`H ${xNull}`)[1].startsWith(` M ${xNext} ${yNext}`)).toBe(
      true,
    )
    // Without the null, that same x is an ordinary step, not a gap.
    expect(filled.line).toContain(`H ${xNull} V`)
    filled.chart.destroy()
    gapped.chart.destroy()
  })

  it('fills the area under that run and no further', () => {
    const filled = chartOf(
      DATA.map((v, i) => (i === NULL_AT ? DATA[NULL_AT - 1] : v)),
      'stepline',
      'area',
    )
    const gapped = chartOf(DATA, 'stepline', 'area')
    const xNull = filled.xs[NULL_AT]
    const yZero = filled.ys[DATA.indexOf(0)]
    const xNext = gapped.xs[NULL_AT + 1]
    const yNext = gapped.ys[NULL_AT + 1]

    expect(gapped.line).toContain(`H ${xNull}`)
    expect(gapped.line.split(`H ${xNull}`)[1].startsWith(` M ${xNext} ${yNext}`)).toBe(
      true,
    )
    // The fill follows the stroke out to the null, then down to the baseline.
    expect(gapped.area).toContain(`H ${xNull} L ${xNull} ${yZero}`)
    filled.chart.destroy()
    gapped.chart.destroy()
  })

  it('draws that same run when the point before the null is isolated', () => {
    const filled = chartOf([4, 4, 2, 0], 'stepline')
    const gapped = chartOf([4, null, 2, 0], 'stepline')
    const x0 = filled.xs[0]
    const y0 = filled.ys[0]
    const xNull = filled.xs[1]

    expect(gapped.line).toContain(`M ${x0} ${y0} H ${xNull}`)
    expect(gapped.line).not.toContain(`H ${xNull} V`)
    filled.chart.destroy()
    gapped.chart.destroy()
  })

  it.each(['straight', 'linestep'])(
    'does not extend a %s segment into the null',
    (curve) => {
      const filled = chartOf(
        DATA.map((v, i) => (i === NULL_AT ? DATA[NULL_AT - 1] : v)),
        curve,
      )
      const gapped = chartOf(DATA, curve)
      const xNull = String(filled.xs[NULL_AT])
      expect(gapped.line.includes(xNull)).toBe(false)
      filled.chart.destroy()
      gapped.chart.destroy()
    },
  )
})
