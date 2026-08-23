// @ts-check
import CoreUtils from '../CoreUtils'
import Utils from '../../utils/Utils'
import { applyProgressiveReveal } from '../Animations'

export default class Helpers {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w
    this.annoCtx = annoCtx
  }

  /**
   * @param {Record<string, any>} anno
   * @param {number | null} [annoIndex]
   */
  setOrientations(anno, annoIndex = null) {
    const w = this.w

    if (anno.label.orientation === 'vertical') {
      const i = annoIndex !== null ? annoIndex : 0
      const xAnno = w.dom.baseEl.querySelector(
        `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`,
      )

      if (xAnno !== null) {
        const xAnnoCoord = /** @type {SVGGraphicsElement} */ (xAnno).getBBox()
        xAnno.setAttribute(
          'x',
          String(
            parseFloat(xAnno.getAttribute('x') ?? '0') - xAnnoCoord.height + 4,
          ),
        )

        const yOffset =
          anno.label.position === 'top' ? xAnnoCoord.width : -xAnnoCoord.width
        xAnno.setAttribute(
          'y',
          String(parseFloat(xAnno.getAttribute('y') ?? '0') + yOffset),
        )

        const { x, y } = this.annoCtx.graphics.rotateAroundCenter(xAnno)
        xAnno.setAttribute('transform', `rotate(-90 ${x} ${y})`)
      }
    }
  }

  /**
   * @param {any} annoEl
   * @param {Record<string, any>} anno
   */
  addBackgroundToAnno(annoEl, anno) {
    const w = this.w

    if (!annoEl || !anno.label.text || !String(anno.label.text).trim()) {
      return null
    }

    // We compute the difference between the bounding client rect and the BBox to
    // correctly scale the drawn rectangle when chart is in a container with a
    //  CSS zoom level != 100%.
    const gridEl = w.dom.baseEl.querySelector('.apexcharts-grid')
    if (!gridEl) return null
    const elGridRect = gridEl.getBoundingClientRect()
    const gridBBox = /** @type {SVGGraphicsElement} */ (gridEl).getBBox()
    const zoom = elGridRect.width / gridBBox.width || 1

    const coords = annoEl.getBoundingClientRect()

    let {
      left: pleft,
      right: pright,
      top: ptop,
      bottom: pbottom,
    } = anno.label.style.padding

    if (anno.label.orientation === 'vertical') {
      ;[ptop, pbottom, pleft, pright] = [pleft, pright, ptop, pbottom]
    }

    // The rect is drawn in the annotation group's LOCAL coordinates, so these
    // client-space deltas have to be measured from the grid's local (0, 0) --
    // not from the left/top edge of whatever the grid group happens to render.
    // Those are the same point only while the grid draws nothing outside its
    // own box, and it draws outside on both axis types this file serves: a
    // datetime axis whose first timescale tick is floored to the calendar
    // boundary before minX (DateTime.js ceilToBoundary), and a numeric bar
    // chart, whose gridlines run out to -barPadForNumericAxis so edge bars are
    // not clipped. bbox.x/y are in local units, hence the zoom multiply.
    const gridLeft = elGridRect.left - gridBBox.x * zoom
    const gridTop = elGridRect.top - gridBBox.y * zoom

    const x1 = (coords.left - gridLeft) / zoom - pleft
    const y1 = (coords.top - gridTop) / zoom - ptop
    const elRect = this.annoCtx.graphics.drawRect(
      x1,
      y1,
      coords.width / zoom + pleft + pright,
      coords.height / zoom + ptop + pbottom,
      anno.label.borderRadius,
      anno.label.style.background,
      1,
      anno.label.borderWidth,
      anno.label.borderColor,
      0,
    )

    if (anno.id) {
      elRect.node.classList.add(anno.id)
    }

    return elRect
  }

  annotationsBackground() {
    const w = this.w

    /**
     * @param {Record<string, any>} anno
     * @param {number} i
     * @param {string} type
     */
    const add = (anno, i, type) => {
      const annoLabel = w.dom.baseEl.querySelector(
        `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i}']`,
      )

      if (annoLabel) {
        const parent = annoLabel.parentNode
        const elRect = this.addBackgroundToAnno(annoLabel, anno)

        if (elRect) {
          parent?.insertBefore(elRect.node, annoLabel)

          // Mirror the label's progressive reveal onto the background rect so
          // it doesn't pop in before the line draw reaches the annotation x.
          const labelX = annoLabel.getAttribute('x')
          if (labelX !== null) {
            applyProgressiveReveal(elRect, parseFloat(labelX), w)
          }

          if (anno.label.mouseEnter) {
            elRect.node.addEventListener(
              'mouseenter',
              anno.label.mouseEnter.bind(this, anno),
            )
          }
          if (anno.label.mouseLeave) {
            elRect.node.addEventListener(
              'mouseleave',
              anno.label.mouseLeave.bind(this, anno),
            )
          }
          if (anno.label.click) {
            elRect.node.addEventListener(
              'click',
              anno.label.click.bind(this, anno),
            )
          }
        }
      }
    }

    /**
     * @param {Record<string, any>} anno
     * @param {number} i
     */
    w.config.annotations.xaxis.forEach(
      (/** @type {any} */ anno, /** @type {any} */ i) => add(anno, i, 'xaxis'),
    )
    /**
     * @param {Record<string, any>} anno
     * @param {number} i
     */
    w.config.annotations.yaxis.forEach(
      (/** @type {any} */ anno, /** @type {any} */ i) => add(anno, i, 'yaxis'),
    )
    /**
     * @param {Record<string, any>} anno
     * @param {number} i
     */
    w.config.annotations.points.forEach(
      (/** @type {any} */ anno, /** @type {any} */ i) => add(anno, i, 'point'),
    )
  }

  /**
   * Does the x position take the category branch of `getX1X2` (a label lookup)
   * rather than projecting through a numeric domain? Mirrors the conditions
   * applied there, so the two cannot drift apart.
   *
   * @returns {boolean}
   */
  usesCategoryX() {
    const w = this.w

    return (
      (w.config.xaxis.type === 'category' ||
        w.config.xaxis.convertedCatToNumeric) &&
      !this.annoCtx.invertAxis &&
      !w.axisFlags.dataFormatXNumeric &&
      !w.config.chart.sparkline.enabled
    )
  }

  /**
   * Is there a real domain for an x position to project through?
   *
   * An empty series still gets a laid-out grid and a y scale (the default 0..6,
   * or the configured `yaxis.min`/`max`), which is why a y-axis annotation is
   * always placeable. Nothing bounds the x domain though: `maxX` is left
   * undefined and `xRange` is NaN, and a category axis has no labels to index
   * into. Projecting through that is silently wrong rather than merely absent:
   * NaN sails past the clip comparisons in `getX1X2` (both `NaN > gridWidth`
   * and `NaN < 0` are false), and the category branch hands back the raw value
   * as a pixel offset, so `x: 5` draws 5px from the grid's left edge.
   *
   * Gating each annotation on this replaces the chart-wide `dataPoints` check
   * that used to sit in `drawAxesAnnotations()` (#1832), which suppressed the
   * placeable y-axis annotations along with the unplaceable x ones (#5278).
   *
   * @returns {boolean}
   */
  hasXDomain() {
    const w = this.w

    if (this.annoCtx.invertAxis) {
      // A horizontal bar reads the y scale for horizontal position. Its
      // minX/xRange are never populated (they sit at ±MAX_VALUE / Infinity even
      // with data), so they must not be consulted here.
      return (
        Utils.isNumber(w.globals.minY) && Utils.isNumber(w.globals.yRange[0])
      )
    }

    if (this.usesCategoryX()) {
      return (
        w.labelData.labels.length > 0 || w.labelData.categoryLabels.length > 0
      )
    }

    return Utils.isNumber(w.globals.minX) && Utils.isNumber(w.globals.xRange)
  }

  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getY1Y2(type, anno) {
    const w = this.w
    const y = type === 'y1' ? anno.y : anno.y2
    const isPx = typeof y === 'string' && y.includes('px')
    let yP
    let clipped = false

    if (this.annoCtx.invertAxis) {
      const labels = w.config.xaxis.convertedCatToNumeric
        ? w.labelData.categoryLabels
        : w.labelData.labels
      const catIndex = labels.indexOf(y)

      // On a horizontal bar the y value names a category, so it has to resolve
      // to one. It doesn't when the chart has no data (no categories exist yet)
      // or when the value simply isn't in the list. Both used to place the
      // annotation at -barHeight instead of dropping it.
      if (!isPx && catIndex === -1) {
        return { yP: 0, clipped: true }
      }

      const xLabel = w.dom.baseEl.querySelector(
        `.apexcharts-yaxis-texts-g text:nth-child(${catIndex + 1})`,
      )

      yP = xLabel
        ? parseFloat(xLabel.getAttribute('y') ?? '0')
        : (w.layout.gridHeight / labels.length - 1) * (catIndex + 1) -
          w.globals.barHeight

      if (anno.seriesIndex !== undefined && w.globals.barHeight) {
        yP -=
          (w.globals.barHeight / 2) * (w.seriesData.series.length - 1) -
          w.globals.barHeight * anno.seriesIndex
      }
    } else {
      // An annotation is placed against the scale of whichever series owns its
      // y axis. Two ways that lookup comes up empty, which need opposite
      // answers:
      //
      //  - The yAxisIndex is out of range (e.g. addPointAnnotation({
      //    yAxisIndex: 2 }) on a single-y-axis chart). There is no such axis, so
      //    clip. Reading seriesYAxisMap[idx][0] here would throw and take the
      //    whole render down with it.
      //  - The axis exists but nothing is plotted on it yet (`series: []`, the
      //    shape a chart renders in while its data loads). The axis is drawn and
      //    labelled from the chart-level domain, so project through that.
      if (!w.config.yaxis[anno.yAxisIndex]) {
        return { yP: 0, clipped: true }
      }
      const yAxisMap = w.globals.seriesYAxisMap[anno.yAxisIndex]
      const seriesIndex = yAxisMap?.[0] ?? null
      if (seriesIndex === null && w.seriesData.series.length) {
        return { yP: 0, clipped: true }
      }

      const yMin =
        seriesIndex === null ? w.globals.minY : w.globals.minYArr[seriesIndex]
      const yRange =
        seriesIndex === null
          ? w.globals.maxY - w.globals.minY
          : w.globals.yRange[seriesIndex]

      const yPos =
        w.config.yaxis[anno.yAxisIndex].logarithmic && seriesIndex !== null
          ? new CoreUtils(this.w).getLogVal(
              w.config.yaxis[anno.yAxisIndex].logBase,
              y,
              seriesIndex,
            ) / /** @type {any} */ (w.globals).yLogRatio[seriesIndex]
          : (y - yMin) / (yRange / w.layout.gridHeight)

      yP =
        w.layout.gridHeight - Math.min(Math.max(yPos, 0), w.layout.gridHeight)
      clipped = yPos > w.layout.gridHeight || yPos < 0

      if (anno.marker && (anno.y === undefined || anno.y === null)) {
        yP = 0
      }

      if (w.config.yaxis[anno.yAxisIndex]?.reversed) {
        yP = yPos
      }
    }

    if (isPx) {
      yP = parseFloat(/** @type {string} */ (y))
    }

    return { yP, clipped }
  }

  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getX1X2(type, anno) {
    const w = this.w
    const x = type === 'x1' ? anno.x : anno.x2
    const min = this.annoCtx.invertAxis ? w.globals.minY : w.globals.minX
    const max = this.annoCtx.invertAxis ? w.globals.maxY : w.globals.maxX
    const range = this.annoCtx.invertAxis
      ? w.globals.yRange[0]
      : w.globals.xRange
    let clipped = false

    // A pixel value and a marker pinned to the grid edge are positioned without
    // consulting a domain, so they stay placeable on an empty chart. Everything
    // else has to project through one, so refuse when there isn't one to
    // project through rather than drawing at a meaningless pixel. See
    // hasXDomain().
    const isPx = typeof x === 'string' && x.includes('px')
    const isEdgeMarker = (x === undefined || x === null) && anno.marker
    if (!isPx && !isEdgeMarker && !this.hasXDomain()) {
      return { x: 0, clipped: true }
    }

    let xP = this.annoCtx.inversedReversedAxis
      ? (max - x) / (range / w.layout.gridWidth)
      : (x - min) / (range / w.layout.gridWidth)

    if (
      (w.config.xaxis.type === 'category' ||
        w.config.xaxis.convertedCatToNumeric) &&
      !this.annoCtx.invertAxis &&
      !w.axisFlags.dataFormatXNumeric
    ) {
      if (!w.config.chart.sparkline.enabled) {
        xP = this.getStringX(x)
      }
    }

    if (typeof x === 'string' && x.includes('px')) {
      xP = parseFloat(x)
    }

    if ((x === undefined || x === null) && anno.marker) {
      xP = w.layout.gridWidth
    }

    if (
      anno.seriesIndex !== undefined &&
      w.globals.barWidth &&
      !this.annoCtx.invertAxis
    ) {
      xP -=
        (w.globals.barWidth / 2) * (w.seriesData.series.length - 1) -
        w.globals.barWidth * anno.seriesIndex
    }

    if (typeof xP !== 'number') {
      xP = 0
      clipped = true
    }
    if (
      parseFloat(xP.toFixed(10)) > parseFloat(w.layout.gridWidth.toFixed(10))
    ) {
      xP = w.layout.gridWidth
      clipped = true
    } else if (xP < 0) {
      xP = 0
      clipped = true
    }

    return { x: xP, clipped }
  }

  /**
   * @param {number} x
   */
  getStringX(x) {
    const w = this.w
    let rX = x

    if (
      w.config.xaxis.convertedCatToNumeric &&
      w.labelData.categoryLabels.length
    ) {
      const strX = String(x)
      x =
        w.labelData.categoryLabels.findIndex(
          (/** @type {any} */ l) => String(l) === strX,
        ) + 1
    }

    const catIndex = w.labelData.labels
      /**
       * @param {any} item
       */
      .map((/** @type {any} */ item) =>
        Array.isArray(item) ? item.join(' ') : item,
      )
      .indexOf(x)

    const xLabel = w.dom.baseEl.querySelector(
      `.apexcharts-xaxis-texts-g text:nth-child(${catIndex + 1})`,
    )

    if (xLabel) {
      rX = parseFloat(xLabel.getAttribute('x') ?? '0')
    }

    return rX
  }
}
