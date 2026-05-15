// @ts-check
import Pie from './Pie'
import Utils from '../utils/Utils'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'
import Series from '../modules/Series'

/**
 * ApexCharts Radial Class for drawing Circle / Semi Circle Charts.
 * @module Radial
 **/

class Radial extends Pie {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    super(w, ctx)

    this.ctx = ctx
    this.w = w
    this.animBeginArr = [0]
    this.animDur = 0

    this.startAngle = w.config.plotOptions.radialBar.startAngle
    this.endAngle = w.config.plotOptions.radialBar.endAngle

    this.totalAngle = Math.abs(
      w.config.plotOptions.radialBar.endAngle -
        w.config.plotOptions.radialBar.startAngle,
    )

    this.trackStartAngle = w.config.plotOptions.radialBar.track.startAngle
    this.trackEndAngle = w.config.plotOptions.radialBar.track.endAngle

    this.barLabels = this.w.config.plotOptions.radialBar.barLabels

    this.donutDataLabels = this.w.config.plotOptions.radialBar.dataLabels
    this.radialDataLabels = this.donutDataLabels // make a copy for easy reference

    if (!this.trackStartAngle) this.trackStartAngle = this.startAngle
    if (!this.trackEndAngle) this.trackEndAngle = this.endAngle

    if (this.endAngle === 360) this.endAngle = 359.99

