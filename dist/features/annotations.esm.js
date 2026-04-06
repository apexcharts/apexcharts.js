/*!
 * ApexCharts v5.10.5
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const Utils = _core.__apex_Utils;
const CoreUtils = _core.__apex_CoreUtils;
class Helpers {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
  }
  /**
   * @param {Record<string, any>} anno
   * @param {number | null} [annoIndex]
   */
  setOrientations(anno, annoIndex = null) {
    var _a, _b;
    const w = this.w;
    if (anno.label.orientation === "vertical") {
      const i = annoIndex !== null ? annoIndex : 0;
      const xAnno = w.dom.baseEl.querySelector(
        `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`
      );
      if (xAnno !== null) {
        const xAnnoCoord = (
          /** @type {SVGGraphicsElement} */
          xAnno.getBBox()
        );
        xAnno.setAttribute(
          "x",
          String(
            parseFloat((_a = xAnno.getAttribute("x")) != null ? _a : "0") - xAnnoCoord.height + 4
          )
        );
        const yOffset = anno.label.position === "top" ? xAnnoCoord.width : -xAnnoCoord.width;
        xAnno.setAttribute(
          "y",
          String(parseFloat((_b = xAnno.getAttribute("y")) != null ? _b : "0") + yOffset)
        );
        const { x, y } = this.annoCtx.graphics.rotateAroundCenter(xAnno);
        xAnno.setAttribute("transform", `rotate(-90 ${x} ${y})`);
      }
    }
  }
  /**
   * @param {any} annoEl
   * @param {Record<string, any>} anno
   */
  addBackgroundToAnno(annoEl, anno) {
    const w = this.w;
    if (!annoEl || !anno.label.text || !String(anno.label.text).trim()) {
      return null;
    }
    const gridEl = w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!gridEl) return null;
    const elGridRect = gridEl.getBoundingClientRect();
    const gridBBox = (
      /** @type {SVGGraphicsElement} */
      gridEl.getBBox()
    );
    const zoom = elGridRect.width / gridBBox.width || 1;
    const coords = annoEl.getBoundingClientRect();
    let {
      left: pleft,
      right: pright,
      top: ptop,
      bottom: pbottom
    } = anno.label.style.padding;
    if (anno.label.orientation === "vertical") {
      [ptop, pbottom, pleft, pright] = [pleft, pright, ptop, pbottom];
    }
    const x1 = (coords.left - elGridRect.left) / zoom - pleft;
    const y1 = (coords.top - elGridRect.top) / zoom - ptop;
    const elRect = this.annoCtx.graphics.drawRect(
      x1 - w.globals.barPadForNumericAxis,
      y1,
      coords.width / zoom + pleft + pright,
      coords.height / zoom + ptop + pbottom,
      anno.label.borderRadius,
      anno.label.style.background,
      1,
      anno.label.borderWidth,
      anno.label.borderColor,
      0
    );
    if (anno.id) {
      elRect.node.classList.add(anno.id);
    }
    return elRect;
  }
  annotationsBackground() {
    const w = this.w;
    const add = (anno, i, type) => {
      const annoLabel = w.dom.baseEl.querySelector(
        `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i}']`
      );
      if (annoLabel) {
        const parent = annoLabel.parentNode;
        const elRect = this.addBackgroundToAnno(annoLabel, anno);
        if (elRect) {
          parent == null ? void 0 : parent.insertBefore(elRect.node, annoLabel);
          if (anno.label.mouseEnter) {
            elRect.node.addEventListener(
              "mouseenter",
              anno.label.mouseEnter.bind(this, anno)
            );
          }
          if (anno.label.mouseLeave) {
            elRect.node.addEventListener(
              "mouseleave",
              anno.label.mouseLeave.bind(this, anno)
            );
          }
          if (anno.label.click) {
            elRect.node.addEventListener(
              "click",
              anno.label.click.bind(this, anno)
            );
          }
        }
      }
    };
    w.config.annotations.xaxis.forEach(
      (anno, i) => add(anno, i, "xaxis")
    );
    w.config.annotations.yaxis.forEach(
      (anno, i) => add(anno, i, "yaxis")
    );
    w.config.annotations.points.forEach(
      (anno, i) => add(anno, i, "point")
    );
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getY1Y2(type, anno) {
    var _a, _b;
    const w = this.w;
    const y = type === "y1" ? anno.y : anno.y2;
    let yP;
    let clipped = false;
    if (this.annoCtx.invertAxis) {
      const labels = w.config.xaxis.convertedCatToNumeric ? w.labelData.categoryLabels : w.labelData.labels;
      const catIndex = labels.indexOf(y);
      const xLabel = w.dom.baseEl.querySelector(
        `.apexcharts-yaxis-texts-g text:nth-child(${catIndex + 1})`
      );
      yP = xLabel ? parseFloat((_a = xLabel.getAttribute("y")) != null ? _a : "0") : (w.layout.gridHeight / labels.length - 1) * (catIndex + 1) - w.globals.barHeight;
      if (anno.seriesIndex !== void 0 && w.globals.barHeight) {
        yP -= w.globals.barHeight / 2 * (w.seriesData.series.length - 1) - w.globals.barHeight * anno.seriesIndex;
      }
    } else {
      const seriesIndex = w.globals.seriesYAxisMap[anno.yAxisIndex][0];
      const yPos = w.config.yaxis[anno.yAxisIndex].logarithmic ? new CoreUtils(this.w).getLogVal(
        w.config.yaxis[anno.yAxisIndex].logBase,
        y,
        seriesIndex
      ) / /** @type {any} */
      w.globals.yLogRatio[seriesIndex] : (y - w.globals.minYArr[seriesIndex]) / (w.globals.yRange[seriesIndex] / w.layout.gridHeight);
      yP = w.layout.gridHeight - Math.min(Math.max(yPos, 0), w.layout.gridHeight);
      clipped = yPos > w.layout.gridHeight || yPos < 0;
      if (anno.marker && (anno.y === void 0 || anno.y === null)) {
        yP = 0;
      }
      if ((_b = w.config.yaxis[anno.yAxisIndex]) == null ? void 0 : _b.reversed) {
        yP = yPos;
      }
    }
    if (typeof y === "string" && y.includes("px")) {
      yP = parseFloat(y);
    }
    return { yP, clipped };
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getX1X2(type, anno) {
    const w = this.w;
    const x = type === "x1" ? anno.x : anno.x2;
    const min = this.annoCtx.invertAxis ? w.globals.minY : w.globals.minX;
    const max = this.annoCtx.invertAxis ? w.globals.maxY : w.globals.maxX;
    const range = this.annoCtx.invertAxis ? w.globals.yRange[0] : w.globals.xRange;
    let clipped = false;
    let xP = this.annoCtx.inversedReversedAxis ? (max - x) / (range / w.layout.gridWidth) : (x - min) / (range / w.layout.gridWidth);
    if ((w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !this.annoCtx.invertAxis && !w.axisFlags.dataFormatXNumeric) {
      if (!w.config.chart.sparkline.enabled) {
        xP = this.getStringX(x);
      }
    }
    if (typeof x === "string" && x.includes("px")) {
      xP = parseFloat(x);
    }
    if ((x === void 0 || x === null) && anno.marker) {
      xP = w.layout.gridWidth;
    }
    if (anno.seriesIndex !== void 0 && w.globals.barWidth && !this.annoCtx.invertAxis) {
      xP -= w.globals.barWidth / 2 * (w.seriesData.series.length - 1) - w.globals.barWidth * anno.seriesIndex;
    }
    if (typeof xP !== "number") {
      xP = 0;
      clipped = true;
    }
    if (parseFloat(xP.toFixed(10)) > parseFloat(w.layout.gridWidth.toFixed(10))) {
      xP = w.layout.gridWidth;
      clipped = true;
    } else if (xP < 0) {
      xP = 0;
      clipped = true;
    }
    return { x: xP, clipped };
  }
  /**
   * @param {number} x
   */
  getStringX(x) {
    var _a;
    const w = this.w;
    let rX = x;
    if (w.config.xaxis.convertedCatToNumeric && w.labelData.categoryLabels.length) {
      const strX = String(x);
      x = w.labelData.categoryLabels.findIndex(
        (l) => String(l) === strX
      ) + 1;
    }
    const catIndex = w.labelData.labels.map(
      (item) => Array.isArray(item) ? item.join(" ") : item
    ).indexOf(x);
    const xLabel = w.dom.baseEl.querySelector(
      `.apexcharts-xaxis-texts-g text:nth-child(${catIndex + 1})`
    );
    if (xLabel) {
      rX = parseFloat((_a = xLabel.getAttribute("x")) != null ? _a : "0");
    }
    return rX;
  }
}
class XAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.invertAxis = this.annoCtx.invertAxis;
    this.helpers = new Helpers(this.annoCtx);
  }
  /**
   * @param {XAxisAnnotations} anno
   * @param {Element} parent
   * @param {number} index
   */
  addXaxisAnnotation(anno, parent, index) {
    const w = this.w;
    const result = this.helpers.getX1X2("x1", anno);
    let x1 = result.x;
    const clipX1 = result.clipped;
    let clipX2 = true;
    let x2;
    const text = anno.label.text;
    const strokeDashArray = anno.strokeDashArray;
    if (!Utils.isNumber(x1)) return;
    if (anno.x2 === null || typeof anno.x2 === "undefined") {
      if (!clipX1) {
        const line = this.annoCtx.graphics.drawLine(
          x1 + anno.offsetX,
          // x1
          0 + anno.offsetY,
          // y1
          x1 + anno.offsetX,
          // x2
          w.layout.gridHeight + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          //dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
      }
    } else {
      const result2 = this.helpers.getX1X2("x2", anno);
      x2 = result2.x;
      clipX2 = result2.clipped;
      if (x2 < x1) {
        const temp = x1;
        x1 = x2;
        x2 = temp;
      }
      const rect = this.annoCtx.graphics.drawRect(
        x1 + anno.offsetX,
        // x1
        0 + anno.offsetY,
        // y1
        x2 - x1,
        // x2
        w.layout.gridHeight + anno.offsetY,
        // y2
        0,
        // radius
        anno.fillColor,
        // color
        anno.opacity,
        // opacity,
        1,
        // strokeWidth
        anno.borderColor,
        // strokeColor
        strokeDashArray
        // stokeDashArray
      );
      rect.node.classList.add("apexcharts-annotation-rect");
      rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
      parent.appendChild(rect.node);
      if (anno.id) {
        rect.node.classList.add(anno.id);
      }
    }
    if (!(clipX1 && clipX2)) {
      const textRects = this.annoCtx.graphics.getTextRects(
        text,
        anno.label.style.fontSize
      );
      const textY = anno.label.position === "top" ? 4 : anno.label.position === "center" ? w.layout.gridHeight / 2 + (anno.label.orientation === "vertical" ? textRects.width / 2 : 0) : w.layout.gridHeight;
      const elText = this.annoCtx.graphics.drawText({
        x: x1 + anno.label.offsetX,
        y: textY + anno.label.offsetY - (anno.label.orientation === "vertical" ? anno.label.position === "top" ? textRects.width / 2 - 12 : -textRects.width / 2 : 0),
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-xaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      this.annoCtx.helpers.setOrientations(anno, index);
    }
  }
  drawXAxisAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-xaxis-annotations"
    });
    w.config.annotations.xaxis.map(
      (anno, index) => {
        this.addXaxisAnnotation(anno, elg.node, index);
      }
    );
    return elg;
  }
}
const AxesUtils = _core.__apex_axes_AxesUtils;
class YAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers(this.annoCtx);
    this.axesUtils = new AxesUtils(this.annoCtx.w, {
      theme: this.annoCtx.theme,
      timeScale: this.annoCtx.timeScale
    });
  }
  /**
   * @param {YAxisAnnotations} anno
   * @param {Element} parent
   * @param {number} index
   */
  addYaxisAnnotation(anno, parent, index) {
    const w = this.w;
    const strokeDashArray = anno.strokeDashArray;
    let result = this.helpers.getY1Y2("y1", anno);
    let y1 = result.yP;
    const clipY1 = result.clipped;
    let y2;
    let clipY2 = true;
    let drawn = false;
    const text = anno.label.text;
    if (anno.y2 === null || typeof anno.y2 === "undefined") {
      if (!clipY1) {
        drawn = true;
        const line = this.annoCtx.graphics.drawLine(
          0 + anno.offsetX,
          // x1
          y1 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          // dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
      }
    } else {
      result = this.helpers.getY1Y2("y2", anno);
      y2 = result.yP;
      clipY2 = result.clipped;
      if (y2 > y1) {
        const temp = y1;
        y1 = y2;
        y2 = temp;
      }
      if (!(clipY1 && clipY2)) {
        drawn = true;
        const rect = this.annoCtx.graphics.drawRect(
          0 + anno.offsetX,
          // x1
          y2 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 - y2,
          // y2
          0,
          // radius
          anno.fillColor,
          // color
          anno.opacity,
          // opacity,
          1,
          // strokeWidth
          anno.borderColor,
          // strokeColor
          strokeDashArray
          // stokeDashArray
        );
        rect.node.classList.add("apexcharts-annotation-rect");
        rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
        parent.appendChild(rect.node);
        if (anno.id) {
          rect.node.classList.add(anno.id);
        }
      }
    }
    if (drawn) {
      const textX = anno.label.position === "right" ? w.layout.gridWidth : anno.label.position === "center" ? w.layout.gridWidth / 2 : 0;
      const elText = this.annoCtx.graphics.drawText({
        x: textX + anno.label.offsetX,
        y: (y2 != null ? y2 : y1) + anno.label.offsetY - 3,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-yaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
    }
  }
  /**
   * @param {YAxisAnnotations} anno
   */
  _getYAxisAnnotationWidth(anno) {
    const w = this.w;
    let width = w.layout.gridWidth;
    if (anno.width.indexOf("%") > -1) {
      width = w.layout.gridWidth * parseInt(anno.width, 10) / 100;
    } else {
      width = parseInt(anno.width, 10);
    }
    return width + anno.offsetX;
  }
  drawYAxisAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-yaxis-annotations"
    });
    w.config.annotations.yaxis.forEach(
      (anno, index) => {
        anno.yAxisIndex = this.axesUtils.translateYAxisIndex(anno.yAxisIndex);
        if (!(this.axesUtils.isYAxisHidden(anno.yAxisIndex) && this.axesUtils.yAxisAllSeriesCollapsed(anno.yAxisIndex))) {
          this.addYaxisAnnotation(anno, elg.node, index);
        }
      }
    );
    return elg;
  }
}
class PointAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers(this.annoCtx);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    const w = this.w;
    if (w.globals.collapsedSeriesIndices.indexOf(anno.seriesIndex) > -1) {
      return;
    }
    const resultX = this.helpers.getX1X2("x1", anno);
    const x = resultX.x;
    const clipX = resultX.clipped;
    const resultY = this.helpers.getY1Y2("y1", anno);
    const y = resultY.yP;
    const clipY = resultY.clipped;
    if (!Utils.isNumber(x)) return;
    if (!(clipY || clipX)) {
      const optsPoints = {
        pSize: anno.marker.size,
        pointStrokeWidth: anno.marker.strokeWidth,
        pointFillColor: anno.marker.fillColor,
        pointStrokeColor: anno.marker.strokeColor,
        shape: anno.marker.shape,
        pRadius: anno.marker.radius,
        class: `apexcharts-point-annotation-marker ${anno.marker.cssClass} ${anno.id ? anno.id : ""}`
      };
      let point = this.annoCtx.graphics.drawMarker(
        x + anno.marker.offsetX,
        y + anno.marker.offsetY,
        optsPoints
      );
      parent.appendChild(point.node);
      const text = anno.label.text ? anno.label.text : "";
      const elText = this.annoCtx.graphics.drawText({
        x: x + anno.label.offsetX,
        y: y + anno.label.offsetY - anno.marker.size - parseFloat(anno.label.style.fontSize) / 1.6,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-point-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      if (anno.customSVG.SVG) {
        const g = this.annoCtx.graphics.group({
          class: "apexcharts-point-annotations-custom-svg " + anno.customSVG.cssClass
        });
        g.attr({
          transform: `translate(${x + anno.customSVG.offsetX}, ${y + anno.customSVG.offsetY})`
        });
        g.node.innerHTML = anno.customSVG.SVG;
        parent.appendChild(g.node);
      }
      if (anno.image.path) {
        const imgWidth = anno.image.width ? anno.image.width : 20;
        const imgHeight = anno.image.height ? anno.image.height : 20;
        point = this.annoCtx.addImage({
          x: x + anno.image.offsetX - imgWidth / 2,
          y: y + anno.image.offsetY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          path: anno.image.path,
          appendTo: ".apexcharts-point-annotations"
        });
      }
      if (anno.mouseEnter) {
        point.node.addEventListener(
          "mouseenter",
          anno.mouseEnter.bind(this, anno)
        );
      }
      if (anno.mouseLeave) {
        point.node.addEventListener(
          "mouseleave",
          anno.mouseLeave.bind(this, anno)
        );
      }
      if (anno.click) {
        point.node.addEventListener("click", anno.click.bind(this, anno));
      }
    }
  }
  drawPointAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-point-annotations"
    });
    w.config.annotations.points.map(
      (anno, index) => {
        this.addPointAnnotation(anno, elg.node, index);
      }
    );
    return elg;
  }
}
const Options = _core.__apex_Options;
class Annotations {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w, { theme = null, timeScale = null } = {}) {
    this.w = w;
    this.theme = theme;
    this.timeScale = timeScale;
    this.invertAxis = void 0;
    this.inversedReversedAxis = void 0;
    this.graphics = new Graphics(this.w);
    if (this.w.globals.isBarHorizontal) {
      this.invertAxis = true;
    }
    this.helpers = new Helpers(this);
    this.xAxisAnnotations = new XAnnotations(this);
    this.yAxisAnnotations = new YAnnotations(this);
    this.pointsAnnotations = new PointAnnotations(this);
    if (this.w.globals.isBarHorizontal && this.w.config.yaxis[0].reversed) {
      this.inversedReversedAxis = true;
    }
    this.xDivision = this.w.layout.gridWidth / this.w.globals.dataPoints;
  }
  drawAxesAnnotations() {
    const w = this.w;
    if (w.globals.axisCharts && w.globals.dataPoints) {
      const yAnnotations = this.yAxisAnnotations.drawYAxisAnnotations();
      const xAnnotations = this.xAxisAnnotations.drawXAxisAnnotations();
      const pointAnnotations = this.pointsAnnotations.drawPointAnnotations();
      const initialAnim = w.config.chart.animations.enabled;
      const annoArray = [yAnnotations, xAnnotations, pointAnnotations];
      const annoElArray = [
        xAnnotations.node,
        yAnnotations.node,
        pointAnnotations.node
      ];
      for (let i = 0; i < 3; i++) {
        w.dom.elGraphical.add(annoArray[i]);
        if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
          if (w.config.chart.type !== "scatter" && w.config.chart.type !== "bubble" && w.globals.dataPoints > 1) {
            annoElArray[i].classList.add("apexcharts-element-hidden");
          }
        }
        w.globals.delayedElements.push({ el: annoElArray[i], index: 0 });
      }
      this.helpers.annotationsBackground();
    }
  }
  drawImageAnnos() {
    const w = this.w;
    w.config.annotations.images.map((s) => {
      this.addImage(s);
    });
  }
  drawTextAnnos() {
    const w = this.w;
    w.config.annotations.texts.map((t) => {
      this.addText(t);
    });
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addXaxisAnnotation(anno, parent, index) {
    this.xAxisAnnotations.addXaxisAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addYaxisAnnotation(anno, parent, index) {
    this.yAxisAnnotations.addYaxisAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    this.pointsAnnotations.addPointAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} params
   */
  addText(params) {
    const {
      x,
      y,
      text,
      textAnchor,
      foreColor,
      fontSize,
      fontFamily,
      fontWeight,
      cssClass,
      backgroundColor,
      borderWidth,
      strokeDashArray,
      borderRadius,
      borderColor,
      appendTo = ".apexcharts-svg",
      paddingLeft = 4,
      paddingRight = 4,
      paddingBottom = 2,
      paddingTop = 2
    } = params;
    const w = this.w;
    const elText = this.graphics.drawText({
      x,
      y,
      text,
      textAnchor: textAnchor || "start",
      fontSize: fontSize || "12px",
      fontWeight: fontWeight || "regular",
      fontFamily: fontFamily || w.config.chart.fontFamily,
      foreColor: foreColor || w.config.chart.foreColor,
      cssClass: "apexcharts-text " + cssClass ? cssClass : ""
    });
    const parent = w.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(elText.node);
    }
    const textRect = elText.bbox();
    if (text) {
      const elRect = this.graphics.drawRect(
        textRect.x - paddingLeft,
        textRect.y - paddingTop,
        textRect.width + paddingLeft + paddingRight,
        textRect.height + paddingBottom + paddingTop,
        borderRadius,
        backgroundColor ? backgroundColor : "transparent",
        1,
        borderWidth,
        borderColor,
        strokeDashArray
      );
      parent.insertBefore(elRect.node, elText.node);
    }
  }
  /**
   * @param {Record<string, any>} params
   */
  addImage(params) {
    const w = this.w;
    const {
      path,
      x = 0,
      y = 0,
      width = 20,
      height = 20,
      appendTo = ".apexcharts-svg"
    } = params;
    const img = w.dom.Paper.image(path);
    img.size(width, height).move(x, y);
    const parent = w.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(img.node);
    }
    return img;
  }
  // The addXaxisAnnotation method requires a parent class, and user calling this method externally on the chart instance may not specify parent, hence a different method
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addXaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "xaxis",
      contextMethod: context.addXaxisAnnotation
    });
    return context;
  }
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addYaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "yaxis",
      contextMethod: context.addYaxisAnnotation
    });
    return context;
  }
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addPointAnnotationExternal(params, pushToMemory, context) {
    if (typeof this.invertAxis === "undefined") {
      this.invertAxis = context.w.globals.isBarHorizontal;
    }
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "point",
      contextMethod: context.addPointAnnotation
    });
    return context;
  }
  /** @param {{params: any, pushToMemory: any, context: any, type: any, contextMethod: any}} opts */
  addAnnotationExternal({
    params,
    pushToMemory,
    context,
    type,
    contextMethod
  }) {
    const me = context;
    const w = me.w;
    const parent = w.dom.baseEl.querySelector(`.apexcharts-${type}-annotations`);
    const index = parent.childNodes.length + 1;
    const options = new Options();
    const axesAnno = Object.assign(
      {},
      type === "xaxis" ? options.xAxisAnnotation : type === "yaxis" ? options.yAxisAnnotation : options.pointAnnotation
    );
    const anno = Utils.extend(axesAnno, params);
    switch (type) {
      case "xaxis":
        this.addXaxisAnnotation(anno, parent, index);
        break;
      case "yaxis":
        this.addYaxisAnnotation(anno, parent, index);
        break;
      case "point":
        this.addPointAnnotation(anno, parent, index);
        break;
    }
    const axesAnnoLabel = w.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${index}']`
    );
    const elRect = this.helpers.addBackgroundToAnno(axesAnnoLabel, anno);
    if (elRect) {
      parent.insertBefore(elRect.node, axesAnnoLabel);
    }
    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
        context: me,
        id: anno.id ? anno.id : Utils.randomId(),
        method: contextMethod,
        label: "addAnnotation",
        params
      });
    }
    return context;
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   */
  clearAnnotations(ctx) {
    const w = ctx.w;
    const annos = w.dom.baseEl.querySelectorAll(
      ".apexcharts-yaxis-annotations, .apexcharts-xaxis-annotations, .apexcharts-point-annotations"
    );
    for (let i = w.globals.memory.methodsToExec.length - 1; i >= 0; i--) {
      if (w.globals.memory.methodsToExec[i].label === "addText" || w.globals.memory.methodsToExec[i].label === "addAnnotation") {
        w.globals.memory.methodsToExec.splice(i, 1);
      }
    }
    Array.prototype.forEach.call(annos, (a) => {
      while (a.firstChild) {
        a.removeChild(a.firstChild);
      }
    });
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {string} id
   */
  removeAnnotation(ctx, id) {
    const w = ctx.w;
    const annos = w.dom.baseEl.querySelectorAll(`.${id}`);
    if (annos) {
      w.globals.memory.methodsToExec.map((m, i) => {
        if (m.id === id) {
          w.globals.memory.methodsToExec.splice(i, 1);
        }
      });
      Object.keys(w.config.annotations).forEach((key) => {
        const annotationArray = w.config.annotations[key];
        if (Array.isArray(annotationArray)) {
          w.config.annotations[key] = annotationArray.filter((m) => m.id !== id);
        }
      });
      Array.prototype.forEach.call(annos, (a) => {
        a.parentElement.removeChild(a);
      });
    }
  }
}
_core__default.registerFeatures({ annotations: Annotations });
export {
  default2 as default
};
