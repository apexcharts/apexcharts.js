import ApexCharts from '../../../dist/apexcharts.js'

export function createChart(type, series) {
  document.body.innerHTML = '<div id="chart" />'

  const chart = new ApexCharts(document.querySelector('#chart'), {
    chart: {
      type
    },
    series
  })
  chart.render()

  return chart
}

export function createChartWithOptions(options) {
  document.body.innerHTML = '<div id="chart" />'

  const chart = new ApexCharts(document.querySelector('#chart'), options)
  chart.render()

  return chart
}
