module.exports = {
  presets: [
    require('@babel/preset-env'),
  ],
  plugins: [
    require('@babel/plugin-syntax-dynamic-import')
  ],
  ignore: [
    'build/*.js',
    'dist/*.js',
    'samples/**/*.js'
  ]
}