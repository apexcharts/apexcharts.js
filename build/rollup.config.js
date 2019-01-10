import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify-es'

export default [
  {
    input: './dist/apexcharts.js',
    output: {
      file: './dist/apexcharts.cjs.min.js',
      format: 'es',
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      uglify()
    ],
  },
];