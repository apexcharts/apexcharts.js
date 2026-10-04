/**
 * Frame recorder and animation invariants for interaction tests.
 *
 * Every animation regression we have shipped looked right before and after:
 * the defect lived in the frames in between, or in the shape a series animates
 * TO while it is not painted at rest. So these helpers record every frame of a
 * transition on virtual time (see virtual-time.js) and check it against rules
 * that hold for any chart type and any transition:
 *
 *   finite    no NaN or Infinity in any mark's geometry, in any frame
 *   noJump    frame 0 (the instant after the action) shows what was on screen
 *             before it; marks that enter start degenerate or transparent
 *   noFlash   a series painted before and after stays painted throughout
 *   xStable   a series keeps its x extent on every frame (opt in: only true
 *             when the action leaves the x axis alone, e.g. a legend toggle on
 *             a line or area chart)
 *   noLayoutShift  the plot area is where it was at frame 0 and only eases
 *             after it, when the axes change size (chromeSteady checks the
 *             chrome anchored to the plot the same way, given the
 *             chromeEdges probe)
 *   settles   the final frame matches a fresh render of the target state with
 *             animations off
 *
 * Type-specific rules (stack seams, rounded caps, a layer flattening onto its
 * neighbour) plug in as PROBES: a self-contained function that runs in the
 * page every frame, whose results come back alongside the snapshots.
 *
 * Usage:
 *   const errors = await mountChart(page, options)
 *   const rec = await recordTransition(page, () => toggleLegend(page, 'B'))
 *   expectNoViolations(checkAll(rec, { xStable: true }))
 *   expectNoViolations(await settles(page, rec, { hidden: ['B'] }))
 */

import { expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve, join } from 'path'
import { readFileSync, writeFileSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { installVirtualTime, advance, recordFrames } from './virtual-time.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
// APEX_BUNDLE runs the same tests against another build (e.g. a release's
// dist, to tell a regression from a defect that already shipped).
export const BUNDLE = process.env.APEX_BUNDLE ? resolve(process.env.APEX_BUNDLE) : resolve(ROOT, 'dist/apexcharts.js')

/** Default geometric tolerance, px. Covers curve sampling and rounding. */
export const TOL = 1.5

/** Long enough for any default transition (dynamicAnimation 350 ms + holds). */
const DEFAULT_SETTLE_MS = 4000

// ---------------------------------------------------------------------------
// In-page library. Self-contained: serialised into the page as source.
// ---------------------------------------------------------------------------

function pageLib() {
  const N_PTS = 9

  /** Computed opacity multiplied up to the chart's <svg>. */
  const effectiveOpacity = (el) => {
    let op = 1
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n)
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0
      op *= parseFloat(cs.opacity)
      if (n.tagName.toLowerCase() === 'svg') break
    }
    return op
  }

  const isMark = (el) =>
    !el.closest('.apexcharts-series-markers-wrap, .apexcharts-datalabels, .apexcharts-marker') &&
    !el.classList.contains('apexcharts-marker')

  /**
   * One mark: bbox, N points along its outline, whether it paints. Points are
   * mapped through the element's CTM, so motion done with a transform (a group
   * translate, a CSS mirror) is seen like any other motion, and then made
   * relative to the plot origin `o`. A shift of the whole plot area (the y-axis
   * labels changing width) is reported on its own, by noLayoutShift.
   */
  const describe = (el, o) => {
    const tag = el.tagName.toLowerCase()
    const fill = el.getAttribute('fill')
    const stroke = el.getAttribute('stroke')
    // A fill with no alpha (a cell fading in from rgba(255, 255, 255, 0))
    // paints nothing.
    const clear = (c) => /^rgba\([^)]*,\s*0(\.0+)?\s*\)$/.test(c || '') || el.getAttribute('fill-opacity') === '0'
    const filled = fill !== 'none' && fill !== null && fill !== 'transparent' && !clear(fill)
    const m = el.getCTM()
    const map = (x, y) =>
      m ? [m.a * x + m.c * y + m.e - o[0], m.b * x + m.d * y + m.f - o[1]] : [x, y]
    let b
    try {
      b = el.getBBox()
    } catch (e) {
      b = { x: NaN, y: NaN, width: NaN, height: NaN }
    }
    const pts = []
    if (tag === 'path') {
      let L = 0
      try {
        L = el.getTotalLength()
      } catch (e) {
        L = NaN
      }
      for (let k = 0; k < N_PTS; k++) {
        if (!(L > 0)) {
          pts.push(map(b.x, b.y))
          continue
        }
        const p = el.getPointAtLength((L * k) / (N_PTS - 1))
        pts.push(map(p.x, p.y))
      }
    } else {
      pts.push(map(b.x, b.y), map(b.x + b.width, b.y), map(b.x + b.width, b.y + b.height), map(b.x, b.y + b.height))
    }
    // Box of the transformed local box, in svg space.
    const corners = [
      map(b.x, b.y),
      map(b.x + b.width, b.y),
      map(b.x + b.width, b.y + b.height),
      map(b.x, b.y + b.height),
    ]
    const xs = corners.map((c) => c[0])
    const ys = corners.map((c) => c[1])
    const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]
    const geom = tag === 'path' ? el.getAttribute('d') || '' : `${b.x} ${b.y} ${b.width} ${b.height}`
    // No geometry (an empty d, a zero box) draws nothing, whatever its paint.
    const empty = geom.trim() === '' || (box[2] < 0.01 && box[3] < 0.01)
    return {
      cls: (el.getAttribute('class') || '').split(' ')[0],
      filled: filled && !empty,
      stroked: !filled && !empty && stroke !== 'none' && stroke !== null,
      opacity: effectiveOpacity(el),
      bbox: box,
      pts,
      finite: !/NaN|Infinity/.test(geom) && pts.every(([x, y]) => isFinite(x) && isFinite(y)),
    }
  }

  /**
   * The plot origin (where the graphical area sits inside the chart <svg>)
   * and every series group under `root`, with its marks and paint state.
   */
  const snapshot = (root) => {
    const scope = root ? document.querySelector(root) : document
    const plot = scope.querySelector('.apexcharts-graphical')
    const pm = plot && plot.getCTM()
    const origin = pm ? [pm.e, pm.f] : [0, 0]
    const series = [...scope.querySelectorAll('.apexcharts-series')].map((g, i) => {
      let els = [...g.querySelectorAll('path, rect')].filter(isMark)
      // Scatter and bubble draw no body: their markers ARE the series.
      if (!els.length) els = [...g.querySelectorAll('.apexcharts-marker')]
      const marks = els.map((el) => describe(el, origin))
      return {
        name: g.getAttribute('seriesName') || `#${i}`,
        realIndex: g.getAttribute('data:realIndex'),
        collapsed: g.classList.contains('apexcharts-series-collapsed'),
        marks,
        painted: marks.some((m) => m.opacity > 0.01 && (m.filled || m.stroked)),
      }
    })
    // Plot size, for rules that need the baseline (the bottom edge).
    const plotSize = window.chart && window.chart.w && !root
      ? [window.chart.w.layout.gridWidth, window.chart.w.layout.gridHeight]
      : null
    return { origin, series, plot: plotSize }
  }

  /** Deep copy that keeps functions by reference (options carry formatters). */
  const clone = (v) => {
    if (Array.isArray(v)) return v.map(clone)
    if (v && typeof v === 'object' && !(v instanceof Date) && !(v instanceof Element)) {
      const o = {}
      for (const k of Object.keys(v)) o[k] = clone(v[k])
      return o
    }
    return v
  }

  return { snapshot, clone, effectiveOpacity }
}

