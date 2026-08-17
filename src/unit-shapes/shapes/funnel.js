// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A funnel: a pipeline, stage by stage.
 *
 * Worth knowing what this is NOT. It does not narrow the dots by stage the way a
 * funnel chart does; it is a funnel shaped crowd, and which dots fall in the neck
 * is decided by the row order like every other silhouette. Pair it with the
 * default row ordering and the stages stack down the shape, widest first, which is
 * the reading people expect from a funnel.
 */
export const funnel = /* @__PURE__ */ silhouette({
  name: 'funnel',
  category: 'business',
  minUnits: 80,
  source: 'original',
  path: 'M 6 10 L 94 10 L 58 56 L 58 92 L 42 92 L 42 56 Z',
})
