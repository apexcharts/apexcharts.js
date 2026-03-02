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
  line: resolve(__dirname, 'src/entries/line.js'),
  bar: resolve(__dirname, 'src/entries/bar.js'),
  candlestick: resolve(__dirname, 'src/entries/candlestick.js'),
  pie: resolve(__dirname, 'src/entries/pie.js'),
  radial: resolve(__dirname, 'src/entries/radial.js'),
  heatmap: resolve(__dirname, 'src/entries/heatmap.js'),
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
            },
            {
              format: 'cjs',
              entryFileNames: `${subEntryBaseName}.common.js`,
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
          ],
        },
      },
      resolve: { extensions: ['.js', '.json'] },
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      plugins: [svgInlineLoader(), cssAsString()],
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
