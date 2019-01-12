module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          chrome: 60,
          firefox: 36,
          safari: 11,
          ios: 11,
          edge: 12,
          //ie: 11
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
