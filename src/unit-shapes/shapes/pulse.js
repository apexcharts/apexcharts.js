// @ts-check
import { stroke } from '../engine/stroke.js'

/**
 * A heartbeat trace: uptime, requests, activity, anything monitored.
 *
 * A flat baseline interrupted by one spike, which is the shape of every monitoring
 * chart ever drawn and so needs no explaining. The corners are where a stroke earns
 * its keep: each one is a round join the region produces for free, from the disc at
 * the shared endpoint of two capsules.
 */
export const pulse = /* @__PURE__ */ stroke({
  name: 'pulse',
  category: 'technology',
  minUnits: 60,
  width: 11,
  source: 'original',
  path: 'M 4 58 L 26 58 L 35 30 L 47 84 L 59 44 L 68 58 L 96 58',
})
