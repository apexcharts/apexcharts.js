// @ts-check
import Graphics from '../modules/Graphics'
import Utils from '../utils/Utils'
import { seriesEmitter } from '../renderers/Renderer'

/**
 * Marks (#11) — build a chart-type class from a `registerSeriesType` definition.
 *
 * The returned class implements the standard type-class contract
 * (`new Ctor(w, ctx, xyRatios).draw(series, ctype, iArray)` returning an SVG
 * group), so it slots into `Core.plotChartType` exactly like Bar/Line and
 * inherits the Strata canvas paint wrap. Series marks are emitted through
 * `seriesEmitter`, so a custom series paints to canvas above `rendererThreshold`
 * with no per-type change.
 *
 * `def.renderItem({datum, x, y, scales, api, seriesIndex, dataPointIndex, color})`
 * is called once per datum and draws primitives via the `api` (path/line/rect/
 * circle/text). The `api` emits immediately, tags each node with the datum's
 * `index`/`j` (so event delegation + tooltip + keyboard light up), and adds it
 * to the series group. `x`/`y` are the datum's resolved series-space pixels;
 * `scales` converts any other data value.
 *
 * @param {string} name
 * @param {{ renderItem: Function, dataType?: string, yExtent?: Function, tooltip?: Function }} def
 * @returns {new (w:any, ctx:any, xyRatios:any) => any}
 * @module charts/CustomSeries
 */
