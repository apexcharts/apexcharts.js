// @ts-check
import Config from './settings/Config'
import Utils from '../utils/Utils'
import CoreUtils from './CoreUtils'
import { Environment } from '../utils/Environment.js'

/**
 * Deep-merge a single responsive yaxis override onto the corresponding base
 * yaxis entry while ignoring keys whose value is `undefined`. CoreUtils
 * `extendArrayProps` populates the responsive `yaxis` entry with the full
 * default yAxis schema, including keys whose default value is `undefined`
 * (e.g. `min`, `max`, `title.text`). A plain `Utils.extend` would let those
 * undefined defaults overwrite explicit values on the base axis.
 *
 * @param {any} base
 * @param {any} override
 */
function mergeYaxisOverride(base, override) {
  if (!Utils.isObject(base) || !Utils.isObject(override)) {
    return override !== undefined ? override : base
  }
  const out = { ...base }
  for (const key of Object.keys(override)) {
    const v = override[key]
    if (v === undefined) continue
    if (Utils.isObject(v) && Utils.isObject(base[key])) {
      out[key] = mergeYaxisOverride(base[key], v)
    } else {
      out[key] = v
    }
  }
  return out
}

/**
 * The leaf paths a breakpoint's options write, walked against the config they
 * are applied to. A key descends only while both sides are plain objects, so
 * an array (`yaxis`, `annotations.points`) or a value replacing an object is
 * one leaf, restored whole.
 *
 * @param {any} layer
 * @param {any} base
 * @param {string[]} prefix
 * @param {string[][]} out
 */
function collectPaths(layer, base, prefix, out) {
  for (const key of Object.keys(layer)) {
    const path = [...prefix, key]
    const v = layer[key]
    const b = Utils.isObject(base) ? base[key] : undefined
    if (Utils.isObject(v) && Utils.isObject(b)) {
      collectPaths(v, b, path, out)
    } else {
      out.push(path)
    }
  }
  return out
}

/**
 * @param {any} obj
 * @param {string[]} path
 * @returns {{ found: boolean, value?: any }}
 */
function lookup(obj, path) {
  let o = obj
  for (const k of path) {
    if (!Utils.isObject(o) || !(k in o)) return { found: false }
    o = o[k]
  }
  return { found: true, value: o }
}

/**
 * Writes `value` at `path`, copying every object on the way so a config that
 * shares nested objects with another (Utils.extend does) is not written
 * through. `obj` itself must already be a fresh copy. An `undefined` value
 * removes the key, so Config.init fills in the default again.
 *
 * @param {any} obj
 * @param {string[]} path
 * @param {any} value
 */
function setPath(obj, path, value) {
  let o = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (!Utils.isObject(o[path[i]])) return
    o[path[i]] = { ...o[path[i]] }
    o = o[path[i]]
  }
  const last = path[path.length - 1]
  if (value === undefined) delete o[last]
  else o[last] = Utils.clone(value)
}

/**
 * ApexCharts Responsive Class to override options for different screen sizes.
 *
 * A breakpoint's options are a layer over the user's config, which is the
 * constructor options plus every updateOptions() payload. Applying the layer
 * records what each path it writes held beforehand; removing it writes those
 * values back. Nothing else is touched, so whatever changed outside the
 * layer's paths in the meantime (an updateOptions() title, collapsed series,
 * zoom bounds) survives leaving the breakpoint, and the layer's own values
 * never outlive it (#5347).
 *
 * @module Responsive
 **/

