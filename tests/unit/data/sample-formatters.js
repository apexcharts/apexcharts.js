module.exports = {
  case1: {
    yaxis: {
      title: {
        text: 'Points'
      },
      labels: {
        formatter(val) {
          return val.toFixed(2)
        }
      }
    },
    tooltip: {
      y: [
        {
          formatter(y) {
            return y.toFixed(0) + ' points'
          }
        },
        {
          formatter(y) {
            return y.toFixed(0) + ' points'
          }
        }
      ]
    }
  },
  case2: {
    tooltip: {
      y: {
        formatter(y) {
          return y.toFixed(0) + ' points'
        }
      }
    }
  },
  case3: {
    yaxis: {
      title: {
        text: 'Points'
      },
      labels: {
        formatter: undefined
      }
    }
  }
}
