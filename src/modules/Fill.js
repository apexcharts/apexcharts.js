import Graphics from './Graphics'
import Utils from '../utils/Utils'

/**
 * ApexCharts Fill Class for setting fill options of the paths.
 *
 * @module Fill
 **/

class Fill {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  clippedImgArea (opts) {
    let w = this.w
    let cnf = w.config

    let svgW = parseInt(w.globals.gridWidth)
    let svgH = parseInt(w.globals.gridHeight)

    let size = svgW > svgH ? svgW : svgH

    let fillImg = opts.image

    let imgWidth = 0
    let imgHeight = 0
    if (
      typeof opts.width === 'undefined' &&
      typeof opts.height === 'undefined'
    ) {
      if (
        cnf.fill.image.width !== undefined &&
        cnf.fill.image.height !== undefined
      ) {
        imgWidth = cnf.fill.image.width + 1
        imgHeight = cnf.fill.image.height
      } else {
        imgWidth = size + 1
        imgHeight = size
      }
    } else {
      imgWidth = opts.width
      imgHeight = opts.height
    }

    let elPattern = document.createElementNS(w.globals.svgNS, 'pattern')

    Graphics.setAttrs(elPattern, {
      id: opts.patternID,
      patternUnits: 'userSpaceOnUse',
      width: imgWidth + 'px',
      height: imgHeight + 'px'
    })

    let elImage = document.createElementNS(w.globals.svgNS, 'image')
    elPattern.appendChild(elImage)

    elImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', fillImg)

    Graphics.setAttrs(elImage, {
      x: 0,
      y: 0,
      preserveAspectRatio: 'none',
      width: imgWidth + 'px',
      height: imgHeight + 'px'
    })

    elImage.style.opacity = opts.opacity

    w.globals.dom.elDefs.node.appendChild(elPattern)
  }

  fillPath (elSeries, opts) {
    let w = this.w

    let cnf = this.w.config
    let graphics = new Graphics(this.ctx)
    let utils = new Utils()

    let patternFill, gradientFill

    let fillColors = []

    const seriesIndex = () => {
      if ((w.config.chart.type === 'bar' && w.config.plotOptions.bar.distributed) || w.config.chart.type === 'heatmap') {
        return opts.seriesNumber
      } else {
        return opts.seriesNumber % w.globals.series.length
      }
    }

    let fillOpacity = Array.isArray(cnf.fill.opacity) ? cnf.fill.opacity[seriesIndex()] : cnf.fill.opacity

    if (w.globals.comboCharts) {
      if (w.config.series[seriesIndex()].type === 'line') {
        if (w.globals.stroke.colors instanceof Array) {
          fillColors = w.globals.stroke.colors
        } else {
          fillColors.push(w.globals.stroke.colors)
        }
      } else {
        if (w.globals.fill.colors instanceof Array) {
          fillColors = w.globals.fill.colors
        } else {
          fillColors.push(w.globals.fill.colors)
        }
      }
    } else {
      if (cnf.chart.type === 'line') {
        if (w.globals.stroke.colors instanceof Array) { fillColors = w.globals.stroke.colors } else {
          fillColors.push(w.globals.stroke.colors)
        }
      } else {
        if (w.globals.fill.colors instanceof Array) {
          fillColors = w.globals.fill.colors
        } else {
          fillColors.push(w.globals.fill.colors)
        }
      }
    }

    // colors passed in arguments
    if (typeof opts.fillColors !== 'undefined') {
      fillColors = []
      if (opts.fillColors instanceof Array) {
        fillColors = opts.fillColors.slice()
      } else {
        fillColors.push(opts.fillColors)
      }
    }

    let defaultColor = Utils.hexToRgba(
      fillColors[seriesIndex()],
      fillOpacity
    )

    let fillColor = fillColors[seriesIndex()]

    if (cnf.fill.type === 'pattern') {
      let patternStrokeWidth = cnf.fill.pattern.strokeWidth === undefined
        ? Array.isArray(cnf.stroke.width) ? cnf.stroke.width[seriesIndex] : cnf.stroke.width
        : Array.isArray(cnf.fill.pattern.strokeWidth) ? cnf.fill.pattern.strokeWidth[seriesIndex] : cnf.fill.pattern.strokeWidth
      let patternLineColor = fillColor

      if (cnf.fill.pattern.style instanceof Array) {
        if (typeof cnf.fill.pattern.style[opts.seriesNumber] !== 'undefined') {
          let pf = graphics.drawPattern(
            cnf.fill.pattern.style[opts.seriesNumber],
            cnf.fill.pattern.width,
            cnf.fill.pattern.height,
            patternLineColor,
            patternStrokeWidth,
            fillOpacity
          )
          patternFill = pf
        } else {
          patternFill = defaultColor
        }
      } else {
        patternFill = graphics.drawPattern(
          cnf.fill.pattern.style,
          cnf.fill.pattern.width,
          cnf.fill.pattern.height,
          patternLineColor,
          patternStrokeWidth,
          fillOpacity
        )
      }
    }

    if (cnf.fill.type === 'gradient') {
      let type = cnf.fill.gradient.type
      let gradientFrom, gradientTo
      let opacityFrom = cnf.fill.gradient.opacityFrom === undefined
        ? fillOpacity
        : cnf.fill.gradient.opacityFrom
      let opacityTo = cnf.fill.gradient.opacityTo === undefined
        ? fillOpacity
        : cnf.fill.gradient.opacityTo

      gradientFrom = fillColor
      if (
        cnf.fill.gradient.gradientToColors === undefined ||
        cnf.fill.gradient.gradientToColors.length === 0
      ) {
        if (cnf.fill.gradient.shade === 'dark') {
          gradientTo = utils.shadeColor(
            parseFloat(cnf.fill.gradient.shadeIntensity) * -1,
            fillColor
          )
        } else {
          gradientTo = utils.shadeColor(
            parseFloat(cnf.fill.gradient.shadeIntensity),
            fillColor
          )
        }
      } else {
        gradientTo = cnf.fill.gradient.gradientToColors[opts.seriesNumber]
      }

      if (cnf.fill.gradient.inverseColors) {
        let t = gradientFrom
        gradientFrom = gradientTo
        gradientTo = t
      }

      gradientFill = graphics.drawGradient(
        type,
        gradientFrom,
        gradientTo,
        opacityFrom,
        opacityTo,
        opts.size,
        cnf.fill.gradient.stops
      )
    }

    let pathFill = 'none'

    if (cnf.fill.image.src.length > 0 && cnf.fill.type === 'image') {
      if (opts.seriesNumber < cnf.fill.image.src.length) {
        this.clippedImgArea({
          opacity: fillOpacity,
          image: cnf.fill.image.src[opts.seriesNumber],
          patternID: `pattern${w.globals.cuid}${opts.seriesNumber + 1}`
        })
        pathFill = `url(#pattern${w.globals.cuid}${opts.seriesNumber + 1})`
      } else {
        pathFill = defaultColor
      }
    } else if (cnf.fill.type === 'gradient') {
      pathFill = gradientFill
    } else if (cnf.fill.type === 'pattern') {
      pathFill = patternFill
    } else {
      pathFill = defaultColor
    }

    if (opts.solid) {
      pathFill = defaultColor
    }

    if (opts.color) {
      pathFill = opts.color
    }

    return pathFill
  }
}

export default Fill
