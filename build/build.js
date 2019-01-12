const fs = require('fs')
const zlib = require('zlib')
const path = require('path')
const rollup = require('rollup')
const terser = require('terser')
const chalk = require('chalk')

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

const builds = require('./config').getAllBuilds()


// Execute build directly
build(builds)
  .then((r) => {
    console.log(chalk.green('Build Completed'))
  })
  .catch((e) => {
    console.log(chalk.red(e))
    throw e
  })

/**
 //Run all builds from configurations received
 */
async function build(builds) {
  for (const key in builds) {
    if (builds.hasOwnProperty(key)) {
      const buildConfig = builds[key]
      await executeBuildEntry(buildConfig)
    }
  }
}

/**
 * Build and compress code with Rollup and Terser from build configuration
 * @param {*} buildConfig Represent the Rollup configuration of the build
 */
async function executeBuildEntry(buildConfig) {
  const outputLocation = buildConfig.output
  const { file, banner } = outputLocation
  const isProd = /min\.js$/.test(file)
  const buildBundle = await rollup.rollup(buildConfig)
  const generated = await buildBundle.generate(outputLocation)
  let code = generated.output[0].code
  if (isProd) {
    const minified =
      (banner ? banner + '\n' : '') +
      terser.minify(code, {
        output: {
          ascii_only: true
        },
        compress: {
          pure_funcs: ['makeMap']
        }
      }).code
    return outputFile(file, minified, true)
  }
  return outputFile(file, code)
}

/**
 * Write build output to disk, and log its size
 * @param {string} dest Output file path
 * @param {string} content Content of the file
 * @param {boolean} testZip Should it check gzip size
 */
async function outputFile(dest, content, testZip) {
  await fs.promises.writeFile(dest, content)
  if (testZip) {
    const zipResult = zlib.gzipSync(content)
    console.log(
      'Build output: ',
      chalk.blue(path.relative(process.cwd(), dest)),
      ' ',
      chalk.green.bold(getSize(content)),
      `| ${chalk.green.bold(getSize(zipResult))} gzipped`
    )
  } else {
    console.log(
      'Build output: ',
      chalk.blue(path.relative(process.cwd(), dest)),
      ' ',
      chalk.green.bold(getSize(content))
    )
  }
}

/**
 * Get content size in KB
 * @param {string} content Content to check size
 */
function getSize(content) {
  return (content.length / 1024).toFixed(2) + 'kb'
}
