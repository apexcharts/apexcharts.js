module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2018,
        parser: 'babel-eslint',
        sourceType: 'module'
    },
    env: {
        browser: true,
        es6: true,
        node: true
    },
    extends: [
        'plugin:prettier/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
    ],
    plugins: ['promise'],
    globals: {
        "Blob": true,
        "Image": true,
        "URL": true,
        "Apex": true,
        "ApexCharts": true,
        "screen": true
    },
    rules: {
        // Remove this when prettier 2.0 is out
        'space-before-function-paren': 0, // Do not clash with Prettier
        'no-shadow': 1,
        'no-undef': 1,
        'no-unused-vars': [1, {vars: 'all', args: 'none', ignoreRestSiblings: true}],
        'constructor-super': 1,
        'no-const-assign': 1,
        'no-dupe-class-members': 1,
        'no-var': 1,
        'object-shorthand': [1, 'always'],
        'prefer-arrow-callback': [
            1,
            {
                allowNamedFunctions: false,
                allowUnboundThis: true,
            },
        ],
        // 'prefer-const': [
        //     1,
        //     {
        //         destructuring: 'any',
        //         ignoreReadBeforeAssign: true,
        //     },
        // ],
        'no-cond-assign': [1, 'always'],
        'no-dupe-args': 1,
        'no-dupe-keys': 1,
        'no-inner-declarations': 1,
        'no-invalid-regexp': 1,
        'no-sparse-arrays': 1,
        'no-unreachable': 1,
        'dot-notation': [1, {allowKeywords: true}],
        'eqeqeq': [1, 'always', {null: 'ignore'}],
        'no-eval': 1,
        'radix': 1,
        'no-return-assign': [1, 'always'],
        'no-useless-return': 1,
        'no-sequences': 1,
        'no-extend-native': 1,
        'no-fallthrough': 1,
        'no-global-assign': [1, {exceptions: []}],
        'no-implied-eval': 1,
        'no-lone-blocks': 1,
        'no-multi-str': 1,
        'no-useless-escape': 1,

        'promise/no-promise-in-callback': 1,
        'promise/no-callback-in-promise': 1,
        "promise/valid-params": 1,
    },
    overrides: [
        {
            files: ['tests/unit/**/*.js'],
            globals: {
                describe: true,
                it: true,
                expect: true,
            },
        },
    ],
};