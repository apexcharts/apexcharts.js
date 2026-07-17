<p align="center"><img src="https://apexcharts.com/media/apexcharts-logo.png" width="180"></p>

<h1 align="center">ApexCharts</h1>

<p align="center">
  Modern, interactive JavaScript charts your users will love, built for dashboards, SaaS, and data-heavy UIs.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/apexcharts"><img src="https://img.shields.io/npm/v/apexcharts.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/apexcharts"><img src="https://img.shields.io/npm/dm/apexcharts.svg" alt="downloads"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-ready-3178C6?logo=typescript&logoColor=white">
  <a href="https://github.com/apexcharts/apexcharts.js/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-Revenue--based-blue"></a>
  <a href="https://www.jsdelivr.com/package/npm/apexcharts"><img src="https://data.jsdelivr.com/v1/package/npm/apexcharts/badge" alt="jsdelivr"></a>
</p>

<p align="center">
  <a href="https://apexcharts.com/demos/">Live demos</a> ·
  <a href="https://apexcharts.com/docs/">Documentation</a> ·
  <a href="#license">License</a>
</p>

<p align="center"><a href="https://apexcharts.com/javascript-chart-demos/"><img src="https://apexcharts.com/media/apexcharts-banner.png" alt="ApexCharts gallery"></a></p>

## Why ApexCharts

- **17+ chart types** out of the box: line, area, bar, column, pie, donut, radar, heatmap, treemap, candlestick, boxplot, violin, funnel, pyramid, gauge and more
- **SSR support** for Next.js, Nuxt, SvelteKit, Astro, and other meta-frameworks: render real SVG on the server, hydrate on the client
- **Tree-shakable**: import only the chart types and features you need; typical bundles are 30-60% smaller than the full build
- **TypeScript-first**: full type definitions ship with the package, no `@types/*` install needed
- **Zero runtime dependencies**: no React/Vue/D3 required; works in any framework or vanilla JS
- **Accessibility**: keyboard navigation and ARIA support built in
- **Free for most users**: see [License](#license)

## New in v6

Version 6 turns a chart from a picture you look at into a surface you investigate, author, and share. Most features below are opt-in and tree-shakeable; existing configs keep working unchanged.

- **Plugin platform**: publish reusable chart plugins to npm against a stable, versioned API. `ApexCharts.registerPlugin(def)`, then activate per chart with `plugins: [{ name }]`.
- **Canvas rendering for dense series**: `chart: { renderer: 'auto' }` paints the series layer to canvas above a point threshold while axes, tooltips, annotations, and exports stay SVG. Hundreds of thousands of points, same config.
- **Undo / redo**: `chart: { history: { enabled: true } }` records zooms, series toggles, option changes, and annotation edits. Ctrl-Z just works, and `chart.history` exposes undo, redo, jump, and transactions.
- **Shareable view state**: `chart.perspectives.capture()` serializes the exact view (zoom window, hidden series, selections, annotations, theme) into a compact token you can put in a URL and restore anywhere.
- **Design tokens and OS-aware themes**: define `--apx-*` CSS custom properties once and every chart reads them; `theme: { follow: 'os' }` tracks the system light/dark preference with zero JS, and `ApexCharts.registerTheme` registers named brand themes.
- **Custom series types**: `ApexCharts.registerSeriesType(name, { renderItem })` draws primitives per datum and inherits tooltips, events, legend, and keyboard navigation for free.
- **Native-feeling touch**: two-finger pinch-zoom, two-finger pan, and kinetic inertia with axis rails, on by default.
- **Pluggable easing**: `chart.animations.easing` accepts named curves, cubic-bezier arrays, or functions; add your own with `ApexCharts.registerEasing`.
- **Coherent data transitions**: updates that add or remove data points animate as one coordinated motion. New bars grow from the baseline, removed ones shrink away, line and area fills reshape without tearing, and markers, bubbles, and axis labels ride along. On by default for animated charts.
- **Crossfilter dashboards**: link charts into a shared filter engine with `ApexCharts.crossfilter`. Click a slice or brush a range in one chart and every linked chart filters to match.
- **Annotation authoring**: `chart: { ink: { enabled: true } }` makes annotations draggable and resizable, adds click-to-create, snap, and a floating editor card (rename, recolor, restyle, delete), all wired into undo.
- **Measure ruler**: hold a key and drag to read the change, percent, and slope between two points; pinned rulers re-project on zoom and resize (`chart.measure`).
- **Context menu**: right-click or long-press a data point for actions that operate at that exact point, with custom items supported (`chart.contextMenu`).
- **Real-time streaming**: rolling-window updates scroll at constant velocity instead of warping in place, and `chart.streaming` bounds memory for long-running feeds.
- **Scrollytelling**: `chart.storyboard.bind({ beats })` pairs prose sections with saved chart views; the chart morphs to each view as the reader scrolls and reverses when they scroll back.

## Install

```bash
npm install apexcharts
```

Or via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
```

## Quick start

```js
import ApexCharts from 'apexcharts'

const chart = new ApexCharts(document.querySelector('#chart'), {
  chart: { type: 'bar' },
  series: [{ name: 'Sales', data: [30, 40, 35, 50, 49, 60, 70, 91, 125] }],
  xaxis: { categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999] }
})

