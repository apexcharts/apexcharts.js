// @ts-check
/**
 * ApexCharts — core entry point.
 *
 * Exports the base ApexCharts class with NO chart types and NO optional
 * feature modules registered. Use this as the starting point for custom
 * minimal bundles:
 *
 *   import ApexCharts from 'apexcharts/core'
 *   import 'apexcharts/line'                  // line/area/scatter chart types
 *   import 'apexcharts/features/legend'       // legend (optional)
 *   // Omit features you don't need — they won't be included in your bundle.
 *   // Note: tooltip is always included as part of core.
 *
 * The __apex_* named exports below are internal — they allow chart-type
 * sub-entries (line.esm.js, bar.esm.js, etc.) to import shared utilities
 * from this bundle rather than bundling their own copies, avoiding duplication.
 * Do not rely on these exports in application code; they may change.
 */
export { default } from '../apexcharts'

// Shared utilities re-exported for sub-entry de-duplication (internal use only)
export { default as __apex_charts_Scatter } from '../charts/Scatter.js'
export { default as __apex_Animations } from '../modules/Animations.js'
export {
  computeStagger as __apex_Animations_computeStagger,
  applyAnimationPolicy as __apex_Animations_applyAnimationPolicy,
  prefersReducedMotion as __apex_Animations_prefersReducedMotion,
  applyProgressiveReveal as __apex_Animations_applyProgressiveReveal,
} from '../modules/Animations.js'
export { default as __apex_Base } from '../modules/Base.js'
export { register as __apex_ChartFactory_register, getChartClass as __apex_ChartFactory_getChartClass } from '../modules/ChartFactory.js'
export { default as __apex_Core } from '../modules/Core.js'
export { default as __apex_CoreUtils } from '../modules/CoreUtils.js'
export { default as __apex_Crosshairs } from '../modules/Crosshairs.js'
export { default as __apex_Data } from '../modules/Data.js'
export { default as __apex_DataLabels } from '../modules/DataLabels.js'
export { default as __apex_Events } from '../modules/Events.js'
export { default as __apex_Fill } from '../modules/Fill.js'
export { default as __apex_Filters } from '../modules/Filters.js'
export { default as __apex_Formatters } from '../modules/Formatters.js'
export { default as __apex_Graphics } from '../modules/Graphics.js'
export { default as __apex_Markers } from '../modules/Markers.js'
export { default as __apex_Range } from '../modules/Range.js'
export { default as __apex_Responsive } from '../modules/Responsive.js'
export { default as __apex_Scales } from '../modules/Scales.js'
export { default as __apex_Series } from '../modules/Series.js'
export { default as __apex_Theme } from '../modules/Theme.js'
export { default as __apex_TimeScale } from '../modules/TimeScale.js'
export { default as __apex_TitleSubtitle } from '../modules/TitleSubtitle.js'
export { default as __apex_axes_Axes } from '../modules/axes/Axes.js'
export { default as __apex_axes_AxesUtils } from '../modules/axes/AxesUtils.js'
export { default as __apex_axes_Grid } from '../modules/axes/Grid.js'
export { default as __apex_axes_XAxis } from '../modules/axes/XAxis.js'
export { default as __apex_axes_YAxis } from '../modules/axes/YAxis.js'
export { default as __apex_dimensions_Dimensions } from '../modules/dimensions/Dimensions.js'
export { default as __apex_dimensions_Grid } from '../modules/dimensions/Grid.js'
export { default as __apex_dimensions_Helpers } from '../modules/dimensions/Helpers.js'
export { default as __apex_dimensions_XAxis } from '../modules/dimensions/XAxis.js'
export { default as __apex_dimensions_YAxis } from '../modules/dimensions/YAxis.js'
export { default as __apex_helpers_Destroy } from '../modules/helpers/Destroy.js'
export { default as __apex_helpers_InitCtxVariables } from '../modules/helpers/InitCtxVariables.js'
export { default as __apex_helpers_Localization } from '../modules/helpers/Localization.js'
export { default as __apex_helpers_UpdateHelpers } from '../modules/helpers/UpdateHelpers.js'
export { default as __apex_Config } from '../modules/settings/Config.js'
export { default as __apex_Defaults } from '../modules/settings/Defaults.js'
export { default as __apex_Globals } from '../modules/settings/Globals.js'
export { default as __apex_Options } from '../modules/settings/Options.js'
export { default as __apex_tooltip_AxesTooltip } from '../modules/tooltip/AxesTooltip.js'
export { default as __apex_tooltip_Intersect } from '../modules/tooltip/Intersect.js'
export { default as __apex_tooltip_Labels } from '../modules/tooltip/Labels.js'
export { default as __apex_tooltip_Marker } from '../modules/tooltip/Marker.js'
export { default as __apex_tooltip_Position } from '../modules/tooltip/Position.js'
export { default as __apex_tooltip_Tooltip } from '../modules/tooltip/Tooltip.js'
export { default as __apex_tooltip_Utils } from '../modules/tooltip/Utils.js'
export { BrowserAPIs as __apex_BrowserAPIs_BrowserAPIs } from '../ssr/BrowserAPIs.js'
export { SSRDOMShim as __apex_DOMShim_SSRDOMShim, SSRElement as __apex_DOMShim_SSRElement, SSRClassList as __apex_DOMShim_SSRClassList } from '../ssr/DOMShim.js'
export { parsePath as __apex_PathMorphing_parsePath, morphPaths as __apex_PathMorphing_morphPaths, pathBbox as __apex_PathMorphing_pathBbox, arrayToPath as __apex_PathMorphing_arrayToPath } from '../svg/PathMorphing.js'
export { SVGAnimationRunner as __apex_SVGAnimation_SVGAnimationRunner, installAnimationMethods as __apex_SVGAnimation_installAnimationMethods } from '../svg/SVGAnimation.js'
export { default as __apex_SVGContainer } from '../svg/SVGContainer.js'
export { installDraggable as __apex_SVGDraggable_installDraggable } from '../svg/SVGDraggable.js'
export { default as __apex_SVGElement } from '../svg/SVGElement.js'
export { SVGFilter as __apex_SVGFilter_SVGFilter, FilterBuilder as __apex_SVGFilter_FilterBuilder, installFilterMethods as __apex_SVGFilter_installFilterMethods } from '../svg/SVGFilter.js'
export { SVGGradient as __apex_SVGGradient_SVGGradient } from '../svg/SVGGradient.js'
export { SVGPattern as __apex_SVGPattern_SVGPattern } from '../svg/SVGPattern.js'
export { installSelectable as __apex_SVGSelectable_installSelectable } from '../svg/SVGSelectable.js'
export { SVG as __apex_index_SVG, Box as __apex_index_Box } from '../svg/index.js'
export { SVGNS as __apex_math_SVGNS, Point as __apex_math_Point, Matrix as __apex_math_Matrix, Box as __apex_math_Box } from '../svg/math.js'
export { LINE_HEIGHT_RATIO as __apex_Constants_LINE_HEIGHT_RATIO, NICE_SCALE_ALLOWED_MAG_MSD as __apex_Constants_NICE_SCALE_ALLOWED_MAG_MSD, NICE_SCALE_DEFAULT_TICKS as __apex_Constants_NICE_SCALE_DEFAULT_TICKS } from '../utils/Constants.js'
export { default as __apex_DateTime } from '../utils/DateTime.js'
export { Environment as __apex_Environment_Environment } from '../utils/Environment.js'
export { default as __apex_PerformanceCache } from '../utils/PerformanceCache.js'
export { addResizeListener as __apex_Resize_addResizeListener, removeResizeListener as __apex_Resize_removeResizeListener } from '../utils/Resize.js'
export { getThemePalettes as __apex_ThemePalettes_getThemePalettes } from '../utils/ThemePalettes.js'
export { default as __apex_Utils } from '../utils/Utils.js'
