import { build } from 'vite'
import { readFileSync } from 'fs'
import chalk from 'chalk'
import { gzipSize } from './gzip-size.mjs'
import { SUB_ENTRIES, UMD_ENTRIES } from '../vite.config.mjs'

// Build all formats in three passes:
//   Pass 1: default bundle (apexcharts.esm.js / .common.js / .js / .min.js)
//   Pass 2: sub-entries (line/bar/etc. .esm.js / .common.js) one at a time
//   Pass 3: script-loadable add-ons and the lean-core and full baselines
async function buildAll() {
  console.log(chalk.blue('Building ApexCharts...'))

  try {
    // ── Pass 1: default bundle ────────────────────────────────────────────
    console.log(chalk.cyan('\n📦 Building default bundle (all 4 formats)...'))
    await build({ mode: 'production' })

    // Re-emit the ESM + CJS halves with apexcharts/core external, so the
    // default bundle and the add-ons share one core. Runs after the pass above
    // (which empties dist/) and overwrites its two files; the UMD pair it wrote
    // stays, because a script tag needs a self-contained file.
    await build({ mode: 'full-esm' })

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

// Whole bytes, measured by gzip-size.mjs, so the gzip column here is the same
// number the release notes publish and `npm run check:size` budgets.
function showBuildStats() {
  const files = [
    { path: 'dist/apexcharts.js', label: 'UMD (debug)' },
    { path: 'dist/apexcharts.min.js', label: 'UMD (minified)' },
    { path: 'dist/apexcharts.core.min.js', label: 'Lean core (minified)' },
    { path: 'dist/apexcharts.full.min.js', label: 'Full (minified)' },
    { path: 'dist/apexcharts.esm.js', label: 'ESM' },
    { path: 'dist/apexcharts.common.js', label: 'CommonJS' },
  ]
  const n = (v) => v.toLocaleString('en-US')

  console.log(chalk.blue('\n📊 Build outputs:'))

  files.forEach(({ path, label }) => {
    try {
      const buf = readFileSync(path)

      console.log(
        chalk.gray('  •'),
        chalk.cyan(label.padEnd(22)),
        chalk.green(`${n(buf.length)} B`.padStart(12)),
        chalk.gray('|'),
        chalk.green(`${n(gzipSize(buf))} B gzip`)
      )
    } catch (err) {
      // File might not exist, skip
    }
  })
}

buildAll()
