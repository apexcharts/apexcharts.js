import Data from '../modules/Data'
import AxesUtils from '../modules/axes/AxesUtils'
import Series from '../modules/Series'

class Exports {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  getSvgString() {
    return this.w.globals.dom.Paper.svg()
  }

  cleanup() {
    const w = this.w

    // hide some elements to avoid printing them on exported svg
    const xcrosshairs = w.globals.dom.baseEl.querySelector(
      '.apexcharts-xcrosshairs'
    )
    const ycrosshairs = w.globals.dom.baseEl.querySelector(
      '.apexcharts-ycrosshairs'
    )
    const zoomSelectionRects = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-zoom-rect, .apexcharts-selection-rect'
    )
    Array.prototype.forEach.call(zoomSelectionRects, (z) => {
      z.setAttribute('width', 0)
    })
    if (xcrosshairs) {
      xcrosshairs.setAttribute('x', -500)
      xcrosshairs.setAttribute('x1', -500)
      xcrosshairs.setAttribute('x2', -500)
    }
    if (ycrosshairs) {
      ycrosshairs.setAttribute('y', -100)
      ycrosshairs.setAttribute('y1', -100)
      ycrosshairs.setAttribute('y2', -100)
    }
  }

  svgUrl() {
    this.cleanup()

    const svgData = this.getSvgString()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    return URL.createObjectURL(svgBlob)
  }

  dataURI() {
    return new Promise((resolve) => {
      const w = this.w

      this.cleanup()
      const canvas = document.createElement('canvas')
      canvas.width = w.globals.svgWidth
      canvas.height = parseInt(w.globals.dom.elWrap.style.height, 10) // because of resizeNonAxisCharts

      const canvasBg =
        w.config.chart.background === 'transparent'
          ? '#fff'
          : w.config.chart.background

      let ctx = canvas.getContext('2d')
      ctx.fillStyle = canvasBg
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      let DOMURL = window.URL || window.webkitURL || window

      let img = new Image()
      img.crossOrigin = 'anonymous'

      const svgData = this.getSvgString()
      const svgUrl = 'data:image/svg+xml,' + encodeURIComponent(svgData)

      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        DOMURL.revokeObjectURL(svgUrl)

        let imgURI = canvas.toDataURL('image/png')

        resolve(imgURI)
      }

      img.src = svgUrl
    })
  }

  exportToSVG() {
    this.triggerDownload(this.svgUrl(), '.svg')
  }

  exportToPng() {
    this.dataURI().then((imgURI) => {
      this.triggerDownload(imgURI, '.png')
    })
  }

  exportToCSV({ series, columnDelimiter = ',', lineDelimiter = '\n' }) {
    const w = this.w

    let columns = []
    let rows = []
    let result = 'data:text/csv;charset=utf-8,'

    const dataFormat = new Data(this.ctx)

    const axesUtils = new AxesUtils(this.ctx)
    const getCat = (i) => {
      let cat = ''

      // pie / donut/ radial
      if (!w.globals.axisCharts) {
        cat = w.config.labels[i]
      } else {
        // xy charts

        // non datetime
        if (
          w.config.xaxis.type === 'category' ||
          w.config.xaxis.convertedCatToNumeric
        ) {
          if (w.globals.isBarHorizontal) {
            let lbFormatter = w.globals.yLabelFormatters[0]
            let sr = new Series(this.ctx)
            let activeSeries = sr.getActiveConfigSeriesIndex()

            cat = lbFormatter(w.globals.labels[i], {
              seriesIndex: activeSeries,
              dataPointIndex: i,
              w
            })
          } else {
            cat = axesUtils.getLabel(
              w.globals.labels,
              w.globals.timescaleLabels,
              0,
              i
            ).text
          }
        }

        // datetime, but labels specified in categories or labels
        if (w.config.xaxis.type === 'datetime') {
          if (w.config.xaxis.categories.length) {
            cat = w.config.xaxis.categories[i]
          } else if (w.config.labels.length) {
            cat = w.config.labels[i]
          }
        }
      }

      return cat
    }

    const handleAxisRowsColumns = (s, sI) => {
      rows.push(s.name)

      columns = []
      columns.push('x')
      columns.push('y')

      rows.push(columns.join(columnDelimiter))

      if (s.data && s.data.length) {
        for (let i = 0; i < s.data.length; i++) {
          columns = []

          let cat = getCat(i)
          if (!cat) {
            if (dataFormat.isFormatXY()) {
              cat = series[sI].data[i].x
            } else if (dataFormat.isFormat2DArray()) {
              cat = series[sI].data[i] ? series[sI].data[i][0] : ''
            }
          }

          columns.push(cat)
          columns.push(w.globals.series[sI][i])
          if (
            w.config.chart.type === 'candlestick' ||
            (s.type && s.type === 'candlestick')
          ) {
            columns.pop()
            columns.push(w.globals.seriesCandleO[sI][i])
            columns.push(w.globals.seriesCandleH[sI][i])
            columns.push(w.globals.seriesCandleL[sI][i])
            columns.push(w.globals.seriesCandleC[sI][i])
          }
          if (w.config.chart.type === 'rangeBar') {
            columns.pop()
            columns.push(w.globals.seriesRangeStart[sI][i])
            columns.push(w.globals.seriesRangeEnd[sI][i])
          }
          rows.push(columns.join(columnDelimiter))
        }
      }
    }

    series.map((s, sI) => {
      if (w.globals.axisCharts) {
        handleAxisRowsColumns(s, sI)
      } else {
        columns = []

        columns.push(w.globals.labels[sI])
        columns.push(w.globals.series[sI])
        rows.push(columns.join(columnDelimiter))
      }
    })

    result += rows.join(lineDelimiter)

    this.triggerDownload(encodeURI(result), '.csv')
  }

  triggerDownload(href, ext) {
    const downloadLink = document.createElement('a')
    downloadLink.href = href
    downloadLink.download = this.w.globals.chartID + ext
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }
}

export default Exports