chart.render()
```

Browse [100+ ready-to-use samples](https://apexcharts.com/javascript-chart-demos/): copy, paste, ship.

## Chart types

- [Line](https://apexcharts.com/javascript-chart-demos/line-charts/) · [Area](https://apexcharts.com/javascript-chart-demos/area-charts/) · [Range Area](https://apexcharts.com/javascript-chart-demos/range-area-charts/)
- [Bar](https://apexcharts.com/javascript-chart-demos/bar-charts/) · [Column](https://apexcharts.com/javascript-chart-demos/column-charts/) · [Range Bar / Timeline](https://apexcharts.com/javascript-chart-demos/range-bar-charts/) 
- [Scatter](https://apexcharts.com/javascript-chart-demos/scatter-charts/) · [Bubble](https://apexcharts.com/javascript-chart-demos/bubble-charts/)
- [Candlestick](https://apexcharts.com/javascript-chart-demos/candlestick-charts/) · [BoxPlot](https://apexcharts.com/javascript-chart-demos/boxplot-charts/) · [Violin](samples/vanilla-js/violin/)
- [Pie](https://apexcharts.com/javascript-chart-demos/pie-charts/) · [Donut](https://apexcharts.com/javascript-chart-demos/pie-charts/) · [Polar Area](https://apexcharts.com/javascript-chart-demos/polar-area-charts/) · [Radial Bar / Gauge](https://apexcharts.com/javascript-chart-demos/radialbar-charts/)
- [Radar](https://apexcharts.com/javascript-chart-demos/radar-charts/) · [Heatmap](https://apexcharts.com/javascript-chart-demos/heatmap-charts/) · [Treemap](https://apexcharts.com/javascript-chart-demos/treemap-charts/)
- [Funnel](https://apexcharts.com/javascript-chart-demos/funnel-charts/)

Combine any of the above as [mixed/combo charts](https://apexcharts.com/javascript-chart-demos/mixed-charts/), [stacked variants](https://apexcharts.com/javascript-chart-demos/column-charts/stacked/), [sparklines](https://apexcharts.com/javascript-chart-demos/sparklines/), or [synchronized multi-chart layouts](https://apexcharts.com/javascript-chart-demos/line-charts/syncing-charts/).

## Framework wrappers

Official:

- **React**: [react-apexcharts](https://github.com/apexcharts/react-apexcharts)
- **Vue 3**: [vue3-apexcharts](https://github.com/apexcharts/vue3-apexcharts)
- **Vue 2**: [vue-apexcharts](https://github.com/apexcharts/vue-apexcharts)
- **Angular**: [ng-apexcharts](https://github.com/apexcharts/ng-apexcharts)
- **Blazor**: [Blazor-ApexCharts](https://github.com/apexcharts/Blazor-ApexCharts)
- **Stencil**: [stencil-apexcharts](https://github.com/apexcharts/stencil-apexcharts)

Community:

- **Svelte**: [svelte-apexcharts](https://github.com/galkatz373/svelte-apexcharts)
- **Ruby**: [apexcharts.rb](https://github.com/styd/apexcharts.rb)
- **Laravel**: [larapex-charts](https://github.com/ArielMejiaDev/larapex-charts)
- **R**: [apexcharter](https://github.com/dreamRs/apexcharter)

## Server-side rendering

Render chart HTML on the server, then hydrate in the browser. Works with Next.js, Nuxt, SvelteKit, Astro, Remix, and any Node-based framework.

```js
// Server
import ApexCharts from 'apexcharts/ssr'

