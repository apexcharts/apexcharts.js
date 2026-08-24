// @ts-check
/**
 * The ONE list of modules that core bundles and re-exports under `__apex_*`
 * names, plus the Rollup plugin that rewires a sub-entry's relative imports to
 * pick them up from core instead of bundling a second copy.
 *
 * This map and the `__apex_*` exports in `src/entries/core.js` are two halves
 * of one contract: a name here that core does not export produces `undefined`
 * at runtime, and only a real `npm run build` catches it. Change them together.
 *
 * Two consumers, one list:
 *   - `target: 'core'`   sub-entry ESM/CJS. Shared modules resolve to the
 *                        external `apexcharts/core` module.
 *   - `target: 'global'` sub-entry UMD (the CDN add-on channel). Shared modules
 *                        resolve off `globalThis.ApexCharts.__internals`, which
 *                        the full UMD bundle attaches. Nothing is imported, so
 *                        the add-on layers onto whichever apexcharts.js the page
 *                        already loaded rather than duplicating it.
 *
 * @module build/shared-modules
 */
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const __dirname = rootDir

/** Absolute path of the core class every sub-entry must share, never inline. */
export const CORE_SOURCE_PATH = resolve(rootDir, 'src/apexcharts.js')

/** The bare specifier sub-entry ESM/CJS builds treat as external. */
export const CORE_EXTERNAL_ID = 'apexcharts/core'

/**
 * The global a UMD add-on reads its shared modules from. Attached by
 * `src/entries/full.js`; see the note there before renaming it.
 */
export const GLOBAL_INTERNALS = 'globalThis.ApexCharts.__internals'

/**
 * Absolute source path -> shim descriptor.
 *   { default: '__apex_X' }                  -> export default
 *   { named: { Local: '__apex_Local', ... } } -> named re-exports
 *   both keys                                 -> both
 */
