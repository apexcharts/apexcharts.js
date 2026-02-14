import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import promisePlugin from 'eslint-plugin-promise'
import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
  // Global ignores
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'build/**',
      'samples/**',
      'node_modules/**',
      'nbproject/**',
      'docs/**',
      '*.config.js',
      '*.config.mjs',
      'jest.config.js',
    ],
  },

  // Base configuration
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        Blob: 'readonly',
        Image: 'readonly',
        URL: 'readonly',
        Apex: 'readonly',
        ApexCharts: 'readonly',
        screen: 'readonly',
      },
    },
    plugins: {
      promise: promisePlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none'
      }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // Test files configuration
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
  },
]
