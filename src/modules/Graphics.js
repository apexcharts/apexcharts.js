import Utils from '../utils/Utils'
import Filters from './Filters'
import Animations from './Animations'

/**
 * ApexCharts Graphics Class for all drawing operations.
 *
 * @module Graphics
 **/

class Graphics {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  drawLine (
    x1,
    y1,
    x2,
    y2,
    lineColor = '#a8a8a8',
    dashArray = 0,
    strokeWidth = null
  ) {
    let w = this.w
    let line = w.globals.dom.Paper.line().attr({
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      stroke: lineColor,
      'stroke-dasharray': dashArray,
      'stroke-width': strokeWidth
    })

    return line
  }

  drawRect (x1 = 0, y1 = 0, x2 = 0, y2 = 0, radius = 0, color = '#fefefe', opacity = 1, strokeWidth = null, strokeColor = null, strokeDashArray = 0) {
    let w = this.w
    let rect = w.globals.dom.Paper.rect()

    rect.attr({
      x: x1,
      y: y1,
      width: x2 > 0 ? x2 : 0,
      height: y2 > 0 ? y2 : 0,
      rx: radius,
      ry: radius,
      fill: color,
      opacity: opacity,
      'stroke-width': (strokeWidth !== null ? strokeWidth : 0),
      stroke: strokeColor !== null ? strokeColor : 'none',
      'stroke-dasharray': strokeDashArray
    })

    return rect
  }

  drawCircle (radius, attrs = null) {
    const w = this.w

    const c = w.globals.dom.Paper.circle(radius * 2)
    if (attrs !== null) {
      c.attr(attrs)
    }
    return c
  }

  drawPath ({
    d = '',
    stroke = '#a8a8a8',
    strokeWidth,
    fill,
    fillOpacity = 1,
    strokeOpacity = 1,
    classes,
    strokeLinecap = null,
    strokeDashArray = 0
  }) {
    let w = this.w

    if (strokeLinecap === null) { strokeLinecap = w.config.stroke.lineCap }

    if (d.indexOf('undefined') > -1 || d.indexOf('NaN') > -1) {
      d = `M 0 ${w.globals.gridHeight}`
    }
    let p = w.globals.dom.Paper.path(d).attr({
      fill: fill,
      'fill-opacity': fillOpacity,
      stroke: stroke,
      'stroke-opacity': strokeOpacity,
      'stroke-linecap': strokeLinecap,
      'stroke-width': strokeWidth,
      'stroke-dasharray': strokeDashArray,
      class: classes
    })

    return p
  }

  group (attrs = null) {
    const w = this.w
    const g = w.globals.dom.Paper.group()

    if (attrs !== null) {
      g.attr(attrs)
    }
    return g
  }

  move (x, y) {
    let move = ['M', x, y].join(' ')
    return move
  }

  line (x, y, hORv = null) {
    let line = null
    if (hORv === null) {
      line = ['L', x, y].join(' ')
    } else {
      line = [hORv, x].join(' ')
    }
    return line
  }

  curve (x1, y1, x2, y2, x, y) {
    let curve = ['C', x1, y1, x2, y2, x, y].join(' ')
    return curve
  }

  quadraticCurve (x1, y1, x, y) {
    let curve = ['Q', x1, y1, x, y].join(' ')
    return curve
  }

  arc (rx, ry, axisRotation, largeArcFlag, sweepFlag, x, y, relative = false) {
    let coord = 'A'
    if (relative) coord = 'a'

    let arc = [coord, rx, ry, axisRotation, largeArcFlag, sweepFlag, x, y].join(
      ' '
    )
    return arc
  }