export const sharedModules = {
    [resolve(__dirname, 'src/charts/Scatter.js')]:
      { default: '__apex_charts_Scatter' },
    [resolve(__dirname, 'src/modules/Animations.js')]:
      { default: '__apex_Animations', named: { computeStagger: '__apex_Animations_computeStagger', applyAnimationPolicy: '__apex_Animations_applyAnimationPolicy', prefersReducedMotion: '__apex_Animations_prefersReducedMotion', applyProgressiveReveal: '__apex_Animations_applyProgressiveReveal' } },
    [resolve(__dirname, 'src/modules/Base.js')]:
      { default: '__apex_Base' },
    [resolve(__dirname, 'src/modules/ChartFactory.js')]:
      { named: { register: '__apex_ChartFactory_register', getChartClass: '__apex_ChartFactory_getChartClass', isCustom: '__apex_ChartFactory_isCustom' } },
    [resolve(__dirname, 'src/modules/Core.js')]:
      { default: '__apex_Core' },
    [resolve(__dirname, 'src/modules/CoreUtils.js')]:
      { default: '__apex_CoreUtils' },
    [resolve(__dirname, 'src/modules/Crosshairs.js')]:
      { default: '__apex_Crosshairs' },
    [resolve(__dirname, 'src/modules/Data.js')]:
      { default: '__apex_Data' },
    [resolve(__dirname, 'src/modules/DataLabels.js')]:
      { default: '__apex_DataLabels' },
    [resolve(__dirname, 'src/modules/Events.js')]:
      { default: '__apex_Events' },
    [resolve(__dirname, 'src/modules/Fill.js')]:
      { default: '__apex_Fill' },
    [resolve(__dirname, 'src/modules/Filters.js')]:
      { default: '__apex_Filters' },
    [resolve(__dirname, 'src/modules/Formatters.js')]:
      { default: '__apex_Formatters' },
    [resolve(__dirname, 'src/modules/Graphics.js')]:
      { default: '__apex_Graphics' },
    [resolve(__dirname, 'src/modules/Markers.js')]:
      { default: '__apex_Markers' },
    [resolve(__dirname, 'src/modules/Range.js')]:
      { default: '__apex_Range' },
    [resolve(__dirname, 'src/modules/Responsive.js')]:
      { default: '__apex_Responsive' },
    [resolve(__dirname, 'src/modules/Scales.js')]:
      { default: '__apex_Scales' },
    [resolve(__dirname, 'src/modules/Series.js')]:
      { default: '__apex_Series' },
    [resolve(__dirname, 'src/modules/Theme.js')]:
      { default: '__apex_Theme' },
    [resolve(__dirname, 'src/modules/TimeScale.js')]:
      { default: '__apex_TimeScale' },
    [resolve(__dirname, 'src/modules/TitleSubtitle.js')]:
      { default: '__apex_TitleSubtitle' },
    [resolve(__dirname, 'src/modules/axes/Axes.js')]:
      { default: '__apex_axes_Axes' },
    [resolve(__dirname, 'src/modules/axes/AxesUtils.js')]:
      { default: '__apex_axes_AxesUtils' },
    [resolve(__dirname, 'src/modules/axes/Grid.js')]:
      { default: '__apex_axes_Grid' },
    [resolve(__dirname, 'src/modules/axes/XAxis.js')]:
      { default: '__apex_axes_XAxis' },
    [resolve(__dirname, 'src/modules/axes/YAxis.js')]:
      { default: '__apex_axes_YAxis' },
    [resolve(__dirname, 'src/modules/dimensions/Dimensions.js')]:
      { default: '__apex_dimensions_Dimensions' },
    [resolve(__dirname, 'src/modules/dimensions/Grid.js')]:
      { default: '__apex_dimensions_Grid' },
    [resolve(__dirname, 'src/modules/dimensions/Helpers.js')]:
      { default: '__apex_dimensions_Helpers' },
    [resolve(__dirname, 'src/modules/dimensions/XAxis.js')]:
      { default: '__apex_dimensions_XAxis' },
    [resolve(__dirname, 'src/modules/dimensions/YAxis.js')]:
      { default: '__apex_dimensions_YAxis' },
    [resolve(__dirname, 'src/modules/helpers/Destroy.js')]:
      { default: '__apex_helpers_Destroy' },
    [resolve(__dirname, 'src/modules/helpers/InitCtxVariables.js')]:
      { default: '__apex_helpers_InitCtxVariables' },
    [resolve(__dirname, 'src/modules/helpers/Localization.js')]:
      { default: '__apex_helpers_Localization' },
    [resolve(__dirname, 'src/modules/helpers/UpdateHelpers.js')]:
      { default: '__apex_helpers_UpdateHelpers' },
    [resolve(__dirname, 'src/modules/settings/Config.js')]:
      { default: '__apex_Config' },
    [resolve(__dirname, 'src/modules/settings/Defaults.js')]:
      { default: '__apex_Defaults' },
    [resolve(__dirname, 'src/modules/settings/Globals.js')]:
      { default: '__apex_Globals' },
    [resolve(__dirname, 'src/modules/settings/Options.js')]:
      { default: '__apex_Options' },
    [resolve(__dirname, 'src/modules/tooltip/AxesTooltip.js')]:
      { default: '__apex_tooltip_AxesTooltip' },
    [resolve(__dirname, 'src/modules/tooltip/Intersect.js')]:
      { default: '__apex_tooltip_Intersect' },
    [resolve(__dirname, 'src/modules/tooltip/Labels.js')]:
      { default: '__apex_tooltip_Labels' },
    [resolve(__dirname, 'src/modules/tooltip/Marker.js')]:
      { default: '__apex_tooltip_Marker' },
    [resolve(__dirname, 'src/modules/tooltip/Position.js')]:
      { default: '__apex_tooltip_Position' },
    [resolve(__dirname, 'src/modules/tooltip/Tooltip.js')]:
      { default: '__apex_tooltip_Tooltip' },
    [resolve(__dirname, 'src/modules/tooltip/Utils.js')]:
      { default: '__apex_tooltip_Utils' },
    [resolve(__dirname, 'src/ssr/BrowserAPIs.js')]:
      { named: { BrowserAPIs: '__apex_BrowserAPIs_BrowserAPIs' } },
    [resolve(__dirname, 'src/ssr/DOMShim.js')]:
      { named: { SSRDOMShim: '__apex_DOMShim_SSRDOMShim', SSRElement: '__apex_DOMShim_SSRElement', SSRClassList: '__apex_DOMShim_SSRClassList' } },
    [resolve(__dirname, 'src/svg/PathMorphing.js')]:
      { named: { parsePath: '__apex_PathMorphing_parsePath', morphPaths: '__apex_PathMorphing_morphPaths', pathBbox: '__apex_PathMorphing_pathBbox', arrayToPath: '__apex_PathMorphing_arrayToPath' } },
    [resolve(__dirname, 'src/svg/SVGAnimation.js')]:
      { named: { SVGAnimationRunner: '__apex_SVGAnimation_SVGAnimationRunner', installAnimationMethods: '__apex_SVGAnimation_installAnimationMethods' } },
    [resolve(__dirname, 'src/svg/SVGContainer.js')]:
      { default: '__apex_SVGContainer' },
    [resolve(__dirname, 'src/svg/SVGDraggable.js')]:
      { named: { installDraggable: '__apex_SVGDraggable_installDraggable' } },
    [resolve(__dirname, 'src/svg/SVGElement.js')]:
      { default: '__apex_SVGElement' },
    [resolve(__dirname, 'src/svg/SVGFilter.js')]:
      { named: { SVGFilter: '__apex_SVGFilter_SVGFilter', FilterBuilder: '__apex_SVGFilter_FilterBuilder', installFilterMethods: '__apex_SVGFilter_installFilterMethods' } },
    [resolve(__dirname, 'src/svg/SVGGradient.js')]:
      { named: { SVGGradient: '__apex_SVGGradient_SVGGradient' } },
    [resolve(__dirname, 'src/svg/SVGPattern.js')]:
      { named: { SVGPattern: '__apex_SVGPattern_SVGPattern' } },
    [resolve(__dirname, 'src/svg/SVGSelectable.js')]:
      { named: { installSelectable: '__apex_SVGSelectable_installSelectable' } },
    [resolve(__dirname, 'src/svg/index.js')]:
      { named: { SVG: '__apex_index_SVG', Box: '__apex_index_Box' } },
    [resolve(__dirname, 'src/svg/math.js')]:
      { named: { SVGNS: '__apex_math_SVGNS', Point: '__apex_math_Point', Matrix: '__apex_math_Matrix', Box: '__apex_math_Box' } },
    [resolve(__dirname, 'src/utils/Constants.js')]:
      { named: { LINE_HEIGHT_RATIO: '__apex_Constants_LINE_HEIGHT_RATIO', NICE_SCALE_ALLOWED_MAG_MSD: '__apex_Constants_NICE_SCALE_ALLOWED_MAG_MSD', NICE_SCALE_DEFAULT_TICKS: '__apex_Constants_NICE_SCALE_DEFAULT_TICKS' } },
    [resolve(__dirname, 'src/utils/DateTime.js')]:
      { default: '__apex_DateTime' },
    [resolve(__dirname, 'src/utils/Environment.js')]:
      { named: { Environment: '__apex_Environment_Environment' } },
    [resolve(__dirname, 'src/utils/PerformanceCache.js')]:
      { default: '__apex_PerformanceCache' },
    [resolve(__dirname, 'src/utils/Resize.js')]:
      { named: { addResizeListener: '__apex_Resize_addResizeListener', removeResizeListener: '__apex_Resize_removeResizeListener' } },
    [resolve(__dirname, 'src/utils/ThemePalettes.js')]:
      { named: { getThemePalettes: '__apex_ThemePalettes_getThemePalettes' } },
    [resolve(__dirname, 'src/utils/Utils.js')]:
      { default: '__apex_Utils' },
}