/**
 * Source of `fn` as an expression the page can eval. Method shorthand
 * (`name(arg) {}`, how the probes below are written) is not one on its own.
 * @param {Function} fn
 */
function fnSource(fn) {
  const src = fn.toString()
  return /^(async\s+)?(function\b|\(|[\w$]+\s*=>)/.test(src) ? src : `function ${src}`
}

async function installLib(page) {
  await page.evaluate((src) => {
    if (!window.__frameLib) window.__frameLib = (0, eval)(`(${src})`)()
  }, pageLib.toString())
}

/** Freeze a copy of the chart's options as rendered, for `settles`. */
async function rememberOptions(page) {
  await installLib(page)
  await page.evaluate(() => {
    window.__opts0 = window.__frameLib.clone(window.chart.opts)
  })
}

// ---------------------------------------------------------------------------
// Mounting
// ---------------------------------------------------------------------------

/**
 * Live list of page errors: uncaught exceptions, plus unhandled promise
 * rejections (a rejected render() is otherwise silent), forwarded to the
 * console by the virtual-time shim.
 */
function collectErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error' && m.text().startsWith('[unhandledrejection]')) errors.push(m.text())
  })
  return errors
}

/**
 * Render `options` on a bare page under virtual time and run the mount
 * animation out. Returns the live array of page errors.
 */
export async function mountChart(page, options, { width = 720, settleMs = DEFAULT_SETTLE_MS } = {}) {
  const errors = collectErrors(page)
  await page.setContent(`<div id="chart" style="width:${width}px"></div>`)
  await installVirtualTime(page, { bare: true })
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate((o) => {
    window.chart = new window.ApexCharts(document.querySelector('#chart'), o)
    window.chart.render()
  }, options)
  await advance(page, settleMs)
  await rememberOptions(page)
  return errors
}

/**
 * Load samples/vanilla-js/{type}/{file}.html under virtual time and run the
 * mount animation out. Returns the live array of page errors.
 */
export async function loadSample(page, type, file, { settleMs = DEFAULT_SETTLE_MS } = {}) {
  const errors = collectErrors(page)
  await installVirtualTime(page)
  const dir = `${ROOT}/samples/vanilla-js/${type}`
  let url = `file://${dir}/${file}.html`
  if (process.env.APEX_BUNDLE) {
    // The sample loads ../../../dist/apexcharts.js itself: serve a copy that
    // loads BUNDLE instead, with a <base> so everything else still resolves.
    const html = readFileSync(`${dir}/${file}.html`, 'utf8')
      .replace(/<script[^>]*src="[^"]*dist\/apexcharts\.js"[^>]*><\/script>/, `<script src="file://${BUNDLE}"></script>`)
      .replace(/<head>/i, `<head><base href="file://${dir}/">`)
    const tmp = join(mkdtempSync(join(tmpdir(), 'apex-sample-')), `${file}.html`)
    writeFileSync(tmp, html)
    url = `file://${tmp}`
  }
  await page.goto(url)
  await page.waitForFunction(() => typeof window.chart !== 'undefined')
  await advance(page, settleMs)
  await rememberOptions(page)
  return errors
}

