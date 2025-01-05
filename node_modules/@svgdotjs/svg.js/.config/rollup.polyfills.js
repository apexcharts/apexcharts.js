import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import filesize from 'rollup-plugin-filesize'

// We dont need babel. All polyfills are compatible
const config = (ie) => ({
  input: './.config/polyfillListIE.js',
  output: {
    file: 'dist/polyfillsIE.js',
    format: 'iife'
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    //terser(),
    filesize()
  ]
})

export default [true].map(config)
