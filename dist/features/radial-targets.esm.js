/*!
 * ApexCharts v8.7.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const Utils = _core.__apex_Utils;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const Environment = _core.__apex_Environment_Environment;
const resolveEasing = _core.__apex_Easing_resolveEasing;
class RadialTargets {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.angles = /* @__PURE__ */ new Map();
  }
  /** Stop a running tween, so it never turns a detached target. */
  stop() {
    const gl = this.w.globals;
    if (gl.radialTargetRAF != null) {
      BrowserAPIs.cancelAnimationFrame(gl.radialTargetRAF);
      gl.radialTargetRAF = null;
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
    var _a;
    const w = this.w;
    const gl = w.globals;
    const graphics = new Graphics(this.w);
    const rb = w.config.plotOptions.radialBar;
    if (!Array.isArray(rb.targets) || !rb.targets.length) {
      this.stop();
      this.angles = /* @__PURE__ */ new Map();
      return null;
    }
    const geo = opts.geometry;
    const { cx, cy } = geo;
    const g = graphics.group({ class: "apexcharts-radial-targets" });
    g.node.setAttribute("pointer-events", "none");
    const valueArcHidden = rb.shape === "needle" && !((_a = rb.needle) == null ? void 0 : _a.showValueArc);
    const isCollapsed = (i) => [
      ...gl.collapsedSeries || [],
      ...gl.ancillaryCollapsedSeries || []
    ].some((c) => c.index === i);
    const anim = w.config.chart.animations;
    const isInitialMount = radial.initialAnim && !gl.dataChanged && !gl.resized;
    const moving = Environment.isBrowser() && gl.shouldAnimate;
    const ease = resolveEasing(anim.easing);
    const prevAngles = this.angles;
    const nextAngles = /* @__PURE__ */ new Map();
    const runs = [];
    rb.targets.forEach(
      (t, k) => {
        var _a2, _b, _c, _d, _e, _f;
        if (!t) return;
        const seriesIndex = (_a2 = t.seriesIndex) != null ? _a2 : 0;
        const ring = geo.rings[seriesIndex];
        if (!ring || isCollapsed(seriesIndex)) return;
        const raw = t.value === "series" ? opts.series[seriesIndex] : t.value;
        if (raw === null || raw === void 0 || raw === "") return;
        const value = Number(raw);
        if (!Number.isFinite(value)) return;
        const shape = t.shape === "triangle" || t.shape === "circle" ? t.shape : "line";
        const position = t.position === "outside" || t.position === "inside" || t.position === "across" ? t.position : shape === "triangle" ? "outside" : "across";
        const half = (seriesIndex === 0 && valueArcHidden && geo.bands ? geo.bands.thickness : ring.thickness) / 2;
        const lenRaw = (_b = t.length) != null ? _b : shape === "line" ? "130%" : 10;
        const length = typeof lenRaw === "string" && lenRaw.trim().endsWith("%") ? ring.thickness * parseFloat(lenRaw) / 100 : Math.max(0, Number(lenRaw) || 0);
        const width = Math.max(
          0,
          Number((_c = t.width) != null ? _c : shape === "line" ? 3 : 12) || 0
        );
        const r = ring.radius;
        const [near, far] = position === "outside" ? [r + half, r + half + length] : position === "inside" ? [r - half, r - half - length] : [r - length / 2, r + length / 2];
        const color = t.color || w.config.chart.foreColor;
        const strokeColor = t.strokeColor || "none";
        const strokeWidth = (_d = t.strokeWidth) != null ? _d : 0;
        const cls = ["apexcharts-radial-target"];
        if (t.cssClass) cls.push(t.cssClass);
        const tg = graphics.group({ class: cls.join(" ") });
        tg.node.setAttribute("rel", String(seriesIndex + 1));
        tg.node.setAttribute("data-target-index", String(k));
        if (t.id != null) tg.node.setAttribute("data-target-id", String(t.id));
        g.add(tg);
        let el;
        if (shape === "line") {
          el = graphics.drawLine(cx, cy - near, cx, cy - far, color, 0, width);
        } else if (shape === "triangle") {
          el = graphics.drawPath({
            d: `M ${cx} ${cy - near} L ${cx - width / 2} ${cy - far} L ${cx + width / 2} ${cy - far} Z`,
            stroke: strokeColor,
            strokeWidth,
            fill: color,
            strokeLinecap: "butt"
          });
        } else {
          const mid = (near + far) / 2;
          el = graphics.drawCircle(length / 2, {
            cx,
            cy: cy - mid,
            r: length / 2,
            fill: color,
            stroke: strokeColor,
            "stroke-width": strokeWidth
          });
        }
        el.node.classList.add("apexcharts-radial-target-shape");
        const shapeG = graphics.group({
          class: "apexcharts-radial-target-mark"
        });
        shapeG.add(el);
        tg.add(shapeG);
        const lab = t.label;
        let elLabel = null;
        let placeLabel = () => {
        };
        if (lab && lab.text != null && lab.text !== "") {
          const style = lab.style || {};
          const fontSize = style.fontSize || "11px";
          const fs = parseFloat(fontSize) || 11;
          const out = position === "inside" ? -1 : 1;
          const tip = position === "inside" ? Math.min(near, far) : Math.max(near, far);
          const offset = Number((_e = lab.offset) != null ? _e : 4);
          elLabel = graphics.drawText({
            x: cx,
            y: cy,
            text: String(lab.text),
            textAnchor: "middle",
            dominantBaseline: "middle",
            fontSize,
            fontFamily: style.fontFamily,
            fontWeight: (_f = style.fontWeight) != null ? _f : 600,
            foreColor: style.color || color,
            cssClass: "apexcharts-radial-target-label"
          });
          placeLabel = (a) => {
            const rad = a * Math.PI / 180;
            const dx = Math.sin(rad) * out;
            const dy = -Math.cos(rad) * out;
            const rho = tip + out * (offset + Math.abs(dy) * fs / 2);
            const p = Utils.polarToCartesian(cx, cy, rho, a);
            elLabel.node.setAttribute("x", String(p.x));
            elLabel.node.setAttribute("y", String(p.y));
            elLabel.node.setAttribute(
              "text-anchor",
              dx > 0.3 ? "start" : dx < -0.3 ? "end" : "middle"
            );
          };
          tg.add(elLabel);
        }
        const to = geo.angle(value);
        const key = t.id != null ? `id:${t.id}` : `i:${k}`;
        nextAngles.set(key, to);
        const prev = prevAngles.get(key);
        let from = to;
        let dur = 0;
        let delay = 0;
        if (moving && isInitialMount) {
          from = geo.startAngle;
          dur = anim.speed;
          delay = radial.animBeginArr[seriesIndex] || 0;
        } else if (moving && radial.dynamicAnim && gl.dataChanged && prev !== void 0) {
          from = prev;
          dur = anim.dynamicAnimation.speed;
        }
        const node = shapeG.node;
        const place = (a) => {
          node.setAttribute("transform", `rotate(${a} ${cx} ${cy})`);
          placeLabel(a);
        };
        place(from);
        if (dur > 0 && from !== to) {
          runs.push({ node, label: elLabel, from, to, delay, dur, place });
        } else if (from !== to) {
          place(to);
        }
      }
    );
    this.angles = nextAngles;
    this.stop();
    if (runs.length) {
      const startAt = performance.now();
      const step = (now) => {
        if (this.w.globals.isDestroyed) {
          gl.radialTargetRAF = null;
          return;
        }
        let done = true;
        runs.forEach((run) => {
          const t = Math.max(
            0,
            Math.min(1, (now - startAt - run.delay) / run.dur)
          );
          if (t < 1) done = false;
          run.place(run.from + (run.to - run.from) * ease(t));
        });
        gl.radialTargetRAF = done ? null : BrowserAPIs.requestAnimationFrame(step);
      };
      gl.radialTargetRAF = BrowserAPIs.requestAnimationFrame(step);
    }
    return g;
  }
}
_core__default.registerFeatures({ radialTargets: RadialTargets });
export {
  default2 as default
};