/** Click the legend entry of series `name`. */
export async function toggleLegend(page, name) {
  await page.locator(`.apexcharts-legend-series[seriesName="${name}"]`).first().click()
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------

/**
 * Run `action` and record every frame until `ms` has passed.
 *
 * @param {import('@playwright/test').Page} page
 * @param {() => Promise<any>} action
 * @param {{ ms?: number, probe?: Function, probeArg?: any }} [opts]
 *   probe: self-contained function run in the page every frame (type-specific
 *   measures); its return values land in `rec.probes`.
 * @returns {Promise<{ before: any[], frames: any[][], after: any[], probes: any[], probeBefore: any }>}
 *   `frames[0]` is the state the action left, before any time passed;
 *   `probeBefore` is the probe's reading before the action.
 */
export async function recordTransition(page, action, { ms = 2000, probe, probeArg } = {}) {
  await installLib(page)
  await page.evaluate((src) => {
    window.__probe = src ? (0, eval)(`(${src})`) : null
  }, probe ? fnSource(probe) : null)

  const before = await page.evaluate(() => window.__frameLib.snapshot())
  const probeBefore = await page.evaluate((arg) => (window.__probe ? window.__probe(arg) : null), probeArg)
  await action()
  const rows = await recordFrames(
    page,
    ms,
    (arg) => ({
      s: window.__frameLib.snapshot(),
      p: window.__probe ? window.__probe(arg) : null,
    }),
    probeArg,
  )
  return {
    before,
    frames: rows.map((r) => r.s),
    after: rows[rows.length - 1].s,
    probes: rows.map((r) => r.p),
    probeBefore,
  }
}

// ---------------------------------------------------------------------------
// Invariants: each returns a list of human-readable violations.
// ---------------------------------------------------------------------------

const byName = (snap) => new Map(snap.series.map((s) => [s.name, s]))
const paintedMarks = (s) => s.marks.filter((m) => m.opacity > 0.01 && (m.filled || m.stroked))
/**
 * Horizontal extent of a set of marks. A point marker counts by its CENTER:
 * a point shrinking or growing in place narrows its box toward the center,
 * which is not the sideways drift this measures.
 */
const extentX = (marks) => {
  let lo = Infinity
  let hi = -Infinity
  const take = (x) => {
    if (isFinite(x)) (lo = Math.min(lo, x)), (hi = Math.max(hi, x))
  }
  for (const m of marks) {
    if (m.cls === 'apexcharts-marker') take(m.bbox[0] + m.bbox[2] / 2)
    else for (const [x] of m.pts) take(x)
  }
  return [lo, hi]
}
/**
 * Whether a filled mark covers any area. Its box alone cannot say: a pie
 * slice at zero angle is a line from center to rim, with a large box and
 * nothing inside it. So a path is measured by its outline (shoelace area of
 * the sampled points), and counts as empty when that is no more than a strip
 * `tol` wide along its longer side.
 */
const hasArea = (m, tol) => {
  const [, , w, h] = m.bbox
  if (w <= tol || h <= tol) return false
  if (m.pts.length === 4) return true
  let a = 0
  for (let k = 0; k < m.pts.length; k++) {
    const [x0, y0] = m.pts[k]
    const [x1, y1] = m.pts[(k + 1) % m.pts.length]
    a += x0 * y1 - x1 * y0
  }
  return Math.abs(a) / 2 > tol * Math.max(w, h)
}
const ptsDistance = (a, b) => {
  let worst = 0
  for (let k = 0; k < Math.min(a.length, b.length); k++) {
    worst = Math.max(worst, Math.hypot(a[k][0] - b[k][0], a[k][1] - b[k][1]))
  }
  return worst
}
const bboxDistance = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])))
const fmt = (n) => (Number.isFinite(n) ? n.toFixed(1) : String(n))
const markDistance = (m, w) =>
  m.pts.length === 4 || m.cls.includes('bar') ? bboxDistance(m.bbox, w.bbox) : ptsDistance(m.pts, w.pts)

/**
 * Pair two equally long mark lists by geometry, not document order: a chart
 * may re-emit the same marks in a different order (bar exit ghosts come out
 * reversed). Greedy closest-first, which is exact whenever the marks are
 * distinct, the only case where order could be mistaken for motion.
 * @returns {Array<[any, any, number]>} [mark, counterpart, distance]
 */
function pairUp(now, was) {
  const cand = []
  now.forEach((m, i) => was.forEach((w, j) => cand.push([markDistance(m, w), i, j])))
  cand.sort((a, b) => a[0] - b[0])
  const usedI = new Set()
  const usedJ = new Set()
  const pairs = []
  for (const [d, i, j] of cand) {
    if (usedI.has(i) || usedJ.has(j)) continue
    usedI.add(i)
    usedJ.add(j)
    pairs.push([now[i], was[j], d])
  }
  return pairs
}

/** No NaN or Infinity in any mark, in any frame. */
export function finite(rec) {
  const out = []
  rec.frames.forEach((snap, f) => {
    for (const s of snap.series) {
      s.marks.forEach((m, k) => {
        if (!m.finite) out.push(`frame ${f}: ${s.name} mark ${k} (${m.cls}) has non-finite geometry`)
      })
    }
  })
  return out
}

