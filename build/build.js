const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const terser = require('terser')


if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}