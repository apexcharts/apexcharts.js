/**
 * E2E test build helper
 * Simplified replacement for the old build/config.js used by e2e tests
 */

const path = require('path')
const fs = require('fs')

const rootDir = path.resolve(__dirname, '..')

/**
 * Build configuration for e2e tests
 * Mimics the old Rollup builds object structure
 */
const builds = {
  'web-umd-dev': {
    entry: path.join(rootDir, 'src/apexcharts.js'),
    dest: path.join(rootDir, 'dist/apexcharts.js'),
    format: 'umd',
    env: 'development',
  }
}

/**
 * Execute a build entry
 * For e2e tests, we use the already-built dist/apexcharts.js
 * For istanbul instrumented builds, we copy and potentially instrument
 * 
 * @param {Object} options Build options
 * @returns {Promise<Object>} Build result with path and code
 */
async function executeBuildEntry(options) {
  const sourcePath = path.join(rootDir, 'dist/apexcharts.js')
  const destPath = options.dest || builds['web-umd-dev'].dest
  
  // Check if source exists
  if (!fs.existsSync(sourcePath)) {
    throw new Error(
      `Build file not found: ${sourcePath}\n` +
      `Run "npm run build" first to generate the required files.`
    )
  }
  
  // For istanbul instrumented builds, just copy the unminified version
  // Coverage will be collected via Puppeteer's built-in coverage API
  if (options.istanbul) {
    const code = fs.readFileSync(sourcePath, 'utf-8')
    
    // Ensure destination directory exists
    const destDir = path.dirname(destPath)
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    
    // Write the file
    fs.writeFileSync(destPath, code)
    
    return {
      path: destPath,
      code: code,
      isDev: true,
    }
  }
  
  const code = fs.readFileSync(destPath, 'utf-8')
  
  return {
    path: destPath,
    code: code,
    isDev: /apexcharts\.js$/.test(destPath),
  }
}

module.exports = { builds, executeBuildEntry }
