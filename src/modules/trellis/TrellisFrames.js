// @ts-check
/**
 * Trellis (#22, P5): shared type frames.
 *
 * Some chart types draw a domain that is NOT the data's own y values, or
 * carry a scale channel the shared-y machinery never sees. Left alone, each
 * panel derives that hidden frame from its OWN data and the panels silently
 * stop being comparable, which is the worst failure mode a trellis has. Each
 * frame here computes the ONE shared version over the union of all panels:
 *
 *   - histogram: one set of bin edges (explicit `range` + `binWidth` pushed
 *     into every panel) and the bin-COUNT y domain (the observations' own
 *     extent would be pushed otherwise, which is a different axis entirely)
 *   - violin: one KDE bandwidth (the auto Silverman rule differs per panel,
 *     so identical options can still smooth panels differently)
 *   - heatmap: one colorScale min/max (color IS the value channel; the
 *     min/max push uses the core's expand-not-clamp semantics, and union
 *     bounds contain every panel's data by construction)
 *   - bubble: one z (size) extent via plotOptions.bubble.minZ/maxZ
 *   - pie/donut/polarArea: per-panel radius from panel totals (radiusByTotal),
 *     area-true via sqrt, the only thing that makes a pie trellis honest
 *
 * Pure module: no DOM, no `w` mutation (reads the host's resolved config).
 *
 * @module modules/trellis/TrellisFrames
 */
import {
  computeBinning,
  binCounts,
  normalizeCounts,
  kernelDensity,
} from '../../charts/common/Stats'

/**
 * Chart types whose y AXIS does not carry the data values (heatmap rows are
 * categories; the radial types have no y axis at all): pushing the shared
 * value bounds into `yaxis.min/max` there is meaningless at best and breaks
 * the row axis at worst, so every yaxis push is skipped for them. Radar is
 * NOT here: its yaxis max IS the radial scale, so the normal shared-y push
 * is exactly what "shared max radius" means.
 */
const VALUELESS_Y = ['heatmap', 'pie', 'donut', 'polarArea', 'radialBar']

/** The radial family radiusByTotal applies to. */
const PIE_FAMILY = ['pie', 'donut', 'polarArea']

/**
 * @typedef {Object} TypeFrames
 * @property {Record<string, any>|null} plotOptions uniform plotOptions push for every panel
 * @property {{ min: number, max: number }|null} yExtentOverride drawn y domain when it is not the data's values
 * @property {boolean} skipYaxisPush no yaxis bounds push for this type
 * @property {boolean} forceSharedY group y modes are meaningless for this type
 * @property {((key: string) => number|null)|null} pieScaleOf per-panel customScale (radiusByTotal)
 * @property {string[]} warnings
 */

/**
 * Numeric observations of one series' data, mirroring the stats feature's
 * own extraction: plain numbers, [x, y] pairs, { x, y } objects.
 * @param {any} data
 * @returns {number[]}
 */
function observationValues(data) {
  /** @type {number[]} */
  const out = []
  if (!Array.isArray(data)) return out
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    /** @type {any} */
    let raw = d
    if (Array.isArray(d)) raw = d.length === 1 ? d[0] : d[1]
    else if (d && typeof d === 'object') raw = d.y !== undefined ? d.y : d.x
    const v = Number(raw)
    if (raw !== null && raw !== undefined && isFinite(v)) out.push(v)
  }
  return out
}

/**
 * Raw observation ARRAYS of one series' data (the violin/boxPlot raw form:
 * `{ x: 'A', y: [obs...] }`), flattened.
 * @param {any} data
 * @returns {number[]}
 */
function rawObservationArrays(data) {
  /** @type {number[]} */
  const out = []
  if (!Array.isArray(data)) return out
  data.forEach((/** @type {any} */ d) => {
    const y = d && typeof d === 'object' ? d.y : null
    if (!Array.isArray(y)) return
    y.forEach((/** @type {any} */ v) => {
      const n = Number(v)
      if (v !== null && v !== undefined && isFinite(n)) out.push(n)
    })
  })
  return out
}

/**
 * z values of one series' data ([x, y, z] triplets or { x, y, z } objects).
 * @param {any} data
 * @returns {number[]}
 */
function zValues(data) {
  /** @type {number[]} */
  const out = []
  if (!Array.isArray(data)) return out
  data.forEach((/** @type {any} */ d) => {
    /** @type {any} */
    let raw = null
    if (Array.isArray(d) && d.length > 2) raw = d[2]
    else if (d && typeof d === 'object') raw = d.z
    const n = Number(raw)
    if (raw !== null && raw !== undefined && isFinite(n)) out.push(n)
  })
  return out
}

/**
 * Compute the shared frames for one trellis render.
 *
 * @param {import('./TrellisSplit').TrellisSplitResult} splitResult
 * @param {Record<string, any>} cfg the trellis config (w.config.trellis)
 * @param {Record<string, any>} hostConfig the host's RESOLVED config (w.config),
 *   so plotOptions defaults (bins: 'auto', normalize: 'count', ...) are real
 * @param {string} chartType
 * @returns {TypeFrames}
 */
