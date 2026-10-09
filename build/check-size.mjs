/**
 * The bundle-size budget.
 *
 * `dist/apexcharts.min.js` is the file a theme drops in with a script tag and
 * the number the size claim is made from; `dist/apexcharts.core.min.js` is the
 * floor every slim build stands on; `dist/apexcharts.full.min.js` is the one
 * with everything. Each has a ceiling in `build/size-budget.json`, and this
 * fails the build that crosses it.
 *
 * Two structural checks ride along, because each catches a build that is
 * wrong rather than large. The full file must be larger than the default one
 * (`largerThan`): if it is not, it lost what it exists to carry. And every
 * script-tag add-on must stay under one ceiling (`addons`): an add-on resolves
 * core off the page's global, and one that inlines core by mistake is 140 KB
 * or more where the largest real one is under 30 KB.
 *
 * The list of features in the default bundle is already guarded
 * (`tests/unit/feature-tier-budget.spec.js`), and it was not enough: 7.9.0 grew
 * `apexcharts.min.js` by 24,291 B and the core by 16,592 B without a single
 * feature being added, all of it inside modules that were already admitted. Only
 * a byte count sees that.
 *
 * A budget is raised the same way it is spent: deliberately, in the same change,
 * as a one-line edit to the JSON that a reviewer reads, with the commit body
 * saying what the bytes buy. It is lowered after each release with `--ratchet`,
 * which only ever lowers.
 *
 * Before measuring, it checks the file IS a production build. A development
 * build (`npm run dev`, or a watcher left running) writes an unminified
 * `apexcharts.min.js` as large as `apexcharts.js`, with source maps beside it,
 * and `vite build --mode production` on its own empties `dist/` and builds only
 * the default bundle. Measured blind, the first fails for the wrong reason and
 * the second is a skipped check that looks like a pass.
 *
 * Usage, after `npm run build`:
 *   npm run check:size
 *   npm run check:size -- --compare-ref HEAD   # adds a column against a committed dist
 *   npm run check:size -- --ratchet            # after a release: lower budgets to fit
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
  statSync,
  appendFileSync,
} from 'fs'
import { execFileSync } from 'child_process'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { gzipSize } from './gzip-size.mjs'

// Resolved when run, not at import: under the unit suite's jsdom environment
// import.meta.url is not a file: URL, and the spec only needs the helpers.
const root = () => fileURLToPath(new URL('..', import.meta.url))

const n = (v) => v.toLocaleString('en-US')

export const roundUp = (v, step = 500) => Math.ceil(v / step) * step

/**
 * The budget a file measured at `size` should carry: the size plus its slack,
 * rounded up to the step. One percent is about one or two ordinary minors of
 * growth, so each real step up is a decision rather than drift.
 */
export const budgetFor = (size, slack) =>
  roundUp(size * (1 + slack.pct), slack.step)

/**
 * Why `buf` is not a production build of this checkout, or an empty list.
 *
 * Every test here is something a real build was observed to get wrong. A terser
 * build starts with the banner at byte 0, has about 5 lines and is about 41% of
 * its unminified sibling. A development build has the banner inside the UMD
 * wrapper, tens of thousands of lines, a source map comment, and is 100% of its
 * sibling.
 */
export function integrity(buf, sibling, version) {
  const problems = []
  const head = buf.subarray(0, 120).toString('latin1')
  if (!head.startsWith(`/*!\n * ApexCharts v${version}\n`)) {
    const found = /ApexCharts v(\S+)/.exec(head)?.[1]
    problems.push(
      found && found !== version
        ? `its banner says v${found} and package.json says v${version}, so it is not a build of this checkout`
        : 'it does not start with the ApexCharts banner, so terser did not write it',
    )
  }
  if (
    buf
      .subarray(Math.max(0, buf.length - 200))
      .toString('latin1')
      .includes('sourceMappingURL')
  ) {
    problems.push(
      'it references a source map, which only a development build emits',
    )
  }
  let lines = 0
  for (const byte of buf) if (byte === 10) lines++
  if (lines > 20)
    problems.push(`it has ${n(lines)} lines where a minified build has about 5`)
  if (sibling && buf.length > sibling.length * 0.6) {
    const pct = Math.round((buf.length / sibling.length) * 100)
    problems.push(
      `it is ${pct}% of its unminified sibling's size where a minified build is about 41%`,
    )
  }
  return problems
}