const VIRTUAL_PREFIX = '\0apex-shared:'

/**
 * Intercept `src/apexcharts.js` and every shared module, redirecting them to
 * core. Must run 'pre' so it beats Vite's own resolver to relative imports.
 *
 * @param {{ target?: 'core' | 'global' }} [opts]
 */
export function coreExternalPlugin({ target = 'core' } = {}) {
  const toGlobal = target === 'global'
  return {
    name: 'apex-core-external',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === CORE_EXTERNAL_ID) {
        return toGlobal
          ? VIRTUAL_PREFIX + CORE_SOURCE_PATH
          : { id: CORE_EXTERNAL_ID, external: true }
      }
      if (!importer) return null
      if (!source.startsWith('.')) return null
      const abs = resolve(dirname(importer), source)
      const normalized = abs.endsWith('.js') ? abs : abs + '.js'
      if (normalized === CORE_SOURCE_PATH) {
        return toGlobal
          ? VIRTUAL_PREFIX + CORE_SOURCE_PATH
          : { id: CORE_EXTERNAL_ID, external: true }
      }
      if (sharedModules[normalized]) {
        return VIRTUAL_PREFIX + normalized
      }
      return null
    },
    load(id) {
      if (!id.startsWith(VIRTUAL_PREFIX)) return null
      const absPath = id.slice(VIRTUAL_PREFIX.length)

      // The core class itself: the UMD global IS the class.
      if (absPath === CORE_SOURCE_PATH) {
        return toGlobal
          ? 'export default globalThis.ApexCharts;'
          : `import _core from '${CORE_EXTERNAL_ID}';\nexport default _core;`
      }

      const desc = sharedModules[absPath]
      const lines = toGlobal
        ? [`const _core = ${GLOBAL_INTERNALS};`]
        : [`import * as _core from '${CORE_EXTERNAL_ID}';`]
      if (desc.default) {
        lines.push(`export default _core.${desc.default};`)
      }
      if (desc.named) {
        for (const [local, coreExport] of Object.entries(desc.named)) {
          lines.push(`export const ${local} = _core.${coreExport};`)
        }
      }
      return lines.join('\n')
    },
  }
}
