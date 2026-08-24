// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A standing figure: head, shoulders that slope into a torso, and two legs cut from one outline so the silhouette stays solid at small sizes.
 */
export const person = /* @__PURE__ */ definePictogram({
  name: 'person',
  category: 'people',
  source: 'original',
  path:
    // The head is two semicircular arcs, not one arc back to its own start
    // point. A near-degenerate arc (end == start) has no defined centre, and
    // the flattener reads it as NaN - which renders in a browser but breaks
    // every measurement the mark lint makes.
    'M 37 18 A 13 13 0 0 1 63 18 A 13 13 0 0 1 37 18 Z '
    + 'M 50 34 C 61 34 69 40 70 50 L 73 72 L 65 72 L 63 58 L 61 96 L 53 96 '
    + 'L 51 66 L 49 66 L 47 96 L 39 96 L 37 58 L 35 72 L 27 72 L 30 50 '
    + 'C 31 40 39 34 50 34 Z',
})
