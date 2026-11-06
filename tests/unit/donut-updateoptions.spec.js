// Regression for https://github.com/apexcharts/apexcharts.js/issues/5057
//
// updateOptions on a donut used to merge the new series (and labels) into the
// config and then skip the redraw, so the slices and their labels stayed as
// first rendered until a window resize rebuilt them. The codepen below is the
// report's reproduction. Pie shares that draw path.
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

const LABELS = ['One', 'Two', 'Three', 'Four']
const INITIAL = [1, 2, 3, 4]
const NEXT = [5, 6, 7, 8]

function paths(chart) {
  return [...chart.el.querySelectorAll('.apexcharts-pie-area')].map((node) =>
    node.getAttribute('d'),
  )
}

function values(chart) {
  return [...chart.el.querySelectorAll('.apexcharts-pie-area')].map((node) =>
    node.getAttribute('data:value'),
  )
}

function angles(chart) {
  return [...chart.el.querySelectorAll('.apexcharts-pie-area')].map((node) =>
    parseFloat(node.getAttribute('data:angle')),
  )
}

function legendText(chart) {
  return [...chart.el.querySelectorAll('.apexcharts-legend-text')].map(
    (node) => node.textContent,
  )
}

function seriesNames(chart) {
  return [...chart.el.querySelectorAll('.apexcharts-pie-series')].map((node) =>
    node.getAttribute('seriesName'),
  )
}

function sliceLabels(chart) {
  return [...chart.el.querySelectorAll('.apexcharts-pie-label')].map(
    (node) => node.textContent,
  )
}

/**
 * @param {'donut' | 'pie'} type
 * @param {Record<string, any>} [extra]
 */
async function mount(type, extra = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const options = {
    chart: {
      type,
      width: 400,
      height: 380,
      animations: { enabled: false },
    },
    labels: LABELS.slice(),
    series: INITIAL.slice(),
    ...extra,
  }
  const chart = new ApexCharts(document.querySelector('#chart'), options)
  await chart.render()
  return { chart, options }
}

describe('donut and pie updateOptions rebuild slices and labels (#5057)', () => {
  it('donut: updateOptions with a new series redraws the slices', async () => {
    const { chart, options } = await mount('donut')
    const before = paths(chart)

    // The report spread the original options and replaced series.
    await chart.updateOptions({
      ...options,
      series: NEXT.slice(),
    })

    expect(values(chart)).toEqual(['5', '6', '7', '8'])
    expect(angles(chart).map((a) => Math.round(a))).toEqual([69, 83, 97, 111])
    expect(paths(chart)).not.toEqual(before)

    const { chart: fresh } = await mount('donut', { series: NEXT.slice() })
    expect(paths(chart)).toEqual(paths(fresh))
    chart.destroy()
    fresh.destroy()
  })

  it('pie: updateOptions with only a new series redraws the slices', async () => {
    const { chart } = await mount('pie')
    const before = paths(chart)
    const beforeLabels = sliceLabels(chart)

    await chart.updateOptions({ series: NEXT.slice() })

    expect(values(chart)).toEqual(['5', '6', '7', '8'])
    expect(paths(chart)).not.toEqual(before)
    // Percentage labels follow the new shares (10% becomes ~19%).
    expect(sliceLabels(chart)).not.toEqual(beforeLabels)
    expect(sliceLabels(chart)[0]).toMatch(/^19/)
    chart.destroy()
  })

  it('donut: updateOptions with only new labels rewrites the legend and slice names', async () => {
    const { chart } = await mount('donut')
    const beforePaths = paths(chart)

    await chart.updateOptions({ labels: ['A', 'B', 'C', 'D'] })

    expect(legendText(chart)).toEqual(['A', 'B', 'C', 'D'])
    expect(seriesNames(chart)).toEqual(['A', 'B', 'C', 'D'])
    // Same data, so the wedges themselves stay put.
    expect(paths(chart)).toEqual(beforePaths)
    chart.destroy()
  })

  it('donut: a series and label change in one updateOptions applies both', async () => {
    const { chart } = await mount('donut')

    await chart.updateOptions({
      series: [9, 1, 1, 1],
      labels: ['W', 'X', 'Y', 'Z'],
    })

    expect(values(chart)).toEqual(['9', '1', '1', '1'])
    expect(Math.round(angles(chart)[0])).toBe(270)
    expect(legendText(chart)).toEqual(['W', 'X', 'Y', 'Z'])
    expect(seriesNames(chart)).toEqual(['W', 'X', 'Y', 'Z'])
    chart.destroy()
  })

  it('donut: the centre total follows a data-only updateOptions', async () => {
    const { chart, options } = await mount('donut', {
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: { show: true, label: 'Total' },
            },
          },
        },
      },
    })
    expect(
      chart.el.querySelector('.apexcharts-datalabel-value').textContent,
    ).toBe('10')

    // Same proportions, so the wedges do not move; the total still must.
    await chart.updateOptions({ ...options, series: [2, 4, 6, 8] })

    expect(values(chart)).toEqual(['2', '4', '6', '8'])
    expect(angles(chart)).toEqual([36, 72, 108, 144])
    expect(
      chart.el.querySelector('.apexcharts-datalabel-value').textContent,
    ).toBe('20')
    chart.destroy()
  })

  it('donut: a later updateOptions is not dropped after the first', async () => {
    const { chart, options } = await mount('donut')

    await chart.updateOptions({ ...options, series: NEXT.slice() })
    await chart.updateOptions({
      ...options,
      series: [8, 1, 1, 2],
      labels: ['W', 'X', 'Y', 'Z'],
    })

    expect(values(chart)).toEqual(['8', '1', '1', '2'])
    expect(legendText(chart)).toEqual(['W', 'X', 'Y', 'Z'])
    chart.destroy()
  })

  it('donut: an animated updateOptions redraws the slices', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const options = {
      chart: {
        type: 'donut',
        width: 400,
        height: 380,
        animations: {
          enabled: true,
          dynamicAnimation: { enabled: true, speed: 40 },
        },
      },
      labels: LABELS.slice(),
      series: INITIAL.slice(),
    }
    const chart = new ApexCharts(document.querySelector('#chart'), options)
    await chart.render()
    const before = paths(chart)

    await chart.updateOptions({ ...options, series: NEXT.slice() })
    for (let t = 0; t < 1000 && !chart.w.globals.animationEnded; t += 20) {
      await new Promise((resolve) => setTimeout(resolve, 20))
    }

    // The sweep leaves the first render. data:value / data:angle are the
    // shares the sweep is going to, not the ones it started from.
    expect(paths(chart)).not.toEqual(before)
    expect(values(chart)).toEqual(['5', '6', '7', '8'])
    expect(angles(chart).map((a) => Math.round(a))).toEqual([69, 83, 97, 111])
    expect(chart.w.globals.animationEnded).toBe(true)
    chart.destroy()
  })
})
