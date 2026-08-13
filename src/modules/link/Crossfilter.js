// @ts-check
/**
 * The crossfilter engine, now shared across the product family.
 *
 * It used to live here in full. Nothing in it was ever chart-specific: a
 * dimension is an arbitrary `(row) => key`, so a map region, a tree node's
 * subtree, a sankey link and a chart category are the same thing to it. Keeping
 * it inside a charting library meant a map or a grid had to install one just to
 * coordinate a filter, so it moved to `apex-commons` where every sibling
 * product can reach it.
 *
 * This module stays as the import site the rest of ApexCharts already uses, so
 * `LinkedViews` and `features/link` are unchanged. The registry is keyed on
 * `globalThis` under the same key as before, which is what lets a page holding
 * an older chart bundle and a newer sibling still share one coordinator.
 *
 * @module modules/link/Crossfilter
 */

import { Crossfilter } from 'apex-commons'

export default Crossfilter
