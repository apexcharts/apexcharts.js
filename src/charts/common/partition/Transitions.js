// @ts-check
/**
 * The render-side transition scaffold the partition charts share.
 *
 * The sunburst and the icicle lay the same tree out in different coordinates,
 * and they move between layouts by the same rules: which transition a render
 * runs, on which clock, how a newer pass supersedes an older one, how a
 * re-render picks up the geometry the previous one left on screen, and when
 * the labels may appear. Each chart keeps only its geometry (arcs or boxes);
 * a fix to these rules lands in both at once.
 *
 * Pure helpers with no shared-module dependency, so each add-on bundle inlines
 * its own copy and nothing new crosses the core boundary.
 *
 * @module charts/common/partition/Transitions
 */

/**
 * Average glyph advance as a fraction of the font size, for fitting a label
 * without measuring it.
 */
export const CHAR_W_EM = 0.58

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
export const lerp = (a, b, t) => a + (b - a) * t

/**
 * Which transition a render runs, with the same gating as the pie family: an
 * intro on the first render, a morph from the previous on-screen geometry on a
 * data update (never an instant re-render while animations are on), nothing on
 * a resize. `updateSeries(data, false)` asks for no animation and gets none.
 *
 * A zoom is not a render: the chart asks for `'zoom'` itself.
 *
 * @param {any} w
 * @returns {'intro'|'update'|'none'}
 */
export function resolveMode(w) {
  const anims = w.config.chart.animations
  if (!anims.enabled) return 'none'
  if (w.globals.dataChanged) {
    return anims.dynamicAnimation.enabled && w.globals.shouldAnimate !== false
      ? 'update'
      : 'none'
  }
  return w.globals.resized ? 'none' : 'intro'
}

/**
 * How long a transition runs. The intro is paced by `animations.speed`. An
 * update or a zoom answers something the reader did, so it runs on the
 * interaction clock (`dynamicAnimation.speed`): on the intro's clock a click
 * took 800ms by default, which reads as lag rather than motion.
 *
 * @param {any} w
 * @param {'intro'|'zoom'|'update'|'none'} mode
 * @returns {number}
 */
export function durationFor(w, mode) {
  const anims = w.config.chart.animations
  if (!anims.enabled || mode === 'none') return 0
  if (mode === 'intro') return anims.speed ?? 500
  const dyn = anims.dynamicAnimation
  return dyn.enabled ? (dyn.speed ?? 350) : 0
}

/**
 * Reveal an overlay group once the marks under it have settled (the repo
 * convention: an overlay never pops in over a moving shape).
 *
 * `alive` is asked on every frame, so a superseded pass's fade cannot reveal
 * labels over marks a newer pass is still moving.
 *
 * @param {any} group  svg.js group
 * @param {number} dur  how long the marks move (0 = show at once)
 * @param {() => boolean} alive
 */
export function fadeInAfter(group, dur, alive) {
  group.attr({ opacity: dur > 0 ? 0 : 1 })
  if (dur > 0) {
    group.animate(250, dur).during((/** @type {number} */ p) => {
      if (alive()) group.attr({ opacity: p })
    })
  }
}

/**
 * Stash what is on screen for the NEXT render to tween from. The chart module
 * is re-instantiated on every render, so the stash lives on the persistent
 * chart context, keyed by each node's hierarchical key.
 *
 * @param {any} ctx  the chart context
 * @param {string} slot  the context property this chart stashes under
 * @param {any[]} nodes
 * @param {(n: any) => any} entry  what to keep for a node; falsy skips it
 */
export function handOffGeoms(ctx, slot, nodes, entry) {
  const geoms = new Map()
  nodes.forEach((n) => {
    const e = entry(n)
    if (e) geoms.set(n._key, e)
  })
  ctx[slot] = geoms
}
