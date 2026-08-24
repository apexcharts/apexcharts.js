// @ts-check
import { definePictogram } from '../engine/mark.js'

/**
 * A hatchback in profile: one body outline plus two wheels, all wound the same way so they union.
 */
export const car = /* @__PURE__ */ definePictogram({
  name: 'car',
  category: 'transport',
  source: 'original',
  path:
    'M 6 72 L 9 53 C 10 46 15 41 22 40 L 32 23 C 35 19 39 17 44 17 L 60 17 C 65 17 69 19 71 23 L 81 40 C 88 41 93 46 94 53 L 97 72 L 97 80 L 6 80 Z M 13 88 A 11 11 0 1 1 35 88 A 11 11 0 1 1 13 88 Z M 65 88 A 11 11 0 1 1 87 88 A 11 11 0 1 1 65 88 Z',
})
