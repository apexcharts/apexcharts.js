module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2021,
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: ['prettier'],
  plugins: ['promise'],
  globals: {
    Blob: true,
    Image: true,
    URL: true,
    Apex: true,
    ApexCharts: true,
    screen: true
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      globals: {
        describe: true,
        it: true,
        expect: true
      }
    }
  ]
}
