// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
module.exports = {
  preset: 'jest-puppeteer',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/unit/mocks/styleMock.js',
  },

  // Indicates whether the coverage information should be collected while executing the test
  // collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: null,

  // The directory where Jest should output its coverage files
  // coverageDirectory: '.coverage',

  // An array of regexp pattern strings used to skip coverage collection
  // coveragePathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
  // modulePathIgnorePatterns: [],

  // The root directory that Jest should scan for tests and modules within
  // rootDir: null,

  // A list of paths to directories that Jest should use to search for files in
  // roots: [
  //   "<rootDir>"
  // ],

  // The paths to modules that run some code to configure or set up the testing environment before each test
  setupFiles: ['<rootDir>/tests/unit/setup.js'],
  testTimeout: 20000,

  // The test environment that will be used for testing
  testEnvironment: 'jest-environment-jsdom',

  // Options that will be passed to the testEnvironment
  // testEnvironmentOptions: {},

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/tests/**/*.spec.js?(x)'],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/unit/data/',
    '/tests/unit/utils/',
  ],

  // The regexp pattern Jest uses to detect test files
  // testRegex: "",

  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.svg$': '<rootDir>/tests/unit/utils/svg-transform.js',
  },

  // transformIgnorePatterns: ['<rootDir>/build/']
}
