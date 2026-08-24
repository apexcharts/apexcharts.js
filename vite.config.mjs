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
        target: 'es2015',
        cssCodeSplit: false,
        rollupOptions: {
          external: ['apexcharts'],
          output: [
            {
              format: 'umd',
              name: umd.global,
              entryFileNames: umd.out,
              globals: { apexcharts: 'ApexCharts' },
              banner,
              exports: 'named',
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
