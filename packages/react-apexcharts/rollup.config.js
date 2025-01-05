const terser = require("@rollup/plugin-terser")
const { babel } = require("@rollup/plugin-babel")
const { nodeResolve } = require("@rollup/plugin-node-resolve")

let pluginOptions = [
  nodeResolve({ browser: true }),
  babel({ exclude: "node_modules/**", babelHelpers: "bundled" }),
  terser()
];

module.exports = {
  input: "./src/react-apexcharts.jsx",
  output: [
    {
      name: "ReactApexChart",
      file: "dist/react-apexcharts.iife.min.js",
      format: "iife",
      globals: {
        react: "React",
        apexcharts: "ApexCharts",
        "prop-types": "PropTypes"
      }
    }
  ],
  external: ["react", "apexcharts", "prop-types"],
  plugins: pluginOptions
};
