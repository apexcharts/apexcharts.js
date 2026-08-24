// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A compact heart with two full lobes and a real notch. Wider and shallower than a display heart, because a glyph is read at 10px, not 300.
 */
export const heart = /* @__PURE__ */ definePictogram({
  name: 'heart',
  category: 'symbols',
  source: 'original',
  path:
    'M 50 90 C 22 70 6 54 6 36 C 6 21 17 11 30 11 C 39 11 46 16 50 24 C 54 16 61 11 70 11 C 83 11 94 21 94 36 C 94 54 78 70 50 90 Z',
})