const chartHTML = await ApexCharts.renderToHTML({
  chart: { type: 'bar' },
  series: [{ data: [30, 40, 35, 50, 49, 60, 70, 91, 125] }],
  xaxis: { categories: [1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999] }
}, { width: 500, height: 300 })

// Returns hydration-ready HTML with embedded SVG
```

```js
// Client
import ApexCharts from 'apexcharts/client'

ApexCharts.hydrate(document.getElementById('my-chart'))
// or: ApexCharts.hydrateAll()
```

No more `dynamic(() => import(...), { ssr: false })` workarounds: the chart renders on the server and becomes interactive on hydration.

## Tree-shaking: ship only what you use

By default `import ApexCharts from 'apexcharts'` includes everything. For smaller bundles, import from `apexcharts/core` and add only what you need:

```js
import ApexCharts from 'apexcharts/core'   // bare class: no chart types, no features

// Chart types (match the value of chart.type)
import 'apexcharts/line'
import 'apexcharts/bar'
// import 'apexcharts/area'
// import 'apexcharts/scatter'

// Optional features
import 'apexcharts/features/legend'
import 'apexcharts/features/toolbar'      // zoom/pan toolbar
// import 'apexcharts/features/exports'      // SVG/PNG/CSV download
// import 'apexcharts/features/annotations'
// import 'apexcharts/features/keyboard'     // keyboard navigation
// import 'apexcharts/features/drilldown'    // hierarchical drill-down
// import 'apexcharts/features/morph'        // animated chart-type morphs
// import 'apexcharts/features/history'      // undo/redo
// import 'apexcharts/features/perspectives' // shareable view state
// import 'apexcharts/features/storyboard'   // scrollytelling (includes perspectives)
// import 'apexcharts/features/facet'        // design tokens + OS themes
// import 'apexcharts/features/weave'        // plugin platform
// import 'apexcharts/features/marks'        // custom series types
// import 'apexcharts/features/link'         // crossfilter / linked views
// import 'apexcharts/features/ink'          // on-chart annotation editing
// import 'apexcharts/features/measure'      // measure/delta ruler
// import 'apexcharts/features/context-menu' // right-click context menu
// import 'apexcharts/features/renderer-canvas' // canvas series renderer
```

See the [tree-shaking guide](https://apexcharts.com/docs/tree-shaking/) for the complete list of entry points.

## Browser support

ApexCharts works in all modern evergreen browsers (Chrome, Firefox, Safari, Edge). For server-side rendering, Node.js 18+ is required.

## Documentation

- [Getting started](https://apexcharts.com/docs/)
- [Live demo gallery](https://apexcharts.com/demos/)

## Contributing

```bash
npm install
npm run dev     # vite build --watch
npm test        # e2e + unit
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, coding conventions, and PR guidelines.

## License

ApexCharts uses a **revenue-based license**:

- **Free** for individuals, and organizations with **under $2M USD in annual gross revenue**, including commercial and internal use. No registration required.
- **Commercial license required** for organizations at or above $2M USD annual gross revenue.

Full terms: [apexcharts.com/license](https://apexcharts.com/license)

## Need an enterprise data grid?

We've partnered with [Infragistics](https://www.infragistics.com/), creators of Ignite UI: high-performance data grids that handle unlimited rows and columns, with custom templates and real-time updates.

<p align="center"><a href="https://www.infragistics.com/products/ignite-ui-angular/angular/components/grid/grid" target="_blank"><img src="https://apexcharts.com/media/infragistics-data-grid.png" alt="Ignite UI Data Grid" /></a></p>

Available for:

[Angular](https://www.infragistics.com/products/ignite-ui-angular/angular/components/grid/grid) · [React](https://www.infragistics.com/products/ignite-ui-react/react/components/grids) · [Blazor](https://www.infragistics.com/products/ignite-ui-blazor/blazor/components/data-grid) · [Web Components](https://www.infragistics.com/products/ignite-ui-web-components/web-components/components/data-grid) · [jQuery](https://www.igniteui.com/grid/overview)

## Contact

- Issues & bugs: [GitHub Issues](https://github.com/apexcharts/apexcharts.js/issues)
- Questions: [GitHub Discussions](https://github.com/apexcharts/apexcharts.js/discussions)
- Email: info@apexcharts.com
