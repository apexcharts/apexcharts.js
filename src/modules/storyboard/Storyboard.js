// @ts-check
import { Environment } from '../../utils/Environment.js'
import { prefersReducedMotion } from '../Animations'

/**
 * Storyboard: scroll-driven chart choreography (scrollytelling).
 *
 * The page's prose is split into "beats". As the reader scrolls a beat's
 * element across a trigger line in the viewport, the chart morphs to that
 * beat's view; scrolling back up reverses to the previous beat. A beat's view
 * is a Perspectives token (object or encoded string), so a beat describes the
 * WHOLE view (zoom window, collapsed series, annotations, theme): applying it
 * is idempotent, which is what makes scrubbing in both directions safe.
 *
 * Driven by IntersectionObserver (works in every modern browser and inside
 * any scroll container), not by scroll events: no per-frame work, no scroll
 * jank. Under prefers-reduced-motion the beat still applies, without
 * animation (a cut instead of a morph).
 *
 * Eager module (like perspectives): constructed once in InitCtxVariables so
 * bindings survive update()/re-render (the observed elements are page prose,
 * outside the chart's DOM) and are dropped on a full destroy().
 *
 * Public API (namespaced under chart.storyboard):
 *   chart.storyboard.bind(opts)   -> number of beats bound
 *     opts.beats:   [{ el | selector, view?, options?, announce?, onEnter?, key? }]
 *                   view: a bare ViewState object (hand-authored shorthand),
 *                   a full Perspective token, or an encoded token string,
 *                   applied via chart.perspectives.apply.
 *                   options: an updateOptions payload merged into the SAME
 *                   render as the view, so a beat can restyle or swap
 *                   chart.type: one render keeps the transition animated and
 *                   lets a cross-type morph (morph feature) play out. Options
 *                   are not part of the view contract: like the view, a beat
 *                   should carry every option it depends on, since
 *                   updateOptions merges. onEnter(chart, info) is the escape
 *                   hatch for arbitrary per-beat work.
 *     (no beats):   auto-discovers [data-apex-beat] elements in document
 *                   order; data-apex-view carries an encoded token and
 *                   data-apex-announce a screen-reader announcement.
 *     opts.scroller: element or selector of a custom scroll container
 *                   (default: the viewport).
 *     opts.offset:  0..1 fraction of the viewport height where the trigger
 *                   line sits (default 0.5, the vertical midline).
 *     opts.animate: animate beat transitions (default true; forced off by
 *                   prefers-reduced-motion).
 *   chart.storyboard.goTo(indexOrKey, { animate }) -> apply a beat directly
 *   chart.storyboard.current()  -> { index, key } | null
 *   chart.storyboard.unbind()
 *
 * Fires the `beatChange` chart event with
 * { index, key, el, direction: 'up' | 'down' } on every beat activation.
 *
 * @module Storyboard
 */

/**
 * @typedef {Object} StoryboardBeat
 * @property {Element} el              the prose element that triggers the beat
 * @property {string | null} key       author key (data-apex-beat value or beats[].key)
 * @property {any} [view]              ViewState object, Perspective token or encoded string
 * @property {any} [options]           updateOptions payload merged into the view's render
 * @property {string} [announce]       aria-live announcement text
 * @property {((chart: any, info: StoryboardBeatInfo) => void) | undefined} [onEnter]
 */

/**
 * @typedef {Object} StoryboardBeatInfo
 * @property {number} index
 * @property {string | null} key
 * @property {Element} el
 * @property {'up' | 'down'} direction
 */

