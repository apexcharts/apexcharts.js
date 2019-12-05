window.Apex = {
  dataLabels: {
    enabled: false
  }
};

var spark1 = {
  chart: {
    id: 'sparkline1',
    type: 'line',
    height: 140,
    sparkline: {
      enabled: true
    },
    group: 'sparklines'
  },
  series: [{
    name: 'purple',
    data: [25, 66, 41, 59, 25, 44, 12, 36, 9, 21]
  }],
  stroke: {
    curve: 'smooth'
  },
  markers: {
    size: 0
  },
  tooltip: {
    fixed: {
      enabled: true,
      position: 'right'
    },
    x: {
      show: false
    }
  },
  title: {
    text: '439',
    style: {
      fontSize: '26px'
    }
  },
  colors: ['#734CEA']
}

var spark2 = {
  chart: {
    id: 'sparkline2',
    type: 'line',
    height: 140,
    sparkline: {
      enabled: true
    },
    group: 'sparklines'
  },
  series: [{
    name: 'green',
    data: [12, 14, 2, 47, 32, 44, 14, 55, 41, 69]
  }],
  stroke: {
    curve: 'smooth'
  },
  markers: {
    size: 0
  },
  tooltip: {
    fixed: {
      enabled: true,
      position: 'right'
    },
    x: {
      show: false
    }
  },
  title: {
    text: '387',
    style: {
      fontSize: '26px'
    }
  },
  colors: ['#34bfa3']
}

var spark3 = {
  chart: {
    id: 'sparkline3',
    type: 'line',
    height: 140,
    sparkline: {
      enabled: true
    },
    group: 'sparklines'
  },
  series: [{
    name: 'red',
    data: [47, 45, 74, 32, 56, 31, 44, 33, 45, 19]
  }],
  stroke: {
    curve: 'smooth'
  },
  markers: {
    size: 0
  },
  tooltip: {
    fixed: {
      enabled: true,
      position: 'right'
    },
    x: {
      show: false
    }
  },
  colors: ['#f4516c'],
  title: {
    text: '577',
    style: {
      fontSize: '26px'
    }
  },
  xaxis: {
    crosshairs: {
      width: 1
    },
  }
}

var spark4 = {
  chart: {
    id: 'sparkline4',
    type: 'line',
    height: 140,
    sparkline: {
      enabled: true
    },
    group: 'sparklines'
  },
  series: [{
    name: 'teal',
    data: [15, 75, 47, 65, 14, 32, 19, 54, 44, 61]
  }],
  stroke: {
    curve: 'smooth'
  },
  markers: {
    size: 0
  },
  tooltip: {
    fixed: {
      enabled: true,
      position: 'right'
    },
    x: {
      show: false
    }
  },
  colors: ['#00c5dc'],
  title: {
    text: '615',
    style: {
      fontSize: '26px'
    }
  },
  xaxis: {
    crosshairs: {
      width: 1
    },
  }
}

new ApexCharts(document.querySelector("#spark1"), spark1).render();
new ApexCharts(document.querySelector("#spark2"), spark2).render();
new ApexCharts(document.querySelector("#spark3"), spark3).render();
new ApexCharts(document.querySelector("#spark4"), spark4).render();

var optionsBar = {
  chart: {
    type: 'bar',
    height: 250,
    width: '100%',
    stacked: true,
    foreColor: '#999',
  },
  plotOptions: {
    bar: {
      dataLabels: {
        enabled: false
      },
      columnWidth: '75%',
      endingShape: 'rounded'
    }
  },
  colors: ["#00C5A4", '#F3F2FC'],
  series: [{
    name: "Sessions",
    data: [20, 16, 24, 28, 26, 22, 15, 5, 14, 16, 22, 29, 24, 19, 15, 10, 11, 15, 19, 23],
  }, {
    name: "Views",
    data: [20, 16, 24, 28, 26, 22, 15, 5, 14, 16, 22, 29, 24, 19, 15, 10, 11, 15, 19, 23],
  }],
  labels: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 1, 2, 3, 4],
  xaxis: {
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    },
    crosshairs: {
      show: false
    },
    labels: {
      show: false,
      style: {
        fontSize: '14px'
      }
    },
  },
  grid: {
    xaxis: {
      lines: {
        show: false
      },
    },
    yaxis: {
      lines: {
        show: false
      },
    }
  },
  yaxis: {
    axisBorder: {
      show: false
    },
    labels: {
      show: false
    },
  },
  legend: {
    floating: true,
    position: 'top',
    horizontalAlign: 'right',
    offsetY: -36
  },
  title: {
    text: 'Web Statistics',
    align: 'left',
  },
  subtitle: {
    text: 'Sessions and Views'
  },
  tooltip: {
    shared: true
  }

}

var chartBar = new ApexCharts(document.querySelector('#bar'), optionsBar);
chartBar.render();

var optionsCircle1 = {
  chart: {
    type: 'radialBar',
    height: 294,
    zoom: {
      enabled: false
    },
  },
  colors: ['#E91E63'],
  plotOptions: {
    radialBar: {
      dataLabels: {
        name: {
          show: false
        },
        value: {
          offsetY: 0
        }
      }
    }
  },
  series: [65],
  theme: {
    monochrome: {
      enabled: false
    }
  },
  title: {
    text: 'Bounce Rate',
    align: 'left'
  }
}

var chartCircle1 = new ApexCharts(document.querySelector('#radialBar1'), optionsCircle1);
chartCircle1.render();


