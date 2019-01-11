const fs = require('fs')
const zlib = require('zlib')
const path = require('path')
const rollup = require('rollup')
const terser = require('terser')
const chalk = require('chalk')

if (!fs.existsSync('dist2')) {
  fs.mkdirSync('dist2')
}

const builds = require('./config').getAllBuilds()

build(builds)
  .then((r) => {
    console.log(chalk.blue('Build Completed'))
  })
  .catch((e) => {
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
  const isProd = /min\.js$/.test(file)
  const buildBundle = await rollup.rollup(buildConfig)
  const generated = await buildBundle.generate(outputLocation)
  let code = generated.output[0].code
  if (isProd) {
    const minified = terser.minify(code, {
      output: {
        ascii_only: true
      },
      compress: {
        pure_funcs: ['makeMap']
      }
    })
    return outputFile(file, minified.code, true)
  }
  return outputFile(file, code)
}

async function outputFile(dest, content, testZip) {
  await fs.promises.writeFile(dest, content)
  if (testZip) {
    const zipResult = zlib.gzipSync(content)
    console.log(
      chalk.blue(path.relative(process.cwd(), dest)),
      ' ',
      getSize(content),
      `(gzipped: ${getSize(zipResult)})`
    )
  } else {
    console.log(
      chalk.blue(path.relative(process.cwd(), dest)),
      ' ',
      getSize(content)
    )
  }
}

function getSize(content) {
  return (content.length / 1024).toFixed(2) + 'kb'
}
