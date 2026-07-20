/*!
 * ApexCharts v6.4.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = _core.__apex_Utils;
const Options = _core.__apex_Options;
const DRAG_CLASS = "apexcharts-ink-draggable";
const TYPES = ["point", "xaxis", "yaxis"];
const EDGE_PX = 8;
const CLICK_SLOP_PX = 2;
const FONT_STEPS = [10, 11, 12, 14, 17, 20];
const MARKER_SHAPES = ["circle", "square", "diamond", "triangle"];
const SHAPE_GLYPHS = {
  circle: "●",
  square: "■",
  diamond: "◆",
  triangle: "▲"
};
const NOTE_COLORS = [
  "#ffffff",
  "#334155",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626"
];
const TRASH_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';
class InkLayer {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._wired = false;
    this._drag = null;
    this._editor = null;
    this._creating = false;
    this._createSeq = 0;
    this._attach = this._attach.bind(this);
    this._onRerender = this._onRerender.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onCreateClick = this._onCreateClick.bind(this);
    this._onDocDownEditor = this._onDocDownEditor.bind(this);
    if (this._enabledGlobally() || this._hasDraggable() || this._paletteEnabled()) {
      this._wire();
    }
  }
  _enabledGlobally() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.enabled);
  }
  _paletteEnabled() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.palette);
  }
  _snapEnabled() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.snap);
  }
  // ─── P5: snap to gridlines ────────────────────────────────────────────────
  /** @param {number} v @param {number[]} ticks @returns {number} nearest tick */
  _nearest(v, ticks) {
    let best = v;
    let bd = Infinity;
    for (let i = 0; i < ticks.length; i++) {
      const d = Math.abs(ticks[i] - v);
      if (d < bd) {
        bd = d;
        best = ticks[i];
      }
    }
    return best;
  }
  /**
   * Snap an x value to the nearest x gridline (numeric axes only).
   * @param {number} x
   */
  _snapX(x) {
    if (!this._snapEnabled() || typeof x !== "number") return x;
    const s = this.w.globals.xAxisScale;
    return s && Array.isArray(s.result) && s.result.length ? this._nearest(x, s.result) : x;
  }
  /**
   * Snap a y value to the nearest y gridline.
   * @param {number} y @param {number} si
   */
  _snapY(y, si) {
    if (!this._snapEnabled() || typeof y !== "number") return y;
    const scales = this.w.globals.yAxisScale;
    const s = scales && scales[si];
    return s && Array.isArray(s.result) && s.result.length ? this._nearest(y, s.result) : y;
  }
  /** @param {string} type @returns {any[]} the config annotations of a type */
  _annoList(type) {
    const a = this.w.config.annotations;
    if (!a) return [];
    const key = type === "point" ? "points" : type;
    return Array.isArray(a[key]) ? a[key] : [];
  }
  /** @param {any} anno */
  _isDraggable(anno) {
    if (!anno) return false;
    if (anno.draggable === true) return true;
    if (anno.draggable === false) return false;
    return this._enabledGlobally();
  }
  _hasDraggable() {
    return TYPES.some((t) => this._annoList(t).some((p) => this._isDraggable(p)));
  }
  _wire() {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("mounted", this._onRerender);
    this.ctx.addEventListener("updated", this._onRerender);
  }
  /**
   * A full (re)render rebuilds the SVG and may swap the annotations config
   * (updateOptions, undo restore), so an open editor card points at stale
   * state: drop it (without committing) before rebinding handlers. Targeted
   * redraws call _attach() directly and keep the card open.
   */
  _onRerender() {
    this._closeEditor(false);
    this._attach();
  }
  /**
   * After each (re)render, bind drag + edit handlers to every draggable
   * annotation's elements. Idempotent via a per-node flag so a targeted redraw
   * re-runs this without double-binding the untouched annotations.
   */
  _attach() {
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    TYPES.forEach((type) => {
      this._annoList(type).forEach((anno, index) => {
        if (!this._isDraggable(anno)) return;
        if (!anno.id) {
          anno.id = "apexcharts-ink-" + type + "-" + index + "-" + w.globals.chartID;
        }
        baseEl.querySelectorAll("." + anno.id).forEach((el) => {
          if (el.__inkBound) return;
          el.__inkBound = true;
          el.style.cursor = "move";
          el.classList.add(DRAG_CLASS);
          el.addEventListener(
            "mousedown",
            (e) => this._onDown(e, type, index)
          );
          el.addEventListener(
            "touchstart",
            (e) => this._onDown(e, type, index)
          );
          el.addEventListener("dblclick", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._startEdit(type, index, { select: true });
          });
        });
      });
    });
    if (this._paletteEnabled()) this._renderPalette();
  }
  // ─── drag / resize ────────────────────────────────────────────────────────
  /**
   * @param {any} e @param {string} type @param {number} index
   */
  _onDown(e, type, index) {
    if (e.button && e.button !== 0) return;
    const w = this.w;
    const doc = w.dom.baseEl && w.dom.baseEl.ownerDocument;
    if (!doc) return;
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    const isTouch = e.type === "touchstart";
    const ev = isTouch ? e.touches[0] : e;
    const svgRoot = w.dom.Paper && w.dom.Paper.node;
    const ctm = svgRoot && svgRoot.getScreenCTM ? svgRoot.getScreenCTM() : null;
    const anno = this._annoList(type)[index];
    let mode = "move";
    let rect = null;
    let origX = 0;
    let origW = 0;
    if (type === "xaxis" && anno.x2 != null) {
      rect = w.dom.baseEl.querySelector(".apexcharts-annotation-rect." + anno.id);
      if (rect) {
        const r = rect.getBoundingClientRect();
        if (Math.abs(ev.clientX - r.left) <= EDGE_PX) mode = "resize-x1";
        else if (Math.abs(ev.clientX - r.right) <= EDGE_PX) mode = "resize-x2";
        origX = parseFloat(rect.getAttribute("x")) || 0;
        origW = parseFloat(rect.getAttribute("width")) || 0;
      }
    }
    this._drag = {
      type,
      index,
      anno,
      els: Array.from(w.dom.baseEl.querySelectorAll("." + anno.id)),
      mode,
      rect,
      origX,
      origW,
      startX: ev.clientX,
      startY: ev.clientY,
      scaleX: ctm && ctm.a ? ctm.a : 1,
      scaleY: ctm && ctm.d ? ctm.d : 1,
      dxPixel: 0,
      dyPixel: 0,
      moved: false
    };
    doc.addEventListener("mousemove", this._onMove);
    doc.addEventListener("touchmove", this._onMove, { passive: false });
    doc.addEventListener("mouseup", this._onUp);
    doc.addEventListener("touchend", this._onUp);
  }
  /** @param {any} me */
  _onMove(me) {
    const d = this._drag;
    if (!d) return;
    if (me.cancelable) me.preventDefault();
    const mev = me.type === "touchmove" ? me.touches[0] : me;
    d.dxPixel = (mev.clientX - d.startX) / d.scaleX;
    d.dyPixel = (mev.clientY - d.startY) / d.scaleY;
    if (Math.abs(d.dxPixel) > CLICK_SLOP_PX || Math.abs(d.dyPixel) > CLICK_SLOP_PX) {
      d.moved = true;
    }
    if (d.mode === "move") {
      const t = `translate(${d.dxPixel} ${d.dyPixel})`;
      d.els.forEach((el) => el.setAttribute("transform", t));
    } else if (d.rect) {
      if (d.mode === "resize-x1") {
        d.rect.setAttribute("x", d.origX + d.dxPixel);
        d.rect.setAttribute("width", Math.max(1, d.origW - d.dxPixel));
      } else if (d.mode === "resize-x2") {
        d.rect.setAttribute("width", Math.max(1, d.origW + d.dxPixel));
      }
    }
  }
  _onUp() {
    const d = this._drag;
    this._drag = null;
    this._teardownDocListeners();
    if (!d || !d.moved) {
      if (d) {
        d.els.forEach((el) => el.removeAttribute("transform"));
        this._startEdit(d.type, d.index);
      }
      return;
    }
    const anno = this._annoList(d.type)[d.index];
    if (!anno) return;
    this._applyDelta(d, anno);
    d.els.forEach((el) => el.removeAttribute("transform"));
    this._redrawAnno(d.type, anno, d.index);
    this._checkpoint("ink:drag");
    this._fireDragged(d.type, anno, d.index);
  }
  /**
   * Record a Rewind (undo) checkpoint for an ink edit. Targeted redraws fire no
   * 'updated' event, so History would otherwise miss them. No-op when the
   * history feature is absent or disabled.
   * @param {string} label
   */
  _checkpoint(label) {
    var _a, _b;
    (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, label);
  }
  /**
   * Mutate the annotation's config from the pixel drag delta (type + mode aware).
   * @param {any} d @param {any} anno
   */
  _applyDelta(d, anno) {
    const w = this.w;
    const dxData = w.layout.gridWidth ? d.dxPixel * (w.globals.xRange / w.layout.gridWidth) : 0;
    if (d.type === "point") {
      const { newX, newY } = this._invertPoint(anno, d.dxPixel, d.dyPixel);
      anno.x = this._snapX(newX);
      if (newY != null) {
        const yi = anno.yAxisIndex || 0;
        const map = w.globals.seriesYAxisMap;
        anno.y = this._snapY(newY, map && map[yi] ? map[yi][0] : 0);
      }
      return;
    }
    if (d.type === "xaxis") {
      if (typeof anno.x !== "number") return;
      if (d.mode === "move") {
        if (typeof anno.x2 === "number") {
          anno.x += dxData;
          anno.x2 += dxData;
        } else {
          anno.x = this._snapX(anno.x + dxData);
        }
      } else if (d.mode === "resize-x1" || d.mode === "resize-x2") {
        const xIsLeft = anno.x2 == null || anno.x <= anno.x2;
        const grow = d.mode === "resize-x2" ? !xIsLeft : xIsLeft;
        if (grow) anno.x = this._snapX(anno.x + dxData);
        else if (typeof anno.x2 === "number") anno.x2 = this._snapX(anno.x2 + dxData);
      }
      return;
    }
    if (d.type === "yaxis") {
      const yi = anno.yAxisIndex || 0;
      const map = w.globals.seriesYAxisMap;
      const si = map && map[yi] ? map[yi][0] : 0;
      const yRange = w.globals.yRange ? w.globals.yRange[si] : null;
      if (yRange == null || !w.layout.gridHeight) return;
      const dyData = -d.dyPixel * (yRange / w.layout.gridHeight);
      if (typeof anno.y2 === "number") {
        if (typeof anno.y === "number") anno.y += dyData;
        anno.y2 += dyData;
      } else if (typeof anno.y === "number") {
        anno.y = this._snapY(anno.y + dyData, si);
      }
    }
  }
  /**
   * Invert a pixel drag delta to a point annotation's data x/y.
   * @param {any} anno @param {number} dxPixel @param {number} dyPixel
   * @returns {{newX:any, newY:any}}
   */
  _invertPoint(anno, dxPixel, dyPixel) {
    const w = this.w;
    const categoryX = (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !w.axisFlags.dataFormatXNumeric;
    let newX = anno.x;
    if (!categoryX && typeof anno.x === "number" && w.layout.gridWidth) {
      newX = anno.x + dxPixel * (w.globals.xRange / w.layout.gridWidth);
    }
    let newY = anno.y;
    const yi = anno.yAxisIndex || 0;
    const map = w.globals.seriesYAxisMap;
    const si = map && map[yi] ? map[yi][0] : 0;
    const yRange = w.globals.yRange ? w.globals.yRange[si] : null;
    const logY = w.config.yaxis[yi] && w.config.yaxis[yi].logarithmic;
    if (typeof anno.y === "number" && yRange != null && !logY && w.layout.gridHeight) {
      newY = anno.y - dyPixel * (yRange / w.layout.gridHeight);
    }
    return { newX, newY };
  }
  /**
   * Targeted redraw of one annotation: drop its elements and re-add the shape +
   * label + label background at the current config coordinates (no full chart
   * re-render, and repeat-safe unlike updateOptions({})).
   * @param {string} type @param {any} anno @param {number} index
   */
  _redrawAnno(type, anno, index) {
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const annotations = this.ctx.annotations;
    if (!baseEl || !annotations) return;
    baseEl.querySelectorAll("." + anno.id).forEach((el) => el.remove());
    const group = baseEl.querySelector(".apexcharts-" + type + "-annotations");
    if (!group) return;
    if (type === "point" && annotations.pointsAnnotations) {
      annotations.pointsAnnotations.addPointAnnotation(anno, group, index);
    } else if (type === "xaxis" && annotations.xAxisAnnotations) {
      annotations.xAxisAnnotations.addXaxisAnnotation(anno, group, index);
    } else if (type === "yaxis" && annotations.yAxisAnnotations) {
      annotations.yAxisAnnotations.addYaxisAnnotation(anno, group, index);
    }
    const labelEl = baseEl.querySelector(
      ".apexcharts-" + type + "-annotation-label." + anno.id
    );
    if (labelEl && annotations.helpers && anno.label && anno.label.text) {
      const elRect = annotations.helpers.addBackgroundToAnno(labelEl, anno);
      if (elRect && labelEl.parentNode) {
        labelEl.parentNode.insertBefore(elRect.node, labelEl);
      }
    }
    this._attach();
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDragged(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index, x: anno.x, y: anno.y };
    if (anno.x2 != null) args.x2 = anno.x2;
    if (anno.y2 != null) args.y2 = anno.y2;
    const events = this.w.config.chart.events;
    if (typeof events.annotationDragged === "function") {
      events.annotationDragged(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationDragged", [this.ctx, args]);
  }
  // ─── P3: click-to-create ─────────────────────────────────────────────────
  /**
   * Enter create mode: the next click on the plot area drops a new draggable
   * point annotation there and opens its label editor.
   */
  startCreate() {
    if (this._creating) return;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (!svg) return;
    this._creating = true;
    svg.style.cursor = "crosshair";
    svg.addEventListener("click", this._onCreateClick, true);
    this._syncPalette();
  }
  /** Leave create mode. */
  stopCreate() {
    if (!this._creating) return;
    this._creating = false;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (svg) {
      svg.style.cursor = "";
      svg.removeEventListener("click", this._onCreateClick, true);
    }
    this._syncPalette();
  }
  /** @param {any} e */
  _onCreateClick(e) {
    if (!this._creating) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = this._pixelToData(e.clientX, e.clientY);
    this.stopCreate();
    if (!pos) return;
    this.createAt(pos.x, pos.y);
  }
  /**
   * Create a draggable note at data coordinates and open its editor card.
   * Public: the context menu's "Add note here" routes here so its notes are
   * config-backed too, and thus draggable, editable, persistable and undoable.
   * @param {any} x @param {any} y @param {{text?: string}} [opts]
   * @returns {any} the created annotation config
   */
  createAt(x, y, opts = {}) {
    const w = this.w;
    this._wire();
    this._createSeq += 1;
    const id = "apexcharts-ink-new-" + this._createSeq + "-" + w.globals.chartID;
    const anno = Utils.extend(new Options().pointAnnotation, {
      x,
      y,
      id,
      draggable: true,
      label: { text: opts.text || "Note" }
    });
    if (!w.config.annotations) w.config.annotations = {};
    if (!Array.isArray(w.config.annotations.points)) w.config.annotations.points = [];
    w.config.annotations.points.push(anno);
    const index = w.config.annotations.points.length - 1;
    this._redrawAnno("point", anno, index);
    this._checkpoint("ink:create");
    this._fireCreated("point", anno, index);
    this._startEdit("point", index, { select: true });
    return anno;
  }
  /**
   * Create a draggable dashed LINE annotation at a data value and open its
   * editor card: axis 'x' drops a vertical line at a data x, axis 'y' a
   * horizontal line at a data y. Public: the context menu's "Annotate here"
   * routes here so its lines are config-backed too, and thus draggable,
   * editable, persistable and undoable. Lines only: x2/y2 are never set, so
   * this can never produce a range rectangle.
   * @param {'x'|'y'} axis @param {any} val
   * @param {{text?: string, strokeDashArray?: number, color?: string, select?: boolean}} [opts]
   * @returns {any} the created annotation config
   */
  createLineAt(axis, val, opts = {}) {
    const w = this.w;
    this._wire();
    this._createSeq += 1;
    const id = "apexcharts-ink-new-" + this._createSeq + "-" + w.globals.chartID;
    const type = axis === "y" ? "yaxis" : "xaxis";
    const defaults = type === "yaxis" ? new Options().yAxisAnnotation : new Options().xAxisAnnotation;
    const over = {
      id,
      draggable: true,
      strokeDashArray: opts.strokeDashArray != null ? opts.strokeDashArray : 4,
      label: { text: opts.text || "" }
    };
    if (opts.color) {
      over.borderColor = opts.color;
      over.label.borderColor = opts.color;
    }
    if (type === "yaxis") over.y = val;
    else over.x = val;
    const anno = Utils.extend(defaults, over);
    if (!w.config.annotations) w.config.annotations = {};
    if (!Array.isArray(w.config.annotations[type])) w.config.annotations[type] = [];
    w.config.annotations[type].push(anno);
    const index = w.config.annotations[type].length - 1;
    this._redrawAnno(type, anno, index);
    this._checkpoint("ink:create");
    this._fireCreated(type, anno, index);
    if (opts.select !== false) this._startEdit(type, index, { select: true });
    return anno;
  }
  /**
   * Convert a client-space point to data coordinates (absolute, for create).
   * @param {number} clientX @param {number} clientY
   * @returns {{x:any, y:any}|null}
   */
  _pixelToData(clientX, clientY) {
    const w = this.w;
    const gridEl = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!gridEl) return null;
    const g = gridEl.getBoundingClientRect();
    if (!g.width || !g.height) return null;
    const fx = (clientX - g.left) / g.width;
    const fy = (clientY - g.top) / g.height;
    const minX = w.globals.minX;
    const xRange = w.globals.xRange;
    const minY = w.globals.minYArr && w.globals.minYArr[0] != null ? w.globals.minYArr[0] : w.globals.minY;
    const yRange = w.globals.yRange && w.globals.yRange[0] != null ? w.globals.yRange[0] : w.globals.maxY - w.globals.minY;
    let x = minX + fx * xRange;
    const y = minY + (1 - fy) * yRange;
    const categoryX = (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !w.axisFlags.dataFormatXNumeric;
    if (categoryX) x = Math.round(x);
    return { x, y };
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireCreated(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index };
    if (typeof anno.x !== "undefined") args.x = anno.x;
    if (typeof anno.y !== "undefined") args.y = anno.y;
    const events = this.w.config.chart.events;
    if (typeof events.annotationCreated === "function") {
      events.annotationCreated(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationCreated", [this.ctx, args]);
  }
  // ─── P3: tool palette ────────────────────────────────────────────────────
  /** Render a minimal "add note" toggle into the chart wrap (once per render). */
  _renderPalette() {
    const w = this.w;
    const elWrap = w.dom.elWrap;
    if (!elWrap || elWrap.querySelector(".apexcharts-ink-palette")) return;
    const doc = elWrap.ownerDocument;
    const bar = doc.createElement("div");
    bar.className = "apexcharts-ink-palette";
    const s = bar.style;
    s.position = "absolute";
    s.top = "6px";
    s.left = "6px";
    s.zIndex = "15";
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "apexcharts-ink-add";
    btn.textContent = "+ Note";
    const bs = btn.style;
    bs.cursor = "pointer";
    bs.font = "12px sans-serif";
    bs.padding = "4px 9px";
    bs.borderRadius = "5px";
    bs.border = "1px solid #6366f1";
    bs.color = "#4338ca";
    bs.background = "#fff";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this._creating) this.stopCreate();
      else this.startCreate();
    });
    bar.appendChild(btn);
    elWrap.appendChild(bar);
    this._syncPalette();
  }
  /** Reflect create-mode state on the palette button. */
  _syncPalette() {
    const elWrap = this.w.dom.elWrap;
    const btn = (
      /** @type {any} */
      elWrap && elWrap.querySelector(".apexcharts-ink-add")
    );
    if (!btn) return;
    if (this._creating) {
      btn.style.background = "#6366f1";
      btn.style.color = "#fff";
      btn.textContent = "Click chart...";
    } else {
      btn.style.background = "#fff";
      btn.style.color = "#4338ca";
      btn.textContent = "+ Note";
    }
  }
  // ─── P2 + P6: the floating note editor card ──────────────────────────────
  // Click (or double-click) an ink-managed annotation to open a small card
  // anchored to it: rename inline, recolor via accent swatches, toggle bold,
  // step the font size, size/reshape the marker (points), or delete the note.
  /** @returns {string[]} the accent swatches offered by the editor */
  _noteColors() {
    const ink = this.w.config.chart.ink;
    return ink && Array.isArray(ink.noteColors) && ink.noteColors.length ? ink.noteColors : NOTE_COLORS;
  }
  /**
   * Perceived-luminance check so text/border contrast follows the accent.
   * @param {string} hex
   */
  static _isLight(hex) {
    const h = String(hex || "").replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    if (isNaN(n) || full.length !== 6) return false;
    const r = n >> 16 & 255;
    const g = n >> 8 & 255;
    const b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
  }
  /** @param {any} style */
  static _isBold(style) {
    const fw = style && style.fontWeight;
    return fw === "bold" || parseInt(String(fw), 10) >= 600;
  }
  /**
   * Small icon/text button for the editor card. mousedown is prevented so the
   * text input keeps focus while formatting.
   * @param {any} doc @param {string} content @param {string} title
   * @param {Function} onClick @param {string} [extraClass] @param {boolean} [isSvg]
   */
  _cardBtn(doc, content, title, onClick, extraClass, isSvg) {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "apexcharts-ink-btn" + (extraClass ? " " + extraClass : "");
    b.title = title;
    b.setAttribute("aria-label", title);
    if (isSvg) b.innerHTML = content;
    else b.textContent = content;
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return b;
  }
  /**
   * Uppercase row caption ("Label" / "Line" / "Marker") for the editor card.
   * @param {any} doc @param {string} text
   */
  _cardLabel(doc, text) {
    const lab = doc.createElement("span");
    lab.className = "apexcharts-ink-cardlabel";
    lab.textContent = text;
    return lab;
  }
  /**
   * Color swatch button for the editor card. mousedown is prevented so the
   * text input keeps focus while restyling.
   * @param {any} doc @param {string} c
   * @param {(c: string) => void} pick @param {string} [extraClass]
   */
  _mkSwatch(doc, c, pick, extraClass) {
    const sw = doc.createElement("button");
    sw.type = "button";
    sw.className = "apexcharts-ink-swatch" + (extraClass ? " " + extraClass : "");
    sw.title = c;
    sw.setAttribute("aria-label", "Color " + c);
    sw.dataset.color = c;
    sw.style.background = c;
    sw.addEventListener("mousedown", (e) => e.preventDefault());
    sw.addEventListener("click", (e) => {
      e.stopPropagation();
      pick(c);
    });
    return sw;
  }
  /**
   * Open the floating editor card for an annotation.
   * @param {string} type @param {number} index
   * @param {{select?: boolean}} [opts] select: preselect the text (create / dblclick)
   */
  _startEdit(type, index, opts = {}) {
    const w = this.w;
    const anno = this._annoList(type)[index];
    const baseEl = w.dom.baseEl;
    const elWrap = w.dom.elWrap;
    if (!anno || !anno.id || !baseEl || !elWrap) return;
    this._closeEditor(false);
    const doc = baseEl.ownerDocument;
    const card = doc.createElement("div");
    card.className = "apexcharts-ink-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Edit note");
    card.style.visibility = "hidden";
    const rowText = doc.createElement("div");
    rowText.className = "apexcharts-ink-card-row";
    const input = doc.createElement("input");
    input.type = "text";
    input.className = "apexcharts-ink-editor";
    input.placeholder = "Note text";
    input.value = anno.label && anno.label.text || "";
    rowText.appendChild(input);
    rowText.appendChild(
      this._cardBtn(
        doc,
        TRASH_ICON,
        "Delete note",
        () => this._deleteAnno(),
        "apexcharts-ink-btn--delete",
        true
      )
    );
    card.appendChild(rowText);
    const rowStyle = doc.createElement("div");
    rowStyle.className = "apexcharts-ink-card-row";
    if (type !== "point") {
      rowStyle.appendChild(this._cardLabel(doc, "Label"));
    }
    this._noteColors().forEach((c) => {
      rowStyle.appendChild(this._mkSwatch(doc, c, (col) => this._applyColor(col)));
    });
    const sep = doc.createElement("span");
    sep.className = "apexcharts-ink-sep";
    rowStyle.appendChild(sep);
    rowStyle.appendChild(
      this._cardBtn(doc, "B", "Bold", () => this._toggleBold(), "apexcharts-ink-btn--bold")
    );
    rowStyle.appendChild(this._cardBtn(doc, "A-", "Smaller text", () => this._stepFont(-1)));
    rowStyle.appendChild(this._cardBtn(doc, "A+", "Larger text", () => this._stepFont(1)));
    card.appendChild(rowStyle);
    if (type !== "point") {
      const rowLine = doc.createElement("div");
      rowLine.className = "apexcharts-ink-card-row";
      rowLine.appendChild(this._cardLabel(doc, "Line"));
      this._noteColors().forEach((c) => {
        rowLine.appendChild(
          this._mkSwatch(
            doc,
            c,
            (col) => this._applyLineColor(col),
            "apexcharts-ink-swatch--line"
          )
        );
      });
      card.appendChild(rowLine);
    }
    if (type === "point") {
      const rowMarker = doc.createElement("div");
      rowMarker.className = "apexcharts-ink-card-row";
      rowMarker.appendChild(this._cardLabel(doc, "Marker"));
      rowMarker.appendChild(
        this._cardBtn(doc, "-", "Smaller marker", () => this._stepMarker(-1))
      );
      const sizeOut = doc.createElement("span");
      sizeOut.className = "apexcharts-ink-marker-size";
      rowMarker.appendChild(sizeOut);
      rowMarker.appendChild(
        this._cardBtn(doc, "+", "Larger marker", () => this._stepMarker(1))
      );
      rowMarker.appendChild(
        this._cardBtn(
          doc,
          SHAPE_GLYPHS.circle,
          "Marker shape",
          () => this._cycleShape(),
          "apexcharts-ink-btn--shape"
        )
      );
      card.appendChild(rowMarker);
    }
    elWrap.appendChild(card);
    this._editor = { card, input, type, index };
    this._positionCard();
    this._syncCard();
    card.style.visibility = "";
    input.focus();
    if (opts.select) input.select();
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this._closeEditor(false);
      } else if (e.key === "Enter" && e.target === input) {
        e.preventDefault();
        this._closeEditor(true);
      }
    });
    doc.addEventListener("mousedown", this._onDocDownEditor, true);
    doc.addEventListener("touchstart", this._onDocDownEditor, true);
  }
  /**
   * Commit + close on any press outside the card.
   * @param {any} e
   */
  _onDocDownEditor(e) {
    const ed = this._editor;
    if (!ed || ed.card.contains(e.target)) return;
    this._closeEditor(true);
  }
  /**
   * Anchor the card to the annotation's label (below it, or above when there
   * is no room), clamped inside the chart wrap. Re-run after each restyle
   * since the label rect changes.
   */
  _positionCard() {
    const ed = this._editor;
    if (!ed) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const elWrap = w.dom.elWrap;
    const anno = this._annoList(ed.type)[ed.index];
    if (!baseEl || !elWrap || !anno) return;
    const anchor = baseEl.querySelector(
      ".apexcharts-" + ed.type + "-annotation-label." + anno.id
    ) || baseEl.querySelector("." + anno.id);
    if (!anchor) return;
    const wrapRect = elWrap.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    const cw = ed.card.offsetWidth;
    const ch = ed.card.offsetHeight;
    let left = Math.round(aRect.left - wrapRect.left);
    let top = Math.round(aRect.bottom - wrapRect.top) + 8;
    if (top + ch > elWrap.clientHeight - 4) {
      top = Math.round(aRect.top - wrapRect.top) - ch - 8;
    }
    if (left + cw > elWrap.clientWidth - 4) left = elWrap.clientWidth - cw - 4;
    ed.card.style.left = Math.max(4, left) + "px";
    ed.card.style.top = Math.max(4, top) + "px";
  }
  /** Reflect the annotation's current style on the card controls. */
  _syncCard() {
    const ed = this._editor;
    if (!ed) return;
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    const style = anno.label && anno.label.style || {};
    const bg = String(style.background || "").toLowerCase();
    ed.card.querySelectorAll(".apexcharts-ink-swatch:not(.apexcharts-ink-swatch--line)").forEach((sw) => {
      sw.classList.toggle(
        "apexcharts-ink-swatch--active",
        (sw.dataset.color || "").toLowerCase() === bg
      );
    });
    const stroke = String(anno.borderColor || "").toLowerCase();
    ed.card.querySelectorAll(".apexcharts-ink-swatch--line").forEach((sw) => {
      sw.classList.toggle(
        "apexcharts-ink-swatch--active",
        (sw.dataset.color || "").toLowerCase() === stroke
      );
    });
    const boldBtn = ed.card.querySelector(".apexcharts-ink-btn--bold");
    if (boldBtn) {
      boldBtn.classList.toggle("apexcharts-ink-btn--active", InkLayer._isBold(style));
    }
    const m = anno.marker || {};
    const sizeOut = ed.card.querySelector(".apexcharts-ink-marker-size");
    if (sizeOut) {
      sizeOut.textContent = String(typeof m.size === "number" ? m.size : 4);
    }
    const shapeBtn = ed.card.querySelector(".apexcharts-ink-btn--shape");
    if (shapeBtn) {
      shapeBtn.textContent = SHAPE_GLYPHS[m.shape] || SHAPE_GLYPHS.circle;
    }
  }
  /**
   * Commit the input's text into the annotation (the card stays open). Also
   * runs before any style apply so typed-but-unconfirmed text survives the
   * redraw.
   * @param {any} ed
   */
  _commitTextOf(ed) {
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    const text = ed.input.value;
    if (!anno.label) anno.label = {};
    if (anno.label.text === text) return;
    anno.label.text = text;
    this._redrawAnno(ed.type, anno, ed.index);
    this._checkpoint("ink:edit");
    this._fireEdited(ed.type, anno, ed.index);
  }
  /**
   * Close the editor card. commit=true also commits the pending text. Style
   * edits apply immediately and are not rolled back by Escape; use undo.
   * @param {boolean} commit
   */
  _closeEditor(commit) {
    const ed = this._editor;
    if (!ed) return;
    this._editor = null;
    const doc = this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
    if (doc) {
      doc.removeEventListener("mousedown", this._onDocDownEditor, true);
      doc.removeEventListener("touchstart", this._onDocDownEditor, true);
    }
    if (ed.card.parentNode) ed.card.parentNode.removeChild(ed.card);
    if (commit) this._commitTextOf(ed);
  }
  /**
   * Apply a config mutation from a card control: commit pending text, mutate,
   * redraw, checkpoint for undo, then refresh + re-anchor the card.
   * @param {string} label @param {(anno: any) => void} mutate
   */
  _applyStyle(label, mutate) {
    const ed = this._editor;
    if (!ed) return;
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    this._commitTextOf(ed);
    if (!anno.label) anno.label = {};
    if (!anno.label.style) anno.label.style = {};
    mutate(anno);
    this._redrawAnno(ed.type, anno, ed.index);
    this._checkpoint(label);
    this._fireStyled(ed.type, anno, ed.index);
    this._syncCard();
    this._positionCard();
  }
  /**
   * Apply an accent color: label chip + marker (points) or line/range fill
   * (axis annotations), with text/border contrast following the luminance.
   * @param {string} c
   */
  _applyColor(c) {
    const ed = this._editor;
    if (!ed) return;
    const light = InkLayer._isLight(c);
    this._applyStyle("ink:style", (anno) => {
      anno.label.style.background = c;
      anno.label.style.color = light ? "#334155" : "#ffffff";
      anno.label.borderColor = light ? "#cbd5e1" : c;
      if (ed.type === "point") {
        if (!anno.marker) anno.marker = {};
        anno.marker.strokeColor = light ? "#334155" : c;
        anno.marker.fillColor = light ? "#ffffff" : c;
      }
    });
  }
  /**
   * Line-stroke color for axis annotations, separate from the label chip.
   * @param {string} c
   */
  _applyLineColor(c) {
    const ed = this._editor;
    if (!ed || ed.type === "point") return;
    this._applyStyle("ink:style", (anno) => {
      anno.borderColor = c;
      if (anno.x2 != null || anno.y2 != null) anno.fillColor = c;
    });
  }
  /**
   * Step the label font size through the preset scale.
   * @param {number} dir
   */
  _stepFont(dir) {
    this._applyStyle("ink:style", (anno) => {
      const cur = parseFloat(anno.label.style.fontSize) || 11;
      let i = 0;
      for (let k = 1; k < FONT_STEPS.length; k++) {
        if (Math.abs(FONT_STEPS[k] - cur) < Math.abs(FONT_STEPS[i] - cur)) i = k;
      }
      i = Math.min(FONT_STEPS.length - 1, Math.max(0, i + dir));
      anno.label.style.fontSize = FONT_STEPS[i] + "px";
    });
  }
  _toggleBold() {
    this._applyStyle("ink:style", (anno) => {
      anno.label.style.fontWeight = InkLayer._isBold(anno.label.style) ? 400 : 700;
    });
  }
  /**
   * Grow/shrink the point marker.
   * @param {number} dir
   */
  _stepMarker(dir) {
    this._applyStyle("ink:style", (anno) => {
      if (!anno.marker) anno.marker = {};
      const cur = typeof anno.marker.size === "number" ? anno.marker.size : 4;
      anno.marker.size = Math.min(14, Math.max(2, cur + dir));
    });
  }
  /** Cycle the point marker shape (circle, square, diamond, triangle). */
  _cycleShape() {
    this._applyStyle("ink:style", (anno) => {
      if (!anno.marker) anno.marker = {};
      const i = MARKER_SHAPES.indexOf(anno.marker.shape);
      anno.marker.shape = MARKER_SHAPES[(i + 1) % MARKER_SHAPES.length];
    });
  }
  /** Delete the annotation the editor is open on (undoable via Rewind). */
  _deleteAnno() {
    const ed = this._editor;
    if (!ed) return;
    const list = this._annoList(ed.type);
    const anno = list[ed.index];
    this._closeEditor(false);
    if (!anno) return;
    const baseEl = this.w.dom.baseEl;
    if (baseEl && anno.id) {
      baseEl.querySelectorAll("." + anno.id).forEach((el) => el.remove());
    }
    list.splice(ed.index, 1);
    for (let i = ed.index; i < list.length; i++) {
      this._redrawAnno(ed.type, list[i], i);
    }
    this._checkpoint("ink:delete");
    this._fireDeleted(ed.type, anno, ed.index);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireEdited(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index, text: anno.label ? anno.label.text : "" };
    const events = this.w.config.chart.events;
    if (typeof events.annotationEdited === "function") {
      events.annotationEdited(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationEdited", [this.ctx, args]);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireStyled(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index, label: anno.label, marker: anno.marker };
    const events = this.w.config.chart.events;
    if (typeof events.annotationStyled === "function") {
      events.annotationStyled(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationStyled", [this.ctx, args]);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDeleted(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index };
    const events = this.w.config.chart.events;
    if (typeof events.annotationDeleted === "function") {
      events.annotationDeleted(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationDeleted", [this.ctx, args]);
  }
  // ─── lifecycle ────────────────────────────────────────────────────────────
  _teardownDocListeners() {
    const doc = this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
    if (!doc) return;
    doc.removeEventListener("mousemove", this._onMove);
    doc.removeEventListener("touchmove", this._onMove);
    doc.removeEventListener("mouseup", this._onUp);
    doc.removeEventListener("touchend", this._onUp);
  }
  teardown() {
    var _a, _b, _c, _d;
    this._teardownDocListeners();
    this._closeEditor(false);
    this.stopCreate();
    this._drag = null;
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "mounted", this._onRerender);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "updated", this._onRerender);
      this._wired = false;
    }
  }
}
_core__default.registerFeatures({ ink: InkLayer });
export {
  default2 as default
};
