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

- **18+ chart types** out of the box: line, area, bar, column, pie, donut, radar, heatmap, treemap, candlestick, boxplot, violin, funnel, pyramid, gauge, unit (dot / pictogram / waffle / beeswarm) and more
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
- [Unit / Pictogram / Beeswarm](samples/vanilla-js/unit/) · [Waffle](samples/vanilla-js/waffle/) (premium) · [shape kit](#shapes-for-the-unit-chart)

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

`import ApexCharts from 'apexcharts'` gives you every chart type and the
everyday features. Nine optional features ship outside it and are imported
explicitly (marked **opt-in** below); each warns in the console if its config is
set but the feature is absent. Adding one to the default bundle is a single
line, and the two share one copy of the core:

```js
import ApexCharts from 'apexcharts'
import 'apexcharts/features/trellis'
```

For a smaller bundle still, start from `apexcharts/core` and add only what you
need:

```js
import ApexCharts from 'apexcharts/core'   // bare class: no chart types, no features

// Chart types (match the value of chart.type)
import 'apexcharts/line'
import 'apexcharts/bar'
// import 'apexcharts/area'
// import 'apexcharts/scatter'
// import 'apexcharts/unit'         // dot / pictogram / waffle / beeswarm (premium; 'waffle' aliases this)

// Optional features
import 'apexcharts/features/legend'
import 'apexcharts/features/toolbar'      // zoom/pan toolbar
// import 'apexcharts/features/exports'      // SVG/PNG/CSV download
// import 'apexcharts/features/annotations'
// import 'apexcharts/features/keyboard'     // keyboard navigation
// import 'apexcharts/features/drilldown'    // hierarchical drill-down
// import 'apexcharts/features/morph'        // animated chart-type morphs
// import 'apexcharts/features/history'      // undo/redo (premium, opt-in)
// import 'apexcharts/features/perspectives' // shareable view state (premium, opt-in)
// import 'apexcharts/features/storyboard'   // scrollytelling, incl. perspectives (premium, opt-in)
// import 'apexcharts/features/facet'        // design tokens + OS themes
// import 'apexcharts/features/weave'        // plugin platform
// import 'apexcharts/features/marks'        // custom series types
// import 'apexcharts/features/link'         // crossfilter / linked views (premium, opt-in)
// import 'apexcharts/features/ink'          // on-chart annotation editing (premium, opt-in)
// import 'apexcharts/features/measure'      // measure/delta ruler (premium, opt-in)
// import 'apexcharts/features/context-menu' // right-click context menu (premium, opt-in)
// import 'apexcharts/features/renderer-canvas' // canvas series renderer (opt-in)
// import 'apexcharts/features/trellis'     // small multiples (premium, opt-in)
// import 'apexcharts/features/raincloud'   // raincloud chart type statistics (premium, opt-in)
```

A page without a bundler gets the same choice. `apexcharts.js` stays
batteries-included, and `apexcharts.core.min.js` is the lean baseline you build
up from:

```html
<script src="https://cdn.jsdelivr.net/npm/apexcharts/dist/apexcharts.core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/apexcharts/dist/line.js"></script>
<script src="https://cdn.jsdelivr.net/npm/apexcharts/dist/features/legend.js"></script>
```

Opt-in features work the same way there: load `dist/features/<name>.js` after
whichever bundle the page already has.

See the [tree-shaking guide](https://apexcharts.com/docs/tree-shaking/) for the complete list of entry points.

### Shapes for the unit chart

`apexcharts/unit-shapes` is a companion kit: 39 shapes a unit chart can pack its dots into, as silhouettes (heart, house, globe, tree), stroked glyphs (checkmark, arrow, heartbeat trace) and a composer that draws a number in its own dots. Every shape is a plain function of the marks and the plot rectangle, so it repacks at any dot count and any size, and importing one costs about 4 KB gzipped with the rest shaken out.

```js
import ApexCharts from 'apexcharts'
import { heart } from 'apexcharts/unit-shapes'

new ApexCharts(el, {
  chart: { type: 'unit' },
  series: [576, 168, 42, 34],
  labels: ['Owned', 'Mortgaged', 'Renting', 'Other'],
  plotOptions: { unit: { layout: 'custom', positions: heart } },
}).render()
```

Shapes are composable (`outlined(heart)` traces it instead of filling it, `heart.with({ order: 'cols' })` changes where each series band lands), and `preview(heart, { series })` renders one to an SVG string with no chart and no DOM, for docs and build-time images. From a script tag, `dist/unit-shapes.js` exposes the same kit as `ApexUnitShapes` and registers every shape by name.

**The shape you want is probably not one of the 39, and it does not have to be.** `positions` takes any function of the marks and the plot rectangle, so there are three ways in, none of which needs a release from us:

```js
import { shapeFrom, strokeFrom } from 'apexcharts/unit-shapes'

shapeFrom('M 26 71 A 24 21 0 1 1 74 71 …')        // your own outline, packed like ours
strokeFrom('M 6 76 L 24 44 L 40 60 …', { width: 12 })  // a centreline, for a line
positions: (objects, rect) => objects.map(…)      // your own rule, no kit at all
```

Working demo of all three, including the outline-authoring rules (subpaths union, a reverse-wound one cuts a hole): [bring-your-own-shape](samples/vanilla-js/unit/bring-your-own-shape.html).

## Premium features & licensing

Most of ApexCharts is free and open source. A small set of advanced features are **premium** and require a license key:

| Feature | Enabled by |
|---|---|
| Unit chart type (dot / pictogram / waffle / beeswarm) | `chart.type: 'unit'` / `chart.type: 'waffle'` |
| Raincloud chart type (half-density + box + raw points) | `chart.type: 'raincloud'` (needs `apexcharts/features/raincloud`, not in the default bundle) |
| Storyboard (scrollytelling) | `chart.storyboard.bind(...)` |
| Linked views / crossfilter | `chart.link.enabled` / `chart.link.dimension` / `ApexCharts.crossfilter()` |
| Ink layer (on-chart annotation editing) | `chart.ink.enabled` |
| Measure / delta ruler | `chart.measure.enabled` |
| Context menu (right-click) | `chart.contextMenu.enabled` |
| Perspectives (shareable view state) | `chart.perspectives.apply()` / `.save()` / `ApexCharts.perspectives.decode()` |
| History (undo/redo) | `chart.history.enabled` |

Without a valid key these features still work (**trial mode**), but the chart shows an "APEXCHARTS" watermark. A valid key removes it. Every other chart type and feature is free and never watermarked; the premium chart types are `unit` (aliased by `waffle`) and `raincloud`, both listed above.

```js
import ApexCharts from 'apexcharts'

// Set once, before rendering. Applies to every chart on the page.
ApexCharts.setLicense('APEX-xxxxxxxx')
```

Alternatives to `setLicense`:

```js
// Global variable (used when setLicense was not called):
window.Apex = { license: 'APEX-xxxxxxxx' }

// Per-chart override (most specific wins):
new ApexCharts(el, { chart: { license: 'APEX-xxxxxxxx' /* ... */ } })
```

Precedence per chart: `chart.license` -> `ApexCharts.setLicense()` -> `window.Apex.license` -> unlicensed (trial). The watermark is re-evaluated on every render, so a late `setLicense(validKey)` followed by `chart.update()` clears it.

Keys are **shared across the whole ApexCharts family** (apexgantt, apextree, apexsankey, apex-grid-enterprise, apexstock), so one customer key works everywhere. Get a license at [apexcharts.com/pricing](https://apexcharts.com/pricing).

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


## 🌐 Web Resources & Interactive Index
- [GUESS WORD](https://thequizzone.pages.dev/guess-word.html)
- [FLOOF MY PET HOUSE](https://thelearnquester.web.app/floof-my-pet-house.html)
- [NUBIK COURIER AN OPEN WORLD](https://quizverses.pages.dev/nubik-courier-an-open-world.html)
- [100 HIDDEN CAPYBARAS](https://studyquests.pages.dev/100-hidden-capybaras.html)
- [CATEGORY LOGIC538](https://quizverses-9d2f2.web.app/category-logic538.html)
- [CATEGORY CASUAL971](https://quizverses-9d2f2.web.app/category-casual971.html)
- [ZOMBIE HIGHWAY RAMPAGE](https://studyquesthub.web.app/zombie-highway-rampage.html)
- [SWIM GOOD](https://quizverses.github.io/swim-good.html)
- [CATEGORY COLLECT565](https://quizverses-9d2f2.web.app/category-collect565.html)
- [PET DOCTOR BUSINESS TYCOON PET CARE GAME](https://studyquests.github.io/pet-doctor-business-tycoon-pet-care-game.html)
- [STUNT FURY](https://studyquests.github.io/stunt-fury.html)
- [TILES OF THE UNEXPECTED 2](https://quizverses.github.io/tiles-of-the-unexpected-2.html)
- [ROBBIE BECOME A BEAST](https://studyquesthub.web.app/robbie-become-a-beast.html)
- [SUMMER TRIPLE MAHJONG](https://studyquesthub.web.app/summer-triple-mahjong.html)
- [CATEGORY MERGE](https://quizverses.github.io/category-merge.html)
- [CAR PAINT](https://studyquests.github.io/car-paint.html)
- [BUBBLE SHOOTER VINTAGE](https://studyquests.github.io/bubble-shooter-vintage.html)
- [COLOR NUTS BOLTS PUZZLE](https://studyquesthub.web.app/color-nuts-bolts-puzzle.html)
- [CATEGORY MAGIC46](https://quizverses.pages.dev/category-magic46.html)
- [CATEGORY CUTE62](https://studyquesthub.web.app/category-cute62.html)
- [VEGA MIX FAIRY TOWN](https://studyquests.github.io/vega-mix-fairy-town.html)
- [HORROR MINECRAFT PARTYTIME](https://quizverses.pages.dev/horror-minecraft-partytime.html)
- [CATEGORY UNBLOCKED](https://quizverses.pages.dev/category-unblocked.html)
- [FARM MERGE HARVEST](https://studyquests.github.io/farm-merge-harvest.html)
- [3D BASKETBALLIO DUNK SPORT](https://studyquesthub.web.app/3d-basketballio-dunk-sport.html)
- [CATEGORY MATCH 3 2](https://quizverses.pages.dev/category-match-3-2.html)
- [CATEGORY SPACE57](https://quizverses.pages.dev/category-space57.html)
- [CATEGORY MOUSE1 697](https://quizverses.github.io/category-mouse1-697.html)
- [SQUIRREL WITH A GUN](https://studyquesthub.web.app/squirrel-with-a-gun.html)
- [ZOMBIE OUTBREAK SURVIVE](https://studyquesthub.web.app/zombie-outbreak-survive.html)
- [ANIMAL RACING IDLE PARK](https://studyplaying.github.io/animal-racing-idle-park.html)
- [DARING JACK](https://quizverses.pages.dev/daring-jack.html)
- [CATEGORY SIMULATION 2](https://quizverses-9d2f2.web.app/category-simulation-2.html)
- [MIND GAMES FOR 2 3 4 PLAYER](https://studyplaying.github.io/mind-games-for-2-3-4-player.html)
- [CATEGORY TANK58](https://studyplayings.web.app/category-tank58.html)
- [CATEGORY GOGUARDIAN](https://quizverses.pages.dev/category-goguardian.html)
- [SUDOKU BRAIN BLOCKS](https://studyquests.github.io/sudoku-brain-blocks.html)
- [CATEGORY INTERSTELLAR](https://studyplayings.pages.dev/category-interstellar.html)
- [SHARK CHOMP CHASE](https://studyquests.github.io/shark-chomp-chase.html)
- [OBBY ESCAPE FROM TSUNAMI BRAINROT](https://studyplayings.web.app/obby-escape-from-tsunami-brainrot.html)
- [MONKEY BUBBLE DEFENSE](https://studyplayings.web.app/monkey-bubble-defense.html)
- [CATEGORY SHOOTER](https://quizverses.pages.dev/category-shooter.html)
- [WORLD FLAGS TRIVIA](https://studyquests.github.io/world-flags-trivia.html)
- [CATEGORY MOBILE2 112](https://studyplaying.github.io/category-mobile2-112.html)
- [MEDIEVAL ESCAPE](https://quizverses-9d2f2.web.app/medieval-escape.html)
- [IDLE FARM](https://studyplayings.web.app/idle-farm.html)
- [MOW IT](https://quizverses.pages.dev/mow-it.html)
- [BATTLE SHOT ELITE](https://studyquests.github.io/battle-shot-elite.html)
- [EMOJI SMASHER SMILEY GAME](https://quizverses.pages.dev/emoji-smasher-smiley-game.html)
- [WILD HUNTING CLASH](https://studyplayings.web.app/wild-hunting-clash.html)
- [HEROBALL ADVENTURES 2](https://studyplaying.github.io/heroball-adventures-2.html)
- [FAIRY WINGERELLA](https://studyquests.github.io/fairy-wingerella.html)
- [CATEGORY LOGIC538](https://quizverses.github.io/category-logic538.html)
- [PARKOUR BLOCK OBBY](https://studyquests.github.io/parkour-block-obby.html)
- [MERGE HOSPITAL](https://studyplaying.github.io/merge-hospital.html)
- [FITNESS CLUB 3D](https://studyplayings.web.app/fitness-club-3d.html)
- [HARD PUZZLE](https://quizverses-9d2f2.web.app/hard-puzzle.html)
- [PRINCESSES AT HORROR SCHOOL](https://studyplaying.github.io/princesses-at-horror-school.html)
- [SUPER KID ADVENTURE](https://studyplayings.web.app/super-kid-adventure.html)
- [FARM OF WORDS](https://studyplayings.web.app/farm-of-words.html)
- [INDEX7](https://studyplayings.pages.dev/index7.html)
- [MAHJONG PET QUEST](https://quizverses.pages.dev/mahjong-pet-quest.html)
- [MURDER CASE CLUE 3D](https://studyplayings.web.app/murder-case-clue-3d.html)
- [DEAD BRAIN](https://studyplayings.web.app/dead-brain.html)
- [TEACHER SIMULATOR](https://studyplayings.pages.dev/teacher-simulator.html)
- [ESCAPE ROOM MYSTERY KEY](https://studyquesthub.web.app/escape-room-mystery-key.html)
- [KITTY MATCH 3 PUZZLE GAME](https://studyplayings.pages.dev/kitty-match-3-puzzle-game.html)
- [CAPYBARA BLOCK BLAST](https://studyplaying.github.io/capybara-block-blast.html)
- [SLINGER BLOCK](https://studyplayings.pages.dev/slinger-block.html)
- [MEGA RAMP CAR](https://studyplayings.pages.dev/mega-ramp-car.html)
- [CATEGORY DOG18](https://quizverses-9d2f2.web.app/category-dog18.html)
- [GUN BUILDER](https://studyplayings.web.app/gun-builder.html)
- [SPIDER ROPE HERO CITY FIGHT](https://studyquests.github.io/spider-rope-hero-city-fight.html)
- [BLACK PINK HALLOWEEN CONCERT](https://quizverses-9d2f2.web.app/black-pink-halloween-concert.html)
- [LOGIC STORM ANIMALS PUZZLE](https://studyplayings.web.app/logic-storm-animals-puzzle.html)
- [TILE HEXA SORT](https://studyplaying.github.io/tile-hexa-sort.html)
- [WORM ESCAPE](https://studyplayings.pages.dev/worm-escape.html)
- [NONOGRAM DAILY](https://studyplayings.web.app/nonogram-daily.html)
- [BULLET SUPERHERO](https://studyplayings.pages.dev/bullet-superhero.html)
- [COLORWARSIO CONQUEST GAME](https://studyquests.github.io/colorwarsio-conquest-game.html)
- [CATEGORY SPEED158](https://studyquesthub.web.app/category-speed158.html)
- [STICKMAN SHOOTER BROS](https://studyplayings.web.app/stickman-shooter-bros.html)
- [CATEGORY FLASH 2](https://quizverses.pages.dev/category-flash-2.html)
- [CATEGORY GAMES](https://learnquester.github.io/category-games.html)
- [NG FLOW LINES](https://studyplayings.web.app/ng-flow-lines.html)
- [NINJA CLIMB](https://studyquests.github.io/ninja-climb.html)
- [FLIGHT SIM AIR TRAFFIC CONTROL](https://themindplay.github.io/flight-sim-air-traffic-control.html)
- [CATEGORY HORROR 3](https://thequizzone.pages.dev/category-horror-3.html)
- [DAILY MATCH](https://themindzone.pages.dev/daily-match.html)
- [CATEGORY SURVIVAL365](https://studyquesthub.web.app/category-survival365.html)
- [HIPPO SUPERMARKET](https://themindzone.pages.dev/hippo-supermarket.html)
- [PARKING FRENZY](https://thelearnquesters.pages.dev/parking-frenzy.html)
- [WORD SCRAMBLE FAMILY TALES](https://studyquesthub.web.app/word-scramble-family-tales.html)
- [DRAGON EGG MASTER](https://thelearnquesters.pages.dev/dragon-egg-master.html)
- [CATEGORY STUNT128](https://thelearnquesters.pages.dev/category-stunt128.html)
- [TRAIN DRIFT](https://thelearnquesters.pages.dev/train-drift.html)
- [CHILDREN HAPPY FARM DUDU](https://studyquests.github.io/children-happy-farm-dudu.html)
- [CATEGORY CAT55](https://studyplayings.web.app/category-cat55.html)
- [MAGECLASH IO](https://studyquests.github.io/mageclash-io.html)
- [NUGGET MAN SURVIVAL PUZZLE](https://themindzone.pages.dev/nugget-man-survival-puzzle.html)
- [CATEGORY SOCCER](https://thelearnquesters.pages.dev/category-soccer.html)
- [FUN TOWN PARKING](https://thelearnquesters.pages.dev/fun-town-parking.html)
- [CATEGORY PUZZLE 3](https://themindzone.pages.dev/category-puzzle-3.html)
- [CATEGORY POINT AND CLICK124](https://themindzone.pages.dev/category-point-and-click124.html)
- [SHELL STRIKERS](https://studyplayings.web.app/shell-strikers.html)
- [FROGGA](https://thelearnquesters.pages.dev/frogga.html)
- [ITALIAN BRAINROT CLICKER](https://studyquesthub.web.app/italian-brainrot-clicker.html)
- [ESCAPE AGAIN](https://thelearnquesters.pages.dev/escape-again.html)
- [MEGA RAMP CAR STUNTS](https://studyplaying.github.io/mega-ramp-car-stunts.html)
- [HILL CLIMBING MANIA](https://thelearnquesters.pages.dev/hill-climbing-mania.html)
- [INDEX20](https://theskillquest.pages.dev/index20.html)
- [MERGE BRAINROT](https://themindzone.pages.dev/merge-brainrot.html)
- [EMPIRE CITY](https://studyplayings.pages.dev/empire-city.html)
- [CATEGORY DEFENSE](https://quizverses.github.io/category-defense.html)
- [CATEGORY SOLITAIRE](https://thelearnquesters.pages.dev/category-solitaire.html)
- [BALL MANIA](https://thelearnquesters.pages.dev/ball-mania.html)
- [CHILL CLICKER](https://themindzone.pages.dev/chill-clicker.html)
- [FLAPPY RUSH](https://quizverses.github.io/flappy-rush.html)
- [BURGER CATCH](https://thelearnquesters.pages.dev/burger-catch.html)
- [MATH RUNNER](https://themindzone.pages.dev/math-runner.html)
- [END OF WORLD](https://theskillquest.pages.dev/end-of-world.html)
- [BRAINROT CLEANING](https://quizverses-9d2f2.web.app/brainrot-cleaning.html)
- [MONSTER SCHOOL 2](https://thelearnquesters.pages.dev/monster-school-2.html)
- [POP PUZZLE](https://thelearnquesters.pages.dev/pop-puzzle.html)
- [GRANNY HALLOWEEN HOUSE](https://studyquests.github.io/granny-halloween-house.html)
- [CATEGORY SIMULATION 4](https://themindzone.pages.dev/category-simulation-4.html)
- [ACOX RUNNER](https://quizverses.github.io/acox-runner.html)
- [TAILOR STYLIST FASHION DIARY](https://studyplayings.web.app/tailor-stylist-fashion-diary.html)
- [SOCCER ARENA X](https://studyquests.github.io/soccer-arena-x.html)
- [LIMITED KABOOM](https://studyplayings.pages.dev/limited-kaboom.html)
