window.Apex = {
  chart: {
    foreColor: '#ccc',
    toolbar: {
      show: false
    },
  },
  colors: ['#F8C045', '#4CC0F8'],
  stroke: {
    width: 3
  },
  dataLabels: {
    enabled: false
  },
  grid: {
    borderColor: "#535A6C",
  },
  tooltip: {
    theme: 'dark',
    x: {
      formatter: function (val) {
        return moment(new Date(val)).format("HH:mm:ss")
      }
    }
  }
};

function getRandom(yrange) {
  return Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
}

function generateMinuteWiseTimeSeries(baseval, count, yrange) {
  var i = 0;
  var series = [];
  while (i < count) {
    var x = baseval;
    var y = getRandom(yrange);

    series.push([x, y]);
    baseval += 300000;
    i++;
  }
  return series;
}



function getNewData(baseval, yrange) {
  var newTime = baseval + 300000;
  return {
    x: newTime,
    y: Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
  }
}

var optionsColumn = {
  chart: {
    height: 350,
    type: 'bar',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    // dropShadow: {
    //   enabled: true,
    //   left: -14,
    //   top: -10,
    //   opacity: 0.05
    // },
    events: {
      animationEnd: function (chartCtx) {
        const newData = chartCtx.w.config.series[0].data.slice()
        newData.shift()
        window.setTimeout(function () {
          chartCtx.updateOptions({
            series: [{
              data: newData
            }],
            xaxis: {
              min: chartCtx.minX,
              max: chartCtx.maxX
            },
          }, false, false)
        }, 300)
      }
    },
    toolbar: {
      show: false
    },
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: 0,
  },
  grid: {
    padding: {
      left: 0,
      right: 0
    }
  },
  series: [{
    data: generateMinuteWiseTimeSeries(new Date("12/12/2016 00:20:00").getTime(), 12, {
      min: 10,
      max: 110
    })
  }],
  title: {
    align: 'left'
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'vertical',
      shadeIntensity: 0.5,
      gradientToColors: ['#EE5A35', '#046EF6'],
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 0.8,
      stops: [0, 100]
    }
  },
  xaxis: {
    type: 'datetime',
    range: 2700000
  },
  yaxis: {
    min: 0,
    max: 150
  },
  legend: {
    show: false
  },
}



var chartColumn = new ApexCharts(
  document.querySelector("#columnchart"),
  optionsColumn
);
chartColumn.render()

var optionsLine = {
  chart: {
    height: 350,
    type: 'line',
    stacked: true,
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    dropShadow: {
      enabled: true,
      opacity: 0.43,
      blur: 4,
      left: -7,
      top: 22
    },
    events: {
      animationEnd: function (chartCtx) {
        const newData1 = chartCtx.w.config.series[0].data.slice()
        newData1.shift()
        const newData2 = chartCtx.w.config.series[1].data.slice()
        newData2.shift()
        window.setTimeout(function () {
          chartCtx.updateOptions({
            series: [{
              data: newData1
            }, {
              data: newData2
            }],
            xaxis: {
              min: chartCtx.minX,
              max: chartCtx.maxX
            },
          }, false, false)
        }, 300)
      }
    },
    toolbar: {
      show: false
    },
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'smooth',
    width: 5,
  },
  grid: {
    padding: {
      left: 0,
      right: 0
    }
  },
  markers: {
    size: 0,
    hover: {
      size: 0
    }
  },
  series: [{
    data: generateMinuteWiseTimeSeries(new Date("12/12/2016 00:20:00").getTime(), 12, {
      min: 30,
      max: 110
    })
  }, {
    data: generateMinuteWiseTimeSeries(new Date("12/12/2016 00:20:00").getTime(), 12, {
      min: 30,
      max: 110
    })
  }],
  xaxis: {
    type: 'datetime',
    range: 2700000
  },
  yaxis: {
    min: 0,
    max: 220
  },
  legend: {
    show: false
  },
}

var chartLine = new ApexCharts(
  document.querySelector("#linechart"),
  optionsLine
);
chartLine.render()

var optionsCircle = {
  chart: {
    type: 'radialBar',
    width: 380,
    height: 360,
  },
  plotOptions: {
    radialBar: {
      size: undefined,
      inverseOrder: false,
      hollow: {
        margin: 5,
        size: '48%',
        background: 'transparent',
      },
      track: {
        show: true,
        background: '#111',
        strokeWidth: '10%',
        opacity: 1,
        margin: 3, // margin is in pixels
      },


    },
  },
  series: [71, 63],
  labels: ['June', 'May'],
  legend: {
    show: true,
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      shadeIntensity: 0.5,
      gradientToColors: ['#EE5C36', '#50C7F9'],
      inverseColors: true,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100]
    }
  }
}

var chartCircle = new ApexCharts(document.querySelector('#circlechart'), optionsCircle);
chartCircle.render();

window.setInterval(function () {
  chartColumn.updateSeries([{
    data: [...chartColumn.w.config.series[0].data,
    [
      chartColumn.w.globals.maxX + 300000,
      getRandom({
        min: 30,
        max: 110
      })
    ]
    ]
  }])

  chartLine.updateSeries([{
    data: [...chartLine.w.config.series[0].data,
    [
      chartLine.w.globals.maxX + 300000,
      getRandom({
        min: 30,
        max: 110
      })
    ]
    ]
  }, {
    data: [...chartLine.w.config.series[1].data,
    [
      chartLine.w.globals.maxX + 300000,
      getRandom({
        min: 10,
        max: 110
      })
    ]
    ]
  }])
  
  chartCircle.updateSeries([getRandom({min: 10, max: 100}), getRandom({min: 10, max: 100})])

}, 3000)

