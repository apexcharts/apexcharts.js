// @ts-check
/**
 * Placing the tooltip on a plot too short to hold it beside a point.
 *
 * Beside the point is the right place for a tooltip until the plot gets about
 * as short as the tooltip is tall (a sparkline, a strip in a dashboard, a chart
 * with many series sharing one card). From there a box beside the point covers
 * the plot from top to bottom, so it goes directly above the hovered mark
 * instead, with the arrow on it, free to stick out of the plot and the chart:
 * everything below the mark stays in view, and only a mark near the top lifts
 * the box out of the chart altogether. With no room above it goes below the
 * mark, and with no room on either side it keeps its usual place.
 *
 * "Room" is what the reader can actually see: the viewport, cut down by every
 * ancestor that clips its overflow (a card with `overflow: hidden`, a scroll
 * container). A box placed in a part of the page that is clipped away would be
 * worse than one covering the plot.
 *
 * The functions that decide are pure (sizes and rects in, a placement out). The
 * DOM reads are in `getVisibleBounds`, which Position calls.
 *
 * @module tooltip/placement
 */

import { ARROW_TIP_OVERHANG, SHORT_PLOT_RATIO } from './constants'

/**
 * Keeps the arrow off the box's rounded corners. Same inset the other top and
 * bottom placements use.
 */
const ARROW_EDGE_INSET = 10

/**
 * @typedef {{ top: number, bottom: number, left: number, right: number }} Box
 */

/**
 * @typedef {object} MarkPlacement
 * @property {number} x  box left, in the same space as the inputs
 * @property {number} y  box top
 * @property {'top'|'bottom'} placement  which side of the mark the box is on
 * @property {number} arrowX  arrow tip x inside the box
 */

/**
 * Is the plot too short to hold this tooltip beside a point?
 *
 * @param {number} ttHeight
 * @param {number} plotHeight
 * @returns {boolean}
 */
export function isShortPlot(ttHeight, plotHeight) {
  if (!(ttHeight > 0)) return false
  // A chart squeezed by its own axes and legend can end up with no plot left
  // at all (60px tall with axes measures a negative grid height).
  if (!(plotHeight > 0)) return true
  return ttHeight >= plotHeight * SHORT_PLOT_RATIO
}

/**
 * The box directly above a mark if the room has space for it there, otherwise
 * directly below it, otherwise nowhere (null: the caller keeps its own
 * placement). The arrow tip lands `gapAbove` (or `gapBelow`) from the mark's
 * edge. Horizontally the box centres on the anchor and is then held inside
 * the room, not inside the chart: a sparkline is often narrower than its own
 * tooltip.
 *
 * The mark is whatever the tooltip captions: a point's marker, a bar, a cell,
 * the whole column of points under a shared tooltip, or just the pointer.
 *
 * All values share one coordinate space (the caller's: elWrap-local in the
 * library).
 *
 * @param {object} p
 * @param {number} p.anchorX  x the arrow points at
 * @param {number} p.markTop  top edge of the mark
 * @param {number} p.markBottom  bottom edge of the mark
 * @param {number} p.ttWidth
 * @param {number} p.ttHeight
 * @param {Box} p.room  visible region the box has to fit in
 * @param {number} [p.gapAbove]  space between the mark and a box above it
 * @param {number} [p.gapBelow]  same, below (more under a pointer, whose
 *   cursor graphic hangs below its hotspot)
 * @returns {MarkPlacement | null}
 */
export function placeAroundMark({
  anchorX,
  markTop,
  markBottom,
  ttWidth,
  ttHeight,
  room,
  gapAbove = ARROW_TIP_OVERHANG,
  gapBelow = gapAbove,
}) {
  if (
    ![anchorX, markTop, markBottom, ttWidth, ttHeight].every(Number.isFinite)
  ) {
    return null
  }

  /** @type {'top'|'bottom'} */
  let placement
  let y
  const above = markTop - gapAbove - ttHeight
  const below = Math.max(markTop, markBottom) + gapBelow
  if (above >= room.top) {
    placement = 'top'
    y = above
  } else if (below + ttHeight <= room.bottom) {
    placement = 'bottom'
    y = below
  } else {
    return null
  }

  const x = clampIntoRoom(anchorX, ttWidth, room)
  const arrowX = Math.max(
    ARROW_EDGE_INSET,
    Math.min(ttWidth - ARROW_EDGE_INSET, anchorX - x),
  )
  return { x, y, placement, arrowX }
}

