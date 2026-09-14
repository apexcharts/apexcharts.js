import ApexCharts from '../../src/entries/full.js'

// Data labels on a 100% stacked chart that is not typed `bar` (#2429).
//
// Defaults.stacked100 wrote `formatter: undefined` onto the user config and
// only replaced it with the percentage formatter for `chart.type === 'bar'`.
// Utils.extend copies an own undefined over the Options default, so a 100%
// stacked combo (typed `line`) or area had NO formatter and threw
// "formatter is not a function" the moment labels were switched on.
//
// The decision for a combo: only the series drawn as bars are slices of the
// 100% total. Their labels read a percentage of the BAR total (the line used
// to be summed into it, stacking the bars to well under 100), and the line's
// labels read its raw value through the plain default formatter.

const CATEGORIES = ['A', 'B', 'C', 'D']
const COL_A = [100, 200, 300, 400]
const COL_B = [50, 60, 70, 80]
const TREND = [180, 290, 400, 510]

const columns = () => [
  { name: 'ColA', type: 'column', data: COL_A },
  { name: 'ColB', type: 'column', data: COL_B },
]
const line = () => ({ name: 'Trend', type: 'line', data: TREND })

const A_PCT = ['67%', '77%', '81%', '83%']
const B_PCT = ['33%', '23%', '19%', '17%']
const TREND_RAW = TREND.map(String)

let chart

async function render(series, overrides = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  chart = new ApexCharts(document.querySelector('#chart'), {
    series,
    chart: {
      type: 'line',
      width: 700,
      height: 400,
      stacked: true,
      stackType: '100%',
      animations: { enabled: false },
    },
    dataLabels: { enabled: true },
    xaxis: { categories: CATEGORIES },
    ...overrides,
  })
  await chart.render()
  return chart
}

/** Label text per series name, in data-point order. */
function labelsBySeries() {
  const out = {}
  document.querySelectorAll('.apexcharts-datalabels').forEach((g) => {
    const texts = [...g.querySelectorAll('.apexcharts-datalabel')].map(
      (t) => t.textContent,
    )
    const name = chart.w.config.series[g.getAttribute('data:realIndex')].name
    if (texts.length) out[name] = texts
  })
  return out
}

afterEach(() => {
  chart?.destroy()
  chart = null
})

describe('100% stacked combo with data labels on (#2429)', () => {
  it('renders with the line declared before the columns', async () => {
    await render([line(), ...columns()])
    expect(labelsBySeries()).toEqual({
      Trend: TREND_RAW,
      ColA: A_PCT,
      ColB: B_PCT,
    })
  })

  it('renders with the line declared after the columns', async () => {
    await render([...columns(), line()])
    expect(labelsBySeries()).toEqual({
      ColA: A_PCT,
      ColB: B_PCT,
      Trend: TREND_RAW,
    })
  })

  it('computes the percentages over the bar series only', async () => {
    await render([line(), ...columns()])
    const pct = chart.w.globals.seriesPercent
    // ColA + ColB sum to 100 at every point; the line is not a slice.
    for (let j = 0; j < CATEGORIES.length; j++) {
      expect(pct[1][j] + pct[2][j]).toBeCloseTo(100, 6)
    }
    // Pre-fix ColA read 100 / (180 + 100 + 50) = 30%.
    expect(pct[1][0]).toBeCloseTo((100 * 100) / 150, 6)
  })

  it('reads the same percentages as the same columns in a pure bar chart', async () => {
    await render(columns(), {
      chart: {
        type: 'bar',
        width: 700,
        height: 400,
        stacked: true,
        stackType: '100%',
        animations: { enabled: false },
      },
    })
    expect(labelsBySeries()).toEqual({ ColA: A_PCT, ColB: B_PCT })
  })

  it('leaves a user formatter alone for every series', async () => {
    await render([line(), ...columns()], {
      dataLabels: {
        enabled: true,
        formatter: (val, { seriesIndex }) => `s${seriesIndex}:${Math.round(val)}`,
      },
    })
    const labels = labelsBySeries()
    expect(labels.Trend[0]).toBe('s0:180')
    // The bar series is still handed its percentage, the user decides how it reads.
    expect(labels.ColA[0]).toBe('s1:67')
  })
})

describe('100% stacked area with data labels on', () => {
  it('renders and labels each point with its raw value', async () => {
    await render(
      [
        { name: 'North', data: [31, 40, 28, 51] },
        { name: 'South', data: [11, 32, 45, 32] },
      ],
      {
        chart: {
          type: 'area',
          width: 700,
          height: 400,
          stacked: true,
          stackType: '100%',
          animations: { enabled: false },
        },
      },
    )
    expect(labelsBySeries()).toEqual({
      North: ['31', '40', '28', '51'],
      South: ['11', '32', '45', '32'],
    })
  })
})
