// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A filament bulb: glass envelope, then the collar and contact as two separate stacked pieces.
 */
export const bulb = /* @__PURE__ */ definePictogram({
  name: 'bulb',
  category: 'objects',
  source: 'original',
  path:
    // The collar and contact are wound the SAME way as the envelope (which
    // runs counter-clockwise). They do not overlap it, so a nonzero fill would
    // paint them either way - but a subpath wound against its outline is one
    // edit away from becoming a hole, and it reads as deliberate when it is not.
    'M 50 4 C 32 4 18 18 18 36 C 18 48 25 56 31 63 C 35 68 37 72 37 78 L 63 78 C 63 72 65 68 69 63 C 75 56 82 48 82 36 C 82 18 68 4 50 4 Z M 38 84 L 38 90 L 62 90 L 62 84 Z M 42 94 L 45 99 L 55 99 L 58 94 Z',
})