/**
 * @typedef {object} CellPlacement
 * @property {number} x  box left
 * @property {number} y  box top
 * @property {'top'|'bottom'|'left'|'right'} placement  which side of the cell
 *   the box is on
 * @property {number | null} arrowX  arrow tip x inside the box (top/bottom)
 * @property {number | null} arrowY  arrow tip y inside the box (left/right)
 */

/**
 * The visible region a box out of the plot has to fit in, for the placement
 * functions below: the region itself, null for none, or a function returning
 * either, called at most once and only when a step out of the plot is tried.
 * Measuring the room walks up the page, so a box that fits inside the plot
 * never pays for it.
 *
 * @typedef {Box | null | (() => Box | null)} Room
 */

/**
 * @param {Room | undefined} room
 * @returns {() => Box | null}
 */
function lazyRoom(room) {
  if (typeof room !== 'function') return () => room ?? null
  /** @type {Box | null | undefined} */
  let measured
  return () => {
    if (measured === undefined) measured = room() ?? null
    return measured
  }
}

/**
 * The steps every placement around a mark is made of, for one box at one
 * mark. Each returns a CellPlacement, or null when the box does not fit there.
 *
 * @param {object} p
 * @param {Box} p.cell
 * @param {Box} p.plot
 * @param {number} p.ttWidth
 * @param {number} p.ttHeight
 * @param {number} p.gap
 */
function markSteps({ cell, plot, ttWidth, ttHeight, gap }) {
  const midX = (cell.left + cell.right) / 2
  const midY = (cell.top + cell.bottom) / 2
  const aboveY = cell.top - gap - ttHeight
  const belowY = cell.bottom + gap

  /** @param {'top'|'bottom'} placement @param {number} y */
  const vertical = (placement, y) => {
    const x = alongEdge(midX, ttWidth, plot.left, plot.right)
    return { x, y, placement, arrowX: midX - x, arrowY: null }
  }

  return {
    /** The side of the cell facing the plot's middle, which has more room. */
    middleSide: /** @type {'left'|'right'} */ (
      midX < (plot.left + plot.right) / 2 ? 'right' : 'left'
    ),
    /** @param {Box} bounds */
    above: (bounds) => (aboveY >= bounds.top ? vertical('top', aboveY) : null),
    /** @param {Box} bounds */
    below: (bounds) =>
      belowY + ttHeight <= bounds.bottom ? vertical('bottom', belowY) : null,
    /**
     * Beside the cell on `side`, with the box inside `bounds` sideways.
     * Vertically it is centred on the cell and held inside the plot; a caller
     * that lets it out of the plot holds it in the room (`holdInRoom`).
     * @param {'left'|'right'} side @param {Box} bounds
     */
    beside: (side, bounds) => {
      const onRight = side === 'right'
      const x = onRight ? cell.right + gap : cell.left - gap - ttWidth
      if (onRight ? x + ttWidth > bounds.right : x < bounds.left) return null
      const y = alongEdge(midY, ttHeight, plot.top, plot.bottom)
      return { x, y, placement: side, arrowX: null, arrowY: midY - y }
    },
  }
}

/**
 * Where a tooltip with an arrow goes around a heatmap cell, so that the arrow
 * always lands on that cell. In order:
 *
 * 1. above the cell, inside the plot;
 * 2. below it, inside the plot;
 * 3. beside it, inside the plot, on the side facing the plot's middle;
 * 4. above it, then below it, out of the plot but inside `room`;
 * 5. beside it, out of the plot but inside `room`, on the side facing the
 *    plot's middle and then the other one.
 *
 * Null when none of those fit (or there is no room to step out into); the
 * caller then keeps its own placement. A box that fits neither above nor
 * below a middle row used to be pinned to the plot's top edge, where it
 * covered the cell and its arrow pointed at a row above; step 5 keeps it off
 * the cell wherever the page has a spot beside it.
 *
 * The box is centred on the cell along the side it sits on and held inside the
 * plot, then let out past the plot's edge as far as the arrow needs to reach a
 * cell in the first or last row or column (the arrow keeps clear of the box's
 * rounded corners, and a datetime heatmap centres its end cells on the plot
 * edge).
 *
 * All values share one coordinate space (elWrap-local in the library).
 *
 * @param {object} p
 * @param {Box} p.cell
 * @param {Box} p.plot
 * @param {Room} [p.room]  visible region a box out of the plot has to fit in
 * @param {number} p.ttWidth
 * @param {number} p.ttHeight
 * @param {number} [p.gap]  space between the cell's edge and the box
 * @returns {CellPlacement | null}
 */