var optionsDonutTop = {
  chart: {
    height: 272,
    type: 'donut',
  },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
      },
      dataLabels: {
        enabled: false
      }
    }
  },
  colors: ['#775DD0', '#00C8E1', '#FFB900'],
  title: {
    text: 'Visitors Source'
  },
  series: [2, 7, 5],
  labels: ['Social Media', 'Blog', 'External'],
  legend: {
    show: false
  }
}

var chartDonut2 = new ApexCharts(document.querySelector('#donutTop'), optionsDonutTop);
chartDonut2.render().then(function () {
  // window.setInterval(function () {
  //   chartDonut2.updateSeries([getRandom(), getRandom(), getRandom()])
  // }, 1000)
});

var optionsArea = {
  chart: {
    height: 421,
    type: 'area',
    background: '#fff',
    stacked: true,
    offsetY: 39,
    zoom: {
      enabled: false
    }
  },
  plotOptions: {
    line: {
      dataLabels: {
        enabled: false
      }
    }
  },
  stroke: {
    curve: 'straight'
  },
  colors: ["#3F51B5", '#2196F3'],
  series: [{
      name: "Adwords Views",
      data: [15, 26, 20, 33, 27, 43, 17, 26, 19]
    },
    {
      name: "Adwords Clicks",
      data: [33, 21, 42, 19, 32, 25, 36, 29, 49]
    }
  ],
  fill: {
    type: 'gradient',
    gradient: {
      inverseColors: false,
      shade: 'light',
      type: "vertical",
      opacityFrom: 0.9,
      opacityTo: 0.6,
      stops: [0, 100, 100, 100]
    }
  },
  title: {
    text: 'Visitor Insights',
    align: 'left',
    offsetY: -5,
    offsetX: 20
  },
  subtitle: {
    text: 'Adwords Statistics',
    offsetY: 30,
    offsetX: 20
  },
  markers: {
    size: 0,
    style: 'hollow',
    strokeWidth: 8,
    strokeColor: "#fff",
    strokeOpacity: 0.25,
  },
  grid: {
    show: false,
    padding: {
      left: 0,
      right: 0
    }
  },
  labels: ['01/15/2002', '01/16/2002', '01/17/2002', '01/18/2002', '01/19/2002', '01/20/2002', '01/21/2002', '01/22/2002', '01/23/2002'],
  xaxis: {
    type: 'datetime',
    tooltip: {
      enabled: false
    }
  },
  legend: {
    offsetY: -50,
    position: 'top',
    horizontalAlign: 'right'
  }
}

var chartArea = new ApexCharts(document.querySelector('#area-adwords'), optionsArea);
chartArea.render();

var optionsCircle4 = {
  chart: {
    type: 'radialBar',
    height: 322,
    width: 380,
  },
  colors: ['#775DD0', '#00C8E1', '#FFB900'],
  labels: ['q4'],
  series: [71, 63, 77],
  labels: ['June', 'May', 'April'],
  theme: {
    monochrome: {
      enabled: false
    }
  },
  plotOptions: {
    radialBar: {
      offsetY: -30
    }
  },
  legend: {
    show: true,
    position: 'left',
    containerMargin: {
      right: 0
    }
  },
  title: {
    text: 'Growth'
  }
}

var chartCircle4 = new ApexCharts(document.querySelector('#radialBarBottom'), optionsCircle4);
chartCircle4.render();

function generateData(baseval, count, yrange) {
  var i = 0;
  var series = [];
  while (i < count) {
    var x = Math.floor(Math.random() * (750 - 1 + 1)) + 1;;
    var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
    var z = Math.floor(Math.random() * (75 - 15 + 1)) + 15;

    series.push([x, y, z]);
    baseval += 86400000;
    i++;
  }
  return series;
}

function getRandom() {
  return Math.floor(Math.random() * (100 - 1 + 1)) + 1;
}


var options = {
  chart: {
    height: 294,
    type: 'bubble',
    sparkline: {
      enabled: true
    },
  },
  plotOptions: {
    bubble: {
      dataLabels: {
        enabled: false
      }
    }
  },
  colors: ["#734CEA", "#34bfa3", "#f4516c", "#00c5dc"],
  series: [{
      name: 'Facebook',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Twitter',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Youtube',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'LinkedIn',
      data: generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    }
  ],
  fill: {
    opacity: 0.8,
    gradient: {
      enabled: false
    }
  },
  title: {
    text: 'Social Media Reach'
  },
  xaxis: {
    tickAmount: 12,
    type: 'category',
    min: -50,
    max: 850
  },
  yaxis: {
    max: 70
  }
}

var chart = new ApexCharts(
  document.querySelector("#bubbleChart"),
  options
);

// a small hack to extend height in website sample dashboard
chart.render().then(function () {
  var ifr = document.querySelector("#wrapper");
  if (ifr.contentDocument) {
    ifr.style.height = ifr.contentDocument.body.scrollHeight + 20 +'px';
  }
});

/* fusionexport integrations START */
(() => {
  const btn = document.getElementById('fusionexport-btn')
  btn.addEventListener('click', async function() {
    const endPoint = 'https://www.fusioncharts.com/demos/dashboards/fusionexport-apexcharts/api/export-dashboard'
    const information = {
      dashboardName: 'material'
    };

    this.setAttribute('disabled', true);
    const { data } = await axios.post(endPoint, information, {
      responseType: 'blob'
    });
    await download(data, 'apexCharts-material-dashboard.pdf', 'application/pdf')
    this.removeAttribute('disabled')
  });
}
)();
/* fusionexport integrations END */
