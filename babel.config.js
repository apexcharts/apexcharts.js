module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          chrome: 60,
          firefox: 48,
          safari: 7,
          edge: 12
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