/**
 * Frame 0 shows what was on screen before the action. Every mark painted at
 * frame 0 must match the mark it was before, mark for mark and geometrically
 * (so a padded morph path with extra commands still compares equal). That
 * includes a series that was in the DOM but unpainted, such as one hidden from
 * the legend, whose resting shape is where its re-entry has to start. A
 * series with no marks at all before may only enter degenerate (a filled mark
 * with no area) or transparent.
 */
export function noJump(rec, { tol = TOL } = {}) {
  const out = []
  const before = byName(rec.before)
  for (const s of rec.frames[0].series) {
    const b = before.get(s.name)
    const now = paintedMarks(s)
    if (b && !b.painted && now.length) {
      // Entering from hidden. Fine if it starts on its hidden shape (a
      // stacked layer re-emerging from its neighbour), or if its filled marks
      // start with no area (rising from the baseline). Strokes cannot jump
      // into view from nothing in a way the motion rules would not report.
      const hiddenShape = b.marks.filter((m) => m.filled || m.stroked)
      const onHidden =
        hiddenShape.length === now.length && pairUp(now, hiddenShape).every(([, , d]) => d <= tol)
      if (onHidden) continue
      // Marks of the other series painted at frame 0: an entering mark lying
      // exactly on one of them (a stacked layer re-emerging from behind its
      // neighbour) changes nothing on screen.
      const others = rec.frames[0].series
        .filter((o) => o.name !== s.name)
        .flatMap((o) => paintedMarks(o))
      for (const m of now) {
        if (!m.filled || !hasArea(m, tol)) continue
        if (others.some((o) => markDistance(m, o) <= tol)) continue
        const [, , w, h] = m.bbox
        out.push(`${s.name} entered at frame 0 already ${fmt(w)}x${fmt(h)} (${m.cls})`)
      }
      continue
    }
    const was = b ? paintedMarks(b) : []
    if (was.length && now.length) {
      if (was.length === now.length) {
        for (const [m, , d] of pairUp(now, was)) {
          if (d > tol) out.push(`${s.name} mark ${now.indexOf(m)} (${m.cls}) jumped ${fmt(d)}px at frame 0`)
        }
      } else {
        // The counts differ (points enter or leave). Every mark that was on
        // screen must still be there at frame 0, and an extra one may only
        // enter with no area yet (a bar rising from the baseline in its new
        // slot), wherever it stands.
        const pairs = pairUp(was, now)
        for (const [m, , d] of pairs) {
          if (d > tol) out.push(`${s.name} mark ${was.indexOf(m)} (${m.cls}) jumped ${fmt(d)}px at frame 0 (marks ${was.length} -> ${now.length})`)
        }
        const kept = new Set(pairs.map(([, o]) => o))
        for (const m of now) {
          if (kept.has(m) || !m.filled || !hasArea(m, tol)) continue
          const [, , bw, bh] = m.bbox
          out.push(`${s.name} entered at frame 0 already ${fmt(bw)}x${fmt(bh)} (${m.cls})`)
        }
        if (was.length > now.length) out.push(`${s.name}: ${was.length - now.length} marks vanished at frame 0`)
      }
    } else if (!was.length && now.length) {
      for (const m of now) {
        if (!m.filled || !hasArea(m, tol)) continue
        const [, , w, h] = m.bbox
        out.push(`${s.name} entered at frame 0 already ${fmt(w)}x${fmt(h)} (${m.cls})`)
      }
    }
  }
  return out
}

/** A series painted before and after the transition is painted on every frame. */
export function noFlash(rec) {
  const out = []
  const before = byName(rec.before)
  const after = byName(rec.after)
  const steady = [...before.keys()].filter((n) => before.get(n).painted && after.get(n)?.painted)
  rec.frames.forEach((snap, f) => {
    const now = byName(snap)
    for (const n of steady) {
      if (!now.get(n)?.painted) out.push(`frame ${f}: ${n} is painted before and after but not here`)
    }
  })
  return out
}

/**
 * Every series keeps one x extent on every frame: the one it had painted
 * before, or for a series entering, the one it settles at. Only valid when
 * the action leaves the x axis alone. Covers exits and entries alike: a
 * series must not slide in from, or out to, one side.
 */
export function xStable(rec, { tol = TOL } = {}) {
  const out = []
  const before = byName(rec.before)
  const after = byName(rec.after)
  rec.frames.forEach((snap, f) => {
    for (const s of snap.series) {
      const b = before.get(s.name)
      const ref = b?.painted ? b : after.get(s.name)?.painted ? after.get(s.name) : null
      // Only what is painted can be seen to drift; a series that vanished
      // outright is animatesOut's to report.
      const visible = paintedMarks(s)
      if (!ref || !visible.length) continue
      const [a0, a1] = extentX(paintedMarks(ref))
      const [n0, n1] = extentX(visible)
      const d = Math.max(Math.abs(a0 - n0), Math.abs(a1 - n1))
      if (d > tol) out.push(`frame ${f}: ${s.name} x extent [${fmt(n0)}, ${fmt(n1)}] drifted from [${fmt(a0)}, ${fmt(a1)}]`)
    }
  })
  return out
}

