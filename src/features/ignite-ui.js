// @ts-check
import ApexCharts from '../apexcharts'
import { IGNITE_UI_ADAPTER } from 'apex-commons/ignite-ui'
import css from '../assets/apexcharts-ignite-ui.css'

// Ignite UI theming (plan 36): charts follow the Ignite UI theme on the page,
// its palette, text, gridlines, tooltips, menus, font and light or dark
// variant.
//
// NOT in any bundle, the full one included: it switches behaviour, so only a
// page that asks for it gets it. Both channels opt in:
//
//   bundler     import 'apexcharts/features/ignite-ui'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/ignite-ui.js"></script>
//
// Without it a page's `--ig-*` tokens are ignored, with no error; the
// `--apx-*` tokens work either way, and `theme.designSystem: false` turns it
// off for one chart. With `chart.injectStyleSheet: false` in the light DOM,
// link dist/apexcharts-ignite-ui.css after dist/apexcharts.css.
//
// Importing it registers the commons adapter on the page for every Apex
// product (Tree, Sankey and Gantt read it too), and hands ApexCharts that same
// adapter with the stylesheet it belongs to, so a chart's colours and its CSS
// twins always come from one build. The script tag waits for apexcharts.js
// like every add-on, so it registers for the other products only once that
// has loaded; a script-tag page with a tree, Sankey or Gantt chart loads that
// product's own add-on for it. Import it before the first render: a
// chart rendered earlier picks it up on its next update, resize or
// `refreshTokens()`.
ApexCharts.registerFeatures(
  /** @type {any} */ ({
    designSystemStyles: { name: 'igniteui', css, adapter: IGNITE_UI_ADAPTER },
  }),
)

export default ApexCharts
