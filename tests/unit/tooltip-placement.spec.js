// @ts-nocheck
/**
 * On a plot too short to hold the tooltip beside its point (a sparkline, a
 * dashboard strip, a card with many rows) the box goes directly above the
 * hovered mark, arrow tip touching it, free to stick out of the plot and the
 * chart; directly below the mark when the visible part of the page has no
 * room above; and back to its usual placement when neither side has room. A
 * tall plot never moves the box, even when it finds no room beside its mark.
 *
 * The MARK is whatever the tooltip captions: the hovered marker (or the 1.5x
 * dynamic dot), the whole column of points under a shared tooltip, the bars at
 * a shared index, a bar, a cell, a row of horizontal bars, or the pointer.
 *
 * Layers:
 *   A. the pure deciders in `tooltip/placement.js` (`isShortPlot`,
 *      `placeAroundMark`, `clampIntoRoom`) and the DOM walk that measures the
 *      visible room (`getVisibleBounds`), driven on real jsdom trees;
 *   B. Position: `isShortPlot`, `placeOnShortPlot`, `getVisibleRoom` and its
 *      clip cache, `columnExtent`, `_barsExtentInGrid`, `placeOverAnchor`,
 *      the one Position instance the tooltip, its Marker and keyboard
 *      navigation share, and the callers that measure a mark (Marker,
 *      the dynamic-point and sticky-bar paths);
 *   C. `Position.computeTooltipPosition`, the point-tooltip path, with and
 *      without a mark, and its tall-plot behaviour (tooltip-positioning.spec.js
 *      pins the tall-plot results in detail);
 *   D. the callers that place a box over a mark themselves (shared horizontal
 *      rows, horizontal bars under the pointer and the keyboard, heatmap
 *      cells, treemap and legacy heat cells);
 *   E. the interactive tooltip's grace for the trip out to a box past the
 *      plot's edge (`Tooltip.interactiveHideDelay`,
 *      `Tooltip.isHeadingForOutsideBox` and the two places that use them).
 *
 * jsdom facts these tests are written around (checked against jsdom 28):
 *   - it lays nothing out, so every rect and client* size the code reads is
 *     defined on the element by hand;
 *   - computed style does not expand the `overflow` shorthand into
 *     `overflow-x` / `overflow-y`, so clipping ancestors set the longhands
 *     (a browser computes both from the shorthand);
 *   - an unstyled element computes `position` to '' rather than 'static', so a
 *     static ancestor that matters to a test says `position: static` itself;
 *   - `document.documentElement.clientWidth/Height` are 0, so the viewport is
 *     `innerWidth` x `innerHeight` unless a test defines them;
 *   - computed style carries `content-visibility`, `container-type`,
 *     `translate`, `rotate`, `scale`, `backdrop-filter`, `transform-style`
 *     and `will-change` from inline style. On a jsdom that does not, the one
 *     node's computed style is stubbed for that property (`setComputed`), so
 *     the library's read of it is still what the test drives.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import TooltipPosition from '../../src/modules/tooltip/Position.js'
import Tooltip from '../../src/modules/tooltip/Tooltip.js'
import TooltipUtils from '../../src/modules/tooltip/Utils.js'
import Marker from '../../src/modules/tooltip/Marker.js'
import Intersect from '../../src/modules/tooltip/Intersect.js'
import Graphics from '../../src/modules/Graphics.js'
import KeyboardNavigation from '../../src/modules/accessibility/KeyboardNavigation.js'
import {
  holdInRoom,
  placeAroundBar,
  isShortPlot,
  placeAroundCell,
  placeAroundMark,
  clampIntoRoom,
  getVisibleBounds,
} from '../../src/modules/tooltip/placement.js'
import * as placement from '../../src/modules/tooltip/placement.js'
import {
  ARROW_TIP_OVERHANG,
  POINT_TIP_GAP,
  POINTER_CLEARANCE_BELOW,
  SHORT_PLOT_RATIO,
} from '../../src/modules/tooltip/constants.js'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const win = document.defaultView
const SVG_NS = 'http://www.w3.org/2000/svg'

/** Mark-to-box gap above a point (and below it, for anything but a pointer). */
const GAP = ARROW_TIP_OVERHANG + POINT_TIP_GAP

function viewport() {
  return { top: 0, left: 0, right: win.innerWidth, bottom: win.innerHeight }
}

/** Give `el` a fixed border-box rect, in viewport coordinates. */
function setRect(el, { left, top, width, height }) {
  Object.defineProperty(el, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
    }),
  })
}

/** Give `el` its padding-box metrics (border widths and inner size). */
function setClientBox(
  el,
  { clientTop = 0, clientLeft = 0, clientWidth, clientHeight },
) {
  const props = { clientTop, clientLeft, clientWidth, clientHeight }
  for (const [k, v] of Object.entries(props)) {
    Object.defineProperty(el, k, { configurable: true, value: v })
  }
}

/** A div with a rect and a padding box the same size as the rect. */
function box(rect, style = '') {
  const el = document.createElement('div')
  if (style) el.style.cssText = style
  setRect(el, rect)
  setClientBox(el, { clientWidth: rect.width, clientHeight: rect.height })
  return el
}

/** Per-node computed-style overrides, for a jsdom that drops a property. */
let computedOverrides = null

/**
 * Make `node` (already in the document) compute `cssName: value`. jsdom 28
 * computes all the properties these tests use from inline style; on a jsdom
 * that does not, that one node's computed style is stubbed for that one
 * property.
 */
function setComputed(node, cssName, value) {
  node.style.setProperty(cssName, value)
  const key = cssName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  if (win.getComputedStyle(node)[key] === value) return
  if (!computedOverrides) {
    const map = new Map()
    computedOverrides = map
    const real = win.getComputedStyle.bind(win)
    vi.spyOn(win, 'getComputedStyle').mockImplementation((n, pseudo) => {
      const cs = real(n, pseudo)
      const o = map.get(n)
      if (!o) return cs
      return new Proxy(cs, {
        get: (t, k) => (k in o ? o[k] : Reflect.get(t, k, t)),
      })
    })
  }
  computedOverrides.set(node, { ...computedOverrides.get(node), [key]: value })
}

// Longhands, not `overflow: hidden`: see the jsdom note at the top.
const CLIP = 'overflow-x: hidden; overflow-y: hidden;'

afterEach(() => {
  vi.useRealTimers()
  computedOverrides = null
  document.body.innerHTML = ''
  document.body.removeAttribute('style')
  document.documentElement.removeAttribute('style')
  for (const el of [document.body, document.documentElement]) {
    for (const k of [
      'getBoundingClientRect',
      'clientTop',
      'clientLeft',
      'clientWidth',
      'clientHeight',
    ]) {
      if (Object.prototype.hasOwnProperty.call(el, k)) delete el[k]
    }
  }
  vi.restoreAllMocks()
})

// ===========================================================================
// A. placement.js
// ===========================================================================

describe('placement.js exports', () => {
  it('has placeAroundMark, placeAroundCell and clampIntoRoom, and no longer the round-2 deciders', () => {
    expect(typeof placement.placeAroundMark).toBe('function')
    expect(typeof placement.placeAroundCell).toBe('function')
    expect(typeof placement.clampIntoRoom).toBe('function')
    expect(placement.placeOutsidePlot).toBeUndefined()
    expect(placement.aboveOrBelow).toBeUndefined()
  })
})

describe('isShortPlot', () => {
  it('is false for a tooltip with no measured height', () => {
    expect(isShortPlot(0, 40)).toBe(false)
    expect(isShortPlot(NaN, 40)).toBe(false)
    expect(isShortPlot(-5, 40)).toBe(false)
    expect(isShortPlot(undefined, 40)).toBe(false)
    expect(isShortPlot(null, 40)).toBe(false)
  })

  it('is true when the plot has no height left at all', () => {
    expect(isShortPlot(30, 0)).toBe(true)
    expect(isShortPlot(30, -12)).toBe(true)
    expect(isShortPlot(30, NaN)).toBe(true)
    expect(isShortPlot(30, undefined)).toBe(true)
    expect(isShortPlot(30, null)).toBe(true)
  })

  it('is true exactly at the ratio', () => {
    const plot = 200
    const tt = plot * SHORT_PLOT_RATIO
    expect(isShortPlot(tt, plot)).toBe(true)
  })

  it('is false just below the ratio', () => {
    const plot = 200
    const tt = plot * SHORT_PLOT_RATIO
    expect(isShortPlot(tt - 0.001, plot)).toBe(false)
  })

  it('is false on a full-size plot with an ordinary tooltip', () => {
    expect(isShortPlot(50, 300)).toBe(false)
  })

  it('is true when the tooltip is taller than the plot', () => {
    expect(isShortPlot(120, 60)).toBe(true)
  })

  it('cuts at 0.78 of the plot height', () => {
    expect(SHORT_PLOT_RATIO).toBe(0.78)
    // a 130px synced chart with a 102px card: short
    expect(isShortPlot(102, 130)).toBe(true)
    expect(isShortPlot(101, 130)).toBe(false)
  })
})

describe('placeAroundMark', () => {
  // A mark from y=100 to y=120 in a page 500 tall and 800 wide.
  const base = {
    anchorX: 300,
    markTop: 100,
    markBottom: 120,
    ttWidth: 120,
    ttHeight: 60,
    room: { top: 0, bottom: 500, left: 0, right: 800 },
  }

  it('goes directly above the mark, the arrow tip on its top edge, when the room allows', () => {
    const r = placeAroundMark(base)
    expect(r).toEqual({
      x: 300 - 60,
      y: 100 - ARROW_TIP_OVERHANG - 60,
      placement: 'top',
      arrowX: 60,
    })
    expect(r.y).toBe(33)
    // the box's bottom edge plus the arrow's overhang lands on the mark
    expect(r.y + 60 + ARROW_TIP_OVERHANG).toBe(100)
  })

  it('defaults both gaps to the arrow overhang', () => {
    expect(ARROW_TIP_OVERHANG).toBe(7)
    expect(placeAroundMark({ ...base, gapAbove: undefined })).toEqual(
      placeAroundMark(base),
    )
    expect(
      placeAroundMark({ ...base, gapAbove: undefined, gapBelow: undefined }),
    ).toEqual(placeAroundMark(base))
  })

  it('goes above when the box exactly reaches the top of the room', () => {
    // markTop - gap - ttHeight = 67 - 7 - 60 = 0 = room.top
    const r = placeAroundMark({ ...base, markTop: 67 })
    expect(r.placement).toBe('top')
    expect(r.y).toBe(0)
  })

  it('goes directly below the mark when there is no room above', () => {
    // 50 - 7 - 60 = -17 is above the room
    const r = placeAroundMark({ ...base, markTop: 50, markBottom: 70 })
    expect(r).toEqual({
      x: 240,
      y: 70 + ARROW_TIP_OVERHANG,
      placement: 'bottom',
      arrowX: 60,
    })
  })

  it('goes below when the box exactly reaches the bottom of the room', () => {
    const r = placeAroundMark({
      ...base,
      markTop: 50,
      markBottom: 70,
      room: { ...base.room, bottom: 77 + 60 },
    })
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(77)
  })

  it('returns null when neither side has room', () => {
    const r = placeAroundMark({
      ...base,
      markTop: 50,
      markBottom: 70,
      room: { ...base.room, bottom: 77 + 60 - 1 },
    })
    expect(r).toBeNull()
  })

  it('returns null for a box taller than the whole room', () => {
    expect(
      placeAroundMark({
        ...base,
        ttHeight: 600,
      }),
    ).toBeNull()
  })

  it('uses gapAbove above and gapBelow below', () => {
    const above = placeAroundMark({ ...base, gapAbove: 15, gapBelow: 24 })
    expect(above.placement).toBe('top')
    expect(above.y).toBe(100 - 15 - 60)

    const below = placeAroundMark({
      ...base,
      markTop: 50,
      markBottom: 70,
      gapAbove: 15,
      gapBelow: 24,
    })
    expect(below.placement).toBe('bottom')
    expect(below.y).toBe(70 + 24)
  })

  it('uses gapAbove below too when no gapBelow is given', () => {
    const r = placeAroundMark({
      ...base,
      markTop: 50,
      markBottom: 70,
      gapAbove: 15,
    })
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(70 + 15)
  })

  it('a zero gap puts the box edge on the mark', () => {
    expect(placeAroundMark({ ...base, gapAbove: 0 }).y).toBe(100 - 60)
  })

  it('a gapAbove that pushes the box past the top of the room flips it below', () => {
    // 100 - 41 - 60 = -1
    const r = placeAroundMark({ ...base, gapAbove: 41, gapBelow: 7 })
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(120 + 7)
  })

  it('a point mark (top = bottom, the pointer) clears it by gapBelow below', () => {
    const r = placeAroundMark({
      ...base,
      markTop: 40,
      markBottom: 40,
      gapAbove: 7,
      gapBelow: 24,
    })
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(40 + 24)
  })

  it('treats a mark bottom above its top as the top', () => {
    const r = placeAroundMark({ ...base, markTop: 50, markBottom: 30 })
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(50 + ARROW_TIP_OVERHANG)
  })

  it('a taller mark only moves the box below, never the one above', () => {
    const short = placeAroundMark({ ...base, markBottom: 101 })
    const tall = placeAroundMark({ ...base, markBottom: 400 })
    expect(short.y).toBe(tall.y)

    const shortBelow = placeAroundMark({ ...base, markTop: 50, markBottom: 51 })
    const tallBelow = placeAroundMark({ ...base, markTop: 50, markBottom: 90 })
    expect(tallBelow.y - shortBelow.y).toBe(39)
  })

  it.each([NaN, Infinity, -Infinity, undefined, null, '100'])(
    'returns null when any input is %s',
    (bad) => {
      for (const k of [
        'anchorX',
        'markTop',
        'markBottom',
        'ttWidth',
        'ttHeight',
      ]) {
        expect(placeAroundMark({ ...base, [k]: bad })).toBeNull()
      }
    },
  )

  it('centres the box on the anchor', () => {
    const r = placeAroundMark({ ...base, anchorX: 410 })
    expect(r.x).toBe(350)
    expect(r.arrowX).toBe(60)
  })

  it('holds the box inside the right edge of the room and clamps the arrow off the corner', () => {
    // centred: 795 - 60 = 735, clamped to 800 - 120 = 680; the arrow would be
    // at 115, clamped to ttWidth - 10 = 110
    const r = placeAroundMark({ ...base, anchorX: 795 })
    expect(r.x).toBe(680)
    expect(r.arrowX).toBe(110)
  })

  it('holds the box inside the left edge of the room and clamps the arrow off the corner', () => {
    const r = placeAroundMark({ ...base, anchorX: 3 })
    expect(r.x).toBe(0)
    expect(r.arrowX).toBe(10)
  })

  it('clamps the arrow to the box even for an anchor outside it', () => {
    expect(placeAroundMark({ ...base, anchorX: 5000 }).arrowX).toBe(110)
    expect(placeAroundMark({ ...base, anchorX: -5000 }).arrowX).toBe(10)
  })

  it('points the arrow at the anchor when the clamp moved the box but the anchor is inside it', () => {
    const r = placeAroundMark({ ...base, anchorX: 40 })
    expect(r.x).toBe(0)
    expect(r.arrowX).toBe(40)
  })

  it('clamps to the room, not to the chart: the box may hang left of x=0', () => {
    const r = placeAroundMark({
      ...base,
      anchorX: 10,
      room: { ...base.room, left: -200 },
    })
    expect(r.x).toBe(10 - 60)
    expect(r.arrowX).toBe(60)
  })

  it('lets the left edge win when the box is wider than the room', () => {
    // room is 80 wide, the box 120: right clamp gives 100 - 120 = -20, the
    // left clamp then puts it back at 20
    const r = placeAroundMark({
      ...base,
      anchorX: 60,
      room: { ...base.room, left: 20, right: 100 },
    })
    expect(r.x).toBe(20)
    expect(r.arrowX).toBe(40)
  })

  it('decides the two axes independently: below and clamped sideways at once', () => {
    const r = placeAroundMark({
      ...base,
      anchorX: 795,
      markTop: 50,
      markBottom: 70,
    })
    expect(r).toEqual({ x: 680, y: 77, placement: 'bottom', arrowX: 110 })
  })
})

describe('clampIntoRoom', () => {
  const room = { top: 0, bottom: 500, left: 0, right: 800 }

  it('centres the box on the anchor when it fits', () => {
    expect(clampIntoRoom(300, 120, room)).toBe(240)
  })

  it('leaves a box flush with either edge where centring put it', () => {
    expect(clampIntoRoom(60, 120, room)).toBe(0)
    expect(clampIntoRoom(740, 120, room)).toBe(680)
  })

  it('holds the box inside the right edge', () => {
    expect(clampIntoRoom(795, 120, room)).toBe(680)
  })

  it('holds the box inside the left edge', () => {
    expect(clampIntoRoom(3, 120, room)).toBe(0)
  })

  it('follows a room that starts left of the chart', () => {
    expect(clampIntoRoom(10, 120, { ...room, left: -200 })).toBe(-50)
    expect(clampIntoRoom(-500, 120, { ...room, left: -200 })).toBe(-200)
  })

  it('lets the left edge win when the box is wider than the room', () => {
    expect(clampIntoRoom(60, 120, { ...room, left: 20, right: 100 })).toBe(20)
    expect(clampIntoRoom(5000, 120, { ...room, left: 20, right: 100 })).toBe(20)
  })

  it('reads only the sides of the room', () => {
    expect(clampIntoRoom(300, 120, { left: 0, right: 800 })).toBe(240)
  })
})

describe('placeAroundCell', () => {
  // A 600x160 plot, a 100x80 box, 20px cells. A row whose top is 70 fits the
  // box neither above (70 - 7 - 80 = -17) nor below (90 + 7 + 80 = 177).
  const plot = { top: 0, bottom: 160, left: 0, right: 600 }
  const cellAt = (x, y, size = 20) => ({
    left: x,
    right: x + size,
    top: y,
    bottom: y + size,
  })
  const place = (cell, extra = {}) =>
    placeAroundCell({ cell, plot, ttWidth: 100, ttHeight: 80, ...extra })

  it('puts the box above the cell, centred on it, when the plot has room there', () => {
    expect(place(cellAt(280, 100))).toEqual({
      x: 240,
      y: 100 - GAP - 80,
      placement: 'top',
      arrowX: 50,
      arrowY: null,
    })
  })

  it('stays above when the box exactly reaches the plot top', () => {
    expect(place(cellAt(280, 87))).toMatchObject({ y: 0, placement: 'top' })
  })

  it('goes below the cell when there is no room above it', () => {
    expect(place(cellAt(280, 40))).toEqual({
      x: 240,
      y: 60 + GAP,
      placement: 'bottom',
      arrowX: 50,
      arrowY: null,
    })
  })

  it('goes beside a middle-row cell, arrow on its middle, when it fits neither above nor below', () => {
    // the old placement pinned this box to the plot top, over the cell, with
    // the arrow on the row above
    expect(place(cellAt(280, 70))).toEqual({
      x: 300 + GAP,
      y: 40,
      placement: 'right',
      arrowX: null,
      arrowY: 40,
    })
  })

  it('goes beside on the left for a cell right of the plot middle', () => {
    expect(place(cellAt(400, 70))).toEqual({
      x: 400 - GAP - 100,
      y: 40,
      placement: 'left',
      arrowX: null,
      arrowY: 40,
    })
  })

  it('takes the right for a cell left of the middle and the left from the middle on', () => {
    expect(place(cellAt(289, 70)).placement).toBe('right')
    expect(place(cellAt(290, 70)).placement).toBe('left')
  })

  it('holds a box beside a cell inside the plot vertically, arrow still on the cell', () => {
    // a 130px box beside a cell whose middle is 80 would start at 15; on a
    // 0..140 plot it is held at 140 - 130
    const pos = placeAroundCell({
      cell: cellAt(280, 70),
      plot: { ...plot, bottom: 140 },
      ttWidth: 100,
      ttHeight: 130,
    })
    expect(pos).toMatchObject({ placement: 'right', y: 10, arrowY: 70 })
  })

  it('is null, with no room given, when the box fits nowhere around the cell inside the plot', () => {
    // a 300px box runs past the right edge (307 + 300), and the left side
    // has less room still
    expect(place(cellAt(280, 70), { ttWidth: 300 })).toBeNull()
  })

  it('goes above the cell out of the plot when nothing fits inside it and the room has space', () => {
    const room = { top: -300, bottom: 500, left: -100, right: 700 }
    expect(place(cellAt(280, 70), { ttWidth: 300, room })).toEqual({
      x: 290 - 150,
      y: 70 - GAP - 80,
      placement: 'top',
      arrowX: 150,
      arrowY: null,
    })
  })

  it('goes below the cell out of the plot when the room has no space above', () => {
    const room = { top: -10, bottom: 500, left: -100, right: 700 }
    expect(place(cellAt(280, 70), { ttWidth: 300, room })).toMatchObject({
      y: 90 + GAP,
      placement: 'bottom',
    })
  })

  it('goes beside the cell out of the plot, inside the room, when the room has space neither above nor below', () => {
    // the old placement pinned this box to the plot top, over the cell
    const room = { top: -10, bottom: 170, left: -100, right: 700 }
    expect(place(cellAt(280, 70), { ttWidth: 300, room })).toEqual({
      x: 300 + GAP,
      y: 40,
      placement: 'right',
      arrowX: null,
      arrowY: 40,
    })
    // the side facing the middle first, then the other one
    const leftOnly = { ...room, left: -100, right: 600 }
    expect(
      place(cellAt(280, 70), { ttWidth: 300, room: leftOnly }),
    ).toMatchObject({
      x: 280 - GAP - 300,
      placement: 'left',
    })
  })

  it('is null when the room has space on no side either', () => {
    // 307 + 300 runs past the room's right, 280 - 7 - 300 past its left
    const room = { top: -10, bottom: 170, left: 0, right: 600 }
    expect(place(cellAt(280, 70), { ttWidth: 300, room })).toBeNull()
  })

  it('measures a room given as a function only when a step needs it, and once', () => {
    const getRoom = vi.fn(() => ({
      top: -300,
      bottom: 500,
      left: -100,
      right: 700,
    }))
    place(cellAt(280, 100), { room: getRoom })
    place(cellAt(280, 70), { room: getRoom })
    expect(getRoom).not.toHaveBeenCalled()
    expect(
      place(cellAt(280, 70), { ttWidth: 300, room: getRoom }),
    ).toMatchObject({
      placement: 'top',
    })
    expect(getRoom).toHaveBeenCalledTimes(1)
  })

  it('never uses the room while the box fits inside the plot', () => {
    // a room that would refuse every placement changes nothing
    const room = { top: 50, bottom: 60, left: 0, right: 0 }
    expect(place(cellAt(280, 100), { room })).toEqual(place(cellAt(280, 100)))
    expect(place(cellAt(280, 70), { room })).toEqual(place(cellAt(280, 70)))
  })

  it('lets the box out past the plot edge so the arrow reaches a cell centred on it', () => {
    // a datetime heatmap's first and last cells straddle the plot's sides; the
    // arrow keeps 10px from the box's corners
    expect(place(cellAt(-10, 100))).toMatchObject({ x: -10, arrowX: 10 })
    expect(place(cellAt(590, 100))).toMatchObject({ x: 510, arrowX: 90 })
  })

  it('does not let the box out for a cell the arrow already reaches', () => {
    expect(place(cellAt(0, 100))).toMatchObject({ x: 0, arrowX: 10 })
    expect(place(cellAt(580, 100))).toMatchObject({ x: 500, arrowX: 90 })
  })

  it('lets a box beside a cell out past the plot top or bottom the same way', () => {
    const short = { ...plot, bottom: 90 }
    // middle 0: below 17 + 80 > 90, above < 0
    const top = placeAroundCell({
      cell: cellAt(280, -10),
      plot: short,
      ttWidth: 100,
      ttHeight: 80,
    })
    expect(top).toMatchObject({ placement: 'right', y: -10, arrowY: 10 })
    // middle 90: above 80 - 87 < 0, below > 90
    const bottom = placeAroundCell({
      cell: cellAt(280, 80),
      plot: short,
      ttWidth: 100,
      ttHeight: 80,
    })
    expect(bottom).toMatchObject({ placement: 'right', y: 20, arrowY: 70 })
  })

  it('centres the arrow on a box too small to keep it 10px from both corners', () => {
    expect(place(cellAt(-10, 100), { ttWidth: 12 })).toMatchObject({
      x: -6,
      arrowX: 6,
    })
  })

  it('keeps a box longer than the plot centred on the cell', () => {
    // neither end of a 700px box on a 600px plot is better to keep; the
    // caller holds it inside the visible room
    expect(place(cellAt(280, 100), { ttWidth: 700 })).toMatchObject({
      x: 290 - 350,
      arrowX: 350,
    })
  })

  it('uses the gap it is given', () => {
    expect(place(cellAt(280, 100), { gap: 12 }).y).toBe(100 - 12 - 80)
    expect(place(cellAt(280, 70), { gap: 12 }).x).toBe(300 + 12)
  })

  it('is null for a cell or a box that is not a number', () => {
    expect(place({ ...cellAt(280, 100), top: NaN })).toBeNull()
    expect(place(cellAt(280, 100), { ttWidth: undefined })).toBeNull()
  })
})

