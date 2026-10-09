/**
 * Build tree-shaking demo bundles and report sizes.
 *
 * Bundles each demo's import set through Rollup + terser (same as production)
 * and prints a size comparison table.
 *
 * Usage:  node build/build-demos.mjs
 *         yarn build:demos
 */

import { rollup } from 'rollup'
import terser from '@rollup/plugin-terser'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync, statSync, writeFileSync, unlinkSync, readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const DEMOS = [
  {
    name: 'full-bundle',
    description: 'Full bundle (baseline)',
    imports: [`import '${root}/src/entries/standard.js'`],
  },
  {
    name: 'minimal-line',
    description: 'core + line + legend',
    imports: [
      `import '${root}/src/entries/core.js'`,
      `import '${root}/src/entries/line.js'`,
      `import '${root}/src/features/legend.js'`,
    ],
  },
  {
    name: 'minimal-bar',
    description: 'core + bar + legend',
    imports: [
      `import '${root}/src/entries/core.js'`,
      `import '${root}/src/entries/bar.js'`,
      `import '${root}/src/features/legend.js'`,
    ],
  },
  {
    name: 'minimal-pie',
    description: 'core + pie',
    imports: [
      `import '${root}/src/entries/core.js'`,
      `import '${root}/src/entries/pie.js'`,
    ],
  },
  {
    name: 'line-toolbar',
    description: 'core + line + legend + toolbar',
    imports: [
      `import '${root}/src/entries/core.js'`,
      `import '${root}/src/entries/line.js'`,
      `import '${root}/src/features/legend.js'`,
      `import '${root}/src/features/toolbar.js'`,
    ],
  },
  {
    name: 'line-annotations',
    description: 'core + line + annotations',
    imports: [
      `import '${root}/src/entries/core.js'`,
      `import '${root}/src/entries/line.js'`,
      `import '${root}/src/features/annotations.js'`,
    ],
  },
  {
    name: 'bar-exports',
    description: 'core + bar + legend + toolbar + exports',
    imports: [
      `import '${root}/src/entries/core.js'`,
      `import '${root}/src/entries/bar.js'`,
      `import '${root}/src/features/legend.js'`,
      `import '${root}/src/features/toolbar.js'`,
      `import '${root}/src/features/exports.js'`,
    ],
  },
  {
    name: 'dashboard',
    description: 'core + line + bar + pie + legend',
    imports: [
      `import '${root}/src/entries/core.js'`,
      `import '${root}/src/entries/line.js'`,
      `import '${root}/src/entries/bar.js'`,
      `import '${root}/src/entries/pie.js'`,
      `import '${root}/src/features/legend.js'`,
    ],
  },
]

const outDir = resolve(root, 'dist/demos')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

// Stub CSS imports as empty strings (we're measuring JS size, not CSS)
function jsonPlugin() {
  return {
    name: 'json',
    transform(code, id) {
      if (id.endsWith('.json')) return `export default ${code}`
    },
  }
}

function stubCss() {
  return {
    name: 'stub-css',
    transform(code, id) {
      if (!id.endsWith('.js') || id.includes('node_modules')) return
      return code.replace(
        /import\s+\w+\s+from\s+['"][^'"]+\.css['"]/g,
        '/* css stubbed */'
      )
    },
  }
}

// Inline SVG files as string exports
function svgInlineLoader() {
  return {
    name: 'svg-inline-loader',
    load(id) {
      if (id.endsWith('.svg')) {
        const svg = readFileSync(id, 'utf-8')
        return `export default ${JSON.stringify(svg)}`
      }
    },
  }
}

const results = []
const tmpEntry = resolve(root, '_demo-entry-tmp.js')

for (const demo of DEMOS) {
  process.stdout.write(`  Building ${demo.name}...`)

  writeFileSync(tmpEntry, demo.imports.join('\n') + '\n')

  const bundle = await rollup({
    input: tmpEntry,
    treeshake: true,
    plugins: [jsonPlugin(), stubCss(), svgInlineLoader(), terser()],
    onwarn() {},
  })

  const outFile = resolve(outDir, `${demo.name}.js`)
  await bundle.write({ format: 'es', file: outFile })
  await bundle.close()

  const size = statSync(outFile).size
  results.push({ name: demo.name, description: demo.description, bytes: size })
  process.stdout.write(` ${(size / 1024).toFixed(1)} KB\n`)
}

unlinkSync(tmpEntry)

const baseline = results.find((r) => r.name === 'full-bundle')

console.log('\n' + '─'.repeat(78))
console.log(
  `${'Demo'.padEnd(20)} ${'Imports'.padEnd(38)} ${'  Size'} ${'  vs full'}`,
)
console.log('─'.repeat(78))

for (const r of results) {
  const kb = (r.bytes / 1024).toFixed(1) + ' KB'
  const pct =
    r.name === 'full-bundle'
      ? '(baseline)'
      : ((r.bytes / baseline.bytes) * 100).toFixed(0) + '%'
  console.log(
    `${r.name.padEnd(20)} ${r.description.padEnd(38)} ${kb.padStart(7)} ${pct.padStart(10)}`,
  )
}
console.log('─'.repeat(78))
console.log(`\nBundles written to dist/demos/\n`)