    this.margin = parseInt(w.config.plotOptions.radialBar.track.margin, 10)
    this.onBarLabelClick = this.onBarLabelClick.bind(this)
  }

  /**
   * @param {any[]} series
   */
  draw(series) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const ret = graphics.group({
      class: 'apexcharts-radialbar',
    })

    if (w.globals.noData) return ret

    const elSeries = graphics.group()

    const centerY = this.defaultSize / 2
    const centerX = w.layout.gridWidth / 2

    let size = this.defaultSize / 2.05
    if (!w.config.chart.sparkline.enabled) {
      size = size - w.config.stroke.width - w.config.chart.dropShadow.blur
    }
    const colorArr = w.globals.fill.colors

    const rb = w.config.plotOptions.radialBar
    const hasBands = Array.isArray(rb.bands) && rb.bands.length > 0
    const hideTrack =
      hasBands && rb.bandsStyle && rb.bandsStyle.hideTrackWhenPresent
    const isNeedleShape = rb.shape === 'needle'

    if (rb.track.show && !hideTrack) {
      const elTracks = this.drawTracks({
        size,
        centerX,
        centerY,
        colorArr,
        series,
      })
      elSeries.add(elTracks)
    }

    if (hasBands) {
      const elBands = this.drawBands({
        size,
        centerX,
        centerY,
        series,
      })
      elSeries.add(elBands)
    }

    const elG = this.drawArcs({
      size,
      centerX,
      centerY,
      colorArr,
      series,
      skipValueArc: isNeedleShape,
    })

    if (rb.ticks && rb.ticks.show) {
      const elTicks = this.drawTicks({
        size,
        centerX,
        centerY,
        series,
      })
      elSeries.add(elTicks)
    }

    if (isNeedleShape) {
      const elNeedle = this.drawNeedle({
        size,
        centerX,
        centerY,
        series,
      })
      elSeries.add(elNeedle)
    }

    let totalAngle = 360

    if (w.config.plotOptions.radialBar.startAngle < 0) {
      totalAngle = this.totalAngle
    }

    const angleRatio = (360 - totalAngle) / 360
    w.globals.radialSize = size - size * angleRatio

    if (this.radialDataLabels.value.show) {
      const offset = Math.max(
        this.radialDataLabels.value.offsetY,
        this.radialDataLabels.name.offsetY,
      )
      w.globals.radialSize += offset * angleRatio
    }

    elSeries.add(elG.g)

    if (w.config.plotOptions.radialBar.hollow.position === 'front') {
      elG.g.add(elG.elHollow)
      if (elG.dataLabels) {
        elG.g.add(elG.dataLabels)
      }
    }

    ret.add(elSeries)

    return ret
  }

  /**
   * @param {Record<string, any>} opts
   */
  drawTracks(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const g = graphics.group({
      class: 'apexcharts-tracks',
    })

    const filters = new Filters(this.w)
    const fill = new Fill(this.w)

    const strokeWidth = this.getStrokeWidth(opts)

    opts.size = opts.size - strokeWidth / 2

    for (let i = 0; i < opts.series.length; i++) {
      const elRadialBarTrack = graphics.group({
        class: 'apexcharts-radialbar-track apexcharts-track',
      })
      g.add(elRadialBarTrack)

      elRadialBarTrack.attr({
        rel: i + 1,
      })

      opts.size = opts.size - strokeWidth - this.margin

      const trackConfig = w.config.plotOptions.radialBar.track
      const pathFill = fill.fillPath({
        seriesNumber: 0,
        size: opts.size,
        fillColors: Array.isArray(trackConfig.background)
          ? trackConfig.background[i]
          : trackConfig.background,
        solid: true,
      })

      const startAngle = this.trackStartAngle
      let endAngle = this.trackEndAngle

      if (Math.abs(endAngle) + Math.abs(startAngle) >= 360)
        endAngle = 360 - Math.abs(this.startAngle) - 0.1

      const elPath = graphics.drawPath({
        d: '',
        stroke: pathFill,
        strokeWidth:
          (strokeWidth * parseInt(trackConfig.strokeWidth, 10)) / 100,
        fill: 'none',
        strokeOpacity: trackConfig.opacity,
        classes: 'apexcharts-radialbar-area',
      })

      if (trackConfig.dropShadow.enabled) {
        const shadow = trackConfig.dropShadow
        filters.dropShadow(elPath, shadow)
      }

      elRadialBarTrack.add(elPath)

      elPath.attr('id', 'apexcharts-radialbarTrack-' + i)

      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: 0,
        dur: 0,
        isTrack: true,
      })
    }

    return g
  }

  /**
   * @param {Record<string, any>} opts
   */
  drawArcs(opts) {
    const w = this.w
    // size, donutSize, centerX, centerY, colorArr, lineColorArr, sectorAngleArr, series

    const graphics = new Graphics(this.w)
    const fill = new Fill(this.w)
    const filters = new Filters(this.w)
    const g = graphics.group()

    const strokeWidth = this.getStrokeWidth(opts)
    opts.size = opts.size - strokeWidth / 2

    let hollowFillID = w.config.plotOptions.radialBar.hollow.background
    const hollowSize =
      opts.size -
      strokeWidth * opts.series.length -
      this.margin * opts.series.length -
      (strokeWidth *
        parseInt(w.config.plotOptions.radialBar.track.strokeWidth, 10)) /
        100 /
        2

    const hollowRadius =
      hollowSize - w.config.plotOptions.radialBar.hollow.margin

    if (w.config.plotOptions.radialBar.hollow.image !== undefined) {
      hollowFillID = this.drawHollowImage(opts, g, hollowSize, hollowFillID)
    }

    const elHollow = this.drawHollow({
      size: hollowRadius,
      centerX: opts.centerX,
      centerY: opts.centerY,
      fill: hollowFillID ? hollowFillID : 'transparent',
    })

    if (w.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
      const shadow = w.config.plotOptions.radialBar.hollow.dropShadow
      filters.dropShadow(elHollow, shadow)
    }

    let shown = 1
    if (!this.radialDataLabels.total.show && w.seriesData.series.length > 1) {
      shown = 0
    }

    let dataLabels = null

    if (this.radialDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`,
      )

      dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.radialDataLabels,
        {
          hollowSize,
          centerX: opts.centerX,
          centerY: opts.centerY,
          opacity: shown,
        },
      )
    }

    if (w.config.plotOptions.radialBar.hollow.position === 'back') {
      g.add(elHollow)
      if (dataLabels) {
        g.add(dataLabels)
      }
    }

    let reverseLoop = false
    if (w.config.plotOptions.radialBar.inverseOrder) {
      reverseLoop = true
    }

    for (
      let i = reverseLoop ? opts.series.length - 1 : 0;
      reverseLoop ? i >= 0 : i < opts.series.length;
      reverseLoop ? i-- : i++
    ) {
      const elRadialBarArc = graphics.group({
        class: `apexcharts-series apexcharts-radial-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
      })
      g.add(elRadialBarArc)

      elRadialBarArc.attr({
        rel: i + 1,
        'data:realIndex': i,
      })

      Series.addCollapsedClassToSeries(this.w, elRadialBarArc, i)

      opts.size = opts.size - strokeWidth - this.margin

      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: opts.size,
        value: opts.series[i],
      })

      const startAngle = this.startAngle
      let prevStartAngle

      // if data exceeds 100, make it 100
      const dataValue =
        Utils.negToZero(opts.series[i] > 100 ? 100 : opts.series[i]) / 100

      let endAngle = Math.round(this.totalAngle * dataValue) + this.startAngle

      let prevEndAngle
      if (w.globals.dataChanged) {
        prevStartAngle = this.startAngle
        prevEndAngle =
          Math.round(
            (this.totalAngle * Utils.negToZero(w.globals.previousPaths[i])) /
              100,
          ) + prevStartAngle
      }

      const currFullAngle = Math.abs(endAngle) + Math.abs(startAngle)
      if (currFullAngle > 360) {
        endAngle = endAngle - 0.01
      }

      const prevFullAngle = Math.abs(prevEndAngle) + Math.abs(prevStartAngle)
      if (prevFullAngle > 360) {
        prevEndAngle = prevEndAngle - 0.01
      }

      const angle = endAngle - startAngle

      const dashArray = Array.isArray(w.config.stroke.dashArray)
        ? w.config.stroke.dashArray[i]
        : w.config.stroke.dashArray

      const elPath = graphics.drawPath({
        d: '',
        stroke: opts.skipValueArc ? 'transparent' : pathFill,
        strokeWidth: opts.skipValueArc ? 0 : strokeWidth,
        fill: 'none',
        fillOpacity: w.config.fill.opacity,
        classes: 'apexcharts-radialbar-area apexcharts-radialbar-slice-' + i,
        strokeDashArray: dashArray,
      })

      const radialMidAngle = startAngle + angle / 2
      const radialArcCenter = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        opts.size,
        radialMidAngle,
      )

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:value': opts.series[i],
        'data:cx': radialArcCenter.x,
        'data:cy': radialArcCenter.y,
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow, i)
      }
      filters.setSelectionFilter(elPath, 0, i)

      this.addListeners(elPath, this.radialDataLabels)

      elRadialBarArc.add(elPath)

      elPath.attr({
        index: 0,
        j: i,
      })

      if (this.barLabels.enabled) {
        const barStartCords = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          opts.size,
          startAngle,
        )
        const text = this.barLabels.formatter(w.seriesData.seriesNames[i], {
          seriesIndex: i,
          w,
        })
        const classes = ['apexcharts-radialbar-label']
        if (!this.barLabels.onClick) {
          classes.push('apexcharts-no-click')
        }

        let textColor = this.barLabels.useSeriesColors
          ? w.globals.colors[i]
          : w.config.chart.foreColor

        if (!textColor) {
          textColor = w.config.chart.foreColor
        }

        const x = barStartCords.x + this.barLabels.offsetX
        const y = barStartCords.y + this.barLabels.offsetY
        const elText = graphics.drawText({
          x,
          y,
          text,
          textAnchor: 'end',
          dominantBaseline: 'middle',
          fontFamily: this.barLabels.fontFamily,
          fontWeight: this.barLabels.fontWeight,
          fontSize: this.barLabels.fontSize,
          foreColor: textColor,
          cssClass: classes.join(' '),
        })

        elText.on('click', this.onBarLabelClick)

        elText.attr({
          rel: i + 1,
        })

        if (startAngle !== 0) {
          elText.attr({
            'transform-origin': `${x} ${y}`,
            transform: `rotate(${startAngle} 0 0)`,
          })
        }

        elRadialBarArc.add(elText)
      }

      let dur = 0
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = w.config.chart.animations.speed
      }

      if (w.globals.dataChanged) {
        dur = w.config.chart.animations.dynamicAnimation.speed
      }
      this.animDur = dur / (opts.series.length * 1.2) + this.animDur
      this.animBeginArr.push(this.animDur)

      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        prevEndAngle,
        prevStartAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: this.animBeginArr,
        dur,
        shouldSetPrevPaths: true,
      })
    }

    return {
      g,
      elHollow,
      dataLabels,
    }
  }

  /**
   * Map a domain value (between `min` and `max`) to the corresponding angle
   * in the gauge's `startAngle`..`endAngle` range. Values outside the
   * domain are clamped.
   *
   * @param {number} value
   * @returns {number}
   */
  _angleAtValue(value) {
    const rb = this.w.config.plotOptions.radialBar
    const min = typeof rb.min === 'number' ? rb.min : 0
    const max = typeof rb.max === 'number' ? rb.max : 100
    const safeMax = max === min ? min + 1 : max
    const clamped = Math.max(min, Math.min(safeMax, Number(value)))
    const t = (clamped - min) / (safeMax - min)
    return this.startAngle + t * (this.endAngle - this.startAngle)
  }

  /**
   * Build an SVG arc path from `startAngle` to `endAngle` at radius `r`
   * around `(cx, cy)`. Angles are in degrees, with 0° at the top.
   * Used by drawBands; mirrors the `M ... A ... ` form used elsewhere.
   *
   * @param {number} cx
   * @param {number} cy
   * @param {number} r
   * @param {number} startAngle
   * @param {number} endAngle
   * @returns {string}
   */
  _describeArc(cx, cy, r, startAngle, endAngle) {
    const start = Utils.polarToCartesian(cx, cy, r, endAngle)
    const end = Utils.polarToCartesian(cx, cy, r, startAngle)
    const sweep = endAngle - startAngle
    const largeArc = Math.abs(sweep) > 180 ? 1 : 0
    // sweepFlag: 0 = anti-clockwise from `end` to `start`, which together with
    // polarToCartesian's orientation produces a clockwise visual arc.
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
  }

  /**
   * Draw threshold bands as colored arc segments along the gauge arc.
   * Bands sit behind the value-arc and tick marks. Used for gauges that
   * indicate ranges like 0-30 critical / 30-70 warning / 70-100 healthy.
   *
   * @param {Record<string, any>} opts
   */
  drawBands(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const rb = w.config.plotOptions.radialBar
    const bands = rb.bands || []

    const g = graphics.group({
      class: 'apexcharts-gauge-bands',
    })

    // Mirror the size calculation drawArcs would apply for the first series
    // so bands sit on the same arc radius as the value arc.
    const strokeWidth = this.getStrokeWidth(opts)
    const radius = opts.size - strokeWidth / 2 - strokeWidth - this.margin

    const bandStroke =
      (strokeWidth * parseInt(rb.bandsStyle.strokeWidth, 10)) / 100
    const min = typeof rb.min === 'number' ? rb.min : 0
    const max = typeof rb.max === 'number' ? rb.max : 100
    const gapDeg =
      max === min
        ? 0
        : (rb.bandsStyle.gap || 0) *
          ((this.endAngle - this.startAngle) / (max - min))

    for (let b = 0; b < bands.length; b++) {
      const band = bands[b]
      if (band.from === undefined || band.to === undefined) continue
      const a1 = this._angleAtValue(band.from)
      const a2 = this._angleAtValue(band.to)
      const startA = Math.min(a1, a2) + gapDeg / 2
      const endA = Math.max(a1, a2) - gapDeg / 2
      if (endA - startA <= 0) continue

      const elBand = graphics.drawPath({
        d: this._describeArc(opts.centerX, opts.centerY, radius, startA, endA),
        stroke: band.color || '#ccc',
        strokeWidth: bandStroke,
        fill: 'none',
        strokeLinecap: rb.bandsStyle.linecap || 'butt',
        classes: 'apexcharts-gauge-band',
      })
      elBand.node.setAttribute('data-band-index', String(b))
      g.add(elBand)
    }

    return g
  }

  /**
   * Draw tick marks (major + minor) along the gauge arc, with optional
   * value labels at each major tick.
   *
   * @param {Record<string, any>} opts
   */
  drawTicks(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const rb = w.config.plotOptions.radialBar
    const ticks = rb.ticks
    const g = graphics.group({ class: 'apexcharts-gauge-ticks' })

    const strokeWidth = this.getStrokeWidth(opts)
    const radius = opts.size - strokeWidth / 2 - strokeWidth - this.margin

    const min = typeof rb.min === 'number' ? rb.min : 0
    const max = typeof rb.max === 'number' ? rb.max : 100

    const majorCount = Math.max(2, ticks.major?.count ?? 11)
    const minorCount = Math.max(0, ticks.minor?.count ?? 0)

    /**
     * @param {number} value
     * @param {Record<string, any>} cfg
     * @param {boolean} isMajor
     */
    const drawTickAt = (value, cfg, isMajor) => {
      const angle = this._angleAtValue(value)
      const length = cfg.length ?? 8
      const inner =
        cfg.placement === 'inside' ? radius - length : radius
      const outer =
        cfg.placement === 'inside' ? radius : radius + length
      const p1 = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        inner,
        angle,
      )
      const p2 = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        outer,
        angle,
      )
      const line = graphics.drawLine(
        p1.x,
        p1.y,
        p2.x,
        p2.y,
        cfg.color || (isMajor ? '#666' : '#999'),
        0,
        cfg.width || (isMajor ? 2 : 1),
      )
      g.add(line)

      if (isMajor && ticks.labels?.show) {
        const labelRadius =
          (cfg.placement === 'inside' ? inner : outer) +
          (cfg.placement === 'inside' ? -1 : 1) *
            (ticks.labels.offset ?? 6)
        const labelPos = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          labelRadius,
          angle,
        )
        const labelText =
          typeof ticks.labels.formatter === 'function'
            ? ticks.labels.formatter(value)
            : String(value)
        const elText = graphics.drawText({
          x: labelPos.x,
          y: labelPos.y,
          text: labelText,
          textAnchor: 'middle',
          dominantBaseline: 'middle',
          fontFamily: ticks.labels.fontFamily,
          fontSize: ticks.labels.fontSize,
          fontWeight: ticks.labels.fontWeight,
          foreColor: ticks.labels.color,
          cssClass: 'apexcharts-gauge-tick-label',
        })
        g.add(elText)
      }
    }

    for (let m = 0; m < majorCount; m++) {
      const t = m / (majorCount - 1)
      const value = min + t * (max - min)
      drawTickAt(value, ticks.major || {}, true)

      // Minor ticks fall between this major and the next.
      if (m < majorCount - 1 && minorCount > 0) {
        for (let n = 1; n <= minorCount; n++) {
          const tMinor = (m + n / (minorCount + 1)) / (majorCount - 1)
          const minorValue = min + tMinor * (max - min)
          drawTickAt(minorValue, ticks.minor || {}, false)
        }
      }
    }

    return g
  }

  /**
   * Draw a rotating needle pointing at the current series value. Only
   * called when `plotOptions.radialBar.shape === 'needle'`. The needle is
   * a tapered polygon inside a `<g>` whose rotation transform is animated
   * from `startAngle` to the value's angle.
   *
   * Renders a single needle for the first series value (gauge use case).
   * Additional series are ignored — drilled-down multi-series gauges are
   * out of scope for this iteration.
   *
   * @param {Record<string, any>} opts
   */
  drawNeedle(opts) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const rb = w.config.plotOptions.radialBar
    const cfg = rb.needle || {}
    const pivot = rb.pivot || {}

    const g = graphics.group({ class: 'apexcharts-gauge-needle' })
    if (!opts.series || opts.series.length === 0) return g

    const strokeWidth = this.getStrokeWidth(opts)
    const arcRadius = opts.size - strokeWidth / 2 - strokeWidth - this.margin
    const length =
      typeof cfg.length === 'string' && cfg.length.endsWith('%')
        ? (arcRadius * parseInt(cfg.length, 10)) / 100
        : Number(cfg.length || arcRadius * 0.85)

    const baseW = cfg.baseWidth ?? 4
    const tipW = cfg.tipWidth ?? 1
    const color = cfg.color || '#333'

    // Build the needle as a tapered polygon, centered on (centerX, centerY),
    // pointing straight up (angle 0 in our polar system). We rotate the
    // wrapping <g> to position it.
    const cx = opts.centerX
    const cy = opts.centerY
    const path =
      `M ${cx - baseW / 2} ${cy} ` +
      `L ${cx + baseW / 2} ${cy} ` +
      `L ${cx + tipW / 2} ${cy - length} ` +
      `L ${cx - tipW / 2} ${cy - length} Z`

    const elNeedle = graphics.drawPath({
      d: path,
      stroke: color,
      strokeWidth: 0,
      fill: color,
      classes: 'apexcharts-gauge-needle-shape',
    })
    g.add(elNeedle)

    // Pivot circle on top of the needle base.
    if (pivot.show !== false) {
      const elPivot = graphics.drawCircle(2 * (cfg.baseRadius ?? 8))
      elPivot.attr({
        cx,
        cy,
        r: cfg.baseRadius ?? 8,
        fill: pivot.color || color,
        stroke: pivot.strokeColor || '#fff',
        'stroke-width': pivot.strokeWidth ?? 2,
        class: 'apexcharts-gauge-needle-pivot',
      })
      g.add(elPivot)
    }

    // Rotate the whole group to the value's angle. We rotate around the
    // chart center, transform-origin set to (cx, cy).
    const value = Number(opts.series[0])
    const targetAngle = this._angleAtValue(value)
    g.attr({
      'transform-origin': `${cx} ${cy}`,
      transform: `rotate(${targetAngle})`,
    })

    return g
  }

  /**
   * @param {Record<string, any>} opts
   */
  drawHollow(opts) {
    const graphics = new Graphics(this.w)

    const circle = graphics.drawCircle(opts.size * 2)

    circle.attr({
      class: 'apexcharts-radialbar-hollow',
      cx: opts.centerX,
      cy: opts.centerY,
      r: opts.size,
      fill: opts.fill,
    })

    return circle
  }

  /**
   * @param {Record<string, any>} opts
   * @param {any} g
   * @param {number} hollowSize
   * @param {string} hollowFillID
   */
  drawHollowImage(opts, g, hollowSize, hollowFillID) {
    const w = this.w
    const fill = new Fill(this.w)

    const randID = Utils.randomId()
    const hollowFillImg = w.config.plotOptions.radialBar.hollow.image

    if (w.config.plotOptions.radialBar.hollow.imageClipped) {
      fill.clippedImgArea({
        width: hollowSize,
        height: hollowSize,
        image: hollowFillImg,
        patternID: `pattern${w.globals.cuid}${randID}`,
      })
      hollowFillID = `url(#pattern${w.globals.cuid}${randID})`
    } else {
      const imgWidth = w.config.plotOptions.radialBar.hollow.imageWidth
      const imgHeight = w.config.plotOptions.radialBar.hollow.imageHeight
      if (imgWidth === undefined && imgHeight === undefined) {
        /**
         * @param {Record<string, any>} loader
         */
        const image = w.dom.Paper.image(
          hollowFillImg,
          /** @this {any} */
          function (/** @type {Record<string, any>} */ loader) {
            this.move(
              opts.centerX -
                loader.width / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY -
                loader.height / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetY,
            )
          },
        )
        g.add(image)
      } else {
        const image = w.dom.Paper.image(
          hollowFillImg,
          /** @this {any} */ function () {
            this.move(
              opts.centerX -
                imgWidth / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY -
                imgHeight / 2 +
                w.config.plotOptions.radialBar.hollow.imageOffsetY,
            )
            this.size(imgWidth, imgHeight)
          },
        )
        g.add(image)
      }
    }
    return hollowFillID
  }

  /**
   * @param {Record<string, any>} opts
   */
  getStrokeWidth(opts) {
    const w = this.w
    return (
      (opts.size *
        (100 - parseInt(w.config.plotOptions.radialBar.hollow.size, 10))) /
        100 /
        (opts.series.length + 1) -
      this.margin
    )
  }

  /**
   * @param {Event} e
   */
  onBarLabelClick(e) {
    const target = /** @type {Element} */ (e.target)
    const seriesIndex = parseInt(target.getAttribute('rel') ?? '', 10) - 1
    const legendClick = this.barLabels.onClick
    const w = this.w

    if (legendClick) {
      legendClick(w.seriesData.seriesNames[seriesIndex], { w, seriesIndex })
    }
  }
}

export default Radial
