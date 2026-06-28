// @ts-check
import Animations from '../modules/Animations'
import Fill from '../modules/Fill'
import Utils from '../utils/Utils'
import Graphics from '../modules/Graphics'
import Filters from '../modules/Filters'
import Scales from '../modules/Scales'
import Helpers from './common/circle/Helpers'
import { Environment } from '../utils/Environment'
/**
 * ApexCharts Pie Class for drawing Pie / Donut Charts.
 * @module Pie
 **/

class Pie {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w

    this.chartType = this.w.config.chart.type

    this.initialAnim = this.w.config.chart.animations.enabled
    this.dynamicAnim =
      this.initialAnim &&
      this.w.config.chart.animations.dynamicAnimation.enabled

    this.animBeginArr = [0]
    this.animDur = 0

    this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels

    this.lineColorArr =
      w.globals.stroke.colors !== undefined
        ? w.globals.stroke.colors
        : w.globals.colors

    this.defaultSize = Math.min(w.layout.gridWidth, w.layout.gridHeight)

    this.centerY = this.defaultSize / 2
    this.centerX = w.layout.gridWidth / 2

    if (w.config.chart.type === 'radialBar') {
      this.fullAngle = 360
    } else {
      this.fullAngle = Math.abs(
        w.config.plotOptions.pie.endAngle - w.config.plotOptions.pie.startAngle,
      )
    }
    this.initialAngle = w.config.plotOptions.pie.startAngle % this.fullAngle

    w.globals.radialSize =
      this.defaultSize / 2.05 -
      w.config.stroke.width -
      (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0)

    // Outer name labels (category name + leader line). Resolve config + the
    // font used for the names, then shrink the radius so the labels and their
    // connectors fit without clipping (see reserveExternalLabelSpace).
    this.externalCfg = w.config.plotOptions.pie.dataLabels.external
    const dlStyle = w.config.dataLabels.style
    this.externalLabelStyle = {
      fontSize: this.externalCfg.fontSize || dlStyle.fontSize,
      fontFamily: this.externalCfg.fontFamily || dlStyle.fontFamily,
      fontWeight: this.externalCfg.fontWeight || dlStyle.fontWeight,
    }
    /** @type {any[]} collected outer-label layout, drawn after de-overlap */
    this.externalLabels = []
    this.externalLabelMaxLines = 1
    this.externalLabelLineH = parseFloat(this.externalLabelStyle.fontSize) || 12
    w.globals.pieExternalLabelMarginY = 0

    // Outer name labels are only meaningful for pie/donut, where every slice
    // reaches the same outer edge. polarArea encodes value as the radial
    // length, so a rim-anchored leader line detaches from short slices and
    // reads like an axis label — skip it there.
    this.showExternalLabels = this.externalCfg.show && this.chartType !== 'polarArea'

    if (this.showExternalLabels && !w.globals.noData) {
      this.reserveExternalLabelSpace()
    }

    this.donutSize =
      (w.globals.radialSize *
        parseInt(w.config.plotOptions.pie.donut.size, 10)) /
      100

    const scaleSize = w.config.plotOptions.pie.customScale
    const halfW = w.layout.gridWidth / 2
    const halfH = w.layout.gridHeight / 2
    this.translateX = halfW - halfW * scaleSize
    this.translateY = halfH - halfH * scaleSize

