module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          chrome: 68,
          firefox: 62,
          safari: 11,
          ios: 11
          // edge: 16,
          // ie: 11
        }
      }
    ]
  ],
  plugins: ['@babel/plugin-proposal-class-properties'],
  ignore: ['build/*.js', 'dist/*.js', 'samples/**/*.js'],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs'
          }
        ]
      ]
    }
  }
}