describe('placeAroundBar', () => {
  // The placeAroundCell fixture: a 600x160 plot and a 100x80 box. A bar in
  // the row at 70..90 fits the box neither above (-17) nor below (177) it
  // inside the plot.
  const plot = { top: 0, bottom: 160, left: 0, right: 600 }
  const barAt = (left, right, top = 70) => ({
    left,
    right,
    top,
    bottom: top + 20,
  })
  const place = (bar, extra = {}) =>
    placeAroundBar({ cell: bar, plot, ttWidth: 100, ttHeight: 80, ...extra })
  const ROOMY = { top: -300, bottom: 500, left: -100, right: 900 }
  // the page ends at the plot's top and bottom
  const FLUSH = { top: 0, bottom: 160, left: -100, right: 900 }

  it('goes above or below the bar inside the plot, as a cell does', () => {
    for (const side of [null, 'left', 'right']) {
      expect(place(barAt(200, 300, 100), { side })).toEqual(
        placeAroundCell({
          cell: barAt(200, 300, 100),
          plot,
          ttWidth: 100,
          ttHeight: 80,
        }),
      )
      expect(place(barAt(200, 300, 40), { side })).toMatchObject({
        placement: 'bottom',
      })
    }
  })

  it('goes above it out of the plot, where the page has room, before beside it', () => {
    // beside the value end would fit inside the plot, but a box that is on
    // screen above the bar keeps that place
    expect(place(barAt(40, 150), { side: 'right', room: ROOMY })).toEqual({
      x: 95 - 50,
      y: 70 - GAP - 80,
      placement: 'top',
      arrowX: 50,
      arrowY: null,
    })
    // and below it, when the page has no room above
    expect(
      place(barAt(40, 150), { side: 'right', room: { ...ROOMY, top: -10 } }),
    ).toMatchObject({ y: 90 + GAP, placement: 'bottom' })
  })

  it('goes beside its value end, inside the plot, when the page has room neither above nor below', () => {
    expect(place(barAt(40, 150), { side: 'right', room: FLUSH })).toEqual({
      x: 150 + GAP,
      y: 40,
      placement: 'right',
      arrowX: null,
      arrowY: 40,
    })
    expect(place(barAt(450, 560), { side: 'left', room: FLUSH })).toMatchObject(
      {
        x: 450 - GAP - 100,
        placement: 'left',
      },
    )
  })

  it('goes beside the value end even facing away from the plot middle', () => {
    expect(
      place(barAt(400, 420), { side: 'right', room: FLUSH }),
    ).toMatchObject({
      x: 420 + GAP,
      placement: 'right',
    })
  })

  it('goes beside the value end out of the plot, inside the room, when the plot has no room there', () => {
    // 560 + 7 + 100 runs past the plot's 600, not past the page's 900
    expect(
      place(barAt(450, 560), { side: 'right', room: FLUSH }),
    ).toMatchObject({
      x: 560 + GAP,
      placement: 'right',
    })
  })

  it('never goes beside the base, the zero line the bars of the other sign start from', () => {
    // no room past the value end anywhere; the left would fit, but it is the
    // bar's base
    const tight = { ...FLUSH, right: 600 }
    expect(place(barAt(450, 560), { side: 'right', room: tight })).toBeNull()
    expect(
      place(barAt(40, 150), { side: 'left', room: { ...FLUSH, left: 0 } }),
    ).toBeNull()
  })

  it('takes the side facing the plot middle for a bar with no value side', () => {
    expect(place(barAt(400, 450), { room: FLUSH }).placement).toBe('left')
    expect(place(barAt(100, 150), { room: FLUSH }).placement).toBe('right')
  })

  it('goes above or below only, never beside, with beside: false', () => {
    expect(
      place(barAt(40, 150), { side: 'right', room: FLUSH, beside: false }),
    ).toBeNull()
    expect(place(barAt(40, 150), { room: ROOMY, beside: false })).toMatchObject(
      { placement: 'top' },
    )
  })

  it('is null without a room once nothing fits inside the plot', () => {
    expect(place(barAt(20, 580), { side: 'right' })).toBeNull()
  })

  it('is null for a bar or a box that is not a number', () => {
    expect(place({ ...barAt(20, 80), top: NaN })).toBeNull()
    expect(place(barAt(20, 80), { ttWidth: undefined })).toBeNull()
  })
})

describe('holdInRoom', () => {
  const room = { top: 0, bottom: 400, left: 0, right: 600 }
  const cell = (left, top, size = 20) => ({
    left,
    right: left + size,
    top,
    bottom: top + size,
  })
  const above = (x, arrowX) => ({
    x,
    y: 50,
    placement: 'top',
    arrowX,
    arrowY: null,
  })
  const beside = (y, arrowY) => ({
    x: 50,
    y,
    placement: 'right',
    arrowX: null,
    arrowY,
  })

  it('leaves a box inside the room where it is', () => {
    const pos = above(240, 50)
    expect(holdInRoom(pos, cell(280, 100), room, 100, 80)).toEqual(pos)
    const side = beside(40, 40)
    expect(holdInRoom(side, cell(20, 70), room, 100, 80)).toEqual(side)
  })

  it('pulls a box above or below a cell back inside the room sideways, arrow following the cell', () => {
    // let out to -10 for a cell centred on 0: the room starts at 0, so the
    // arrow stops at its corner inset
    expect(holdInRoom(above(-10, 10), cell(-10, 100), room, 100, 80)).toEqual(
      above(0, 10),
    )
    // a box running past the right: the arrow still reaches the cell
    expect(holdInRoom(above(540, 50), cell(570, 100), room, 100, 80)).toEqual(
      above(500, 80),
    )
  })

  it('pulls a box beside a cell back inside the room vertically', () => {
    expect(holdInRoom(beside(-10, 10), cell(20, -10), room, 100, 80)).toEqual(
      beside(0, 10),
    )
    expect(holdInRoom(beside(350, 40), cell(20, 380), room, 100, 80)).toEqual(
      beside(320, 70),
    )
  })

  it('keeps the start of a box longer than the room', () => {
    const narrow = { ...room, left: 20, right: 100 }
    expect(holdInRoom(above(-60, 350), cell(280, 100), narrow, 700, 80)).toMatchObject({
      x: 20,
      arrowX: 290 - 20,
    })
  })
})

describe('getVisibleBounds', () => {
  it('is the viewport when no ancestor clips', () => {
    // A plain ancestor with a small rect: it must not be read as a clipper.
    const plain = box({ left: 300, top: 300, width: 10, height: 10 })
    const el = document.createElement('div')
    plain.appendChild(el)
    document.body.appendChild(plain)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual(viewport())
    expect(cache.clippers).toEqual([])
  })

  it('leaves the root scrollbar out of the viewport', () => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      value: win.innerWidth - 15,
    })
    Object.defineProperty(document.documentElement, 'clientHeight', {
      configurable: true,
      value: win.innerHeight - 15,
    })
    const el = document.createElement('div')
    document.body.appendChild(el)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 0,
      left: 0,
      right: win.innerWidth - 15,
      bottom: win.innerHeight - 15,
    })
  })

  it('intersects with an overflow-hidden ancestor at its padding box', () => {
    const card = document.createElement('div')
    card.style.cssText = CLIP
    setRect(card, { left: 50, top: 100, width: 400, height: 200 })
    // 2px top border, 3px left border, a 17px vertical scrollbar
    setClientBox(card, {
      clientTop: 2,
      clientLeft: 3,
      clientWidth: 380,
      clientHeight: 190,
    })
    const el = document.createElement('div')
    card.appendChild(el)
    document.body.appendChild(card)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 102,
      bottom: 292,
      left: 53,
      right: 433,
    })
  })

  it('never widens the viewport: a clipper bigger than it, partly off screen, only cuts where it ends', () => {
    const card = box({ left: -20, top: -50, width: 3000, height: 300 }, CLIP)
    const el = document.createElement('div')
    card.appendChild(el)
    document.body.appendChild(card)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 0,
      left: 0,
      right: win.innerWidth,
      bottom: 250,
    })
  })

  it('intersects every clipping ancestor', () => {
    const outer = box({ left: 0, top: 100, width: 600, height: 400 }, CLIP)
    const middle = box({ left: 50, top: 50, width: 300, height: 300 })
    const inner = box({ left: 100, top: 200, width: 800, height: 500 }, CLIP)
    const el = document.createElement('div')
    inner.appendChild(el)
    middle.appendChild(inner)
    outer.appendChild(middle)
    document.body.appendChild(outer)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 200,
      bottom: 500,
      left: 100,
      right: 600,
    })
  })

  it('overflow-x: clip clips x only (clip does not force the other axis to scroll)', () => {
    const strip = box(
      { left: 100, top: 100, width: 200, height: 50 },
      'overflow-x: clip;',
    )
    const el = document.createElement('div')
    strip.appendChild(el)
    document.body.appendChild(strip)

    const cs = win.getComputedStyle(strip)
    expect(cs.overflowX).toBe('clip')

    expect(getVisibleBounds(el, {})).toEqual({
      top: 0,
      bottom: win.innerHeight,
      left: 100,
      right: 300,
    })
  })

  it('overflow-x: hidden on its own clips x only as jsdom computes it (overflow-y stays empty)', () => {
    // A browser computes overflow-y to `auto` here (one axis not visible makes
    // a visible other axis auto) and both axes clip: see the next test. jsdom
    // does not apply that rule, so this pins the per-axis plumbing.
    const strip = box(
      { left: 100, top: 100, width: 200, height: 50 },
      'overflow-x: hidden;',
    )
    const el = document.createElement('div')
    strip.appendChild(el)
    document.body.appendChild(strip)

    const cs = win.getComputedStyle(strip)
    expect(cs.overflowX).toBe('hidden')
    expect(cs.overflowY === '' || cs.overflowY === 'visible').toBe(true)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual({
      top: 0,
      bottom: win.innerHeight,
      left: 100,
      right: 300,
    })
    expect(cache.clippers).toEqual([{ node: strip, x: true, y: false }])
  })

  it('overflow-x: hidden with overflow-y: auto (what a browser computes) clips both axes', () => {
    const strip = box(
      { left: 100, top: 100, width: 200, height: 50 },
      'overflow-x: hidden; overflow-y: auto;',
    )
    const el = document.createElement('div')
    strip.appendChild(el)
    document.body.appendChild(strip)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 100,
      bottom: 150,
      left: 100,
      right: 300,
    })
  })

  it('overflow-y: scroll clips y only', () => {
    const list = box(
      { left: 100, top: 100, width: 200, height: 50 },
      'overflow-y: scroll;',
    )
    const el = document.createElement('div')
    list.appendChild(el)
    document.body.appendChild(list)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 100,
      bottom: 150,
      left: 0,
      right: win.innerWidth,
    })
  })

  it.each(['paint', 'strict', 'content'])(
    'contain: %s clips both axes',
    (contain) => {
      const card = box(
        { left: 40, top: 60, width: 300, height: 120 },
        `contain: ${contain};`,
      )
      const el = document.createElement('div')
      card.appendChild(el)
      document.body.appendChild(card)

      expect(getVisibleBounds(el, {})).toEqual({
        top: 60,
        bottom: 180,
        left: 40,
        right: 340,
      })
    },
  )

  it('contain: layout does not clip', () => {
    const card = box(
      { left: 40, top: 60, width: 300, height: 120 },
      'contain: layout;',
    )
    const el = document.createElement('div')
    card.appendChild(el)
    document.body.appendChild(card)

    expect(getVisibleBounds(el, {})).toEqual(viewport())
  })

  // content-visibility: auto/hidden turns on paint containment, which the
  // computed `contain` value does not show, so the walk has to read it too.
  it.each(['auto', 'hidden'])(
    'content-visibility: %s clips both axes',
    (cv) => {
      const card = box({ left: 40, top: 60, width: 300, height: 120 })
      const el = document.createElement('div')
      card.appendChild(el)
      document.body.appendChild(card)
      setComputed(card, 'content-visibility', cv)

      const cache = {}
      expect(getVisibleBounds(el, cache)).toEqual({
        top: 60,
        bottom: 180,
        left: 40,
        right: 340,
      })
      expect(cache.clippers).toEqual([{ node: card, x: true, y: true }])
    },
  )

  it('content-visibility: visible does not clip', () => {
    const card = box({ left: 40, top: 60, width: 300, height: 120 })
    const el = document.createElement('div')
    card.appendChild(el)
    document.body.appendChild(card)
    setComputed(card, 'content-visibility', 'visible')

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual(viewport())
    expect(cache.clippers).toEqual([])
  })

  it('content-visibility: auto captures a fixed box (paint containment makes a containing block), so it clips it', () => {
    const card = box(
      { left: 100, top: 100, width: 200, height: 100 },
      'position: static;',
    )
    const el = document.createElement('div')
    el.style.position = 'fixed'
    card.appendChild(el)
    document.body.appendChild(card)
    setComputed(card, 'content-visibility', 'auto')

    expect(getVisibleBounds(el, {})).toEqual({
      top: 100,
      bottom: 200,
      left: 100,
      right: 300,
    })
  })

  it.each(['size', 'inline-size'])(
    'container-type: %s makes an ancestor the containing block of a fixed box, so the clippers above it apply again',
    (ct) => {
      const outer = box(
        { left: 100, top: 100, width: 200, height: 100 },
        `position: static; ${CLIP}`,
      )
      // A size container that does not clip: it only captures the fixed box.
      const container = box(
        { left: 0, top: 0, width: 1000, height: 1000 },
        'position: static;',
      )
      const el = document.createElement('div')
      el.style.position = 'fixed'
      container.appendChild(el)
      outer.appendChild(container)
      document.body.appendChild(outer)
      setComputed(container, 'container-type', ct)

      const cache = {}
      expect(getVisibleBounds(el, cache)).toEqual({
        top: 100,
        bottom: 200,
        left: 100,
        right: 300,
      })
      expect(cache.clippers.map((c) => c.node)).toEqual([outer])
    },
  )

  it('a fixed box escapes the same clipper when the ancestor between is not a size container (control)', () => {
    const outer = box(
      { left: 100, top: 100, width: 200, height: 100 },
      `position: static; ${CLIP}`,
    )
    const container = box(
      { left: 0, top: 0, width: 1000, height: 1000 },
      'position: static; container-type: normal;',
    )
    const el = document.createElement('div')
    el.style.position = 'fixed'
    container.appendChild(el)
    outer.appendChild(container)
    document.body.appendChild(outer)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual(viewport())
    expect(cache.clippers).toEqual([])
  })

  it('a clipping size container clips the fixed box inside it', () => {
    const card = box(
      { left: 100, top: 100, width: 200, height: 100 },
      `position: static; container-type: size; ${CLIP}`,
    )
    const el = document.createElement('div')
    el.style.position = 'fixed'
    card.appendChild(el)
    document.body.appendChild(card)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 100,
      bottom: 200,
      left: 100,
      right: 300,
    })
  })

  // The containing-block rules added in round 3: the individual transform
  // properties, backdrop-filter, a preserve-3d context, and will-change naming
  // any of them. Each makes a non-clipping ancestor the containing block of a
  // fixed box, so the clipper above it applies to the box again.
  it.each([
    ['translate', '10px 0px'],
    ['translate', '0px'],
    ['rotate', '5deg'],
    ['rotate', '0deg'],
    ['scale', '2'],
    ['scale', '1'],
    ['backdrop-filter', 'blur(2px)'],
    ['transform-style', 'preserve-3d'],
    ['will-change', 'transform'],
    ['will-change', 'translate'],
    ['will-change', 'rotate'],
    ['will-change', 'scale'],
    ['will-change', 'perspective'],
    ['will-change', 'filter'],
    ['will-change', 'backdrop-filter'],
    ['will-change', 'opacity, translate'],
  ])(
    '%s: %s captures a fixed box, so the clippers above it apply again',
    (prop, value) => {
      const outer = box(
        { left: 100, top: 100, width: 200, height: 100 },
        `position: static; ${CLIP}`,
      )
      const capture = box(
        { left: 0, top: 0, width: 1000, height: 1000 },
        'position: static;',
      )
      const el = document.createElement('div')
      el.style.position = 'fixed'
      capture.appendChild(el)
      outer.appendChild(capture)
      document.body.appendChild(outer)
      setComputed(capture, prop, value)

      const cache = {}
      expect(getVisibleBounds(el, cache)).toEqual({
        top: 100,
        bottom: 200,
        left: 100,
        right: 300,
      })
      expect(cache.clippers.map((c) => c.node)).toEqual([outer])
    },
  )

  it.each([
    ['translate', 'none'],
    ['rotate', 'none'],
    ['scale', 'none'],
    ['backdrop-filter', 'none'],
    ['transform-style', 'flat'],
    ['will-change', 'auto'],
    ['will-change', 'opacity'],
    ['will-change', 'scroll-position'],
    ['will-change', 'contents'],
  ])(
    '%s: %s does not capture a fixed box, which escapes the clipper (control)',
    (prop, value) => {
      const outer = box(
        { left: 100, top: 100, width: 200, height: 100 },
        `position: static; ${CLIP}`,
      )
      const capture = box(
        { left: 0, top: 0, width: 1000, height: 1000 },
        'position: static;',
      )
      const el = document.createElement('div')
      el.style.position = 'fixed'
      capture.appendChild(el)
      outer.appendChild(capture)
      document.body.appendChild(outer)
      setComputed(capture, prop, value)

      const cache = {}
      expect(getVisibleBounds(el, cache)).toEqual(viewport())
      expect(cache.clippers).toEqual([])
    },
  )

  it.each([
    ['translate', '4px 0px'],
    ['rotate', '1deg'],
    ['scale', '1.5'],
    ['backdrop-filter', 'blur(4px)'],
    ['transform-style', 'preserve-3d'],
  ])(
    'a clipping ancestor with %s: %s clips the fixed box inside it',
    (prop, value) => {
      const card = box(
        { left: 100, top: 100, width: 200, height: 100 },
        `position: static; ${CLIP}`,
      )
      const el = document.createElement('div')
      el.style.position = 'fixed'
      card.appendChild(el)
      document.body.appendChild(card)
      setComputed(card, prop, value)

      expect(getVisibleBounds(el, {})).toEqual({
        top: 100,
        bottom: 200,
        left: 100,
        right: 300,
      })
    },
  )

  it.each([
    ['translate', '4px 0px'],
    ['rotate', '1deg'],
    ['scale', '1.5'],
    ['backdrop-filter', 'blur(4px)'],
    ['transform-style', 'preserve-3d'],
    ['will-change', 'rotate'],
  ])(
    'a static ancestor with %s: %s contains an absolute box, so it clips it',
    (prop, value) => {
      const positioned = box(
        { left: 0, top: 100, width: 600, height: 300 },
        `position: relative; ${CLIP}`,
      )
      const staticClip = box(
        { left: 200, top: 200, width: 50, height: 50 },
        `position: static; ${CLIP}`,
      )
      const el = document.createElement('div')
      el.style.position = 'absolute'
      staticClip.appendChild(el)
      positioned.appendChild(staticClip)
      document.body.appendChild(positioned)
      setComputed(staticClip, prop, value)

      const cache = {}
      expect(getVisibleBounds(el, cache)).toEqual({
        top: 200,
        bottom: 250,
        left: 200,
        right: 250,
      })
      expect(cache.clippers.map((c) => c.node)).toEqual([
        staticClip,
        positioned,
      ])
    },
  )

  // `overflow` does not apply to inline boxes, to table rows, columns and
  // their groups, or to `display: contents` (no box at all): none of them
  // clips, whatever its overflow says.
  it.each([
    'inline',
    'contents',
    'table-row',
    'table-row-group',
    'table-header-group',
    'table-footer-group',
    'table-column',
    'table-column-group',
  ])('display: %s with overflow hidden is not a clipper', (display) => {
    const odd = box(
      { left: 100, top: 100, width: 50, height: 20 },
      `display: ${display}; ${CLIP}`,
    )
    const el = document.createElement('div')
    odd.appendChild(el)
    document.body.appendChild(odd)
    expect(win.getComputedStyle(odd).display).toBe(display)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual(viewport())
    expect(cache.clippers).toEqual([])
  })

  it('a span (inline by default) with overflow hidden is not a clipper', () => {
    const span = document.createElement('span')
    span.style.cssText = CLIP
    setRect(span, { left: 100, top: 100, width: 50, height: 20 })
    setClientBox(span, { clientWidth: 0, clientHeight: 0 })
    const el = document.createElement('div')
    span.appendChild(el)
    document.body.appendChild(span)

    expect(getVisibleBounds(el, {})).toEqual(viewport())
  })

  it('display: table-row with paint containment is not a clipper either', () => {
    const row = box(
      { left: 100, top: 100, width: 50, height: 20 },
      'display: table-row; contain: paint;',
    )
    const el = document.createElement('div')
    row.appendChild(el)
    document.body.appendChild(row)

    expect(getVisibleBounds(el, {})).toEqual(viewport())
  })

  it('a clipper above a non-clipping table row still applies', () => {
    const outer = box({ left: 0, top: 100, width: 600, height: 300 }, CLIP)
    const row = box(
      { left: 200, top: 200, width: 50, height: 20 },
      `display: table-row; ${CLIP}`,
    )
    const el = document.createElement('div')
    row.appendChild(el)
    outer.appendChild(row)
    document.body.appendChild(outer)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual({
      top: 100,
      bottom: 400,
      left: 0,
      right: 600,
    })
    expect(cache.clippers.map((c) => c.node)).toEqual([outer])
  })

  it.each([
    'block',
    'inline-block',
    'inline-flex',
    'flex',
    'grid',
    'table-cell',
    'list-item',
  ])('display: %s with overflow hidden clips (control)', (display) => {
    const card = box(
      { left: 100, top: 100, width: 50, height: 20 },
      `display: ${display}; ${CLIP}`,
    )
    const el = document.createElement('div')
    card.appendChild(el)
    document.body.appendChild(card)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 100,
      bottom: 120,
      left: 100,
      right: 150,
    })
  })

  it('an absolute box escapes a static clipping ancestor below its positioned one', () => {
    const positioned = box(
      { left: 0, top: 100, width: 600, height: 300 },
      `position: relative; ${CLIP}`,
    )
    const staticClip = box(
      { left: 200, top: 200, width: 50, height: 50 },
      `position: static; ${CLIP}`,
    )
    const el = document.createElement('div')
    el.style.position = 'absolute'
    staticClip.appendChild(el)
    positioned.appendChild(staticClip)
    document.body.appendChild(positioned)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual({
      top: 100,
      bottom: 400,
      left: 0,
      right: 600,
    })
    expect(cache.clippers.map((c) => c.node)).toEqual([positioned])
  })

  it('an in-flow box is clipped by the same static ancestor (control)', () => {
    const positioned = box(
      { left: 0, top: 100, width: 600, height: 300 },
      `position: relative; ${CLIP}`,
    )
    const staticClip = box(
      { left: 200, top: 200, width: 50, height: 50 },
      `position: static; ${CLIP}`,
    )
    const el = document.createElement('div')
    staticClip.appendChild(el)
    positioned.appendChild(staticClip)
    document.body.appendChild(positioned)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 200,
      bottom: 250,
      left: 200,
      right: 250,
    })
  })

  it('a transformed static ancestor contains an absolute box, so it clips it', () => {
    const transformed = box(
      { left: 200, top: 200, width: 50, height: 50 },
      `position: static; transform: translateX(0px); ${CLIP}`,
    )
    const el = document.createElement('div')
    el.style.position = 'absolute'
    transformed.appendChild(el)
    document.body.appendChild(transformed)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 200,
      bottom: 250,
      left: 200,
      right: 250,
    })
  })

  it('a fixed box escapes clipping ancestors that are not transformed', () => {
    const card = box(
      { left: 100, top: 100, width: 200, height: 100 },
      `position: relative; ${CLIP}`,
    )
    const el = document.createElement('div')
    el.style.position = 'fixed'
    card.appendChild(el)
    document.body.appendChild(card)

    expect(getVisibleBounds(el, {})).toEqual(viewport())
  })

  it('a transformed ancestor clips a fixed box', () => {
    const card = box(
      { left: 100, top: 100, width: 200, height: 100 },
      `transform: scale(1); ${CLIP}`,
    )
    const el = document.createElement('div')
    el.style.position = 'fixed'
    card.appendChild(el)
    document.body.appendChild(card)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 100,
      bottom: 200,
      left: 100,
      right: 300,
    })
  })

  it('once a transform captures a fixed box, the clippers above it apply again', () => {
    const outer = box(
      { left: 100, top: 100, width: 200, height: 100 },
      `position: static; ${CLIP}`,
    )
    // transformed but not clipping: the containing block of the fixed box
    const capture = box(
      { left: 0, top: 0, width: 1000, height: 1000 },
      'position: static; will-change: transform;',
    )
    const el = document.createElement('div')
    el.style.position = 'fixed'
    capture.appendChild(el)
    outer.appendChild(capture)
    document.body.appendChild(outer)

    expect(getVisibleBounds(el, {})).toEqual({
      top: 100,
      bottom: 200,
      left: 100,
      right: 300,
    })
  })

  it('leaves html and body to the viewport even when they clip', () => {
    document.documentElement.style.cssText = CLIP
    document.body.style.cssText = CLIP
    setRect(document.documentElement, {
      left: 0,
      top: 0,
      width: 10,
      height: 10,
    })
    setRect(document.body, { left: 5, top: 5, width: 20, height: 20 })
    setClientBox(document.body, { clientWidth: 20, clientHeight: 20 })
    const el = document.createElement('div')
    document.body.appendChild(el)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual(viewport())
    expect(cache.clippers).toEqual([])
  })

  it('walks out of an open shadow root to its host, and on up the page', () => {
    const card = box({ left: 30, top: 40, width: 300, height: 150 }, CLIP)
    const host = document.createElement('div')
    card.appendChild(host)
    document.body.appendChild(card)

    const root = host.attachShadow({ mode: 'open' })
    const inner = document.createElement('div')
    const el = document.createElement('div')
    inner.appendChild(el)
    root.appendChild(inner)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual({
      top: 40,
      bottom: 190,
      left: 30,
      right: 330,
    })
    expect(cache.clippers.map((c) => c.node)).toEqual([card])
  })

  it('applies clippers on both sides of a shadow boundary', () => {
    const card = box({ left: 30, top: 40, width: 300, height: 150 }, CLIP)
    const host = document.createElement('div')
    card.appendChild(host)
    document.body.appendChild(card)

    const root = host.attachShadow({ mode: 'open' })
    const frame = box({ left: 100, top: 0, width: 400, height: 100 }, CLIP)
    const el = document.createElement('div')
    frame.appendChild(el)
    root.appendChild(frame)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual({
      top: 40,
      bottom: 100,
      left: 100,
      right: 330,
    })
    expect(cache.clippers.map((c) => c.node)).toEqual([frame, card])
  })

  it('walks a slotted element through its assigned slot', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = host.attachShadow({ mode: 'open' })
    // The slot sits inside a clipping frame in the shadow tree; the light-DOM
    // parent (the host) does not clip. Only the composed walk finds the frame.
    const frame = box({ left: 60, top: 70, width: 120, height: 80 }, CLIP)
    const slot = document.createElement('slot')
    frame.appendChild(slot)
    root.appendChild(frame)

    const el = document.createElement('div')
    host.appendChild(el)
    expect(el.assignedSlot).toBe(slot)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toEqual({
      top: 70,
      bottom: 150,
      left: 60,
      right: 180,
    })
    expect(cache.clippers.map((c) => c.node)).toEqual([frame])
  })

  it('looks the clippers up once per cache and re-reads only their rects', () => {
    const card = box({ left: 50, top: 100, width: 400, height: 200 }, CLIP)
    const el = document.createElement('div')
    card.appendChild(el)
    document.body.appendChild(card)

    const spy = vi.spyOn(win, 'getComputedStyle')
    const cache = { clippers: null }

    const first = getVisibleBounds(el, cache)
    const callsAfterFirst = spy.mock.calls.length
    expect(callsAfterFirst).toBeGreaterThan(0)
    expect(cache.clippers).toEqual([{ node: card, x: true, y: true }])
    const clippers = cache.clippers
    expect(first).toEqual({ top: 100, bottom: 300, left: 50, right: 450 })

    // The page scrolled: the card moved up 60px. Same cache, no style reads,
    // and the bounds follow the card.
    setRect(card, { left: 50, top: 40, width: 400, height: 200 })
    const second = getVisibleBounds(el, cache)
    expect(spy.mock.calls.length).toBe(callsAfterFirst)
    expect(cache.clippers).toBe(clippers)
    expect(second).toEqual({ top: 40, bottom: 240, left: 50, right: 450 })

    // Dropping the cache (what the tooltip does on hide) looks them up again.
    cache.clippers = null
    getVisibleBounds(el, cache)
    expect(spy.mock.calls.length).toBeGreaterThan(callsAfterFirst)
  })

  it('skips a cached clipper that has since left the document', () => {
    const card = box({ left: 50, top: 100, width: 400, height: 200 }, CLIP)
    const el = document.createElement('div')
    card.appendChild(el)
    document.body.appendChild(card)

    const cache = {}
    expect(getVisibleBounds(el, cache).top).toBe(100)

    card.remove()
    expect(card.isConnected).toBe(false)
    expect(getVisibleBounds(el, cache)).toEqual(viewport())
  })

  it('skips a detached clipper handed in through the cache', () => {
    const detached = box({ left: 50, top: 100, width: 10, height: 10 })
    const el = document.createElement('div')
    document.body.appendChild(el)

    expect(
      getVisibleBounds(el, {
        clippers: [{ node: detached, x: true, y: true }],
      }),
    ).toEqual(viewport())
  })

  it('returns null for an element whose document has no window', () => {
    const doc = document.implementation.createHTMLDocument('no window')
    expect(doc.defaultView).toBeNull()
    const el = doc.createElement('div')
    doc.body.appendChild(el)

    const cache = {}
    expect(getVisibleBounds(el, cache)).toBeNull()
    // Nothing was looked up either.
    expect(cache.clippers).toBeUndefined()
  })

  it('returns null for a missing element', () => {
    expect(getVisibleBounds(null, {})).toBeNull()
    expect(getVisibleBounds(undefined, {})).toBeNull()
  })
})

