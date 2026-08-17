// @ts-check
import Graphics from '../../../modules/Graphics'
import { drawOuterLabel } from '../OuterLabels'

export default class CircularChartsHelpers {
  /**
   * @param {import('../../../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} i
   * @param {string | number} text
   */
  drawYAxisTexts(x, y, i, text) {
    const w = this.w

    const yaxisConfig = w.config.yaxis[0]
    const formatter = w.formatters.yLabelFormatters[0]

    const graphics = new Graphics(this.w)
    const yaxisLabel = graphics.drawText({
      x: x + yaxisConfig.labels.offsetX,
      y: y + yaxisConfig.labels.offsetY,
      text: formatter(text, i),
      textAnchor: 'middle',
      fontSize: yaxisConfig.labels.style.fontSize,
      fontFamily: yaxisConfig.labels.style.fontFamily,
      foreColor: Array.isArray(yaxisConfig.labels.style.colors)
        ? yaxisConfig.labels.style.colors[i]
        : yaxisConfig.labels.style.colors,
    })

    return yaxisLabel
  }

  /**
   * Widest rendered width among the given label strings. Used to reserve
   * horizontal room for outer (name) labels so the pie can shrink to fit them.
   * @param {string[]} labels
   * @param {{ fontSize?: string, fontFamily?: string }} style
   * @returns {number}
   */
  getMaxLabelWidth(labels, { fontSize, fontFamily } = {}) {
    const graphics = new Graphics(this.w)
    let maxWidth = 0
    labels.forEach((text) => {
      if (text === null || typeof text === 'undefined' || text === '') return
      const rect = graphics.getTextRects(
        `${text}`,
        fontSize || '12px',
        fontFamily,
        '',
      )
      maxWidth = Math.max(maxWidth, rect.width)
    })
    return maxWidth
  }

  /**
   * Draw a single outer (name) label: an optional leader line from the slice
   * edge (anchor -> radial elbow -> label) plus the name text (one or more
   * lines, e.g. name + percent). Geometry is computed by the caller (Pie.js)
   * so it can run a de-overlap pass first. The text block is vertically
   * centered on `labelY`, which is where the connector terminates.
   * @param {{
   *   lines: string[],
   *   lineHeight: number,
   *   anchor: { x: number, y: number },
   *   elbow: { x: number, y: number },
   *   labelX: number,
   *   labelY: number,
   *   side: 'left' | 'right',
   *   connector: { show: boolean, width: number, color: string },
   *   style: { fontSize?: string, fontFamily?: string, fontWeight?: string | number },
   *   foreColor: string,
   * }} opts
   */
  drawExternalLabel(opts) {
    // Shared with the unit chart's band labels - see charts/common/OuterLabels.
    // The class names stay pie-specific: they are public API for CSS, and the
    // export path looks for them.
    return drawOuterLabel(this.w, {
      ...opts,
      groupClass: 'apexcharts-pie-name-label-group',
      textClass: 'apexcharts-pie-name-label',
      connectorClass: 'apexcharts-pie-label-connector',
    })
  }
}
