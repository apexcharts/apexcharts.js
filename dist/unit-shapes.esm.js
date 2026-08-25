var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target2 = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target2[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target2[prop] = source[prop];
    }
  return target2;
};
/*!
 * ApexCharts v7.0.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
const CMD = /[MmLlHhVvCcSsQqTtAaZz]/;
function flattenPath(d, tolerance = 0.6, keepLines = false) {
  const tol = tolerance > 0 ? tolerance : 0.6;
  const n = d.length;
  let i = 0;
  const polys = [];
  let poly = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let px = 0;
  let py = 0;
  let prev = "";
  const isWs = (c) => c === " " || c === "," || c === "	" || c === "\n" || c === "\r";
  function skip() {
    while (i < n && isWs(d[i])) i++;
  }
  function num() {
    skip();
    const start = i;
    if (d[i] === "+" || d[i] === "-") i++;
    while (i < n && d[i] >= "0" && d[i] <= "9") i++;
    if (d[i] === ".") {
      i++;
      while (i < n && d[i] >= "0" && d[i] <= "9") i++;
    }
    if (d[i] === "e" || d[i] === "E") {
      i++;
      if (d[i] === "+" || d[i] === "-") i++;
      while (i < n && d[i] >= "0" && d[i] <= "9") i++;
    }
    if (i === start) return null;
    const v = parseFloat(d.slice(start, i));
    return isFinite(v) ? v : null;
  }
  function flag() {
    skip();
    const c = d[i];
    if (c === "0" || c === "1") {
      i++;
      return c === "1";
    }
    return null;
  }
  function closePoly() {
    if (poly.length > (keepLines ? 1 : 2)) polys.push(poly);
    poly = [];
  }
  function move(x, y) {
    closePoly();
    cx = sx = x;
    cy = sy = y;
    poly = [{ x, y }];
  }
  function line(x, y) {
    poly.push({ x, y });
    cx = x;
    cy = y;
  }
  function cubic(x1, y1, x2, y2, x, y) {
    const hull = Math.hypot(x1 - cx, y1 - cy) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2);
    const steps = Math.max(2, Math.min(160, Math.ceil(hull / tol)));
    const x0 = cx;
    const y0 = cy;
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const e = t * t * t;
      poly.push({
        x: a * x0 + b * x1 + c * x2 + e * x,
        y: a * y0 + b * y1 + c * y2 + e * y
      });
    }
    px = x2;
    py = y2;
    cx = x;
    cy = y;
  }
  function quad(x1, y1, x, y) {
    const qx = x1;
    const qy = y1;
    cubic(
      cx + 2 / 3 * (x1 - cx),
      cy + 2 / 3 * (y1 - cy),
      x + 2 / 3 * (x1 - x),
      y + 2 / 3 * (y1 - y),
      x,
      y
    );
    px = qx;
    py = qy;
  }
  function arc(rx, ry, rot, large, sweep, x, y) {
    if (!rx || !ry) {
      line(x, y);
      return;
    }
    const x1 = cx;
    const y1 = cy;
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const phi = rot * Math.PI / 180;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    const dx2 = (x1 - x) / 2;
    const dy2 = (y1 - y) / 2;
    const x1p = cosP * dx2 + sinP * dy2;
    const y1p = -sinP * dx2 + cosP * dy2;
    const lambda = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
    if (lambda > 1) {
      const s = Math.sqrt(lambda);
      rx *= s;
      ry *= s;
    }
    const num1 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den1 = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num1 / (den1 || 1)));
    const cxp = co * rx * y1p / ry;
    const cyp = -co * ry * x1p / rx;
    const ccx = cosP * cxp - sinP * cyp + (x1 + x) / 2;
    const ccy = sinP * cxp + cosP * cyp + (y1 + y) / 2;
    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx;
    const vy = (-y1p - cyp) / ry;
    const theta = Math.atan2(uy, ux);
    let delta = Math.atan2(vy, vx) - theta;
    if (!sweep && delta > 0) delta -= 2 * Math.PI;
    if (sweep && delta < 0) delta += 2 * Math.PI;
    const steps = Math.max(
      2,
      Math.min(320, Math.ceil(Math.abs(delta) * Math.max(rx, ry) / tol))
    );
    for (let k = 1; k <= steps; k++) {
      const t = theta + delta * k / steps;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      poly.push({
        x: ccx + rx * ct * cosP - ry * st * sinP,
        y: ccy + rx * ct * sinP + ry * st * cosP
      });
    }
    px = x;
    py = y;
    cx = x;
    cy = y;
  }
  while (i < n) {
    skip();
    if (i >= n) break;
    let cmd = d[i];
    if (CMD.test(cmd)) {
      i++;
    } else if (prev) {
      cmd = prev === "M" ? "L" : prev === "m" ? "l" : prev;
    } else {
      break;
    }
    const rel = cmd >= "a" && cmd <= "z";
    const up = cmd.toUpperCase();
    if (up === "Z") {
      if (poly.length) poly.push({ x: sx, y: sy });
      closePoly();
      cx = sx;
      cy = sy;
      prev = cmd;
      continue;
    }
    const need = (v) => v == null ? NaN : v;
    const a = need(num());
    if (isNaN(a)) break;
    switch (up) {
      case "M": {
        const b = need(num());
        if (isNaN(b)) return polys;
        move(rel ? cx + a : a, rel ? cy + b : b);
        break;
      }
      case "L": {
        const b = need(num());
        if (isNaN(b)) return polys;
        line(rel ? cx + a : a, rel ? cy + b : b);
        break;
      }
      case "H":
        line(rel ? cx + a : a, cy);
        break;
      case "V":
        line(cx, rel ? cy + a : a);
        break;
      case "C": {
        const args = [a, num(), num(), num(), num(), num()];
        if (args.some((v2) => v2 == null)) return polys;
        const v = (
          /** @type {number[]} */
          args
        );
        cubic(
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3],
          rel ? cx + v[4] : v[4],
          rel ? cy + v[5] : v[5]
        );
        break;
      }
      case "S": {
        const args = [a, num(), num(), num()];
        if (args.some((v2) => v2 == null)) return polys;
        const v = (
          /** @type {number[]} */
          args
        );
        const smooth = prev && "CcSs".indexOf(prev) >= 0;
        cubic(
          smooth ? 2 * cx - px : cx,
          smooth ? 2 * cy - py : cy,
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3]
        );
        break;
      }
      case "Q": {
        const args = [a, num(), num(), num()];
        if (args.some((v2) => v2 == null)) return polys;
        const v = (
          /** @type {number[]} */
          args
        );
        quad(
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3]
        );
        break;
      }
      case "T": {
        const b = need(num());
        if (isNaN(b)) return polys;
        const smooth = prev && "QqTt".indexOf(prev) >= 0;
        quad(
          smooth ? 2 * cx - px : cx,
          smooth ? 2 * cy - py : cy,
          rel ? cx + a : a,
          rel ? cy + b : b
        );
        break;
      }
      case "A": {
        const rx = a;
        const ry = num();
        const rot = num();
        const large = flag();
        const sweep = flag();
        const ex = num();
        const ey = num();
        if (ry == null || rot == null || large == null || sweep == null || ex == null || ey == null) {
          return polys;
        }
        arc(rx, ry, rot, large, sweep, rel ? cx + ex : ex, rel ? cy + ey : ey);
        break;
      }
      default:
        return polys;
    }
    if (up !== "C" && up !== "S" && up !== "Q" && up !== "T") {
      px = cx;
      py = cy;
    }
    prev = cmd;
  }
  closePoly();
  return polys;
}
function boundsOf(polys) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  polys.forEach((pts) => {
    pts.forEach((p) => {
      if (p.x < b.x0) b.x0 = p.x;
      if (p.y < b.y0) b.y0 = p.y;
      if (p.x > b.x1) b.x1 = p.x;
      if (p.y > b.y1) b.y1 = p.y;
    });
  });
  return b;
}
const BANDS = 128;
function polygonRegion(polys, tf, opts = {}) {
  const evenOdd = !!opts.evenOdd;
  const edges = [];
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  polys.forEach((pts) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const ax = tf.offX + a.x * tf.scale;
      const ay = tf.offY + a.y * tf.scale;
      const bx = tf.offX + b.x * tf.scale;
      const by = tf.offY + b.y * tf.scale;
      if (ax < minX) minX = ax;
      if (bx < minX) minX = bx;
      if (ax > maxX) maxX = ax;
      if (bx > maxX) maxX = bx;
      if (ay < minY) minY = ay;
      if (by < minY) minY = by;
      if (ay > maxY) maxY = ay;
      if (by > maxY) maxY = by;
      if (ay === by) continue;
      edges.push({ x0: ax, y0: ay, x1: bx, y1: by });
    }
  });
  if (!edges.length) {
    return { minY: 0, maxY: 0, minX: 0, maxX: 0, spansAt: () => [] };
  }
  const height = Math.max(1e-6, maxY - minY);
  const bands = [];
  for (let k = 0; k < BANDS; k++) bands.push([]);
  edges.forEach((e) => {
    const lo = Math.min(e.y0, e.y1);
    const hi = Math.max(e.y0, e.y1);
    let i0 = Math.floor((lo - minY) / height * BANDS);
    let i1 = Math.floor((hi - minY) / height * BANDS);
    i0 = Math.max(0, Math.min(BANDS - 1, i0));
    i1 = Math.max(0, Math.min(BANDS - 1, i1));
    for (let i = i0; i <= i1; i++) bands[i].push(e);
  });
  const spansAt = (y) => {
    const bi = Math.floor((y - minY) / height * BANDS);
    if (bi < 0 || bi > BANDS - 1) return [];
    const list = bands[bi];
    const xs = [];
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      const down = e.y1 > e.y0;
      const lo = down ? e.y0 : e.y1;
      const hi = down ? e.y1 : e.y0;
      if (y < lo || y >= hi) continue;
      xs.push({
        x: e.x0 + (y - e.y0) / (e.y1 - e.y0) * (e.x1 - e.x0),
        dir: down ? 1 : -1
      });
    }
    if (xs.length < 2) return [];
    xs.sort((a, b) => a.x - b.x);
    const spans = [];
    if (evenOdd) {
      for (let j = 0; j + 1 < xs.length; j += 2) {
        spans.push({ x0: xs[j].x, x1: xs[j + 1].x });
      }
      return spans;
    }
    let wind = 0;
    let start = 0;
    for (let k = 0; k < xs.length; k++) {
      const was = wind;
      wind += xs[k].dir;
      if (was === 0 && wind !== 0) start = xs[k].x;
      else if (was !== 0 && wind === 0) spans.push({ x0: start, x1: xs[k].x });
    }
    return spans;
  };
  return { minY, maxY, minX, maxX, spansAt };
}
function strokeRegion(polys, tf, halfWidth) {
  const r = Math.max(1e-6, halfWidth * tf.scale);
  const caps = [];
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  polys.forEach((pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const ax = tf.offX + pts[i].x * tf.scale;
      const ay = tf.offY + pts[i].y * tf.scale;
      const bx = tf.offX + pts[i + 1].x * tf.scale;
      const by = tf.offY + pts[i + 1].y * tf.scale;
      const len = Math.hypot(bx - ax, by - ay);
      const nx = len > 1e-9 ? -(by - ay) / len * r : r;
      const ny = len > 1e-9 ? (bx - ax) / len * r : 0;
      caps.push({ ax, ay, bx, by, nx, ny });
      if (Math.min(ax, bx) - r < minX) minX = Math.min(ax, bx) - r;
      if (Math.max(ax, bx) + r > maxX) maxX = Math.max(ax, bx) + r;
      if (Math.min(ay, by) - r < minY) minY = Math.min(ay, by) - r;
      if (Math.max(ay, by) + r > maxY) maxY = Math.max(ay, by) + r;
    }
  });
  if (!caps.length) {
    return { minY: 0, maxY: 0, minX: 0, maxX: 0, spansAt: () => [] };
  }
  const height = Math.max(1e-6, maxY - minY);
  const bands = [];
  for (let k = 0; k < BANDS; k++) bands.push([]);
  caps.forEach((c) => {
    const lo = Math.min(c.ay, c.by) - r;
    const hi = Math.max(c.ay, c.by) + r;
    let i0 = Math.floor((lo - minY) / height * BANDS);
    let i1 = Math.floor((hi - minY) / height * BANDS);
    i0 = Math.max(0, Math.min(BANDS - 1, i0));
    i1 = Math.max(0, Math.min(BANDS - 1, i1));
    for (let i = i0; i <= i1; i++) bands[i].push(c);
  });
  const disc = (cx, cy, y) => {
    const dy = y - cy;
    if (dy <= -r || dy >= r) return null;
    const half = Math.sqrt(r * r - dy * dy);
    return { x0: cx - half, x1: cx + half };
  };
  const spansAt = (y) => {
    const bi = Math.floor((y - minY) / height * BANDS);
    if (bi < 0 || bi > BANDS - 1) return [];
    const list = bands[bi];
    const parts = [];
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const qx = [c.ax + c.nx, c.bx + c.nx, c.bx - c.nx, c.ax - c.nx];
      const qy = [c.ay + c.ny, c.by + c.ny, c.by - c.ny, c.ay - c.ny];
      let lo = Infinity;
      let hi = -Infinity;
      for (let k = 0; k < 4; k++) {
        const j = (k + 1) % 4;
        const y0 = qy[k];
        const y1 = qy[j];
        if (y0 === y1) continue;
        const top = Math.min(y0, y1);
        const bot = Math.max(y0, y1);
        if (y < top || y >= bot) continue;
        const x = qx[k] + (y - y0) / (y1 - y0) * (qx[j] - qx[k]);
        if (x < lo) lo = x;
        if (x > hi) hi = x;
      }
      if (hi > lo) parts.push({ x0: lo, x1: hi });
      const da = disc(c.ax, c.ay, y);
      if (da) parts.push(da);
      const db = disc(c.bx, c.by, y);
      if (db) parts.push(db);
    }
    if (!parts.length) return [];
    parts.sort((a, b) => a.x0 - b.x0);
    const spans = [parts[0]];
    for (let i = 1; i < parts.length; i++) {
      const last = spans[spans.length - 1];
      if (parts[i].x0 <= last.x1) {
        if (parts[i].x1 > last.x1) last.x1 = parts[i].x1;
      } else {
        spans.push(parts[i]);
      }
    }
    return spans;
  };
  return { minY, maxY, minX, maxX, spansAt };
}
function fitBox(bounds, rect, padding) {
  const bw = Math.max(1e-6, bounds.x1 - bounds.x0);
  const bh = Math.max(1e-6, bounds.y1 - bounds.y0);
  const scale = Math.min(
    rect.width * padding / bw,
    rect.height * padding / bh
  );
  return {
    scale,
    offX: rect.x + rect.width / 2 - (bounds.x0 + bw / 2) * scale,
    offY: rect.y + rect.height / 2 - (bounds.y0 + bh / 2) * scale
  };
}
function rowSlots(region, dx, dy) {
  const inset = dx * 0.42;
  const sliver = dx * 0.45;
  const height = region.maxY - region.minY;
  const rows = Math.max(1, Math.floor(height / dy));
  const top = region.minY + (height - rows * dy) / 2;
  const cells = [];
  let capacity = 0;
  for (let r = 0; r < rows; r++) {
    const y = top + (r + 0.5) * dy;
    const spans = region.spansAt(y);
    for (let s = 0; s < spans.length; s++) {
      const len = spans[s].x1 - spans[s].x0;
      let cap;
      if (len >= 2 * inset) cap = Math.floor((len - 2 * inset) / dx) + 1;
      else cap = len >= sliver ? 1 : 0;
      if (!cap) continue;
      cells.push({ y, x0: spans[s].x0, x1: spans[s].x1, cap, row: r });
      capacity += cap;
    }
  }
  return { cells, capacity, inset };
}
function allocate(weights, total) {
  const out = new Array(weights.length).fill(0);
  let sum2 = 0;
  for (let i = 0; i < weights.length; i++) sum2 += weights[i];
  if (!sum2 || total <= 0) return out;
  let used = 0;
  const rest = [];
  for (let i = 0; i < weights.length; i++) {
    const q = total * weights[i] / sum2;
    out[i] = Math.floor(q);
    used += out[i];
    rest.push({ i, frac: q - out[i] });
  }
  rest.sort((a, b) => b.frac - a.frac);
  for (let k = 0; used < total; k++, used++) out[rest[k % rest.length].i]++;
  return out;
}
function fitSpacing(region, count, rowRatio) {
  let lo = 1;
  let hi = Math.max(region.maxY - region.minY, 8);
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    if (rowSlots(region, mid, mid * rowRatio).capacity >= count) lo = mid;
    else hi = mid;
  }
  return lo;
}
function fitRadius(r, dx) {
  return Math.min(Math.max(r, dx / 3.2), dx / 2.3);
}
const ORDERS = {
  rows: null,
  rowsUp: (a, b) => b.y - a.y || a.x - b.x,
  cols: (a, b) => (a.qx || 0) - (b.qx || 0) || a.y - b.y,
  colsRev: (a, b) => (b.qx || 0) - (a.qx || 0) || a.y - b.y,
  centerOut: (a, b) => (a.qd || 0) - (b.qd || 0) || a.y - b.y,
  centerIn: (a, b) => (b.qd || 0) - (a.qd || 0) || a.y - b.y
};
function assign(objects, slots, order, pitch) {
  const cmp = ORDERS[order] !== void 0 ? ORDERS[order] : null;
  let ordered = slots;
  if (cmp) {
    let cx = 0;
    let cy = 0;
    slots.forEach((s) => {
      cx += s.x;
      cy += s.y;
    });
    cx /= slots.length || 1;
    cy /= slots.length || 1;
    const step = pitch > 0 ? pitch : 1;
    slots.forEach((s) => {
      s.qx = Math.round(s.x / step);
      s.qd = Math.round(Math.hypot(s.x - cx, s.y - cy) / step);
    });
    ordered = slots.slice().sort(cmp);
  }
  const out = [];
  for (let i = 0; i < objects.length && i < ordered.length; i++) {
    out.push({
      id: objects[i].id,
      x: ordered[i].x,
      y: ordered[i].y,
      r: ordered[i].r
    });
  }
  return out;
}
function placeRow(cell, n, dx, inset, r, into) {
  if (n <= 0) return;
  if (n === 1) {
    into.push({ x: (cell.x0 + cell.x1) / 2, y: cell.y, r, row: cell.row });
    return;
  }
  let a = cell.x0 + inset;
  const b = cell.x1 - inset;
  let gap = (b - a) / (n - 1);
  if (gap > dx * 1.5) {
    gap = dx;
    a = (cell.x0 + cell.x1) / 2 - gap * (n - 1) / 2;
  }
  for (let j = 0; j < n; j++) {
    into.push({ x: a + j * gap, y: cell.y, r, row: cell.row });
  }
}
const warned = /* @__PURE__ */ new Set();
function defineShape(meta, build2) {
  const inner = build2(meta);
  const min = meta.minUnits || 0;
  const layout = (objects, rect) => {
    if (min && objects.length && objects.length < min && !warned.has(meta.name)) {
      warned.add(meta.name);
      const effect = meta.kind === "stroke" ? "A stroke thins to a dotted line below that, which may well be fine." : "Fine detail closes up below that.";
      console.warn(
        `[ApexCharts] unit shape "${meta.name}" reads best from about ${min} units; this chart has ${objects.length}. ${effect} Lower plotOptions.unit.unitValue to draw more dots, or pick a simpler shape.`
      );
    }
    return inner(objects, rect);
  };
  layout.shape = Object.freeze(__spreadValues({}, meta));
  layout.with = (overrides) => defineShape(__spreadValues(__spreadValues({}, meta), overrides), build2);
  return (
    /** @type {UnitShape} */
    layout
  );
}
const cache$1 = /* @__PURE__ */ new Map();
function outline(path, sampling) {
  const key = `${sampling}|${path}`;
  let hit = cache$1.get(key);
  if (!hit) {
    const polys = flattenPath(path, sampling);
    hit = { polys, bounds: boundsOf(polys) };
    cache$1.set(key, hit);
  }
  return hit;
}
function build$1(meta) {
  const path = meta.path || "";
  const order = meta.order || "rows";
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const rowRatio = meta.rowRatio == null ? 0.88 : meta.rowRatio;
  const evenOdd = meta.fillRule === "evenodd";
  const sampling = meta.sampling == null ? 0.6 : meta.sampling;
  return (objects, rect) => {
    if (!objects.length || !path) return [];
    const { polys, bounds } = outline(path, sampling);
    if (!polys.length) return [];
    const tf = fitBox(bounds, rect, padding);
    const region = polygonRegion(polys, tf, { evenOdd });
    const dx = fitSpacing(region, objects.length, rowRatio);
    const packed = rowSlots(region, dx, dx * rowRatio);
    if (!packed.cells.length) return [];
    const counts = allocate(
      packed.cells.map((c) => c.cap),
      objects.length
    );
    const r = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx);
    const slots = [];
    packed.cells.forEach((cell, i) => {
      placeRow(cell, counts[i], dx, packed.inset, r, slots);
    });
    return assign(objects, slots, order, dx);
  };
}
function silhouette(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "silhouette" }), build$1);
}
function shapeFrom(path, opts = {}) {
  return silhouette(__spreadProps(__spreadValues({ name: "custom" }, opts), { path }));
}
const heart = /* @__PURE__ */ silhouette({
  name: "heart",
  category: "symbols",
  minUnits: 40,
  source: "original",
  path: "M 50 93 C 20 71 5 53 5 34 C 5 17 18 6 32 6 C 41 6 47 11 50 19 C 53 11 59 6 68 6 C 82 6 95 17 95 34 C 95 53 80 71 50 93 Z"
});
const droplet = /* @__PURE__ */ silhouette({
  name: "droplet",
  category: "nature",
  minUnits: 40,
  source: "original",
  path: "M 50 3 C 50 3 13 46 13 66 A 37 37 0 0 0 87 66 C 87 46 50 3 50 3 Z"
});
const human = /* @__PURE__ */ silhouette({
  name: "human",
  category: "people",
  minUnits: 80,
  source: "original",
  path: "M 39 13 A 11 11 0 0 1 61 13 A 11 11 0 0 1 39 13 Z M 38 30 C 33 31 29 34 27 40 L 19 64 L 26 67 L 33 48 L 34 58 L 31 96 L 44 96 L 46 64 L 54 64 L 56 96 L 69 96 L 66 58 L 67 48 L 74 67 L 81 64 L 73 40 C 71 34 67 31 62 30 Z"
});
const tree = /* @__PURE__ */ silhouette({
  name: "tree",
  category: "nature",
  minUnits: 80,
  source: "original",
  path: "M 50 3 C 62 3 70 11 70 19 C 81 16 91 24 91 34 C 97 39 97 51 89 56 C 87 62 77 66 67 63 C 63 68 55 70 50 68 C 45 70 37 68 33 63 C 23 66 13 62 11 56 C 3 51 3 39 9 34 C 9 24 19 16 30 19 C 30 11 38 3 50 3 Z M 41 58 L 59 58 L 60 88 C 61 92 63 94 67 96 L 33 96 C 37 94 39 92 40 88 Z"
});
const house = /* @__PURE__ */ silhouette({
  name: "house",
  category: "objects",
  minUnits: 120,
  order: "rows",
  source: "original",
  path: "M 50 4 L 97 44 L 97 50 L 84 50 L 84 95 L 16 95 L 16 50 L 3 50 L 3 44 Z M 44 95 L 56 95 L 56 70 L 44 70 Z M 25 58 L 25 69 L 37 69 L 37 58 Z M 63 58 L 63 69 L 75 69 L 75 58 Z"
});
const battery = /* @__PURE__ */ silhouette({
  name: "battery",
  category: "objects",
  minUnits: 40,
  order: "cols",
  source: "original",
  path: "M 14 22 L 72 22 C 78 22 82 26 82 32 L 82 38 L 93 38 L 93 62 L 82 62 L 82 68 C 82 74 78 78 72 78 L 14 78 C 8 78 4 74 4 68 L 4 32 C 4 26 8 22 14 22 Z"
});
const shield = /* @__PURE__ */ silhouette({
  name: "shield",
  category: "technology",
  minUnits: 40,
  source: "original",
  path: "M 6 8 L 94 8 L 94 38 C 94 60 82 81 50 97 C 18 81 6 60 6 38 Z"
});
const rocket = /* @__PURE__ */ silhouette({
  name: "rocket",
  category: "objects",
  minUnits: 120,
  source: "original",
  path: "M 50 2 C 59 13 65 28 66 45 L 66 76 L 58 88 L 42 88 L 34 76 L 34 45 C 35 28 41 13 50 2 Z M 65 56 L 85 86 L 85 95 L 65 82 Z M 35 56 L 15 86 L 15 95 L 35 82 Z M 43.5 34 A 6.5 6.5 0 0 0 56.5 34 A 6.5 6.5 0 0 0 43.5 34 Z"
});
const sum = (w) => w.reduce((a, b) => a + b, 0);
function buildRings(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const inward = meta.order === "centerIn";
  const twist = meta.twist == null ? 2.399963 : meta.twist;
  return (objects, rect) => {
    const n = objects.length;
    if (!n) return [];
    const radius = Math.min(rect.width, rect.height) / 2 * padding;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const weightsFor = (k) => {
      const w = [];
      for (let i = 0; i < k; i++) {
        w.push(Math.max(1, Math.round(2 * Math.PI * (i + 0.5))));
      }
      return w;
    };
    let count = 1;
    while (count < 400 && sum(weightsFor(count)) < n) count++;
    const weights = weightsFor(count);
    const gap = radius / count;
    const per = allocate(weights, n);
    const r = fitRadius(objects[0].r > 0 ? objects[0].r : 3, gap);
    const slots = [];
    for (let k = 0; k < count; k++) {
      const ring = inward ? count - 1 - k : k;
      const rr = (ring + 0.5) * gap;
      const m = per[ring];
      const phase = twist * ring;
      for (let i = 0; i < m; i++) {
        const t = phase + i / m * 2 * Math.PI;
        slots.push({
          x: cx + rr * Math.cos(t),
          y: cy + rr * Math.sin(t),
          r,
          row: k
        });
      }
    }
    return assign(objects, slots, "rows", gap);
  };
}
function buildGlobe(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const tilt = (meta.tilt == null ? 15 : meta.tilt) * Math.PI / 180;
  const order = meta.order || "rows";
  return (objects, rect) => {
    const n = objects.length;
    if (!n) return [];
    const radius = Math.min(rect.width, rect.height) / 2 * padding;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const SAMPLES = 40;
    const project = (sinPhi, cosPhi, lon) => {
      const z = cosPhi * Math.cos(lon);
      return {
        x: radius * cosPhi * Math.sin(lon),
        y: radius * (sinPhi * cosT + z * sinT),
        depth: z * cosT - sinPhi * sinT
      };
    };
    const candidatesAt = (pitch2) => {
      const count = Math.max(3, Math.ceil(Math.PI * radius / pitch2));
      const dLat = Math.PI / count;
      const near = pitch2 * 0.95;
      const cell = near;
      const grid = /* @__PURE__ */ new Map();
      const rows2 = [];
      let total = 0;
      const keep = (p) => {
        const gx = Math.floor(p.x / cell);
        const gy = Math.floor(p.y / cell);
        for (let a = -1; a <= 1; a++) {
          for (let b = -1; b <= 1; b++) {
            const bucket = grid.get(`${gx + a},${gy + b}`);
            if (!bucket) continue;
            for (let i = 0; i < bucket.length; i++) {
              if (Math.hypot(bucket[i].x - p.x, bucket[i].y - p.y) < near) {
                return false;
              }
            }
          }
        }
        const key = `${gx},${gy}`;
        const own = grid.get(key);
        if (own) own.push(p);
        else grid.set(key, [p]);
        return true;
      };
      for (let b = 0; b < count; b++) {
        const phi = -Math.PI / 2 + (b + 0.5) * dLat;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const cut = sinPhi * sinT / (cosPhi * cosT || 1e-9);
        if (cut >= 1) continue;
        const lonMax = cut <= -1 ? Math.PI : Math.acos(cut);
        const closed = lonMax >= Math.PI - 1e-9;
        const pts = [];
        const cum = [0];
        for (let k = 0; k <= SAMPLES; k++) {
          const lon = -lonMax + 2 * lonMax * k / SAMPLES;
          const p = project(sinPhi, cosPhi, lon);
          pts.push(p);
          if (k > 0) {
            const q = pts[k - 1];
            cum.push(cum[k - 1] + Math.hypot(p.x - q.x, p.y - q.y));
          }
        }
        const len = cum[cum.length - 1];
        const inset = closed ? 0 : Math.min(pitch2 * 0.42, len / 2);
        const span = len - 2 * inset;
        let m;
        if (closed) m = Math.max(1, Math.round(len / pitch2));
        else if (span > 0) m = Math.floor(span / pitch2) + 1;
        else m = len >= pitch2 * 0.45 ? 1 : 0;
        if (!m) continue;
        const step = closed ? len / m : m > 1 ? span / (m - 1) : 0;
        const row = [];
        let seg = 0;
        for (let j = 0; j < m; j++) {
          const s = closed ? j * step : m > 1 ? inset + j * step : len / 2;
          while (seg < cum.length - 2 && cum[seg + 1] < s) seg++;
          const c0 = cum[seg];
          const c1 = cum[seg + 1];
          const t = c1 > c0 ? (s - c0) / (c1 - c0) : 0;
          const p0 = pts[seg];
          const p1 = pts[seg + 1];
          const p = {
            x: cx + p0.x + (p1.x - p0.x) * t,
            y: cy + p0.y + (p1.y - p0.y) * t,
            depth: p0.depth + (p1.depth - p0.depth) * t
          };
          if (keep(p)) row.push(p);
        }
        if (!row.length) continue;
        rows2.push(row);
        total += row.length;
      }
      return { rows: rows2, total };
    };
    let lo = 1;
    let hi = 2 * radius;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (candidatesAt(mid).total >= n) lo = mid;
      else hi = mid;
    }
    const pitch = lo;
    const { rows } = candidatesAt(pitch);
    const per = allocate(
      rows.map((r) => r.length),
      n
    );
    const baseR = fitRadius(objects[0].r > 0 ? objects[0].r : 3, pitch);
    const slots = [];
    rows.forEach((row, i) => {
      const take = per[i];
      if (!take) return;
      for (let j = 0; j < take; j++) {
        const p = row[Math.min(row.length - 1, Math.floor(j * row.length / take))];
        slots.push({
          x: p.x,
          y: p.y,
          // Shading, not spacing: the surface turning away reads as smaller
          // dots. Spacing is already even, so this cannot open a gap.
          r: baseR * (0.62 + 0.38 * Math.sqrt(Math.max(0, p.depth))),
          row: i
        });
      }
    });
    slots.sort((a, b) => a.y - b.y || a.x - b.x);
    return assign(objects, slots, order, pitch);
  };
}
function buildTiers(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const rowRatio = meta.rowRatio == null ? 0.9 : meta.rowRatio;
  const order = meta.order || "rowsUp";
  return (objects, rect) => {
    const n = objects.length;
    if (!n) return [];
    const tiers2 = Math.max(1, Math.round((Math.sqrt(8 * n + 1) - 1) / 2));
    const weights = [];
    for (let t = 0; t < tiers2; t++) weights.push(t + 1);
    const per = allocate(weights, n);
    const widest = Math.max(...per);
    const dx = Math.min(
      rect.width * padding / Math.max(1, widest - 1 + 1.6),
      rect.height * padding / (tiers2 * rowRatio)
    );
    const dy = dx * rowRatio;
    const cx = rect.x + rect.width / 2;
    const top = rect.y + (rect.height - tiers2 * dy) / 2;
    const r = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx);
    const slots = [];
    for (let i = 0; i < tiers2; i++) {
      for (let j = 0; j < per[i]; j++) {
        slots.push({
          x: cx + (j - (per[i] - 1) / 2) * dx,
          y: top + (i + 0.5) * dy,
          r,
          row: i
        });
      }
    }
    return assign(objects, slots, order, dx);
  };
}
function rings(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "rings" }), buildRings);
}
function sphere(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "globe" }), buildGlobe);
}
function tiers(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "tiers" }), buildTiers);
}
const target = /* @__PURE__ */ rings({
  name: "target",
  category: "business",
  minUnits: 40,
  order: "centerIn",
  source: "generated"
});
const globe = /* @__PURE__ */ sphere({
  name: "globe",
  category: "geography",
  minUnits: 60,
  tilt: 15,
  source: "generated"
});
const pyramid = /* @__PURE__ */ tiers({
  name: "pyramid",
  category: "symbols",
  minUnits: 20,
  order: "rowsUp",
  source: "generated"
});
const leaf = /* @__PURE__ */ silhouette({
  name: "leaf",
  category: "nature",
  minUnits: 60,
  source: "original",
  // Two cubics per side, so both ends close as cusps: one cubic per side pulls
  // wide too early and rounds the tip off. Narrow (roughly 2:1) and tilted 28
  // degrees, both for the same reason. Drawn upright and square it reads as a
  // playing-card spade, since a spade is exactly a wide leaf with a stem.
  path: "M 27.5 7.6 C 22.6 28.3 17.8 49 26.2 64.9 C 35.6 82.6 55.5 90.1 71.6 90.6 C 80.2 77 85.1 56.3 75.7 38.6 C 67.2 22.7 47.3 15.2 27.5 7.6 Z M 67.1 88.5 L 71.9 101.8 L 80.7 97.1 L 72.4 85.7 Z"
});
const sun = /* @__PURE__ */ silhouette({
  name: "sun",
  category: "nature",
  minUnits: 140,
  source: "original",
  path: "M 75.5 41.2 L 98 50 L 75.5 58.8 L 74.3 61.8 L 83.9 83.9 L 61.8 74.3 L 58.8 75.5 L 50 98 L 41.2 75.5 L 38.2 74.3 L 16.1 83.9 L 25.7 61.8 L 24.5 58.8 L 2 50 L 24.5 41.2 L 25.7 38.2 L 16.1 16.1 L 38.2 25.7 L 41.2 24.5 L 50 2 L 58.8 24.5 L 61.8 25.7 L 83.9 16.1 L 74.3 38.2 Z"
});
const flame = /* @__PURE__ */ silhouette({
  name: "flame",
  category: "nature",
  minUnits: 60,
  source: "original",
  path: "M 56 2 C 52 24 34 30 30 50 C 27 64 33 70 34 78 C 24 72 20 60 21 50 C 12 62 10 76 16 86 C 24 95 38 98 52 98 C 72 98 84 84 82 64 C 80 46 68 40 66 26 C 64 38 60 42 58 44 C 62 30 60 14 56 2 Z"
});
const fish = /* @__PURE__ */ silhouette({
  name: "fish",
  category: "nature",
  minUnits: 80,
  source: "original",
  path: "M 20 50 C 34 26 58 20 76 30 C 86 36 92 44 94 50 C 92 56 86 64 76 70 C 58 80 34 74 20 50 Z M 26 50 L 4 74 L 12 50 L 4 26 Z"
});
const star = /* @__PURE__ */ silhouette({
  name: "star",
  category: "symbols",
  minUnits: 80,
  source: "original",
  path: "M 50 2 L 61.8 33.8 L 95.7 35.2 L 69 56.2 L 78.2 88.8 L 50 70 L 21.8 88.8 L 31 56.2 L 4.3 35.2 L 38.2 33.8 Z"
});
const arrow = /* @__PURE__ */ silhouette({
  name: "arrow",
  category: "symbols",
  minUnits: 60,
  source: "original",
  path: "M 50 4 L 92 46 L 70 46 L 70 96 L 30 96 L 30 46 L 8 46 Z"
});
const crown = /* @__PURE__ */ silhouette({
  name: "crown",
  category: "symbols",
  minUnits: 90,
  source: "original",
  path: "M 8 84 L 14 26 L 32 52 L 50 16 L 68 52 L 86 26 L 92 84 Z"
});
const cross = /* @__PURE__ */ silhouette({
  name: "cross",
  category: "symbols",
  minUnits: 40,
  source: "original",
  path: "M 36 6 L 64 6 L 64 36 L 94 36 L 94 64 L 64 64 L 64 94 L 36 94 L 36 64 L 6 64 L 6 36 L 36 36 Z"
});
const bolt = /* @__PURE__ */ silhouette({
  name: "bolt",
  category: "symbols",
  minUnits: 70,
  source: "original",
  path: "M 62 3 L 20 56 L 44 56 L 38 97 L 80 40 L 54 40 Z"
});
const bulb = /* @__PURE__ */ silhouette({
  name: "bulb",
  category: "objects",
  minUnits: 90,
  source: "original",
  path: "M 50 4 C 29 4 14 21 14 39 C 14 54 25 62 30 72 L 70 72 C 75 62 86 54 86 39 C 86 21 71 4 50 4 Z M 34 74 L 36 96 L 64 96 L 66 74 Z"
});
const flask = /* @__PURE__ */ silhouette({
  name: "flask",
  category: "objects",
  minUnits: 60,
  source: "original",
  path: "M 40 4 L 60 4 L 60 36 L 92 92 L 8 92 L 40 36 Z"
});
const car = /* @__PURE__ */ silhouette({
  name: "car",
  category: "objects",
  minUnits: 120,
  source: "original",
  path: "M 4 78 L 4 56 L 20 52 L 32 30 L 68 30 L 82 52 L 96 56 L 96 78 Z M 13 78 A 13 13 0 0 1 39 78 A 13 13 0 0 1 13 78 Z M 61 78 A 13 13 0 0 1 87 78 A 13 13 0 0 1 61 78 Z"
});
const plane = /* @__PURE__ */ silhouette({
  name: "plane",
  category: "objects",
  minUnits: 160,
  source: "original",
  path: "M 50 2 C 54 2 57 9 58 19 L 58 35 L 95 57 L 95 67 L 58 57 L 58 76 L 70 86 L 70 95 L 50 89 L 30 95 L 30 86 L 42 76 L 42 57 L 5 67 L 5 57 L 42 35 L 42 19 C 43 9 46 2 50 2 Z"
});
const group = /* @__PURE__ */ silhouette({
  name: "group",
  category: "people",
  minUnits: 160,
  source: "original",
  path: "M 8 94 L 8 57 C 8 48 14.6 48 14.6 48 L 23.4 48 C 23.4 48 30 48 30 57 L 30 94 Z M 9.5 34 A 9.5 9.5 0 0 1 28.5 34 A 9.5 9.5 0 0 1 9.5 34 Z M 36 94 L 36 47 C 36 38 44.4 38 44.4 38 L 55.6 38 C 55.6 38 64 38 64 47 L 64 94 Z M 38.5 23 A 11.5 11.5 0 0 1 61.5 23 A 11.5 11.5 0 0 1 38.5 23 Z M 70 94 L 70 57 C 70 48 76.6 48 76.6 48 L 85.4 48 C 85.4 48 92 48 92 57 L 92 94 Z M 71.5 34 A 9.5 9.5 0 0 1 90.5 34 A 9.5 9.5 0 0 1 71.5 34 Z"
});
const trophy = /* @__PURE__ */ silhouette({
  name: "trophy",
  category: "business",
  minUnits: 110,
  source: "original",
  path: "M 30 8 L 70 8 L 68 40 C 68 54 58 62 50 62 C 42 62 32 54 32 40 Z M 45 60 L 55 60 L 55 78 L 45 78 Z M 30 78 L 70 78 L 74 92 L 26 92 Z"
});
const moneybag = /* @__PURE__ */ silhouette({
  name: "moneybag",
  category: "business",
  minUnits: 80,
  source: "original",
  path: "M 36 8 L 64 8 L 59 24 C 80 32 90 48 90 65 C 90 83 73 94 50 94 C 27 94 10 83 10 65 C 10 48 20 32 41 24 Z"
});
const funnel = /* @__PURE__ */ silhouette({
  name: "funnel",
  category: "business",
  minUnits: 80,
  source: "original",
  path: "M 6 10 L 94 10 L 58 56 L 58 92 L 42 92 L 42 56 Z"
});
const gear = /* @__PURE__ */ silhouette({
  name: "gear",
  category: "technology",
  minUnits: 260,
  source: "original",
  path: "M 82 50.9 L 96.8 54.3 L 93.2 68.5 L 78.6 64.4 L 73.9 71.2 L 83.1 83.3 L 71.2 92 L 62.6 79.4 L 54.7 81.7 L 53.9 96.8 L 39.3 95.8 L 40.8 80.6 L 33.2 77.3 L 22.9 88.4 L 12.4 78.2 L 23.2 67.5 L 19.6 60.1 L 4.6 62 L 3.1 47.4 L 18.2 46.2 L 20.2 38.2 L 7.5 30 L 15.7 17.8 L 28.1 26.7 L 34.8 21.9 L 30.3 7.3 L 44.4 3.3 L 48.2 18 L 56.4 18.7 L 62.3 4.6 L 75.7 10.7 L 69.2 24.4 L 75.1 30.1 L 88.6 23.2 L 95 36.4 L 81.2 42.7 Z M 37 50 A 13 13 0 0 0 63 50 A 13 13 0 0 0 37 50 Z"
});
const robot = /* @__PURE__ */ silhouette({
  name: "robot",
  category: "technology",
  minUnits: 220,
  source: "original",
  path: "M 18 40 C 18 30 26 26 36 26 L 64 26 C 74 26 82 30 82 40 L 82 72 C 82 82 74 86 64 86 L 36 86 C 26 86 18 82 18 72 Z M 46 14 L 54 14 L 54 28 L 46 28 Z M 44 12 A 6 6 0 0 1 56 12 A 6 6 0 0 1 44 12 Z M 29 50 A 7 7 0 0 0 43 50 A 7 7 0 0 0 29 50 Z M 57 50 A 7 7 0 0 0 71 50 A 7 7 0 0 0 57 50 Z"
});
const pin = /* @__PURE__ */ silhouette({
  name: "pin",
  category: "geography",
  minUnits: 120,
  source: "original",
  path: "M 50 96 C 50 96 16 56 16 38 C 16 20 31 6 50 6 C 69 6 84 20 84 38 C 84 56 50 96 50 96 Z M 39 37 A 11 11 0 0 0 61 37 A 11 11 0 0 0 39 37 Z"
});
const mountain = /* @__PURE__ */ silhouette({
  name: "mountain",
  category: "geography",
  minUnits: 60,
  source: "original",
  path: "M 2 90 L 34 26 L 50 56 L 64 18 L 98 90 Z"
});
const cache = /* @__PURE__ */ new Map();
function centreline(path, sampling) {
  const key = `${sampling}|${path}`;
  let hit = cache.get(key);
  if (!hit) {
    const polys = flattenPath(path, sampling, true);
    hit = { polys, bounds: boundsOf(polys) };
    cache.set(key, hit);
  }
  return hit;
}
function build(meta) {
  const path = meta.path || "";
  const order = meta.order || "rows";
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const rowRatio = meta.rowRatio == null ? 0.88 : meta.rowRatio;
  const sampling = meta.sampling == null ? 0.6 : meta.sampling;
  const half = Math.max(0.5, (meta.width == null ? 16 : meta.width) / 2);
  return (objects, rect) => {
    if (!objects.length || !path) return [];
    const { polys, bounds } = centreline(path, sampling);
    if (!polys.length) return [];
    const tf = fitBox(
      {
        x0: bounds.x0 - half,
        y0: bounds.y0 - half,
        x1: bounds.x1 + half,
        y1: bounds.y1 + half
      },
      rect,
      padding
    );
    const region = strokeRegion(polys, tf, half);
    const dx = fitSpacing(region, objects.length, rowRatio);
    const packed = rowSlots(region, dx, dx * rowRatio);
    if (!packed.cells.length) return [];
    const counts = allocate(
      packed.cells.map((c) => c.cap),
      objects.length
    );
    const r = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx);
    const slots = [];
    packed.cells.forEach((cell, i) => {
      placeRow(cell, counts[i], dx, packed.inset, r, slots);
    });
    return assign(objects, slots, order, dx);
  };
}
function stroke(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "stroke" }), build);
}
function strokeFrom(path, opts = {}) {
  return stroke(__spreadProps(__spreadValues({ name: "custom-stroke" }, opts), { path }));
}
function outlined(shape, width = 14) {
  const meta = shape.shape;
  if (!meta.path) {
    throw new Error(
      `[ApexCharts] outlined(): "${meta.name}" has no outline to trace. The generated shapes (rings, globe, tiers) compute positions directly, so there is no path to stroke.`
    );
  }
  return stroke(__spreadProps(__spreadValues({}, meta), {
    name: `${meta.name}-outline`,
    width,
    // A traced outline is thinner than the solid it came from, so it needs more
    // dots before it closes into a continuous line.
    minUnits: Math.max(meta.minUnits || 0, 120)
  }));
}
const check = /* @__PURE__ */ stroke({
  name: "check",
  category: "symbols",
  minUnits: 40,
  width: 19,
  source: "original",
  path: "M 13 55 L 37 79 L 87 22"
});
const wifi = /* @__PURE__ */ stroke({
  name: "wifi",
  category: "technology",
  minUnits: 120,
  width: 8,
  source: "original",
  path: "M 11.9 62 A 44 44 0 0 1 88.1 62 M 24 69 A 30 30 0 0 1 76 69 M 36.1 76 A 16 16 0 0 1 63.9 76 M 50 86 L 50 86"
});
const pulse = /* @__PURE__ */ stroke({
  name: "pulse",
  category: "technology",
  minUnits: 60,
  width: 11,
  source: "original",
  path: "M 4 58 L 26 58 L 35 30 L 47 84 L 59 44 L 68 58 L 96 58"
});
const xmark = /* @__PURE__ */ stroke({
  name: "xmark",
  category: "symbols",
  minUnits: 40,
  width: 18,
  source: "original",
  path: "M 18 18 L 82 82 M 82 18 L 18 82"
});
const percent = /* @__PURE__ */ stroke({
  name: "percent",
  category: "symbols",
  minUnits: 150,
  width: 9,
  source: "original",
  path: "M 12 24 A 12 12 0 0 1 36 24 A 12 12 0 0 1 12 24 Z M 64 76 A 12 12 0 0 1 88 76 A 12 12 0 0 1 64 76 Z M 80 14 L 20 86"
});
const question = /* @__PURE__ */ stroke({
  name: "question",
  category: "symbols",
  minUnits: 90,
  width: 14,
  source: "original",
  path: "M 25 32 C 25 8 76 8 76 33 C 76 52 50 54 50 70 M 50 90 L 50 90"
});
const spiral = /* @__PURE__ */ stroke({
  name: "spiral",
  category: "symbols",
  minUnits: 140,
  width: 9,
  source: "generated",
  path: "M 56.0 50.0 L 56.4 51.4 L 56.5 52.9 L 56.2 54.5 L 55.5 56.1 L 54.3 57.5 L 52.9 58.8 L 51.0 59.7 L 48.9 60.3 L 46.6 60.3 L 44.3 59.9 L 42.0 58.9 L 39.9 57.3 L 38.1 55.3 L 36.8 52.8 L 35.9 50.0 L 35.7 47.0 L 36.2 43.8 L 37.3 40.8 L 39.1 37.9 L 41.6 35.5 L 44.7 33.5 L 48.1 32.3 L 51.9 31.7 L 55.8 32.0 L 59.7 33.1 L 63.4 35.1 L 66.6 37.9 L 69.3 41.4 L 71.1 45.5 L 72.2 50.0 L 72.2 54.7 L 71.2 59.4 L 69.2 64.0 L 66.3 68.1 L 62.4 71.5 L 57.8 74.1 L 52.7 75.8 L 47.2 76.3 L 41.7 75.7 L 36.2 73.8 L 31.2 70.9 L 26.8 66.8 L 23.4 61.9 L 21.0 56.2 L 19.8 50.0 L 19.9 43.6 L 21.4 37.3 L 24.2 31.3 L 28.3 25.9 L 33.5 21.5 L 39.7 18.2 L 46.4 16.2 L 53.6 15.7 L 60.8 16.6 L 67.8 19.2 L 74.2 23.1 L 79.7 28.4 L 84.0 34.9 L 86.9 42.1 L 88.3 50.0 L 88.0 58.1 L 86.0 66.0 L 82.3 73.5 L 77.1 80.1 L 70.5 85.5 L 62.8 89.5 L 54.4 91.8 L 45.5 92.4 L 36.7 91.0 L 28.2 87.8 L 20.4 82.9 L 13.8 76.3 L 8.6 68.4 L 5.2 59.5 L 3.6 50.0 L 4.1 40.2 L 6.6 30.7 L 11.2 21.8"
});
const catalog = [
  heart,
  droplet,
  human,
  tree,
  house,
  battery,
  shield,
  rocket,
  target,
  globe,
  pyramid,
  leaf,
  sun,
  flame,
  fish,
  star,
  arrow,
  crown,
  cross,
  bolt,
  bulb,
  flask,
  car,
  plane,
  group,
  trophy,
  moneybag,
  funnel,
  gear,
  robot,
  pin,
  mountain,
  check,
  wifi,
  pulse,
  xmark,
  percent,
  question,
  spiral
];
const LAYOUT_KEY = "__apexcharts_unit_layouts__";
function layouts() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[LAYOUT_KEY]) g[LAYOUT_KEY] = {};
  return g[LAYOUT_KEY];
}
function registerShapes(shapes) {
  const table = layouts();
  const names = [];
  const entries = Array.isArray(shapes) ? shapes.map((s) => [s.shape ? s.shape.name : "", s]) : Object.entries(shapes);
  entries.forEach(([name, shape]) => {
    const key = String(name);
    const fn = (
      /** @type {UnitShape} */
      shape
    );
    if (!key || typeof fn !== "function") return;
    table[key] = fn;
    names.push(key);
  });
  return names;
}
function unregisterShapes(names) {
  const table = layouts();
  (Array.isArray(names) ? names : [names]).forEach((n) => {
    delete table[n];
  });
}
function registeredShapeNames() {
  return Object.keys(layouts());
}
const EM = 46;
const TOP = 8;
const MID = 48;
const BOT = 88;
const SEG = {
  a: [8, TOP, 38, TOP],
  b: [40, TOP + 3, 40, MID - 3],
  c: [40, MID + 3, 40, BOT - 3],
  d: [8, BOT, 38, BOT],
  e: [6, MID + 3, 6, BOT - 3],
  f: [6, TOP + 3, 6, MID - 3],
  g: [8, MID, 38, MID]
};
const GLYPHS = {
  0: "abcdef",
  2: "abdeg",
  3: "abcdg",
  4: "bcfg",
  5: "acdfg",
  6: "acdefg",
  7: "abc",
  8: "abcdefg",
  9: "abcdfg",
  "-": "g"
};
const MARKS = {
  1: (dx) => `M ${dx + 17} ${TOP + 3} L ${dx + 17} ${MID - 3} M ${dx + 17} ${MID + 3} L ${dx + 17} ${BOT - 3} `,
  ".": (dx) => `M ${dx + 20} ${BOT} L ${dx + 20} ${BOT} `,
  ",": (dx) => `M ${dx + 21} ${BOT - 2} L ${dx + 15} ${BOT + 10} `,
  ":": (dx) => `M ${dx + 20} 34 L ${dx + 20} 34 M ${dx + 20} 62 L ${dx + 20} 62 `
};
const ADVANCE = { 1: EM * 0.5, ".": EM * 0.42, ",": EM * 0.42, ":": EM * 0.42, " ": EM * 0.5 };
function digitsPath(text, gap = 10) {
  let d = "";
  let dx = 0;
  for (const ch of String(text)) {
    if (ch === " ") {
      dx += ADVANCE[" "] + gap;
      continue;
    }
    const mark = MARKS[ch];
    if (mark) {
      d += mark(dx);
      dx += (ADVANCE[ch] || EM) + gap;
      continue;
    }
    const on = GLYPHS[ch];
    if (!on) {
      throw new Error(
        `[ApexCharts] glyphs(): no seven-segment form for "${ch}". Digits, "-", ".", "," and ":" are available.`
      );
    }
    for (const key of on) {
      const s = SEG[key];
      d += `M ${dx + s[0]} ${s[1]} L ${dx + s[2]} ${s[3]} `;
    }
    dx += (ADVANCE[ch] || EM) + gap;
  }
  return d.trim();
}
function glyphs(text, opts = {}) {
  const str = String(text);
  const _a = opts, { gap } = _a, meta = __objRest(_a, ["gap"]);
  return stroke(__spreadProps(__spreadValues({
    name: `glyphs-${str}`,
    category: "symbols",
    // Each stroke is one segment wide, so a long number needs the dots to go
    // round: roughly 45 per lit segment keeps the strokes continuous.
    minUnits: Math.max(60, str.replace(/[^0-9]/g, "").length * 180),
    source: "generated",
    width: 13
  }, meta), {
    path: digitsPath(str, gap)
  }));
}
const PALETTE = ["#008FFB", "#00A86F", "#CA8501", "#FF4560", "#846DD5"];
function preview(shape, opts = {}) {
  const series = opts.series && opts.series.length ? opts.series : null;
  const total = series ? series.reduce((a, b) => a + Math.max(0, b), 0) : 0;
  const count = Math.max(
    1,
    Math.round(opts.count || total || shape.shape.minUnits || 220)
  );
  const width = opts.width || 300;
  const height = opts.height || width;
  const pad = opts.padding || 0;
  const given = Array.isArray(opts.fill) ? opts.fill : opts.fill ? [opts.fill] : null;
  const fills = given || (series ? PALETTE : ["#008FFB"]);
  const shares = series ? share(series, count) : null;
  const objects = [];
  const owner = [];
  const r = opts.r || Math.max(1.2, Math.sqrt(width * height / count) / 2.6);
  for (let i = 0; i < count; i++) {
    const s = shares ? seriesAt(shares, i) : 0;
    owner.push(s);
    objects.push({
      id: `p:${i}`,
      index: i,
      seriesIndex: s,
      dataPointIndex: i,
      label: shares ? `series-${s + 1}` : "preview",
      value: 1,
      datum: void 0,
      // The shapes refine this themselves; it only has to be in the right league.
      r
    });
  }
  const placed = shape(objects, {
    x: pad,
    y: pad,
    width: Math.max(1, width - pad * 2),
    height: Math.max(1, height - pad * 2)
  });
  const groups = /* @__PURE__ */ new Map();
  placed.forEach((p, i) => {
    const slot = shares ? owner[i] % fills.length : Math.floor(i / placed.length * fills.length);
    const fill = fills[slot] || fills[0];
    const circle = `<circle cx="${round(p.x)}" cy="${round(p.y)}" r="${round(p.r || 3)}"/>`;
    const list = groups.get(fill);
    if (list) list.push(circle);
    else groups.set(fill, [circle]);
  });
  let body = "";
  groups.forEach((circles, fill) => {
    body += `<g fill="${fill}">${circles.join("")}</g>`;
  });
  if (opts.svg === false) return body;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${shape.shape.name} drawn with ${placed.length} dots">${body}</svg>`;
}
function share(series, count) {
  const weights = series.map((v) => Math.max(0, v));
  const out = allocate(weights, count);
  for (let i = 0; i < out.length; i++) {
    if (out[i] || !weights[i]) continue;
    let big = 0;
    for (let j = 1; j < out.length; j++) if (out[j] > out[big]) big = j;
    if (out[big] > 1) {
      out[big]--;
      out[i] = 1;
    }
  }
  return out;
}
function seriesAt(shares, i) {
  let acc = 0;
  for (let s = 0; s < shares.length; s++) {
    acc += shares[s];
    if (i < acc) return s;
  }
  return shares.length - 1;
}
function round(n) {
  return Math.round(n * 10) / 10;
}
export {
  arrow,
  battery,
  bolt,
  bulb,
  car,
  catalog,
  check,
  cross,
  crown,
  digitsPath,
  droplet,
  fish,
  flame,
  flask,
  funnel,
  gear,
  globe,
  glyphs,
  group,
  heart,
  house,
  human,
  leaf,
  moneybag,
  mountain,
  outlined,
  percent,
  pin,
  plane,
  preview,
  pulse,
  pyramid,
  question,
  registerShapes,
  registeredShapeNames,
  rings,
  robot,
  rocket,
  shapeFrom,
  shield,
  silhouette,
  sphere,
  spiral,
  star,
  stroke,
  strokeFrom,
  sun,
  target,
  tiers,
  tree,
  trophy,
  unregisterShapes,
  wifi,
  xmark
};