  /**
   * @memberof Graphics
   * @param {object}
   *  i = series's index
   *  realIndex = realIndex is series's actual index when it was drawn time. After several redraws, the iterating "i" may change in loops, but realIndex doesn't
   *  pathFrom = existing pathFrom to animateTo
   *  pathTo = new Path to which d attr will be animated from pathFrom to pathTo
   *  stroke = line Color
   *  strokeWidth = width of path Line
   *  fill = it can be gradient, single color, pattern or image
   *  animationDelay = how much to delay when starting animation (in milliseconds)
   *  dataChangeSpeed = for dynamic animations, when data changes
   *  hideStrokesInChange = for certain charts, we hide strokes during anim
   *  className = class attribute to add
   * @return {object} svg.js path object
   **/
  renderPaths ({
    i,
    realIndex,
    pathFrom,
    pathTo,
    stroke,
    strokeWidth,
    fill,
    animationDelay,
    initialSpeed,
    dataChangeSpeed,
    hideStrokesInChange = false,
    className,
    id
  }) {
    let w = this.w
    const filters = new Filters(this.ctx)
    const anim = new Animations(this.ctx)

    let initialAnim = this.w.config.chart.animations.enabled
    let dynamicAnim = initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled

    let d
    let shouldAnimate = !!((initialAnim && !w.globals.resized) ||
        (dynamicAnim && w.globals.dataChanged))

    if (shouldAnimate) {
      d = pathFrom
    } else {
      d = pathTo
    }

    let strokeDashArrayOpt = w.config.stroke.dashArray
    let strokeDashArray = 0
    if (Array.isArray(strokeDashArrayOpt)) {
      strokeDashArray = strokeDashArrayOpt[realIndex]
    } else {
      strokeDashArray = w.config.stroke.dashArray
    }

    let el = this.drawPath({
      d,
      stroke,
      strokeWidth,
      fill,
      fillOpacity: 1,
      classes: className,
      strokeLinecap: 'butt',
      strokeDashArray
    })

    el.attr('id', `${id}-${i}`)
    el.attr('index', realIndex)

    // const defaultFilter = el.filterer

    if (w.config.states.normal.filter.type !== 'none') {
      filters.getDefaultFilter(el, w.config.states.normal.filter.type, w.config.states.normal.filter.value)
    } else {
      if (w.config.chart.dropShadow.enabled) {
        if (!w.config.chart.dropShadow.enabledSeries || (w.config.chart.dropShadow.enabledSeries && w.config.chart.dropShadow.enabledSeries.indexOf(realIndex) !== -1)) {
          const shadow = w.config.chart.dropShadow
          filters.dropShadow(el, shadow)
        }
      }
    }

    el.node.addEventListener('mouseenter', this.pathMouseEnter.bind(this, el))
    el.node.addEventListener('mouseleave', this.pathMouseLeave.bind(this, el))

    el.node.addEventListener('mousedown', this.pathMouseDown.bind(this, el))
    el.node.addEventListener('touchstart', this.pathMouseDown.bind(this, el))

    el.attr({
      pathTo,
      pathFrom
    })

    if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
      anim.animatePathsGradually({
        el: el,
        pathFrom: pathFrom,
        pathTo: pathTo,
        speed: initialSpeed,
        delay: animationDelay,
        strokeWidth
      })
    }

    if (dynamicAnim && w.globals.dataChanged) {
      anim.animatePathsGradually({
        el: el,
        pathFrom: pathFrom,
        pathTo: pathTo,
        speed: dataChangeSpeed,
        strokeWidth
      })
    }