/**
 * Differences between two snapshots, mark for mark: what is painted, and
 * where (paired by geometry, as noJump does). Empty when they look the same.
 */
function snapDiff(a, b, tol) {
  const out = []
  const bs = byName(b)
  for (const s of a.series) {
    const t = bs.get(s.name)
    const [m1, m2] = [paintedMarks(s), t ? paintedMarks(t) : []]
    if (m1.length !== m2.length) {
      out.push(`${s.name}: ${m1.length} marks painted, ${m2.length} at rest`)
      continue
    }
    for (const [m, o, d] of pairUp(m1, m2)) {
      if (d > tol) out.push(`${s.name} mark ${m1.indexOf(m)} (${m.cls}) is ${fmt(d)}px from where it rests`)
      else if (Math.abs(m.opacity - o.opacity) > 0.05) {
        out.push(`${s.name} mark ${m1.indexOf(m)} (${m.cls}) is at opacity ${m.opacity.toFixed(2)}, ${o.opacity.toFixed(2)} at rest`)
      }
    }
  }
  return out
}

/**
 * The action did not animate: from frame `by` on (0 = at once, 1 = on the
 * next frame) every frame already is the final one.
 */
export function snaps(rec, { by = 1, tol = TOL } = {}) {
  for (let f = by; f < rec.frames.length; f++) {
    const d = snapDiff(rec.frames[f], rec.after, tol)
    if (d.length) return [`frame ${f} is not yet where the chart rests (it should not animate): ${d[0]}`]
  }
  return []
}

/** The action animated: the chart did not land on its final state at once. */
export function animates(rec, { tol = TOL } = {}) {
  const moving = rec.frames.some((snap) => snapDiff(snap, rec.after, tol).length > 0)
  return moving ? [] : ['the chart landed on its final state at frame 0, with no animation']
}

/**
 * Frame 0 starts from what was on screen, or from scratch: every mark painted
 * at frame 0 matches a mark painted before, has no area yet (rising from the
 * baseline), or already has its final shape (drawn on behind a reveal: a
 * stroke dash, a growing mask). Not some third shape, such as one left over
 * from an earlier update.
 */
export function noStaleStart(rec, { tol = TOL } = {}) {
  const out = []
  const before = byName(rec.before)
  const after = byName(rec.after)
  for (const s of rec.frames[0].series) {
    const was = before.get(s.name) ? paintedMarks(before.get(s.name)) : []
    const end = after.get(s.name) ? paintedMarks(after.get(s.name)) : []
    paintedMarks(s).forEach((m, k) => {
      const [, , w, h] = m.bbox
      if (w <= tol || h <= tol) return
      const near = [...was, ...end].some((o) => markDistance(m, o) <= tol)
      if (!near) out.push(`${s.name} mark ${k} (${m.cls}) starts at frame 0 on a shape that was not on screen`)
    })
  }
  return out
}

/** Fingerprint of a series' paint and geometry, for "did it change" tests. */
const seriesSig = (s) =>
  s
    ? paintedMarks(s)
        .map((m) => `${m.opacity.toFixed(2)}:${m.pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}`)
        .join('|')
    : ''

/**
 * Series `name` leaves with a visible exit: it is still painted after frame 0
 * and changes (shrinks, flattens, fades) on the way out, instead of
 * vanishing the instant the legend is clicked.
 */
export function animatesOut(rec, name) {
  const at = (f) => byName(rec.frames[f]).get(name)
  if (!byName(rec.before).get(name)?.painted) return [`${name} was not painted before the action`]
  const start = seriesSig(at(0))
  const moving = rec.frames.slice(1).some((snap) => {
    const s = byName(snap).get(name)
    return s?.painted && seriesSig(s) !== start
  })
  return moving ? [] : [`${name} vanished without an exit animation`]
}

/**
 * Series `name` arrives with a visible entry: before the transition ends
 * there are painted frames that differ from where it settles, instead of it
 * appearing fully formed.
 */
export function animatesIn(rec, name) {
  const end = byName(rec.after).get(name)
  if (!end?.painted) return [`${name} is not painted at rest`]
  const rest = seriesSig(end)
  const moving = rec.frames.some((snap) => {
    const s = byName(snap).get(name)
    return s?.painted && seriesSig(s) !== rest
  })
  return moving ? [] : [`${name} appeared without an entry animation`]
}

const hasGeometry = (s) => !!s && s.marks.some((m) => m.filled || m.stroked)

/**
 * The exit of series `name`, for the exit-target rules: its shape on the last
 * frame that still drew anything, and what is left once the transition is
 * over. A hidden series must reach its target and THEN leave nothing behind:
 * no shape lying unpainted in the DOM (an export would draw it).
 */
function exitOf(rec, name) {
  let last = null
  for (let f = rec.frames.length - 1; f >= 0 && !last; f--) {
    const s = byName(rec.frames[f]).get(name)
    if (hasGeometry(s)) last = s
  }
  const rest = byName(rec.after).get(name)
  const left = hasGeometry(rest) ? [`${name} is still lying there after its exit (its shape was not cleared)`] : []
  return { last, left }
}

/**
 * Series `name` leaves by flattening onto the baseline: on the last frame it
 * still draws, every point sits at one y, the plot's bottom edge unless `y` is
 * given (the zero line of an axis that crosses zero). Then nothing is left.
 */
