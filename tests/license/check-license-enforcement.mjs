/**
 * Guards against shipping a bundle that verifies licence signatures but fails to
 * act on the result.
 *
 * Signature verification is asynchronous (`crypto.subtle` has no sync API) while
 * the watermark decision is made synchronously during render. So a forged key is
 * accepted *provisionally*, and something must correct the chart once the real
 * verdict lands a microtask later. If that correction is missing, or reaches only
 * some charts, the library verifies signatures and enforces nothing.
 *
 * That is not hypothetical. 6.6.0 shipped exactly this: the correction walked
 * `Apex._chartInstances`, which a chart joins only when the user declares
 * `chart.id`, so on every anonymous chart a forged key was never caught. The
 * unit suite was green throughout, because it tested the verifier's mechanism
 * rather than the sequence a customer produces. Fixed in 6.6.1.
 *
 * So this drives the BUILT bundle through that exact sequence: setLicense,
 * render, wait for the verdict, look at the DOM. The `no-id` case is the one
 * that regressed and the reason this file exists.
 *
 * Usage:
 *   node tests/license/check-license-enforcement.mjs               # dist/apexcharts.esm.js
 *   node tests/license/check-license-enforcement.mjs <bundle-path>
 *
 * Set APEX_TEST_LICENSE_KEY to additionally assert a real production-signed key
 * is accepted. Skipped when unset, because that needs the private key.
 *
 * Run after `yarn build`. The publish workflow runs it before `npm publish`.
 */

import { existsSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { execFileSync } from 'child_process'

const SELF = fileURLToPath(import.meta.url)
const WATERMARK = '[data-apexcharts-watermark]'
const DEFAULT_BUNDLE = 'dist/apexcharts.esm.js'

const envelope = (payload) =>
  'APEX-' + Buffer.from(JSON.stringify(payload)).toString('base64')

const FORGED = () =>
  envelope({
    issueDate: '2026-07-01',
    expiryDate: '2099-12-31',
    plan: 'enterprise',
    // Structurally perfect, 64 bytes of nonsense: the shape an attacker
    // produces by editing the payload of a real key.
    sig: Buffer.alloc(64, 7).toString('base64'),
  })

const CASES = {
  // THE regression case. A forged key on a chart with no chart.id.
  'forged-no-id': { watermark: true, premium: true, id: false, key: FORGED },
  'forged-with-id': { watermark: true, premium: true, id: true, key: FORGED },
  // A key issued before signing existed. MUST keep working.
  unsigned: {
    watermark: false,
    premium: true,
    id: false,
    key: () =>
      envelope({ issueDate: '2025-01-01', expiryDate: '2099-12-31', plan: 'premium' }),
  },
  expired: {
    watermark: true,
    premium: true,
    id: false,
    key: () =>
      envelope({ issueDate: '2019-01-01', expiryDate: '2020-01-01', plan: 'premium' }),
  },
  'no-key': { watermark: true, premium: true, id: false, key: () => null },
  // A chart using nothing premium is never watermarked, whatever the key says.
  // Without this, a bundle that watermarked everything would pass every case
  // above while being catastrophically wrong for free users.
  'free-chart': { watermark: false, premium: false, id: false, key: FORGED },
  real: {
    watermark: false,
    premium: true,
    id: false,
    key: () => process.env.APEX_TEST_LICENSE_KEY ?? null,
    requiresEnv: 'APEX_TEST_LICENSE_KEY',
  },
}

/* ── worker: one case, in its own process ─────────────────────────────────── */

/**
 * One process per case, deliberately: LicenseManager caches a verdict per key
 * and the enforcer tracks charts across a page, so cases would contaminate each
 * other.
 */
async function runCase(bundlePath, caseName) {
  const { JSDOM } = await import('jsdom')
  const spec = CASES[caseName]
  const bundle = resolve(bundlePath)

  if (!existsSync(bundle)) {
    throw new Error(`built bundle not found at ${bundle} (run: yarn build)`)
  }

  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    pretendToBeVisual: true,
  })

  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)

  // Copy the window surface rather than guessing which DOM globals the bundle
  // touches. `crypto` is the one exception: jsdom's has no `subtle`, and
  // substituting it would make every signature "unverifiable", which is treated
  // as provisionally valid, so every case would pass while checking nothing.
  const KEEP_NODE = new Set([
    'crypto',
    'global',
    'globalThis',
    'process',
    'Buffer',
    'setTimeout',
    'clearTimeout',
  ])
  for (const name of Object.getOwnPropertyNames(dom.window)) {
    if (KEEP_NODE.has(name) || name in globalThis) continue
    try {
      globalThis[name] = dom.window[name]
    } catch {
      // Getter-only window properties; none of them matter here.
    }
  }

  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(0), 0)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)

  // The same shims tests/unit/setup.js installs for jsdom.
  const bbox = () => ({
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    top: 0,
    right: 10,
    bottom: 10,
    left: 0,
  })
  for (const C of [globalThis.SVGElement, globalThis.SVGGraphicsElement]) {
    if (C && typeof C.prototype.getBBox !== 'function') C.prototype.getBBox = bbox
  }

  // The ESM build reads a bare `Apex` global for chart-wide defaults (the UMD
  // build creates window.Apex itself), and it registers its SVG factory as
  // `window.SVG` then reads it back as `globalThis.SVG`. In a browser window and
  // globalThis are the same object; here they are not, so bridge them.
  globalThis.Apex = {}
  dom.window.Apex = globalThis.Apex

  const mod = await import(pathToFileURL(bundle).href)
  const ApexCharts = mod.default ?? mod.ApexCharts
  if (typeof ApexCharts !== 'function') {
    throw new Error(`no ApexCharts constructor exported from ${bundle}`)
  }

  for (const name of ['SVG', 'Apex']) {
    if (dom.window[name] !== undefined) globalThis[name] = dom.window[name]
  }

  const container = document.createElement('div')
  document.body.appendChild(container)

  const key = spec.key()
  if (key !== null) ApexCharts.setLicense(key)

  const chart = new ApexCharts(container, {
    chart: {
      type: 'line',
      width: 600,
      height: 400,
      animations: { enabled: false },
      ...(spec.id ? { id: 'enforcement-check' } : {}),
      // A premium feature, so the licence decision has an effect at all. Without
      // one, every case returns "no watermark" and the check proves nothing.
      ...(spec.premium ? { ink: { enabled: true } } : {}),
    },
    series: [{ name: 's', data: [3, 1, 4, 1, 5] }],
    xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
  })

  await chart.render()

  // Proves the fixture drew something, so "no watermark" means the licence was
  // accepted rather than the chart never rendering.
  const rendered = !!container.querySelector('svg')
  const immediately = !!container.querySelector(WATERMARK)

  // The verdict settles a microtask after importKey/verify, then enforcement
  // re-runs. Several turns of the loop, so a slow verify is not mistaken for a
  // verdict.
  for (let i = 0; i < 25; i++) await new Promise((r) => setTimeout(r, 4))

  const settled = !!container.querySelector(WATERMARK)
  return { rendered, immediately, settled }
}

