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
import { coreExternalPlugin } from './build/shared-modules.mjs'

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
  violin: resolve(__dirname, 'src/entries/violin.js'),
  pie: resolve(__dirname, 'src/entries/pie.js'),
  radialBar: resolve(__dirname, 'src/entries/radialBar.js'),
  radar: resolve(__dirname, 'src/entries/radar.js'),
  heatmap: resolve(__dirname, 'src/entries/heatmap.js'),
  treemap: resolve(__dirname, 'src/entries/treemap.js'),
  sunburst: resolve(__dirname, 'src/entries/sunburst.js'),
  unit: resolve(__dirname, 'src/entries/unit.js'),
  'unit-shapes': resolve(__dirname, 'src/unit-shapes/index.js'),
  pictograms: resolve(__dirname, 'src/pictograms/index.js'),
  // Alias entries — one per public chart type name
  area: resolve(__dirname, 'src/entries/area.js'),
  scatter: resolve(__dirname, 'src/entries/scatter.js'),
  bubble: resolve(__dirname, 'src/entries/bubble.js'),
  rangeArea: resolve(__dirname, 'src/entries/rangeArea.js'),
  column: resolve(__dirname, 'src/entries/column.js'),
  rangeBar: resolve(__dirname, 'src/entries/rangeBar.js'),
  boxPlot: resolve(__dirname, 'src/entries/boxPlot.js'),
  histogram: resolve(__dirname, 'src/entries/histogram.js'),
  waterfall: resolve(__dirname, 'src/entries/waterfall.js'),
  dumbbell: resolve(__dirname, 'src/entries/dumbbell.js'),
  streamgraph: resolve(__dirname, 'src/entries/streamgraph.js'),
  raincloud: resolve(__dirname, 'src/entries/raincloud.js'),
  donut: resolve(__dirname, 'src/entries/donut.js'),
  polarArea: resolve(__dirname, 'src/entries/polarArea.js'),
  'features/annotations': resolve(__dirname, 'src/features/annotations.js'),
  'features/exports': resolve(__dirname, 'src/features/exports.js'),
  'features/keyboard': resolve(__dirname, 'src/features/keyboard.js'),
  'features/legend': resolve(__dirname, 'src/features/legend.js'),
  'features/toolbar': resolve(__dirname, 'src/features/toolbar.js'),
  'features/morph': resolve(__dirname, 'src/features/morph.js'),
  'features/drilldown': resolve(__dirname, 'src/features/drilldown.js'),
  'features/perspectives': resolve(__dirname, 'src/features/perspectives.js'),
  'features/storyboard': resolve(__dirname, 'src/features/storyboard.js'),
  'features/history': resolve(__dirname, 'src/features/history.js'),
  'features/weave': resolve(__dirname, 'src/features/weave.js'),
  'features/renderer-canvas': resolve(
    __dirname,
    'src/features/renderer-canvas.js',
  ),
  'features/marks': resolve(__dirname, 'src/features/marks.js'),
  'features/facet': resolve(__dirname, 'src/features/facet.js'),
  'features/link': resolve(__dirname, 'src/features/link.js'),
  'features/ink': resolve(__dirname, 'src/features/ink.js'),
  'features/measure': resolve(__dirname, 'src/features/measure.js'),
  'features/context-menu': resolve(__dirname, 'src/features/context-menu.js'),
  'features/stats': resolve(__dirname, 'src/features/stats.js'),
  'features/raincloud': resolve(__dirname, 'src/features/raincloud.js'),
  'features/waterfall': resolve(__dirname, 'src/features/waterfall.js'),
  'features/dumbbell': resolve(__dirname, 'src/features/dumbbell.js'),
  'features/streamgraph': resolve(__dirname, 'src/features/streamgraph.js'),
  'features/trellis': resolve(__dirname, 'src/features/trellis.js'),
  'features/all': resolve(__dirname, 'src/features/all.js'),
}

/**
 * Sub-entries that ALSO ship a script-loadable build, so a page without a
 * bundler gets the same opt-in choice a bundler user has (plan 08's missing CDN
 * channel). Each is a separate pass, because the UMD file is built from its own
 * side-effecting entry (it registers itself on load) rather than from the pure
 * one bundlers import.
 */