export function exitsToBaseline(rec, name, { y, tol = TOL } = {}) {
  const { last, left } = exitOf(rec, name)
  if (!last) return [`${name} never drew an exit (it vanished)`]
  const target = y ?? (rec.after.plot ? rec.after.plot[1] : null)
  if (target == null) return ['no plot size recorded to find the baseline']
  const out = []
  last.marks.forEach((m, k) => {
    if (!m.filled && !m.stroked) return
    const off = Math.max(...m.pts.map(([, py]) => Math.abs(py - target)))
    if (off > tol) out.push(`${name} mark ${k} (${m.cls}) ends its exit up to ${fmt(off)}px off the baseline (y=${fmt(target)})`)
  })
  return [...out, ...left]
}

/**
 * Series `name` leaves by shrinking to nothing in place (points, a radar
 * polygon into its center): on the last frame it still draws, every mark has
 * no size. Then nothing is left.
 */
export function exitsShrunk(rec, name, { tol = TOL } = {}) {
  const { last, left } = exitOf(rec, name)
  if (!last) return [`${name} never drew an exit (it vanished)`]
  const out = []
  last.marks.forEach((m, k) => {
    if (!m.filled && !m.stroked) return
    const [, , w, h] = m.bbox
    if (w > tol || h > tol) out.push(`${name} mark ${k} (${m.cls}) ends its exit at ${fmt(w)}x${fmt(h)}, not shrunk away`)
  })
  return [...out, ...left]
}

/**
 * Series `name` is gone the moment its exit lands. Once its shape stops
 * changing it may stay painted for at most `grace` frames: a line flattened
 * onto the baseline and left lying there until some timer runs out reads as
 * a series that failed to hide.
 */
export function vanishesOnLanding(rec, name, { grace = 2 } = {}) {
  const sigs = rec.frames.map((snap) => {
    const s = byName(snap).get(name)
    return s?.painted ? seriesSig(s) : null
  })
  const last = sigs.findLastIndex((g) => g !== null)
  if (last < 0) return []
  if (last === sigs.length - 1) return [`${name} is still painted when the recording ends`]
  // The landing: the first frame of the run of identical shapes that ends
  // the painted stretch.
  let land = last
  while (land > 0 && sigs[land - 1] === sigs[last]) land--
  const lingered = last - land
  return lingered > grace
    ? [`${name} lay at its exit target for ${lingered} frames after landing (frames ${land} to ${last}) before vanishing`]
    : []
}

/**
 * A position that may move but never jumps: it is where it was at frame 0,
 * and no later frame covers more than `share` of its whole journey at once.
 * An eased move of a few hundred ms takes a sliver per frame; a snap takes
 * all of it in one.
 *
 * @param {Array<number[] | undefined>} seq readings, before the action first
 * @returns {string[]}
 */
function steadyMoves(seq, what, { tol = TOL, share = 0.6 } = {}) {
  const out = []
  const start = seq[0]
  if (!start) return out
  let travel = 0
  for (const v of seq) if (v) travel = Math.max(travel, Math.hypot(...v.map((c, k) => c - start[k])))
  const limit = Math.max(tol, share * travel)
  for (let i = 1; i < seq.length; i++) {
    const [a, b] = [seq[i - 1], seq[i]]
    if (!a || !b) continue
    const step = Math.hypot(...b.map((c, k) => c - a[k]))
    const f = i - 1
    if (f === 0 ? step > tol : step > limit) {
      out.push(`frame ${f}: ${what} jumped ${b.map((c, k) => fmt(c - a[k])).join(', ')}px in one frame`)
    }
  }
  return out
}

/**
 * The plot area never jumps. When an update changes how much room the axes
 * need (wider y-axis labels, a legend that wraps), the whole graphical area
 * moves; that move must be animated with everything else, not applied at
 * frame 0 while the marks inside it are still tweening.
 */
export function noLayoutShift(rec, { tol = TOL } = {}) {
  return steadyMoves([rec.before.origin, ...rec.frames.map((s) => s.origin)], 'plot area', { tol })
}

/**
 * Chrome anchored to the plot rect (probes.chromeEdges) moves with it: the
 * clip box, the grid's reach, the axes. Same rule as noLayoutShift, per edge.
 * Record with `probe: probes.chromeEdges`.
 */
export function chromeSteady(rec, { tol = TOL } = {}) {
  const readings = [rec.probeBefore, ...rec.probes]
  const keys = new Set(readings.flatMap((r) => (r ? Object.keys(r) : [])))
  const out = []
  for (const k of keys) {
    out.push(...steadyMoves(readings.map((r) => (r && r[k] != null ? [r[k]] : undefined)), k, { tol }))
  }
  return out
}

/** The default rules: finite, noJump, noFlash, noLayoutShift, plus xStable when asked. */
export function checkAll(rec, { xStable: withX = false, tol = TOL } = {}) {
  return [
    ...finite(rec),
    ...noJump(rec, { tol }),
    ...noFlash(rec),
    ...noLayoutShift(rec, { tol }),
    ...(withX ? xStable(rec, { tol }) : []),
  ]
}

/**
 * The final frame matches a fresh render of the target state, animations off.
 * The target is the chart's own options as mounted, with `hidden` series
 * declared hidden and `transform` (an in-page function source, opts -> opts)
 * applied, e.g. the data an updateSeries call set.
 */
