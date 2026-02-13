import { build } from 'vite'
import { readFileSync } from 'fs'
import { gzipSync } from 'zlib'
import chalk from 'chalk'

// Build all formats in a single pass
async function buildAll() {
  console.log(chalk.blue('Building ApexCharts...'))

  try {
    console.log(chalk.cyan('\n📦 Building all formats...'))
    await build({ mode: 'production' })

    // Show build stats
    showBuildStats()

    console.log(chalk.green('\n✅ Build completed successfully!'))
  } catch (error) {
    console.error(chalk.red('Build failed:'), error)
    process.exit(1)
  }
}

function showBuildStats() {
  const files = [
    { path: 'dist/apexcharts.js', label: 'UMD (debug)' },
    { path: 'dist/apexcharts.min.js', label: 'UMD (minified)' },
    { path: 'dist/apexcharts.esm.js', label: 'ESM' },
    { path: 'dist/apexcharts.common.js', label: 'CommonJS' },
  ]

  console.log(chalk.blue('\n📊 Build outputs:'))

  files.forEach(({ path, label }) => {
    try {
      const content = readFileSync(path, 'utf-8')
      const size = (content.length / 1024).toFixed(2)
      const gzipped = (gzipSync(content).length / 1024).toFixed(2)

      console.log(
        chalk.gray('  •'),
        chalk.cyan(label.padEnd(20)),
        chalk.green(`${size}kb`),
        chalk.gray('|'),
        chalk.green(`${gzipped}kb gzipped`)
      )
    } catch (err) {
      // File might not exist, skip
    }
  })
}

buildAll()
