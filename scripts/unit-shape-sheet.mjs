/**
 * Contact sheet for the unit-shape catalog.
 *
 * The shape lint proves a shape is sound: exact dot count, dots inside the
 * outline, none overlapping, even density. It cannot tell you the tree looks
 * like a tree. This renders the catalog as dots so that can be judged by eye,
 * which is the only test that matters for a shape.
 *
 *   node scripts/unit-shape-sheet.mjs                     # whole catalog
 *   node scripts/unit-shape-sheet.mjs leaf cloud sun      # just these
 *   node scripts/unit-shape-sheet.mjs --count 220 leaf    # at a given dot count
 *   node scripts/unit-shape-sheet.mjs --counts leaf       # one shape, four counts
 *
 * Writes an SVG next to itself in the OS temp dir and prints the path.
 */
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { catalog } from '../src/unit-shapes/catalog.js'

const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(name)
  if (i === -1) return fallback
  const v = argv[i + 1]
  argv.splice(i, v && !v.startsWith('--') ? 2 : 1)
  return v === undefined || v.startsWith('--') ? true : v
}

const perShapeCounts = !!flag('--counts', false)
const count = parseInt(String(flag('--count', '820')), 10)
const names = argv.filter((a) => !a.startsWith('--'))

const shapes = names.length
  ? names.map((n) => {
      const s = catalog.find((c) => c.shape.name === n)
      if (!s) throw new Error(`no shape named "${n}"`)
      return s
    })
  : catalog

const CELL = 300
const PAD = 12
const LABEL = 22
const COLS = perShapeCounts ? 4 : Math.min(5, Math.max(1, shapes.length))

/** One cell: a shape's dots at a dot count, plus its caption. */
function cell(shape, n, ox, oy) {
  const objects = []
  for (let i = 0; i < n; i++) objects.push({ id: `d${i}`, seriesIndex: 0, r: 4 })
  const rect = { x: 0, y: 0, width: CELL, height: CELL }
  const t0 = performance.now()
  const placed = shape(objects, rect)
  const ms = Math.round(performance.now() - t0)

  const dots = placed
    .map(
      (p) =>
        `<circle cx="${(ox + p.x).toFixed(2)}" cy="${(oy + p.y).toFixed(2)}" r="${(
          p.r || 4
        ).toFixed(2)}"/>`,
    )
    .join('')
  const caption = `${shape.shape.name} · ${placed.length}/${n} dots · ${ms}ms`
  return (
    `<g fill="#008FFB">${dots}</g>` +
    `<text x="${ox + CELL / 2}" y="${oy + CELL + 15}" text-anchor="middle" ` +
    `font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" fill="#5b6b78">` +
    `${caption}</text>`
  )
}

const items = perShapeCounts
  ? shapes.flatMap((s) =>
      [s.shape.minUnits || 40, 220, 820, 2000].map((n) => ({ s, n })),
    )
  : shapes.map((s) => ({ s, n: count }))

const rows = Math.ceil(items.length / COLS)
const W = COLS * (CELL + PAD) + PAD
const H = rows * (CELL + PAD + LABEL) + PAD

const body = items
  .map(({ s, n }, i) => {
    const ox = PAD + (i % COLS) * (CELL + PAD)
    const oy = PAD + Math.floor(i / COLS) * (CELL + PAD + LABEL)
    return cell(s, n, ox, oy)
  })
  .join('\n')

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" ` +
  `viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#fff"/>\n${body}\n</svg>`

const out = join(tmpdir(), 'unit-shape-sheet.svg')
writeFileSync(out, svg)

// --png also rasterises it, for viewers that only take bitmaps.
if (flag('--png', false)) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  await page.setContent(svg)
  const png = join(tmpdir(), 'unit-shape-sheet.png')
  await page.screenshot({ path: png, fullPage: true })
  await browser.close()
  console.log(png)
} else {
  console.log(out)
}
