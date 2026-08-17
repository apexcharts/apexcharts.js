// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A gear: builds, jobs, processes, throughput.
 *
 * Nine teeth on a root radius of 32 and a tip radius of 47, with the bore cut out
 * as a reverse wound circle. The bore is not decoration: a solid disc with bumps
 * reads as a flower, and the hole is what makes it machinery. It is also what
 * distinguishes this from `sun`, whose rays are the same idea without a hole.
 *
 * Nine rather than a round number so the teeth never line up with the packer's
 * rows and columns, which would make the tooth spacing look like a sampling
 * artefact instead of a design.
 *
 * The teeth cover 45% of each pitch rather than the 33% first drawn. A narrow
 * tooth holds less than two dots at any sane count, so the ring came out ragged
 * and the gear read as a sun; widening the tooth is the fix, and `minUnits` covers
 * what widening cannot.
 */
export const gear = /* @__PURE__ */ silhouette({
  name: 'gear',
  category: 'technology',
  minUnits: 260,
  source: 'original',
  path:
    'M 82 50.9 L 96.8 54.3 L 93.2 68.5 L 78.6 64.4 L 73.9 71.2 L 83.1 83.3 '
    + 'L 71.2 92 L 62.6 79.4 L 54.7 81.7 L 53.9 96.8 L 39.3 95.8 L 40.8 80.6 '
    + 'L 33.2 77.3 L 22.9 88.4 L 12.4 78.2 L 23.2 67.5 L 19.6 60.1 L 4.6 62 '
    + 'L 3.1 47.4 L 18.2 46.2 L 20.2 38.2 L 7.5 30 L 15.7 17.8 L 28.1 26.7 '
    + 'L 34.8 21.9 L 30.3 7.3 L 44.4 3.3 L 48.2 18 L 56.4 18.7 L 62.3 4.6 '
    + 'L 75.7 10.7 L 69.2 24.4 L 75.1 30.1 L 88.6 23.2 L 95 36.4 L 81.2 42.7 Z '
    + 'M 37 50 A 13 13 0 0 0 63 50 A 13 13 0 0 0 37 50 Z',
})
