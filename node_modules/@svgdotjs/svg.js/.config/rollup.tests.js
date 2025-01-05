import * as pkg from '../package.json'
import babel from '@rollup/plugin-babel'
import multiEntry from '@rollup/plugin-multi-entry'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const getBabelConfig = (targets) =>
  babel({
    include: ['src/**', 'spec/**/*'],
    babelHelpers: 'runtime',
    babelrc: false,
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          targets: targets || pkg.browserslist,
          // useBuildins and plugin-transform-runtime are mutually exclusive
          // https://github.com/babel/babel/issues/10271#issuecomment-528379505
          // use babel-polyfills when released
          useBuiltIns: false,
          // corejs: 3,
          bugfixes: true
        }
      ]
    ],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: 3,
          helpers: true,
          useESModules: true,
          version: '^7.9.6',
          regenerator: false
        }
      ]
    ]
  })

export default {
  input: ['spec/setupBrowser.js', 'spec/spec/*/*.js'],
  output: {
    file: 'spec/es5TestBundle.js',
    name: 'SVGTests',
    format: 'iife'
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    getBabelConfig(),
    multiEntry()
  ],
  external: ['@babel/runtime', '@babel/runtime-corejs3']
}