    return el
  }

  drawPattern (style, width, height, stroke = '#a8a8a8', strokeWidth = 0, opacity = 1) {
    let w = this.w

    let p = w.globals.dom.Paper.pattern(width, height, function (add) {
      if (style === 'horizontalLines') {
        add.line(0, 0, height, 0)
          .stroke({ color: stroke, width: strokeWidth + 1 })
      } else if (style === 'verticalLines') {
        add.line(0, 0, 0, width)
          .stroke({ color: stroke, width: strokeWidth + 1 })
      } else if (style === 'slantedLines') {
        add.line(0, 0, width, height)
          .stroke({ color: stroke, width: strokeWidth })
      } else if (style === 'squares') {
        add.rect(width, height)
          .fill('none')
          .stroke({ color: stroke, width: strokeWidth })
      } else if (style === 'circles') {
        add.circle(width)
          .fill('none')
          .stroke({ color: stroke, width: strokeWidth })
      }
    })

    return p
  }

  drawGradient (
    style,
    gfrom,
    gto,
    opacityFrom,
    opacityTo,
    size = null,
    stops = null
  ) {
    let w = this.w

    gfrom = Utils.hexToRgba(gfrom, opacityFrom)
    gto = Utils.hexToRgba(gto, opacityTo)

    let stop1 = 0
    let stop2 = 1
    let stop3 = 1

    if (stops !== null) {
      stop1 = typeof (stops[0]) !== 'undefined' ? stops[0] / 100 : 0
      stop2 = typeof (stops[1]) !== 'undefined' ? stops[1] / 100 : 1
      stop3 = typeof (stops[2]) !== 'undefined' ? stops[2] / 100 : 1
    }

    let radial = !!(w.config.chart.type === 'donut' ||
      w.config.chart.type === 'pie' ||
      w.config.chart.type === 'bubble')

    const p = w.globals.dom.Paper.gradient(radial ? 'radial' : 'linear', function (stop) {
      stop.at(stop1, gfrom, opacityFrom)
      stop.at(stop2, gto, opacityTo)
      stop.at(stop3, gto, opacityTo)
    })

    if (!radial) {
      if (style === 'vertical') {
        p.from(0, 0).to(0, 1)
      } else if (style === 'diagonal') {
        p.from(0, 0).to(1, 1)
      } else if (style === 'horizontal') {
        p.from(0, 1).to(1, 1)
      } else if (style === 'diagonal2') {
        p.from(0, 1).to(2, 2)
      }
    } else {
      let offx = w.globals.gridWidth / 2
      let offy = w.globals.gridHeight / 2

      if (w.config.chart.type !== 'bubble') {
        p.attr({
          'gradientUnits': 'userSpaceOnUse',
          cx: offx,
          cy: offy,
          r: size
        })
      } else {
        p.attr({
          cx: 0.5,
          cy: 0.5,
          r: 0.8,
          fx: 0.2,
          fy: 0.2
        })
      }
    }

    return p
  }

  drawText (opts) {
    let w = this.w

    let { x, y, text, textAnchor, fontSize, foreColor, opacity } = opts

    if (!textAnchor) {
      textAnchor = 'start'
    }

    if (!foreColor) {
      foreColor = w.config.chart.foreColor
    }

    let elText = w.globals.dom.Paper.plain(text).attr({
      x: x,
      y: y,
      'text-anchor': textAnchor,
      'dominate-baseline': 'central',
      class: 'apexcharts-text ' + opts.cssClass ? opts.cssClass : ''
    })

    elText.node.style.fontSize = fontSize
    elText.node.style.fill = foreColor
    elText.node.style.opacity = opacity

    return elText
  }

  drawMarker (x, y, opts) {
    x = x || 0
    let size = opts.pSize || 0

    let elPoint = null

    if (opts.shape === 'square') {
      let radius = opts.pRadius === undefined ? size / 2 : opts.pRadius

      if (y === null) {
        size = 0
        radius = 0
      }

      let nSize = (size * 1.2) + radius

      let p = this.drawRect(nSize, nSize, nSize, nSize, radius)

      p.attr({
        x: x - nSize / 2,
        y: y - nSize / 2,
        cx: x,
        cy: y,
        class: opts.class ? opts.class : '',
        fill: opts.pointFillColor,
        'fill-opacity': opts.pointFillOpacity ? opts.pointFillOpacity : 1,
        stroke: opts.pointStrokeColor,
        'stroke-width': opts.pWidth ? opts.pWidth : 1,
        'stroke-opacity': opts.pointStrokeOpacity ? opts.pointStrokeOpacity : 1
      })

      elPoint = p
    } else if (opts.shape === 'circle') {
      if (!y) {
        size = 0
        y = 0
      }

      // let nSize = size - opts.pRadius / 2 < 0 ? 0 : size - opts.pRadius / 2

      elPoint = this.drawCircle(size, {
        cx: x,
        cy: y,
        class: opts.class ? opts.class : '',
        stroke: opts.pointStrokeColor,
        fill: opts.pointFillColor,
        'fill-opacity': opts.pointFillOpacity ? opts.pointFillOpacity : 1,
        'stroke-width': opts.pWidth ? opts.pWidth : 0,
        'stroke-opacity': opts.pointStrokeOpacity ? opts.pointStrokeOpacity : 1
      })
    }

    return elPoint
  }

  pathMouseEnter (path) {
    let w = this.w
    const filters = new Filters(this.ctx)

    if (w.config.states.active.filter.type !== 'none') {
      if (path.node.getAttribute('selected') === 'true') {
        return
      }
    }

    if (w.config.states.hover.filter.type !== 'none') {
      let hoverFilter = w.config.states.hover.filter
      filters.applyFilter(path, hoverFilter.type, hoverFilter.value)
    }
  }

  pathMouseLeave (path) {
    let w = this.w
    const filters = new Filters(this.ctx)

    if (w.config.states.active.filter.type !== 'none') {
      if (path.node.getAttribute('selected') === 'true') {
        return
      }
    }

    if (w.config.states.hover.filter.type !== 'none') {
      filters.getDefaultFilter(path)
    }
  }

  pathMouseDown (path, e) {
    let w = this.w
    const filters = new Filters(this.ctx)

    const i = parseInt(path.node.getAttribute('index'))
    const j = parseInt(path.node.getAttribute('j'))

    // if (w.config.states.active.filter.type !== 'none') {
    // toggle selection

    let selected = 'false'
    if (path.node.getAttribute('selected') === 'true') {
      path.node.setAttribute('selected', 'false')

      if (w.globals.selectedDataPoints[i].includes(j)) {
        var index = w.globals.selectedDataPoints[i].indexOf(j)
        w.globals.selectedDataPoints[i].splice(index, 1)
      }
    } else {
      if (!w.config.states.active.allowMultipleDataPointsSelection && w.globals.selectedDataPoints.length > 0) {
        w.globals.selectedDataPoints = []
        const elPaths = w.globals.dom.Paper.select('.apexcharts-series path').members
        const elCircles = w.globals.dom.Paper.select('.apexcharts-series circle').members

        for (const elPath of elPaths) {
          elPath.node.setAttribute('selected', 'false')
          filters.getDefaultFilter(elPath)
        }

        for (const circle of elCircles) {
          circle.node.setAttribute('selected', 'false')
          filters.getDefaultFilter(circle)
        }
      }

      path.node.setAttribute('selected', 'true')
      selected = 'true'

      if (typeof (w.globals.selectedDataPoints[i]) === 'undefined') {
        w.globals.selectedDataPoints[i] = []
      }
      w.globals.selectedDataPoints[i].push(j)
    }

    if (selected === 'true') {
      let activeFilter = w.config.states.active.filter
      if (activeFilter !== 'none') {
        filters.applyFilter(path, activeFilter.type, activeFilter.value)

        if (typeof w.config.chart.events.dataPointSelection === 'function') {
          w.config.chart.events.dataPointSelection(e, this.ctx, { selectedDataPoints: w.globals.selectedDataPoints, seriesIndex: i, dataPointIndex: j, config: w.config, globals: w.globals })
        }
        this.ctx.fireEvent('dataPointSelection', [e, this.ctx, { selectedDataPoints: w.globals.selectedDataPoints, seriesIndex: i, dataPointIndex: j, config: w.config, globals: w.globals }])
      }
    } else {
      if (w.config.states.active.filter.type !== 'none') {
        filters.getDefaultFilter(path)
      }
      if (typeof w.config.chart.events.dataPointSelection === 'function') {
        w.config.chart.events.dataPointSelection(e, this.ctx, { selectedDataPoints: w.globals.selectedDataPoints, seriesIndex: i, dataPointIndex: j, config: w.config, globals: w.globals })
      }
      this.ctx.fireEvent('dataPointSelection', [e, this.ctx, { selectedDataPoints: w.globals.selectedDataPoints, seriesIndex: i, dataPointIndex: j, config: w.config, globals: w.globals }])
    }

    if (this.w.config.chart.selection.selectedPoints !== undefined) {
      this.w.config.chart.selection.selectedPoints(w.globals.selectedDataPoints)
    }
  }

  rotateAroundCenter (el) {
    let coord = el.getBBox()
    let x = coord.x + coord.width / 2
    let y = coord.y + coord.height / 2

    return {
      x,
      y
    }
  }

  static setAttrs (el, attrs) {
    for (let key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        el.setAttribute(key, attrs[key])
      }
    }
  }

  getTextRects (text, fontSize) {
    let w = this.w
    let virtualText = this.drawText({
      x: -200,
      y: -200,
      text: text,
      textAnchor: 'start',
      fontSize: fontSize,
      foreColor: '#fff',
      opacity: 0
    })

    w.globals.dom.Paper.add(virtualText)

    let rect = virtualText.bbox()

    virtualText.node.parentNode.removeChild(virtualText.node)

    return {
      width: rect.width,
      height: rect.height
    }
  }

  /**
   * append ... to long text
   * http://stackoverflow.com/questions/9241315/trimming-text-to-a-given-pixel-width-in-svg
   * @memberof Graphics
   **/
  placeTextWithEllipsis (textObj, textString, width) {
    textObj.textContent = textString

    if (textString.length > 0) {
      // ellipsis is needed
      if (textObj.getSubStringLength(0, textString.length) >= width) {
        for (let x = textString.length - 3; x > 0; x -= 3) {
          if (textObj.getSubStringLength(0, x) <= width) {
            textObj.textContent = textString.substring(0, x) + '...'
            return
          }
        }
        textObj.textContent = '...' // can't place at all
      }
    }
  }
}

export default Graphics
