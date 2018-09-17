module.exports = {
  case1: {
    yaxis: {
      title: {
        text: 'Points',
      },
      labels: {
        formatter: function(val) {
          return val.toFixed(2)
        }
      }
    },
    tooltip: {
      y: [{
        formatter: function (y) {
          return y.toFixed(0) + " points";
        }
      }, {
        formatter: function (y) {
          return y.toFixed(0) + " points";
        }
      }]
    }
  },
  case2: {
    tooltip: {
      y: {
        formatter: function (y) {
          return y.toFixed(0) + " points";
        }
      }
    }
  },
  case3: {
    yaxis: {
      title: {
        text: 'Points',
      },
      labels: {
        formatter: undefined
      }
    }
  },
}