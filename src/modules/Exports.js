
class Exports {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  getSvgString () {
    return this.w.globals.dom.Paper.svg()
  }

  cleanup () {
    const w = this.w

    // hide some elements to avoid printing them on exported svg
    const xcrosshairs = w.globals.dom.baseEl.querySelector(
      '.apexcharts-xcrosshairs'
    )
    const ycrosshairs = w.globals.dom.baseEl.querySelector(
      '.apexcharts-ycrosshairs'
    )
    if (xcrosshairs) {
      xcrosshairs.setAttribute('x', -500)
    }
    if (ycrosshairs) {
      ycrosshairs.setAttribute('y1', -100)
      ycrosshairs.setAttribute('y2', -100)
    }
  }

  svgUrl () {
    this.cleanup()

    const svgData = this.getSvgString()
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'})
    return URL.createObjectURL(svgBlob)
  }

  exportToSVG () {
    this.triggerDownload(this.svgURL(), '.svg')
  }

  exportToPng () {
    const w = this.w

    this.cleanup()
    const canvas = document.createElement('canvas')
    canvas.width = w.globals.svgWidth
    canvas.height = w.globals.svgHeight

    const canvasBg = w.config.chart.background === 'transparent' ? '#fff' : w.config.chart.background

    var ctx = canvas.getContext('2d')
    ctx.fillStyle = canvasBg
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    var DOMURL = window.URL || window.webkitURL || window

    var img = new Image()

    const svgData = this.getSvgString()
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'})
    const svgUrl = DOMURL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      DOMURL.revokeObjectURL(svgUrl)

      var imgURI = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream')

      this.triggerDownload(imgURI, '.png')
    }

    img.src = svgUrl
  }

  triggerDownload (href, ext) {
    const downloadLink = document.createElement('a')
    downloadLink.href = href
    downloadLink.download = this.w.globals.chartID + ext
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }
}

export default Exports