    this.dataLabelsGroup = new Graphics(this.w).group({
      class: 'apexcharts-datalabels-group',
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${scaleSize})`,
    })

    this.maxY = 0
    /** @type {any} */
    /** @type {any[]} */
    this.sliceLabels = []
    /** @type {any} */
    this.sliceSizes = []

    /** @type {any} */
    this.prevSectorAngleArr = [] // for dynamic animations
  }

  /**
   * The text shown in an outer (name) label for slice `i`. Applies the
   * user `name.formatter` if provided, otherwise the raw series name. The
   * formatter may return a string or an array of strings (one per line, e.g.
   * `[name, percent]`); normalize via `getExternalLabelLines`.
   * @param {number} i
   * @returns {string | string[]}
   */
  getExternalLabelText(i) {
    const w = this.w
    const name = w.seriesData.seriesNames[i]
    const fn = this.externalCfg.formatter
    if (typeof fn === 'function') {
      return fn(name, {
        seriesIndex: i,
        percent: w.globals.seriesPercent?.[i]?.[0],
        value: w.globals.seriesTotals?.[i],
        w,
      })
    }
    return name == null ? '' : `${name}`
  }

  /**
   * Outer label content for slice `i` normalized to an array of line strings.
   * Supports a formatter returning an array, or a string with `\n` separators.
   * @param {number} i
   * @returns {string[]}
   */
  getExternalLabelLines(i) {
    const raw = this.getExternalLabelText(i)
    const arr = Array.isArray(raw) ? raw : `${raw == null ? '' : raw}`.split('\n')
    return arr.map((l) => (l == null ? '' : `${l}`))
  }

  /**
   * Shrink the pie radius (and reposition its center) so outer name labels and
   * their connector lines fit inside the chart area without clipping. Stores
   * the reserved vertical band on `w.globals.pieExternalLabelMarginY` so
   * Core.resizeNonAxisCharts can grow the SVG height to match.
   */
  reserveExternalLabelSpace() {
    const w = this.w
    const helpers = new Helpers(w)

    // Labels may be multi-line (e.g. name + percent). Measure every line and
    // track the tallest label so the reserved bands fit a 2-line block etc.
    const lineSets = (w.seriesData.seriesNames || []).map((_, i) =>
      this.getExternalLabelLines(i),
    )
    const maxLabelWidth = helpers.getMaxLabelWidth(lineSets.flat(), {
      fontSize: this.externalLabelStyle.fontSize,
      fontFamily: this.externalLabelStyle.fontFamily,
    })
    this.externalLabelMaxLines = lineSets.reduce((m, s) => Math.max(m, s.length), 1)
    this.externalLabelLineH = Math.round(
      (parseFloat(this.externalLabelStyle.fontSize) || 12) * 1.35,
    )

    const cn = this.externalCfg.connector
    const blockHeight = this.externalLabelMaxLines * this.externalLabelLineH
    // horizontal band on each side: text + connector run/gap + breathing room
    const mh = maxLabelWidth + (cn.length || 0) + (cn.gap || 0) + 12
    // vertical band above/below: half the tallest label + connector gap + pad
    const mv = blockHeight / 2 + (cn.gap || 0) + 6

    const fitted = Math.min(
      w.globals.radialSize,
      w.layout.gridWidth / 2 - mh,
      w.layout.gridHeight / 2 - mv,
    )
    // never collapse below a sane floor for very long labels / tiny charts
    w.globals.radialSize = Math.max(fitted, this.defaultSize * 0.15)
    w.globals.pieExternalLabelMarginY = mv

    const heightStr = w.config.chart.height ? String(w.config.chart.height) : ''
    const userSetFixedHeight = heightStr !== '' && heightStr !== 'auto'

    // For a fixed / percent height the container is NOT resized to hug the pie
    // (Core.resizeNonAxisCharts returns early), so center within gridHeight.
    // For an auto height the container is grown to 2*(radius+mv), so place the
    // center one band below the top.
    this.centerY = userSetFixedHeight
      ? w.layout.gridHeight / 2
      : w.globals.radialSize + mv
  }

  /**
   * @param {any[]} series
   */
  draw(series) {
    const self = this
    const w = this.w

    const graphics = new Graphics(this.w)

    const elPie = graphics.group({
      class: 'apexcharts-pie',
    })

    if (w.globals.noData) return elPie

    let total = 0
    for (let k = 0; k < series.length; k++) {
      // CALCULATE THE TOTAL
      total += Utils.negToZero(series[k])
    }

    const sectorAngleArr = []

    // el to which series will be drawn
    const elSeries = graphics.group()

    // prevent division by zero error if there is no data
    if (total === 0) {
      total = 0.00001
    }

    /**
     * @param {number} m
     */
    series.forEach((m) => {
      this.maxY = Math.max(this.maxY, m)
    })

    // override maxY if user provided in config
    if (w.config.yaxis[0].max) {
      this.maxY = w.config.yaxis[0].max
    }

    if (w.config.grid.position === 'back' && this.chartType === 'polarArea') {
      this.drawPolarElements(elPie)
    }

    for (let i = 0; i < series.length; i++) {
      // CALCULATE THE ANGLES
      const angle = (this.fullAngle * Utils.negToZero(series[i])) / total
      sectorAngleArr.push(angle)

      if (this.chartType === 'polarArea') {
        sectorAngleArr[i] = this.fullAngle / series.length
        this.sliceSizes.push((w.globals.radialSize * series[i]) / this.maxY)
      } else {
        this.sliceSizes.push(w.globals.radialSize)
      }
    }

    // Skip the previous-angle reconstruction when a cross-type morph is
    // active: drawArcs will use the captured path directly via the morph
    // feature, so the per-angle interpolation here would just compute
    // garbage on previousPaths that came from a different chart family.
    const morphActive = this.ctx.morphTypeChange?.isActive() === true

    if (w.globals.dataChanged && !morphActive) {
      let prevTotal = 0
      for (let k = 0; k < w.globals.previousPaths.length; k++) {
        // CALCULATE THE PREV TOTAL
        prevTotal += Utils.negToZero(w.globals.previousPaths[k])
      }

      let previousAngle

      for (let i = 0; i < w.globals.previousPaths.length; i++) {
        // CALCULATE THE PREVIOUS ANGLES
        previousAngle =
          (this.fullAngle * Utils.negToZero(w.globals.previousPaths[i])) /
          prevTotal
        this.prevSectorAngleArr.push(previousAngle)
      }
    }

    // on small chart size after few count of resizes browser window donutSize can be negative
    if (this.donutSize < 0) {
      this.donutSize = 0
    }

    if (this.chartType === 'donut') {
      // draw the inner circle and add some text to it
      const circle = graphics.drawCircle(this.donutSize)

      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: w.config.plotOptions.pie.donut.background
          ? w.config.plotOptions.pie.donut.background
          : 'transparent',
      })

      elSeries.add(circle)
    }

    const elG = self.drawArcs(sectorAngleArr, series)

    // add slice dataLabels at the end
    this.sliceLabels.forEach((s) => {
      elG.add(s)
    })

    elSeries.attr({
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${w.config.plotOptions.pie.customScale})`,
    })

    elSeries.add(elG)

    elPie.add(elSeries)

    if (this.donutDataLabels.show) {
      // On initial mount with animations enabled, the center label starts
      // hidden and fades in after the last slice finishes its sweep — so the
      // total/center value lands *with* the chart instead of before it.
      const shouldFadeInLabels =
        this.initialAnim &&
        !w.globals.resized &&
        !w.globals.dataChanged &&
        this.animDur > 0
      const dataLabels = this.renderInnerDataLabels(
        this.dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: shouldFadeInLabels ? 0 : this.donutDataLabels.show,
        },
      )

      if (shouldFadeInLabels) {
        const labelsNode = this.dataLabelsGroup.node
        labelsNode.style.transition = 'opacity 280ms ease-out'
        setTimeout(() => {
          labelsNode.style.opacity = '1'
        }, this.animDur)
      }

      elPie.add(dataLabels)
    }

    if (w.config.grid.position === 'front' && this.chartType === 'polarArea') {
      this.drawPolarElements(elPie)
    }

    return elPie
  }

  // core function for drawing pie arcs
  /**
   * @param {any[]} sectorAngleArr
   * @param {any[]} series
   */
  drawArcs(sectorAngleArr, series) {
    const w = this.w
    const filters = new Filters(this.w)

    const graphics = new Graphics(this.w)
    const fill = new Fill(this.w)
    const g = graphics.group({
      class: 'apexcharts-slices',
    })

    let startAngle = this.initialAngle
    let prevStartAngle = this.initialAngle
    let endAngle = this.initialAngle
    let prevEndAngle = this.initialAngle

    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0

    const morphActive = this.ctx.morphTypeChange?.isActive() === true

    for (let i = 0; i < sectorAngleArr.length; i++) {
      const elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i,
      })

      g.add(elPieArc)

      startAngle = endAngle
      prevStartAngle = prevEndAngle

      endAngle = startAngle + sectorAngleArr[i]
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i]

      const angle =
        endAngle < startAngle
          ? this.fullAngle + endAngle - startAngle
          : endAngle - startAngle

      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: this.sliceSizes[i],
        value: series[i],
      }) // additionally, pass size for gradient drawing in the fillPath function

      // For a cross-type morph, the initial path comes from the captured
      // outgoing snapshot (bar rect, radialBar arc, etc.). The SVGAnimation
      // .plot() chain below will interpolate that into the final pie path
      // via the existing morphPaths engine. Falls back to getChangedPath
      // for normal data-change updates when no morph is queued.
      const morphFrom = morphActive
        ? this.ctx.morphTypeChange.getInitialPathFor(i, 0)
        : null
      const path = morphFrom || this.getChangedPath(prevStartAngle, prevEndAngle)

      const elPath = graphics.drawPath({
        d: path,
        // Pie/donut/polarArea data is a single series, so a user-supplied
        // `stroke.colors` shorter than the slice count is NOT padded by the
        // theme engine (unlike fill colors, which cycle). Without this, only
        // slice 0 gets the requested color and the rest fall back to a grey
        // default. Cycle the array — matching fill-color behaviour — so a
        // single `stroke.colors: ['#fff']` borders every slice as expected.
        stroke: Array.isArray(this.lineColorArr)
          ? this.lineColorArr[i] ??
            this.lineColorArr[i % this.lineColorArr.length]
          : this.lineColorArr,
        strokeWidth: 0,
        fill: pathFill,
        fillOpacity: w.config.fill.opacity,
        classes: `apexcharts-pie-area apexcharts-${this.chartType.toLowerCase()}-slice-${i}`,
      })

      elPath.attr({
        index: 0,
        j: i,
      })

      filters.setSelectionFilter(elPath, 0, i)

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        filters.dropShadow(elPath, shadow, i)
      }

      this.addListeners(elPath, this.donutDataLabels)

      let labelPosition = {
        x: 0,
        y: 0,
      }

      const midAngle = (startAngle + angle / 2) % this.fullAngle
      let arcCenter = { x: this.centerX, y: this.centerY }

      if (this.chartType === 'pie' || this.chartType === 'polarArea') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 1.25 +
            w.config.plotOptions.pie.dataLabels.offset,
          midAngle,
        )
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 2,
          midAngle,
        )
      } else if (this.chartType === 'donut') {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2 +
            w.config.plotOptions.pie.dataLabels.offset,
          midAngle,
        )
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2,
          midAngle,
        )
      }

      Graphics.setAttrs(elPath.node, {
        'data:angle': angle,
        'data:startAngle': startAngle,
        'data:strokeWidth': this.strokeWidth,
        'data:value': series[i],
        'data:cx': arcCenter.x,
        'data:cy': arcCenter.y,
      })

      elPieArc.add(elPath)

      // Animation code starts
      let dur = 0
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = (angle / this.fullAngle) * w.config.chart.animations.speed

        if (dur === 0) dur = 1
        this.animDur = dur + this.animDur
        this.animBeginArr.push(this.animDur)
      } else {
        this.animBeginArr.push(0)
      }

      if (morphActive && morphFrom) {
        // Cross-type morph: bypass the angle-based animateArc loop and let
        // SVGAnimation's morphPaths interpolate from the captured outgoing
        // path to the final pie/donut/polarArea arc directly.
        const targetD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: this.sliceSizes[i],
        })
        const morphSpeed = this.ctx.morphTypeChange.getSpeed()
        const animations = this.ctx.animations
        elPath.node.setAttribute('data:pathOrig', targetD)
        const morphRunner = elPath
          .animate(morphSpeed)
          .plot(targetD, 'polygons')
          .attr({ 'stroke-width': this.strokeWidth })
        // The angle-based branches flag animationCompleted via animateArc; the
        // morph branch must do the same or w.globals.animationEnded stays false
        // after a cross-type morph. animationCompleted is idempotent, so firing
        // it per slice is safe.
        if (morphRunner && typeof morphRunner.after === 'function') {
          morphRunner.after(() => animations.animationCompleted(elPath))
        } else {
          animations.animationCompleted(elPath)
        }
      } else if (this.dynamicAnim && w.globals.dataChanged) {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          prevStartAngle,
          prevEndAngle,
          animateStartingPos: true,
          i,
          animBeginArr: this.animBeginArr,
          shouldSetPrevPaths: true,
          dur: w.config.chart.animations.dynamicAnimation.speed,
        })
      } else {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur,
        })
      }
      // animation code ends

      if (
        w.config.plotOptions.pie.expandOnClick &&
        this.chartType !== 'polarArea'
      ) {
        elPath.node.addEventListener('mouseup', this.pieClicked.bind(this, i))
      }

      if (
        typeof w.interact.selectedDataPoints[0] !== 'undefined' &&
        w.interact.selectedDataPoints[0].indexOf(i) > -1
      ) {
        // Defer the "pulled out" offset for pre-selected slices until after
        // the sweep finishes. Otherwise the slice translates while it's still
        // growing, which makes both motions hard to read.
        if (
          this.initialAnim &&
          !w.globals.resized &&
          !w.globals.dataChanged &&
          this.animDur > 0
        ) {
          const _this = this
          const _i = i
          setTimeout(() => _this.pieClicked(_i), this.animDur)
        } else {
          this.pieClicked(i)
        }
      }

      if (w.config.dataLabels.enabled) {
        const xPos = labelPosition.x
        const yPos = labelPosition.y
        let text = (100 * angle) / this.fullAngle + '%'

        if (
          angle !== 0 &&
          w.config.plotOptions.pie.dataLabels.minAngleToShowLabel <
            sectorAngleArr[i]
        ) {
          const formatter = w.config.dataLabels.formatter
          if (formatter !== undefined) {
            text = formatter(w.globals.seriesPercent[i][0], {
              seriesIndex: i,
              w,
            })
          }
          const foreColor = w.globals.dataLabels.style.colors[i]

          const elPieLabelWrap = graphics.group({
            class: `apexcharts-datalabels`,
          })
          const elPieLabel = graphics.drawText({
            x: xPos,
            y: yPos,
            text,
            textAnchor: 'middle',
            fontSize: w.config.dataLabels.style.fontSize,
            fontFamily: w.config.dataLabels.style.fontFamily,
            fontWeight: w.config.dataLabels.style.fontWeight,
            foreColor,
          })

          elPieLabelWrap.add(elPieLabel)
          if (w.config.dataLabels.dropShadow.enabled) {
            const textShadow = w.config.dataLabels.dropShadow
            filters.dropShadow(elPieLabel, textShadow)
          }

          elPieLabel.node.classList.add('apexcharts-pie-label')
          if (
            w.config.chart.animations.animate &&
            w.globals.resized === false
          ) {
            elPieLabel.node.classList.add('apexcharts-pie-label-delay')
            elPieLabel.node.style.animationDelay =
              w.config.chart.animations.speed / 940 + 's'
          }

          this.sliceLabels.push(elPieLabelWrap)
        }
      }

      // Outer (name) label: collect geometry now, draw after the loop so the
      // de-overlap pass can space crowded labels before they hit the DOM.
      if (this.showExternalLabels && angle !== 0) {
        const lines = this.getExternalLabelLines(i)
        if (lines.some((l) => l !== '')) {
          const anchor = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w.globals.radialSize,
            midAngle,
          )
          const elbow = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w.globals.radialSize + (this.externalCfg.connector.gap || 0),
            midAngle,
          )
          const isRight = elbow.x >= this.centerX
          const baseLabelX = isRight
            ? elbow.x + (this.externalCfg.connector.length || 0)
            : elbow.x - (this.externalCfg.connector.length || 0)

          this.externalLabels.push({
            lines,
            anchor,
            elbow,
            side: isRight ? 'right' : 'left',
            labelX: baseLabelX + parseFloat(this.externalCfg.offsetX || 0),
            idealY: elbow.y + parseFloat(this.externalCfg.offsetY || 0),
            connectorColor: this.externalCfg.connector.color || w.globals.colors[i],
            foreColor: this.externalCfg.color || w.config.chart.foreColor,
          })
        }
      }
    }

    if (this.showExternalLabels && this.externalLabels.length) {
      this.placeExternalLabels()

      // External labels + connectors are overlays on top of the animated slice
      // sweep, so reveal them gradually once the sweep finishes instead of
      // popping in instantly — same mechanism as markers / data labels
      // (delayedElements + apexcharts-element-hidden, faded back in by
      // Animations.showDelayedElements on animationCompleted). Only arm this
      // when a sweep that actually fires animationCompleted will run — matching
      // the three animating branches below (morph, dynamic data-change, initial
      // mount). For resize / animations-off / SSR (no animationCompleted) the
      // labels must render visible so they don't stay stuck hidden.
      const revealOnAnimEnd =
        Environment.isBrowser() &&
        (morphActive ||
          (this.dynamicAnim && w.globals.dataChanged) ||
          (this.initialAnim && !w.globals.resized && !w.globals.dataChanged))

      this.externalLabels.forEach((lbl) => {
        const group = new Helpers(w).drawExternalLabel({
          lines: lbl.lines,
          lineHeight: this.externalLabelLineH,
          anchor: lbl.anchor,
          elbow: lbl.elbow,
          labelX: lbl.labelX,
          labelY: lbl.labelY,
          side: lbl.side,
          connector: {
            show: this.externalCfg.connector.show,
            width: this.externalCfg.connector.width,
            color: lbl.connectorColor,
          },
          style: this.externalLabelStyle,
          foreColor: lbl.foreColor,
        })

        if (revealOnAnimEnd) {
          group.node.classList.add('apexcharts-element-hidden')
          w.globals.delayedElements.push({ el: group.node })
        }

        g.add(group)
      })
    }

    return g
  }

  /**
   * Vertical de-overlap for outer (name) labels: per side, sort by ideal y and
   * push neighbours apart so they keep at least one line-height of spacing.
   * Mutates each entry's `labelY`. Connector lines re-route to the moved y.
   */
  placeExternalLabels() {
    const w = this.w
    // Minimum spacing is a full label block (n lines) so multi-line labels
    // (e.g. name + percent) don't overlap their neighbours.
    const lineHeight = this.externalLabelMaxLines * this.externalLabelLineH + 2
    const maxY =
      this.centerY + w.globals.radialSize + w.globals.pieExternalLabelMarginY

    ;['left', 'right'].forEach((side) => {
      const items = this.externalLabels
        .filter((l) => l.side === side)
        .sort((a, b) => a.idealY - b.idealY)

      items.forEach((l) => {
        l.labelY = l.idealY
      })

      // forward pass: push each label down to keep the minimum gap
      for (let k = 1; k < items.length; k++) {
        if (items[k].labelY - items[k - 1].labelY < lineHeight) {
          items[k].labelY = items[k - 1].labelY + lineHeight
        }
      }

      // if the column ran past the bottom, pull it back up as a block
      const last = items[items.length - 1]
      const overflow = last ? last.labelY - maxY : 0
      if (overflow > 0) {
        for (let k = items.length - 1; k >= 0; k--) {
          items[k].labelY -= overflow
          if (
            k < items.length - 1 &&
            items[k + 1].labelY - items[k].labelY < lineHeight
          ) {
            items[k].labelY = items[k + 1].labelY - lineHeight
          }
        }
      }
    })
  }

  /**
   * @param {any} elPath
   * @param {Record<string, any>} dataLabels
   */
  addListeners(elPath, dataLabels) {
    const graphics = new Graphics(this.w)
    // append filters on mouseenter and mouseleave
    elPath.node.addEventListener(
      'mouseenter',
      graphics.pathMouseEnter.bind(this, elPath),
    )

    elPath.node.addEventListener(
      'mouseleave',
      graphics.pathMouseLeave.bind(this, elPath),
    )
    elPath.node.addEventListener(
      'mouseleave',
      this.revertDataLabelsInner.bind(this),
    )
    elPath.node.addEventListener(
      'mousedown',
      graphics.pathMouseDown.bind(this, elPath),
    )

    if (!this.donutDataLabels.total.showAlways) {
      elPath.node.addEventListener(
        'mouseenter',
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels),
      )

      elPath.node.addEventListener(
        'mousedown',
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels),
      )
    }
  }

  // This function can be used for other circle charts too
  /**
   * @param {any} el
   * @param {Record<string, any>} opts
   */
  animatePaths(el, opts) {
    const w = this.w
    const me = this

    let angle =
      opts.endAngle < opts.startAngle
        ? this.fullAngle + opts.endAngle - opts.startAngle
        : opts.endAngle - opts.startAngle
    let prevAngle = angle

    let fromStartAngle = opts.startAngle
    const toStartAngle = opts.startAngle

    if (opts.prevStartAngle !== undefined && opts.prevEndAngle !== undefined) {
      fromStartAngle = opts.prevEndAngle
      prevAngle =
        opts.prevEndAngle < opts.prevStartAngle
          ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle
          : opts.prevEndAngle - opts.prevStartAngle
    }
    if (opts.i === w.config.series.length - 1) {
      // some adjustments for the last overlapping paths
      if (angle + toStartAngle > this.fullAngle) {
        opts.endAngle = opts.endAngle - (angle + toStartAngle)
      } else if (angle + toStartAngle < this.fullAngle) {
        opts.endAngle =
          opts.endAngle + (this.fullAngle - (angle + toStartAngle))
      }
    }

    if (angle === this.fullAngle) angle = this.fullAngle - 0.01

    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts)
  }

  /**
   * @param {any} el
   * @param {number} fromStartAngle
   * @param {number} toStartAngle
   * @param {number} angle
   * @param {number} prevAngle
   * @param {Record<string, any>} opts
   */
  animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts) {
    const me = this
    const w = this.w
    const animations = new Animations(this.w)

    const size = opts.size

    let path

    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle
      prevAngle = angle
      opts.dur = 0
    }

    let currAngle = angle
    let startAngle = toStartAngle
    const fromAngle =
      fromStartAngle < toStartAngle
        ? this.fullAngle + fromStartAngle - toStartAngle
        : fromStartAngle - toStartAngle

    if (w.globals.dataChanged && opts.shouldSetPrevPaths) {
      // to avoid flicker when updating, set prev path first and then animate from there
      if (opts.prevEndAngle) {
        path = me.getPiePath({
          me,
          startAngle: opts.prevStartAngle,
          angle:
            opts.prevEndAngle < opts.prevStartAngle
              ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle
              : opts.prevEndAngle - opts.prevStartAngle,
          size,
        })
        el.attr({ d: path })
      }
    }

    if (opts.dur !== 0) {
      el.animate(opts.dur, opts.animBeginArr[opts.i])
        .after(
          /** @this {any} */ function () {
            if (
              me.chartType === 'pie' ||
              me.chartType === 'donut' ||
              me.chartType === 'polarArea'
            ) {
              this.animate(
                w.config.chart.animations.dynamicAnimation.speed,
              ).attr({
                'stroke-width': me.strokeWidth,
              })
            }

            if (opts.i === w.config.series.length - 1) {
              animations.animationCompleted(el)
            }
          },
        )
        /**
         * @param {Record<string, any>} pos
         */
        .during((/** @type {any} */ pos) => {
          currAngle = fromAngle + (angle - fromAngle) * pos
          if (opts.animateStartingPos) {
            currAngle = prevAngle + (angle - prevAngle) * pos
            startAngle =
              fromStartAngle -
              prevAngle +
              (toStartAngle - (fromStartAngle - prevAngle)) * pos
          }

          path = me.getPiePath({
            me,
            startAngle,
            angle: currAngle,
            size,
          })

          el.node.setAttribute('data:pathOrig', path)

          el.attr({
            d: path,
          })
        })
    } else {
      path = me.getPiePath({
        me,
        startAngle,
        angle,
        size,
      })

      if (!opts.isTrack) {
        w.globals.animationEnded = true
      }
      el.node.setAttribute('data:pathOrig', path)

      el.attr({
        d: path,
        'stroke-width': me.strokeWidth,
      })
    }
  }

  /**
   * @param {number} i
   */
  pieClicked(i) {
    const w = this.w
    const me = this
    const size =
      me.sliceSizes[i] + (w.config.plotOptions.pie.expandOnClick ? 4 : 0)
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${me.chartType.toLowerCase()}-slice-${i}`,
    )

    if (elPath.attr('data:pieClicked') === 'true') {
      elPath.attr({
        'data:pieClicked': 'false',
      })
      this.revertDataLabelsInner()

      const origPath = elPath.attr('data:pathOrig')
      elPath.attr({
        d: origPath,
      })
      return
    } else {
      // reset all elems
      const allEls = w.dom.baseEl.getElementsByClassName('apexcharts-pie-area')
      /**
       * @param {any} pieSlice
       */
      Array.prototype.forEach.call(allEls, (pieSlice) => {
        pieSlice.setAttribute('data:pieClicked', 'false')
        const origPath = pieSlice.getAttribute('data:pathOrig')
        if (origPath) {
          pieSlice.setAttribute('d', origPath)
        }
      })
      w.interact.capturedDataPointIndex = i

      elPath.attr('data:pieClicked', 'true')
    }

    const startAngle = parseInt(elPath.attr('data:startAngle'), 10)
    const angle = parseInt(elPath.attr('data:angle'), 10)

    const path = me.getPiePath({
      me,
      startAngle,
      angle,
      size,
    })

    if (angle === 360) return

    elPath.plot(path)
  }

  /**
   * @param {number} prevStartAngle
   * @param {number} prevEndAngle
   */
  getChangedPath(prevStartAngle, prevEndAngle) {
    let path = ''
    if (this.dynamicAnim && this.w.globals.dataChanged) {
      path = this.getPiePath({
        me: this,
        startAngle: prevStartAngle,
        angle: prevEndAngle - prevStartAngle,
        // @ts-ignore — size is set dynamically during draw()
        size: this.size,
      })
    }
    return path
  }

  /** @param {{me: any, startAngle: any, angle: any, size: any}} opts */
  getPiePath({ me, startAngle, angle, size }) {
    let path
    const graphics = new Graphics(this.w)

    const startDeg = startAngle
    const startRadians = (Math.PI * (startDeg - 90)) / 180

    let endDeg = angle + startAngle
    // prevent overlap
    if (
      Math.ceil(endDeg) >=
      this.fullAngle +
        (this.w.config.plotOptions.pie.startAngle % this.fullAngle)
    ) {
      endDeg =
        this.fullAngle +
        (this.w.config.plotOptions.pie.startAngle % this.fullAngle) -
        0.01
    }
    if (Math.ceil(endDeg) > this.fullAngle) endDeg -= this.fullAngle

    const endRadians = (Math.PI * (endDeg - 90)) / 180

    const x1 = me.centerX + size * Math.cos(startRadians)
    const y1 = me.centerY + size * Math.sin(startRadians)
    const x2 = me.centerX + size * Math.cos(endRadians)
    const y2 = me.centerY + size * Math.sin(endRadians)

    const startInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      endDeg,
    )
    const endInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      startDeg,
    )

    const largeArc = angle > 180 ? 1 : 0

    const pathBeginning = ['M', x1, y1, 'A', size, size, 0, largeArc, 1, x2, y2]

    if (me.chartType === 'donut') {
      path = [
        ...pathBeginning,
        'L',
        startInner.x,
        startInner.y,
        'A',
        me.donutSize,
        me.donutSize,
        0,
        largeArc,
        0,
        endInner.x,
        endInner.y,
        'L',
        x1,
        y1,
        'z',
      ].join(' ')
    } else if (me.chartType === 'pie' || me.chartType === 'polarArea') {
      path = [...pathBeginning, 'L', me.centerX, me.centerY, 'L', x1, y1].join(
        ' ',
      )
    } else {
      path = [...pathBeginning].join(' ')
    }

    return graphics.roundPathCorners(path, this.strokeWidth * 2)
  }

  /**
   * @param {any} parent
   */
  drawPolarElements(parent) {
    const w = this.w
    const scale = new Scales(this.w)
    const graphics = new Graphics(this.w)
    const helpers = new Helpers(this.w)

    const gCircles = graphics.group()
    const gYAxis = graphics.group()

    const yScale = scale.niceScale(0, Math.ceil(this.maxY), 0)

    const yTexts = yScale.result.reverse()
    const len = yScale.result.length

    this.maxY = yScale.niceMax

    let circleSize = w.globals.radialSize
    const diff = circleSize / (len - 1)

    for (let i = 0; i < len - 1; i++) {
      const circle = graphics.drawCircle(circleSize)

      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: 'none',
        'stroke-width': w.config.plotOptions.polarArea.rings.strokeWidth,
        stroke: w.config.plotOptions.polarArea.rings.strokeColor,
      })

      if (w.config.yaxis[0].show) {
        const yLabel = helpers.drawYAxisTexts(
          this.centerX,
          this.centerY -
            circleSize +
            parseInt(w.config.yaxis[0].labels.style.fontSize, 10) / 2,
          i,
          yTexts[i],
        )

        gYAxis.add(yLabel)
      }

      gCircles.add(circle)

      circleSize = circleSize - diff
    }

    this.drawSpokes(parent)

    parent.add(gCircles)
    parent.add(gYAxis)
  }

  /**
   * @param {any} dataLabelsGroup
   * @param {Record<string, any>} dataLabelsConfig
   * @param {Record<string, any>} opts
   */
  renderInnerDataLabels(dataLabelsGroup, dataLabelsConfig, opts) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const showTotal = dataLabelsConfig.total.show

    dataLabelsGroup.node.innerHTML = ''
    dataLabelsGroup.node.style.opacity = opts.opacity

    const x = opts.centerX
    const y = !this.donutDataLabels.total.label
      ? opts.centerY - opts.centerY / 6
      : opts.centerY

    let labelColor, valueColor

    if (dataLabelsConfig.name.color === undefined) {
      labelColor = w.globals.colors[0]
    } else {
      labelColor = dataLabelsConfig.name.color
    }
    let labelFontSize = dataLabelsConfig.name.fontSize
    let labelFontFamily = dataLabelsConfig.name.fontFamily
    let labelFontWeight = dataLabelsConfig.name.fontWeight

    if (dataLabelsConfig.value.color === undefined) {
      valueColor = w.config.chart.foreColor
    } else {
      valueColor = dataLabelsConfig.value.color
    }

    const lbFormatter = dataLabelsConfig.value.formatter
    let val = ''
    let name = ''

    if (showTotal) {
      labelColor = dataLabelsConfig.total.color
      labelFontSize = dataLabelsConfig.total.fontSize
      labelFontFamily = dataLabelsConfig.total.fontFamily
      labelFontWeight = dataLabelsConfig.total.fontWeight
      name = !this.donutDataLabels.total.label
        ? ''
        : dataLabelsConfig.total.label
      val = dataLabelsConfig.total.formatter(w)
    } else {
      if (w.seriesData.series.length === 1) {
        val = lbFormatter(w.seriesData.series[0], w)
        name = w.seriesData.seriesNames[0]
      }
    }

    if (name) {
      name = dataLabelsConfig.name.formatter(
        name,
        dataLabelsConfig.total.show,
        w,
      )
    }

    if (dataLabelsConfig.name.show) {
      const elLabel = graphics.drawText({
        x,
        y: y + parseFloat(dataLabelsConfig.name.offsetY),
        text: name,
        textAnchor: 'middle',
        foreColor: labelColor,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily,
      })
      elLabel.node.classList.add('apexcharts-datalabel-label')
      dataLabelsGroup.add(elLabel)
    }

    if (dataLabelsConfig.value.show) {
      const valOffset = dataLabelsConfig.name.show
        ? parseFloat(dataLabelsConfig.value.offsetY) + 16
        : dataLabelsConfig.value.offsetY

      const elValue = graphics.drawText({
        x,
        y: y + valOffset,
        text: val,
        textAnchor: 'middle',
        foreColor: valueColor,
        fontWeight: dataLabelsConfig.value.fontWeight,
        fontSize: dataLabelsConfig.value.fontSize,
        fontFamily: dataLabelsConfig.value.fontFamily,
      })
      elValue.node.classList.add('apexcharts-datalabel-value')
      dataLabelsGroup.add(elValue)
    }

    // for a multi-series circle chart, we need to show total value instead of first series labels

    return dataLabelsGroup
  }

  /**
   *
   * @param {string} name - The name of the series
   * @param {string} val - The value of that series
   * @param {any} el - Optional el (indicates which series was hovered/clicked). If this param is not present, means we need to show total
   * @param {Record<string, any>} labelsConfig
   */
  printInnerLabels(labelsConfig, name, val, el) {
    const w = this.w

    let labelColor

    if (el) {
      if (labelsConfig.name.color === undefined) {
        labelColor =
          w.globals.colors[parseInt(el.parentNode.getAttribute('rel'), 10) - 1]
      } else {
        labelColor = labelsConfig.name.color
      }
    } else {
      if (w.seriesData.series.length > 1 && labelsConfig.total.show) {
        labelColor = labelsConfig.total.color
      }
    }

    const elLabel = w.dom.baseEl.querySelector('.apexcharts-datalabel-label')
    const elValue = w.dom.baseEl.querySelector('.apexcharts-datalabel-value')

    const lbFormatter = labelsConfig.value.formatter
    val = lbFormatter(val, w)

    // we need to show Total Val - so get the formatter of it
    if (!el && typeof labelsConfig.total.formatter === 'function') {
      val = labelsConfig.total.formatter(w)
    }

    const isTotal = name === labelsConfig.total.label
    name = !this.donutDataLabels.total.label
      ? ''
      : labelsConfig.name.formatter(name, isTotal, w)

    if (elLabel !== null) {
      elLabel.textContent = name
    }

    if (elValue !== null) {
      elValue.textContent = val
    }
    if (elLabel !== null) {
      const elLabelEl = /** @type {HTMLElement} */ (elLabel)
      elLabelEl.style.fill = labelColor
    }
  }

  /**
   * @param {any} el
   * @param {Record<string, any>} dataLabelsConfig
   */
  printDataLabelsInner(el, dataLabelsConfig) {
    const w = this.w

    const val = el.getAttribute('data:value')
    const name =
      w.seriesData.seriesNames[
        parseInt(el.parentNode.getAttribute('rel'), 10) - 1
      ]

    if (w.seriesData.series.length > 1) {
      this.printInnerLabels(dataLabelsConfig, name, val, el)
    }

    const dataLabelsGroup = w.dom.baseEl.querySelector(
      '.apexcharts-datalabels-group',
    )
    if (dataLabelsGroup !== null) {
      const dataLabelsGroupEl = /** @type {HTMLElement} */ (dataLabelsGroup)
      dataLabelsGroupEl.style.opacity = '1'
    }
  }

  /**
   * @param {any} parent
   */
  drawSpokes(parent) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const spokeConfig = w.config.plotOptions.polarArea.spokes

    if (spokeConfig.strokeWidth === 0) return

    const spokes = []

    const angleDivision = 360 / w.seriesData.series.length
    for (let i = 0; i < w.seriesData.series.length; i++) {
      spokes.push(
        Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize,
          w.config.plotOptions.pie.startAngle + angleDivision * i,
        ),
      )
    }

    spokes.forEach((p, i) => {
      const line = graphics.drawLine(
        p.x,
        p.y,
        this.centerX,
        this.centerY,
        Array.isArray(spokeConfig.connectorColors)
          ? spokeConfig.connectorColors[i]
          : spokeConfig.connectorColors,
      )

      parent.add(line)
    })
  }

  revertDataLabelsInner() {
    const w = this.w
    if (this.donutDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`,
      )

      const dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show,
        },
      )

      const elPie = w.dom.Paper.findOne(
        '.apexcharts-radialbar, .apexcharts-pie',
      )
      elPie.add(dataLabels)
    }
  }
}

export default Pie
