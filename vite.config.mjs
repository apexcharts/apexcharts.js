import { defineConfig } from 'vite'
import { resolve, join, basename, dirname } from 'path'
import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
} from 'fs'
import { fileURLToPath } from 'url'
import terser from '@rollup/plugin-terser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version
const year = new Date().getFullYear()

const banner = `/*!
 * ApexCharts v${version}
 * (c) 2018-${year} ApexCharts
 */`

// Sub-entry names and their source files (excludes the full bundle / index).
// Each value is either a file path string (output goes to dist/) or an object
// { file, outDir } where outDir is relative to dist/ (e.g. 'features').
export const SUB_ENTRIES = {
  core: resolve(__dirname, 'src/entries/core.js'),
  // Primary entries
  line: resolve(__dirname, 'src/entries/line.js'),
  bar: resolve(__dirname, 'src/entries/bar.js'),
  candlestick: resolve(__dirname, 'src/entries/candlestick.js'),
  pie: resolve(__dirname, 'src/entries/pie.js'),
  radialBar: resolve(__dirname, 'src/entries/radialBar.js'),
  radar: resolve(__dirname, 'src/entries/radar.js'),
  heatmap: resolve(__dirname, 'src/entries/heatmap.js'),
  treemap: resolve(__dirname, 'src/entries/treemap.js'),
  // Alias entries — one per public chart type name
  area: resolve(__dirname, 'src/entries/area.js'),
  scatter: resolve(__dirname, 'src/entries/scatter.js'),
  bubble: resolve(__dirname, 'src/entries/bubble.js'),
  rangeArea: resolve(__dirname, 'src/entries/rangeArea.js'),
  column: resolve(__dirname, 'src/entries/column.js'),
  rangeBar: resolve(__dirname, 'src/entries/rangeBar.js'),
  boxPlot: resolve(__dirname, 'src/entries/boxPlot.js'),
  donut: resolve(__dirname, 'src/entries/donut.js'),
  polarArea: resolve(__dirname, 'src/entries/polarArea.js'),
  'features/annotations': resolve(__dirname, 'src/features/annotations.js'),
  'features/exports': resolve(__dirname, 'src/features/exports.js'),
  'features/keyboard': resolve(__dirname, 'src/features/keyboard.js'),
  'features/legend': resolve(__dirname, 'src/features/legend.js'),
  'features/toolbar': resolve(__dirname, 'src/features/toolbar.js'),
  'features/all': resolve(__dirname, 'src/features/all.js'),
}

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const isSSR = mode === 'ssr'
  // SUB_ENTRY mode: only ESM + CJS, single entry (set by vite-build.mjs via --entry)
  const isSubEntry = mode === 'sub-entry'
  // Derive outDir from entry name — entries like 'features/annotations' go to dist/features/
  const subEntryName = process.env.APEX_ENTRY_NAME ?? ''
  const subEntryFile = process.env.APEX_ENTRY_FILE ?? ''
  const subEntryBaseName = subEntryName.includes('/')
    ? subEntryName.slice(subEntryName.lastIndexOf('/') + 1)
    : subEntryName
  const subEntryOutDir = subEntryName.includes('/')
    ? `dist/${subEntryName.slice(0, subEntryName.lastIndexOf('/'))}`
    : 'dist'

  if (isSSR) {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, 'src/ssr/index.js'),
          name: 'ApexCharts',
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: false,
        minify: false,
        target: 'es2015',
        cssCodeSplit: false,
        rollupOptions: {
          output: [
            {
              format: 'es',
              entryFileNames: 'apexcharts.ssr.esm.js',
              banner,
              exports: 'named',
            },
            {
              format: 'cjs',
              entryFileNames: 'apexcharts.ssr.common.js',
              banner,
              exports: 'named',
              plugins: [
                terser({
                  format: { ascii_only: true, comments: false, preamble: banner },
                  compress: { drop_console: true, drop_debugger: true },
                }),
              ],
            },
          ],
        },
      },
      resolve: { extensions: ['.js', '.json'] },
      define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
      plugins: [cssAsString(), svgInlineLoader()],
    }
  }

  // ── Full bundle build (production / development / sub-entry) ──────────────

  // Sub-entry build: single entry passed via env var, ESM + CJS only
  if (isSubEntry) {
    // The core ApexCharts module must be external so that registrations land on
    // the same class instance that 'apexcharts/core' exports, not on a private
    // inline copy bundled into each sub-entry file.
    // Exception: the 'core' entry itself produces apexcharts/core, so it must
    // bundle src/apexcharts.js rather than referencing it externally.
    const isCoreEntry = subEntryName === 'core'
    const coreSourcePath = resolve(__dirname, 'src/apexcharts.js')
    const coreExternalId = 'apexcharts/core'

    // Shared utility modules bundled into core and re-exported under __apex_*
    // names. Each entry maps an absolute source path to a shim descriptor:
    //   { default: '__apex_X' }  → export default _m  (for default-only modules)
    //   { named: { Local: '__apex_Local', ... } }  → export { __apex_X as Local }
    //   { default: '__apex_X', named: { ... } }  → both
    const sharedModules = {
      [resolve(__dirname, 'src/charts/Scatter.js')]:
        { default: '__apex_charts_Scatter' },
      [resolve(__dirname, 'src/modules/Animations.js')]:
        { default: '__apex_Animations' },
      [resolve(__dirname, 'src/modules/Base.js')]:
        { default: '__apex_Base' },
      [resolve(__dirname, 'src/modules/ChartFactory.js')]:
        { named: { register: '__apex_ChartFactory_register', getChartClass: '__apex_ChartFactory_getChartClass' } },
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

    // Vite plugin: intercept imports of src/apexcharts.js (and shared modules)
    // and redirect them to 'apexcharts/core' (external). Virtual shims re-export
    // the __apex_* named exports back under their original names/default so the
    // rest of the chart code needs no changes.
    // Must run 'pre' (before Vite's own resolver) to intercept relative imports.
    const VIRTUAL_PREFIX = '\0apex-shared:'
    function coreExternalPlugin() {
      return {
        name: 'apex-core-external',
        enforce: 'pre',
        resolveId(source, importer) {
          // Keep 'apexcharts/core' external whenever it appears (including in
          // the virtual shims generated by this plugin's load hook)
          if (source === coreExternalId) {
            return { id: coreExternalId, external: true }
          }
          if (!importer) return null
          if (!source.startsWith('.')) return null
          const abs = resolve(dirname(importer), source)
          const normalized = abs.endsWith('.js') ? abs : abs + '.js'
          // Intercept src/apexcharts.js → external 'apexcharts/core'
          if (normalized === coreSourcePath) {
            return { id: coreExternalId, external: true }
          }
          // Intercept shared modules → virtual shim that re-exports from core
          if (sharedModules[normalized]) {
            return VIRTUAL_PREFIX + normalized
          }
          return null
        },
        load(id) {
          if (!id.startsWith(VIRTUAL_PREFIX)) return null
          const absPath = id.slice(VIRTUAL_PREFIX.length)
          const desc = sharedModules[absPath]
          const lines = [`import * as _core from 'apexcharts/core';`]
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

    return {
      build: {
        lib: {
          entry: subEntryFile,
          name: 'ApexCharts',
        },
        outDir: subEntryOutDir,
        emptyOutDir: false,
        sourcemap: isDev,
        minify: false,
        target: 'es2015',
        cssCodeSplit: false,
        rollupOptions: {
          output: [
            {
              format: 'es',
              entryFileNames: `${subEntryBaseName}.esm.js`,
              banner,
              exports: 'named',
            },
            {
              format: 'cjs',
              entryFileNames: `${subEntryBaseName}.common.js`,
              banner,
              exports: 'named',
              plugins: isDev
                ? []
                : [
                    terser({
                      format: { ascii_only: true, comments: false, preamble: banner },
                      compress: { drop_console: true, drop_debugger: true },
                    }),
                  ],
            },
          ],
        },
      },
      resolve: { extensions: ['.js', '.json'] },
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      plugins: isCoreEntry
        ? [svgInlineLoader(), cssAsString()]
        : [coreExternalPlugin(), svgInlineLoader(), cssAsString()],
    }
  }

  // ── Main full-bundle build (index entry only, all 4 formats) ─────────────
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/entries/full.js'),
        name: 'ApexCharts',
      },
      outDir: 'dist',
      emptyOutDir: !isDev,
      sourcemap: isDev,
      minify: false,
      target: 'es2015',
      cssCodeSplit: false,
      rollupOptions: {
        output: [
          // ESM (unminified for optimal tree-shaking)
          {
            format: 'es',
            entryFileNames: 'apexcharts.esm.js',
            banner,
          },
          // CommonJS (minified for production)
          {
            format: 'cjs',
            entryFileNames: 'apexcharts.common.js',
            banner,
            plugins: isDev
              ? []
              : [
                  terser({
                    format: { ascii_only: true, comments: false, preamble: banner },
                    compress: { drop_console: true, drop_debugger: true },
                  }),
                ],
          },
          // UMD unminified
          {
            format: 'umd',
            name: 'ApexCharts',
            entryFileNames: 'apexcharts.js',
            banner,
            globals: { apexcharts: 'ApexCharts' },
          },
          // UMD minified
          {
            format: 'umd',
            name: 'ApexCharts',
            entryFileNames: 'apexcharts.min.js',
            banner,
            globals: { apexcharts: 'ApexCharts' },
            plugins: isDev
              ? []
              : [
                  terser({
                    format: { ascii_only: true, comments: false, preamble: banner },
                    compress: { drop_console: true, drop_debugger: true },
                  }),
                ],
          },
        ],
      },
    },

    css: { postcss: {} },

    server: {
      port: 3000,
      open: false,
    },

    resolve: { extensions: ['.js', '.json'] },

    plugins: [
      cssAsString(),

      // Copy static assets
      {
        name: 'copy-assets',
        closeBundle() {
          if (!existsSync('dist')) mkdirSync('dist', { recursive: true })

          const cssFiles = [
            'src/assets/apexcharts.css',
            'src/assets/apexcharts-legend.css',
          ]
          cssFiles.forEach((file) => {
            if (existsSync(file)) copyFileSync(file, join('dist', basename(file)))
          })

          const localesDir = 'src/locales'
          const distLocalesDir = 'dist/locales'
          if (existsSync(localesDir)) {
            if (!existsSync(distLocalesDir)) mkdirSync(distLocalesDir, { recursive: true })
            readdirSync(localesDir).forEach((file) => {
              copyFileSync(join(localesDir, file), join(distLocalesDir, file))
            })
          }
        },
      },

      svgInlineLoader(),
    ],

    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
  }
})

function cssAsString() {
  return {
    name: 'css-as-string',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.js') && !id.includes('node_modules')) {
        const transformed = code.replace(
          /import\s+(\w+)\s+from\s+['"]([^'"]+\/assets\/[^'"]+\.css)['"]/g,
          "import $1 from '$2?inline'"
        )
        if (transformed !== code) return { code: transformed, map: null }
      }
    },
  }
}

function svgInlineLoader() {
  return {
    name: 'svg-inline-loader',
    transform(code, id) {
      if (id.endsWith('.svg')) {
        const svg = readFileSync(id, 'utf-8')
        return { code: `export default ${JSON.stringify(svg)}`, map: null }
      }
    },
  }
}
