// Karma shared configuration

const os = require('os')
const cpuCount = os.cpus().length

module.exports = function (config) {
  return {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      '.config/pretest.js',
      'spec/RAFPlugin.js',
      {
        pattern: 'spec/fixtures/fixture.css',
        included: false,
        served: true
      },
      {
        pattern: 'spec/fixtures/fixture.svg',
        included: false,
        served: true
      },
      {
        pattern: 'spec/fixtures/pixel.png',
        included: false,
        served: true
      },
      'dist/svg.js',
      'spec/spec/*.js'
    ],

    proxies: {
      '/fixtures/': '/base/spec/fixtures/',
      '/spec/': '/base/spec/'
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: cpuCount || Infinity,

    // list of files to exclude
    exclude: []
  }
}
