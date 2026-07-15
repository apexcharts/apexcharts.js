// @ts-check
import ApexCharts from '../apexcharts'
import { makeCustomSeriesClass } from '../charts/CustomSeries'

/**
 * Marks (#11): the tree-shakeable feature that enables custom series types.
 *
 * `ApexCharts.registerSeriesType(name, def)` lives in core (always callable),
 * but building the type-class adapter is THIS opt-in feature: importing it sets
 * the adapter factory. Without it, `registerSeriesType` warns and no-ops, so the
 * adapter payload shakes out when unused. Included in the full bundle via
 * features/all.js.
 */
/** @type {any} */ (ApexCharts)._customSeriesFactory = makeCustomSeriesClass

export default ApexCharts
