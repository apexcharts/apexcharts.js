import ApexCharts from '../../../dist/apexcharts.min.js'

module.exports = {
  createChart: function(type, series) {
    document.body.innerHTML = '<div id="chart" />';
    
    const chart = new ApexCharts(document.querySelector("#chart"), {
      chart: {
        type
      },
      series
    })
    chart.render()
  
    return chart
  },
  createChartWithOptions: function(options) {
    document.body.innerHTML = '<div id="chart" />';

    const chart = new ApexCharts(document.querySelector("#chart"), options)
    chart.render()
  
    return chart
  }
} 