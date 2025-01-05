import pkg from '../package.json' with { type: 'json' }
import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'
import terser from '@rollup/plugin-terser'

const buildDate = Date()

const headerLong = `/*!
* ${pkg.name} - ${pkg.description}
* @version ${pkg.version}
* ${pkg.homepage}
*
* @copyright ${pkg.author}
* @license ${pkg.license}
*
* BUILT: ${buildDate}
*/;`

const headerShort = `/*! ${pkg.name} v${pkg.version} ${pkg.license}*/;`

const getBabelConfig = (node = false) => {
  let targets = pkg.browserslist
  const plugins = [
    [
      '@babel/transform-runtime',
      {
        version: '^7.24.7',
        regenerator: false,
        useESModules: true
      }
    ],
    [
      'polyfill-corejs3',
      {
        method: 'usage-pure'
      }
    ]
  ]

  if (node) {
    targets = 'maintained node versions'
  }

  return babel({
    include: 'src/**',
    babelHelpers: 'runtime',
    babelrc: false,
    targets: targets,
    presets: [
      [
        '@babel/preset-env',
        {
          modules: false,
          // useBuildins and plugin-transform-runtime are mutually exclusive
          // https://github.com/babel/babel/issues/10271#issuecomment-528379505
          // use babel-polyfills when released
          useBuiltIns: false,
          bugfixes: true,
          loose: true
        }
      ]
    ],
    plugins
  })
}

// When few of these get mangled nothing works anymore
// We loose literally nothing by let these unmangled
const classes = [
  'A',
  'ClipPath',
  'Defs',
  'Element',
  'G',
  'Image',
  'Marker',
  'Path',
  'Polygon',
  'Rect',
  'Stop',
  'Svg',
  'Text',
  'Tspan',
  'Circle',
  'Container',
  'Dom',
  'Ellipse',
  'Gradient',
  'Line',
  'Mask',
  'Pattern',
  'Polyline',
  'Shape',
  'Style',
  'Symbol',
  'TextPath',
  'Use'
]

const config = (node, min, esm = false) => ({
  input: node || esm ? './src/main.js' : './src/svg.js',
  output: {
    file: esm
      ? './dist/svg.esm.js'
      : node
        ? './dist/svg.node.cjs'
        : min
          ? './dist/svg.min.js'
          : './dist/svg.js',
    format: esm ? 'esm' : node ? 'cjs' : 'iife',
    name: 'SVG',
    sourcemap: true,
    banner: headerLong,
    // remove Object.freeze
    freeze: false
  },
  treeshake: {
    // property getter have no sideeffects
    propertyReadSideEffects: false
  },
  plugins: [
    resolve({ browser: !node }),
    commonjs(),
    getBabelConfig(node),
    filesize(),
    !min
      ? {}
      : terser({
          mangle: {
            reserved: classes
          },
          output: {
            preamble: headerShort
          }
        })
  ]
})

// [node, minified, esm]
const modes = [[false], [false, true], [true], [false, false, true]]

export default modes.map((m) => config(...m))
