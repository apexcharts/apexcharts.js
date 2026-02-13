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

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/apexcharts.js'),
        name: 'ApexCharts',
      },
      outDir: 'dist',
      sourcemap: isDev,
      minify: false, // control minification per output
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
          // CommonJS (minified)
          {
            format: 'cjs',
            entryFileNames: 'apexcharts.common.js',
            banner,
            plugins: isDev ? [] : [terser({
              format: {
                ascii_only: true,
                comments: false,
                preamble: banner,
              },
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            })],
          },
          // UMD unminified (for debugging)
          {
            format: 'umd',
            name: 'ApexCharts',
            entryFileNames: 'apexcharts.js',
            banner,
            globals: {
              apexcharts: 'ApexCharts',
            },
          },
          // UMD minified (for production)
          {
            format: 'umd',
            name: 'ApexCharts',
            entryFileNames: 'apexcharts.min.js',
            banner,
            globals: {
              apexcharts: 'ApexCharts',
            },
            plugins: isDev ? [] : [terser({
              format: {
                ascii_only: true,
                comments: false,
                preamble: banner,
              },
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
            })],
          },
        ],
      },
    },

    css: {
      postcss: {},
    },

    server: {
      port: 3000,
      open: false,
    },

    resolve: {
      extensions: ['.js', '.json'],
    },

    plugins: [
      // Transform CSS imports to use ?inline (provides CSS as string, not injected)
      {
        name: 'css-as-string',
        enforce: 'pre',
        transform(code, id) {
          if (id.endsWith('.js') && !id.includes('node_modules')) {
            // Transform any CSS imports to add ?inline suffix
            // Matches: import NAME from '../path/to/file.css'
            const transformed = code.replace(
              /import\s+(\w+)\s+from\s+['"]([^'"]+\/assets\/[^'"]+\.css)['"]/g,
              "import $1 from '$2?inline'"
            )
            if (transformed !== code) {
              return {
                code: transformed,
                map: null,
              }
            }
          }
        },
      },

      // Copy static assets
      {
        name: 'copy-assets',
        closeBundle() {
          if (!existsSync('dist')) {
            mkdirSync('dist', { recursive: true })
          }

          // Copy CSS files
          const cssFiles = [
            'src/assets/apexcharts.css',
            'src/assets/apexcharts-legend.css',
          ]
          cssFiles.forEach((file) => {
            if (existsSync(file)) {
              copyFileSync(file, join('dist', basename(file)))
            }
          })

          // Copy locales
          const localesDir = 'src/locales'
          const distLocalesDir = 'dist/locales'
          if (existsSync(localesDir)) {
            if (!existsSync(distLocalesDir)) {
              mkdirSync(distLocalesDir, { recursive: true })
            }
            const files = readdirSync(localesDir)
            files.forEach((file) => {
              copyFileSync(join(localesDir, file), join(distLocalesDir, file))
            })
          }
        },
      },

      // SVG inline loader
      {
        name: 'svg-inline-loader',
        transform(code, id) {
          if (id.endsWith('.svg')) {
            const svg = readFileSync(id, 'utf-8')
            return {
              code: `export default ${JSON.stringify(svg)}`,
              map: null,
            }
          }
        },
      },
    ],

    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
  }
})
