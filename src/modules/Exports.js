
class Exports {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  getSvgString () {
    return this.w.globals.dom.Paper.svg()
  }

  exportToSVG () {
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

    const svgData = this.getSvgString()
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'})
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = this.w.globals.chartID + '.svg'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }
}

export default Exports
