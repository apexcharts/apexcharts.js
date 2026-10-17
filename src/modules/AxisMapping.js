// @ts-check
/**
 * Single source of truth for the numeric/datetime x-axis pixel<->data mapping.
 *
 * A bar's center is laid out at `(x - minX) / xRatio` pixels measured from the
 * PLOT ORIGIN (the `.apexcharts-inner` group's left edge, i.e.
 * `w.layout.translateX`), where `xRatio = (maxX - minX) / gridWidth`. Three
 * facts define this mapping and every consumer must honor all three:
 *
 *   1. The origin is `minX` (`w.globals.minX`), NOT the axis scale's `niceMin`.
 *      `xRatio` is derived from `minX..maxX`, so any other origin desyncs the
 *      scale from the offset.
 *   2. The reference edge is the plot origin (`translateX`), NOT the
 *      `.apexcharts-grid` element's bounding box. On a numeric bar chart the
 *      grid element extends `barPadForNumericAxis` to the LEFT of the plot
 *      origin (its gridlines/border are drawn out to `-barPad` so edge bars are
 *      not clipped), so measuring from the grid box lands half a bar off.
 *   3. `barPadForNumericAxis` is cosmetic grid padding ONLY. It never enters the
 *      data<->pixel scale. Historically the brush paths subtracted it while the
 *      layout did not, so a brushed range came back shifted by half a bar.
 *
 * Bar placement, the preselected selection rect, and the brush/selection
 * read-back all route through here so the drawn geometry and the reported range
 * are computed by ONE formula and cannot drift apart again.
 *
 * "px" throughout is a distance in the plot-origin coordinate space (the same
 * space the series `<g transform="translate(translateX, translateY)">` and the
 * selection rect's transform live in), so a value produced by
 * {@link AxisMapping.dataXToPx} can be used directly as an SVG `x` attribute and
 * a value fed to {@link AxisMapping.pxToDataX} is what
 * {@link AxisMapping.screenXToPlotPx} returns.
 *
 * @module modules/AxisMapping
 */
export default class AxisMapping {
  /**
   * Pixels per data-unit on the x-axis. Derived from `minX..maxX` so it is the
   * exact inverse used by both {@link dataXToPx} and {@link pxToDataX}.
   * @param {import('../types/internal').ChartStateW} w
   * @returns {number}
   */
  static xRatio(w) {
    const gw = w.layout.gridWidth || 1
    return (w.globals.maxX - w.globals.minX) / gw
  }

  /**
   * Data-x -> pixels from the plot origin (usable as an SVG `x` attribute).
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} dataX
   * @returns {number}
   */
  static dataXToPx(w, dataX) {
    return (dataX - w.globals.minX) / AxisMapping.xRatio(w)
  }

  /**
   * Pixels from the plot origin -> data-x. Feed it `screenX - svgLeft - translateX`.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} px
   * @returns {number}
   */
  static pxToDataX(w, px) {
    return w.globals.minX + px * AxisMapping.xRatio(w)
  }

  /**
   * The plot area on screen, in client px: its corner is where the plot's
   * group is translated to (translateX, translateY into the svg), and it is
   * gridWidth by gridHeight. The one screen-to-plot measurement: the tooltip,
   * zoom, selection and every other pointer reader map through it, so x and y
   * cannot disagree under CSS zoom.
   *
   * Never the `.apexcharts-grid` group's box: a group measures to the union
   * of what it happens to draw (fact 2 above). The plot's outline starts a
   * pixel down (`Grid.drawGridArea`), so unless gridlines or row bands reach
   * the top edge the box starts a pixel below the plot, and on a numeric-x bar
   * chart the horizontal gridlines run `barPadForNumericAxis` out past both
   * sides.
   *
   * `zoom` is the CSS zoom of any container the chart sits in (screen px per
   * plot px): the measured svg width over `svgWidth`, the unscaled width it
   * was drawn at. A distance measured on screen from this corner is divided
   * by it to land in plot px, the space the series are laid out and painted in.
   * With nothing mounted to measure, screen px are taken as svg px.
   *
   * @param {import('../types/internal').ChartStateW} w
   * @returns {{ left: number, top: number, width: number, height: number, zoom: number }}
   */
  static plotRect(w) {
    const svg =
      w.dom.Paper?.node || w.dom.baseEl?.querySelector('.apexcharts-svg')
    const box = (svg || w.dom.elWrap)?.getBoundingClientRect() || {
      left: 0,
      top: 0,
      width: 0,
    }
    const zoom =
      (svg && w.globals.svgWidth ? box.width / w.globals.svgWidth : 1) || 1
    return {
      left: box.left + w.layout.translateX * zoom,
      top: box.top + w.layout.translateY * zoom,
      width: w.layout.gridWidth * zoom,
      height: w.layout.gridHeight * zoom,
      zoom,
    }
  }

  /**
   * Client (screen) x -> pixels from the plot origin of {@link plotRect}.
   * Pass the rect when the caller has already measured it.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} screenX
   * @param {{ left: number, zoom: number }} [plot]
   * @returns {number}
   */
  static screenXToPlotPx(w, screenX, plot = AxisMapping.plotRect(w)) {
    return (screenX - plot.left) / plot.zoom
  }
}