export default class Storyboard {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** @type {StoryboardBeat[]} */
    this._beats = []
    /** @type {IntersectionObserver | null} */
    this._observer = null
    this._activeIndex = -1
    this._animate = true
    this._warnedNoPerspectives = false
  }

  /**
   * Bind beats to scroll position. Rebinding replaces the previous binding.
   * @param {{
   *   beats?: Array<{ el?: Element, selector?: string, key?: string, view?: any, announce?: string, onEnter?: (chart: any, info: StoryboardBeatInfo) => void }>,
   *   scroller?: Element | string,
   *   offset?: number,
   *   animate?: boolean,
   * }} [opts]
   * @returns {number} the number of beats bound
   */
  bind(opts = {}) {
    this.unbind()

    if (!Environment.isBrowser()) return 0
    const doc = this.ctx.el && this.ctx.el.ownerDocument
    if (!doc || typeof IntersectionObserver === 'undefined') return 0

    /** @type {Element | null} */
    let root = null
    if (opts.scroller) {
      root =
        typeof opts.scroller === 'string'
          ? doc.querySelector(opts.scroller)
          : opts.scroller
    }

    this._beats = this._resolveBeats(doc, root, opts.beats)
    if (!this._beats.length) return 0

    this._animate = opts.animate !== false

    // Shrink the observation root to a zero-height band at `offset` of the
    // viewport (or custom scroller). A beat is active while it spans that
    // trigger line; entering it going down or leaving it going up drives the
    // step logic in _onIntersect.
    const offset = Math.min(Math.max(opts.offset ?? 0.5, 0), 1)
    const top = +(offset * 100).toFixed(3)
    const bottom = +(100 - offset * 100).toFixed(3)

    this._observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      { root, rootMargin: `-${top}% 0px -${bottom}%`, threshold: 0 },
    )
    this._beats.forEach((b) => this._observer?.observe(b.el))

    return this._beats.length
  }

  /**
   * Normalize the beats option, or auto-discover [data-apex-beat] elements in
   * document order when no explicit list is given.
   * @param {Document} doc
   * @param {Element | null} root
   * @param {Array<any>} [beatsOpt]
   * @returns {StoryboardBeat[]}
   * @private
   */
  _resolveBeats(doc, root, beatsOpt) {
    /** @type {StoryboardBeat[]} */
    const beats = []

    if (Array.isArray(beatsOpt)) {
      beatsOpt.forEach((b, i) => {
        if (!b) return
        const el =
          b.el && typeof b.el === 'object'
            ? b.el
            : b.selector
              ? doc.querySelector(b.selector)
              : null
        if (!el) {
          console.warn(
            `apexcharts: storyboard beat ${i} has no resolvable element; skipped.`,
          )
          return
        }
        beats.push({
          el,
          key: b.key ?? el.getAttribute('data-apex-beat') ?? String(i),
          view: b.view,
          options: b.options,
          announce: b.announce,
          onEnter: typeof b.onEnter === 'function' ? b.onEnter : undefined,
        })
      })
      return beats
    }

    const scope = root || doc
    scope.querySelectorAll('[data-apex-beat]').forEach((el, i) => {
      beats.push({
        el,
        key: el.getAttribute('data-apex-beat') || String(i),
        view: el.getAttribute('data-apex-view') || undefined,
        options: undefined,
        announce: el.getAttribute('data-apex-announce') || undefined,
        onEnter: undefined,
      })
    })
    return beats
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   * @private
   */
  _onIntersect(entries) {
    entries.forEach((entry) => {
      const idx = this._beats.findIndex((b) => b.el === entry.target)
      if (idx < 0) return

      if (entry.isIntersecting) {
        // The beat's element reached the trigger line: activate it. Covers
        // both scroll directions and the initial position on bind().
        this._activate(idx)
      } else if (idx === this._activeIndex && entry.rootBounds) {
        // The ACTIVE beat left the line. If its box now sits below the line
        // the reader scrolled up past its top edge: step back one beat.
        // (Leaving upward means the next beat is about to intersect and will
        // activate itself, so only the upward-scroll case is handled here.)
        if (
          entry.boundingClientRect.top >= entry.rootBounds.bottom &&
          idx > 0
        ) {
          this._activate(idx - 1)
        }
      }
    })
  }

  /**
   * Activate a beat: apply its view token, run its callback, announce it and
   * fire `beatChange`. Idempotent per beat (re-activating the current beat is
   * a no-op), so IO chatter never re-applies a view.
   * @param {number} idx
   * @param {{ animate?: boolean }} [opts]
   * @private
   */
  _activate(idx, opts = {}) {
    if (idx === this._activeIndex) return
    const beat = this._beats[idx]
    if (!beat) return

    /** @type {'up' | 'down'} */
    const direction = idx > this._activeIndex ? 'down' : 'up'
    this._activeIndex = idx

    const animate =
      (opts.animate !== undefined ? opts.animate : this._animate) &&
      !prefersReducedMotion()

    if (beat.view != null || beat.options) {
      if (this.ctx.perspectives) {
        // A beat's view may be an encoded string, a full Perspective token
        // ({ view: ... }), or, the hand-authored shorthand, a bare ViewState
        // object: wrap and normalize the latter so authors write
        // view: { window: ... } and a beat describes the WHOLE target state.
        const v = beat.view ?? {}
        const token =
          typeof v === 'string' || v.view ? v : { view: this._normalizeView(v) }
        // The beat's option overrides ride the SAME render as the view: a
        // separate follow-up updateOptions would kill the view's animation
        // mid-flight, and merging lets a chart.type change morph (morph
        // feature) inside the one re-render.
        this.ctx.perspectives.apply(token, {
          animate,
          mergeOptions: beat.options,
        })
      } else if (!this._warnedNoPerspectives) {
        this._warnedNoPerspectives = true
        console.warn(
          'apexcharts: storyboard beats carry views but the perspectives feature is not bundled. import "apexcharts/features/storyboard" (which includes it) or drive beats via onEnter.',
        )
      }
    }

    /** @type {StoryboardBeatInfo} */
    const info = { index: idx, key: beat.key, el: beat.el, direction }

    if (beat.onEnter) beat.onEnter(this.ctx, info)
    if (beat.announce) this._announce(beat.announce)

    if (typeof this.w.config.chart.events.beatChange === 'function') {
      this.w.config.chart.events.beatChange(this.ctx, info)
    }
    // fireEvent applies an args ARRAY to addEventListener handlers, so pass
    // [chart, info] like the other feature events (filterChange etc.).
    this.ctx.events?.fireEvent('beatChange', [this.ctx, info])
  }

  /**
   * Fill in the parts of a hand-authored (bare) ViewState that would
   * otherwise LEAK between beats. updateOptions merges objects, so a beat
   * listing only xaxis annotations would keep a previous beat's point
   * annotations; padding every annotation kind with an empty array makes
   * each beat fully describe its own state, which is what allows scrubbing
   * in both directions. Full tokens (from capture()/encode()) already carry
   * the complete set and never pass through here.
   * @param {any} view
   * @returns {any}
   * @private
   */
  _normalizeView(view) {
    const provided = (view.annotations && view.annotations.static) || {}
    return {
      ...view,
      annotations: {
        static: {
          points: [],
          xaxis: [],
          yaxis: [],
          texts: [],
          images: [],
          ...provided,
        },
        dynamic: (view.annotations && view.annotations.dynamic) || [],
      },
    }
  }

  /**
   * Programmatically jump to a beat by index or author key (also usable
   * without scrolling, e.g. from next/prev buttons).
   * @param {number | string} indexOrKey
   * @param {{ animate?: boolean }} [opts]
   */
  goTo(indexOrKey, opts = {}) {
    const idx =
      typeof indexOrKey === 'number'
        ? indexOrKey
        : this._beats.findIndex((b) => b.key === indexOrKey)
    if (idx >= 0 && idx < this._beats.length) this._activate(idx, opts)
  }

  /**
   * @returns {{ index: number, key: string | null } | null} the active beat
   */
  current() {
    if (this._activeIndex < 0) return null
    const beat = this._beats[this._activeIndex]
    return { index: this._activeIndex, key: beat ? beat.key : null }
  }

  /** Disconnect the observer and drop the beat list. */
  unbind() {
    if (this._observer) {
      this._observer.disconnect()
      this._observer = null
    }
    this._beats = []
    this._activeIndex = -1
  }

  /** Full-destroy cleanup (called from Destroy). */
  teardown() {
    this.unbind()
  }

  /**
   * Push a beat's announcement to the chart's visually-hidden aria-live
   * status region so screen-reader users follow the story too. No-op when
   * announcements are disabled or the region is absent.
   * @param {string} message
   * @private
   */
  _announce(message) {
    const w = this.w
    if (!w.config.chart.accessibility.announcements.enabled) return
    const baseEl = w.dom.baseEl
    if (!baseEl) return
    const region = baseEl.querySelector('.apexcharts-sr-status')
    if (!region) return
    // Clear-then-set so a repeated string is still re-announced.
    region.textContent = ''
    setTimeout(() => {
      region.textContent = message
    }, 0)
  }
}
