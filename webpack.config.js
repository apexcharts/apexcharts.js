const path = require('path')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = {
  entry: [path.resolve(__dirname, 'src/apexcharts.js')],
  mode: 'production',
  output: {
    library: 'ApexCharts',
    libraryTarget: 'umd',
    umdNamedDefine: false,
    path: path.resolve(__dirname, 'dist/'),
    filename: 'apexcharts.amd.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
      }
    ]
  },
  watchOptions: {
    poll: true
  },
  resolve: {
    modules: [__dirname, 'src', 'node_modules'],
    extensions: ['.js', '.json']
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: path.join('..', 'bundle-analysis.html'),
      openAnalyzer: false
    })
  ]
}
