import Graphics from './Graphics'

export default class Title {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  drawTitle () {
    let w = this.w

    let x = w.globals.svgWidth / 2
    let y = w.config.title.offsetY
    let textAnchor = 'middle'

    if (w.config.title.align === 'left') {
      x = 10
      textAnchor = 'start'
    } else if (w.config.title.align === 'right') {
      x = w.globals.svgWidth - 10
      textAnchor = 'end'
    }

    x = x + w.config.title.offsetX
    y = y + parseInt(w.config.title.style.fontSize) + 2

    if (w.config.title.text !== undefined) {
      let graphics = new Graphics(this.ctx)
      let titleText = graphics.drawText({
        x: x,
        y: y,
        text: w.config.title.text,
        textAnchor: textAnchor,
        fontSize: w.config.title.style.fontSize,
        foreColor: w.config.title.style.foreColor,
        opacity: 1
      })

      titleText.node.setAttribute('class', 'apexcharts-title-text')

      w.globals.dom.Paper.add(titleText)
    }
  }
}
