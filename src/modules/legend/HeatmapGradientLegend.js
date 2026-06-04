// @ts-check
import Utils from '../../utils/Utils'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import { Environment } from '../../utils/Environment.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Renders a continuous color gradient strip + hover indicator arrow inside the
 * legend wrap, replacing the default categorical legend for heatmaps when
 * `plotOptions.heatmap.colorScale.gradientLegend.enabled` is true.
 *
 * The strip orientation follows `chart.legend.position`:
 *   - top/bottom    → horizontal strip, min on the left
 *   - left/right    → vertical strip, min at the bottom (thermometer-style)
 *
 * The arrow is positioned along the strip when the user hovers a heatmap cell,
 * driven by the existing `dataPointMouseEnter` / `dataPointMouseLeave` events.
 */
export default class HeatmapGradientLegend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** @type {any} */
    this.svgEl = null
    /** @type {any} */
    this.arrowEl = null
    /** @type {HTMLElement|null} */
    this.hoverValueEl = null
    /** @type {number} */
    this._min = 0
    /** @type {number} */
    this._max = 0
    /** @type {any} */
    this._geom = null
    this._onCellEnter = this._onCellEnter.bind(this)
    this._onCellLeave = this._onCellLeave.bind(this)
  }

  /** Default value formatter for min/max labels and the hover tooltip. */
  _getFormatter() {
    const cfg = this.w.config.plotOptions.heatmap.colorScale.gradientLegend
    if (typeof cfg.formatter === 'function') return cfg.formatter
    return (/** @type {number} */ v) => {
      if (!Number.isFinite(v)) return String(v)
      const abs = Math.abs(v)
      if (abs >= 1000) return v.toFixed(0)
      if (abs >= 10) return v.toFixed(1)
      return v.toFixed(2)
    }
  }

  /**
   * True when the user has opted into the gradient legend variant.
   * @param {any} w
   */
  static isEnabled(w) {
    const cfg = w?.config?.plotOptions?.heatmap?.colorScale?.gradientLegend
    return !!(cfg && cfg.enabled)
  }

  /**
   * Build the gradient legend DOM into `elLegendWrap`.
   * Caller is responsible for clearing the wrap first.
   */
  draw() {
    const w = this.w
    const elLegendWrap = /** @type {HTMLElement} */ (w.dom.elLegendWrap)
    if (!elLegendWrap) return

    const cfg = w.config.plotOptions.heatmap.colorScale.gradientLegend
    const position = w.config.legend.position
    const isVertical = position === 'left' || position === 'right'

    // Geometry — pads give space for end labels and the arrow.
    const arrowSize = cfg.arrow?.size ?? 8
    const arrowGutter = arrowSize + 4
    // Horizontal placements: labels sit to the left/right of the strip, so we
    // need horizontal label padding. Vertical placements: labels sit above and
    // below — needs vertical padding instead, but the SVG must also be wide
    // enough for the centered labels (e.g. "100", "-30") to fit without
    // clipping. The minimum width below comfortably fits ~5 chars at 11px.
    const labelPadAlongStrip = cfg.showLabels ? 28 : 4
    const labelPadAcrossStrip = cfg.showLabels ? 20 : 4
    const minLabelWidth = cfg.showLabels ? 44 : 0
    const stripLength = this._resolveStripLength(isVertical ? cfg.height : cfg.width, isVertical)
    const stripThickness = cfg.thickness

    // Total SVG canvas adds room for the arrow on the chart-facing edge and
    // labels at the ends of the strip.
    const svgWidth = isVertical
      ? Math.max(stripThickness + arrowGutter + 4, minLabelWidth)
      : stripLength + labelPadAlongStrip * 2
    const svgHeight = isVertical
      ? stripLength + labelPadAcrossStrip * 2
      : stripThickness + arrowGutter + 4

    // Strip origin in SVG coords.
    // - Horizontal: arrow above the strip pointing down (for both top/bottom
    //   placement, the arrow sits on the chart-facing side; for top placement
    //   we flip below).
    // - Vertical: arrow to the side of the strip pointing toward it. The
    //   chart-facing side depends on whether the legend is on left or right.
    //   For vertical, center the strip+arrow group within the wider SVG so
    //   centered labels above/below have equal slack on either side.
    const verticalGroupWidth = stripThickness + arrowGutter
    const verticalGroupLeftPad = (svgWidth - verticalGroupWidth) / 2
    const stripX = isVertical
      ? position === 'left'
        ? verticalGroupLeftPad
        : verticalGroupLeftPad + arrowGutter
      : labelPadAlongStrip
    const stripY = isVertical
      ? labelPadAcrossStrip
      : position === 'top'
        ? arrowGutter
        : 4

    // Build SVG.
    const svg = BrowserAPIs.createElementNS(SVG_NS, 'svg')
    svg.setAttribute('class', 'apexcharts-heatmap-gradient-legend')
    svg.setAttribute('width', String(svgWidth))
    svg.setAttribute('height', String(svgHeight))
    svg.setAttribute('overflow', 'visible')

    // Gradient definition.
    const defs = BrowserAPIs.createElementNS(SVG_NS, 'defs')
    const gradId = `apexcharts-heatmap-gradient-${w.globals.cuid}`
    const linearGrad = BrowserAPIs.createElementNS(SVG_NS, 'linearGradient')
    linearGrad.setAttribute('id', gradId)
    // Horizontal: gradient runs left→right (min→max).
    // Vertical: gradient runs bottom→top (min→max, thermometer style).
    if (isVertical) {
      linearGrad.setAttribute('x1', '0')
      linearGrad.setAttribute('y1', '1')
      linearGrad.setAttribute('x2', '0')
      linearGrad.setAttribute('y2', '0')
    } else {
      linearGrad.setAttribute('x1', '0')
      linearGrad.setAttribute('y1', '0')
      linearGrad.setAttribute('x2', '1')
      linearGrad.setAttribute('y2', '0')
    }

    const { min, max, stops } = this._computeStops()
    this._min = min
    this._max = max
    stops.forEach((s) => {
      const stopEl = BrowserAPIs.createElementNS(SVG_NS, 'stop')
      stopEl.setAttribute('offset', `${(s.percent * 100).toFixed(2)}%`)
      stopEl.setAttribute('stop-color', s.color)
      linearGrad.appendChild(stopEl)
    })
    defs.appendChild(linearGrad)
    svg.appendChild(defs)

    // Strip rectangle.
    const rect = BrowserAPIs.createElementNS(SVG_NS, 'rect')
    rect.setAttribute('x', String(stripX))
    rect.setAttribute('y', String(stripY))
    rect.setAttribute('width', String(isVertical ? stripThickness : stripLength))
    rect.setAttribute('height', String(isVertical ? stripLength : stripThickness))
    rect.setAttribute('rx', '2')
    rect.setAttribute('fill', `url(#${gradId})`)
    svg.appendChild(rect)

    // End labels.
    if (cfg.showLabels) {
      const labelColor =
        cfg.labelStyle?.colors ||
        (Array.isArray(w.config.legend.labels.colors)
          ? w.config.legend.labels.colors[0]
          : w.config.legend.labels.colors) ||
        w.config.chart.foreColor
      const labelFontSize = cfg.labelStyle?.fontSize || '11px'
      const labelFontFamily =
        cfg.labelStyle?.fontFamily || w.config.chart.fontFamily

      const fmt = this._getFormatter()

      /**
       * @param {string|number} text
       * @param {number} x
       * @param {number} y
       * @param {string} anchor
       */
      const makeLabel = (text, x, y, anchor) => {
        const t = BrowserAPIs.createElementNS(SVG_NS, 'text')
        t.setAttribute('x', String(x))
        t.setAttribute('y', String(y))
        t.setAttribute('text-anchor', anchor)
        t.setAttribute('dominant-baseline', 'middle')
        t.setAttribute('fill', labelColor)
        t.setAttribute('font-size', labelFontSize)
        if (labelFontFamily) t.setAttribute('font-family', labelFontFamily)
        t.textContent = String(text)
        return t
      }

      if (isVertical) {
        // Min at the bottom, max at the top.
        const midX = stripX + stripThickness / 2
        svg.appendChild(makeLabel(fmt(min), midX, stripY + stripLength + 10, 'middle'))
        svg.appendChild(makeLabel(fmt(max), midX, stripY - 10, 'middle'))
      } else {
        const midY = stripY + stripThickness / 2
        svg.appendChild(makeLabel(fmt(min), stripX - 6, midY, 'end'))
        svg.appendChild(makeLabel(fmt(max), stripX + stripLength + 6, midY, 'start'))
      }
    }

    // Arrow indicator (hidden until hover).
    const arrowColor = cfg.arrow?.color || w.config.chart.foreColor
    const arrow = this._buildArrow(arrowSize, arrowColor, position)
    svg.appendChild(arrow)
    this.arrowEl = arrow

    // Stash geometry for the hover handler.
    this._geom = {
      isVertical,
      position,
      stripX,
      stripY,
      stripLength,
      stripThickness,
      arrowSize,
    }

    // Hover value tooltip — a tiny floating label that tracks the arrow.
    if (cfg.showHoverValue) {
      const tt = BrowserAPIs.createElement('div')
      tt.classList.add('apexcharts-heatmap-gradient-legend-value')
      tt.style.position = 'absolute'
      tt.style.fontSize =
        cfg.labelStyle?.fontSize || '11px'
      tt.style.fontFamily =
        cfg.labelStyle?.fontFamily || w.config.chart.fontFamily || ''
      tt.style.color = w.config.chart.foreColor
      tt.style.background = 'rgba(0,0,0,0.65)'
      tt.style.color = '#fff'
      tt.style.padding = '2px 6px'
      tt.style.borderRadius = '3px'
      tt.style.pointerEvents = 'none'
      tt.style.whiteSpace = 'nowrap'
      tt.style.opacity = '0'
      tt.style.transition = 'opacity 120ms ease'
      this.hoverValueEl = tt
    }

    // Mount.
    elLegendWrap.classList.add('apexcharts-heatmap-gradient-legend-wrap')
    elLegendWrap.classList.add(
      'apx-legend-position-' + position,
    )

    elLegendWrap.appendChild(svg)
    if (this.hoverValueEl) elLegendWrap.appendChild(this.hoverValueEl)
    this.svgEl = svg

    this._applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight)
    this._attachHoverListeners()
  }

  /**
   * Resolve a configured length (number = px, string ending in '%' =
   * percentage of the chart's SVG width/height) to a pixel length.
   * @param {number|string} value
   * @param {boolean} isVertical
   * @returns {number}
   */
  _resolveStripLength(value, isVertical) {
    const w = this.w
    const basis = isVertical
      ? w.globals.svgHeight || w.config.chart.height || 300
      : w.globals.svgWidth || w.config.chart.width || 600
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.endsWith('%')) {
        const pct = parseFloat(trimmed) || 0
        return Math.max(20, (basis * pct) / 100)
      }
      const n = parseFloat(trimmed)
      return Number.isFinite(n) ? n : 200
    }
    if (typeof value === 'number' && Number.isFinite(value)) return value
    return 200
  }

  /**
   * Position the legend wrap and align the gradient strip within it. The
   * wrap spans the chart's long axis (full width for top/bottom; full
   * height for left/right) and uses flexbox to honor the `align` config.
   * Bypasses the standard `setLegendWrapXY` which sizes the wrap to its
   * content.
   * @param {HTMLElement} elLegendWrap
   * @param {'top'|'right'|'bottom'|'left'} position
   * @param {boolean} isVertical
   * @param {number} svgWidth
   * @param {number} svgHeight
   */
  _applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight) {
    const w = this.w
    const cfg = w.config.plotOptions.heatmap.colorScale.gradientLegend
    const align = cfg.align || 'center'

    // Inset from the chart's outer edge so labels never bleed off-canvas.
    // For `align: 'start'` / `'end'` this is the gap between the strip and
    // the chart edge; for `'center'` it's a safety margin.
    const edgePad = 12
    const chartWidth = w.globals.svgWidth || w.config.chart.width || 600
    const chartHeight = w.globals.svgHeight || w.config.chart.height || 300
    const userOffsetX = w.config.legend.offsetX || 0
    const userOffsetY = w.config.legend.offsetY || 0

    // Content-sized wrap (matches the SVG dimensions exactly) — avoids
    // covering the whole chart and confusing `getLegendDimensions()`.
    // `.apexcharts-legend` ships `overflow: auto` which would show scroll
    // bars around the strip; we explicitly override to `visible` so the
    // hover-value tooltip (an absolutely-positioned sibling that may sit
    // outside the wrap) renders without clipping or scrollers.
    elLegendWrap.style.position = 'absolute'
    elLegendWrap.style.display = 'block'
    elLegendWrap.style.overflow = 'visible'
    elLegendWrap.style.padding = '0'
    elLegendWrap.style.width = svgWidth + 'px'
    elLegendWrap.style.height = svgHeight + 'px'
    elLegendWrap.style.right = 'auto'
    elLegendWrap.style.bottom = 'auto'

    if (isVertical) {
      // Position along the vertical (long) axis based on align.
      const availableHeight = chartHeight - svgHeight - edgePad * 2
      let y
      if (align === 'start') y = edgePad
      else if (align === 'end') y = edgePad + Math.max(0, availableHeight)
      else y = edgePad + Math.max(0, availableHeight) / 2
      elLegendWrap.style.top = y + userOffsetY + 'px'

      // Pin to chart's left or right edge.
      if (position === 'left') {
        elLegendWrap.style.left = edgePad + userOffsetX + 'px'
      } else {
        elLegendWrap.style.left =
          chartWidth - svgWidth - edgePad + userOffsetX + 'px'
      }
    } else {
      // Position along the horizontal (long) axis based on align.
      const availableWidth = chartWidth - svgWidth - edgePad * 2
      let x
      if (align === 'start') x = edgePad
      else if (align === 'end') x = edgePad + Math.max(0, availableWidth)
      else x = edgePad + Math.max(0, availableWidth) / 2
      elLegendWrap.style.left = x + userOffsetX + 'px'

      // Pin to chart's top or bottom edge.
      if (position === 'top') {
        elLegendWrap.style.top = edgePad + userOffsetY + 'px'
      } else {
        elLegendWrap.style.top =
          chartHeight - svgHeight - edgePad + userOffsetY + 'px'
      }
    }
  }

  /**
   * Tear down listeners (called before re-render).
   */
  destroy() {
    if (!this.ctx?.events) return
    try {
      this.ctx.events.removeEventListener?.(
        'dataPointMouseEnter',
        this._onCellEnter,
      )
      this.ctx.events.removeEventListener?.(
        'dataPointMouseLeave',
        this._onCellLeave,
      )
    } catch (_) {
      // ignore
    }
  }

  _attachHoverListeners() {
    if (!Environment.isBrowser()) return
    if (!this.ctx?.events?.addEventListener) return
    this.ctx.events.addEventListener(
      'dataPointMouseEnter',
      this._onCellEnter,
    )
    this.ctx.events.addEventListener(
      'dataPointMouseLeave',
      this._onCellLeave,
    )
  }

  /**
   * dataPointMouseEnter fires as `(e, ctx, { seriesIndex, dataPointIndex, w })`.
   * Graphics._fireEvent forwards listener args in the same shape.
   * @param {...any} args
   */
  _onCellEnter(...args) {
    const w = this.w
    if (!this.arrowEl) return
    // The opts object is the last argument.
    const opts = args[args.length - 1]
    if (!opts || typeof opts !== 'object') return
    const i = opts.seriesIndex
    const j = opts.dataPointIndex
    if (typeof i !== 'number' || typeof j !== 'number') return
    if (w.config.chart.type !== 'heatmap') return

    const row = w.seriesData?.series?.[i]
    const val = row?.[j]
    if (val == null || Number.isNaN(val)) return

    this._positionArrow(val)
  }

  _onCellLeave() {
    if (!this.arrowEl) return
    this.arrowEl.setAttribute('opacity', '0')
    if (this.hoverValueEl) {
      this.hoverValueEl.style.opacity = '0'
    }
  }

  /**
   * Move the arrow to the position corresponding to `val` along the strip.
   * @param {number} val
   */
  _positionArrow(val) {
    if (!this.arrowEl || !this._geom) return
    const { isVertical, position, stripX, stripY, stripLength, stripThickness, arrowSize } =
      this._geom
    const min = this._min
    const max = this._max
    const span = max - min
    let pct
    if (span === 0) {
      pct = 0.5
    } else {
      pct = (val - min) / span
    }
    if (pct < 0) pct = 0
    if (pct > 1) pct = 1

    if (isVertical) {
      // Bottom = min, top = max → invert pct for Y coord.
      const yCenter = stripY + stripLength - pct * stripLength
      // Arrow tip touches the strip edge; arrow extends outward.
      let tipX, baseX
      if (position === 'left') {
        // Strip is on the left of arrow. Arrow points left.
        // Wait, position='left' means legend is on the chart's left side, so
        // the strip's right edge faces the chart. Arrow sits on the right of
        // the strip, pointing right toward the chart.
        tipX = stripX + stripThickness
        baseX = tipX + arrowSize
      } else {
        // position === 'right' — chart is on the left of legend, so strip's
        // left edge faces the chart. Arrow on the left of strip pointing left.
        tipX = stripX
        baseX = tipX - arrowSize
      }
      const points = [
        `${tipX},${yCenter}`,
        `${baseX},${yCenter - arrowSize / 2}`,
        `${baseX},${yCenter + arrowSize / 2}`,
      ].join(' ')
      this.arrowEl.setAttribute('points', points)
    } else {
      const xCenter = stripX + pct * stripLength
      let tipY, baseY
      if (position === 'top') {
        // Strip's bottom edge faces the chart. Arrow below strip pointing up.
        tipY = stripY + stripThickness
        baseY = tipY + arrowSize
      } else {
        // position === 'bottom' — strip's top edge faces the chart. Arrow
        // above strip pointing down.
        tipY = stripY
        baseY = tipY - arrowSize
      }
      const points = [
        `${xCenter},${tipY}`,
        `${xCenter - arrowSize / 2},${baseY}`,
        `${xCenter + arrowSize / 2},${baseY}`,
      ].join(' ')
      this.arrowEl.setAttribute('points', points)
    }
    this.arrowEl.setAttribute('opacity', '1')

    if (this.hoverValueEl) {
      const fmt = this._getFormatter()
      this.hoverValueEl.textContent = fmt(val)

      // Position the tooltip near the arrow (in legend-wrap local coords).
      if (isVertical) {
        const yCenter = stripY + stripLength - pct * stripLength
        if (position === 'left') {
          this.hoverValueEl.style.left = `${stripX + stripThickness + arrowSize + 8}px`
        } else {
          this.hoverValueEl.style.left = `${stripX - arrowSize - 8}px`
          this.hoverValueEl.style.transform = 'translateX(-100%)'
        }
        this.hoverValueEl.style.top = `${yCenter - 9}px`
      } else {
        const xCenter = stripX + pct * stripLength
        this.hoverValueEl.style.left = `${xCenter}px`
        this.hoverValueEl.style.transform = 'translateX(-50%)'
        if (position === 'top') {
          this.hoverValueEl.style.top = `${stripY + stripThickness + arrowSize + 8}px`
        } else {
          this.hoverValueEl.style.top = `${stripY - arrowSize - 18}px`
        }
      }
      this.hoverValueEl.style.opacity = '1'
    }
  }

  /**
   * @param {number} size
   * @param {string} color
   * @param {'top'|'right'|'bottom'|'left'} _position
   */
  _buildArrow(size, color, _position) {
    const polygon = BrowserAPIs.createElementNS(SVG_NS, 'polygon')
    polygon.setAttribute('fill', color)
    polygon.setAttribute('opacity', '0')
    polygon.setAttribute('class', 'apexcharts-heatmap-gradient-arrow')
    polygon.setAttribute('points', '0,0 0,0 0,0')
    return polygon
  }

  /**
   * Build gradient stops + return effective min/max.
   * - If `colorScale.ranges` is set, stops are placed at each range boundary
   *   so the gradient reflects the user's discrete palette.
   * - Otherwise, samples N stops from the same shadeColor function the cells
   *   use, so the strip visually matches the heatmap.
   * @returns {{ min: number, max: number, stops: Array<{percent:number,color:string}> }}
   */
  _computeStops() {
    const w = this.w
    const cs = w.config.plotOptions.heatmap.colorScale
    const cfg = cs.gradientLegend

    // Legend.init() runs *before* coreCalculations populates globals.minY/maxY,
    // so we can't rely on those here. Derive the value range directly from
    // the already-parsed series matrix (written by _writeParsedSeriesData).
    let dataMin = Infinity
    let dataMax = -Infinity
    const rows = w.seriesData?.series || []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      for (let j = 0; j < row.length; j++) {
        const v = row[j]
        if (v == null || Number.isNaN(v)) continue
        if (v < dataMin) dataMin = v
        if (v > dataMax) dataMax = v
      }
    }
    if (!Number.isFinite(dataMin)) dataMin = 0
    if (!Number.isFinite(dataMax)) dataMax = 0

    // Apply colorScale.min/max overrides (same expand-not-clamp semantics as
    // determineColor — keeps behavior consistent with the cells).
    let min = dataMin
    let max = dataMax
    if (typeof cs.min !== 'undefined') {
      min = cs.min < dataMin ? cs.min : dataMin
    }
    if (typeof cs.max !== 'undefined') {
      max = cs.max > dataMax ? cs.max : dataMax
    }

    /** @type {Array<{percent:number,color:string}>} */
    const stops = []

    if (cs.ranges && cs.ranges.length > 0) {
      // Use ranges as the palette. Sort and place a hard stop on each side of
      // every range boundary so the gradient reads as discrete bands.
      const ranges = cs.ranges
        .slice()
        .sort((/** @type {any} */ a, /** @type {any} */ b) => a.from - b.from)
      const lo = ranges[0].from
      const hi = ranges[ranges.length - 1].to
      min = lo
      max = hi
      const span = hi - lo || 1
      ranges.forEach((/** @type {any} */ r) => {
        const p1 = (r.from - lo) / span
        const p2 = (r.to - lo) / span
        stops.push({ percent: p1, color: r.color })
        stops.push({ percent: p2, color: r.color })
      })
    } else {
      // Sample the shade function. Use the first series' base color as the
      // reference (matches single-row heatmaps; multi-row heatmaps with
      // per-row colors don't have a single canonical gradient — first color
      // is the documented behavior).
      const baseColor = w.globals.colors[0] || '#008FFB'
      const utils = new Utils()
      const shadeIntensity =
        w.config.plotOptions.heatmap.shadeIntensity ?? 0.5
      const hasNegs = /** @type {any} */ (w.globals).hasNegs
      const n = Math.max(2, cfg.stops || 16)
      for (let s = 0; s < n; s++) {
        const t = s / (n - 1) // 0..1
        // Map t to the shade percent the cell at that t would receive.
        // determineColor computes percent = 100*val/(|min|+|max|), so the cell
        // sitting at value v = min + t*(max-min) gets percent_v.
        const v = min + t * (max - min)
        const total = Math.abs(max) + Math.abs(min)
        const percent_v = total === 0 ? 0 : (100 * v) / total
        let colorShadePercent
        if (hasNegs) {
          if (w.config.plotOptions.heatmap.reverseNegativeShade) {
            colorShadePercent =
              percent_v < 0
                ? (percent_v / 100) * (shadeIntensity * 1.25)
                : (1 - percent_v / 100) * (shadeIntensity * 1.25)
          } else {
            colorShadePercent =
              percent_v <= 0
                ? 1 - (1 + percent_v / 100) * shadeIntensity
                : (1 - percent_v / 100) * shadeIntensity
          }
        } else {
          colorShadePercent = 1 - percent_v / 100
        }
        // Clamp to a reasonable range to avoid color blowout.
        if (colorShadePercent > 1) colorShadePercent = 1
        if (colorShadePercent < -1) colorShadePercent = -1

        const shaded = w.config.plotOptions.heatmap.enableShades
          ? utils.shadeColor(
              w.config.theme.mode === 'dark'
                ? colorShadePercent * -1
                : colorShadePercent,
              baseColor,
            )
          : baseColor
        stops.push({ percent: t, color: shaded })
      }
    }

    return { min, max, stops }
  }
}
