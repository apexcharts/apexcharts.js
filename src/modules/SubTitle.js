import Graphics from './Graphics'

export default class SubTitle {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  drawSubtitle () {
    let w = this.w

    let x = w.globals.svgWidth / 2
    let y = w.config.subtitle.offsetY
    let textAnchor = 'middle'

    if (w.config.subtitle.align === 'left') {
      x = 10
      textAnchor = 'start'
    } else if (w.config.subtitle.align === 'right') {
      x = w.globals.svgWidth - 10
      textAnchor = 'end'
    }

    x = x + w.config.subtitle.offsetX
    y = y + parseInt(w.config.subtitle.style.fontSize) + parseInt(w.config.title.style.fontSize) + 10

    if (w.config.subtitle.text !== undefined) {
      let graphics = new Graphics(this.ctx)
      let subtitleText = graphics.drawText({
        x: x,
        y: y,
        text: w.config.subtitle.text,
        textAnchor: textAnchor,
        fontSize: w.config.subtitle.style.fontSize,
        foreColor: w.config.subtitle.style.color,
        opacity: 1
      })

      subtitleText.attr('class', 'apexcharts-subtitle-text')

      w.globals.dom.Paper.add(subtitleText)
    }
  }
}
