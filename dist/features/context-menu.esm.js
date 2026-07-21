/*!
 * ApexCharts v6.5.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Environment = _core.__apex_Environment_Environment;
const Utils = _core.__apex_Utils;
class ContextMenu {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.menu = null;
    this._items = [];
    this._focusIndex = -1;
    this._trigger = null;
    this._onContext = this._onContext.bind(this);
    this._onDocDown = this._onDocDown.bind(this);
    this._onKey = this._onKey.bind(this);
    this._afterRender = this._afterRender.bind(this);
    ctx.addEventListener("mounted", this._afterRender);
    ctx.addEventListener("updated", this._afterRender);
  }
  _cfg() {
    return this.w.config.chart.contextMenu || {};
  }
  _enabled() {
    return this._cfg().enabled === true;
  }
  _doc() {
    return this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
  }
  /** (Re)attach the contextmenu trigger to the freshly (re)built SVG. */
  _afterRender() {
    this._detachTrigger();
    this.close();
    if (!this._enabled() || !Environment.isBrowser()) return;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (!svg) return;
    svg.addEventListener("contextmenu", this._onContext);
    this._trigger = svg;
  }
  _detachTrigger() {
    if (this._trigger) {
      this._trigger.removeEventListener("contextmenu", this._onContext);
      this._trigger = null;
    }
  }
  /** @param {any} e */
  _onContext(e) {
    if (!this._enabled()) return;
    e.preventDefault();
    this.open(e.clientX, e.clientY);
  }
  /**
   * Client pixel -> data {x,y} via the grid client-rect fraction (scale
   * independent). Null when the grid is not measurable.
   * @param {number} cx @param {number} cy
   * @returns {{x:number,y:number}|null}
   */
  _clientToData(cx, cy) {
    const w = this.w;
    const grid = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!grid) return null;
    const r = grid.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = clamp((cx - r.left) / r.width);
    const fy = clamp((cy - r.top) / r.height);
    const x = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const s = w.globals.yAxisScale && w.globals.yAxisScale[0];
    const ymin = s && isFinite(s.niceMin) ? s.niceMin : w.globals.minY;
    const ymax = s && isFinite(s.niceMax) ? s.niceMax : w.globals.maxY;
    const y = ymax - fy * (ymax - ymin);
    return { x, y };
  }
  /**
   * Resolve the configured items into runnable entries, dropping built-ins
   * whose dependency is absent (e.g. measure not enabled).
   * @param {any} context
   * @returns {Array<{id:string,label:string,run:Function}>}
   */
  _resolveItems(context) {
    const cfg = this._cfg();
    const raw = Array.isArray(cfg.items) && cfg.items.length ? cfg.items : ["annotate", "xline", "yline", "measure"];
    const labels = cfg.labels || {};
    const out = [];
    raw.forEach((it) => {
      if (typeof it === "string") {
        if (it === "annotate") {
          out.push({
            id: "annotate",
            label: labels.annotate || "Add note here",
            run: () => this._annotate(context)
          });
        } else if (it === "xline") {
          out.push({
            id: "xline",
            label: labels.xline || "Annotate here",
            run: () => this._line(context, "x")
          });
        } else if (it === "yline") {
          out.push({
            id: "yline",
            label: labels.yline || "Mark this level",
            run: () => this._line(context, "y")
          });
        } else if (it === "measure") {
          const m = this.ctx.measure;
          const on = m && this.w.config.chart.measure && this.w.config.chart.measure.enabled;
          if (on) {
            out.push({
              id: "measure",
              label: labels.measure || "Measure from here",
              run: () => m.seedFromClient(context.clientX, context.clientY)
            });
          }
        }
      } else if (it && typeof it === "object" && typeof it.onClick === "function") {
        out.push({
          id: it.id || "custom",
          label: it.label || "Action",
          run: () => it.onClick(this.ctx, context)
        });
      }
    });
    return out;
  }
  /** @param {any} context */
  _annotate(context) {
    if (context.x == null || context.y == null) return;
    const cfg = this._cfg();
    const ink = this.ctx.ink;
    if (ink && typeof ink.createAt === "function") {
      ink.createAt(context.x, context.y, { text: cfg.noteText || "Note" });
      return;
    }
    this.ctx.addPointAnnotation(
      {
        x: context.x,
        y: context.y,
        marker: { size: 5 },
        label: {
          text: cfg.noteText || "Note",
          style: { background: "#fff", color: "#334155" }
        }
      },
      true
    );
  }
  /**
   * The 'xline' / 'yline' items: drop a dashed line annotation at the clicked
   * data point ('x' = vertical line at the clicked x, 'y' = horizontal line
   * at the clicked y). Lines only: no x2/y2 is ever set, so this never
   * creates a range rectangle. Both items share chart.contextMenu.line
   * ({ text, strokeDashArray, color }) for styling.
   * @param {any} context @param {'x'|'y'} axis
   */
  _line(context, axis) {
    const lc = this._cfg().line || {};
    const val = axis === "x" ? context.x : context.y;
    if (val == null) return;
    const ink = this.ctx.ink;
    if (ink && typeof ink.createLineAt === "function") {
      ink.createLineAt(axis, val, {
        text: lc.text,
        strokeDashArray: lc.strokeDashArray,
        color: lc.color
      });
      return;
    }
    const anno = {
      strokeDashArray: lc.strokeDashArray != null ? lc.strokeDashArray : 4
    };
    if (lc.text) anno.label = { text: lc.text };
    if (lc.color) {
      anno.borderColor = lc.color;
      anno.label = Utils.extend(anno.label || {}, { borderColor: lc.color });
    }
    if (axis === "x") {
      this.ctx.addXaxisAnnotation(Utils.extend(anno, { x: val }), true);
    } else {
      this.ctx.addYaxisAnnotation(Utils.extend(anno, { y: val }), true);
    }
  }
  /**
   * Open the menu at a client-space point.
   * @param {number} clientX @param {number} clientY
   */
  open(clientX, clientY) {
    this.close();
    const w = this.w;
    const elWrap = w.dom.elWrap;
    const doc = this._doc();
    if (!elWrap || !doc) return;
    const data = this._clientToData(clientX, clientY);
    const g = w.globals;
    const context = {
      x: data ? data.x : null,
      y: data ? data.y : null,
      seriesIndex: g.capturedSeriesIndex >= 0 ? g.capturedSeriesIndex : null,
      dataPointIndex: g.capturedDataPointIndex >= 0 ? g.capturedDataPointIndex : null,
      clientX,
      clientY
    };
    const items = this._resolveItems(context);
    if (!items.length) return;
    this._items = items;
    const menu = doc.createElement("div");
    menu.className = "apexcharts-context-menu";
    menu.setAttribute("role", "menu");
    menu.style.position = "absolute";
    menu.style.visibility = "hidden";
    items.forEach((it, i) => {
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "apexcharts-context-menu-item";
      btn.setAttribute("role", "menuitem");
      btn.tabIndex = -1;
      btn.textContent = it.label;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._activate(i);
      });
      btn.addEventListener("mouseenter", () => this._focus(i));
      menu.appendChild(btn);
    });
    elWrap.appendChild(menu);
    this.menu = menu;
    const wrapRect = elWrap.getBoundingClientRect();
    let left = clientX - wrapRect.left;
    let top = clientY - wrapRect.top;
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const maxLeft = Math.max(0, elWrap.clientWidth - mw);
    const maxTop = Math.max(0, elWrap.clientHeight - mh);
    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = maxTop;
    menu.style.left = Math.max(0, left) + "px";
    menu.style.top = Math.max(0, top) + "px";
    menu.style.visibility = "visible";
    doc.addEventListener("mousedown", this._onDocDown, true);
    doc.addEventListener("keydown", this._onKey, true);
    this._focus(0);
  }
  /** @param {number} i */
  _focus(i) {
    if (!this.menu) return;
    const btns = this.menu.querySelectorAll(".apexcharts-context-menu-item");
    if (this._focusIndex >= 0 && btns[this._focusIndex]) {
      btns[this._focusIndex].classList.remove("apexcharts-context-menu-item--active");
    }
    this._focusIndex = i;
    if (btns[i]) {
      btns[i].classList.add("apexcharts-context-menu-item--active");
      if (typeof btns[i].focus === "function") btns[i].focus();
    }
  }
  /** @param {number} i */
  _activate(i) {
    const it = this._items[i];
    this.close();
    if (it) it.run();
  }
  /** @param {any} e */
  _onDocDown(e) {
    if (this.menu && this.menu.contains(e.target)) return;
    this.close();
  }
  /** @param {any} e */
  _onKey(e) {
    if (!this.menu || !this._items.length) return;
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      this._focus((this._focusIndex + 1) % this._items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this._focus((this._focusIndex - 1 + this._items.length) % this._items.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this._activate(this._focusIndex < 0 ? 0 : this._focusIndex);
    }
  }
  close() {
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousedown", this._onDocDown, true);
      doc.removeEventListener("keydown", this._onKey, true);
    }
    if (this.menu && this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }
    this.menu = null;
    this._items = [];
    this._focusIndex = -1;
  }
  teardown() {
    this.close();
    this._detachTrigger();
  }
}
_core__default.registerFeatures({ contextMenu: ContextMenu });
export {
  default2 as default
};