/* ── driver ───────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2)
const workerIdx = args.indexOf('--worker')

if (workerIdx !== -1) {
  const [bundlePath, caseName] = args.slice(workerIdx + 1)
  try {
    const r = await runCase(bundlePath, caseName)
    process.stdout.write(JSON.stringify(r))
    process.exit(0)
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message }))
    process.exit(1)
  }
}

const bundlePath = args.find((a) => !a.startsWith('-')) ?? DEFAULT_BUNDLE

let failed = false
console.log(`Licence enforcement in ${bundlePath}`)

for (const [caseName, spec] of Object.entries(CASES)) {
  if (spec.requiresEnv && !process.env[spec.requiresEnv]) {
    console.log(`    ${caseName}: skipped (set ${spec.requiresEnv})`)
    continue
  }

  let out
  try {
    out = JSON.parse(
      execFileSync('node', [SELF, '--worker', bundlePath, caseName], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    )
  } catch (err) {
    // A non-zero worker still prints its JSON on stdout.
    try {
      out = JSON.parse(err.stdout || '{}')
    } catch {
      out = {
        error: (err.stderr || err.message || '')
          .split('\n')
          .slice(-6)
          .join(' ')
          .trim(),
      }
    }
  }

  if (out.error) {
    failed = true
    console.log(`  ✗ ${caseName}: ERRORED — ${out.error}`)
  } else if (!out.rendered) {
    failed = true
    console.log(
      `  ✗ ${caseName}: FIXTURE DID NOT RENDER (no <svg>), so the result proves nothing`,
    )
  } else if (out.settled !== spec.watermark) {
    failed = true
    console.log(
      `  ✗ ${caseName}: watermark ${out.settled} but expected ${spec.watermark} (immediately=${out.immediately})`,
    )
  } else {
    console.log(
      `  ✓ ${caseName}: ok (immediately=${out.immediately}, settled=${out.settled})`,
    )
  }
}

if (failed) {
  console.error('\nLicence enforcement is broken in the built bundle. Do NOT publish.')
  console.error(
    'A forged key that is not watermarked means signatures are verified and ignored.',
  )
  process.exit(1)
}
console.log('\nThe built bundle enforces the licence verdict it computes.')
