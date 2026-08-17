import { build } from 'vite'
import { readFileSync } from 'fs'
import { gzipSync } from 'zlib'
import chalk from 'chalk'
import { SUB_ENTRIES, UMD_ENTRIES } from '../vite.config.mjs'

// Build all formats in two passes:
//   Pass 1 — full bundle (apexcharts.esm.js / .common.js / .js / .min.js)
//   Pass 2 — sub-entries (line/bar/etc. .esm.js / .common.js) one at a time
async function buildAll() {
  console.log(chalk.blue('Building ApexCharts...'))

  try {
    // ── Pass 1: full bundle ───────────────────────────────────────────────
    console.log(chalk.cyan('\n📦 Building full bundle (all 4 formats)...'))
    await build({ mode: 'production' })

    // ── Pass 2: sub-entries (ESM + CJS only, no UMD) ─────────────────────
    console.log(chalk.cyan('\n📦 Building sub-entries...'))
    for (const [name, file] of Object.entries(SUB_ENTRIES)) {
      process.stdout.write(chalk.gray(`  • ${name}... `))
      process.env.APEX_ENTRY_NAME = name
      process.env.APEX_ENTRY_FILE = file
      await build({ mode: 'sub-entry' })
      process.stdout.write(chalk.green('done\n'))
    }

    // ── Pass 3: script-loadable (UMD) builds for opt-in sub-entries ──────
    const umdNames = Object.keys(UMD_ENTRIES)
    if (umdNames.length) {
      console.log(chalk.cyan('\n📦 Building script-loadable (UMD) entries...'))
      for (const name of umdNames) {
        process.stdout.write(chalk.gray(`  • ${name}... `))
        process.env.APEX_ENTRY_NAME = name
        process.env.APEX_ENTRY_FILE = UMD_ENTRIES[name].file
        await build({ mode: 'sub-entry-umd' })
        process.stdout.write(chalk.green('done\n'))
      }
    }

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
