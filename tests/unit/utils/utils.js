require('../__mocks__/ResizeObserver.js')
import ApexCharts from '../../../dist/apexcharts.js'

export function createChart(type, series, xtype = 'category') {
  document.body.innerHTML = '<div id="chart" />'

  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type,
      animations: {
        enabled: false,
      },
    },
    xaxis: {
      type: xtype,
    },
    series,
  })
  chart.render()

  return chart
}

export function createChartWithOptions(options) {
  document.body.innerHTML = '<div id="chart" />'

  options.chart = options.chart || {}
  options.chart.animations = options.chart.animations || {}
  options.chart.animations.enabled = false

  const chart = new ApexCharts(document.querySelector('#chart'), options)
  chart.render()

  return chart
}
