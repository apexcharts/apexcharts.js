// @ts-check
/**
 * radialBar / gauge targets (#5381, #1280): marks at a value on a ring, such
 * as a target, a limit or last period's reading, from
 * `plotOptions.radialBar.targets`.
 *
 * An opt-in add-on (free, not licence-gated), drawn on the dial geometry core
 * publishes (Radial.radialGeometry, `chart.getRadialScales()`), so it reads
 * the same rings, angles and value mapping the bands and ticks do. Core's
 * only part is the seam in Radial.draw, which hands this the geometry after
 * the rings and warns once when a config has targets and this is absent.
 *
 * @module modules/radialTargets/RadialTargets
 */
import Graphics from '../Graphics'
import Utils from '../../utils/Utils'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'
import { Environment } from '../../utils/Environment'
import { resolveEasing } from '../animations/Easing'

export default class RadialTargets {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /**
     * The previous render's angles, where the next tween starts. On the
     * feature instance, which lives as long as the chart (the Radial
     * instance is recreated every render).
     * @type {Map<string, number>}
     */
    this.angles = new Map()
  }

  /** Stop a running tween, so it never turns a detached target. */
  stop() {
    const gl = this.w.globals
    if (gl.radialTargetRAF != null) {
      BrowserAPIs.cancelAnimationFrame(gl.radialTargetRAF)
      gl.radialTargetRAF = null
    }
  }

  /**
   * Draw the targets for this render. Each is drawn pointing at 12 o'clock
   * and turned to its value around the dial's centre, so it moves the way
   * the needle does: in from `startAngle` with its ring on mount, from where
   * it was on a data update, and straight to its place on a resize. Null,
   * after stopping any tween, when the list is empty.
   *
   * @param {any} radial the Radial drawing this render (its animation state)
   * @param {{series: any[], geometry: import('../../types/internal').RadialGeometry}} opts
   * @returns {any}
   */
  draw(radial, opts) {
    const w = this.w
    const gl = w.globals
    const graphics = new Graphics(this.w)
    const rb = w.config.plotOptions.radialBar
    if (!Array.isArray(rb.targets) || !rb.targets.length) {
      this.stop()
      this.angles = new Map()
      return null
    }
    const geo = opts.geometry
    const { cx, cy } = geo
    const g = graphics.group({ class: 'apexcharts-radial-targets' })
    // Chrome, like the ticks: the ring under it keeps its hover and click.
    g.node.setAttribute('pointer-events', 'none')

    // A needle gauge with no value arc shows its bands, not the ring's full
    // stroke, so an outside or inside target sits on the bands' edge.
    const valueArcHidden = rb.shape === 'needle' && !rb.needle?.showValueArc
    const isCollapsed = (/** @type {number} */ i) =>
      [
        ...(gl.collapsedSeries || []),
        ...(gl.ancillaryCollapsedSeries || []),
      ].some((c) => c.index === i)

    const anim = w.config.chart.animations
    const isInitialMount = radial.initialAnim && !gl.dataChanged && !gl.resized
    const moving = Environment.isBrowser() && gl.shouldAnimate
    const ease = resolveEasing(anim.easing)

    const prevAngles = this.angles
    /** @type {Map<string, number>} */
    const nextAngles = new Map()
    /** @type {Array<{node: Element, label: any, from: number, to: number, delay: number, dur: number, place: (a: number) => void}>} */
    const runs = []

    rb.targets.forEach(
      (/** @type {Record<string, any>} */ t, /** @type {number} */ k) => {
        if (!t) return
        const seriesIndex = t.seriesIndex ?? 0
        const ring = geo.rings[seriesIndex]
        if (!ring || isCollapsed(seriesIndex)) return
        const raw = t.value === 'series' ? opts.series[seriesIndex] : t.value
        if (raw === null || raw === undefined || raw === '') return
        const value = Number(raw)
        if (!Number.isFinite(value)) return

        const shape =
          t.shape === 'triangle' || t.shape === 'circle' ? t.shape : 'line'
        const position =
          t.position === 'outside' ||
          t.position === 'inside' ||
          t.position === 'across'
            ? t.position
            : shape === 'triangle'
              ? 'outside'
              : 'across'
        const half =
          (seriesIndex === 0 && valueArcHidden && geo.bands
            ? geo.bands.thickness
            : ring.thickness) / 2
        const lenRaw = t.length ?? (shape === 'line' ? '130%' : 10)
        const length =
          typeof lenRaw === 'string' && lenRaw.trim().endsWith('%')
            ? (ring.thickness * parseFloat(lenRaw)) / 100
            : Math.max(0, Number(lenRaw) || 0)
        const width = Math.max(
          0,
          Number(t.width ?? (shape === 'line' ? 3 : 12)) || 0,
        )
        // The mark's extent along the radius: `near` is the end on the ring.
        const r = ring.radius
        const [near, far] =
          position === 'outside'
            ? [r + half, r + half + length]
            : position === 'inside'
              ? [r - half, r - half - length]
              : [r - length / 2, r + length / 2]
        const color = t.color || w.config.chart.foreColor
        const strokeColor = t.strokeColor || 'none'
        const strokeWidth = t.strokeWidth ?? 0

        const cls = ['apexcharts-radial-target']
        if (t.cssClass) cls.push(t.cssClass)
        const tg = graphics.group({ class: cls.join(' ') })
        tg.node.setAttribute('rel', String(seriesIndex + 1))
        tg.node.setAttribute('data-target-index', String(k))
        if (t.id != null) tg.node.setAttribute('data-target-id', String(t.id))
        g.add(tg)

        // Drawn pointing at 12 o'clock: radius rho sits at (cx, cy - rho).
        let el
        if (shape === 'line') {
          el = graphics.drawLine(cx, cy - near, cx, cy - far, color, 0, width)
        } else if (shape === 'triangle') {
          el = graphics.drawPath({
            d:
              `M ${cx} ${cy - near} ` +
              `L ${cx - width / 2} ${cy - far} ` +
              `L ${cx + width / 2} ${cy - far} Z`,
            stroke: strokeColor,
            strokeWidth,
            fill: color,
            strokeLinecap: 'butt',
          })
        } else {
          const mid = (near + far) / 2
          el = graphics.drawCircle(length / 2, {
            cx,
            cy: cy - mid,
            r: length / 2,
            fill: color,
            stroke: strokeColor,
            'stroke-width': strokeWidth,
          })
        }
        el.node.classList.add('apexcharts-radial-target-shape')
        const shapeG = graphics.group({
          class: 'apexcharts-radial-target-mark',
        })
        shapeG.add(el)
        tg.add(shapeG)

        // The label stays upright: placed off the mark's outer end (inner end
        // for an inside target) at each angle rather than turned with it.
        const lab = t.label
        /** @type {any} */
        let elLabel = null
        /** @type {(a: number) => void} */
        let placeLabel = () => {}
        if (lab && lab.text != null && lab.text !== '') {
          const style = lab.style || {}
          const fontSize = style.fontSize || '11px'
          const fs = parseFloat(fontSize) || 11
          const out = position === 'inside' ? -1 : 1
          const tip =
            position === 'inside' ? Math.min(near, far) : Math.max(near, far)
          const offset = Number(lab.offset ?? 4)
          elLabel = graphics.drawText({
            x: cx,
            y: cy,
            text: String(lab.text),
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight ?? 600,
            foreColor: style.color || color,
            cssClass: 'apexcharts-radial-target-label',
          })
          placeLabel = (a) => {
            const rad = (a * Math.PI) / 180
            const dx = Math.sin(rad) * out
            const dy = -Math.cos(rad) * out
            // Clear the mark by the text's half height where it sits above or
            // below it, and anchor the side it grows from where it sits beside.
            const rho = tip + out * (offset + (Math.abs(dy) * fs) / 2)
            const p = Utils.polarToCartesian(cx, cy, rho, a)
            elLabel.node.setAttribute('x', String(p.x))
            elLabel.node.setAttribute('y', String(p.y))
            elLabel.node.setAttribute(
              'text-anchor',
              dx > 0.3 ? 'start' : dx < -0.3 ? 'end' : 'middle',
            )
          }
          tg.add(elLabel)
        }

        const to = geo.angle(value)
        const key = t.id != null ? `id:${t.id}` : `i:${k}`
        nextAngles.set(key, to)
        const prev = prevAngles.get(key)
        let from = to
        let dur = 0
        let delay = 0
        if (moving && isInitialMount) {
          from = geo.startAngle
          dur = anim.speed
          delay = radial.animBeginArr[seriesIndex] || 0
        } else if (
          moving &&
          radial.dynamicAnim &&
          gl.dataChanged &&
          prev !== undefined
        ) {
          from = prev
          dur = anim.dynamicAnimation.speed
        }
        const node = shapeG.node
        const place = (/** @type {number} */ a) => {
          node.setAttribute('transform', `rotate(${a} ${cx} ${cy})`)
          placeLabel(a)
        }
        place(from)
        if (dur > 0 && from !== to) {
          runs.push({ node, label: elLabel, from, to, delay, dur, place })
        } else if (from !== to) {
          place(to)
        }
      },
    )
    this.angles = nextAngles

    // One loop for every target, cancelled by the next render as the
    // needle's is, so a tween never runs on a detached target.
    this.stop()
    if (runs.length) {
      const startAt = performance.now()
      const step = (/** @type {number} */ now) => {
        if (this.w.globals.isDestroyed) {
          gl.radialTargetRAF = null
          return
        }
        let done = true
        runs.forEach((run) => {
          const t = Math.max(
            0,
            Math.min(1, (now - startAt - run.delay) / run.dur),
          )
          if (t < 1) done = false
          run.place(run.from + (run.to - run.from) * ease(t))
        })
        gl.radialTargetRAF = done
          ? null
          : BrowserAPIs.requestAnimationFrame(step)
      }
      gl.radialTargetRAF = BrowserAPIs.requestAnimationFrame(step)
    }

    return g
  }
}
