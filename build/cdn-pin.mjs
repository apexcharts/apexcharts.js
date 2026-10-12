/**
 * The exact-version CDN URLs in the install snippets.
 *
 * The README, the website's installation page, the website's llms.txt
 * generator and the skill (its rules and its script-tag section) each show a
 * CDN URL pinned to one release (`.../apexcharts/8.1.0/apexcharts.min.js`,
 * `.../npm/apexcharts@8.1.0/dist/...`). A page or an assistant that has to
 * name an exact version copies that pattern, and with no versioned URL of ours
 * to copy, it falls back to the 3.x URLs that fill the older web. A pin that
 * goes stale teaches an old version the same way, so this moves every pin to
 * `package.json`'s version in one pass:
 *
 *   node build/cdn-pin.mjs           rewrite the pins
 *   node build/cdn-pin.mjs --check   list the stale ones and exit 1
 *   node build/cdn-pin.mjs --check --online
 *                                    also fetch every pinned URL (after publish)
 *
 * Run it in the `chore: bump` step. Only README.md is in this repo; the other
 * files are read from the sibling checkouts (`../website`,
 * `../apexcharts-skill`) and skipped when absent, so CI checks the README alone
 * (`tests/unit/cdn-pin.spec.js`).
 *
 * After every major release, `--check --online` is required, not optional: the
 * pins move at the bump, before any CDN has the version, and cdnjs mirrors on
 * its own schedule (it skipped 8.0.0). The release is not done until every URL
 * answers 200; the website's RELEASE-SYNC.md has the follow-up if one does not.
 *
 * Only exact `x.y.z` pins move. A major channel (`apexcharts@7` in a migration
 * guide's "stay on 7" advice) and the unversioned URL are left alone, and so are
 * the release posts, whose pin is the release they announce. A prerelease
 * version changes nothing: the pins stay on the last stable release.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = () => fileURLToPath(new URL('..', import.meta.url))

export const TARGETS = [
  { file: 'README.md', required: true },
  { file: '../website/nextjs/content/docs/apexcharts/installation.mdx' },
  { file: '../website/nextjs/scripts/generate-llms-txt.mjs' },
  { file: '../apexcharts-skill/SKILL.md' },
  { file: '../apexcharts-skill/.cursorrules' },
  { file: '../apexcharts-skill/references/framework-wrappers.md' },
]

// The version is group 2. `npm/apexcharts@` cannot match `react-apexcharts@`:
// the slash before it is part of the pattern.
const PIN =
  /(cdn\.jsdelivr\.net\/npm\/apexcharts@|unpkg\.com\/apexcharts@|cdnjs\.cloudflare\.com\/ajax\/libs\/apexcharts\/)(\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?)(?=\/)/g

/** Every pin in `text`, with its 1-based line. */
export function findPins(text) {
  const pins = []
  for (const m of text.matchAll(PIN)) {
    const line = text.slice(0, m.index).split('\n').length
    pins.push({ line, version: m[2], url: m[0] })
  }
  return pins
}

/**
 * Every whole pinned file URL in `text`. A URL that stops at the version
 * folder (a prefix the llms generator appends file names to) is left out.
 */
export function pinnedUrls(text) {
  const re = new RegExp(PIN.source + String.raw`[^\s"'\`)<>\\]*`, 'g')
  return [...text.matchAll(re)]
    .map((m) => `https://${m[0]}`)
    .filter((u) => !u.endsWith('/'))
}

/** `text` with every pin moved to `version`. */
export const stamp = (text, version) =>
  text.replace(PIN, (_, host) => host + version)

export const isPrerelease = (version) => version.includes('-')

/**
 * What is wrong with one file's pins: a file that should have a pin and has
 * none (a rewritten snippet would otherwise pass the check by having nothing
 * to check), or each pin that is not `version`.
 */
export function problems(text, version, file) {
  const pins = findPins(text)
  if (!pins.length) return [`${file}: no exact-version CDN URL found`]
  return pins
    .filter((p) => p.version !== version)
    .map((p) => `${file}:${p.line}: ${p.url} (expected ${version})`)
}

async function main() {
  const check = process.argv.includes('--check')
  const online = process.argv.includes('--online')
  const dir = root()
  const { version } = JSON.parse(
    readFileSync(path.join(dir, 'package.json'), 'utf-8'),
  )
  if (isPrerelease(version)) {
    console.log(
      `cdn-pin: ${version} is a prerelease; pins stay on the last stable release`,
    )
    return
  }

  const found = []
  const urls = new Set()
  for (const t of TARGETS) {
    const abs = path.resolve(dir, t.file)
    if (!existsSync(abs)) {
      if (t.required) found.push(`${t.file}: missing`)
      else console.log(`cdn-pin: skipped ${t.file} (not checked out)`)
      continue
    }
    const text = readFileSync(abs, 'utf-8')
    if (check) {
      found.push(...problems(text, version, t.file))
      pinnedUrls(text).forEach((u) => urls.add(u))
      continue
    }
    const next = stamp(text, version)
    if (!findPins(next).length)
      found.push(`${t.file}: no exact-version CDN URL found`)
    if (next !== text) {
      writeFileSync(abs, next)
      console.log(`cdn-pin: ${t.file} -> ${version}`)
    }
  }

  // A CDN can skip a release: cdnjs never mirrored 8.0.0. Only meaningful once
  // the version is on npm, so it is a flag rather than part of the bump check.
  if (check && online) {
    const results = await Promise.all(
      [...urls].map(async (u) => {
        const res = await fetch(u, { method: 'HEAD' }).catch((e) => ({
          status: e.message,
        }))
        return res.status === 200 ? null : `${u}: ${res.status}`
      }),
    )
    found.push(...results.filter(Boolean))
  }

  if (found.length) {
    console.error(found.join('\n'))
    if (check)
      console.error(`\nRun \`npm run cdn:pin\` to move them to ${version}.`)
    process.exit(1)
  }
  if (check) {
    const served = online ? `, and all ${urls.size} URLs answer 200` : ''
    console.log(`cdn-pin: every pin is ${version}${served}`)
  }
}

if (process.argv[1] && process.argv[1].endsWith('cdn-pin.mjs')) main()
