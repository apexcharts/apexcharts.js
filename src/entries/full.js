// @ts-check
/**
 * ApexCharts — full bundle entry point (all chart types).
 *
 * This is what the default import resolves to:
 *   import ApexCharts from 'apexcharts'
 *
 * Registers every built-in chart type. Use a sub-entry point instead
 * (e.g. 'apexcharts/line') to ship only the types you need.
 */
import ApexCharts from '../apexcharts'
import * as coreInternals from './core.js'
import '../features/all.js'
import Bar from '../charts/Bar'
import BarStacked from '../charts/BarStacked'
import BoxCandleStick from '../charts/BoxCandleStick'
import Violin from '../charts/Violin'
import HeatMap from '../charts/HeatMap'
import Line from '../charts/Line'
import Pie from '../charts/Pie'
import Radar from '../charts/Radar'
import Radial from '../charts/Radial'
import RangeBar from '../charts/RangeBar'
import Treemap from '../charts/Treemap'
import Unit from '../charts/Unit'
import Sunburst from '../charts/Sunburst'

ApexCharts.use({
  line: Line,
  area: Line,
  scatter: Line,
  bubble: Line,
  rangeArea: Line,
  bar: Bar,
  column: Bar,
  barStacked: BarStacked,
  rangeBar: RangeBar,
  candlestick: BoxCandleStick,
  boxPlot: BoxCandleStick,
  violin: Violin,
  pie: Pie,
  donut: Pie,
  polarArea: Pie,
  radialBar: Radial,
  radar: Radar,
  heatmap: HeatMap,
  treemap: Treemap,
  unit: Unit,
  sunburst: Sunburst,
})

/**
 * The shared-module surface a script-tag add-on layers onto.
 *
 * A page without a bundler loads `apexcharts.js` and then, say,
 * `features/trellis.js`. That add-on needs the same Graphics, Utils and Scales
 * the page already has: a second copy would double the payload and, worse, give
 * it class identities the core does not recognise. So the full bundle hangs the
 * `__apex_*` modules it already contains off the global, and the UMD add-on
 * build resolves its shared imports here instead of inlining them
 * (`build/shared-modules.mjs`, target 'global').
 *
 * PRIVATE and unversioned. It is not in the type definitions, it is not
 * semver-stable, and application code must never read it. Bundler users get the
 * same modules the supported way, as `apexcharts/core` exports.
 */
Object.defineProperty(ApexCharts, '__internals', {
  value: coreInternals,
  enumerable: false,
  writable: false,
  configurable: false,
})

export default ApexCharts
