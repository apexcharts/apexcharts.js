/*!
 * ApexCharts v5.10.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Animations = _core.__apex_Animations;
const Fill = _core.__apex_Fill;
const Utils = _core.__apex_Utils;
const Graphics = _core.__apex_Graphics;
const Filters = _core.__apex_Filters;
const Scales = _core.__apex_Scales;
class CircularChartsHelpers {
  constructor(w) {
    this.w = w;
  }
  drawYAxisTexts(x, y, i, text) {
    const w = this.w;
    const yaxisConfig = w.config.yaxis[0];
    const formatter = w.formatters.yLabelFormatters[0];
    const graphics = new Graphics(this.w);
    const yaxisLabel = graphics.drawText({
      x: x + yaxisConfig.labels.offsetX,
      y: y + yaxisConfig.labels.offsetY,
      text: formatter(text, i),
      textAnchor: "middle",
      fontSize: yaxisConfig.labels.style.fontSize,
      fontFamily: yaxisConfig.labels.style.fontFamily,
      foreColor: Array.isArray(yaxisConfig.labels.style.colors) ? yaxisConfig.labels.style.colors[i] : yaxisConfig.labels.style.colors
    });
    return yaxisLabel;
  }
}
class Pie {
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    this.chartType = this.w.config.chart.type;
    this.initialAnim = this.w.config.chart.animations.enabled;
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled;
    this.animBeginArr = [0];
    this.animDur = 0;
    this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels;
    this.lineColorArr = w.globals.stroke.colors !== void 0 ? w.globals.stroke.colors : w.globals.colors;
    this.defaultSize = Math.min(w.layout.gridWidth, w.layout.gridHeight);
    this.centerY = this.defaultSize / 2;
    this.centerX = w.layout.gridWidth / 2;
    if (w.config.chart.type === "radialBar") {
      this.fullAngle = 360;
    } else {
      this.fullAngle = Math.abs(
        w.config.plotOptions.pie.endAngle - w.config.plotOptions.pie.startAngle
      );
    }
    this.initialAngle = w.config.plotOptions.pie.startAngle % this.fullAngle;
    w.globals.radialSize = this.defaultSize / 2.05 - w.config.stroke.width - (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0);
    this.donutSize = w.globals.radialSize * parseInt(w.config.plotOptions.pie.donut.size, 10) / 100;
    const scaleSize = w.config.plotOptions.pie.customScale;
    const halfW = w.layout.gridWidth / 2;
    const halfH = w.layout.gridHeight / 2;
    this.translateX = halfW - halfW * scaleSize;
    this.translateY = halfH - halfH * scaleSize;
    this.dataLabelsGroup = new Graphics(this.w).group({
      class: "apexcharts-datalabels-group",
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${scaleSize})`
    });
    this.maxY = 0;
    this.sliceLabels = [];
    this.sliceSizes = [];
    this.prevSectorAngleArr = [];
  }
  draw(series) {
    const self = this;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const elPie = graphics.group({
      class: "apexcharts-pie"
    });
    if (w.globals.noData) return elPie;
    let total = 0;
    for (let k = 0; k < series.length; k++) {
      total += Utils.negToZero(series[k]);
    }
    const sectorAngleArr = [];
    const elSeries = graphics.group();
    if (total === 0) {
      total = 1e-5;
    }
    series.forEach((m) => {
      this.maxY = Math.max(this.maxY, m);
    });
    if (w.config.yaxis[0].max) {
      this.maxY = w.config.yaxis[0].max;
    }
    if (w.config.grid.position === "back" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    for (let i = 0; i < series.length; i++) {
      const angle = this.fullAngle * Utils.negToZero(series[i]) / total;
      sectorAngleArr.push(angle);
      if (this.chartType === "polarArea") {
        sectorAngleArr[i] = this.fullAngle / series.length;
        this.sliceSizes.push(w.globals.radialSize * series[i] / this.maxY);
      } else {
        this.sliceSizes.push(w.globals.radialSize);
      }
    }
    if (w.globals.dataChanged) {
      let prevTotal = 0;
      for (let k = 0; k < w.globals.previousPaths.length; k++) {
        prevTotal += Utils.negToZero(w.globals.previousPaths[k]);
      }
      let previousAngle;
      for (let i = 0; i < w.globals.previousPaths.length; i++) {
        previousAngle = this.fullAngle * Utils.negToZero(w.globals.previousPaths[i]) / prevTotal;
        this.prevSectorAngleArr.push(previousAngle);
      }
    }
    if (this.donutSize < 0) {
      this.donutSize = 0;
    }
    if (this.chartType === "donut") {
      const circle = graphics.drawCircle(this.donutSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: w.config.plotOptions.pie.donut.background ? w.config.plotOptions.pie.donut.background : "transparent"
      });
      elSeries.add(circle);
    }
    const elG = self.drawArcs(sectorAngleArr, series);
    this.sliceLabels.forEach((s) => {
      elG.add(s);
    });
    elSeries.attr({
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${w.config.plotOptions.pie.customScale})`
    });
    elSeries.add(elG);
    elPie.add(elSeries);
    if (this.donutDataLabels.show) {
      const dataLabels = this.renderInnerDataLabels(
        this.dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show
        }
      );
      elPie.add(dataLabels);
    }
    if (w.config.grid.position === "front" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    return elPie;
  }
  // core function for drawing pie arcs
  drawArcs(sectorAngleArr, series) {
    const w = this.w;
    const filters = new Filters(this.w);
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    const g = graphics.group({
      class: "apexcharts-slices"
    });
    let startAngle = this.initialAngle;
    let prevStartAngle = this.initialAngle;
    let endAngle = this.initialAngle;
    let prevEndAngle = this.initialAngle;
    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0;
    for (let i = 0; i < sectorAngleArr.length; i++) {
      const elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      g.add(elPieArc);
      startAngle = endAngle;
      prevStartAngle = prevEndAngle;
      endAngle = startAngle + sectorAngleArr[i];
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i];
      const angle = endAngle < startAngle ? this.fullAngle + endAngle - startAngle : endAngle - startAngle;
      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: this.sliceSizes[i],
        value: series[i]
      });
      const path = this.getChangedPath(prevStartAngle, prevEndAngle);
      const elPath = graphics.drawPath({
        d: path,
        stroke: Array.isArray(this.lineColorArr) ? this.lineColorArr[i] : this.lineColorArr,
        strokeWidth: 0,
        fill: pathFill,
        fillOpacity: w.config.fill.opacity,
        classes: `apexcharts-pie-area apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
      });
      elPath.attr({
        index: 0,
        j: i
      });
      filters.setSelectionFilter(elPath, 0, i);
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        filters.dropShadow(elPath, shadow, i);
      }
      this.addListeners(elPath, this.donutDataLabels);
      let labelPosition = {
        x: 0,
        y: 0
      };
      const midAngle = (startAngle + angle / 2) % this.fullAngle;
      let arcCenter = { x: this.centerX, y: this.centerY };
      if (this.chartType === "pie" || this.chartType === "polarArea") {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 1.25 + w.config.plotOptions.pie.dataLabels.offset,
          midAngle
        );
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 2,
          midAngle
        );
      } else if (this.chartType === "donut") {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2 + w.config.plotOptions.pie.dataLabels.offset,
          midAngle
        );
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2,
          midAngle
        );
      }
      Graphics.setAttrs(elPath.node, {
        "data:angle": angle,
        "data:startAngle": startAngle,
        "data:strokeWidth": this.strokeWidth,
        "data:value": series[i],
        "data:cx": arcCenter.x,
        "data:cy": arcCenter.y
      });
      elPieArc.add(elPath);
      let dur = 0;
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = angle / this.fullAngle * w.config.chart.animations.speed;
        if (dur === 0) dur = 1;
        this.animDur = dur + this.animDur;
        this.animBeginArr.push(this.animDur);
      } else {
        this.animBeginArr.push(0);
      }
      if (this.dynamicAnim && w.globals.dataChanged) {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          prevStartAngle,
          prevEndAngle,
          animateStartingPos: true,
          i,
          animBeginArr: this.animBeginArr,
          shouldSetPrevPaths: true,
          dur: w.config.chart.animations.dynamicAnimation.speed
        });
      } else {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur
        });
      }
      if (w.config.plotOptions.pie.expandOnClick && this.chartType !== "polarArea") {
        elPath.node.addEventListener("mouseup", this.pieClicked.bind(this, i));
      }
      if (typeof w.interact.selectedDataPoints[0] !== "undefined" && w.interact.selectedDataPoints[0].indexOf(i) > -1) {
        this.pieClicked(i);
      }
      if (w.config.dataLabels.enabled) {
        const xPos = labelPosition.x;
        const yPos = labelPosition.y;
        let text = 100 * angle / this.fullAngle + "%";
        if (angle !== 0 && w.config.plotOptions.pie.dataLabels.minAngleToShowLabel < sectorAngleArr[i]) {
          const formatter = w.config.dataLabels.formatter;
          if (formatter !== void 0) {
            text = formatter(w.globals.seriesPercent[i][0], {
              seriesIndex: i,
              w
            });
          }
          const foreColor = w.globals.dataLabels.style.colors[i];
          const elPieLabelWrap = graphics.group({
            class: `apexcharts-datalabels`
          });
          const elPieLabel = graphics.drawText({
            x: xPos,
            y: yPos,
            text,
            textAnchor: "middle",
            fontSize: w.config.dataLabels.style.fontSize,
            fontFamily: w.config.dataLabels.style.fontFamily,
            fontWeight: w.config.dataLabels.style.fontWeight,
            foreColor
          });
          elPieLabelWrap.add(elPieLabel);
          if (w.config.dataLabels.dropShadow.enabled) {
            const textShadow = w.config.dataLabels.dropShadow;
            filters.dropShadow(elPieLabel, textShadow);
          }
          elPieLabel.node.classList.add("apexcharts-pie-label");
          if (w.config.chart.animations.animate && w.globals.resized === false) {
            elPieLabel.node.classList.add("apexcharts-pie-label-delay");
            elPieLabel.node.style.animationDelay = w.config.chart.animations.speed / 940 + "s";
          }
          this.sliceLabels.push(elPieLabelWrap);
        }
      }
    }
    return g;
  }
  addListeners(elPath, dataLabels) {
    const graphics = new Graphics(this.w);
    elPath.node.addEventListener(
      "mouseenter",
      graphics.pathMouseEnter.bind(this, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      graphics.pathMouseLeave.bind(this, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      this.revertDataLabelsInner.bind(this, elPath.node, dataLabels)
    );
    elPath.node.addEventListener(
      "mousedown",
      graphics.pathMouseDown.bind(this, elPath)
    );
    if (!this.donutDataLabels.total.showAlways) {
      elPath.node.addEventListener(
        "mouseenter",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
      elPath.node.addEventListener(
        "mousedown",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
    }
  }
  // This function can be used for other circle charts too
  animatePaths(el, opts) {
    const w = this.w;
    const me = this;
    let angle = opts.endAngle < opts.startAngle ? this.fullAngle + opts.endAngle - opts.startAngle : opts.endAngle - opts.startAngle;
    let prevAngle = angle;
    let fromStartAngle = opts.startAngle;
    const toStartAngle = opts.startAngle;
    if (opts.prevStartAngle !== void 0 && opts.prevEndAngle !== void 0) {
      fromStartAngle = opts.prevEndAngle;
      prevAngle = opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle;
    }
    if (opts.i === w.config.series.length - 1) {
      if (angle + toStartAngle > this.fullAngle) {
        opts.endAngle = opts.endAngle - (angle + toStartAngle);
      } else if (angle + toStartAngle < this.fullAngle) {
        opts.endAngle = opts.endAngle + (this.fullAngle - (angle + toStartAngle));
      }
    }
    if (angle === this.fullAngle) angle = this.fullAngle - 0.01;
    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts);
  }
  animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts) {
    const me = this;
    const w = this.w;
    const animations = new Animations(this.w);
    const size = opts.size;
    let path;
    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle;
      prevAngle = angle;
      opts.dur = 0;
    }
    let currAngle = angle;
    let startAngle = toStartAngle;
    const fromAngle = fromStartAngle < toStartAngle ? this.fullAngle + fromStartAngle - toStartAngle : fromStartAngle - toStartAngle;
    if (w.globals.dataChanged && opts.shouldSetPrevPaths) {
      if (opts.prevEndAngle) {
        path = me.getPiePath({
          me,
          startAngle: opts.prevStartAngle,
          angle: opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle,
          size
        });
        el.attr({ d: path });
      }
    }
    if (opts.dur !== 0) {
      el.animate(opts.dur, opts.animBeginArr[opts.i]).after(function() {
        if (me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea") {
          this.animate(w.config.chart.animations.dynamicAnimation.speed).attr(
            {
              "stroke-width": me.strokeWidth
            }
          );
        }
        if (opts.i === w.config.series.length - 1) {
          animations.animationCompleted(el);
        }
      }).during((pos) => {
        currAngle = fromAngle + (angle - fromAngle) * pos;
        if (opts.animateStartingPos) {
          currAngle = prevAngle + (angle - prevAngle) * pos;
          startAngle = fromStartAngle - prevAngle + (toStartAngle - (fromStartAngle - prevAngle)) * pos;
        }
        path = me.getPiePath({
          me,
          startAngle,
          angle: currAngle,
          size
        });
        el.node.setAttribute("data:pathOrig", path);
        el.attr({
          d: path
        });
      });
    } else {
      path = me.getPiePath({
        me,
        startAngle,
        angle,
        size
      });
      if (!opts.isTrack) {
        w.globals.animationEnded = true;
      }
      el.node.setAttribute("data:pathOrig", path);
      el.attr({
        d: path,
        "stroke-width": me.strokeWidth
      });
    }
  }
  pieClicked(i) {
    const w = this.w;
    const me = this;
    const size = me.sliceSizes[i] + (w.config.plotOptions.pie.expandOnClick ? 4 : 0);
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${me.chartType.toLowerCase()}-slice-${i}`
    );
    if (elPath.attr("data:pieClicked") === "true") {
      elPath.attr({
        "data:pieClicked": "false"
      });
      this.revertDataLabelsInner(elPath.node, this.donutDataLabels);
      const origPath = elPath.attr("data:pathOrig");
      elPath.attr({
        d: origPath
      });
      return;
    } else {
      const allEls = w.dom.baseEl.getElementsByClassName(
        "apexcharts-pie-area"
      );
      Array.prototype.forEach.call(allEls, (pieSlice) => {
        pieSlice.setAttribute("data:pieClicked", "false");
        const origPath = pieSlice.getAttribute("data:pathOrig");
        if (origPath) {
          pieSlice.setAttribute("d", origPath);
        }
      });
      w.interact.capturedDataPointIndex = i;
      elPath.attr("data:pieClicked", "true");
    }
    const startAngle = parseInt(elPath.attr("data:startAngle"), 10);
    const angle = parseInt(elPath.attr("data:angle"), 10);
    const path = me.getPiePath({
      me,
      startAngle,
      angle,
      size
    });
    if (angle === 360) return;
    elPath.plot(path);
  }
  getChangedPath(prevStartAngle, prevEndAngle) {
    let path = "";
    if (this.dynamicAnim && this.w.globals.dataChanged) {
      path = this.getPiePath({
        me: this,
        startAngle: prevStartAngle,
        angle: prevEndAngle - prevStartAngle,
        size: this.size
      });
    }
    return path;
  }
  getPiePath({ me, startAngle, angle, size }) {
    let path;
    const graphics = new Graphics(this.w);
    const startDeg = startAngle;
    const startRadians = Math.PI * (startDeg - 90) / 180;
    let endDeg = angle + startAngle;
    if (Math.ceil(endDeg) >= this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle) {
      endDeg = this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle - 0.01;
    }
    if (Math.ceil(endDeg) > this.fullAngle) endDeg -= this.fullAngle;
    const endRadians = Math.PI * (endDeg - 90) / 180;
    const x1 = me.centerX + size * Math.cos(startRadians);
    const y1 = me.centerY + size * Math.sin(startRadians);
    const x2 = me.centerX + size * Math.cos(endRadians);
    const y2 = me.centerY + size * Math.sin(endRadians);
    const startInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      endDeg
    );
    const endInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      startDeg
    );
    const largeArc = angle > 180 ? 1 : 0;
    const pathBeginning = ["M", x1, y1, "A", size, size, 0, largeArc, 1, x2, y2];
    if (me.chartType === "donut") {
      path = [
        ...pathBeginning,
        "L",
        startInner.x,
        startInner.y,
        "A",
        me.donutSize,
        me.donutSize,
        0,
        largeArc,
        0,
        endInner.x,
        endInner.y,
        "L",
        x1,
        y1,
        "z"
      ].join(" ");
    } else if (me.chartType === "pie" || me.chartType === "polarArea") {
      path = [...pathBeginning, "L", me.centerX, me.centerY, "L", x1, y1].join(
        " "
      );
    } else {
      path = [...pathBeginning].join(" ");
    }
    return graphics.roundPathCorners(path, this.strokeWidth * 2);
  }
  drawPolarElements(parent) {
    const w = this.w;
    const scale = new Scales(this.w);
    const graphics = new Graphics(this.w);
    const helpers = new CircularChartsHelpers(this.w);
    const gCircles = graphics.group();
    const gYAxis = graphics.group();
    const yScale = scale.niceScale(0, Math.ceil(this.maxY), 0);
    const yTexts = yScale.result.reverse();
    const len = yScale.result.length;
    this.maxY = yScale.niceMax;
    let circleSize = w.globals.radialSize;
    const diff = circleSize / (len - 1);
    for (let i = 0; i < len - 1; i++) {
      const circle = graphics.drawCircle(circleSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: "none",
        "stroke-width": w.config.plotOptions.polarArea.rings.strokeWidth,
        stroke: w.config.plotOptions.polarArea.rings.strokeColor
      });
      if (w.config.yaxis[0].show) {
        const yLabel = helpers.drawYAxisTexts(
          this.centerX,
          this.centerY - circleSize + parseInt(w.config.yaxis[0].labels.style.fontSize, 10) / 2,
          i,
          yTexts[i]
        );
        gYAxis.add(yLabel);
      }
      gCircles.add(circle);
      circleSize = circleSize - diff;
    }
    this.drawSpokes(parent);
    parent.add(gCircles);
    parent.add(gYAxis);
  }
  renderInnerDataLabels(dataLabelsGroup, dataLabelsConfig, opts) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const showTotal = dataLabelsConfig.total.show;
    dataLabelsGroup.node.innerHTML = "";
    dataLabelsGroup.node.style.opacity = opts.opacity;
    const x = opts.centerX;
    const y = !this.donutDataLabels.total.label ? opts.centerY - opts.centerY / 6 : opts.centerY;
    let labelColor, valueColor;
    if (dataLabelsConfig.name.color === void 0) {
      labelColor = w.globals.colors[0];
    } else {
      labelColor = dataLabelsConfig.name.color;
    }
    let labelFontSize = dataLabelsConfig.name.fontSize;
    let labelFontFamily = dataLabelsConfig.name.fontFamily;
    let labelFontWeight = dataLabelsConfig.name.fontWeight;
    if (dataLabelsConfig.value.color === void 0) {
      valueColor = w.config.chart.foreColor;
    } else {
      valueColor = dataLabelsConfig.value.color;
    }
    const lbFormatter = dataLabelsConfig.value.formatter;
    let val = "";
    let name = "";
    if (showTotal) {
      labelColor = dataLabelsConfig.total.color;
      labelFontSize = dataLabelsConfig.total.fontSize;
      labelFontFamily = dataLabelsConfig.total.fontFamily;
      labelFontWeight = dataLabelsConfig.total.fontWeight;
      name = !this.donutDataLabels.total.label ? "" : dataLabelsConfig.total.label;
      val = dataLabelsConfig.total.formatter(w);
    } else {
      if (w.seriesData.series.length === 1) {
        val = lbFormatter(w.seriesData.series[0], w);
        name = w.seriesData.seriesNames[0];
      }
    }
    if (name) {
      name = dataLabelsConfig.name.formatter(
        name,
        dataLabelsConfig.total.show,
        w
      );
    }
    if (dataLabelsConfig.name.show) {
      const elLabel = graphics.drawText({
        x,
        y: y + parseFloat(dataLabelsConfig.name.offsetY),
        text: name,
        textAnchor: "middle",
        foreColor: labelColor,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily
      });
      elLabel.node.classList.add("apexcharts-datalabel-label");
      dataLabelsGroup.add(elLabel);
    }
    if (dataLabelsConfig.value.show) {
      const valOffset = dataLabelsConfig.name.show ? parseFloat(dataLabelsConfig.value.offsetY) + 16 : dataLabelsConfig.value.offsetY;
      const elValue = graphics.drawText({
        x,
        y: y + valOffset,
        text: val,
        textAnchor: "middle",
        foreColor: valueColor,
        fontWeight: dataLabelsConfig.value.fontWeight,
        fontSize: dataLabelsConfig.value.fontSize,
        fontFamily: dataLabelsConfig.value.fontFamily
      });
      elValue.node.classList.add("apexcharts-datalabel-value");
      dataLabelsGroup.add(elValue);
    }
    return dataLabelsGroup;
  }
  /**
   *
   * @param {string} name - The name of the series
   * @param {string} val - The value of that series
   * @param {object} el - Optional el (indicates which series was hovered/clicked). If this param is not present, means we need to show total
   */
  printInnerLabels(labelsConfig, name, val, el) {
    const w = this.w;
    let labelColor;
    if (el) {
      if (labelsConfig.name.color === void 0) {
        labelColor = w.globals.colors[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
      } else {
        labelColor = labelsConfig.name.color;
      }
    } else {
      if (w.seriesData.series.length > 1 && labelsConfig.total.show) {
        labelColor = labelsConfig.total.color;
      }
    }
    const elLabel = w.dom.baseEl.querySelector(
      ".apexcharts-datalabel-label"
    );
    const elValue = w.dom.baseEl.querySelector(
      ".apexcharts-datalabel-value"
    );
    const lbFormatter = labelsConfig.value.formatter;
    val = lbFormatter(val, w);
    if (!el && typeof labelsConfig.total.formatter === "function") {
      val = labelsConfig.total.formatter(w);
    }
    const isTotal = name === labelsConfig.total.label;
    name = !this.donutDataLabels.total.label ? "" : labelsConfig.name.formatter(name, isTotal, w);
    if (elLabel !== null) {
      elLabel.textContent = name;
    }
    if (elValue !== null) {
      elValue.textContent = val;
    }
    if (elLabel !== null) {
      elLabel.style.fill = labelColor;
    }
  }
  printDataLabelsInner(el, dataLabelsConfig) {
    const w = this.w;
    const val = el.getAttribute("data:value");
    const name = w.seriesData.seriesNames[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
    if (w.seriesData.series.length > 1) {
      this.printInnerLabels(dataLabelsConfig, name, val, el);
    }
    const dataLabelsGroup = w.dom.baseEl.querySelector(
      ".apexcharts-datalabels-group"
    );
    if (dataLabelsGroup !== null) {
      dataLabelsGroup.style.opacity = 1;
    }
  }
  drawSpokes(parent) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const spokeConfig = w.config.plotOptions.polarArea.spokes;
    if (spokeConfig.strokeWidth === 0) return;
    const spokes = [];
    const angleDivision = 360 / w.seriesData.series.length;
    for (let i = 0; i < w.seriesData.series.length; i++) {
      spokes.push(
        Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize,
          w.config.plotOptions.pie.startAngle + angleDivision * i
        )
      );
    }
    spokes.forEach((p, i) => {
      const line = graphics.drawLine(
        p.x,
        p.y,
        this.centerX,
        this.centerY,
        Array.isArray(spokeConfig.connectorColors) ? spokeConfig.connectorColors[i] : spokeConfig.connectorColors
      );
      parent.add(line);
    });
  }
  revertDataLabelsInner() {
    const w = this.w;
    if (this.donutDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      );
      const dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show
        }
      );
      const elPie = w.dom.Paper.findOne(
        ".apexcharts-radialbar, .apexcharts-pie"
      );
      elPie.add(dataLabels);
    }
  }
}
const Series = _core.__apex_Series;
class Radial extends Pie {
  constructor(w, ctx) {
    super(w, ctx);
    this.ctx = ctx;
    this.w = w;
    this.animBeginArr = [0];
    this.animDur = 0;
    this.startAngle = w.config.plotOptions.radialBar.startAngle;
    this.endAngle = w.config.plotOptions.radialBar.endAngle;
    this.totalAngle = Math.abs(
      w.config.plotOptions.radialBar.endAngle - w.config.plotOptions.radialBar.startAngle
    );
    this.trackStartAngle = w.config.plotOptions.radialBar.track.startAngle;
    this.trackEndAngle = w.config.plotOptions.radialBar.track.endAngle;
    this.barLabels = this.w.config.plotOptions.radialBar.barLabels;
    this.donutDataLabels = this.w.config.plotOptions.radialBar.dataLabels;
    this.radialDataLabels = this.donutDataLabels;
    if (!this.trackStartAngle) this.trackStartAngle = this.startAngle;
    if (!this.trackEndAngle) this.trackEndAngle = this.endAngle;
    if (this.endAngle === 360) this.endAngle = 359.99;
    this.margin = parseInt(w.config.plotOptions.radialBar.track.margin, 10);
    this.onBarLabelClick = this.onBarLabelClick.bind(this);
  }
  draw(series) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const ret = graphics.group({
      class: "apexcharts-radialbar"
    });
    if (w.globals.noData) return ret;
    const elSeries = graphics.group();
    const centerY = this.defaultSize / 2;
    const centerX = w.layout.gridWidth / 2;
    let size = this.defaultSize / 2.05;
    if (!w.config.chart.sparkline.enabled) {
      size = size - w.config.stroke.width - w.config.chart.dropShadow.blur;
    }
    const colorArr = w.globals.fill.colors;
    if (w.config.plotOptions.radialBar.track.show) {
      const elTracks = this.drawTracks({
        size,
        centerX,
        centerY,
        colorArr,
        series
      });
      elSeries.add(elTracks);
    }
    const elG = this.drawArcs({
      size,
      centerX,
      centerY,
      colorArr,
      series
    });
    let totalAngle = 360;
    if (w.config.plotOptions.radialBar.startAngle < 0) {
      totalAngle = this.totalAngle;
    }
    const angleRatio = (360 - totalAngle) / 360;
    w.globals.radialSize = size - size * angleRatio;
    if (this.radialDataLabels.value.show) {
      const offset = Math.max(
        this.radialDataLabels.value.offsetY,
        this.radialDataLabels.name.offsetY
      );
      w.globals.radialSize += offset * angleRatio;
    }
    elSeries.add(elG.g);
    if (w.config.plotOptions.radialBar.hollow.position === "front") {
      elG.g.add(elG.elHollow);
      if (elG.dataLabels) {
        elG.g.add(elG.dataLabels);
      }
    }
    ret.add(elSeries);
    return ret;
  }
  drawTracks(opts) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const g = graphics.group({
      class: "apexcharts-tracks"
    });
    const filters = new Filters(this.w);
    const fill = new Fill(this.w);
    const strokeWidth = this.getStrokeWidth(opts);
    opts.size = opts.size - strokeWidth / 2;
    for (let i = 0; i < opts.series.length; i++) {
      const elRadialBarTrack = graphics.group({
        class: "apexcharts-radialbar-track apexcharts-track"
      });
      g.add(elRadialBarTrack);
      elRadialBarTrack.attr({
        rel: i + 1
      });
      opts.size = opts.size - strokeWidth - this.margin;
      const trackConfig = w.config.plotOptions.radialBar.track;
      const pathFill = fill.fillPath({
        seriesNumber: 0,
        size: opts.size,
        fillColors: Array.isArray(trackConfig.background) ? trackConfig.background[i] : trackConfig.background,
        solid: true
      });
      const startAngle = this.trackStartAngle;
      let endAngle = this.trackEndAngle;
      if (Math.abs(endAngle) + Math.abs(startAngle) >= 360)
        endAngle = 360 - Math.abs(this.startAngle) - 0.1;
      const elPath = graphics.drawPath({
        d: "",
        stroke: pathFill,
        strokeWidth: strokeWidth * parseInt(trackConfig.strokeWidth, 10) / 100,
        fill: "none",
        strokeOpacity: trackConfig.opacity,
        classes: "apexcharts-radialbar-area"
      });
      if (trackConfig.dropShadow.enabled) {
        const shadow = trackConfig.dropShadow;
        filters.dropShadow(elPath, shadow);
      }
      elRadialBarTrack.add(elPath);
      elPath.attr("id", "apexcharts-radialbarTrack-" + i);
      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: 0,
        dur: 0,
        isTrack: true
      });
    }
    return g;
  }
  drawArcs(opts) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    const filters = new Filters(this.w);
    const g = graphics.group();
    const strokeWidth = this.getStrokeWidth(opts);
    opts.size = opts.size - strokeWidth / 2;
    let hollowFillID = w.config.plotOptions.radialBar.hollow.background;
    const hollowSize = opts.size - strokeWidth * opts.series.length - this.margin * opts.series.length - strokeWidth * parseInt(w.config.plotOptions.radialBar.track.strokeWidth, 10) / 100 / 2;
    const hollowRadius = hollowSize - w.config.plotOptions.radialBar.hollow.margin;
    if (w.config.plotOptions.radialBar.hollow.image !== void 0) {
      hollowFillID = this.drawHollowImage(opts, g, hollowSize, hollowFillID);
    }
    const elHollow = this.drawHollow({
      size: hollowRadius,
      centerX: opts.centerX,
      centerY: opts.centerY,
      fill: hollowFillID ? hollowFillID : "transparent"
    });
    if (w.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
      const shadow = w.config.plotOptions.radialBar.hollow.dropShadow;
      filters.dropShadow(elHollow, shadow);
    }
    let shown = 1;
    if (!this.radialDataLabels.total.show && w.seriesData.series.length > 1) {
      shown = 0;
    }
    let dataLabels = null;
    if (this.radialDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      );
      dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.radialDataLabels,
        {
          hollowSize,
          centerX: opts.centerX,
          centerY: opts.centerY,
          opacity: shown
        }
      );
    }
    if (w.config.plotOptions.radialBar.hollow.position === "back") {
      g.add(elHollow);
      if (dataLabels) {
        g.add(dataLabels);
      }
    }
    let reverseLoop = false;
    if (w.config.plotOptions.radialBar.inverseOrder) {
      reverseLoop = true;
    }
    for (let i = reverseLoop ? opts.series.length - 1 : 0; reverseLoop ? i >= 0 : i < opts.series.length; reverseLoop ? i-- : i++) {
      const elRadialBarArc = graphics.group({
        class: `apexcharts-series apexcharts-radial-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i])
      });
      g.add(elRadialBarArc);
      elRadialBarArc.attr({
        rel: i + 1,
        "data:realIndex": i
      });
      Series.addCollapsedClassToSeries(this.w, elRadialBarArc, i);
      opts.size = opts.size - strokeWidth - this.margin;
      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: opts.size,
        value: opts.series[i]
      });
      const startAngle = this.startAngle;
      let prevStartAngle;
      const dataValue = Utils.negToZero(opts.series[i] > 100 ? 100 : opts.series[i]) / 100;
      let endAngle = Math.round(this.totalAngle * dataValue) + this.startAngle;
      let prevEndAngle;
      if (w.globals.dataChanged) {
        prevStartAngle = this.startAngle;
        prevEndAngle = Math.round(
          this.totalAngle * Utils.negToZero(w.globals.previousPaths[i]) / 100
        ) + prevStartAngle;
      }
      const currFullAngle = Math.abs(endAngle) + Math.abs(startAngle);
      if (currFullAngle > 360) {
        endAngle = endAngle - 0.01;
      }
      const prevFullAngle = Math.abs(prevEndAngle) + Math.abs(prevStartAngle);
      if (prevFullAngle > 360) {
        prevEndAngle = prevEndAngle - 0.01;
      }
      const angle = endAngle - startAngle;
      const dashArray = Array.isArray(w.config.stroke.dashArray) ? w.config.stroke.dashArray[i] : w.config.stroke.dashArray;
      const elPath = graphics.drawPath({
        d: "",
        stroke: pathFill,
        strokeWidth,
        fill: "none",
        fillOpacity: w.config.fill.opacity,
        classes: "apexcharts-radialbar-area apexcharts-radialbar-slice-" + i,
        strokeDashArray: dashArray
      });
      const radialMidAngle = startAngle + angle / 2;
      const radialArcCenter = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        opts.size,
        radialMidAngle
      );
      Graphics.setAttrs(elPath.node, {
        "data:angle": angle,
        "data:value": opts.series[i],
        "data:cx": radialArcCenter.x,
        "data:cy": radialArcCenter.y
      });
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        filters.dropShadow(elPath, shadow, i);
      }
      filters.setSelectionFilter(elPath, 0, i);
      this.addListeners(elPath, this.radialDataLabels);
      elRadialBarArc.add(elPath);
      elPath.attr({
        index: 0,
        j: i
      });
      if (this.barLabels.enabled) {
        const barStartCords = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          opts.size,
          startAngle
        );
        const text = this.barLabels.formatter(w.seriesData.seriesNames[i], {
          seriesIndex: i,
          w
        });
        const classes = ["apexcharts-radialbar-label"];
        if (!this.barLabels.onClick) {
          classes.push("apexcharts-no-click");
        }
        let textColor = this.barLabels.useSeriesColors ? w.globals.colors[i] : w.config.chart.foreColor;
        if (!textColor) {
          textColor = w.config.chart.foreColor;
        }
        const x = barStartCords.x + this.barLabels.offsetX;
        const y = barStartCords.y + this.barLabels.offsetY;
        const elText = graphics.drawText({
          x,
          y,
          text,
          textAnchor: "end",
          dominantBaseline: "middle",
          fontFamily: this.barLabels.fontFamily,
          fontWeight: this.barLabels.fontWeight,
          fontSize: this.barLabels.fontSize,
          foreColor: textColor,
          cssClass: classes.join(" ")
        });
        elText.on("click", this.onBarLabelClick);
        elText.attr({
          rel: i + 1
        });
        if (startAngle !== 0) {
          elText.attr({
            "transform-origin": `${x} ${y}`,
            transform: `rotate(${startAngle} 0 0)`
          });
        }
        elRadialBarArc.add(elText);
      }
      let dur = 0;
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = w.config.chart.animations.speed;
      }
      if (w.globals.dataChanged) {
        dur = w.config.chart.animations.dynamicAnimation.speed;
      }
      this.animDur = dur / (opts.series.length * 1.2) + this.animDur;
      this.animBeginArr.push(this.animDur);
      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        prevEndAngle,
        prevStartAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: this.animBeginArr,
        dur,
        shouldSetPrevPaths: true
      });
    }
    return {
      g,
      elHollow,
      dataLabels
    };
  }
  drawHollow(opts) {
    const graphics = new Graphics(this.w);
    const circle = graphics.drawCircle(opts.size * 2);
    circle.attr({
      class: "apexcharts-radialbar-hollow",
      cx: opts.centerX,
      cy: opts.centerY,
      r: opts.size,
      fill: opts.fill
    });
    return circle;
  }
  drawHollowImage(opts, g, hollowSize, hollowFillID) {
    const w = this.w;
    const fill = new Fill(this.w);
    const randID = Utils.randomId();
    const hollowFillImg = w.config.plotOptions.radialBar.hollow.image;
    if (w.config.plotOptions.radialBar.hollow.imageClipped) {
      fill.clippedImgArea({
        width: hollowSize,
        height: hollowSize,
        image: hollowFillImg,
        patternID: `pattern${w.globals.cuid}${randID}`
      });
      hollowFillID = `url(#pattern${w.globals.cuid}${randID})`;
    } else {
      const imgWidth = w.config.plotOptions.radialBar.hollow.imageWidth;
      const imgHeight = w.config.plotOptions.radialBar.hollow.imageHeight;
      if (imgWidth === void 0 && imgHeight === void 0) {
        const image = w.dom.Paper.image(hollowFillImg, function(loader) {
          this.move(
            opts.centerX - loader.width / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetX,
            opts.centerY - loader.height / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetY
          );
        });
        g.add(image);
      } else {
        const image = w.dom.Paper.image(hollowFillImg, function() {
          this.move(
            opts.centerX - imgWidth / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetX,
            opts.centerY - imgHeight / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetY
          );
          this.size(imgWidth, imgHeight);
        });
        g.add(image);
      }
    }
    return hollowFillID;
  }
  getStrokeWidth(opts) {
    const w = this.w;
    return opts.size * (100 - parseInt(w.config.plotOptions.radialBar.hollow.size, 10)) / 100 / (opts.series.length + 1) - this.margin;
  }
  onBarLabelClick(e) {
    const seriesIndex = parseInt(e.target.getAttribute("rel"), 10) - 1;
    const legendClick = this.barLabels.onClick;
    const w = this.w;
    if (legendClick) {
      legendClick(w.seriesData.seriesNames[seriesIndex], { w, seriesIndex });
    }
  }
}
_core__default.use({
  radialBar: Radial
});
export {
  default2 as default
};
