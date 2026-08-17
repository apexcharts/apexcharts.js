// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A graduation cap: graduates, enrolments, qualifications, courses completed.
 *
 * The board is a diamond, which is a flat square read in perspective, and the cap
 * hangs below it. The cap subpath is wound to match the board so the two union;
 * wound the other way it hollows the board out, leaving a diamond ring.
 *
 * The proportions are the whole difficulty. A tall cap hides the lower half of the
 * diamond, so all that is left is a peak over a box and the shape reads as a
 * house. The board has to stay flat and wide, and the cap narrow enough that both
 * of the diamond's lower edges stay visible either side of it.
 *
 * No tassel. At any dot count it would be a thin dangling line, and a line one
 * dot wide is a dotted line rather than a tassel.
 */
export const mortarboard = /* @__PURE__ */ silhouette({
  name: 'mortarboard',
  category: 'people',
  minUnits: 90,
  source: 'original',
  path:
    'M 50 18 L 98 36 L 50 54 L 2 36 Z '
    + 'M 33 44 L 50 50.5 L 67 44 L 67 62 C 67 74 33 74 33 62 Z',
})
