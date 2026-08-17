// @ts-check
import { silhouette } from '../engine/silhouette.js'

/**
 * A conical flask: experiments, trials, samples, tests run.
 *
 * One polygon, because the neck and the cone share an outline. The flare is what
 * makes it legible as a flask rather than a funnel: the shoulders sit low and the
 * base is the widest row in the shape, so most of the dots land there.
 */
export const flask = /* @__PURE__ */ silhouette({
  name: 'flask',
  category: 'objects',
  minUnits: 60,
  source: 'original',
  path: 'M 40 4 L 60 4 L 60 36 L 92 92 L 8 92 L 40 36 Z',
})