// ===========================================================================
// B. Position
// ===========================================================================

/**
 * A `w` + `ttCtx` pair for Position, in the shape tooltip-positioning.spec.js
 * uses, with the tooltip element attached to the document (inside elWrap, as
 * the library mounts it) so the visible-room walk runs for real.
 *
 * Defaults: elWrap at viewport (100, 200), a 400x100 chart; the plot starts
 * 50px in (translateX) and 20px down (translateY) and is 300x40; the tooltip
 * measures 100x50, so the plot is short (50 >= 40 x 0.78). The visible room in
 * elWrap px is then left -100, top -200, right innerWidth - 100, bottom
 * innerHeight - 200.
 */
function makeCtx({
  gridHeight = 40,
  gridWidth = 300,
  translateX = 50,
  translateY = 20,
  ttWidth = 100,
  ttHeight = 50,
  wrapRect = { left: 100, top: 200, width: 400, height: 100 },
  tooltip = {},
  chart = {},
  globals = {},
  ttCtx: ttOverrides = {},
} = {}) {
  const elWrap = document.createElement('div')
  setRect(elWrap, wrapRect)
  const tooltipEl = document.createElement('div')
  tooltipEl.className = 'apexcharts-tooltip'
  elWrap.appendChild(tooltipEl)
  document.body.appendChild(elWrap)

  const baseEl = document.createElement('div')
  const elSvg = document.createElement('div')
  elSvg.classList.add('apexcharts-svg')
  setRect(elSvg, wrapRect)
  baseEl.appendChild(elSvg)

  const w = {
    config: {
      tooltip: {
        followCursor: false,
        arrow: true,
        shared: false,
        intersect: true,
        interactive: false,
        ...tooltip,
      },
      xaxis: { offsetY: 0, tooltip: { offsetY: 0 } },
      yaxis: [{ opposite: false, tooltip: { offsetX: 0 } }],
      chart: { accessibility: { enabled: false }, ...chart },
      series: [],
    },
    globals: {
      isBarHorizontal: false,
      translateYAxisX: [80],
      tooltip: null,
      collapsedSeriesIndices: [],
      ancillaryCollapsedSeriesIndices: [],
      svgWidth: wrapRect.width,
      pointsArray: [],
      ...globals,
    },
    seriesData: { series: [] },
    layout: { gridWidth, gridHeight, translateX, translateY },
    axisFlags: { isXNumeric: false },
    dom: { baseEl, elWrap },
  }

  const elGrid = document.createElement('div')
  setRect(elGrid, {
    left: wrapRect.left + translateX,
    top: wrapRect.top + translateY,
    width: gridWidth,
    height: Math.max(gridHeight, 0),
  })

  const ttCtx = {
    w,
    ctx: { w },
    tooltipRect: { ttWidth, ttHeight },
    fixedTooltip: false,
    getElTooltip: vi.fn(() => tooltipEl),
    getElGrid: vi.fn(() => elGrid),
    ...ttOverrides,
  }
  return { w, ttCtx, elWrap, tooltipEl, elGrid, baseEl }
}

/** Put `elWrap` inside a clipping card with the given viewport rect. */
function clipTo(elWrap, rect) {
  const card = box(rect, CLIP)
  document.body.appendChild(card)
  card.appendChild(elWrap)
  return card
}

describe('Position.isShortPlot', () => {
  it('is true when the measured tooltip is at least 0.78 of the plot', () => {
    expect(new TooltipPosition(makeCtx().ttCtx).isShortPlot()).toBe(true)
  })

  it('is false on a plot tall enough for the box', () => {
    const { ttCtx } = makeCtx({ gridHeight: 300 })
    expect(new TooltipPosition(ttCtx).isShortPlot()).toBe(false)
  })

  it('is never true for a fixed tooltip', () => {
    const { ttCtx } = makeCtx({ ttCtx: { fixedTooltip: true } })
    expect(new TooltipPosition(ttCtx).isShortPlot()).toBe(false)
  })

  it('is false while the tooltip is unmeasured or has no rect at all', () => {
    expect(
      new TooltipPosition(makeCtx({ ttHeight: 0 }).ttCtx).isShortPlot(),
    ).toBe(false)
    const { ttCtx } = makeCtx()
    ttCtx.tooltipRect = undefined
    expect(new TooltipPosition(ttCtx).isShortPlot()).toBe(false)
  })

  it('is true for a plot with no height left', () => {
    const { ttCtx } = makeCtx({ gridHeight: -12 })
    expect(new TooltipPosition(ttCtx).isShortPlot()).toBe(true)
  })

  it('reads the current measurements on every call', () => {
    const { ttCtx, w } = makeCtx()
    const pos = new TooltipPosition(ttCtx)
    expect(pos.isShortPlot()).toBe(true)
    w.layout.gridHeight = 300
    expect(pos.isShortPlot()).toBe(false)
    ttCtx.tooltipRect.ttHeight = 260
    expect(pos.isShortPlot()).toBe(true)
  })
})