export function placeAroundCell({
  cell,
  plot,
  room = null,
  ttWidth,
  ttHeight,
  gap = ARROW_TIP_OVERHANG,
}) {
  const nums = [cell.top, cell.bottom, cell.left, cell.right, ttWidth, ttHeight]
  if (!nums.every(Number.isFinite)) return null

  const step = markSteps({ cell, plot, ttWidth, ttHeight, gap })
  const inPlot =
    step.above(plot) ?? step.below(plot) ?? step.beside(step.middleSide, plot)
  if (inPlot) return inPlot

  const r = lazyRoom(room)()
  if (!r) return null
  const other = step.middleSide === 'right' ? 'left' : 'right'
  return (
    step.above(r) ??
    step.below(r) ??
    step.beside(step.middleSide, r) ??
    step.beside(other, r)
  )
}

/**
 * Where a tooltip with an arrow goes around a horizontal bar (or the row of
 * bars a shared tooltip captions), so that the arrow lands on the bar. In
 * order:
 *
 * 1. above the bar, inside the plot;
 * 2. below it, inside the plot;
 * 3. above it, then below it, out of the plot but inside `room`;
 * 4. beside it on `side`, inside the plot;
 * 5. beside it on `side`, out of the plot but inside `room`.
 *
 * Out of the plot above or below comes before beside: a box that already sat
 * on screen above a bar keeps that place, and only a bar with no room above or
 * below it on the page gets a box beside it. `side` is the bar's value end; a
 * bar has only the one, as the other end is its base, the zero line the bars
 * of the other sign start from, so a box there covers them and points at the
 * base. With no value side (a range bar, a box plot, a row pointing both ways)
 * it is the side facing the plot's middle.
 *
 * `beside: false` leaves out steps 4 and 5, for a column whose box fits
 * beside it nowhere on screen: above it or below it, then nothing.
 *
 * Null when none of those fit; the caller then keeps its own placement. All
 * values share one coordinate space (elWrap-local in the library).
 *
 * @param {object} p
 * @param {Box} p.cell  the bar
 * @param {Box} p.plot
 * @param {Room} [p.room]  visible region a box out of the plot has to fit in
 * @param {number} p.ttWidth
 * @param {number} p.ttHeight
 * @param {number} [p.gap]  space between the bar's edge and the box
 * @param {'left'|'right' | null} [p.side]  the bar's value end; null for the
 *   side facing the plot's middle
 * @param {boolean} [p.beside]  false: above or below only
 * @returns {CellPlacement | null}
 */
export function placeAroundBar({
  cell,
  plot,
  room = null,
  ttWidth,
  ttHeight,
  gap = ARROW_TIP_OVERHANG,
  side = null,
  beside = true,
}) {
  const nums = [cell.top, cell.bottom, cell.left, cell.right, ttWidth, ttHeight]
  if (!nums.every(Number.isFinite)) return null

  const step = markSteps({ cell, plot, ttWidth, ttHeight, gap })
  const getRoom = lazyRoom(room)
  const s = side ?? step.middleSide

  const inPlot = step.above(plot) ?? step.below(plot)
  if (inPlot) return inPlot
  const r = getRoom()
  const outOfPlot = r ? (step.above(r) ?? step.below(r)) : null
  if (outOfPlot || !beside) return outOfPlot
  return step.beside(s, plot) ?? (r ? step.beside(s, r) : null)
}

