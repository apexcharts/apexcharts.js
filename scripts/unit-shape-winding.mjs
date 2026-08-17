/**
 * Winding check for a unit-shape outline.
 *
 *   node scripts/unit-shape-winding.mjs '<path data>'
 *
 * A multi-subpath shape fills under the nonzero rule, so whether a subpath ADDS
 * to the shape or cuts a HOLE in it depends on which way round it is wound
 * relative to the first one. Nothing about the path data makes that visible, and
 * getting it backwards produces a shape that still renders, still passes the
 * geometry lint, and looks deliberate: a car whose wheels are bored through it, a
 * graduation cap that is a diamond ring, a fish whose tail is bitten out of its
 * body. This prints the signed area of every subpath and says which way each one
 * will go, so the answer is known before the shape is drawn rather than after
 * someone notices.
 *
 * Uses the same flattener the packer uses, so the answer is the packer's answer.
 */
import { flattenPath, signedArea } from '../src/unit-shapes/engine/path.js'

const d = process.argv[2]
if (!d) {
  console.error("usage: node scripts/unit-shape-winding.mjs '<path data>'")
  process.exit(1)
}

const polys = flattenPath(d)
if (!polys.length) {
  console.error('no subpaths parsed: check the path data')
  process.exit(1)
}

const ref = signedArea(polys[0])
polys.forEach((p, i) => {
  const a = signedArea(p)
  const role = i === 0 ? 'outline' : (a < 0) !== (ref < 0) ? 'HOLE' : 'union'
  console.log(
    `subpath ${String(i).padStart(2)}  area ${a.toFixed(1).padStart(10)}  ${role}`,
  )
})

const holes = polys.slice(1).filter((p) => (signedArea(p) < 0) !== (ref < 0)).length
console.log(
  `\n${polys.length} subpath(s): ${holes} cut holes, ${polys.length - 1 - holes} union.`,
)
console.log('Reverse a subpath to flip it (for an arc, flip the sweep flag).')
