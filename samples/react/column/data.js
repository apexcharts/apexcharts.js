/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
var colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#00D9E9', '#FF66C3'];


function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

var arrayData = [{
  y: 400,
  quarters: [{
    x: 'Q1',
    y: 120
  }, {
    x: 'Q2',
    y: 90
  }, {
    x: 'Q3',
    y: 100
  }, {
    x: 'Q4',
    y: 90
  }]
}, {
  y: 430,
  quarters: [{
    x: 'Q1',
    y: 120
  }, {
    x: 'Q2',
    y: 110
  }, {
    x: 'Q3',
    y: 90
  }, {
    x: 'Q4',
    y: 110
  }]
}, {
  y: 448,
  quarters: [{
    x: 'Q1',
    y: 70
  }, {
    x: 'Q2',
    y: 100
  }, {
    x: 'Q3',
    y: 140
  }, {
    x: 'Q4',
    y: 138
  }]
}, {
  y: 470,
  quarters: [{
    x: 'Q1',
    y: 150
  }, {
    x: 'Q2',
    y: 60
  }, {
    x: 'Q3',
    y: 190
  }, {
    x: 'Q4',
    y: 70
  }]
}, {
  y: 540,
  quarters: [{
    x: 'Q1',
    y: 120
  }, {
    x: 'Q2',
    y: 120
  }, {
    x: 'Q3',
    y: 130
  }, {
    x: 'Q4',
    y: 170
  }]
}, {
  y: 580,
  quarters: [{
    x: 'Q1',
    y: 170
  }, {
    x: 'Q2',
    y: 130
  }, {
    x: 'Q3',
    y: 120
  }, {
    x: 'Q4',
    y: 160
  }]
}];

function makeData() {
  var dataSet = shuffleArray(arrayData)

  var dataYearSeries = [{
    x: "2011",
    y: dataSet[0].y,
    color: colors[0],
    quarters: dataSet[0].quarters
  }, {
    x: "2012",
    y: dataSet[1].y,
    color: colors[1],
    quarters: dataSet[1].quarters
  }, {
    x: "2013",
    y: dataSet[2].y,
    color: colors[2],
    quarters: dataSet[2].quarters
  }, {
    x: "2014",
    y: dataSet[3].y,
    color: colors[3],
    quarters: dataSet[3].quarters
  }, {
    x: "2015",
    y: dataSet[4].y,
    color: colors[4],
    quarters: dataSet[4].quarters
  }, {
    x: "2016",
    y: dataSet[5].y,
    color: colors[5],
    quarters: dataSet[5].quarters
  }];

  return dataYearSeries
}