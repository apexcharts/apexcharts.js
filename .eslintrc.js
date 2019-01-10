module.exports = {
    root: true,
    env: {
        browser: true,
        node: true
    },
    extends: ['plugin:prettier/recommended'],
    "globals": {
        "Blob": true,
        "Image": true,
        "URL": true,
        "Apex": true,
        "ApexCharts": true,
        "screen": true
    },
    parserOptions: {
        ecmaVersion: 2018,
        parser: 'babel-eslint',
        sourceType: 'module'
    },
    rules: {

        'space-before-function-paren': 0 // Do not clash with Prettier
    }
};