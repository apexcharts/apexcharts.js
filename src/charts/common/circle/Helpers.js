// @ts-check
import Graphics from '../../../modules/Graphics'

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
  drawExternalLabel({
    lines,
    lineHeight,
    anchor,
    elbow,
    labelX,
    labelY,
    side,
    connector,
    style,
    foreColor,
  }) {
    const graphics = new Graphics(this.w)

    const group = graphics.group({
      class: 'apexcharts-pie-name-label-group',
    })

    if (connector.show) {
      const d = `M ${anchor.x} ${anchor.y} L ${elbow.x} ${elbow.y} L ${labelX} ${labelY}`
      const line = graphics.drawPath({
        d,
        stroke: connector.color,
        strokeWidth: connector.width,
        fill: 'none',
        strokeLinecap: 'round',
      })
      line.node.classList.add('apexcharts-pie-label-connector')
      group.add(line)
    }

    // small horizontal pad so the text doesn't touch the connector end
    const textX = side === 'right' ? labelX + 4 : labelX - 4
    const n = lines.length
    // single text element with one tspan per line, block centered on labelY
    const startY = labelY - ((n - 1) * lineHeight) / 2
    const elText = graphics.drawText({
      x: textX,
      y: startY,
      text: n === 1 ? lines[0] : lines,
      textAnchor: side === 'right' ? 'start' : 'end',
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      foreColor,
      dominantBaseline: 'central',
      cssClass: 'apexcharts-pie-name-label',
    })
    // normalize multi-line spacing to lineHeight (svg.js newLine leading varies)
    if (n > 1) {
      const tspans = elText.node.getElementsByTagName('tspan')
      for (let li = 0; li < tspans.length; li++) {
        tspans[li].setAttribute('x', `${textX}`)
        tspans[li].setAttribute('dy', li === 0 ? '0' : `${lineHeight}`)
      }
    }
    group.add(elText)

    // Reveal timing is handled by the caller via delayedElements +
    // apexcharts-element-hidden (faded back in on animationCompleted), so the
    // labels and connectors don't pop in before the slice sweep finishes.
    return group
  }
}
