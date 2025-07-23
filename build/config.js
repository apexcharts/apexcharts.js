const path = require('path')
const rollup = require('rollup')
const babel = require('@rollup/plugin-babel')
const replace = require('@rollup/plugin-replace')
const postcss = require('rollup-plugin-postcss')
const copy = require('rollup-plugin-copy-glob')
const json = require('@rollup/plugin-json')
const resolve = require('@rollup/plugin-node-resolve')
const svgo = require('rollup-plugin-svgo')
const strip = require('@rollup/plugin-strip')
const terser = require('@rollup/plugin-terser').default

const version = require('../package.json').version

const resolvePath = (p) => path.resolve(__dirname, '../', p)

const banner =
  '/*!\n' +
  ` * ApexCharts v${version}\n` +
  ` * (c) 2018-${new Date().getFullYear()} ApexCharts\n` +
  ' */'

const builds = {
  'web-cjs': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist/apexcharts.common.js'),
    format: 'cjs',
    env: 'production',
    banner,
  },
  'web-esm': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist/apexcharts.esm.js'),
    format: 'es',
    env: 'production',
    banner,
  },
  'web-umd-dev': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist/apexcharts.js'),
    format: 'umd',
    env: 'development',
    banner,
  },
  'web-umd-prod': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist/apexcharts.min.js'),
    format: 'umd',
    env: 'production',
    banner,
    assets: true,
  },
}

/**
 * Generate proper Rollup configuration from build options
 * @param {*} opts Build options
 */
function rollupConfig(opts) {
  const config = {
    input: opts.entry,
    plugins: [
      resolve(),
      json({
        preferConst: true,
      }),
      postcss({
        inject: false,
        plugins: [],
      }),
      svgo({
        raw: true,
      }),
      babel.babel({
        exclude: 'node_modules/**',
        plugins: ['@babel/plugin-proposal-class-properties'].concat(
          opts.istanbul ? ['istanbul'] : []
        ),
      }),
      replace({ 'process.env.NODE_ENV': JSON.stringify(opts.env) }),
    ],
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: 'ApexCharts',
    },
  }

  if (opts.env === 'production') {
    config.plugins.push(
      strip({
        debugger: true,
        functions: ['console.log', 'debug', 'alert'],
        sourceMap: false,
      }),
      terser({
        output: {
          ascii_only: true,
        },
      })
    )
  }

  if (opts.assets) {
    config.plugins.push(
      copy(
        [
          {
            files: 'src/assets/apexcharts.css',
            dest: 'dist',
          },
          {
            files: 'src/assets/apexcharts-legend.css',
            dest: 'dist',
          },
          {
            files: 'src/locales/*.*',
            dest: 'dist/locales',
          },
        ],
        {
          verbose: true,
          watch: false,
        }
      )
    )
  }

  return config
}

/**
 * Build code with Rollup from build configuration
 * @param {*} options Build options
 */
async function executeBuildEntry(options) {
  const config = rollupConfig(options)
  const buildBundle = await rollup.rollup(config)
  const generated = await buildBundle.generate(config.output)
  await buildBundle.write(config.output)
  return {
    path: config.output.file,
    code: generated.output[0].code,
    isDev: /apexcharts\.js$/.test(config.output.file),
  }
}

// If target specified, only generate this one, otherwise return all build configurations
if (process.env.TARGET) {
  module.exports = rollupConfig(builds[process.env.TARGET])
} else {
  module.exports = { builds, executeBuildEntry }
}