/**
 * Failures for the add-on ceiling: every `[file, gzipBytes]` over `ceiling`.
 * A null size is a file the build did not write.
 */
export function addonProblems(sizes, ceiling) {
  const problems = []
  for (const [file, size] of sizes) {
    if (size == null) problems.push(`${file} is missing.`)
    else if (size > ceiling)
      problems.push(
        `${file} is ${n(size)} B gzipped, over the ${n(ceiling)} B add-on ceiling. An add-on that size has almost certainly inlined core: check that its UMD_ENTRIES item has \`shared: true\` and that build/shared-modules.mjs covers what it imports.`,
      )
  }
  return problems
}

/** The gzip size of `file` as committed at `ref`, or null where it does not exist. */
function sizeAt(ROOT, ref, file) {
  try {
    return gzipSize(
      execFileSync('git', ['show', `${ref}:${file}`], {
        cwd: ROOT,
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    )
  } catch {
    return null
  }
}

function sourceMaps(ROOT, dir) {
  const found = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) found.push(...sourceMaps(ROOT, p))
    else if (entry.endsWith('.map')) found.push(relative(ROOT, p))
  }
  return found
}

async function main() {
  const ROOT = root()
  const BUDGET = join(ROOT, 'build/size-budget.json')
  const args = process.argv.slice(2)
  const ratchet = args.includes('--ratchet')
  const compareRef = args.includes('--compare-ref')
    ? args[args.indexOf('--compare-ref') + 1]
    : null

  const { version } = JSON.parse(
    readFileSync(join(ROOT, 'package.json'), 'utf8'),
  )
  const budget = JSON.parse(readFileSync(BUDGET, 'utf8'))
  const dist = join(ROOT, 'dist')
  const failures = []
  const notices = []
  const rows = []

  if (!existsSync(dist)) {
    console.error('FAIL dist/ does not exist. Run `npm run build` first.')
    process.exit(1)
  }

  const maps = sourceMaps(ROOT, dist)
  if (maps.length) {
    failures.push(
      `dist/ holds ${maps.length} source map(s) (${maps.slice(0, 3).join(', ')}), which only a development build writes. Run \`npm run build\`.`,
    )
  }

  // A minified file nobody budgeted is a new baseline shipping unmeasured.
  for (const entry of readdirSync(dist)) {
    if (entry.endsWith('.min.js') && !budget.files[`dist/${entry}`]) {
      failures.push(
        `dist/${entry} has no budget. Add it to build/size-budget.json.`,
      )
    }
  }

  for (const [file, entry] of Object.entries(budget.files)) {
    const abs = join(ROOT, file)
    if (!existsSync(abs)) {
      failures.push(
        `${file} is missing. \`vite build --mode production\` on its own empties dist/ and builds only the default bundle; run \`npm run build\`.`,
      )
      continue
    }
    const buf = readFileSync(abs)
    const siblingPath = entry.minifiedFrom && join(ROOT, entry.minifiedFrom)
    const sibling =
      siblingPath && existsSync(siblingPath) ? readFileSync(siblingPath) : null
    const problems = integrity(buf, sibling, version)
    if (problems.length) {
      failures.push(
        `${file} is not a production build, so its size means nothing: ${problems.join('; ')}. Run \`npm run build\`.`,
      )
      continue
    }

    const size = gzipSize(buf)
    const over = size - entry.gzip
    rows.push({
      file,
      size,
      budget: entry.gzip,
      before: compareRef ? sizeAt(ROOT, compareRef, file) : undefined,
    })

    if (over > 0) {
      failures.push(
        `${file} is ${n(size)} B gzipped, ${n(over)} B over its ${n(entry.gzip)} B budget (+${((over / entry.gzip) * 100).toFixed(2)}%).\n` +
          `  If the growth is intended, raise "${file}" in build/size-budget.json in this same change, so the cost is in the diff a reviewer reads, and say in the commit body what the bytes buy.\n` +
          '  If it is not intended, find what grew before merging.',
      )
      continue
    }

    const slackName = entry.slack ?? 'default'
    const slack = budget.slack[slackName]
    if (!slack) {
      failures.push(
        `${file} uses slack "${slackName}", which build/size-budget.json does not define. Add it under "slack".`,
      )
      continue
    }
    const target = budgetFor(size, slack)
    if (target < entry.gzip) {
      if (ratchet) entry.gzip = rows.at(-1).budget = target
      else
        notices.push(
          `${file} has ${n(entry.gzip - size)} B of headroom. \`npm run check:size -- --ratchet\` lowers its budget to ${n(target)} B.`,
        )
    }
  }

  for (const [file, entry] of Object.entries(budget.files)) {
    if (!entry.largerThan) continue
    const self = rows.find((r) => r.file === file)
    const other = rows.find((r) => r.file === entry.largerThan)
    if (self && other && self.size <= other.size) {
      failures.push(
        `${file} is ${n(self.size)} B gzipped, no larger than ${entry.largerThan} at ${n(other.size)} B, so it is missing what it exists to carry. Check its entry imports everything outside the default bundle.`,
      )
    }
  }

  if (budget.addons) {
    // Read off the build config, so a new add-on is covered the day it ships.
    // Every UMD entry but the baselines (`alsoMin`), which have budgets of
    // their own: filtering on `shared` would skip exactly the add-on this
    // ceiling is for, the one that lost its `shared: true` and inlined core.
    const { UMD_ENTRIES } = await import('../vite.config.mjs')
    const sizes = Object.values(UMD_ENTRIES)
      .filter((e) => !e.alsoMin)
      .map((e) => {
        const file = `dist/${e.out}`
        const abs = join(ROOT, file)
        return [file, existsSync(abs) ? gzipSize(readFileSync(abs)) : null]
      })
    failures.push(...addonProblems(sizes, budget.addons.gzip))
    const largest = sizes
      .filter(([, s]) => s != null)
      .sort((a, b) => b[1] - a[1])[0]
    if (largest)
      notices.push(
        `${sizes.length} add-ons are under the ${n(budget.addons.gzip)} B ceiling; the largest is ${largest[0]} at ${n(largest[1])} B.`,
      )
  }

  const delta = (r) =>
    r.before == null
      ? 'new'
      : `${r.size - r.before >= 0 ? '+' : ''}${n(r.size - r.before)} B`
  for (const r of rows) {
    const vs = compareRef ? `  vs ${compareRef} ${delta(r).padStart(9)}` : ''
    console.log(
      `${r.file.padEnd(28)} ${n(r.size).padStart(9)} B  budget ${n(r.budget).padStart(9)} B  headroom ${n(r.budget - r.size).padStart(7)} B${vs}`,
    )
  }
  for (const m of notices) console.log(`note: ${m}`)

  if (process.env.GITHUB_STEP_SUMMARY && rows.length) {
    const head = compareRef
      ? `| file | gzip | budget | headroom | vs \`${compareRef}\` |\n|---|---:|---:|---:|---:|`
      : '| file | gzip | budget | headroom |\n|---|---:|---:|---:|'
    const body = rows.map(
      (r) =>
        `| \`${r.file}\` | ${n(r.size)} B | ${n(r.budget)} B | ${n(r.budget - r.size)} B |${compareRef ? ` ${delta(r)} |` : ''}`,
    )
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      ['### Bundle size', '', head, ...body, ''].join('\n') + '\n',
    )
  }

  if (failures.length) {
    for (const f of failures) console.error(`\nFAIL ${f}`)
    console.error(`\nMethod: ${budget.method}`)
    process.exit(1)
  }

  if (ratchet) {
    writeFileSync(BUDGET, JSON.stringify(budget, null, 2) + '\n')
    console.log(
      'Budgets ratcheted. Commit build/size-budget.json as `build(size): ratchet budgets to <version>`.',
    )
  }
}

// Only when run as a script, so the unit spec can import the pure helpers.
if (process.argv[1] && process.argv[1].endsWith('check-size.mjs')) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