export function buildTypeFrames(splitResult, cfg, hostConfig, chartType) {
  /** @type {TypeFrames} */
  const frames = {
    plotOptions: null,
    yExtentOverride: null,
    skipYaxisPush: VALUELESS_Y.includes(chartType),
    forceSharedY: false,
    pieScaleOf: null,
    warnings: [],
  }
  const panels = splitResult.panels
  const plot = hostConfig?.plotOptions || {}

  // Histogram: one shared bin frame over the union sample. The stats feature
  // already enforces one set of edges across SERIES for exactly this reason;
  // a trellis extends that to panels by pushing an explicit range + binWidth,
  // which pins the edges no matter what each panel's own extent is.
  if (chartType === 'histogram') {
    const hcfg = plot.histogram || {}
    /** @type {number[]} */
    let union = []
    /** @type {number[][][]} per panel, per series */
    const panelSeriesVals = panels.map((p) =>
      p.series.map((/** @type {any} */ s) => {
        const vals = observationValues(s.data)
        union = union.concat(vals)
        return vals
      }),
    )
    const binning = computeBinning(union, {
      bins: hcfg.bins,
      binWidth: hcfg.binWidth,
      range: hcfg.range,
    })
    if (binning && binning.edges.length > 1) {
      const edges = binning.edges
      frames.plotOptions = {
        histogram: {
          range: [edges[0], edges[edges.length - 1]],
          binWidth: binning.binWidth,
        },
      }
      // The drawn y domain is bin counts (normalized per the shared config),
      // not the observations: share the union's tallest bin.
      let maxY = 0
      panelSeriesVals.forEach((seriesVals) =>
        seriesVals.forEach((vals) => {
          if (!vals.length) return
          const ys = normalizeCounts(binCounts(vals, edges), {
            normalize: hcfg.normalize,
            cumulative: hcfg.cumulative,
            binWidth: binning.binWidth,
          })
          ys.forEach((/** @type {number} */ v) => {
            if (isFinite(v) && v > maxY) maxY = v
          })
        }),
      )
      if (maxY > 0) frames.yExtentOverride = { min: 0, max: maxY }
      const yMode = cfg.scales?.y || 'shared'
      if (yMode === 'independent-row' || yMode === 'independent-column') {
        frames.forceSharedY = true
        frames.warnings.push(
          "histogram trellis: group y scales would re-derive counts per group; using scales.y 'shared' (use 'independent' for per-panel count scales).",
        )
      }
    }
  }

  // Violin: one KDE bandwidth. With no explicit kde.bandwidth, each panel
  // would run Silverman's rule on its own sample and smooth differently;
  // deriving it once over the union keeps the shapes comparable.
  if (chartType === 'violin') {
    const kde = plot.violin?.kde || {}
    if (!(typeof kde.bandwidth === 'number' && kde.bandwidth > 0)) {
      /** @type {number[]} */
      let union = []
      panels.forEach((p) =>
        p.series.forEach((/** @type {any} */ s) => {
          union = union.concat(rawObservationArrays(s.data))
        }),
      )
      const est = union.length
        ? kernelDensity(union, { resolution: 8 })
        : null
      if (est && isFinite(est.bandwidth) && est.bandwidth > 0) {
        frames.plotOptions = {
          violin: { kde: { bandwidth: est.bandwidth } },
        }
      }
    }
  }

  // Heatmap: color IS the value channel, and its scale MUST be shared or the
  // same color means different values per panel. Explicit user ranges are an
  // absolute mapping and therefore already shared; otherwise push the union
  // extent (expand-not-clamp in the core, so this only ever widens).
  if (chartType === 'heatmap') {
    if (cfg.scales?.color === 'independent') {
      frames.warnings.push(
        "a heatmap trellis must share its color scale (the same color meaning different values per panel is a silent lie); ignoring scales.color 'independent'.",
      )
    }
    const userRanges = plot.heatmap?.colorScale?.ranges
    if (!(Array.isArray(userRanges) && userRanges.length > 0)) {
      let min = Infinity
      let max = -Infinity
      panels.forEach((p) =>
        p.series.forEach((/** @type {any} */ s) => {
          observationValues(s.data).forEach((v) => {
            if (v < min) min = v
            if (v > max) max = v
          })
        }),
      )
      if (isFinite(min) && isFinite(max)) {
        frames.plotOptions = {
          heatmap: { colorScale: { min, max } },
        }
      }
    }
  }

  // Bubble: the z (size) scale must be shared, or a small bubble in one
  // panel equals a large one in another. There is no independent option to
  // offer here, only a lie to refuse.
  if (chartType === 'bubble') {
    if (cfg.scales?.size === 'independent') {
      frames.warnings.push(
        "a bubble trellis must share its size scale; ignoring scales.size 'independent'.",
      )
    }
    let minZ = Infinity
    let maxZ = -Infinity
    panels.forEach((p) =>
      p.series.forEach((/** @type {any} */ s) => {
        zValues(s.data).forEach((v) => {
          if (v < minZ) minZ = v
          if (v > maxZ) maxZ = v
        })
      }),
    )
    if (isFinite(minZ) && isFinite(maxZ)) {
      frames.plotOptions = {
        bubble: { minZ, maxZ },
      }
    }
  }

  // Pie family: angles cannot encode panel totals, so equal-size pies lie
  // about magnitude. radiusByTotal scales each panel's radius so AREA is
  // proportional to the panel's total (sqrt, since area goes as r^2).
  if (PIE_FAMILY.includes(chartType) && cfg.radiusByTotal) {
    /** @type {Map<string, number>} */
    const totals = new Map()
    let maxTotal = 0
    panels.forEach((p) => {
      let total = 0
      p.series.forEach((/** @type {any} */ s) => {
        observationValues(s.data).forEach((v) => {
          total += Math.abs(v)
        })
      })
      totals.set(p.key, total)
      if (total > maxTotal) maxTotal = total
    })
    if (maxTotal > 0) {
      frames.pieScaleOf = (key) => {
        const total = totals.get(key)
        if (typeof total !== 'number' || total <= 0) return null
        return Math.sqrt(total / maxTotal)
      }
    }
  }

  return frames
}