export async function settles(page, rec, { hidden = [], transform, tol = TOL, width } = {}) {
  const fresh = await page.evaluate(
    async ({ hidden, transform, width }) => {
      const lib = window.__frameLib
      const o = lib.clone(window.__opts0)
      if (transform) Object.assign(o, (0, eval)(`(${transform})`)(o))
      o.series = (o.series || []).map((s) =>
        s && typeof s === 'object' ? { ...s, hidden: hidden.includes(s.name) } : s,
      )
      o.chart = { ...(o.chart || {}), animations: { ...((o.chart || {}).animations || {}), enabled: false } }
      const host = document.createElement('div')
      host.id = '__fresh'
      host.style.width = (width || window.chart.el.getBoundingClientRect().width) + 'px'
      host.style.position = 'absolute'
      host.style.left = '0'
      host.style.top = '0'
      document.body.appendChild(host)
      const c = new window.ApexCharts(host, o)
      c.render()
      await window.__vt.advance(2000)
      const snap = lib.snapshot('#__fresh')
      c.destroy()
      host.remove()
      return snap
    },
    { hidden, transform: transform ? fnSource(transform) : null, width },
  )

  const out = []
  const want = byName(fresh)
  if (Math.hypot(rec.after.origin[0] - fresh.origin[0], rec.after.origin[1] - fresh.origin[1]) > tol) {
    out.push(`plot origin rests at (${rec.after.origin.map(fmt)}), a fresh render has (${fresh.origin.map(fmt)})`)
  }
  for (const s of rec.after.series) {
    const f = want.get(s.name)
    const got = paintedMarks(s)
    const exp = f ? paintedMarks(f) : []
    if (got.length !== exp.length) {
      out.push(`${s.name}: ${got.length} painted marks at rest, a fresh render has ${exp.length}`)
      continue
    }
    for (const [m, , d] of pairUp(got, exp)) {
      if (d > tol) out.push(`${s.name} mark ${got.indexOf(m)} (${m.cls}) rests ${fmt(d)}px from a fresh render`)
    }
  }
  return out
}

/** Assert an empty violation list, printing every violation on failure. */
export function expectNoViolations(violations, label = '') {
  expect(violations, `${label}${label ? '\n' : ''}${violations.slice(0, 25).join('\n')}`).toEqual([])
}

// ---------------------------------------------------------------------------
// Probes: type-specific per-frame measures (self-contained, run in the page).
// ---------------------------------------------------------------------------

