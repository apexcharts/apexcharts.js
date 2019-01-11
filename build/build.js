const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const terser = require('terser')
const chalk = require('chalk')

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

const builds = require('./config').getAllBuilds()

build(builds).then((r) => {
  console.log(chalk.blue('Build Completed'))
}).catch((e) => {
  console.log(chalk.red(e))
  throw e
})

async function build(builds) {
  for (const key in builds) {
    if (builds.hasOwnProperty(key)) {
      const buildConfig = builds[key]
      await executeBuildEntry(buildConfig)
    }
  }
}

async function executeBuildEntry(buildConfig) {
  const outputLocation = buildConfig.output
  const { file, banner } = outputLocation
  const buildBundle = await rollup.rollup(buildConfig)
  const generated = await buildBundle.generate(outputLocation)
  return outputFile(file, generated.code)
}

async function outputFile(dest, content, shouldZip) {

}

function getSize(content) {
  return (content.length / 1024).toFixed(2) + 'kb'
}
