// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * An equal armed cross: health, aid, a plus.
 *
 * The bluntest shape in the catalog and the most forgiving because of it. Every
 * arm is 28 units wide, so nothing tapers and nothing thins out, which is why it
 * reads at dot counts where the tapered shapes have already given up.
 */
export const cross = /* @__PURE__ */ silhouette({
  name: 'cross',
  category: 'symbols',
  minUnits: 40,
  source: 'original',
  path:
    'M 36 6 L 64 6 L 64 36 L 94 36 L 94 64 L 64 64 '
    + 'L 64 94 L 36 94 L 36 64 L 6 64 L 6 36 L 36 36 Z',
})