export function makeCustomSeriesClass(name, def) {
  const cls = class CustomSeries {
    /**
     * @param {any} w @param {any} ctx @param {any} xyRatios
     */
    constructor(w, ctx, xyRatios) {
      this.w = w
      this.ctx = ctx
      this.xyRatios = xyRatios
      this._warned = false
    }

    /**
     * @param {any[]} series parsed y-arrays (one per drawn series)
     * @param {string} [_ctype]
     * @param {number[]} [seriesIndices] realIndex per entry (combo dispatch)
     * @returns {any} the wrap group
     */
    draw(series, _ctype, seriesIndices) {
      const w = this.w
      // ctx-bearing so the delegated pointer handlers fire chart events with a
      // proper ctx (Graphics defaults ctx to null).
      const graphics = new Graphics(w, this.ctx)
      const emit = seriesEmitter(this.ctx, graphics)
      const ret = graphics.group({ class: 'apexcharts-marks-series' })

      series.forEach((_s, idx) => {
        const realIndex = Array.isArray(seriesIndices) ? seriesIndices[idx] : idx
        const elSeries = graphics.group({
          class: 'apexcharts-series',
          rel: realIndex + 1,
          seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
          'data:realIndex': realIndex,
        })

        const scales = this._scales(realIndex)
        const color = w.globals.colors[realIndex]
        const rawData = /** @type {any} */ (w.config.series[realIndex])?.data || []
        const xvals = w.seriesData.seriesX[realIndex] || []
        const yvals = w.seriesData.series[realIndex] || []

        // Coordinate caches so the shared tooltip / crosshair / keyboard nav
        // target custom marks like any built-in series (populated per datum).
        w.globals.seriesXvalues[realIndex] = []
        w.globals.seriesYvalues[realIndex] = []
        if (typeof w.globals.pointsArray[realIndex] === 'undefined') {
          w.globals.pointsArray[realIndex] = []
        }

        for (let j = 0; j < yvals.length; j++) {
          const yVal = yvals[j]
          if (yVal === null || typeof yVal === 'undefined') continue
          const xVal = xvals[j]
          const xPx = scales.x(xVal)
          const yPx = scales.y(yVal)

          const api = this._api(emit, elSeries, realIndex, j)
          try {
            def.renderItem({
              datum: rawData[j],
              x: xPx,
              y: yPx,
              scales,
              api,
              seriesIndex: realIndex,
              dataPointIndex: j,
              color,
            })
          } catch (e) {
            if (!this._warned) {
              console.warn(
                `[apexcharts] renderItem for series type "${name}" threw; skipping datum:`,
                e,
              )
              this._warned = true
            }
          }

          w.globals.seriesXvalues[realIndex][j] = xVal
          w.globals.seriesYvalues[realIndex][j] = yVal
          w.globals.pointsArray[realIndex][j] = [xPx, yPx]
        }

        // Event delegation so hovering/clicking a mark fires dataPointMouseEnter
        // / dataPointSelection with the datum's (index, j). Coordinate-based
        // tooltip/crosshair also work off the caches above. (Inert on canvas,
        // where marks have no DOM node and events are coordinate-based.)
        graphics.setupEventDelegation(elSeries, '.apexcharts-marks-mark')

        ret.add(elSeries)
      })

      return ret
    }

    /**
     * Series-space (elGraphical-local, translate-free) scales, matching how the
     * built-ins compute pixels, so custom marks align with axes and gridlines
     * and paint correctly on the elGraphical-local canvas.
     * @param {number} realIndex
     */
    _scales(realIndex) {
      const gl = this.w.globals
      const xRatio = this.xyRatios.xRatio
      const yRatioArr = this.xyRatios.yRatio
      const axis = gl.seriesYAxisReverseMap?.[realIndex] ?? 0
      const yr = Array.isArray(yRatioArr)
        ? yRatioArr[axis] ?? yRatioArr[0]
        : yRatioArr
      const maxYArr = /** @type {any} */ (gl).maxYArr
      const maxY =
        Array.isArray(maxYArr) && maxYArr.length ? maxYArr[axis] ?? gl.maxY : gl.maxY
      const gridWidth = gl.gridWidth
      const gridHeight = gl.gridHeight
      /** @param {number} v */
      const x = (v) => (v - gl.minX) / xRatio
      /** @param {number} v */
      const y = (v) => (maxY - v) / yr
      return {
        x,
        y,
        gridWidth,
        gridHeight,
        // Category slot width (mirrors the bar column math): the pixel span of
        // one x step, for bar-like custom shapes.
        band: xRatio * (gl.minXDiff || 1),
      }
    }

    /**
     * Per-datum primitive API. Each call emits immediately (canvas-aware via
     * `emit`), tags the node with the datum's identity, and adds it to the
     * series group; on canvas the tag/add are inert (marks live on the canvas,
     * events are coordinate-based).
     * @param {any} emit @param {any} elSeries @param {number} realIndex @param {number} j
     */
    _api(emit, elSeries, realIndex, j) {
      /** @param {any} el */
      const tag = (el) => {
        if (el) {
          try {
            el.node.setAttribute('index', String(realIndex))
            el.node.setAttribute('j', String(j))
            el.node.classList.add('apexcharts-marks-mark')
          } catch (e) {
            /* canvas marks have a no-op node */
          }
          elSeries.add(el)
        }
        return el
      }
      return {
        /** @param {any} o */
        path: (o = {}) =>
          tag(
            emit.drawPath({
              d: o.d || '',
              stroke: o.stroke ?? '#000',
              strokeWidth: o.width ?? o.strokeWidth ?? 1,
              fill: o.fill ?? 'none',
              fillOpacity:
                o.fillOpacity ??
                (o.fill && o.fill !== 'none' ? o.opacity ?? 1 : 0),
              strokeOpacity: o.strokeOpacity ?? o.opacity ?? 1,
              strokeDashArray: o.dash ?? 0,
              strokeLinecap: o.lineCap,
            }),
          ),
        /** @param {any} o */
        line: (o = {}) =>
          tag(
            emit.drawLine(
              o.x1,
              o.y1,
              o.x2,
              o.y2,
              o.stroke ?? '#000',
              o.dash ?? 0,
              o.width ?? o.strokeWidth ?? 1,
            ),
          ),
        /** @param {any} o */
        rect: (o = {}) =>
          tag(
            emit.drawRect(
              o.x ?? 0,
              o.y ?? 0,
              o.w ?? 0,
              o.h ?? 0,
              o.r ?? 0,
              o.fill ?? '#000',
              o.opacity ?? 1,
              o.stroke != null ? o.strokeWidth ?? 1 : null,
              o.stroke,
            ),
          ),
        /** @param {any} o */
        circle: (o = {}) =>
          tag(
            emit.drawCircle(o.r ?? 0, {
              cx: o.cx ?? 0,
              cy: o.cy ?? 0,
              fill: o.fill ?? '#000',
              stroke: o.stroke || 'none',
              'stroke-width': o.strokeWidth ?? (o.stroke ? 1 : 0),
            }),
          ),
        /** @param {any} o */
        text: (o = {}) =>
          tag(
            emit.drawText({
              x: o.x ?? 0,
              y: o.y ?? 0,
              text: o.text ?? '',
              textAnchor: o.anchor ?? 'start',
              fontSize: o.size,
              foreColor: o.color,
              fontWeight: o.weight,
            }),
          ),
      }
    }
  }

  // Marks (#11) P3: static descriptors read by Data.parseData so a custom type
  // with range/extent semantics folds BOTH y-bounds into the axis scale.
  // `dataType:'rangeXY'` handles the y:[lo,hi] datum (dumbbell); `yExtent`
  // is a per-datum override for shapes whose drawn span isn't just `y`
  // (bullet targets/qualitative bands). Both route through the range-data path.
  cls.dataType = def.dataType || 'xy'
  cls.yExtent = typeof def.yExtent === 'function' ? def.yExtent : null
  return cls
}