export const probes = {
  /**
   * Chrome anchored to the plot rect, in chart (svg) space: the plot's clip
   * box, how far the grid's lines reach, where each y axis sits, the x axis
   * line and the x labels' baseline. Feeds chromeSteady.
   */
  chromeEdges() {
    const out = {}
    const at = (el, x, y) => {
      const m = el.getCTM()
      return m ? [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f] : [x, y]
    }
    const num = (el, a) => parseFloat(el.getAttribute(a))
    const g = document.querySelector('.apexcharts-graphical')
    // The plot's clip, and the bar and marker clips that clip those marks.
    for (const [id, key] of [
      ['gridRectMask', 'clip'],
      ['gridRectBarMask', 'clipBar'],
      ['gridRectMarkerMask', 'clipMarker'],
    ]) {
      const clip = document.querySelector(`clipPath[id^="${id}"] rect`)
      if (!g || !clip) continue
      const [l, t] = at(g, num(clip, 'x'), num(clip, 'y'))
      const [r, b] = at(g, num(clip, 'x') + num(clip, 'width'), num(clip, 'y') + num(clip, 'height'))
      Object.assign(out, { [`${key}Left`]: l, [`${key}Top`]: t, [`${key}Right`]: r, [`${key}Bottom`]: b })
    }
    // Where the grid's lines end: the nearest and the farthest, so one line
    // snapping short of the others is seen too.
    const ends = { gridRight: -Infinity, gridRightMin: Infinity, gridBottom: -Infinity, gridBottomMin: Infinity }
    document
      .querySelectorAll('.apexcharts-grid line:not(.apexcharts-tick-ghost), .apexcharts-grid-borders line')
      .forEach((ln) => {
        const p = at(ln, num(ln, 'x1'), num(ln, 'y1'))
        const q = at(ln, num(ln, 'x2'), num(ln, 'y2'))
        if (Math.abs(p[1] - q[1]) < 0.01) {
          const r = Math.max(p[0], q[0])
          ends.gridRight = Math.max(ends.gridRight, r)
          ends.gridRightMin = Math.min(ends.gridRightMin, r)
        }
        if (Math.abs(p[0] - q[0]) < 0.01) {
          const b = Math.max(p[1], q[1])
          ends.gridBottom = Math.max(ends.gridBottom, b)
          ends.gridBottomMin = Math.min(ends.gridBottomMin, b)
        }
      })
    for (const k of Object.keys(ends)) if (isFinite(ends[k])) out[k] = ends[k]
    document.querySelectorAll('.apexcharts-yaxis[rel]').forEach((y) => {
      const m = y.getCTM()
      if (m) out[`yaxis${y.getAttribute('rel')}`] = m.e
    })
    const xl = document.querySelector('.apexcharts-xaxis > line')
    if (xl) {
      const p = at(xl, num(xl, 'x1'), num(xl, 'y1'))
      const q = at(xl, num(xl, 'x2'), num(xl, 'y2'))
      Object.assign(out, { xLineLeft: p[0], xLineRight: q[0], xLineY: p[1] })
    }
    const label = document.querySelector('.apexcharts-xaxis-texts-g text:not(.apexcharts-tick-ghost)')
    if (label && !label.getAttribute('transform')) out.xLabelsY = at(label, 0, num(label, 'y'))[1]
    // (Rotated labels are not read: the row's box follows their text, which
    // an update may legitimately change on frame 0.)
    return out
  },

  /**
   * Stacked bar/column: the widest gap between two neighbouring segments in
   * any stack. A transparent segment counts as a hole of its own size.
   * @param {boolean} horizontal
   */
  seamGap(horizontal) {
    let worst = 0
    const groups = [...document.querySelectorAll('.apexcharts-series')]
    const bars = groups[0] ? groups[0].querySelectorAll('.apexcharts-bar-area').length : 0
    for (let j = 0; j < bars; j++) {
      const segs = groups.map((g) => {
        const p = g.querySelector(`.apexcharts-bar-area[j="${j}"]`)
        // A hidden series' bars are cleared once its exit is over: absent,
        // not a zero-size segment at the origin.
        if (!p || !(p.getAttribute('d') || '').trim()) return null
        const b = p.getBBox()
        return {
          painted: getComputedStyle(g).opacity !== '0' && p.getAttribute('fill') !== 'none',
          x: b.x,
          y: b.y,
          w: b.width,
          h: b.height,
        }
      })
      for (let i = 0; i < segs.length - 1; i++) {
        const lower = segs[i]
        const upper = segs[i + 1]
        if (!lower || !upper) continue
        const gap = horizontal ? upper.x - (lower.x + lower.w) : lower.y - (upper.y + upper.h)
        const hole =
          lower.painted && upper.painted
            ? gap
            : gap + (horizontal ? (lower.painted ? upper.w : lower.w) : lower.painted ? upper.h : lower.h)
        if (Math.abs(hole) > Math.abs(worst)) worst = hole
      }
    }
    return Math.abs(worst)
  },

  /**
   * Stacked bar/column: each series' first bar, its corner radius (read off the
   * path: a rounded corner's C command spans r in x), whether it is mirrored
   * to put that radius on the bottom edge, and its box.
   */
  corners() {
    const radiusOf = (d) => {
      const toks = d.trim().split(/[\s,]+/)
      const pts = []
      let i = 0
      while (i < toks.length) {
        const c = toks[i]
        if (/^[MLC]$/i.test(c)) {
          const n = c.toUpperCase() === 'C' ? 6 : 2
          const nums = toks.slice(i + 1, i + 1 + n).map(Number)
          pts.push({ c: c.toUpperCase(), end: [nums[n - 2], nums[n - 1]] })
          i += 1 + n
        } else i += 1
      }
      for (let k = 1; k < pts.length; k++) {
        if (pts[k].c === 'C') return Math.abs(pts[k].end[0] - pts[k - 1].end[0])
      }
      return 0
    }
    const row = []
    document.querySelectorAll('.apexcharts-series').forEach((g) => {
      const p = g.querySelector('.apexcharts-bar-area')
      if (!p) return
      const b = p.getBBox()
      row.push({
        name: g.getAttribute('seriesName'),
        realIndex: g.getAttribute('data:realIndex'),
        mirrored: p.classList.contains('apexcharts-flip-y') || p.classList.contains('apexcharts-flip-x'),
        radius: radiusOf(p.getAttribute('d') || ''),
        top: b.y,
        height: b.height,
      })
    })
    // Data labels per series, for the "labelled while painted" rule.
    const labels = {}
    document.querySelectorAll('.apexcharts-datalabels').forEach((dl) => {
      labels[dl.getAttribute('data:realIndex')] = [...dl.querySelectorAll('text')].filter((t) =>
        t.textContent.trim(),
      ).length
    })
    return { row, labels }
  },

  /**
   * Line/area: largest vertical distance between series `name`'s stroke and
   * the stroke of `below` (or the plot baseline when `below` is null), probed
   * at evenly spaced x across `name`'s stroke.
   * @param {{ name: string, below: string | null }} arg
   */
  gapToBelow({ name, below }) {
    const stroke = (n) =>
      [...document.querySelectorAll(`.apexcharts-series[seriesName="${n}"] > path`)].find(
        (p) => p.getAttribute('fill') === 'none',
      )
    const yAt = (p, x) => {
      let lo = 0
      let hi = p.getTotalLength()
      for (let k = 0; k < 40; k++) {
        const m = (lo + hi) / 2
        if (p.getPointAtLength(m).x < x) lo = m
        else hi = m
      }
      return p.getPointAtLength(lo).y
    }
    const top = stroke(name)
    if (!top || !(top.getAttribute('d') || '').trim()) return null
    const L = top.getTotalLength()
    const xs = [0.05, 0.25, 0.5, 0.75, 0.95].map((f) => top.getPointAtLength(L * f).x)
    const base = window.chart.w.layout.gridHeight
    return Math.max(...xs.map((x) => Math.abs(yAt(top, x) - (below ? yAt(stroke(below), x) : base))))
  },
}