export default class Responsive {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
    /** @type {number | null} tracks which breakpoint is currently active (null = none) */
    this._activeBreakpoint = null
    /**
     * What the active breakpoints overwrote: dotted path to the path and the
     * user's value there. Empty while no breakpoint applies.
     * @type {Map<string, { path: string[], value: any }>}
     */
    this._base = new Map()
  }

  /**
   * Folds an options payload into the recorded user values, so a path the
   * active breakpoint also sets takes the payload's value once the breakpoint
   * is left. While the breakpoint applies, it still wins over the payload.
   *
   * @param {Record<string, any> | null | undefined} opts
   */
  absorb(opts) {
    if (!opts || !this._base.size) return
    for (const entry of this._base.values()) {
      const hit = lookup(opts, entry.path)
      if (!hit.found) continue
      entry.value =
        Utils.isObject(hit.value) && Utils.isObject(entry.value)
          ? Utils.extend(entry.value, hit.value)
          : Utils.clone(hit.value)
    }
  }

  /**
   * A copy of `config` with every path the active breakpoints set put back to
   * the user's value: the config the chart would have with no breakpoint
   * active. Snapshots that outlive the breakpoint (initialConfig, Rewind
   * checkpoints) are taken from this, never from w.config.
   *
   * @param {Record<string, any>} config
   */
  withoutBreakpoints(config) {
    const out = { ...config }
    for (const { path, value } of this._base.values()) {
      setPath(out, path, value)
    }
    return out
  }

  // the opts parameter if not null has to be set overriding everything
  // as the opts is set by user externally
  /**
   * @param {object} opts
   */
  checkResponsiveConfig(opts) {
    const w = this.w
    const cnf = w.config
    const res = (cnf.responsive || []).slice()

    // Nothing applied and nothing to apply: leave w.config alone. Re-deriving
    // it on every render above the largest breakpoint broke updateSeries()
    // with a changed series count (#2056).
    if (res.length === 0 && this._activeBreakpoint === null) return

    res
      .sort(
        (
          /** @type {{ breakpoint: number }} */ a,
          /** @type {{ breakpoint: number }} */ b,
        ) =>
          a.breakpoint > b.breakpoint
            ? 1
            : b.breakpoint > a.breakpoint
              ? -1
              : 0,
      )
      .reverse()

    const width = Environment.isBrowser()
      ? window.innerWidth > 0
        ? window.innerWidth
        : screen.width
      : 0

    // Largest first, so a smaller breakpoint's options win where they overlap.
    const matching = res.filter(
      (/** @type {{ breakpoint: number }} */ r) => width < r.breakpoint,
    )
    if (matching.length === 0 && this._activeBreakpoint === null) return

    const config = new Config({})

    this.absorb(opts)

    // Start from the live config, so everything outside the breakpoints'
    // paths (series, collapsed state, zoom, earlier payloads) carries over.
    // The series stay as they are: a payload's series were already merged,
    // and merging them again would undo the collapsed-series reconcile.
    let cfg = Utils.extend({}, cnf)
    if (opts) {
      const { series: _series, ...rest } = /** @type {any} */ (opts)
      cfg = Utils.extend(cfg, CoreUtils.extendArrayProps(config, rest, w))
    }

    // Take off whatever the previous render's breakpoints applied, then put
    // on the ones that match now. Moving between breakpoints is the same
    // derivation, so a key only the smaller one set does not stay behind.
    cfg = this.withoutBreakpoints(cfg)
    this._base = new Map()
    this._activeBreakpoint = null

    if (matching.length) {
      for (const r of matching) {
        for (const path of collectPaths(r.options || {}, cfg, [], [])) {
          const key = path.join('.')
          if (!this._base.has(key)) {
            this._base.set(key, {
              path,
              value: Utils.clone(lookup(cfg, path).value),
            })
          }
        }
      }

      for (const r of matching) {
        // Capture the user-provided yaxis override BEFORE
        // CoreUtils.extendArrayProps fills it with default schema values,
        // so we can tell which keys the user actually set.
        const originalUserYaxis = r.options?.yaxis
          ? Utils.clone(r.options.yaxis)
          : null
        const baseYaxis = cfg.yaxis
        // On a copy: extendYAxis writes a logarithmic breakpoint's yaxis out
        // into one axis per series, named after the series of this render.
        // Kept on r.options, those names were merged back over the axes of
        // every later render, after the series were reordered (#5353).
        cfg = Utils.extend(
          cfg,
          CoreUtils.extendArrayProps(config, Utils.clone(r.options), w),
        )
        // Utils.extend does not deep-merge arrays, so a responsive `yaxis`
        // array silently replaces the entire base `yaxis`, losing base
        // settings not re-declared in the responsive options. Re-merge
        // each yaxis entry with the corresponding base entry using only
        // keys the user explicitly set in the responsive options.
        if (Array.isArray(baseYaxis) && originalUserYaxis) {
          const userYaxis = Array.isArray(originalUserYaxis)
            ? originalUserYaxis
            : [originalUserYaxis]
          cfg = {
            ...cfg,
            yaxis: baseYaxis.map((baseAxis, idx) =>
              mergeYaxisOverride(baseAxis, userYaxis[idx]),
            ),
          }
        }
        this._activeBreakpoint = r.breakpoint
      }
    }

    this.overrideResponsiveOptions(cfg)
  }

  /**
   * @param {Record<string, any>} newOptions
   */
  overrideResponsiveOptions(newOptions) {
    const newConfig = new Config(newOptions).init({ responsiveOverride: true })
    this.w.config = /** @type {any} */ (newConfig)
  }
}
