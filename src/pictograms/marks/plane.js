// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * An aircraft from above: swept wings, a tailplane, and a fuselage that tapers to a nose.
 */
export const plane = /* @__PURE__ */ definePictogram({
  name: 'plane',
  category: 'transport',
  source: 'original',
  path:
    'M 50 4 C 55 4 58 12 58 24 L 58 38 L 94 62 L 94 72 L 58 60 L 58 82 L 70 90 L 70 97 L 50 92 L 30 97 L 30 90 L 42 82 L 42 60 L 6 72 L 6 62 L 42 38 L 42 24 C 42 12 45 4 50 4 Z',
})
