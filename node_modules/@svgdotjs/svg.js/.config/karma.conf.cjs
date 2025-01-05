// Karma configuration
const karmaCommon = require('./karma.conf.common.cjs')

let chromeBin = 'ChromeHeadless'
if (process.platform === 'linux') {
  // We need to choose either Chrome or Chromium.
  // Canary is not available on linux.
  // If we do not find Chromium then we can deduce that
  // either Chrome is installed or there is no Chrome variant at all,
  // in which case karma-chrome-launcher will output an error.
  // If `which` finds nothing it will throw an error.
  const { execSync } = require('child_process')

  try {
    if (execSync('which chromium-browser')) chromeBin = 'ChromiumHeadless'
  } catch (e) {}
}

module.exports = function (config) {
  config.set(
    Object.assign(karmaCommon(config), {
      files: [
        'spec/RAFPlugin.js',
        {
          pattern: 'spec/fixtures/fixture.css',
          included: false,
          served: true
        },
        {
          pattern: 'spec/fixtures/pixel.png',
          included: false,
          served: true
        },
        {
          pattern: 'src/**/*.js',
          included: false,
          served: true,
          type: 'modules'
        },
        {
          pattern: 'spec/helpers.js',
          included: false,
          served: true,
          type: 'module'
        },
        {
          pattern: 'spec/setupBrowser.js',
          included: true,
          type: 'module'
        },
        {
          pattern: 'spec/spec/*/**/*.js',
          included: true,
          type: 'module'
        }
      ],

      // preprocess matching files before serving them to the browser
      // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
      preprocessors: {
        'src/**/*.js': ['coverage']
      },

      // test results reporter to use
      // possible values: 'dots', 'progress'
      // available reporters: https://npmjs.org/browse/keyword/karma-reporter
      reporters: ['progress', 'coverage'],
      coverageReporter: {
        // Specify a reporter type.
        type: 'lcov',
        dir: 'coverage/',
        subdir: function (browser) {
          // normalization process to keep a consistent browser name accross different OS
          return browser.toLowerCase().split(/[ /-]/)[0] // output the results into: './coverage/firefox/'
        },
        instrumenterOptions: {
          istanbul: {
            esModules: true
          }
        }
      },

      // start these browsers
      // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
      browsers: [chromeBin, 'FirefoxHeadless']
    })
  )
}
