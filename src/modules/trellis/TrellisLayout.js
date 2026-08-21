// @ts-check
/**
 * Trellis (#22): the pure layout.
 *
 * Container width in, cell geometry and chrome policy out. The chrome flags
 * (which panels SHOW axis labels) are a policy over a uniform geometry: every
 * panel always RESERVES the same axis space (the alignment invariant), and
 * non-edge panels merely paint their labels invisibly (a CSS class on the
 * cell), so toggling the policy on a resize never re-renders a panel.
 *
 * Pure module: no DOM, no `w`.
 *
 * @module modules/trellis/TrellisLayout
 */

/**
 * @typedef {Object} TrellisCell
 * @property {number} i
 * @property {number} r grid row
 * @property {number} c grid column
 * @property {boolean} showXLabels bottom-edge policy (ragged-last-row aware)
 * @property {boolean} showYLabels left-edge policy
 */

/**
 * @typedef {Object} TrellisLayoutResult
 * @property {number} cols
 * @property {number} rows
 * @property {number} panelW
 * @property {number} panelH
 * @property {number} headerH
 * @property {number} gap
 * @property {TrellisCell[]} cells
 */

/**
 * Which grid row is the BOTTOM of column `c`. With a ragged last row the
 * answer is not `rows - 1` for every column: columns past the last row's
 * fill sit one row shorter, and giving them no x-labels at all is the classic
 * trellis bug this function exists to prevent.
 * @param {number} c
 * @param {number} panelCount
 * @param {number} cols
 * @param {number} rows
 * @returns {number}
 */
export function lastRowFor(c, panelCount, cols, rows) {
  const inLastRow = panelCount - (rows - 1) * cols
  return c < inLastRow ? rows - 1 : rows - 2
}

/**
 * Resolve the column count from the container width.
 * @param {number} containerWidth
 * @param {number} panelCount
 * @param {{ columns?: number|'auto', minPanelWidth?: number, gap?: number }} cfg
 * @returns {number}
 */
export function resolveColumns(containerWidth, panelCount, cfg = {}) {
  const gap = cfg.gap ?? 12
  if (typeof cfg.columns === 'number' && cfg.columns > 0) {
    return Math.max(1, Math.min(Math.floor(cfg.columns), panelCount))
  }
  const minW = cfg.minPanelWidth ?? 220
  const fit = Math.floor((containerWidth + gap) / (minW + gap))
  return Math.max(1, Math.min(fit, panelCount))
}

/**
 * Compute the grid.
 *
 * @param {{
 *   panelCount: number,
 *   containerWidth: number,
 *   cfg: {
 *     columns?: number|'auto', minPanelWidth?: number, gap?: number,
 *     aspectRatio?: number, panelHeight?: number,
 *     header?: { show?: boolean },
 *     axes?: { labels?: 'edges'|'all'|'none' },
 *     scales?: { x?: string, y?: string },
 *   },
 *   hostHeight?: number,
 * }} input
 * @returns {TrellisLayoutResult}
 */
export function compute({ panelCount, containerWidth, cfg, hostHeight }) {
  const gap = cfg.gap ?? 12
  const cols = resolveColumns(containerWidth, panelCount, cfg)
  const rows = Math.max(1, Math.ceil(panelCount / cols))

  const headerShown = !cfg.header || cfg.header.show !== false
  const headerH = headerShown ? 22 : 0

  const panelW = Math.max(0, (containerWidth - gap * (cols - 1)) / cols)
  let panelH
  if (typeof cfg.panelHeight === 'number' && cfg.panelHeight > 0) {
    panelH = cfg.panelHeight
  } else if (typeof hostHeight === 'number' && hostHeight > 0) {
    panelH = (hostHeight - rows * headerH - gap * (rows - 1)) / rows
  } else {
    panelH = panelW / (cfg.aspectRatio ?? 1.6)
  }
  // A panel below this is unreadable and Dimensions gets degenerate.
  panelH = Math.max(80, Math.round(panelH))

  const labelsMode = (cfg.axes && cfg.axes.labels) || 'edges'
  const scales = cfg.scales || {}
  const single = cols === 1

  /** @type {TrellisCell[]} */
  const cells = Array.from({ length: panelCount }, (_, i) => {
    const r = Math.floor(i / cols)
    const c = i % cols
    let showXLabels
    let showYLabels
    if (labelsMode === 'none') {
      showXLabels = false
      showYLabels = false
    } else if (labelsMode === 'all' || single) {
      // A single-column stack is not a grid; every panel is an edge panel.
      showXLabels = true
      showYLabels = true
    } else {
      // 'edges'. An independent scale implies its own axis labels (a panel
      // with its own domain but no readable ticks is worse than either
      // extreme), overriding the edge policy for that channel.
      // 'independent-row' keeps the column-0 policy (ticks are identical
      // along a row, so the row's left edge speaks for the row);
      // 'independent-column' gives every panel its own labels (each column's
      // domain differs, and only a panel's own left edge can carry it).
      showXLabels =
        scales.x === 'independent' || r === lastRowFor(c, panelCount, cols, rows)
      showYLabels =
        scales.y === 'independent' ||
        scales.y === 'independent-column' ||
        c === 0
    }
    return { i, r, c, showXLabels, showYLabels }
  })

  return { cols, rows, panelW, panelH, headerH, gap, cells }
}
