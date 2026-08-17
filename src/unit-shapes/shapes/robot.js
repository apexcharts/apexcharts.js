// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A robot head: automation, bots, agents, machine handled work.
 *
 * Head, antenna and knob union; the two eyes are reverse wound and cut through.
 * The eyes are the whole read, and they are also the first casualty: each is 14
 * units across, so below `minUnits` the rows close over them and the shape becomes
 * a rounded box with a stalk.
 */
export const robot = /* @__PURE__ */ silhouette({
  name: 'robot',
  category: 'technology',
  minUnits: 220,
  source: 'original',
  path:
    'M 18 40 C 18 30 26 26 36 26 L 64 26 C 74 26 82 30 82 40 L 82 72 '
    + 'C 82 82 74 86 64 86 L 36 86 C 26 86 18 82 18 72 Z '
    + 'M 46 14 L 54 14 L 54 28 L 46 28 Z '
    + 'M 44 12 A 6 6 0 0 1 56 12 A 6 6 0 0 1 44 12 Z '
    + 'M 29 50 A 7 7 0 0 0 43 50 A 7 7 0 0 0 29 50 Z '
    + 'M 57 50 A 7 7 0 0 0 71 50 A 7 7 0 0 0 57 50 Z',
})
