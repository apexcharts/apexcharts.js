// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A gabled house. The doorway is cut from the same outline rather than added as a hole, so the glyph survives a nonzero fill rule.
 */
export const house = /* @__PURE__ */ definePictogram({
  name: 'house',
  category: 'objects',
  source: 'original',
  path:
    'M 50 8 L 94 46 L 82 46 L 82 92 L 58 92 L 58 64 L 42 64 L 42 92 L 18 92 L 18 46 L 6 46 Z',
})
