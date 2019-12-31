const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const { executeBuildEntry, getAllBuilds } = require('./config')

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

// Execute build directly
Promise.all(getAllBuilds().map((buildConfig) => buildFromConfig(buildConfig)))
  .then(() => {
    console.log(chalk.green('Build Completed'))
  })
  .catch((e) => {
    console.log(chalk.red(e))
    throw e
  })

/**
 * Write build output to disk, and log its size
 * @param {string} dest Output file path
 * @param {string} content Content of the file
 * @param {boolean} testZip Should it check gzip size
 */
async function buildFromConfig(config) {
  const build = await executeBuildEntry(config)

  if (!build.isDev) {
    const zipResult = zlib.gzipSync(build.code)
    console.log(
      'Build output: ',
      chalk.blue(path.relative(process.cwd(), build.path)),
      ' ',
      chalk.green.bold(getSize(build.code)),
      `| ${chalk.green.bold(getSize(zipResult))} gzipped`
    )
  } else {
    console.log(
      'Build output: ',
      chalk.blue(path.relative(process.cwd(), build.path)),
      ' ',
      chalk.green.bold(getSize(build.code))
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
