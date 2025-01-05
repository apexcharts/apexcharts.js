/*!
* @svgdotjs/svg.resize.js - An extension for svg.js which allows to resize elements which are selected
* @version 2.0.5
* https://github.com/svgdotjs/svg.resize.js
*
* @copyright [object Object]
* @license MIT
*
* BUILT: Wed Nov 20 2024 23:15:57 GMT+0100 (Central European Standard Time)
*/
;
import "@svgdotjs/svg.select.js";
import { on, Box, Matrix, Point, off, extend, Element } from "@svgdotjs/svg.js";
const getCoordsFromEvent = (ev) => {
  if (ev.changedTouches) {
    ev = ev.changedTouches[0];
  }
  return { x: ev.clientX, y: ev.clientY };
};
const maxBoxFromPoints = (points) => {
  let x = Infinity;
  let y = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    x = Math.min(x, p[0]);
    y = Math.min(y, p[1]);
    x2 = Math.max(x2, p[0]);
    y2 = Math.max(y2, p[1]);
  }
  return new Box(x, y, x2 - x, y2 - y);
};
function scaleBox(box, origin, scale) {
  const points = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x + box.width, box.y + box.height],
    [box.x, box.y + box.height]
  ];
  const newPoints = points.map(([x, y]) => {
    const translatedX = x - origin[0];
    const translatedY = y - origin[1];
    const scaledX = translatedX * scale;
    const scaledY = translatedY * scale;
    return [scaledX + origin[0], scaledY + origin[1]];
  });
  return maxBoxFromPoints(newPoints);
}
class ResizeHandler {
  constructor(el) {
    this.el = el;
    el.remember("_ResizeHandler", this);
    this.lastCoordinates = null;
    this.eventType = "";
    this.lastEvent = null;
    this.handleResize = this.handleResize.bind(this);
    this.resize = this.resize.bind(this);
    this.endResize = this.endResize.bind(this);
    this.rotate = this.rotate.bind(this);
    this.movePoint = this.movePoint.bind(this);
  }
  active(value, options) {
    this.preserveAspectRatio = options.preserveAspectRatio ?? false;
    this.aroundCenter = options.aroundCenter ?? false;
    this.grid = options.grid ?? 0;
    this.degree = options.degree ?? 0;
    this.el.off(".resize");
    if (!value) return;
    this.el.on(
      [
        "lt.resize",
        "rt.resize",
        "rb.resize",
        "lb.resize",
        "t.resize",
        "r.resize",
        "b.resize",
        "l.resize",
        "rot.resize",
        "point.resize"
      ],
      this.handleResize
    );
    if (this.lastEvent) {
      if (this.eventType === "rot") {
        this.rotate(this.lastEvent);
      } else if (this.eventType === "point") {
        this.movePoint(this.lastEvent);
      } else {
        this.resize(this.lastEvent);
      }
    }
  }
  // This is called when a user clicks on one of the resize points
  handleResize(e) {
    this.eventType = e.type;
    const { event, index, points } = e.detail;
    const isMouse = !event.type.indexOf("mouse");
    if (isMouse && (event.which || event.buttons) !== 1) {
      return;
    }
    if (this.el.dispatch("beforeresize", { event: e, handler: this }).defaultPrevented) {
      return;
    }
    this.box = this.el.bbox();
    this.startPoint = this.el.point(getCoordsFromEvent(event));
    this.index = index;
    this.points = points.slice();
    const eventMove = (isMouse ? "mousemove" : "touchmove") + ".resize";
    const eventEnd = (isMouse ? "mouseup" : "touchcancel.resize touchend") + ".resize";
    if (e.type === "point") {
      on(window, eventMove, this.movePoint);
    } else if (e.type === "rot") {
      on(window, eventMove, this.rotate);
    } else {
      on(window, eventMove, this.resize);
    }
    on(window, eventEnd, this.endResize);
  }
  resize(e) {
    this.lastEvent = e;
    const endPoint = this.snapToGrid(this.el.point(getCoordsFromEvent(e)));
    let dx = endPoint.x - this.startPoint.x;
    let dy = endPoint.y - this.startPoint.y;
    if (this.preserveAspectRatio && this.aroundCenter) {
      dx *= 2;
      dy *= 2;
    }
    const x = this.box.x + dx;
    const y = this.box.y + dy;
    const x2 = this.box.x2 + dx;
    const y2 = this.box.y2 + dy;
    let box = new Box(this.box);
    if (this.eventType.includes("l")) {
      box.x = Math.min(x, this.box.x2);
      box.x2 = Math.max(x, this.box.x2);
    }
    if (this.eventType.includes("r")) {
      box.x = Math.min(x2, this.box.x);
      box.x2 = Math.max(x2, this.box.x);
    }
    if (this.eventType.includes("t")) {
      box.y = Math.min(y, this.box.y2);
      box.y2 = Math.max(y, this.box.y2);
    }
    if (this.eventType.includes("b")) {
      box.y = Math.min(y2, this.box.y);
      box.y2 = Math.max(y2, this.box.y);
    }
    box.width = box.x2 - box.x;
    box.height = box.y2 - box.y;
    if (this.preserveAspectRatio) {
      const scaleX = box.width / this.box.width;
      const scaleY = box.height / this.box.height;
      const order = ["lt", "t", "rt", "r", "rb", "b", "lb", "l"];
      const origin = (order.indexOf(this.eventType) + 4) % order.length;
      const constantPoint = this.aroundCenter ? [this.box.cx, this.box.cy] : this.points[origin];
      let scale = this.eventType.includes("t") || this.eventType.includes("b") ? scaleY : scaleX;
      scale = this.eventType.length === 2 ? Math.max(scaleX, scaleY) : scale;
      box = scaleBox(this.box, constantPoint, scale);
    }
    if (this.el.dispatch("resize", {
      box: new Box(box),
      angle: 0,
      eventType: this.eventType,
      event: e,
      handler: this
    }).defaultPrevented) {
      return;
    }
    this.el.size(box.width, box.height).move(box.x, box.y);
  }
  movePoint(e) {
    this.lastEvent = e;
    const { x, y } = this.snapToGrid(this.el.point(getCoordsFromEvent(e)));
    const pointArr = this.el.array().slice();
    pointArr[this.index] = [x, y];
    if (this.el.dispatch("resize", {
      box: maxBoxFromPoints(pointArr),
      angle: 0,
      eventType: this.eventType,
      event: e,
      handler: this
    }).defaultPrevented) {
      return;
    }
    this.el.plot(pointArr);
  }
  rotate(e) {
    this.lastEvent = e;
    const startPoint = this.startPoint;
    const endPoint = this.el.point(getCoordsFromEvent(e));
    const { cx, cy } = this.box;
    const dx1 = startPoint.x - cx;
    const dy1 = startPoint.y - cy;
    const dx2 = endPoint.x - cx;
    const dy2 = endPoint.y - cy;
    const c = Math.sqrt(dx1 * dx1 + dy1 * dy1) * Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (c === 0) {
      return;
    }
    let angle = Math.acos((dx1 * dx2 + dy1 * dy2) / c) / Math.PI * 180;
    if (!angle) return;
    if (endPoint.x < startPoint.x) {
      angle = -angle;
    }
    const matrix = new Matrix(this.el);
    const { x: ox, y: oy } = new Point(cx, cy).transformO(matrix);
    const { rotate } = matrix.decompose();
    const resultAngle = this.snapToAngle(rotate + angle) - rotate;
    if (this.el.dispatch("resize", {
      box: this.box,
      angle: resultAngle,
      eventType: this.eventType,
      event: e,
      handler: this
    }).defaultPrevented) {
      return;
    }
    this.el.transform(matrix.rotateO(resultAngle, ox, oy));
  }
  endResize(ev) {
    if (this.eventType !== "rot" && this.eventType !== "point") {
      this.resize(ev);
    }
    this.lastEvent = null;
    this.eventType = "";
    off(window, "mousemove.resize touchmove.resize");
    off(window, "mouseup.resize touchend.resize");
  }
  snapToGrid(point) {
    if (this.grid) {
      point.x = Math.round(point.x / this.grid) * this.grid;
      point.y = Math.round(point.y / this.grid) * this.grid;
    }
    return point;
  }
  snapToAngle(angle) {
    if (this.degree) {
      angle = Math.round(angle / this.degree) * this.degree;
    }
    return angle;
  }
}
extend(Element, {
  // Resize element with mouse
  resize: function(enabled = true, options = {}) {
    if (typeof enabled === "object") {
      options = enabled;
      enabled = true;
    }
    let resizeHandler = this.remember("_ResizeHandler");
    if (!resizeHandler) {
      if (enabled.prototype instanceof ResizeHandler) {
        resizeHandler = new enabled(this);
        enabled = true;
      } else {
        resizeHandler = new ResizeHandler(this);
      }
      this.remember("_resizeHandler", resizeHandler);
    }
    resizeHandler.active(enabled, options);
    return this;
  }
});
export {
  ResizeHandler
};
//# sourceMappingURL=svg.resize.js.map