export const UMD_ENTRIES = {
  'unit-shapes': {
    file: resolve(__dirname, 'src/unit-shapes/cdn.js'),
    global: 'ApexUnitShapes',
    out: 'unit-shapes.js',
  },
  pictograms: {
    file: resolve(__dirname, 'src/pictograms/cdn.js'),
    global: 'ApexPictograms',
    out: 'pictograms.js',
  },
  // Tier-2 features: not in the full bundle, so this is the only way a page
  // without a bundler can reach them. Built from the SAME entry bundlers
  // import, because a feature entry already registers itself on load; `shared`
  // makes its core imports resolve off the global instead of inlining core.
  'features/trellis': {
    file: resolve(__dirname, 'src/features/trellis.js'),
    global: 'ApexTrellis',
    out: 'features/trellis.js',
    shared: true,
  },
  'features/measure': {
    file: resolve(__dirname, 'src/features/measure.js'),
    global: 'ApexMeasure',
    out: 'features/measure.js',
    shared: true,
  },
  'features/link': {
    file: resolve(__dirname, 'src/features/link.js'),
    global: 'ApexLink',
    out: 'features/link.js',
    shared: true,
  },
  'features/ink': {
    file: resolve(__dirname, 'src/features/ink.js'),
    global: 'ApexInk',
    out: 'features/ink.js',
    shared: true,
  },
  'features/storyboard': {
    file: resolve(__dirname, 'src/features/storyboard.js'),
    global: 'ApexStoryboard',
    out: 'features/storyboard.js',
    shared: true,
  },
  'features/renderer-canvas': {
    file: resolve(__dirname, 'src/features/renderer-canvas.js'),
    global: 'ApexRendererCanvas',
    out: 'features/renderer-canvas.js',
    shared: true,
  },
  'features/context-menu': {
    file: resolve(__dirname, 'src/features/context-menu.js'),
    global: 'ApexContextMenu',
    out: 'features/context-menu.js',
    shared: true,
  },
  'features/history': {
    file: resolve(__dirname, 'src/features/history.js'),
    global: 'ApexHistory',
    out: 'features/history.js',
    shared: true,
  },
  'features/perspectives': {
    file: resolve(__dirname, 'src/features/perspectives.js'),
    global: 'ApexPerspectives',
    out: 'features/perspectives.js',
    shared: true,
  },
  // The lean-core CDN baseline (plan 08's other half). Bundles the chart class
  // and nothing else, and attaches the same __internals surface the full bundle
  // does, so every add-on below layers onto either one unchanged.
  core: {
    file: resolve(__dirname, 'src/entries/core-umd.js'),
    global: 'ApexCharts',
    out: 'apexcharts.core.js',
    alsoMin: true,
  },
  // Chart types, script-loadable. A lean-core page renders nothing until it
  // loads at least one of these. Alias names (area, column, donut, ...) are
  // registered by their parent: 'area' comes from line.js, not its own file.
  'line': {
    file: resolve(__dirname, 'src/entries/line.js'),
    global: 'ApexLine',
    out: 'line.js',
    shared: true,
  },
  'bar': {
    file: resolve(__dirname, 'src/entries/bar.js'),
    global: 'ApexBar',
    out: 'bar.js',
    shared: true,
  },
  'candlestick': {
    file: resolve(__dirname, 'src/entries/candlestick.js'),
    global: 'ApexCandlestick',
    out: 'candlestick.js',
    shared: true,
  },
  'violin': {
    file: resolve(__dirname, 'src/entries/violin.js'),
    global: 'ApexViolin',
    out: 'violin.js',
    shared: true,
  },
  'pie': {
    file: resolve(__dirname, 'src/entries/pie.js'),
    global: 'ApexPie',
    out: 'pie.js',
    shared: true,
  },
  'radialBar': {
    file: resolve(__dirname, 'src/entries/radialBar.js'),
    global: 'ApexRadialBar',
    out: 'radialBar.js',
    shared: true,
  },
  'radar': {
    file: resolve(__dirname, 'src/entries/radar.js'),
    global: 'ApexRadar',
    out: 'radar.js',
    shared: true,
  },
  'heatmap': {
    file: resolve(__dirname, 'src/entries/heatmap.js'),
    global: 'ApexHeatmap',
    out: 'heatmap.js',
    shared: true,
  },
  'treemap': {
    file: resolve(__dirname, 'src/entries/treemap.js'),
    global: 'ApexTreemap',
    out: 'treemap.js',
    shared: true,
  },
  'sunburst': {
    file: resolve(__dirname, 'src/entries/sunburst.js'),
    global: 'ApexSunburst',
    out: 'sunburst.js',
    shared: true,
  },
  'unit': {
    file: resolve(__dirname, 'src/entries/unit.js'),
    global: 'ApexUnit',
    out: 'unit.js',
    shared: true,
  },
  // Tier-1 features. In the full bundle already; a lean-core page opts in.
  'features/exports': {
    file: resolve(__dirname, 'src/features/exports.js'),
    global: 'ApexExports',
    out: 'features/exports.js',
    shared: true,
  },
  'features/legend': {
    file: resolve(__dirname, 'src/features/legend.js'),
    global: 'ApexLegend',
    out: 'features/legend.js',
    shared: true,
  },
  'features/toolbar': {
    file: resolve(__dirname, 'src/features/toolbar.js'),
    global: 'ApexToolbar',
    out: 'features/toolbar.js',
    shared: true,
  },
  'features/annotations': {
    file: resolve(__dirname, 'src/features/annotations.js'),
    global: 'ApexAnnotations',
    out: 'features/annotations.js',
    shared: true,
  },
  'features/keyboard': {
    file: resolve(__dirname, 'src/features/keyboard.js'),
    global: 'ApexKeyboard',
    out: 'features/keyboard.js',
    shared: true,
  },
  'features/morph': {
    file: resolve(__dirname, 'src/features/morph.js'),
    global: 'ApexMorph',
    out: 'features/morph.js',
    shared: true,
  },
  'features/drilldown': {
    file: resolve(__dirname, 'src/features/drilldown.js'),
    global: 'ApexDrilldown',
    out: 'features/drilldown.js',
    shared: true,
  },
  'features/weave': {
    file: resolve(__dirname, 'src/features/weave.js'),
    global: 'ApexWeave',
    out: 'features/weave.js',
    shared: true,
  },
  'features/marks': {
    file: resolve(__dirname, 'src/features/marks.js'),
    global: 'ApexMarks',
    out: 'features/marks.js',
    shared: true,
  },
  'features/facet': {
    file: resolve(__dirname, 'src/features/facet.js'),
    global: 'ApexFacet',
    out: 'features/facet.js',
    shared: true,
  },
  'features/stats': {
    file: resolve(__dirname, 'src/features/stats.js'),
    global: 'ApexStats',
    out: 'features/stats.js',
    shared: true,
  },
  'features/raincloud': {
    file: resolve(__dirname, 'src/features/raincloud.js'),
    global: 'ApexRaincloud',
    out: 'features/raincloud.js',
    shared: true,
  },
  'features/waterfall': {
    file: resolve(__dirname, 'src/features/waterfall.js'),
    global: 'ApexWaterfall',
    out: 'features/waterfall.js',
    shared: true,
  },
  'features/dumbbell': {
    file: resolve(__dirname, 'src/features/dumbbell.js'),
    global: 'ApexDumbbell',
    out: 'features/dumbbell.js',
    shared: true,
  },
  'features/streamgraph': {
    file: resolve(__dirname, 'src/features/streamgraph.js'),
    global: 'ApexStreamgraph',
    out: 'features/streamgraph.js',
    shared: true,
  },
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

  // UMD mode: one script-loadable file for a sub-entry that opts in via
  // UMD_ENTRIES. The chart itself stays external, mapped to the global, so the
  // file layers onto whichever apexcharts.js the page already loaded.
  if (mode === 'sub-entry-umd') {
    const umd = UMD_ENTRIES[subEntryName]
    if (!umd) throw new Error(`No UMD_ENTRIES entry for "${subEntryName}"`)
    // A feature add-on is written against core's internals, so its shared
    // imports resolve off the global the full bundle already put on the page
    // rather than being inlined a second time. A self-contained add-on
    // (a shape catalog, say) needs none of that and opts out.
    const umdPlugins = umd.shared
      ? [coreExternalPlugin({ target: 'global' })]
      : []
    return {
      build: {
        lib: { entry: umd.file, name: umd.global, formats: ['umd'] },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: false,
        // Off here, on per output: vite's default esbuild pass would minify
        // every output including the lean core's readable build, leaving
        // apexcharts.core.js and .core.min.js the same size. Terser below is
        // the single place minification happens, as in the main bundle.
        minify: false,
        target: 'es2015',
        cssCodeSplit: false,
        rollupOptions: {
          external: ['apexcharts'],
          output: [
            // Add-ons ship minified under their plain name; only the lean
            // core also emits a readable build, mirroring apexcharts.js /
            // apexcharts.min.js so the two baselines look alike.
            ...(umd.alsoMin
              ? [
                  {
                    format: 'umd',
                    name: umd.global,
                    entryFileNames: umd.out,
                    globals: { apexcharts: 'ApexCharts' },
                    banner,
                    exports: 'default',
                  },
                ]
              : []),
            {
              format: 'umd',
              name: umd.global,
              entryFileNames: umd.alsoMin
                ? umd.out.replace(/\.js$/, '.min.js')
                : umd.out,
              globals: { apexcharts: 'ApexCharts' },
              banner,
              // The lean core IS the class on the global, like apexcharts.js.
              // 'named' would wrap it in a namespace object and
              // `new ApexCharts(...)` would throw "is not a constructor".
              exports: umd.alsoMin ? 'default' : 'named',
              plugins: isDev
                ? []
                : [
                    terser({
                      format: {
                        ascii_only: true,
                        comments: false,
                        preamble: banner,
                      },
                      compress: { drop_console: false, drop_debugger: true },
                    }),
                  ],
            },
          ],
        },
      },
      resolve: { extensions: ['.js', '.json'] },
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      plugins: [...umdPlugins, svgInlineLoader(), cssAsString()],
    }
  }

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
              // dist/core.common.js is an __esModule CJS file, so the chart
              // class is on `.default`. Rollup's default interop assumes a
              // bare CJS export and emits `require(...).use(...)`, which
              // throws "h.use is not a function" the moment anything requires
              // a sub-entry. That has been broken in every published CJS
              // sub-entry; `auto` emits the __esModule check and picks
              // `.default` when it is there.
              interop: 'auto',
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

  // ── The default bundle, ESM + CJS ────────────────────────────────────────
  // Built like a sub-entry, externalising apexcharts/core, so that
  //
  //   import ApexCharts from 'apexcharts'
  //   import 'apexcharts/features/trellis'
  //
  // lands both on ONE core. Bundle core in here instead and the two files carry
  // rival copies of the class: the add-on registers into a registry the chart
  // never reads (the feature registry is not globalThis-backed), and the app
  // ships ~130 KB gzipped of duplicate core for a 6 KB feature. Since 7.0 that
  // pairing is the documented upgrade path for nine features, so it has to be
  // the cheap and correct one.
  //
  // The UMD halves stay self-contained: a script tag has no resolver.
  if (mode === 'full-esm') {
    return {
      build: {
        lib: { entry: resolve(__dirname, 'src/entries/full.js'), name: 'ApexCharts' },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: isDev,
        minify: false,
        target: 'es2015',
        cssCodeSplit: false,
        rollupOptions: {
          output: [
            { format: 'es', entryFileNames: 'apexcharts.esm.js', banner },
            {
              format: 'cjs',
              entryFileNames: 'apexcharts.common.js',
              banner,
              exports: 'named',
              interop: 'auto',
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
      plugins: [coreExternalPlugin({ target: 'core' }), svgInlineLoader(), cssAsString()],
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
