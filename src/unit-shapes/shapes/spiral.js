// @ts-check
import { stroke } from '../engine/stroke.js'

/**
 * A spiral: growth over time, a sequence with no natural end, a cycle.
 *
 * Two and a half turns of an Archimedean spiral, sampled every twelve degrees. The
 * longest centreline in the collection and the one that shows what the region is
 * really doing: the dots follow the arm outwards at an even density the whole way,
 * because the packer is filling area rather than stepping along the line.
 */
export const spiral = /* @__PURE__ */ stroke({
  name: 'spiral',
  category: 'symbols',
  minUnits: 140,
  width: 9,
  source: 'generated',
  path:
    'M 56.0 50.0 '
    + 'L 56.4 51.4 L 56.5 52.9 L 56.2 54.5 L 55.5 56.1 L 54.3 57.5 L 52.9 58.8 L 51.0 59.7 '
    + 'L 48.9 60.3 L 46.6 60.3 L 44.3 59.9 L 42.0 58.9 L 39.9 57.3 L 38.1 55.3 L 36.8 52.8 '
    + 'L 35.9 50.0 L 35.7 47.0 L 36.2 43.8 L 37.3 40.8 L 39.1 37.9 L 41.6 35.5 L 44.7 33.5 '
    + 'L 48.1 32.3 L 51.9 31.7 L 55.8 32.0 L 59.7 33.1 L 63.4 35.1 L 66.6 37.9 L 69.3 41.4 '
    + 'L 71.1 45.5 L 72.2 50.0 L 72.2 54.7 L 71.2 59.4 L 69.2 64.0 L 66.3 68.1 L 62.4 71.5 '
    + 'L 57.8 74.1 L 52.7 75.8 L 47.2 76.3 L 41.7 75.7 L 36.2 73.8 L 31.2 70.9 L 26.8 66.8 '
    + 'L 23.4 61.9 L 21.0 56.2 L 19.8 50.0 L 19.9 43.6 L 21.4 37.3 L 24.2 31.3 L 28.3 25.9 '
    + 'L 33.5 21.5 L 39.7 18.2 L 46.4 16.2 L 53.6 15.7 L 60.8 16.6 L 67.8 19.2 L 74.2 23.1 '
    + 'L 79.7 28.4 L 84.0 34.9 L 86.9 42.1 L 88.3 50.0 L 88.0 58.1 L 86.0 66.0 L 82.3 73.5 '
    + 'L 77.1 80.1 L 70.5 85.5 L 62.8 89.5 L 54.4 91.8 L 45.5 92.4 L 36.7 91.0 L 28.2 87.8 '
    + 'L 20.4 82.9 L 13.8 76.3 L 8.6 68.4 L 5.2 59.5 L 3.6 50.0 L 4.1 40.2 L 6.6 30.7 '
    + 'L 11.2 21.8',
})