/**
 * A placement from `placeAroundCell` held inside the visible room along the
 * side of the cell it sits on. A box let out past the plot's edge, or longer
 * than the plot (a phone-width trellis panel), must not run off the part of
 * the page the reader can see; the arrow follows the cell as far as the box's
 * corners allow. The start wins when the box is longer than the room, as in
 * `clampIntoRoom`.
 *
 * @param {CellPlacement} pos
 * @param {Box} cell
 * @param {Box} room
 * @param {number} ttWidth
 * @param {number} ttHeight
 * @returns {CellPlacement}
 */
export function holdInRoom(pos, cell, room, ttWidth, ttHeight) {
  if (pos.placement === 'top' || pos.placement === 'bottom') {
    const x = Math.max(Math.min(pos.x, room.right - ttWidth), room.left)
    const midX = (cell.left + cell.right) / 2
    return { ...pos, x, arrowX: arrowOffset(midX - x, ttWidth) }
  }
  const y = Math.max(Math.min(pos.y, room.bottom - ttHeight), room.top)
  const midY = (cell.top + cell.bottom) / 2
  return { ...pos, y, arrowY: arrowOffset(midY - y, ttHeight) }
}

/**
 * Start of a box of length `size` centred on `mid` along one edge, held inside
 * [lo, hi] and then let out just enough for the arrow, which stays
 * ARROW_EDGE_INSET from either end of the box, to reach `mid`. A box longer
 * than [lo, hi] stays centred on `mid`: no end of it is any better to keep.
 *
 * @param {number} mid
 * @param {number} size
 * @param {number} lo
 * @param {number} hi
 * @returns {number}
 */
function alongEdge(mid, size, lo, hi) {
  if (size > hi - lo) return mid - size / 2
  const start = Math.max(Math.min(mid - size / 2, hi - size), lo)
  return mid - arrowOffset(mid - start, size)
}

/**
 * The arrow's offset inside a box of length `size`, kept ARROW_EDGE_INSET
 * from either end (the rounded corners), or centred on a box too small for
 * that.
 *
 * @param {number} offset
 * @param {number} size
 * @returns {number}
 */
function arrowOffset(offset, size) {
  const inset = Math.min(ARROW_EDGE_INSET, size / 2)
  return Math.max(inset, Math.min(size - inset, offset))
}

/**
 * Left edge of a box centred on `anchorX`, held inside the room. The left edge
 * wins when the box is wider than the room: its start is what gets read first.
 *
 * @param {number} anchorX
 * @param {number} ttWidth
 * @param {Box} room
 * @returns {number}
 */
export function clampIntoRoom(anchorX, ttWidth, room) {
  const x = Math.min(anchorX - ttWidth / 2, room.right - ttWidth)
  return Math.max(x, room.left)
}

/**
 * The part of the viewport where an overlay inside `el`'s containing block is
 * visible: the viewport, intersected with every ancestor that clips overflow.
 * Viewport coordinates. Null outside a browser.
 *
 * The clipping ancestors are found once per `cache` (style reads are the
 * expensive part) and only their rects are read on each call, so the bounds
 * follow scrolling.
 *
 * @param {Element} el
 * @param {{ clippers?: Array<{ node: Element, x: boolean, y: boolean }> | null }} cache
 * @returns {Box | null}
 */
export function getVisibleBounds(el, cache) {
  const doc = el?.ownerDocument
  const win = doc?.defaultView
  if (!win) return null

  // clientHeight leaves out a horizontal scrollbar; in quirks mode it is the
  // whole document instead, and in jsdom it is 0, hence the min with
  // innerHeight.
  const docEl = doc.documentElement
  const bounds = {
    top: 0,
    left: 0,
    right: Math.min(win.innerWidth, docEl?.clientWidth || Infinity),
    bottom: Math.min(win.innerHeight, docEl?.clientHeight || Infinity),
  }

  if (!cache.clippers) cache.clippers = findClippingAncestors(el, win)

  for (const { node, x, y } of cache.clippers) {
    if (!node.isConnected) continue
    const r = node.getBoundingClientRect()
    // Overflow clips at the padding box: inside the border, and short of any
    // scrollbar.
    if (y) {
      const top = r.top + node.clientTop
      bounds.top = Math.max(bounds.top, top)
      bounds.bottom = Math.min(bounds.bottom, top + node.clientHeight)
    }
    if (x) {
      const left = r.left + node.clientLeft
      bounds.left = Math.max(bounds.left, left)
      bounds.right = Math.min(bounds.right, left + node.clientWidth)
    }
  }

  return bounds
}

