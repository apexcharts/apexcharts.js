const path = require('path')
const buble = require('rollup-plugin-buble')
const replace = require('rollup-plugin-replace')

const version = process.env.VERSION || require('../package.json').version

const resolvePath = (p) => path.resolve(__dirname, '../', p)

const banner =
  '/*!\n' +
  ` * ApexCharts v${version}\n` +
  ` * (c) 2018-${new Date().getFullYear()} Juned Chhipa\n` +
  ' * Released under the MIT License.\n' +
  ' */'

const builds = {
  'web-cjs': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist2/apexchart.common.js'),
    format: 'cjs',
    banner
  },
  'web-esm': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist2/apexchart.esm.js'),
    format: 'es',
    banner
  },
  'web-umd-dev': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist2/apexchart.js'),
    format: 'umd',
    env: 'development',
    banner
  },
  'web-umd-prod': {
    entry: resolvePath('src/apexcharts.js'),
    dest: resolvePath('dist2/apexchart.js.min'),
    format: 'umd',
    env: 'development',
    banner
  }
}

function generateConfig(name) {
  const opts = builds[name]
  const config = {
    input: opts.entry,
    plugins: [buble()],
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: 'ApexCharts'
    }
  }
  if (opts.env) {
    config.plugins.push(
      replace({ 'process.env.NODE_ENV': JSON.stringify(opts.env) })
    )
  }

  return config
}

if (process.env.TARGET) {
  module.exports = generateConfig(process.env.TARGET)
} else {
  exports.getBuild = generateConfig
  exports.getAllBuilds = () => Object.keys(builds).map(generateConfig)
}
