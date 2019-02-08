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
    extends: ['plugin:prettier/recommended'],
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
        'space-before-function-paren': 0 // Do not clash with Prettier
    }
};