/**
 * Ancestors of `el` whose overflow clipping applies to it, walking the
 * composed tree (out of shadow roots to their hosts, into the slot a light-DOM
 * child is assigned to).
 *
 * Only ancestors on the containing-block chain clip: an absolutely positioned
 * box escapes static ancestors up to its positioned one, and a fixed box
 * escapes all of them unless one is transformed. `html` and `body` are left to
 * the viewport, which their overflow propagates to.
 *
 * @param {Element} el
 * @param {Window} win
 * @returns {Array<{ node: Element, x: boolean, y: boolean }>}
 */
function findClippingAncestors(el, win) {
  /** @type {Array<{ node: Element, x: boolean, y: boolean }>} */
  const out = []
  const doc = el.ownerDocument
  let position = win.getComputedStyle(el).position
  let node = composedParent(el)
  while (node && node !== doc.body && node !== doc.documentElement) {
    const cs = win.getComputedStyle(node)
    const containsIt =
      position === 'fixed'
        ? establishesFixedContainingBlock(cs)
        : position === 'absolute'
          ? cs.position !== 'static' || establishesFixedContainingBlock(cs)
          : true
    if (containsIt) {
      if (!NO_OVERFLOW_DISPLAY.test(cs.display || '')) {
        const paint = clipsPaint(cs)
        const x = paint || isClipping(cs.overflowX)
        const y = paint || isClipping(cs.overflowY)
        if (x || y) out.push({ node, x, y })
      }
      position = cs.position
    }
    node = composedParent(node)
  }
  return out
}

/**
 * Boxes `overflow` does not apply to: inline boxes, table rows and columns
 * and their groups, and `display: contents`, which has no box at all.
 */
const NO_OVERFLOW_DISPLAY =
  /^(inline|contents|table-row|table-row-group|table-header-group|table-footer-group|table-column|table-column-group)$/

/** @param {string} overflow */
function isClipping(overflow) {
  return !!overflow && overflow !== 'visible'
}

/**
 * Paint containment clips like `overflow: hidden` on both axes. It comes from
 * `contain` and also from `content-visibility`, which the computed `contain`
 * value does not show.
 *
 * @param {CSSStyleDeclaration} cs
 */
function clipsPaint(cs) {
  const cv = /** @type {any} */ (cs).contentVisibility
  return (
    /paint|strict|content/.test(cs.contain || '') ||
    cv === 'auto' ||
    cv === 'hidden'
  )
}

/**
 * Transforms (the shorthand and the individual `translate`, `rotate` and
 * `scale`), filters, 3D context, and layout or paint containment (including
 * the kind a size container gets) make a box the containing block of its
 * fixed and absolute descendants.
 *
 * @param {CSSStyleDeclaration} cs
 */
function establishesFixedContainingBlock(cs) {
  const set = (/** @type {string} */ v) => !!v && v !== 'none'
  const s = /** @type {any} */ (cs)
  return (
    set(cs.transform) ||
    set(s.translate) ||
    set(s.rotate) ||
    set(s.scale) ||
    set(cs.perspective) ||
    set(cs.filter) ||
    set(s.backdropFilter) ||
    cs.transformStyle === 'preserve-3d' ||
    /paint|layout|strict|content/.test(cs.contain || '') ||
    s.containerType === 'size' ||
    s.containerType === 'inline-size' ||
    clipsPaint(cs) ||
    /transform|translate|rotate|scale|perspective|filter/.test(
      cs.willChange || '',
    )
  )
}

/**
 * @param {Node} node
 * @returns {Element | null}
 */
function composedParent(node) {
  const slot = /** @type {Element} */ (node).assignedSlot
  /** @type {Node | null} */
  let parent = slot || node.parentNode
  // A shadow root's parent is null; its host is where the tree continues.
  if (parent && parent.nodeType === 11) {
    parent = /** @type {ShadowRoot} */ (parent).host || null
  }
  return parent && parent.nodeType === 1
    ? /** @type {Element} */ (parent)
    : null
}