describe('Position.placeOnShortPlot', () => {
  // The default makeCtx: room in elWrap px is top -200, left -100. A mark at
  // elWrap-local y 25..35 (a 5px marker centred at 30).

  it('starts with shortPlotPlacement false', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    expect(pos.shortPlotPlacement).toBe(false)
    expect(pos).not.toHaveProperty('outsidePlot')
  })

  it('returns null for a fixed tooltip and clears shortPlotPlacement', () => {
    const { ttCtx } = makeCtx({ ttCtx: { fixedTooltip: true } })
    const pos = new TooltipPosition(ttCtx)
    pos.shortPlotPlacement = true

    expect(pos.placeOnShortPlot(150, 25, 35)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('returns null on a plot tall enough for the box', () => {
    const { ttCtx } = makeCtx({ gridHeight: 300 })
    const pos = new TooltipPosition(ttCtx)
    pos.shortPlotPlacement = true

    expect(pos.placeOnShortPlot(150, 25, 35)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('returns null on a tall plot even when the box has no room beside its mark inside the plot', () => {
    // A 230px box on a 300px plot (230 < 300 x 0.78, so the plot is tall)
    // fits neither above nor below a mark in the middle of the plot. The page
    // has room above the mark, but the caller keeps its own placement.
    const { ttCtx } = makeCtx({
      gridHeight: 300,
      ttHeight: 230,
      wrapRect: { left: 100, top: 400, width: 400, height: 360 },
    })
    const pos = new TooltipPosition(ttCtx)
    expect(pos.getVisibleRoom().top).toBeLessThan(140 - GAP - 230)

    expect(pos.placeOnShortPlot(150, 140, 170)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('returns null when the tooltip has not been measured', () => {
    const { ttCtx } = makeCtx({ ttHeight: 0 })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOnShortPlot(150, 25, 35)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('places the box directly above the mark, arrow tip on it, when the page has room', () => {
    const { ttCtx } = makeCtx()
    const pos = new TooltipPosition(ttCtx)

    const r = pos.placeOnShortPlot(150, 25, 35)
    expect(r).toEqual({
      x: 150 - 50,
      y: 25 - GAP - 50,
      placement: 'top',
      arrowX: 50,
      arrowY: null,
    })
    expect(pos.shortPlotPlacement).toBe(true)
    // the tip (box bottom + overhang) lands on the mark's top
    expect(r.y + 50 + ARROW_TIP_OVERHANG).toBe(25)
  })

  it('sits on the mark, not on the plot: a lower mark gets a lower box', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)

    // a mark at the bottom of the plot (20..60 in elWrap px)
    const low = pos.placeOnShortPlot(150, 52, 58)
    expect(low.placement).toBe('top')
    expect(low.y).toBe(52 - GAP - 50)

    // and one at the very top
    const high = pos.placeOnShortPlot(150, 20, 26)
    expect(high.y).toBe(20 - GAP - 50)
    expect(low.y - high.y).toBe(32)
  })

  it('may extend past the plot and the chart', () => {
    const r = new TooltipPosition(makeCtx().ttCtx).placeOnShortPlot(150, 25, 35)
    expect(r.y).toBeLessThan(0)
  })

  it('places the box directly below the mark when the page has no room above', () => {
    // elWrap 30px from the top of the viewport: room.top is -30, and the box
    // above would start at -32
    const { ttCtx } = makeCtx({
      wrapRect: { left: 100, top: 30, width: 400, height: 100 },
    })
    const pos = new TooltipPosition(ttCtx)

    const r = pos.placeOnShortPlot(150, 25, 35)
    expect(r).toEqual({
      x: 100,
      y: 35 + GAP,
      placement: 'bottom',
      arrowX: 50,
      arrowY: null,
    })
    expect(pos.shortPlotPlacement).toBe(true)
  })

  it('stays above when the box exactly reaches the top of the visible room', () => {
    const { ttCtx } = makeCtx({
      wrapRect: { left: 100, top: 32, width: 400, height: 100 },
    })
    const r = new TooltipPosition(ttCtx).placeOnShortPlot(150, 25, 35)
    expect(r.placement).toBe('top')
    expect(r.y).toBe(-32)
  })

  it('passes gapAbove and gapBelow through', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    expect(pos.placeOnShortPlot(150, 25, 35, { gapAbove: 0 }).y).toBe(25 - 50)
    expect(pos.placeOnShortPlot(150, 25, 35, { gapAbove: 12 }).y).toBe(
      25 - 12 - 50,
    )

    const atTop = new TooltipPosition(
      makeCtx({ wrapRect: { left: 100, top: 30, width: 400, height: 100 } })
        .ttCtx,
    )
    const r = atTop.placeOnShortPlot(150, 25, 35, {
      gapBelow: POINTER_CLEARANCE_BELOW,
    })
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(35 + 24)
  })

  it('defaults both gaps to the arrow overhang (the tip touches the mark)', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    expect(pos.placeOnShortPlot(150, 25, 35)).toEqual(
      pos.placeOnShortPlot(150, 25, 35, {}),
    )
    expect(pos.placeOnShortPlot(150, 25, 35).y).toBe(25 - 7 - 50)
  })

  it('returns null, and clears the flag, when a clipping card leaves no room on either side', () => {
    const { ttCtx, elWrap } = makeCtx()
    const pos = new TooltipPosition(ttCtx)
    expect(pos.placeOnShortPlot(150, 25, 35)).not.toBeNull()
    expect(pos.shortPlotPlacement).toBe(true)

    // The card clips exactly at the chart's own box: room is 0..100 in
    // elWrap px. A mark at 45..55: above -12 < 0, below 62 + 50 > 100.
    clipTo(elWrap, { left: 100, top: 200, width: 400, height: 100 })
    pos.resetPlacementCache()
    expect(pos.placeOnShortPlot(150, 45, 55)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('inside a clipping card that has room below the mark, goes below', () => {
    const { ttCtx, elWrap } = makeCtx()
    clipTo(elWrap, { left: 100, top: 200, width: 400, height: 100 })
    const r = new TooltipPosition(ttCtx).placeOnShortPlot(150, 25, 35)
    // above: -32 < 0; below: 42 + 50 = 92 <= 100
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(42)
  })

  it('clamps horizontally to the visible room, not to the chart', () => {
    // The page has 100px left of elWrap, so a box over the chart's left edge
    // may hang out of the chart.
    const pos = new TooltipPosition(makeCtx().ttCtx)

    const r = pos.placeOnShortPlot(0, 25, 35)
    expect(r.x).toBe(-50)
    expect(r.arrowX).toBe(50)

    // ...but not past the viewport: the room's left edge is elWrap-local -100.
    const far = pos.placeOnShortPlot(-90, 25, 35)
    expect(far.x).toBe(-100)
    expect(far.arrowX).toBe(10)
  })

  it('returns null without an elWrap', () => {
    const { ttCtx, w } = makeCtx()
    w.dom.elWrap = null
    const pos = new TooltipPosition(ttCtx)
    pos.shortPlotPlacement = true

    expect(pos.getVisibleRoom()).toBeNull()
    expect(pos.placeOnShortPlot(150, 25, 35)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('returns null without a tooltip element', () => {
    const { ttCtx } = makeCtx()
    ttCtx.getElTooltip = vi.fn(() => null)
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOnShortPlot(150, 25, 35)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('returns null for a non-finite mark', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    expect(pos.placeOnShortPlot(150, NaN, 35)).toBeNull()
    expect(pos.placeOnShortPlot(NaN, 25, 35)).toBeNull()
    expect(pos.placeOnShortPlot(150, 25, undefined)).toBeNull()
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('treats a plot with no height left as short', () => {
    const { ttCtx } = makeCtx({ gridHeight: -12 })
    const r = new TooltipPosition(ttCtx).placeOnShortPlot(150, 25, 35)
    expect(r.placement).toBe('top')
    expect(r.y).toBe(25 - GAP - 50)
  })
})

describe('Position.getVisibleRoom', () => {
  it('is the visible bounds in elWrap px', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)

    expect(pos.getVisibleRoom()).toEqual({
      top: -200,
      bottom: win.innerHeight - 200,
      left: -100,
      right: win.innerWidth - 100,
    })
  })

  it('returns null without a tooltip element or an elWrap', () => {
    const a = makeCtx()
    a.ttCtx.getElTooltip = () => null
    expect(new TooltipPosition(a.ttCtx).getVisibleRoom()).toBeNull()

    const b = makeCtx()
    b.w.dom.elWrap = undefined
    expect(new TooltipPosition(b.ttCtx).getVisibleRoom()).toBeNull()
  })
})

describe('Position.getVisibleRoom: the clipping-ancestor cache (1s TTL)', () => {
  // A clipping card around the chart: room in elWrap px is top -100,
  // bottom 300, left -50, right 550.
  function setup() {
    const ctx = makeCtx()
    const card = clipTo(ctx.elWrap, {
      left: 50,
      top: 100,
      width: 600,
      height: 400,
    })
    const pos = new TooltipPosition(ctx.ttCtx)
    const clock = vi.spyOn(Date, 'now').mockReturnValue(100000)
    const styles = vi.spyOn(win, 'getComputedStyle')
    return { ...ctx, card, pos, clock, styles }
  }
  const ROOM = { top: -100, bottom: 300, left: -50, right: 550 }

  it('starts empty', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    expect(pos.clipCache).toEqual({ clippers: null, at: 0 })
  })

  it('walks the ancestors on first use and stamps the time', () => {
    const { pos, card, styles } = setup()

    expect(pos.getVisibleRoom()).toEqual(ROOM)
    expect(styles).toHaveBeenCalled()
    expect(pos.clipCache.clippers).toEqual([{ node: card, x: true, y: true }])
    expect(pos.clipCache.at).toBe(100000)
  })

  it('trusts the list for 1s: no style reads and the same list, while rects are still re-read', () => {
    const { pos, card, clock, styles } = setup()
    pos.getVisibleRoom()
    const calls = styles.mock.calls.length
    const list = pos.clipCache.clippers

    // The page scrolled the card up 60px half a second later.
    clock.mockReturnValue(100500)
    setRect(card, { left: 50, top: 40, width: 600, height: 400 })
    expect(pos.getVisibleRoom()).toEqual({ ...ROOM, top: -160, bottom: 240 })
    expect(styles.mock.calls.length).toBe(calls)
    expect(pos.clipCache.clippers).toBe(list)

    // Exactly 1s after the walk: still trusted.
    clock.mockReturnValue(101000)
    pos.getVisibleRoom()
    expect(styles.mock.calls.length).toBe(calls)
    expect(pos.clipCache.clippers).toBe(list)
    expect(pos.clipCache.at).toBe(100000)
  })

  it('walks again once the list is more than 1s old', () => {
    const { pos, clock, styles } = setup()
    pos.getVisibleRoom()
    const calls = styles.mock.calls.length
    const list = pos.clipCache.clippers

    clock.mockReturnValue(101001)
    expect(pos.getVisibleRoom()).toEqual(ROOM)
    expect(styles.mock.calls.length).toBeGreaterThan(calls)
    expect(pos.clipCache.clippers).not.toBe(list)
    expect(pos.clipCache.clippers).toEqual(list)
    expect(pos.clipCache.at).toBe(101001)
  })

  it('counts the second from the walk, not from the last use', () => {
    const { pos, clock, styles } = setup()
    pos.getVisibleRoom()
    const afterWalk = styles.mock.calls.length

    clock.mockReturnValue(100900)
    pos.getVisibleRoom()
    expect(styles.mock.calls.length).toBe(afterWalk)

    // Only 900ms since the last use, but 1800ms since the walk.
    clock.mockReturnValue(101800)
    pos.getVisibleRoom()
    expect(styles.mock.calls.length).toBeGreaterThan(afterWalk)
    expect(pos.clipCache.at).toBe(101800)
  })

  it('sees a restyle of the page once the list has expired', () => {
    const { pos, card, clock } = setup()
    expect(pos.getVisibleRoom()).toEqual(ROOM)

    // The card stops clipping. Within the second the stale list still
    // applies; after it, the room is the viewport again.
    card.style.cssText = ''
    clock.mockReturnValue(100999)
    expect(pos.getVisibleRoom()).toEqual(ROOM)
    clock.mockReturnValue(101001)
    expect(pos.getVisibleRoom()).toEqual({
      top: -200,
      bottom: win.innerHeight - 200,
      left: -100,
      right: win.innerWidth - 100,
    })
  })

  it('placements across many marks inside the second walk the ancestors once', () => {
    const { pos, clock, styles } = setup()
    pos.placeOnShortPlot(150, 25, 35)
    const calls = styles.mock.calls.length
    for (let t = 1; t <= 10; t++) {
      clock.mockReturnValue(100000 + t * 90)
      pos.placeOnShortPlot(150 + t, 25, 35)
      pos.placeOverAnchor(150 + t, 30, 100, 50, 10)
    }
    expect(styles.mock.calls.length).toBe(calls)
  })

  it('resetPlacementCache forces a walk inside the second', () => {
    const { pos, clock, styles } = setup()
    pos.getVisibleRoom()
    const calls = styles.mock.calls.length

    clock.mockReturnValue(100200)
    pos.resetPlacementCache()
    expect(pos.clipCache.clippers).toBeNull()
    pos.getVisibleRoom()
    expect(styles.mock.calls.length).toBeGreaterThan(calls)
    expect(pos.clipCache.at).toBe(100200)
  })
})

describe('Position.columnExtent', () => {
  /** A bare Position over a hand-made `w`; gridHeight 40. */
  function colPos({
    pointsArray,
    type = 'line',
    collapsed = [],
    ancillary = [],
    comboCharts = false,
    series = [],
    gridHeight = 40,
  } = {}) {
    const w = {
      config: { chart: { type } },
      globals: {
        pointsArray,
        collapsedSeriesIndices: collapsed,
        ancillaryCollapsedSeriesIndices: ancillary,
        comboCharts,
      },
      seriesData: { series },
      layout: { gridHeight },
    }
    return new TooltipPosition({ w })
  }

  // three series, two points each: y at j=0 is 30, 5, 20; at j=1 12, 25, 8
  const THREE = [
    [
      [0, 30],
      [10, 12],
    ],
    [
      [0, 5],
      [10, 25],
    ],
    [
      [0, 20],
      [10, 8],
    ],
  ]

  it('spans every series point at j, padded by pad', () => {
    const pos = colPos({ pointsArray: THREE })
    expect(pos.columnExtent(1, 3)).toEqual({ top: 8 - 3, bottom: 25 + 3 })
    expect(pos.columnExtent(0, 3)).toEqual({ top: 5 - 3, bottom: 30 + 3 })
  })

  it('pads by exactly pad (0 is the bare points)', () => {
    const pos = colPos({ pointsArray: THREE })
    expect(pos.columnExtent(1, 0)).toEqual({ top: 8, bottom: 25 })
    expect(pos.columnExtent(1, 6)).toEqual({ top: 2, bottom: 31 })
  })

  it('is the point itself, padded, for a single series', () => {
    const pos = colPos({ pointsArray: [THREE[0]] })
    expect(pos.columnExtent(0, 4)).toEqual({ top: 26, bottom: 34 })
  })

  it('skips a legend-collapsed series', () => {
    const pos = colPos({ pointsArray: THREE, collapsed: [2] })
    // series 2 (y 8) is out: the top is series 0's 12
    expect(pos.columnExtent(1, 3)).toEqual({ top: 9, bottom: 28 })
  })

  it('skips an ancillary-collapsed series', () => {
    const pos = colPos({ pointsArray: THREE, ancillary: [1] })
    // series 1 (y 25) is out: the bottom is series 0's 12
    expect(pos.columnExtent(1, 3)).toEqual({ top: 5, bottom: 15 })
  })

  it('does not trip over missing collapsed-index lists', () => {
    const pos = colPos({ pointsArray: THREE })
    pos.w.globals.collapsedSeriesIndices = undefined
    pos.w.globals.ancillaryCollapsedSeriesIndices = undefined
    expect(pos.columnExtent(1, 0)).toEqual({ top: 8, bottom: 25 })
  })

  it('covers both ends of a rangeArea point', () => {
    // pointsArray[p] holds one end for j in 0..n-1 and the other at j + n
    const pos = colPos({
      type: 'rangeArea',
      series: [[1, 2]],
      pointsArray: [
        [
          [0, 10],
          [10, 12],
          [0, 30],
          [10, 35],
        ],
      ],
    })
    expect(pos.columnExtent(1, 2)).toEqual({ top: 10, bottom: 37 })
    expect(pos.columnExtent(0, 0)).toEqual({ top: 10, bottom: 30 })
  })

  it('reads one end only for a rangeArea series in a combo chart', () => {
    const pos = colPos({
      type: 'rangeArea',
      comboCharts: true,
      series: [[1, 2]],
      pointsArray: [
        [
          [0, 10],
          [10, 12],
          [0, 30],
          [10, 35],
        ],
      ],
    })
    expect(pos.columnExtent(1, 2)).toEqual({ top: 10, bottom: 14 })
  })

  it('reads one end only for a chart that is not a rangeArea', () => {
    const pos = colPos({
      type: 'area',
      series: [[1, 2]],
      pointsArray: [
        [
          [0, 10],
          [10, 12],
          [0, 30],
          [10, 35],
        ],
      ],
    })
    expect(pos.columnExtent(1, 0)).toEqual({ top: 12, bottom: 12 })
  })

  it('ignores non-finite values and missing points', () => {
    const pos = colPos({
      pointsArray: [
        [[0, null]],
        [[0, NaN]],
        [[0, undefined]],
        [[0, Infinity]],
        [[0, '15']],
        undefined,
        [],
        [[0, 20]],
      ],
    })
    expect(pos.columnExtent(0, 1)).toEqual({ top: 19, bottom: 21 })
  })

  it('ignores a value far outside the grid, and keeps one within pad of it', () => {
    const at = (y) =>
      colPos({ pointsArray: [[[0, 20]], [[0, y]]] }).columnExtent(0, 3)

    expect(at(-3)).toEqual({ top: -6, bottom: 23 })
    expect(at(-3.5)).toEqual({ top: 17, bottom: 23 })
    expect(at(43)).toEqual({ top: 17, bottom: 46 })
    expect(at(43.5)).toEqual({ top: 17, bottom: 23 })
    expect(at(-5000)).toEqual({ top: 17, bottom: 23 })
  })

  it('is null when nothing is there to span', () => {
    expect(colPos({ pointsArray: [] }).columnExtent(0, 3)).toBeNull()
    expect(colPos({ pointsArray: undefined }).columnExtent(0, 3)).toBeNull()
    expect(colPos({ pointsArray: THREE }).columnExtent(7, 3)).toBeNull()
    expect(
      colPos({ pointsArray: THREE, collapsed: [0, 1, 2] }).columnExtent(0, 3),
    ).toBeNull()
    expect(
      colPos({ pointsArray: [[[0, 900]], [[0, NaN]]] }).columnExtent(0, 3),
    ).toBeNull()
  })
})

describe('Position._barsExtentInGrid', () => {
  // Plot top on screen: elWrap top (300) + translateY (20) = 320.
  const roomy = { left: 0, top: 300, width: 400, height: 100 }

  function addMark(baseEl, seriesClass, j, rect, { collapsed = false } = {}) {
    let group = baseEl.querySelector(`.${seriesClass}`)
    if (!group) {
      group = document.createElementNS(SVG_NS, 'g')
      group.setAttribute('class', seriesClass)
      baseEl.appendChild(group)
    }
    const series = document.createElementNS(SVG_NS, 'g')
    series.setAttribute(
      'class',
      'apexcharts-series' + (collapsed ? ' apexcharts-series-collapsed' : ''),
    )
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('j', String(j))
    setRect(path, rect)
    series.appendChild(path)
    group.appendChild(series)
    return path
  }

  it('is the union of the painted bars at j, in grid px', () => {
    const { ttCtx, baseEl } = makeCtx({ wrapRect: roomy })
    addMark(baseEl, 'apexcharts-bar-series', 1, {
      left: 100,
      top: 330,
      width: 10,
      height: 30,
    })
    addMark(baseEl, 'apexcharts-bar-series', 1, {
      left: 112,
      top: 345,
      width: 10,
      height: 15,
    })
    // another index: ignored
    addMark(baseEl, 'apexcharts-bar-series', 2, {
      left: 200,
      top: 321,
      width: 10,
      height: 39,
    })

    expect(new TooltipPosition(ttCtx)._barsExtentInGrid(1)).toEqual({
      top: 10,
      bottom: 40,
    })
  })

  it.each([
    'apexcharts-rangebar-series',
    'apexcharts-candlestick-series',
    'apexcharts-boxPlot-series',
    'apexcharts-violin-series',
  ])('counts %s marks', (cls) => {
    const { ttCtx, baseEl } = makeCtx({ wrapRect: roomy })
    addMark(baseEl, cls, 0, { left: 100, top: 335, width: 10, height: 10 })
    expect(new TooltipPosition(ttCtx)._barsExtentInGrid(0)).toEqual({
      top: 15,
      bottom: 25,
    })
  })

  it('skips a collapsed series and a bar with no painted size', () => {
    const { ttCtx, baseEl } = makeCtx({ wrapRect: roomy })
    addMark(baseEl, 'apexcharts-bar-series', 0, {
      left: 100,
      top: 335,
      width: 10,
      height: 10,
    })
    addMark(
      baseEl,
      'apexcharts-bar-series',
      0,
      { left: 112, top: 321, width: 10, height: 39 },
      { collapsed: true },
    )
    addMark(baseEl, 'apexcharts-bar-series', 0, {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    })
    expect(new TooltipPosition(ttCtx)._barsExtentInGrid(0)).toEqual({
      top: 15,
      bottom: 25,
    })
  })

  it('is null with no bars at j, or only skipped ones (canvas bars leave none)', () => {
    const { ttCtx, baseEl } = makeCtx({ wrapRect: roomy })
    const pos = new TooltipPosition(ttCtx)
    expect(pos._barsExtentInGrid(0)).toBeNull()

    addMark(
      baseEl,
      'apexcharts-bar-series',
      0,
      { left: 112, top: 321, width: 10, height: 39 },
      { collapsed: true },
    )
    expect(pos._barsExtentInGrid(0)).toBeNull()
  })
})

describe('Position.placeOverAnchor', () => {
  // Default makeCtx room in elWrap px: left -100, top -200,
  // right innerWidth - 100, bottom innerHeight - 200.

  it('sits centred above the anchor when the page has room', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)

    expect(pos.placeOverAnchor(150, 30, 100, 50, 10)).toEqual({
      x: 150 - 50,
      y: 30 - 10 - 50,
    })
  })

  it('stays above when the box exactly reaches the top of the room', () => {
    // room.top is -30 in elWrap px; above is 30 - 10 - 50 = -30
    const { ttCtx } = makeCtx({
      wrapRect: { left: 100, top: 30, width: 400, height: 100 },
    })
    expect(
      new TooltipPosition(ttCtx).placeOverAnchor(150, 30, 100, 50, 10, 24).y,
    ).toBe(-30)
  })

  it('flips below the anchor, by gapBelow, when there is no room above', () => {
    // room.top is -10 in elWrap px; above would be -30
    const { ttCtx } = makeCtx({
      wrapRect: { left: 100, top: 10, width: 400, height: 100 },
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOverAnchor(150, 30, 100, 50, 10, 24)).toEqual({
      x: 100,
      y: 30 + 24,
    })
  })

  it('uses gapAbove below the anchor when no gapBelow is given', () => {
    const { ttCtx } = makeCtx({
      wrapRect: { left: 100, top: 10, width: 400, height: 100 },
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOverAnchor(150, 30, 100, 50, 10).y).toBe(30 + 10)
  })

  it('stays above, still clamped sideways, when neither side has room', () => {
    const { ttCtx, elWrap } = makeCtx({
      wrapRect: { left: 100, top: 10, width: 400, height: 100 },
    })
    clipTo(elWrap, { left: 100, top: 10, width: 400, height: 100 })
    const pos = new TooltipPosition(ttCtx)

    // room is the chart's own box (0..100 high, 0..400 wide): above -60 < 0;
    // below 40 + 80 > 100
    expect(pos.placeOverAnchor(150, 30, 100, 80, 10)).toEqual({
      x: 100,
      y: 30 - 10 - 80,
    })
    expect(pos.placeOverAnchor(390, 30, 100, 80, 10)).toEqual({
      x: 300,
      y: 30 - 10 - 80,
    })
    expect(pos.placeOverAnchor(5, 30, 100, 80, 10).x).toBe(0)
  })

  it('does not touch shortPlotPlacement', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    pos.placeOverAnchor(150, 30, 100, 50, 10)
    expect(pos.shortPlotPlacement).toBe(false)
    pos.shortPlotPlacement = true
    pos.placeOverAnchor(150, 30, 100, 50, 10)
    expect(pos.shortPlotPlacement).toBe(true)
  })

  it('works on a tall plot too (pies, radials)', () => {
    const { ttCtx } = makeCtx({
      gridHeight: 300,
      wrapRect: { left: 100, top: 10, width: 400, height: 400 },
    })
    const pos = new TooltipPosition(ttCtx)
    expect(pos.isShortPlot()).toBe(false)
    expect(pos.placeOverAnchor(150, 30, 100, 50, 10, 24)).toEqual({
      x: 100,
      y: 54,
    })
  })

  it('does not measure the page for an unmeasured box: above, and not clamped sideways', () => {
    const { ttCtx } = makeCtx({
      wrapRect: { left: 100, top: 10, width: 400, height: 100 },
    })
    const pos = new TooltipPosition(ttCtx)
    const spy = vi.spyOn(pos, 'getVisibleRoom')

    // -500 - 50 is far left of the room's -100, and stays there
    expect(pos.placeOverAnchor(-500, 30, 100, 0, 10, 24)).toEqual({
      x: -550,
      y: 20,
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it('stays above and is not clamped without an elWrap to measure against', () => {
    const { ttCtx, w } = makeCtx({
      wrapRect: { left: 100, top: 10, width: 400, height: 100 },
    })
    w.dom.elWrap = null
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOverAnchor(-500, 30, 100, 50, 10, 24)).toEqual({
      x: -550,
      y: -30,
    })
  })

  it('is not clamped without a tooltip element (no room is known)', () => {
    const { ttCtx } = makeCtx()
    ttCtx.getElTooltip = vi.fn(() => null)
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOverAnchor(5000, 30, 100, 50, 10)).toEqual({
      x: 4950,
      y: -30,
    })
  })

  it('leaves a box that fits the room where centring put it', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)

    // The chart's left edge: the box hangs 50px out of the chart, which the
    // page (100px of room left of elWrap) allows.
    expect(pos.placeOverAnchor(0, 300, 100, 50, 10).x).toBe(-50)
  })

  it('holds the box inside the left edge of the visible room', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)

    // -90 - 50 = -140, past the room's left edge at -100
    expect(pos.placeOverAnchor(-90, 300, 100, 50, 10).x).toBe(-100)
  })

  it('keeps a pie sparkline at the left edge of the viewport on screen', () => {
    // A 40px pie flush with the viewport's left edge: its slice anchor is
    // 20px in, and its 120px tooltip would start 40px off screen.
    const { ttCtx } = makeCtx({
      wrapRect: { left: 0, top: 300, width: 40, height: 40 },
      ttWidth: 120,
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOverAnchor(20, 20, 120, 50, 10)).toEqual({
      x: 0,
      y: 20 - 10 - 50,
    })
  })

  it('holds the box inside the right edge of the visible room', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    const right = win.innerWidth - 100

    expect(pos.placeOverAnchor(right - 10, 300, 100, 50, 10).x).toBe(
      right - 100,
    )
  })

  it('clamps to the sides of a clipping card', () => {
    const { ttCtx, elWrap } = makeCtx()
    clipTo(elWrap, { left: 100, top: 0, width: 400, height: 700 })
    const pos = new TooltipPosition(ttCtx)

    // room is elWrap-local 0..400 sideways
    expect(pos.placeOverAnchor(390, 300, 100, 50, 10).x).toBe(300)
    expect(pos.placeOverAnchor(10, 300, 100, 50, 10).x).toBe(0)
  })

  it('lets the left edge win when the box is wider than the room', () => {
    // An 80px-wide clipping card around the chart: room is elWrap-local 0..80
    // sideways, and the box is 120 wide. The right clamp gives 80 - 120 = -40;
    // the left clamp then puts it back at 0.
    const { ttCtx, elWrap } = makeCtx()
    clipTo(elWrap, { left: 100, top: 0, width: 80, height: 700 })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOverAnchor(40, 300, 120, 50, 10)).toEqual({
      x: 0,
      y: 300 - 10 - 50,
    })
  })

  it('decides the two axes independently: flipped below and clamped sideways at once', () => {
    const { ttCtx } = makeCtx({
      wrapRect: { left: 0, top: 10, width: 400, height: 100 },
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeOverAnchor(10, 30, 100, 50, 10, 24)).toEqual({
      x: 0,
      y: 30 + 24,
    })
  })
})

describe('one Position per tooltip', () => {
  it('the Marker reuses the tooltip context Position, so shortPlotPlacement and the clip cache are shared', () => {
    const pos = new TooltipPosition({ w: {} })
    const marker = new Marker({ w: {}, ctx: {}, tooltipPosition: pos })

    expect(marker.tooltipPosition).toBe(pos)
    pos.shortPlotPlacement = true
    expect(marker.tooltipPosition.shortPlotPlacement).toBe(true)
    expect(marker.tooltipPosition.clipCache).toBe(pos.clipCache)
  })

  it('the Marker makes its own Position only when the context has none', () => {
    const marker = new Marker({ w: {}, ctx: {} })
    expect(marker.tooltipPosition).toBeInstanceOf(TooltipPosition)
  })

  it('Tooltip.handleMouseOut drops the clip cache', () => {
    const pos = new TooltipPosition({ w: {} })
    pos.clipCache.clippers = [{ node: document.body, x: true, y: true }]
    const tooltipEl = document.createElement('div')
    tooltipEl.classList.add('apexcharts-active')
    const self = {
      w: {
        dom: { baseEl: document.createElement('div') },
        config: {
          chart: { type: 'bubble', accessibility: { enabled: false } },
          legend: {},
        },
      },
      tooltipPosition: pos,
      getElXCrosshairs: () => null,
      ycrosshairs: null,
      deactivateHoverFilter: vi.fn(),
      isXAxisTooltipEnabled: false,
      yaxisTooltips: [],
    }

    Tooltip.prototype.handleMouseOut.call(self, { tooltipEl })
    expect(pos.clipCache.clippers).toBeNull()
    expect(tooltipEl.classList.contains('apexcharts-active')).toBe(false)
  })

  it('KeyboardNavigation._hideFocus drops the clip cache', () => {
    const pos = new TooltipPosition({ w: {} })
    const stale = [{ node: document.body, x: true, y: true }]
    pos.clipCache.clippers = stale
    const baseEl = document.createElement('div')
    const self = {
      w: {
        globals: {
          tooltip: {
            tooltipPosition: pos,
            getElTooltip: () => null,
            getElXCrosshairs: () => null,
          },
        },
        config: { chart: { accessibility: { enabled: false } } },
        dom: { baseEl },
      },
      _removeFocusClass: vi.fn(),
      _leaveHoveredBar: vi.fn(),
    }

    KeyboardNavigation.prototype._hideFocus.call(self)
    expect(pos.clipCache.clippers).toBeNull()
  })
})

describe('Marker: the mark of a single point', () => {
  const extent = (type, point, cy, size) =>
    Marker.prototype.markExtent.call(
      { w: { config: { chart: { type } } } },
      point,
      cy,
      size,
    )

  function marker(attrs = { cx: '40', cy: '20' }) {
    const p = document.createElementNS(SVG_NS, 'path')
    for (const [k, v] of Object.entries(attrs)) p.setAttribute(k, v)
    return p
  }

  it('markExtent is the applied hover size around the centre', () => {
    expect(extent('line', marker(), '20', 6)).toEqual({ top: 14, bottom: 26 })
    expect(extent('scatter', marker(), '20', 6)).toEqual({
      top: 14,
      bottom: 26,
    })
    expect(extent('line', marker(), 20, 0)).toEqual({ top: 20, bottom: 20 })
  })

  it('markExtent reads a missing size as 0 and a missing centre as no mark', () => {
    expect(extent('line', marker(), '20', undefined)).toEqual({
      top: 20,
      bottom: 20,
    })
    expect(extent('line', marker(), '20', NaN)).toEqual({ top: 20, bottom: 20 })
    expect(extent('line', marker(), null, 6)).toBeNull()
    expect(extent('line', marker(), 'abc', 6)).toBeNull()
  })

  it('markExtent measures a bubble (its radius is its own)', () => {
    const p = marker()
    p.getBBox = () => ({ x: 28, y: 8, width: 24, height: 24 })
    expect(extent('bubble', p, '20', undefined)).toEqual({
      top: 8,
      bottom: 32,
    })
  })

  it('markExtent falls back to size around the centre for a bubble with no box', () => {
    const p = marker()
    p.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 })
    expect(extent('bubble', p, '20', 5)).toEqual({ top: 15, bottom: 25 })
    // no getBBox at all (tests/unit/setup.js polyfills one, so drop it here)
    const bare = marker()
    bare.getBBox = undefined
    expect(extent('bubble', bare, '20', 5)).toEqual({
      top: 15,
      bottom: 25,
    })
  })

  it('markExtent leaves radar to the pointer', () => {
    expect(extent('radar', marker(), '20', 6)).toBeNull()
  })

  function enlargeSelf({ type = 'line', short = true, gridBoxDrop = 0 } = {}) {
    // `gridBoxDrop` moves the grid group's box that far below the plot top,
    // as a browser lays it out.
    const elGrid = document.createElement('div')
    setRect(elGrid, {
      left: 10,
      top: 100 + gridBoxDrop,
      width: 300,
      height: 40,
    })
    // The plot: (10, 100), 300 x 40.
    const elWrap = document.createElement('div')
    setRect(elWrap, { left: 0, top: 0, width: 400, height: 200 })
    const tooltipPosition = {
      isShortPlot: vi.fn(() => short),
      moveXCrosshairs: vi.fn(),
      moveTooltip: vi.fn(),
    }
    return {
      w: {
        config: { chart: { type }, markers: { hover: { size: 9 } } },
        globals: {},
        layout: {
          translateX: 10,
          translateY: 100,
          gridWidth: 300,
          gridHeight: 40,
        },
        dom: { elWrap },
      },
      tooltipPosition,
      markExtent: Marker.prototype.markExtent,
      newPointSize: vi.fn(() => 6),
      fixedTooltip: false,
      ttCtx: {
        getElGrid: () => elGrid,
        e: { clientX: 60, clientY: 130 },
      },
    }
  }

  it('enlargeCurrentPoint hands the marker to moveTooltip on a short plot', () => {
    const self = enlargeSelf()
    Marker.prototype.enlargeCurrentPoint.call(self, 0, marker())
    expect(self.tooltipPosition.moveTooltip).toHaveBeenCalledWith(
      '40',
      '20',
      6,
      { top: 14, bottom: 26 },
    )
  })

  it('enlargeCurrentPoint keeps the marker as the mark when the caller swaps cy for a box y', () => {
    const self = enlargeSelf()
    Marker.prototype.enlargeCurrentPoint.call(self, 0, marker(), 40, -80)
    expect(self.tooltipPosition.moveTooltip).toHaveBeenCalledWith(40, -80, 6, {
      top: 14,
      bottom: 26,
    })
  })

  it('enlargeCurrentPoint passes no mark on a tall plot', () => {
    const self = enlargeSelf({ short: false })
    Marker.prototype.enlargeCurrentPoint.call(self, 0, marker())
    expect(self.tooltipPosition.moveTooltip).toHaveBeenCalledWith(
      '40',
      '20',
      6,
      null,
    )
  })

  it('enlargeCurrentPoint on a radar uses the pointer as the mark', () => {
    const self = enlargeSelf({ type: 'radar' })
    Marker.prototype.enlargeCurrentPoint.call(self, 0, marker())
    // pointer (60, 130) on a grid at (10, 100)
    expect(self.tooltipPosition.moveTooltip).toHaveBeenCalledWith(50, '20', 6, {
      top: 30,
      bottom: 30,
    })
  })

  it('enlargeCurrentPoint on a radar measures the pointer from the plot, not the grid group box', () => {
    const self = enlargeSelf({ type: 'radar', gridBoxDrop: 1 })
    Marker.prototype.enlargeCurrentPoint.call(self, 0, marker())
    expect(self.tooltipPosition.moveTooltip).toHaveBeenCalledWith(50, '20', 6, {
      top: 30,
      bottom: 30,
    })
  })

  it('enlargeCurrentPoint on a bubble measures the bubble and keeps the configured hover size', () => {
    const self = enlargeSelf({ type: 'bubble' })
    const p = marker()
    p.getBBox = () => ({ x: 28, y: 8, width: 24, height: 24 })
    Marker.prototype.enlargeCurrentPoint.call(self, 0, p)
    expect(self.newPointSize).not.toHaveBeenCalled()
    expect(self.tooltipPosition.moveTooltip).toHaveBeenCalledWith(
      '40',
      '20',
      9,
      { top: 8, bottom: 32 },
    )
  })

  it('enlargePoints (shared, markers on) hands the whole column to moveTooltip', () => {
    // With SVG markers drawn, `pointsArray` is never filled, so the column's
    // extent has to come from the enlarged markers themselves.
    const baseEl = document.createElement('div')
    const series = document.createElementNS(SVG_NS, 'g')
    series.setAttribute('class', 'apexcharts-series')
    for (const cy of ['20', '6']) {
      const p = document.createElementNS(SVG_NS, 'path')
      p.setAttribute('class', 'apexcharts-marker')
      p.setAttribute('rel', '2')
      p.setAttribute('index', '0')
      p.setAttribute('cx', '40')
      p.setAttribute('cy', cy)
      series.appendChild(p)
    }
    baseEl.appendChild(series)
    const tooltipPosition = {
      isShortPlot: () => true,
      columnExtent: vi.fn(() => null),
      _barsExtentInGrid: vi.fn(() => ({ top: -4, bottom: 30 })),
      moveXCrosshairs: vi.fn(),
      moveTooltip: vi.fn(),
    }
    const self = {
      w: {
        dom: { baseEl },
        config: { markers: { hover: { size: 5 } } },
        globals: { markers: { size: [4] }, comboCharts: false },
      },
      ttCtx: { fixedTooltip: false, tooltipUtil: { hasBars: () => true } },
      tooltipPosition,
      resetEnlargedPoints: vi.fn(),
      newPointSize: vi.fn(),
      columnMark: Marker.prototype.columnMark,
    }

    Marker.prototype.enlargePoints.call(self, 2)
    // the last marker's centre still drives cx/cy; the mark is the column:
    // highest centre 6 and lowest 20, padded by the hover size 5
    expect(tooltipPosition.moveTooltip).toHaveBeenCalledWith(40, 6, 5, {
      top: 1,
      bottom: 25,
    })
    expect(tooltipPosition.columnExtent).not.toHaveBeenCalled()
    // not a combo chart: the bars are not consulted
    expect(tooltipPosition._barsExtentInGrid).not.toHaveBeenCalled()

    // a combo chart joins the bars at the same index into the mark
    self.w.globals.comboCharts = true
    Marker.prototype.enlargePoints.call(self, 2)
    expect(tooltipPosition._barsExtentInGrid).toHaveBeenCalledWith(2)
    expect(tooltipPosition.moveTooltip).toHaveBeenLastCalledWith(40, 6, 5, {
      top: -4,
      bottom: 30,
    })

    // a tall plot measures nothing
    tooltipPosition.isShortPlot = () => false
    tooltipPosition._barsExtentInGrid.mockClear()
    Marker.prototype.enlargePoints.call(self, 2)
    expect(tooltipPosition._barsExtentInGrid).not.toHaveBeenCalled()
    expect(tooltipPosition.moveTooltip).toHaveBeenLastCalledWith(40, 6, 5, null)
  })
})

describe('Position: the marks the dynamic-point and sticky-bar paths measure', () => {
  const roomy = { left: 0, top: 300, width: 400, height: 100 }

  function hoverCtx(opts = {}) {
    const ctx = makeCtx({ wrapRect: roomy, ...opts })
    ctx.tooltipEl.dataset.positioned = 'true'
    ctx.ttCtx.tooltipUtil = {
      getHoverMarkerSize: () => 4,
      getAllMarkers: () => [],
    }
    const pos = new TooltipPosition(ctx.ttCtx)
    vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
    return { ...ctx, pos, move: vi.spyOn(pos, 'moveTooltip') }
  }

  it('moveDynamicPointOnHover: the drawn dot, 1.5 x the hover size around the point', () => {
    const { pos, move, w, tooltipEl } = hoverCtx()
    w.globals.pointsArray = [[[30, 12]]]
    w.config.series = [{ data: [1] }]

    pos.moveDynamicPointOnHover(0, 0)
    expect(move).toHaveBeenCalledWith(30, 12, 4, { top: 6, bottom: 18 })
    // the dot's top is grid 6, elWrap 26
    expect(tooltipEl.style.top).toBe(26 - GAP - 50 + 'px')
    expect(tooltipEl.style.left).toBe(30 + 50 - 50 + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(pos.shortPlotPlacement).toBe(true)
  })

  it('moveDynamicPointsOnHover (shared): the column extent on a short plot', () => {
    const { pos, move, w, tooltipEl } = hoverCtx()
    w.globals.pointsArray = [[[30, 12]], [[30, 4]], [[30, 33]]]
    w.seriesData.series = [[1], [1], [1]]
    w.config.series = [{ data: [1] }, { data: [1] }, { data: [1] }]

    pos.moveDynamicPointsOnHover(0)
    expect(move).toHaveBeenCalledWith(30, 12, 4, { top: 0, bottom: 37 })
    // above the TOPMOST point (grid 4 - 4 = 0, elWrap 20), not series 0's
    expect(tooltipEl.style.top).toBe(20 - GAP - 50 + 'px')
  })

  it('moveDynamicPointsOnHover (shared): no mark on a tall plot', () => {
    const { pos, move, w } = hoverCtx({ gridHeight: 300 })
    w.globals.pointsArray = [[[30, 12]], [[30, 4]]]
    w.seriesData.series = [[1], [1]]
    w.config.series = [{ data: [1] }, { data: [1] }]
    const extent = vi.spyOn(pos, 'columnExtent')

    pos.moveDynamicPointsOnHover(0)
    expect(extent).not.toHaveBeenCalled()
    expect(move).toHaveBeenCalledWith(30, 12, 4, null)
  })

  function barsCtx(opts) {
    const ctx = hoverCtx(opts)
    const { w, ttCtx, baseEl } = ctx
    w.seriesData.series = [
      [1, 2],
      [1, 2],
    ]
    w.config.chart.stacked = false
    ttCtx.xAxisTicksPositions = [0, 100, 200]
    ttCtx.dataPointsDividedWidth = 100
    const group = document.createElementNS(SVG_NS, 'g')
    group.setAttribute('class', 'apexcharts-bar-series')
    baseEl.appendChild(group)
    const addBar = (rel, rect) => {
      const s = document.createElementNS(SVG_NS, 'g')
      s.setAttribute('class', 'apexcharts-series')
      s.setAttribute('rel', String(rel))
      const p = document.createElementNS(SVG_NS, 'path')
      p.setAttribute('j', '1')
      p.setAttribute('cx', '150')
      p.setAttribute('cy', '10')
      p.setAttribute('barWidth', '10')
      setRect(p, rect)
      s.appendChild(p)
      group.appendChild(s)
    }
    return { ...ctx, addBar }
  }

  it('moveStickyTooltipOverBars (shared columns): the bars at j on a short plot', () => {
    const { pos, move, addBar, tooltipEl } = barsCtx()
    // plot top on screen is 320: grid 10..40 and 25..40
    addBar(1, { left: 140, top: 330, width: 10, height: 30 })
    addBar(2, { left: 152, top: 345, width: 10, height: 15 })

    pos.moveStickyTooltipOverBars(1, 0)
    // cx from the category ticks (0 + 100 / 2); cy is clamped to the plot
    // bottom, so the mark is what says where the bars are
    expect(move).toHaveBeenCalledWith(50, 40, null, { top: 10, bottom: 40 })
    expect(tooltipEl.style.top).toBe(10 + 20 - GAP - 50 + 'px')
  })

  it('moveStickyTooltipOverBars: canvas bars with nothing to measure stand in the whole plot', () => {
    const { pos, move, w } = barsCtx()
    w.globals.barCanvasCoords = { 0: { 1: { cx: 120, cy: 15, barWidth: 20 } } }

    pos.moveStickyTooltipOverBars(1, 0)
    // across from the category ticks (0 + 100 / 2), as an SVG bar is
    expect(move).toHaveBeenCalledWith(50, 40, null, { top: 0, bottom: 40 })
  })

  it('moveStickyTooltipOverBars: canvas bars on a short plot, by their painted extent', () => {
    const { pos, move, w } = barsCtx()
    // painted at grid 12..40 and 25..40, measured from the plot corner
    w.globals.barCanvasCoords = {
      0: {
        1: {
          cx: 120,
          cy: 15,
          barWidth: 20,
          type: 'bar',
          bounds: { left: 40, top: 12, right: 60, bottom: 40 },
        },
      },
      1: {
        1: {
          cx: 140,
          cy: 25,
          barWidth: 20,
          type: 'bar',
          bounds: { left: 62, top: 25, right: 82, bottom: 40 },
        },
      },
    }

    pos.moveStickyTooltipOverBars(1, 0)
    expect(move).toHaveBeenCalledWith(50, 40, null, { top: 12, bottom: 40 })
  })

  it('moveStickyTooltipOverBars: no mark on a tall plot', () => {
    const { pos, move, addBar } = barsCtx({ gridHeight: 300 })
    addBar(1, { left: 140, top: 330, width: 10, height: 30 })
    const extent = vi.spyOn(pos, '_barsExtentInGrid')

    pos.moveStickyTooltipOverBars(1, 0)
    expect(extent).not.toHaveBeenCalled()
    expect(move.mock.calls[0][3]).toBeNull()
  })
})

// ===========================================================================
// C. Position.computeTooltipPosition
// ===========================================================================

describe('Position.computeTooltipPosition on a short plot', () => {
  // cx=50, cy=10, marker 5: the point is elWrap-local (100, 30), inside the
  // 20..60 plot band; its marker spans 25..35.
  const roomy = { left: 0, top: 300, width: 400, height: 100 }
  const atTop = { left: 0, top: 0, width: 400, height: 100 }
  const aboveY = (cy, size = 5) => cy + 20 - size - GAP - 50
  const belowY = (cy, size = 5) => cy + 20 + size + GAP

  it('goes directly above the hovered point, arrow tip on its marker, when the page has room', () => {
    const { ttCtx } = makeCtx({ wrapRect: roomy })
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 10, 5)
    expect(r).toEqual({
      x: 50,
      y: 25 - GAP - 50,
      placement: 'top',
      arrowX: 50,
      arrowY: null,
    })
    expect(r.y).toBe(aboveY(10))
    expect(r.y + 50 + ARROW_TIP_OVERHANG).toBe(25)
    expect(pos.shortPlotPlacement).toBe(true)
  })

  it('goes directly below the point when the chart is at the top of the viewport', () => {
    const { ttCtx } = makeCtx({ wrapRect: atTop })
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 10, 5)
    expect(r).toEqual({
      x: 50,
      y: 35 + GAP,
      placement: 'bottom',
      arrowX: 50,
      arrowY: null,
    })
    expect(r.y - ARROW_TIP_OVERHANG).toBe(35)
  })

  it('without a mark, the marker at cy +/- markerSize is the mark', () => {
    const { ttCtx } = makeCtx({ wrapRect: roomy })
    const pos = new TooltipPosition(ttCtx)
    const spy = vi.spyOn(pos, 'placeOnShortPlot')

    pos.computeTooltipPosition(50, 10, 5)
    // anchor: grid-local 50 + translateX 50; mark: 30 -/+ 5
    expect(spy).toHaveBeenCalledWith(100, 25, 35, {
      gapAbove: GAP,
      gapBelow: GAP,
    })

    pos.computeTooltipPosition(50, 10, '8')
    expect(spy).toHaveBeenLastCalledWith(100, 22, 38, {
      gapAbove: GAP,
      gapBelow: GAP,
    })
  })

  it('follows the point: the box moves with cy', () => {
    const above = new TooltipPosition(makeCtx({ wrapRect: roomy }).ttCtx)
    const below = new TooltipPosition(makeCtx({ wrapRect: atTop }).ttCtx)
    for (const cy of [0, 1, 10, 20, 39, 40]) {
      const a = above.computeTooltipPosition(50, cy, 5)
      expect(a.placement).toBe('top')
      expect(a.y).toBe(aboveY(cy))

      const b = below.computeTooltipPosition(50, cy, 5)
      expect(b.placement).toBe('bottom')
      expect(b.y).toBe(belowY(cy))
    }
  })

  it('a point low in a short plot does not send the box back beside it', () => {
    // cy 38 of a 40px plot: the box sits above it, over the plot above the
    // point, not clamped to the plot and not beside the point.
    const r = new TooltipPosition(
      makeCtx({ wrapRect: roomy }).ttCtx,
    ).computeTooltipPosition(50, 38, 5)
    expect(r.placement).toBe('top')
    expect(r.y + 50 + ARROW_TIP_OVERHANG).toBe(38 + 20 - 5)
  })

  it('without a marker size the mark is 1px around the point', () => {
    const r = new TooltipPosition(
      makeCtx({ wrapRect: roomy }).ttCtx,
    ).computeTooltipPosition(50, 10)
    expect(r.y).toBe(aboveY(10, 1))

    const below = new TooltipPosition(
      makeCtx({ wrapRect: atTop }).ttCtx,
    ).computeTooltipPosition(50, 10)
    expect(below.y).toBe(belowY(10, 1))
  })

  it('a sparkline hover marker (markers.size 0, hover sizeOffset 3) puts the tip 3px above the point', () => {
    const hoverSize = TooltipUtils.prototype.getHoverMarkerSize.call(
      {
        w: {
          config: { markers: { hover: { size: undefined, sizeOffset: 3 } } },
          globals: { markers: { size: [0] } },
        },
      },
      0,
    )
    expect(hoverSize).toBe(3)

    const r = new TooltipPosition(
      makeCtx({ wrapRect: roomy }).ttCtx,
    ).computeTooltipPosition(50, 10, hoverSize)
    expect(r.placement).toBe('top')
    // point at elWrap 30: tip at 27, box bottom at 20
    expect(30 - (r.y + 50)).toBe(3 + ARROW_TIP_OVERHANG)
  })

  it('with a mark, the box sits on the mark instead of the point at cy', () => {
    const { ttCtx } = makeCtx({ wrapRect: roomy })
    const pos = new TooltipPosition(ttCtx)
    const spy = vi.spyOn(pos, 'placeOnShortPlot')

    // a column of points spanning grid 2..30 (elWrap 22..50)
    const r = pos.computeTooltipPosition(50, 10, 5, { top: 2, bottom: 30 })
    expect(spy).toHaveBeenCalledWith(100, 22, 50, {
      gapAbove: GAP,
      gapBelow: GAP,
    })
    expect(r).toEqual({
      x: 50,
      y: 22 - GAP - 50,
      placement: 'top',
      arrowX: 50,
      arrowY: null,
    })
  })

  it('with a mark, a cy pre-shifted far away does not matter', () => {
    const mark = { top: 2, bottom: 30 }
    const above = new TooltipPosition(makeCtx({ wrapRect: roomy }).ttCtx)
    const below = new TooltipPosition(makeCtx({ wrapRect: atTop }).ttCtx)
    for (const cy of [-500, -60, 0, 10, 35, 120, 900]) {
      const a = above.computeTooltipPosition(50, cy, 5, mark)
      expect(a.placement).toBe('top')
      expect(a.y).toBe(22 - GAP - 50)

      const b = below.computeTooltipPosition(50, cy, 5, mark)
      expect(b.placement).toBe('bottom')
      expect(b.y).toBe(50 + GAP)
    }
  })

  it.each([
    ['arrow', {}],
    ['no-arrow', { arrow: false }],
  ])(
    'without a mark, a pre-shifted cy is read as the point (%s mode)',
    (_mode, tooltip) => {
      // Callers that hand over a box y (the no-arrow intersect lift, the
      // sticky-bar clamp) pass a mark for that reason.
      const pos = new TooltipPosition(
        makeCtx({ wrapRect: roomy, tooltip }).ttCtx,
      )
      for (const cy of [-60, 10, 120]) {
        const r = pos.computeTooltipPosition(50, cy, 5)
        expect(r.placement).toBe('top')
        expect(r.y).toBe(aboveY(cy))
      }
    },
  )

  it('a null mark is the same as none', () => {
    const pos = new TooltipPosition(makeCtx({ wrapRect: roomy }).ttCtx)
    expect(pos.computeTooltipPosition(50, 10, 5, null)).toEqual(
      pos.computeTooltipPosition(50, 10, 5),
    )
  })

  it('places the legacy (no-arrow) mode above the point in elWrap px too', () => {
    const { ttCtx } = makeCtx({ wrapRect: roomy, tooltip: { arrow: false } })
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 10, 5)
    expect(r.placement).toBe('top')
    expect(r.y).toBe(aboveY(10))
    expect(r.arrowY).toBeNull()
  })

  it('follows the pointer when the box follows the cursor: above it by the arrow, whatever cy or mark say', () => {
    const { ttCtx } = makeCtx({
      wrapRect: roomy,
      tooltip: { followCursor: true },
    })
    // grid starts at viewport (50, 320); pointer at (250, 330) -> grid-local
    // (200, 10), elWrap-local (250, 30). The raw event belongs to a sibling.
    ttCtx.clientX = 250
    ttCtx.clientY = 330
    ttCtx.e = { clientX: 9999, clientY: 9999 }
    const pos = new TooltipPosition(ttCtx)
    const spy = vi.spyOn(pos, 'placeOnShortPlot')

    const r = pos.computeTooltipPosition(50, 10, 5, { top: -400, bottom: 400 })
    expect(r).toEqual({
      x: 250 - 50,
      y: 30 - GAP - 50,
      placement: 'top',
      arrowX: 50,
      arrowY: null,
    })
    expect(spy).toHaveBeenCalledWith(250, 30, 30, {
      gapAbove: GAP,
      gapBelow: POINTER_CLEARANCE_BELOW,
    })

    // A pointer low in the plot moves the box with it.
    ttCtx.clientY = 355
    expect(pos.computeTooltipPosition(50, 10, 5).y).toBe(55 - GAP - 50)
  })

  it('follows the pointer below it by the cursor clearance when there is no room above', () => {
    const { ttCtx } = makeCtx({
      wrapRect: atTop,
      tooltip: { followCursor: true },
    })
    // grid at viewport (50, 20): pointer at elWrap-local (250, 30)
    ttCtx.clientX = 250
    ttCtx.clientY = 30
    ttCtx.e = { clientX: 250, clientY: 30 }
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 10, 5)
    expect(POINTER_CLEARANCE_BELOW).toBe(24)
    expect(r).toEqual({
      x: 200,
      y: 30 + POINTER_CLEARANCE_BELOW,
      placement: 'bottom',
      arrowX: 50,
      arrowY: null,
    })
  })

  it('an interactive followCursor tooltip does not follow the pointer (it sits on the point)', () => {
    const { ttCtx } = makeCtx({
      wrapRect: roomy,
      tooltip: { followCursor: true, interactive: true },
    })
    ttCtx.clientX = 250
    ttCtx.clientY = 355
    const r = new TooltipPosition(ttCtx).computeTooltipPosition(50, 10, 5)
    expect(r.y).toBe(aboveY(10))
    expect(r.x).toBe(50)
  })

  it('wins over the keyboard-focus nudge (the box no longer overlaps the point)', () => {
    const { ttCtx, w } = makeCtx({ wrapRect: roomy })
    w.config.chart.accessibility = {
      enabled: true,
      keyboard: { navigation: { enabled: true } },
    }
    const focused = document.createElement('div')
    focused.className = 'apexcharts-keyboard-focused'
    w.dom.baseEl.appendChild(focused)
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 10, 5)
    expect(r.placement).toBe('top')
    expect(r.y).toBe(aboveY(10))
  })

  it('keeps its usual placement when neither side of the mark is visible', () => {
    const { ttCtx, elWrap } = makeCtx({ wrapRect: roomy })
    // room 0..80 in elWrap px: above -32 < 0, below 42 + 50 > 80
    clipTo(elWrap, { left: 0, top: 300, width: 400, height: 80 })
    const pos = new TooltipPosition(ttCtx)
    pos.shortPlotPlacement = true

    const r = pos.computeTooltipPosition(50, 10, 5)
    expect(r).toEqual({ x: 112, y: 20, placement: 'right', arrowY: 10 })
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('goes below inside a clipping card with room only there', () => {
    const { ttCtx, elWrap } = makeCtx({ wrapRect: roomy })
    clipTo(elWrap, { left: 0, top: 300, width: 400, height: 100 })
    const r = new TooltipPosition(ttCtx).computeTooltipPosition(50, 10, 5)
    expect(r.placement).toBe('bottom')
    expect(r.y).toBe(belowY(10))
  })

  it('never moves a fixed tooltip', () => {
    const { ttCtx } = makeCtx({
      wrapRect: roomy,
      ttCtx: { fixedTooltip: true },
    })
    const pos = new TooltipPosition(ttCtx)

    const r = pos.computeTooltipPosition(50, 10, 5, { top: 2, bottom: 30 })
    expect(r.placement).toBe('right')
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('still returns null for a non-numeric point', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    expect(pos.computeTooltipPosition(NaN, 10, 5)).toBeNull()
    expect(pos.computeTooltipPosition(50, NaN, 5)).toBeNull()
    expect(
      pos.computeTooltipPosition(NaN, 10, 5, { top: 2, bottom: 30 }),
    ).toBeNull()
  })

  it('moveTooltip passes the mark through and writes the placement', () => {
    const { ttCtx, tooltipEl } = makeCtx({ wrapRect: roomy })
    tooltipEl.dataset.positioned = 'true'
    const pos = new TooltipPosition(ttCtx)
    const spy = vi.spyOn(pos, 'computeTooltipPosition')

    pos.moveTooltip(50, 10, 5, { top: 2, bottom: 30 })
    expect(spy).toHaveBeenCalledWith(50, 10, 5, { top: 2, bottom: 30 })
    expect(tooltipEl.style.top).toBe(22 - GAP - 50 + 'px')
    expect(tooltipEl.style.left).toBe('50px')
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('50px')
  })
})

describe('Position.computeTooltipPosition on a tall plot', () => {
  it('keeps the beside-the-point placement and reports shortPlotPlacement false', () => {
    const { ttCtx } = makeCtx({
      gridHeight: 300,
      gridWidth: 500,
      wrapRect: { left: 0, top: 300, width: 800, height: 600 },
    })
    const pos = new TooltipPosition(ttCtx)
    pos.shortPlotPlacement = true

    const right = pos.computeTooltipPosition(50, 100, 5)
    expect(right.placement).toBe('right')
    expect(right.arrowY).not.toBeNull()
    expect(right).not.toHaveProperty('arrowX')

    const left = pos.computeTooltipPosition(300, 100, 5)
    expect(left.placement).toBe('left')
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('ignores a mark', () => {
    const { ttCtx } = makeCtx({
      gridHeight: 300,
      gridWidth: 500,
      wrapRect: { left: 0, top: 300, width: 800, height: 600 },
    })
    const pos = new TooltipPosition(ttCtx)
    expect(
      pos.computeTooltipPosition(50, 100, 5, { top: 0, bottom: 300 }),
    ).toEqual(pos.computeTooltipPosition(50, 100, 5))
  })

  it('treats a plot just above the ratio as tall', () => {
    // 50 < 65 x 0.78 = 50.7
    const { ttCtx } = makeCtx({
      gridHeight: 65,
      wrapRect: { left: 0, top: 300, width: 400, height: 100 },
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.computeTooltipPosition(50, 10, 5).placement).toBe('right')
  })

  it('treats a plot at the ratio as short', () => {
    // 50 >= 64 x 0.78 = 49.92
    const { ttCtx } = makeCtx({
      gridHeight: 64,
      wrapRect: { left: 0, top: 300, width: 400, height: 100 },
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.computeTooltipPosition(50, 10, 5).placement).toBe('top')
  })
})

// ===========================================================================
// D. Box-over-the-mark callers
// ===========================================================================

// A 300px plot and a 230px box (230 < 300 x 0.78: tall), hovering a mark at
// grid-local y 120..150. Above the mark the box would start at
// 140 - 230 - 7 = -97, past the plot top (20); below it would end at
// 177 + 230 = 407, past the plot bottom (320). The page has room above the
// mark, but the short-plot rule never moves a tall plot's box out (a heatmap
// box goes beside the cell instead, and out of the plot only when it fits
// nowhere inside).
const TALL = {
  gridHeight: 300,
  ttHeight: 230,
  wrapRect: { left: 0, top: 400, width: 400, height: 360 },
}
const SHORT_ROOMY = { wrapRect: { left: 0, top: 400, width: 400, height: 100 } }
/** A clipping card the TALL chart fills: no room above or below it. */
const TALL_CARD = { left: 0, top: 400, width: 1000, height: 360 }
const SHORT_AT_TOP = { wrapRect: { left: 0, top: 0, width: 400, height: 100 } }

describe('Position.barValueSide', () => {
  /** The side for the bar at `j` of series `i` (null: the whole row). */
  function sideOf(
    series,
    {
      i = 0,
      j = 0,
      type = 'bar',
      collapsed = [],
      reversed = false,
      bar = {},
      range = [],
    } = {},
  ) {
    const w = {
      config: {
        chart: { type },
        plotOptions: { bar },
        yaxis: [{ reversed }],
      },
      globals: { collapsedSeriesIndices: collapsed },
      seriesData: { series },
      rangeData: { seriesRange: range },
    }
    return new TooltipPosition({ w }).barValueSide(j, i)
  }

  it('is the right of a positive bar and the left of a negative one', () => {
    expect(sideOf([[44]])).toBe('right')
    expect(sideOf([[-44]])).toBe('left')
    expect(sideOf([[3, -8, 5]], { j: 1 })).toBe('left')
  })

  it('is the other way round on a reversed axis', () => {
    expect(sideOf([[44]], { reversed: true })).toBe('left')
    expect(sideOf([[-44]], { reversed: true })).toBe('right')
  })

  it('reads the bar of the series it is given', () => {
    expect(sideOf([[44], [-12]], { i: 1 })).toBe('left')
  })

  it('is the side of a whole row when every visible bar in it agrees', () => {
    expect(sideOf([[44], [12]], { i: null })).toBe('right')
    expect(sideOf([[-44], [-12]], { i: null })).toBe('left')
    expect(sideOf([[44], [-12]], { i: null })).toBeNull()
    // the negative series is hidden from the legend
    expect(sideOf([[44], [-12]], { i: null, collapsed: [1] })).toBe('right')
  })

  it('is null for a bar with no length or no value', () => {
    expect(sideOf([[0]])).toBeNull()
    expect(sideOf([[null]])).toBeNull()
    expect(sideOf([[]])).toBeNull()
  })

  it('is null for a range bar or a box plot, which have a value at each end', () => {
    expect(sideOf([[44]], { type: 'rangeBar' })).toBeNull()
    expect(sideOf([[44]], { type: 'boxPlot' })).toBeNull()
    // a bar chart given ranges draws range bars
    expect(sideOf([[44]], { range: [[{ y: [{ y1: 1, y2: 5 }] }]] })).toBeNull()
  })

  it('is the right for every funnel and pyramid bar, centred on the plot', () => {
    expect(sideOf([[44]], { bar: { isFunnel: true } })).toBe('right')
    expect(sideOf([[-44]], { bar: { isFunnel: true } })).toBe('right')
  })
})

describe('Position.placeHorizontalSharedTooltip', () => {
  function rowsCtx(opts, row) {
    const ctx = makeCtx(opts)
    const { w, elGrid, tooltipEl } = ctx
    tooltipEl.dataset.positioned = 'true'
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('class', 'apexcharts-bar-series')
    const bar = document.createElementNS(SVG_NS, 'path')
    bar.setAttribute('j', '0')
    const grid = elGrid.getBoundingClientRect()
    setRect(bar, {
      left: grid.left + row.x,
      top: grid.top + row.y,
      width: row.width,
      height: row.height,
    })
    g.appendChild(bar)
    w.dom.baseEl.appendChild(g)
    return ctx
  }

  it('puts a row on a tall plot above its bars, past the plot top, when nothing fits in the plot and the page has room above', () => {
    // row elWrap 50..250 x 140..170: no room above (-97) or below (407) in
    // the 20..320 plot, nor beside it (257 + 100 > 350, 50 - 107 < 50)
    const { ttCtx, tooltipEl } = rowsCtx(TALL, {
      x: 0,
      y: 120,
      width: 200,
      height: 30,
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeHorizontalSharedTooltip(0)).toBe(true)
    expect(tooltipEl.style.top).toBe(20 + 120 - 230 - ARROW_TIP_OVERHANG + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('puts that row below its bars, out of the plot, when the page has no room above', () => {
    // it used to stay above, at -97: off the top of the screen
    const { ttCtx, tooltipEl } = rowsCtx(
      { ...TALL, wrapRect: { ...TALL.wrapRect, top: 0 } },
      { x: 0, y: 120, width: 200, height: 30 },
    )
    new TooltipPosition(ttCtx).placeHorizontalSharedTooltip(0)
    expect(tooltipEl.style.top).toBe(170 + GAP + 'px')
    expect(tooltipEl.dataset.placement).toBe('bottom')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('50px')
  })

  it('puts a tall-plot row beside its bars, past their value end, when the page has room neither above nor below', () => {
    // row elWrap 50..170: right of it at 177, centred on its middle (155);
    // the page shows the chart and nothing above or below it
    const { ttCtx, tooltipEl, w, elWrap } = rowsCtx(
      { ...TALL, chart: { type: 'bar' } },
      { x: 0, y: 120, width: 120, height: 30 },
    )
    clipTo(elWrap, TALL_CARD)
    w.seriesData.series = [[44]]
    new TooltipPosition(ttCtx).placeHorizontalSharedTooltip(0)
    expect(tooltipEl.style.left).toBe(170 + GAP + 'px')
    expect(tooltipEl.style.top).toBe('40px')
    expect(tooltipEl.dataset.placement).toBe('right')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-y')).toBe('115px')
  })

  it('places a row on a short plot directly above the row', () => {
    // row at grid 5..35, elWrap 25..55, centre x 100 + 50
    const { ttCtx, tooltipEl } = rowsCtx(SHORT_ROOMY, {
      x: 0,
      y: 5,
      width: 200,
      height: 30,
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeHorizontalSharedTooltip(0)).toBe(true)
    expect(tooltipEl.style.top).toBe(25 - GAP - 50 + 'px')
    expect(tooltipEl.style.left).toBe('100px')
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('50px')
    expect(pos.shortPlotPlacement).toBe(true)
  })

  it('a lower row gets a lower box (it sits on the row, not on the plot top)', () => {
    const { ttCtx, tooltipEl } = rowsCtx(SHORT_ROOMY, {
      x: 0,
      y: 15,
      width: 200,
      height: 20,
    })
    new TooltipPosition(ttCtx).placeHorizontalSharedTooltip(0)
    expect(tooltipEl.style.top).toBe(35 - GAP - 50 + 'px')
  })

  it('places a row on a short plot directly below the row when the page has no room above', () => {
    const { ttCtx, tooltipEl } = rowsCtx(SHORT_AT_TOP, {
      x: 0,
      y: 5,
      width: 200,
      height: 30,
    })
    const pos = new TooltipPosition(ttCtx)

    expect(pos.placeHorizontalSharedTooltip(0)).toBe(true)
    expect(tooltipEl.style.top).toBe(55 + GAP + 'px')
    expect(tooltipEl.dataset.placement).toBe('bottom')
    expect(pos.shortPlotPlacement).toBe(true)
  })
})

describe('Intersect.handleHeatTreeTooltip', () => {
  /**
   * Hover one cell (grid-local `cell`) of a `type` chart. `own` puts this
   * chart's own cell at the same i/j into baseEl, at `own` (grid-local), and
   * makes the hovered rect belong to another chart (a group sibling).
   * `gridBoxDrop` moves the grid group's box that far below the plot top, as
   * a browser lays it out.
   */
  function hoverCell(
    opts,
    cell,
    {
      type = 'heatmap',
      own = null,
      clientX,
      clientY,
      event = {},
      clip = false,
      gridBoxDrop = 0,
      hexagon = false,
    } = {},
  ) {
    const { w, ttCtx, elGrid, elWrap, tooltipEl } = makeCtx(opts)
    if (clip) clipTo(elWrap, elWrap.getBoundingClientRect())
    tooltipEl.dataset.positioned = 'true'
    w.config.chart.type = type
    w.interact = {}
    ttCtx.tooltipLabels = { drawSeriesTexts: vi.fn() }
    const pos = new TooltipPosition(ttCtx)
    vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
    ttCtx.tooltipPosition = pos
    const grid = elGrid.getBoundingClientRect()
    if (gridBoxDrop) {
      setRect(elGrid, { ...grid, top: grid.top + gridBoxDrop })
    }

    const makeRect = (c, at) => {
      const rect = document.createElementNS(SVG_NS, 'rect')
      rect.setAttribute('class', `apexcharts-${type}-rect`)
      const attrs = {
        i: 0,
        j: 0,
        cx: c.x,
        cy: c.y,
        width: c.width,
        height: c.height,
      }
      for (const [k, v] of Object.entries(attrs)) {
        rect.setAttribute(k, String(v))
      }
      setRect(rect, {
        left: at.left + c.x,
        top: at.top + c.y,
        width: c.width,
        height: c.height,
      })
      return rect
    }

    let hovered
    if (own) {
      // a sibling's cell, measured against a different grid far away
      hovered = makeRect(cell, { left: grid.left + 900, top: grid.top + 500 })
      const mine = makeRect(own, grid)
      const svg = document.createElementNS(SVG_NS, 'svg')
      svg.appendChild(mine)
      w.dom.baseEl.appendChild(svg)
    } else {
      hovered = makeRect(cell, grid)
    }
    if (hexagon) {
      // a honeycomb's cells sit in a group clipped to the whole lattice
      const g = document.createElementNS(SVG_NS, 'g')
      g.setAttribute('clip-path', 'url(#heatmapHexMask7)')
      g.appendChild(hovered)
      document.createElementNS(SVG_NS, 'svg').appendChild(g)
    }

    const result = new Intersect(ttCtx).handleHeatTreeTooltip({
      e: { type: 'mousemove', target: hovered, ...event },
      opt: { elGrid, ttItems: [], clientX, clientY },
      x: 0,
      y: 0,
      type,
    })
    return { result, pos, tooltipEl }
  }

  it('puts a heatmap cell on a tall plot beside the cell, arrow on its middle, when the box fits neither above nor below', () => {
    // cell elWrap 150..180 x 140..170, middle (165, 155), left of the plot
    // middle (200): right of it, 187; centred on 155, 40 (inside 20..320)
    const { result, pos, tooltipEl } = hoverCell(TALL, {
      x: 100,
      y: 120,
      width: 30,
      height: 30,
    })

    expect(result).toEqual({ x: 180 + GAP, y: 40, positioned: true })
    expect(tooltipEl.style.left).toBe('187px')
    expect(tooltipEl.style.top).toBe('40px')
    expect(tooltipEl.dataset.placement).toBe('right')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-y')).toBe('115px')
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('puts a heatmap cell right of the plot middle beside it on the left', () => {
    const { result, tooltipEl } = hoverCell(TALL, {
      x: 220,
      y: 120,
      width: 30,
      height: 30,
    })
    // cell elWrap 270..300
    expect(result.x).toBe(270 - GAP - 100)
    expect(tooltipEl.dataset.placement).toBe('left')
  })

  it('puts a tall-plot heatmap box out of the plot, above the cell, when it fits nowhere inside and the page has room', () => {
    // 280px wide: no room beside the cell (187 + 280 > 350, 150 - 287 < 50);
    // the page has 400px above the chart
    const { result, tooltipEl } = hoverCell(
      { ...TALL, ttWidth: 280 },
      { x: 100, y: 120, width: 30, height: 30 },
    )
    expect(result.y).toBe(140 - GAP - 230)
    expect(result.x).toBe(50)
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('115px')
  })

  it('keeps a tall-plot heatmap box above the cell, clamped to the grid top, when it fits nowhere at all', () => {
    // the chart is clipped to its own box: no room out of the plot either
    const { result, tooltipEl } = hoverCell(
      { ...TALL, ttWidth: 280 },
      { x: 100, y: 120, width: 30, height: 30 },
      { clip: true },
    )
    expect(result).toEqual({ x: 50, y: 20, positioned: true })
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('115px')
  })

  it('aims at the visible part of a cell the plot edge cuts off-centre', () => {
    // cell elWrap 30..60, of which the plot (from 50) shows 50..60: the
    // arrow aims at 55, not at the hidden 45, and the box is let out to 45
    const { result, tooltipEl } = hoverCell(
      { ...TALL, ttHeight: 50 },
      { x: -20, y: 200, width: 30, height: 30 },
    )
    expect(result.x).toBe(45)
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('10px')
  })

  it('aims at the whole of a honeycomb cell past the plot edge, which its own clip shows', () => {
    const { result } = hoverCell(
      { ...TALL, ttHeight: 50 },
      { x: -20, y: 200, width: 30, height: 30 },
      { hexagon: true },
    )
    // centred on 45, let out to 35 for the arrow
    expect(result.x).toBe(35)
  })

  it('holds a box wider than a narrow plot inside the visible room', () => {
    // a 120px plot at elWrap 100..220 in a 250px chart clipped to its own
    // box; a 200px box centred on the cell at 210 would end at 310
    const { result, tooltipEl } = hoverCell(
      {
        gridHeight: 300,
        gridWidth: 120,
        translateX: 100,
        ttWidth: 200,
        ttHeight: 50,
        wrapRect: { left: 0, top: 400, width: 250, height: 360 },
      },
      { x: 100, y: 200, width: 20, height: 30 },
      { clip: true },
    )
    expect(result.x).toBe(250 - 200)
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('160px')
  })

  it('measures an SVG heatmap cell from the plot top, not the grid group box below it', () => {
    // cell grid 200..230, elWrap 220..250: above it at 220 - 7 - 50
    const { result } = hoverCell(
      { ...TALL, ttHeight: 50 },
      { x: 100, y: 200, width: 30, height: 30 },
      { gridBoxDrop: 1 },
    )
    expect(result.y).toBe(220 - GAP - 50)
  })

  it('places a heatmap cell on a short plot directly above the cell', () => {
    // cell at grid 5..25, elWrap 25..45; centre x 115 + 50
    const { result, pos, tooltipEl } = hoverCell(SHORT_ROOMY, {
      x: 100,
      y: 5,
      width: 30,
      height: 20,
    })

    expect(result).toEqual({ x: 115, y: 25 - GAP - 50, positioned: true })
    expect(tooltipEl.style.top).toBe(25 - GAP - 50 + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(pos.shortPlotPlacement).toBe(true)
  })

  it('places a heatmap cell on a short plot directly below the cell when the page has no room above', () => {
    const { result, tooltipEl } = hoverCell(SHORT_AT_TOP, {
      x: 100,
      y: 5,
      width: 30,
      height: 20,
    })

    expect(result.y).toBe(45 + GAP)
    expect(tooltipEl.dataset.placement).toBe('bottom')
  })

  it('a grouped heatmap measures its own cell at the hovered i/j, not the sibling rect', () => {
    const { result } = hoverCell(
      SHORT_ROOMY,
      { x: 100, y: 5, width: 30, height: 20 },
      { own: { x: 200, y: 12, width: 30, height: 20 } },
    )
    // own cell: grid 12..32, elWrap 32..52, centre x 215 + 50
    expect(result).toEqual({ x: 215, y: 32 - GAP - 50, positioned: true })
  })

  it('a grouped heatmap on a tall plot measures its own cell too', () => {
    const { result } = hoverCell(
      { ...TALL, ttHeight: 50 },
      { x: 100, y: 120, width: 30, height: 30 },
      { own: { x: 200, y: 160, width: 30, height: 30 } },
    )
    // above its own cell: 180 - 50 - 7
    expect(result.y).toBe(180 - 50 - ARROW_TIP_OVERHANG)
    expect(result.x).toBe(215 - 50 + 50)
  })

  it('places a treemap cell on a short plot directly above the cell, with placement and arrow', () => {
    const { result, pos } = hoverCell(
      SHORT_ROOMY,
      { x: 100, y: 5, width: 30, height: 20 },
      { type: 'treemap' },
    )
    expect(result).toEqual({
      x: 115,
      y: 25 - GAP - 50,
      placement: 'top',
      arrowX: 50,
    })
    expect(pos.shortPlotPlacement).toBe(true)
  })

  it('places a treemap cell below when the page has no room above', () => {
    const { result } = hoverCell(
      SHORT_AT_TOP,
      { x: 100, y: 5, width: 30, height: 20 },
      { type: 'treemap' },
    )
    expect(result.placement).toBe('bottom')
    expect(result.y).toBe(45 + GAP)
  })

  it('keeps a treemap cell on a tall plot beside the cell, with no placement', () => {
    const { result, pos } = hoverCell(
      TALL,
      { x: 100, y: 120, width: 30, height: 30 },
      { type: 'treemap' },
    )
    expect(result).not.toHaveProperty('placement')
    expect(result).not.toHaveProperty('positioned')
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('a heatmap that follows the cursor sits above this chart pointer on a short plot', () => {
    // this chart's pointer at elWrap-local (180, 30); the raw event belongs
    // to a sibling
    const { result } = hoverCell(
      { ...SHORT_ROOMY, tooltip: { followCursor: true } },
      { x: 100, y: 5, width: 30, height: 20 },
      { clientX: 180, clientY: 430, event: { clientX: 999, clientY: 999 } },
    )
    expect(result).toEqual({
      x: 130,
      y: 30 - GAP - 50,
      placement: 'top',
      arrowX: 50,
    })
  })

  it('a heatmap that follows the cursor goes below the pointer by the cursor clearance', () => {
    const { result } = hoverCell(
      { ...SHORT_AT_TOP, tooltip: { followCursor: true } },
      { x: 100, y: 5, width: 30, height: 20 },
      { clientX: 180, clientY: 30 },
    )
    expect(result.placement).toBe('bottom')
    expect(result.y).toBe(30 + POINTER_CLEARANCE_BELOW)
  })

  it('a cursor-following heatmap reads the raw event when no pointer is handed down', () => {
    const { result } = hoverCell(
      { ...SHORT_ROOMY, tooltip: { followCursor: true } },
      { x: 100, y: 5, width: 30, height: 20 },
      { event: { clientX: 180, clientY: 430 } },
    )
    expect(result.y).toBe(30 - GAP - 50)
    expect(result.x).toBe(130)
  })
})

/**
 * A horizontal bar at grid-local `bar` (x, y, width, height), its series'
 * values `values`, in a chart made by `makeCtx(opts)`, plus the bar's path
 * node and the parts of the tooltip context the bar paths read.
 */
function horizontalBarCtx(opts, bar, { values = [44] } = {}) {
  const ctx = makeCtx({
    ...opts,
    chart: { type: 'bar' },
    globals: { isBarHorizontal: true },
  })
  const { w, ttCtx, tooltipEl, elWrap } = ctx
  tooltipEl.dataset.positioned = 'true'
  w.interact = {}
  w.seriesData.series = [values]
  w.rangeData = { seriesRange: [] }
  ttCtx.tConfig = w.config.tooltip
  ttCtx.showOnIntersect = true
  ttCtx.ttItems = []
  ttCtx.dataPointsDividedHeight = 0
  // the zero line at the plot's left edge
  ttCtx.xyRatios = { baseLineInvertedY: 0 }
  ttCtx.tooltipLabels = { drawSeriesTexts: vi.fn() }
  ttCtx.tooltipUtil = {
    hasBars: () => true,
    isXoverlap: () => true,
    isInitialSeriesSameLen: () => true,
  }
  const pos = new TooltipPosition(ttCtx)
  vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
  ttCtx.tooltipPosition = pos

  // The bar as Bar.js draws it, in its series group, inside baseEl.
  const wrap = elWrap.getBoundingClientRect()
  const series = document.createElementNS(SVG_NS, 'g')
  series.setAttribute('class', 'apexcharts-bar-series')
  const group = document.createElementNS(SVG_NS, 'g')
  group.setAttribute('class', 'apexcharts-series')
  group.setAttribute('rel', '1')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('class', 'apexcharts-bar-area')
  const attrs = { j: 0, cx: bar.x + bar.width, cy: bar.y, barWidth: bar.height }
  for (const [k, v] of Object.entries(attrs)) path.setAttribute(k, String(v))
  setRect(path, {
    left: wrap.left + w.layout.translateX + bar.x,
    top: wrap.top + w.layout.translateY + bar.y,
    width: bar.width,
    height: bar.height,
  })
  group.appendChild(path)
  series.appendChild(group)
  w.dom.baseEl.appendChild(series)
  return { ...ctx, pos, path }
}

describe('Intersect.handleBarTooltip: a horizontal bar', () => {
  /**
   * Hover the bar at grid-local `bar`. `boxed`: the page shows the chart
   * and nothing above or below it (TALL_CARD).
   */
  function hoverBar(opts, bar, { boxed = false, ...extra } = {}) {
    const ctx = horizontalBarCtx(opts, bar, extra)
    if (boxed) clipTo(ctx.elWrap, TALL_CARD)
    new Intersect(ctx.ttCtx).handleBarTooltip({
      e: { type: 'mousemove', target: ctx.path, clientX: 0, clientY: 0 },
      opt: { elGrid: ctx.elGrid, ttItems: [] },
    })
    return ctx
  }

  it('keeps a box that fits above the bar above it, centred on it', () => {
    // bar elWrap 50..170 x 140..170
    const { tooltipEl } = hoverBar(
      { ...TALL, ttHeight: 50 },
      { x: 0, y: 120, width: 120, height: 30 },
    )
    expect(tooltipEl.style.top).toBe(140 - GAP - 50 + 'px')
    expect(tooltipEl.style.left).toBe(110 - 50 + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('50px')
  })

  it('puts a box that fits neither above nor below a bar, on the page either, beside its value end, arrow on its middle', () => {
    // it used to stay above the bar at -97, past the plot top (20) and off
    // the visible part of the page
    const { tooltipEl, pos } = hoverBar(
      TALL,
      { x: 0, y: 120, width: 120, height: 30 },
      { boxed: true },
    )
    expect(tooltipEl.style.left).toBe(170 + GAP + 'px')
    expect(tooltipEl.style.top).toBe('40px')
    expect(tooltipEl.dataset.placement).toBe('right')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-y')).toBe('115px')
    expect(pos.shortPlotPlacement).toBe(false)
  })

  it('keeps a box above the bar, past the plot top, while the page has room there, though one beside it would fit', () => {
    const { tooltipEl } = hoverBar(TALL, {
      x: 0,
      y: 120,
      width: 120,
      height: 30,
    })
    expect(tooltipEl.style.top).toBe(140 - GAP - 230 + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
  })

  it('goes past the value end of a positive bar right of the plot middle, not over the zero line', () => {
    // bar elWrap 200..230, middle 215: the side facing the plot middle (200)
    // is the left, the bar's base
    const { tooltipEl } = hoverBar(
      TALL,
      { x: 150, y: 120, width: 30, height: 30 },
      { boxed: true },
    )
    expect(tooltipEl.dataset.placement).toBe('right')
    expect(tooltipEl.style.left).toBe(230 + GAP + 'px')
  })

  it('goes past the value end of a negative bar left of the plot middle', () => {
    // bar elWrap 160..230, middle 195: the side facing the plot middle is
    // the right, the bar's base
    const { tooltipEl } = hoverBar(
      TALL,
      { x: 110, y: 120, width: 70, height: 30 },
      { values: [-20], boxed: true },
    )
    expect(tooltipEl.dataset.placement).toBe('left')
    expect(tooltipEl.style.left).toBe(160 - GAP - 100 + 'px')
  })

  it('goes below a bar too long for a box beside it, out of the plot, when the page has no room above', () => {
    // bar elWrap 50..340 at the top of the page; it used to stay above, at
    // -97: off the top of the screen
    const { tooltipEl } = hoverBar(
      { ...TALL, wrapRect: { ...TALL.wrapRect, top: 0 } },
      { x: 0, y: 120, width: 290, height: 30 },
    )
    expect(tooltipEl.style.top).toBe(170 + GAP + 'px')
    expect(tooltipEl.dataset.placement).toBe('bottom')
    expect(tooltipEl.style.left).toBe(195 - 50 + 'px')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('50px')
  })

  it('goes above that bar, past the plot top, when the page has room there', () => {
    const { tooltipEl } = hoverBar(TALL, {
      x: 0,
      y: 120,
      width: 290,
      height: 30,
    })
    expect(tooltipEl.style.top).toBe(140 - GAP - 230 + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
  })
})

describe('Intersect.handleBarTooltip: a column with no room beside it', () => {
  /**
   * A column at grid-local `bar` (x, y, width, height) in a TALL plot whose
   * elWrap is `wrapWidth` wide, hovered with the arrow on.
   */
  function hoverColumn(
    bar,
    { wrapWidth = 400, ttWidth = 100, card = null } = {},
  ) {
    const ctx = makeCtx({
      ...TALL,
      ttWidth,
      ttHeight: 60,
      wrapRect: { ...TALL.wrapRect, width: wrapWidth },
      chart: { type: 'bar' },
    })
    const { w, ttCtx, tooltipEl, elWrap } = ctx
    if (card) clipTo(elWrap, card)
    tooltipEl.dataset.positioned = 'true'
    w.interact = {}
    w.seriesData.series = [[44]]
    w.rangeData = { seriesRange: [] }
    ttCtx.tConfig = w.config.tooltip
    ttCtx.showOnIntersect = true
    ttCtx.ttItems = []
    ttCtx.dataPointsDividedWidth = 0
    ttCtx.tooltipLabels = { drawSeriesTexts: vi.fn() }
    ttCtx.tooltipUtil = { hasBars: () => true }
    const pos = new TooltipPosition(ttCtx)
    vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
    ttCtx.tooltipPosition = pos

    const wrap = elWrap.getBoundingClientRect()
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('rel', '1')
    const path = document.createElementNS(SVG_NS, 'path')
    path.setAttribute('class', 'apexcharts-bar-area')
    const attrs = {
      j: 0,
      cx: bar.x + bar.width / 2,
      cy: bar.y,
      barWidth: bar.width,
    }
    for (const [k, v] of Object.entries(attrs)) path.setAttribute(k, String(v))
    setRect(path, {
      left: wrap.left + w.layout.translateX + bar.x,
      top: wrap.top + w.layout.translateY + bar.y,
      width: bar.width,
      height: bar.height,
    })
    g.appendChild(path)
    w.dom.baseEl.appendChild(g)

    new Intersect(ttCtx).handleBarTooltip({
      e: { type: 'mousemove', target: path, clientX: 0, clientY: 0 },
      opt: { elGrid: ctx.elGrid, ttItems: [] },
    })
    return tooltipEl
  }

  it('goes beside the column on the side facing the plot middle while the chart has room there', () => {
    // column elWrap 80..110, box right of it at 117
    const tooltipEl = hoverColumn({ x: 30, y: 100, width: 30, height: 200 })
    expect(tooltipEl.dataset.placement).toBe('right')
    expect(tooltipEl.style.left).toBe(110 + GAP + 'px')
  })

  it('goes beside it on the other side when the facing one would leave the chart', () => {
    // column elWrap 170..200, the page cut at 260: right of it the box runs
    // to 207 + 150, past the page; left of it, from 13, it fits
    const tooltipEl = hoverColumn(
      { x: 120, y: 100, width: 30, height: 200 },
      {
        wrapWidth: 400,
        ttWidth: 150,
        card: { left: 0, top: 400, width: 260, height: 360 },
      },
    )
    expect(tooltipEl.dataset.placement).toBe('left')
    expect(tooltipEl.style.left).toBe(170 - GAP - 150 + 'px')
  })

  it('goes above the column, over its own plot, when the box fits beside it on neither side', () => {
    // a 260px chart and a 150px box: 117 + 150 runs past the chart's right
    // edge and 80 - 157 past its left, as on a phone with a chart beside it
    const tooltipEl = hoverColumn(
      { x: 30, y: 100, width: 30, height: 200 },
      { wrapWidth: 260, ttWidth: 150 },
    )
    expect(tooltipEl.dataset.placement).toBe('top')
    // above the column top (elWrap 120), centred on it (95) and held in the
    // 50..350 plot
    expect(tooltipEl.style.top).toBe(120 - GAP - 60 + 'px')
    expect(tooltipEl.style.left).toBe('50px')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('45px')
  })
})

describe('KeyboardNavigation: a focused horizontal bar', () => {
  /**
   * Focus the bar at grid-local `bar`. `boxed`: the page shows the chart
   * and nothing above or below it (TALL_CARD).
   */
  function focusBar(
    opts,
    bar,
    {
      showOnIntersect = true,
      boxed = false,
      fixed = false,
      placement,
      ...extra
    } = {},
  ) {
    const ctx = horizontalBarCtx(opts, bar, extra)
    const { w, ttCtx, path, tooltipEl, elWrap } = ctx
    if (boxed) clipTo(elWrap, TALL_CARD)
    if (placement) tooltipEl.dataset.placement = placement
    ttCtx.showOnIntersect = showOnIntersect
    ttCtx.fixedTooltip = fixed
    w.dom.Paper = { findOne: vi.fn(() => ({ node: path })) }
    vi.spyOn(Graphics.prototype, 'pathMouseEnter').mockImplementation(() => {})
    KeyboardNavigation.prototype._showTooltipBar.call(
      {
        w,
        ctx: { w },
        _leaveHoveredBar: vi.fn(),
        _focusedBarInWrap: KeyboardNavigation.prototype._focusedBarInWrap,
        _canvasMark: () => null,
        _canvasMarkRect: () => null,
      },
      0,
      0,
      ttCtx,
    )
    return tooltipEl
  }

  const MIDDLE_ROW = { x: 0, y: 120, width: 120, height: 30 }

  it('puts the box where the pointer does, beside a middle-row bar with the arrow on it', () => {
    const tooltipEl = focusBar(TALL, MIDDLE_ROW, { boxed: true })
    expect(tooltipEl.style.left).toBe(170 + GAP + 'px')
    expect(tooltipEl.style.top).toBe('40px')
    expect(tooltipEl.dataset.placement).toBe('right')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-y')).toBe('115px')
  })

  it('puts the box above a bar with room above it, as the pointer does', () => {
    const tooltipEl = focusBar({ ...TALL, ttHeight: 50 }, MIDDLE_ROW)
    expect(tooltipEl.style.top).toBe(140 - GAP - 50 + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
  })

  it('places a chart that is not intersect-only around the whole row, as the pointer sticky path does', () => {
    const tooltipEl = focusBar(TALL, MIDDLE_ROW, {
      showOnIntersect: false,
      boxed: true,
    })
    expect(tooltipEl.style.left).toBe(170 + GAP + 'px')
    expect(tooltipEl.dataset.placement).toBe('right')
  })

  it('keeps the box beside the value end, with no placement of its own, when the arrow is off', () => {
    const tooltipEl = focusBar(
      { ...TALL, tooltip: { arrow: false } },
      MIDDLE_ROW,
    )
    expect(tooltipEl.style.left).toBe('170px')
    expect(tooltipEl.style.top).toBe('40px')
    expect(tooltipEl.dataset.placement).toBeUndefined()
  })

  it('holds that box inside the plot and drops the placement an earlier box left, when the arrow is off', () => {
    // a bar reaching the plot's right edge (elWrap 350): the box beside its
    // end would run out of the chart
    const tooltipEl = focusBar(
      { ...TALL, tooltip: { arrow: false } },
      { x: 0, y: 120, width: 300, height: 30 },
      { placement: 'top' },
    )
    expect(tooltipEl.style.left).toBe(350 - 100 + 'px')
    expect(tooltipEl.dataset.placement).toBeUndefined()
  })

  it('leaves a fixed box alone, as the pointer does, and gives it no placement', () => {
    for (const showOnIntersect of [true, false]) {
      const tooltipEl = focusBar(TALL, MIDDLE_ROW, {
        fixed: true,
        showOnIntersect,
        boxed: true,
      })
      expect(tooltipEl.style.left).toBe('')
      expect(tooltipEl.dataset.placement).toBeUndefined()
      document.body.innerHTML = ''
    }
  })
})

describe('KeyboardNavigation: a focused heatmap cell', () => {
  /** Focus the one cell (grid-local `cell`) of a heatmap. */
  function focusCell(opts, cell, { placement = null } = {}) {
    const { w, ttCtx, tooltipEl, baseEl, elWrap } = makeCtx(opts)
    const { ttWidth = 100, ttHeight = 50 } = opts
    setRect(tooltipEl, { left: 0, top: 0, width: ttWidth, height: ttHeight })
    if (placement) tooltipEl.dataset.placement = placement
    ttCtx.tooltipLabels = { drawSeriesTexts: vi.fn() }
    const pos = new TooltipPosition(ttCtx)
    vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
    ttCtx.tooltipPosition = pos

    const wrap = elWrap.getBoundingClientRect()
    const rect = document.createElementNS(SVG_NS, 'rect')
    rect.setAttribute('class', 'apexcharts-heatmap-rect')
    const attrs = { i: 0, j: 0, cx: cell.x, width: cell.width }
    for (const [k, v] of Object.entries(attrs)) rect.setAttribute(k, String(v))
    setRect(rect, {
      left: wrap.left + w.layout.translateX + cell.x,
      top: wrap.top + w.layout.translateY + cell.y,
      width: cell.width,
      height: cell.height,
    })
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.appendChild(rect)
    baseEl.appendChild(svg)

    KeyboardNavigation.prototype._showTooltipHeatTree.call(
      { w },
      0,
      0,
      ttCtx,
      tooltipEl,
      'heatmap',
    )
    return tooltipEl
  }

  const MIDDLE_ROW = { x: 100, y: 120, width: 30, height: 30 }

  it('puts the box where the pointer does, beside a middle-row cell with the arrow on it', () => {
    const tooltipEl = focusCell(TALL, MIDDLE_ROW)
    expect(tooltipEl.style.left).toBe('187px')
    expect(tooltipEl.style.top).toBe('40px')
    expect(tooltipEl.dataset.placement).toBe('right')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-y')).toBe('115px')
  })

  it('puts the box above a cell with room above it, replacing the placement the last box left', () => {
    // cell elWrap 220..250: above at 220 - 7 - 50
    const tooltipEl = focusCell(
      { ...TALL, ttHeight: 50 },
      { ...MIDDLE_ROW, y: 200 },
      { placement: 'bottom' },
    )
    expect(tooltipEl.style.top).toBe(220 - GAP - 50 + 'px')
    expect(tooltipEl.dataset.placement).toBe('top')
    expect(tooltipEl.style.getPropertyValue('--apx-tt-arrow-x')).toBe('50px')
  })

  it('keeps the box beside the cell, with no placement of its own, when the arrow is off', () => {
    const tooltipEl = focusCell({ ...TALL, tooltip: { arrow: false } }, MIDDLE_ROW)
    expect(tooltipEl.dataset.placement).toBeUndefined()
    expect(tooltipEl.style.top).toBe('40px')
  })
})

// ===========================================================================
// E. Interactive tooltip past the plot's edge
// ===========================================================================

// Mirrors of Tooltip.js's private constants: the base close delay, the slow
// pointer speed the trip is timed at (px per ms), the cap on the trip time,
// and the sideways reach toward the box.
const BASE_DELAY = 150
const SLOW_SPEED = 0.2
const TRAVEL_CAP = 600
const REACH = 24

/**
 * A minimal `this` for the two Tooltip helpers: a box at viewport
 * (100, 50) .. (220, 110) unless `rect` says otherwise.
 */
function interactiveStub({
  shortPlotPlacement = true,
  rect = { left: 100, top: 50, width: 120, height: 60 },
  placement = 'top',
  active = true,
  hasEl = true,
} = {}) {
  const tooltipEl = document.createElement('div')
  tooltipEl.className = 'apexcharts-tooltip'
  if (active) tooltipEl.classList.add('apexcharts-active')
  if (placement) tooltipEl.dataset.placement = placement
  setRect(tooltipEl, rect)
  const self = {
    tooltipPosition: { shortPlotPlacement },
    getElTooltip: vi.fn(() => (hasEl ? tooltipEl : null)),
  }
  return { self, tooltipEl }
}

const hideDelay = (self, x, y) =>
  Tooltip.prototype.interactiveHideDelay.call(self, x, y)
const heading = (self, el, x, above) =>
  Tooltip.prototype.isHeadingForOutsideBox.call(self, el, x, above)

describe('Tooltip.interactiveHideDelay', () => {
  it('is the base delay while the box is beside its point, without reading the box', () => {
    const { self } = interactiveStub({ shortPlotPlacement: false })
    expect(hideDelay(self, 0, 900)).toBe(BASE_DELAY)
    expect(self.getElTooltip).not.toHaveBeenCalled()
  })

  it('keys on shortPlotPlacement, not the round-2 outsidePlot flag', () => {
    const { tooltipEl } = interactiveStub()
    const self = {
      tooltipPosition: { outsidePlot: true },
      getElTooltip: vi.fn(() => tooltipEl),
    }
    expect(hideDelay(self, 160, 130)).toBe(BASE_DELAY)
    expect(self.getElTooltip).not.toHaveBeenCalled()
  })

  it('follows a real Position: short-plot placement on, then off', () => {
    const { ttCtx } = makeCtx()
    const pos = new TooltipPosition(ttCtx)
    const { tooltipEl } = interactiveStub()
    const self = { tooltipPosition: pos, getElTooltip: () => tooltipEl }

    pos.placeOnShortPlot(150, 25, 35)
    expect(pos.shortPlotPlacement).toBe(true)
    expect(hideDelay(self, 160, 130)).toBeCloseTo(BASE_DELAY + 20 / SLOW_SPEED)

    ttCtx.tooltipRect.ttHeight = 10
    pos.placeOnShortPlot(150, 25, 35)
    expect(pos.shortPlotPlacement).toBe(false)
    expect(hideDelay(self, 160, 130)).toBe(BASE_DELAY)
  })

  it('is the base delay with no Position to ask', () => {
    expect(hideDelay({ getElTooltip: () => null }, 0, 900)).toBe(BASE_DELAY)
  })

  it('is the base delay without a tooltip element', () => {
    const { self } = interactiveStub({ hasEl: false })
    expect(hideDelay(self, 0, 900)).toBe(BASE_DELAY)
  })

  it('is the base delay for an event without pointer coordinates', () => {
    const { self } = interactiveStub()
    expect(hideDelay(self, undefined, 300)).toBe(BASE_DELAY)
    expect(hideDelay(self, 300, undefined)).toBe(BASE_DELAY)
    expect(hideDelay(self, null, null)).toBe(BASE_DELAY)
  })

  it('reads a 0 coordinate as a coordinate', () => {
    // 100px left of the box
    const { self } = interactiveStub()
    expect(hideDelay(self, 0, 80)).toBeCloseTo(BASE_DELAY + 100 / SLOW_SPEED)
  })

  it('is the base delay with the pointer on or in the box', () => {
    const { self } = interactiveStub()
    expect(hideDelay(self, 160, 80)).toBe(BASE_DELAY)
    expect(hideDelay(self, 100, 50)).toBe(BASE_DELAY)
    expect(hideDelay(self, 220, 110)).toBe(BASE_DELAY)
  })

  it('adds the trip to the box at the slow pointer speed, from any side', () => {
    const { self } = interactiveStub()
    // 20px below the box (bottom 110)
    expect(hideDelay(self, 160, 130)).toBeCloseTo(BASE_DELAY + 20 / SLOW_SPEED)
    // 20px above it
    expect(hideDelay(self, 160, 30)).toBeCloseTo(BASE_DELAY + 20 / SLOW_SPEED)
    // 10px left, 10px right
    expect(hideDelay(self, 90, 80)).toBeCloseTo(BASE_DELAY + 10 / SLOW_SPEED)
    expect(hideDelay(self, 230, 80)).toBeCloseTo(BASE_DELAY + 10 / SLOW_SPEED)
  })

  it('measures a diagonal trip to the nearest corner as a straight line', () => {
    const { self } = interactiveStub()
    // (70, 10) to the corner (100, 50): 30 across, 40 down, 50 straight
    expect(hideDelay(self, 70, 10)).toBeCloseTo(BASE_DELAY + 50 / SLOW_SPEED)
  })

  it('caps the trip allowance', () => {
    const { self } = interactiveStub()
    // exactly at the cap: 120px at 0.2 px/ms is 600ms
    expect(hideDelay(self, 160, 110 + TRAVEL_CAP * SLOW_SPEED)).toBeCloseTo(
      BASE_DELAY + TRAVEL_CAP,
    )
    expect(hideDelay(self, 160, 1110)).toBe(BASE_DELAY + TRAVEL_CAP)
    expect(hideDelay(self, -5000, -5000)).toBe(BASE_DELAY + TRAVEL_CAP)
  })
})

describe('Tooltip.isHeadingForOutsideBox', () => {
  it('is true leaving the plot upward toward a box above the mark', () => {
    const { self, tooltipEl } = interactiveStub({ placement: 'top' })
    expect(heading(self, tooltipEl, 160, true)).toBe(true)
  })

  it('is false leaving downward from a box above the mark', () => {
    const { self, tooltipEl } = interactiveStub({ placement: 'top' })
    expect(heading(self, tooltipEl, 160, false)).toBe(false)
  })

  it('is true leaving downward toward a box below the mark, and false leaving upward', () => {
    const { self, tooltipEl } = interactiveStub({ placement: 'bottom' })
    expect(heading(self, tooltipEl, 160, false)).toBe(true)
    expect(heading(self, tooltipEl, 160, true)).toBe(false)
  })

  it.each(['left', 'right', null])(
    'is false for a box placed %s (beside a point)',
    (placement) => {
      const { self, tooltipEl } = interactiveStub({ placement })
      expect(heading(self, tooltipEl, 160, true)).toBe(false)
      expect(heading(self, tooltipEl, 160, false)).toBe(false)
    },
  )

  it('is false when the last placement was not a short-plot one', () => {
    // a stale data-placement="top" on a box placed beside its point since
    const { self, tooltipEl } = interactiveStub({ shortPlotPlacement: false })
    expect(heading(self, tooltipEl, 160, true)).toBe(false)
  })

  it('keys on shortPlotPlacement, not the round-2 outsidePlot flag', () => {
    const { tooltipEl } = interactiveStub()
    const self = { tooltipPosition: { outsidePlot: true } }
    expect(heading(self, tooltipEl, 160, true)).toBe(false)
  })

  it('follows a real Position after a short-plot placement', () => {
    const pos = new TooltipPosition(makeCtx().ttCtx)
    const { tooltipEl } = interactiveStub()
    const self = { tooltipPosition: pos }
    expect(heading(self, tooltipEl, 160, true)).toBe(false)
    pos.placeOnShortPlot(150, 25, 35)
    expect(heading(self, tooltipEl, 160, true)).toBe(true)
  })

  it('is false with no Position to ask', () => {
    const { tooltipEl } = interactiveStub()
    expect(heading({}, tooltipEl, 160, true)).toBe(false)
  })

  it('is false for a box that is not showing', () => {
    const { self, tooltipEl } = interactiveStub({ active: false })
    expect(heading(self, tooltipEl, 160, true)).toBe(false)
  })

  it('is false without a tooltip element', () => {
    const { self } = interactiveStub()
    expect(heading(self, null, 160, true)).toBe(false)
    expect(heading(self, undefined, 160, true)).toBe(false)
  })

  it('reaches the box sideways within the slack, and no further', () => {
    // box spans x 100..220
    const { self, tooltipEl } = interactiveStub()
    expect(heading(self, tooltipEl, 100 - REACH, true)).toBe(true)
    expect(heading(self, tooltipEl, 100 - REACH - 0.5, true)).toBe(false)
    expect(heading(self, tooltipEl, 220 + REACH, true)).toBe(true)
    expect(heading(self, tooltipEl, 220 + REACH + 0.5, true)).toBe(false)
  })
})

describe('the interactive close, at its two call sites', () => {
  it('a mouseout off a point waits for the trip to a box past the plot edge', () => {
    vi.useFakeTimers()
    const { self } = interactiveStub()
    self.tConfig = { interactive: true }
    self.w = { globals: { isDestroyed: false } }
    self.seriesHover = vi.fn()
    self.interactiveHideDelay = Tooltip.prototype.interactiveHideDelay

    const opt = {}
    // 20px below the box: 150 + 100
    const e = { type: 'mouseout', clientX: 160, clientY: 130 }
    Tooltip.prototype.onSeriesHover.call(self, opt, e)

    vi.advanceTimersByTime(BASE_DELAY + 100 - 1)
    expect(self.seriesHover).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(self.seriesHover).toHaveBeenCalledWith(opt, e)
  })

  it('a mouseout off a point with the box beside it waits the base delay only', () => {
    vi.useFakeTimers()
    const { self } = interactiveStub({ shortPlotPlacement: false })
    self.tConfig = { interactive: true }
    self.w = { globals: { isDestroyed: false } }
    self.seriesHover = vi.fn()
    self.interactiveHideDelay = Tooltip.prototype.interactiveHideDelay

    Tooltip.prototype.onSeriesHover.call(
      self,
      {},
      { type: 'mouseout', clientX: 160, clientY: 900 },
    )
    vi.advanceTimersByTime(BASE_DELAY - 1)
    expect(self.seriesHover).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(self.seriesHover).toHaveBeenCalledTimes(1)
  })

  /**
   * The plot spans viewport y 120..160 and x 80..380; the box sits above it
   * at (100, 50) .. (220, 110) unless `stub` says otherwise.
   */
  function leavePlot(
    clientX,
    clientY,
    { interactive = true, interact = {}, ...stub } = {},
  ) {
    const { self, tooltipEl } = interactiveStub(stub)
    self.tConfig = { interactive }
    self.w = {
      interact: { ...interact },
      globals: { isDestroyed: false },
      layout: {
        translateX: 80,
        translateY: 120,
        gridWidth: 300,
        gridHeight: 40,
      },
      dom: {
        elWrap: {
          querySelector: () => null,
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 400,
            height: 200,
          }),
        },
      },
    }
    self.handleMouseOut = vi.fn()
    self.isHeadingForOutsideBox = Tooltip.prototype.isHeadingForOutsideBox
    self.interactiveHideDelay = Tooltip.prototype.interactiveHideDelay
    const elGrid = {
      getBoundingClientRect: () => ({
        top: 120,
        height: 40,
        left: 80,
        width: 300,
      }),
    }
    const opt = { elGrid, tooltipEl, ttItems: [] }
    move(self, opt, clientX, clientY)
    return { self, opt }
  }

  function move(self, opt, clientX, clientY) {
    Tooltip.prototype.axisChartsTooltips.call(self, {
      e: { type: 'mousemove', clientX, clientY },
      opt,
    })
  }

  /**
   * Lets a pass over the plot run until the first early return that needs no
   * chart ("no series to hover over").
   */
  function canPassOverPlot(self) {
    Object.assign(self.w, {
      config: { chart: { type: 'line' }, tooltip: { shared: true } },
      seriesData: { series: [] },
    })
    Object.assign(self.w.globals, {
      xyCharts: true,
      collapsedSeries: [],
      ancillaryCollapsedSeries: [],
    })
    self.getElXCrosshairs = () => null
  }

  it('leaving the plot toward the box above defers the close by the trip', () => {
    vi.useFakeTimers()
    // 5px under the box: 150 + 25
    const { self, opt } = leavePlot(160, 115)
    expect(self.handleMouseOut).not.toHaveBeenCalled()

    vi.advanceTimersByTime(BASE_DELAY + 25 - 1)
    expect(self.handleMouseOut).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(self.handleMouseOut).toHaveBeenCalledWith(opt)
  })

  it('leaving the plot toward a box below it defers the close', () => {
    vi.useFakeTimers()
    const { self } = leavePlot(160, 165, {
      placement: 'bottom',
      rect: { left: 100, top: 170, width: 120, height: 60 },
    })
    expect(self.handleMouseOut).not.toHaveBeenCalled()
    vi.advanceTimersByTime(BASE_DELAY + 25)
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
  })

  it('the deferred close keeps the captured point, so a click in the box still reports it', () => {
    vi.useFakeTimers()
    const { self } = leavePlot(160, 115, {
      interact: { capturedSeriesIndex: 1, capturedDataPointIndex: 4 },
    })
    expect(self.handleMouseOut).not.toHaveBeenCalled()
    expect(self.w.interact.capturedSeriesIndex).toBe(1)
    expect(self.w.interact.capturedDataPointIndex).toBe(4)
  })

  it('leaving away from the box closes at once and drops the captured point', () => {
    const { self } = leavePlot(160, 170, {
      interact: { capturedSeriesIndex: 1, capturedDataPointIndex: 4 },
    })
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
    expect(self.w.interact.capturedSeriesIndex).toBe(-1)
    expect(self.w.interact.capturedDataPointIndex).toBe(-1)
  })

  it('leaving toward the box but out of its reach sideways closes at once', () => {
    const { self } = leavePlot(220 + REACH + 1, 115)
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
  })

  it('a box placed beside its point gets no grace', () => {
    const { self } = leavePlot(160, 115, { shortPlotPlacement: false })
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
  })

  it('a tooltip that is not interactive gets no grace', () => {
    const { self } = leavePlot(160, 115, { interactive: false })
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
  })

  it('a chart destroyed during the grace does not close a dead tooltip', () => {
    vi.useFakeTimers()
    const { self } = leavePlot(160, 115)
    self.w.globals.isDestroyed = true
    vi.advanceTimersByTime(BASE_DELAY + TRAVEL_CAP)
    expect(self.handleMouseOut).not.toHaveBeenCalled()
  })

  it('leaving again toward the box restarts the wait from the new distance', () => {
    vi.useFakeTimers()
    // 5px under the box: 175ms
    const { self, opt } = leavePlot(160, 115)
    vi.advanceTimersByTime(100)
    // 2px under the box: 160ms from now
    move(self, opt, 160, 112)
    vi.advanceTimersByTime(75)
    expect(self.handleMouseOut).not.toHaveBeenCalled()
    vi.advanceTimersByTime(84)
    expect(self.handleMouseOut).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
  })

  it('coming back over the plot cancels a close deferred on the way out', () => {
    vi.useFakeTimers()
    const { self, opt } = leavePlot(160, 115)
    canPassOverPlot(self)

    move(self, opt, 160, 140)
    vi.advanceTimersByTime(BASE_DELAY + TRAVEL_CAP)
    expect(self.handleMouseOut).not.toHaveBeenCalled()
  })

  it('coming back over the plot leaves a non-interactive tooltip alone (control)', () => {
    vi.useFakeTimers()
    const { self, opt } = leavePlot(160, 170, { interactive: false })
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
    canPassOverPlot(self)
    move(self, opt, 160, 140)
    expect(self.handleMouseOut).toHaveBeenCalledTimes(1)
  })
})

// ===========================================================================
// The plot origin. Pointers and marks are measured from the plot's own corner
// (the svg plus translateX/Y), never from the `.apexcharts-grid` group's box:
// a browser lays that out a pixel below the plot, and on a numeric-x bar chart
// its gridlines reach `barPadForNumericAxis` past both sides.
// ===========================================================================

describe('the plot origin, not the grid group box', () => {
  const BAR_PAD = 60

  /** Lay the grid group's box out as a browser does on a numeric-x bar chart. */
  function offsetGridBox(elGrid) {
    const g = elGrid.getBoundingClientRect()
    setRect(elGrid, {
      left: g.left - BAR_PAD,
      top: g.top + 1,
      width: g.width + 2 * BAR_PAD,
      height: g.height - 1,
    })
  }

  it('TooltipUtils.plotRect is the svg plus the plot translate', () => {
    const { w, elGrid } = makeCtx()
    offsetGridBox(elGrid)
    // svg at (100, 200), translate (50, 20), a 300 x 40 plot
    expect(TooltipUtils.plotRect(w)).toEqual({
      left: 150,
      top: 220,
      width: 300,
      height: 40,
      zoom: 1,
    })
  })

  it('TooltipUtils.plotRect scales with a CSS zoom on the container', () => {
    const { w, baseEl } = makeCtx()
    // drawn 400 wide, measured 200 wide
    setRect(baseEl.querySelector('.apexcharts-svg'), {
      left: 100,
      top: 200,
      width: 200,
      height: 50,
    })
    expect(TooltipUtils.plotRect(w)).toEqual({
      left: 125,
      top: 210,
      width: 150,
      height: 20,
      zoom: 0.5,
    })
  })

  /**
   * Move the svg `dy` down inside elWrap, as `chart.offsetY` does (Core
   * translates the root svg by it); translateY does not include it.
   */
  function offsetSvg({ baseEl, elWrap }, dy) {
    const wrap = elWrap.getBoundingClientRect()
    setRect(baseEl.querySelector('.apexcharts-svg'), {
      left: wrap.left,
      top: wrap.top + dy,
      width: wrap.width,
      height: wrap.height,
    })
  }

  it('TooltipUtils.plotInWrap is the plot corner in elWrap px, chart.offsetY included', () => {
    const ctx = makeCtx()
    expect(TooltipUtils.plotInWrap(ctx.w)).toEqual({ left: 50, top: 20 })
    offsetSvg(ctx, 20)
    expect(TooltipUtils.plotInWrap(ctx.w)).toEqual({ left: 50, top: 40 })
  })

  it('a heatmap arrow lands on the hovered cell under chart.offsetY, SVG cell or canvas', () => {
    for (const canvas of [false, true]) {
      // a 400px-tall plot so the box fits above the cell inside it
      const ctx = makeCtx({
        gridHeight: 300,
        ttHeight: 50,
        wrapRect: { left: 100, top: 200, width: 400, height: 360 },
      })
      const { w, ttCtx, elGrid, tooltipEl } = ctx
      offsetSvg(ctx, 20)
      tooltipEl.dataset.positioned = 'true'
      w.config.chart.type = 'heatmap'
      w.interact = {}
      ttCtx.tooltipLabels = { drawSeriesTexts: vi.fn() }
      const pos = new TooltipPosition(ttCtx)
      vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
      ttCtx.tooltipPosition = pos
      // the cell at plot-local (100, 120), 40 x 30: on screen at
      // (100 + 50 + 100, 200 + 20 + 20 + 120)
      const target = document.createElementNS(SVG_NS, 'rect')
      if (canvas) {
        w.globals.activeRenderer = {
          kind: 'canvas',
          hitTest: vi.fn(() => ({
            seriesIndex: 0,
            dataPointIndex: 0,
            x: 100,
            y: 120,
            width: 40,
            height: 30,
          })),
        }
      } else {
        target.setAttribute('class', 'apexcharts-heatmap-rect')
        const attrs = { i: 0, j: 0, cx: 100, cy: 120, width: 40, height: 30 }
        for (const [k, v] of Object.entries(attrs))
          target.setAttribute(k, String(v))
        setRect(target, { left: 250, top: 360, width: 40, height: 30 })
        w.dom.baseEl.appendChild(target)
      }
      new Intersect(ttCtx).handleHeatTreeTooltip({
        e: { type: 'mousemove', target, clientX: 270, clientY: 375 },
        opt: { elGrid, ttItems: [] },
        x: 0,
        y: 0,
        type: 'heatmap',
      })
      // above the cell, whose top is elWrap y 160, the arrow on its middle
      expect(tooltipEl.dataset.placement, `canvas: ${canvas}`).toBe('top')
      expect(tooltipEl.style.top, `canvas: ${canvas}`).toBe(
        160 - GAP - 50 + 'px',
      )
      expect(tooltipEl.style.left, `canvas: ${canvas}`).toBe(170 - 50 + 'px')
      document.body.innerHTML = ''
    }
  })

  it('a canvas heatmap hit-tests the pointer in plot px under a CSS zoom', () => {
    const { w, ttCtx, elGrid, baseEl } = makeCtx()
    // drawn 400 wide, measured 200 wide: the plot corner at (125, 210)
    setRect(baseEl.querySelector('.apexcharts-svg'), {
      left: 100,
      top: 200,
      width: 200,
      height: 50,
    })
    w.config.chart.type = 'heatmap'
    w.interact = {}
    const hitTest = vi.fn(() => null)
    w.globals.activeRenderer = { kind: 'canvas', hitTest }
    new Intersect(ttCtx).handleHeatTreeTooltip({
      e: { type: 'mousemove', target: document.createElement('div') },
      opt: { elGrid, ttItems: [], clientX: 145, clientY: 220 },
      x: 0,
      y: 0,
      type: 'heatmap',
    })
    expect(hitTest).toHaveBeenCalledWith(40, 20)
  })

  it('a short-plot box sits its gap above the bars under chart.offsetY', () => {
    const ctx = makeCtx()
    offsetSvg(ctx, 20)
    const { w } = ctx
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('class', 'apexcharts-bar-series')
    const bar = document.createElementNS(SVG_NS, 'path')
    bar.setAttribute('j', '1')
    // elWrap y 50..60: the plot (elWrap 40..80) moved down with the svg
    setRect(bar, { left: 200, top: 250, width: 20, height: 10 })
    g.appendChild(bar)
    w.dom.baseEl.appendChild(g)
    // in the space moveTooltip reads a mark in: it adds translateY (20)
    expect(new TooltipPosition(ctx.ttCtx)._barsExtentInGrid(1)).toEqual({
      top: 30,
      bottom: 40,
    })
  })

  it('a canvas heatmap hit-tests the pointer from the plot corner', () => {
    const { w, ttCtx, elGrid } = makeCtx()
    offsetGridBox(elGrid)
    w.config.chart.type = 'heatmap'
    w.interact = {}
    const hitTest = vi.fn(() => null)
    w.globals.activeRenderer = { kind: 'canvas', hitTest }

    const result = new Intersect(ttCtx).handleHeatTreeTooltip({
      e: { type: 'mousemove', target: document.createElement('div') },
      opt: { elGrid, ttItems: [], clientX: 180, clientY: 240 },
      x: 0,
      y: 0,
      type: 'heatmap',
    })
    // plot corner (150, 220); a pixel short of that hit the row above
    expect(hitTest).toHaveBeenCalledWith(30, 20)
    expect(result.noHit).toBe(true)
  })

  it('a hovered bar is measured from the plot corner', () => {
    const { w, ttCtx, elGrid } = makeCtx()
    offsetGridBox(elGrid)
    w.interact = {}
    ttCtx.tooltipLabels = { drawSeriesTexts: vi.fn() }
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('rel', '1')
    const bar = document.createElementNS(SVG_NS, 'path')
    bar.setAttribute('class', 'apexcharts-bar-area')
    const attrs = { j: 2, cx: 40, cy: 10, barWidth: 20 }
    for (const [k, v] of Object.entries(attrs)) bar.setAttribute(k, String(v))
    g.appendChild(bar)
    // grid-local 30..50 x 10..40
    setRect(bar, { left: 180, top: 230, width: 20, height: 30 })

    const r = new Intersect(ttCtx).getBarTooltipXY({
      e: { type: 'mousemove', target: bar, clientX: 190, clientY: 240 },
      opt: { elGrid, ttItems: [] },
    })
    expect(r.barRectInGrid).toEqual({
      left: 30,
      top: 10,
      right: 50,
      bottom: 40,
    })
    // the crosshair's centre, which rode BAR_PAD to the right of the bar
    expect(r.barAnchorXInGrid).toBe(40)
  })

  it('the column crosshair goes to the bar centre in plot px under a CSS zoom', () => {
    const { w, ttCtx, elGrid, baseEl } = makeCtx({ chart: { type: 'bar' } })
    // drawn 400 wide, measured 200 wide: the plot corner at (125, 210)
    setRect(baseEl.querySelector('.apexcharts-svg'), {
      left: 100,
      top: 200,
      width: 200,
      height: 50,
    })
    w.interact = {}
    ttCtx.tConfig = w.config.tooltip
    ttCtx.tooltipLabels = { drawSeriesTexts: vi.fn() }
    ttCtx.tooltipUtil = { hasBars: () => true }
    const pos = new TooltipPosition(ttCtx)
    const band = vi.spyOn(pos, 'moveXCrosshairs').mockImplementation(() => {})
    ttCtx.tooltipPosition = pos
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('rel', '1')
    const bar = document.createElementNS(SVG_NS, 'path')
    bar.setAttribute('class', 'apexcharts-bar-area')
    const attrs = { j: 2, cx: 40, cy: 10, barWidth: 20 }
    for (const [k, v] of Object.entries(attrs)) bar.setAttribute(k, String(v))
    g.appendChild(bar)
    // on screen 10 wide from x 140: plot px 30..50, centre 40
    setRect(bar, { left: 140, top: 215, width: 10, height: 15 })

    new Intersect(ttCtx).handleBarTooltip({
      e: { type: 'mousemove', target: bar, clientX: 145, clientY: 220 },
      opt: { elGrid, ttItems: [] },
    })
    expect(band).toHaveBeenCalledWith(40)
  })

  it('a followCursor box is placed from the pointer in plot coords', () => {
    const { ttCtx, elGrid } = makeCtx({
      wrapRect: { left: 0, top: 300, width: 400, height: 100 },
      tooltip: { followCursor: true },
    })
    offsetGridBox(elGrid)
    // plot corner (50, 320): the pointer is elWrap-local (250, 30)
    ttCtx.clientX = 250
    ttCtx.clientY = 330
    const r = new TooltipPosition(ttCtx).computeTooltipPosition(50, 10, 5)
    expect(r).toMatchObject({
      x: 250 - 50,
      y: 30 - GAP - 50,
      placement: 'top',
      arrowX: 50,
    })
  })

  it('a horizontal row is measured from the plot corner', () => {
    const { w, ttCtx, elGrid, tooltipEl } = makeCtx(TALL)
    offsetGridBox(elGrid)
    tooltipEl.dataset.positioned = 'true'
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('class', 'apexcharts-bar-series')
    const bar = document.createElementNS(SVG_NS, 'path')
    bar.setAttribute('j', '0')
    // plot corner (50, 420); the row at grid-local y 120..150
    setRect(bar, { left: 50, top: 540, width: 200, height: 30 })
    g.appendChild(bar)
    w.dom.baseEl.appendChild(g)

    new TooltipPosition(ttCtx).placeHorizontalSharedTooltip(0)
    expect(tooltipEl.style.top).toBe(20 + 120 - 230 - ARROW_TIP_OVERHANG + 'px')
  })

  it('a keyboard-focused point is handed over at the plot corner plus the point', () => {
    const { w, ttCtx, elGrid } = makeCtx()
    offsetGridBox(elGrid)
    w.config.chart.type = 'line'
    // series 0, point 1 at plot-local (40, 12)
    w.globals.pointsArray = [
      [
        [0, 0],
        [40, 12],
      ],
    ]

    KeyboardNavigation.prototype._setSyntheticEvent.call(
      {
        w,
        _getFocusableElement: () => null,
        _canvasCell: () => null,
        _canvasMark: () => null,
        _isBarLikeSeries: () => false,
      },
      0,
      1,
      ttCtx,
    )
    expect(ttCtx.e).toEqual({ type: 'mousemove', clientX: 190, clientY: 232 })
  })
})
