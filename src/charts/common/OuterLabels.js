// @ts-check
import Graphics from '../../modules/Graphics'

/**
 * Outer ("name") labels: a label parked in the margin beside the plot, joined to
 * the thing it names by a leader line. Pie/donut draw them around the rim; the
 * unit chart draws them beside a silhouette's colour bands. The geometry is the
 * caller's business - it knows where its own marks are, and it needs to run a
 * de-overlap pass before anything reaches the DOM - so this module only owns the
 * two parts that are genuinely common: laying out one label's text block against
 * its leader line, and spacing a crowded gutter column apart.
 *
 * @typedef {object} OuterLabelSpec
 * @property {string[]} lines one entry per line, e.g. ['Comedy', '20.3%']
 * @property {number} lineHeight
 * @property {{ x: number, y: number }} anchor on the mark being named
 * @property {{ x: number, y: number }} elbow leader-line bend
 * @property {number} labelX where the leader line ends and the text starts
 * @property {number} labelY vertical centre of the text block
 * @property {'left' | 'right'} side which gutter this label sits in
 * @property {{ show: boolean, width: number, color: string }} connector
 * @property {{ fontSize?: string, fontFamily?: string, fontWeight?: string | number }} style
 * @property {string} foreColor
 * @property {string} [groupClass]
 * @property {string} [textClass]
 * @property {string} [connectorClass]
 */

/**
 * Draw one outer label: an optional leader line (anchor -> elbow -> label) plus
 * the text, one tspan per line, the block vertically centred on `labelY` so the
 * line terminates in the middle of the text rather than at its first baseline.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {OuterLabelSpec} spec
 * @returns {any} the group element, for the caller to add and to reveal
 */
export function drawOuterLabel(w, spec) {
  const {
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
  } = spec
  const graphics = new Graphics(w)

  const group = graphics.group({
    class: spec.groupClass || 'apexcharts-outer-label-group',
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
    line.node.classList.add(spec.connectorClass || 'apexcharts-outer-label-connector')
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
    cssClass: spec.textClass || 'apexcharts-outer-label',
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
  // labels and connectors don't pop in before the marks they name.
  return group
}

/**
 * Widest of the given strings, for reserving gutter room before anything is
 * drawn. Measured through the DOM where one can measure, estimated from the
 * character count otherwise (SSR, jsdom), so a headless render still leaves its
 * labels a gutter instead of reserving nothing and letting them hang off the
 * edge. Pie keeps its own measure-only version: it has shipped snapshots that a
 * suddenly non-zero SSR reserve would move.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {string[]} labels
 * @param {{ fontSize?: string, fontFamily?: string }} [style]
 * @returns {number}
 */
export function measureLabelWidth(w, labels, style = {}) {
  const graphics = new Graphics(w)
  const fontSize = style.fontSize || '12px'
  const px = parseFloat(fontSize) || 12
  let max = 0
  labels.forEach((text) => {
    if (text == null || text === '') return
    const str = `${text}`
    const measured = graphics.getTextRects(str, fontSize, style.fontFamily, '').width
    // 0.58em per character is a reasonable mean for the sans-serif faces charts
    // ship with - close enough to reserve space, never used for placement.
    max = Math.max(max, measured > 0 ? measured : str.length * px * 0.58)
  })
  return max
}

/**
 * Space one gutter column apart: push each label down until it clears its
 * neighbour by `minGap`, then, if the column ran past `maxY`, pull the whole
 * block back up. Mutates each item's `labelY` (seeded from `idealY`), which is
 * also where its leader line will terminate.
 *
 * `minY` is optional: pie leaves the top unclamped (a column pulled up as a
 * block stays inside the chart because the pie is centred in it), while a unit
 * silhouette clamps both ends against its plot rect.
 *
 * @param {{ idealY: number, labelY: number }[]} items one side's labels
 * @param {number} minGap a full label block, so multi-line labels stay clear
 * @param {number} maxY
 * @param {number} [minY]
 */
export function spaceOutLabels(items, minGap, maxY, minY) {
  const col = items.slice().sort((a, b) => a.idealY - b.idealY)
  col.forEach((l) => {
    l.labelY = l.idealY
  })

  // forward pass: push each label down to keep the minimum gap
  for (let k = 1; k < col.length; k++) {
    if (col[k].labelY - col[k - 1].labelY < minGap) {
      col[k].labelY = col[k - 1].labelY + minGap
    }
  }

  // if the column ran past the bottom, pull it back up as a block
  const last = col[col.length - 1]
  const overflow = last ? last.labelY - maxY : 0
  if (overflow > 0) {
    for (let k = col.length - 1; k >= 0; k--) {
      col[k].labelY -= overflow
      if (k < col.length - 1 && col[k + 1].labelY - col[k].labelY < minGap) {
        col[k].labelY = col[k + 1].labelY - minGap
      }
    }
  }

  // Clamping the top is opt-in: a caller with a hard ceiling (a plot rect)
  // pushes the column back down, keeping the gaps it just earned. The column
  // can end up taller than the space available, in which case it overflows
  // the bottom rather than overlapping itself.
  if (minY != null && col.length && col[0].labelY < minY) {
    const shift = minY - col[0].labelY
    for (let k = 0; k < col.length; k++) {
      col[k].labelY += shift
    }
  }
}
