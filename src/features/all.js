// @ts-check
/**
 * Registers all optional ApexCharts feature modules.
 *
 * Imported by src/entries/full.js to preserve the existing full-bundle
 * behaviour where every feature is available out of the box.
 *
 * For a minimal custom bundle, import only the features you need:
 *
 *   import 'apexcharts/features/legend'
 *   import 'apexcharts/features/exports'
 *   // etc. (tooltip is always included — it is part of core)
 */
import './exports.js'
import './legend.js'
import './toolbar.js'
import './annotations.js'
import './keyboard.js'
import './morph.js'
import './drilldown.js'
import './perspectives.js'
import './history.js'
import './weave.js'
import './renderer-canvas.js'
import './marks.js'
import './facet.js'
import './link.js'
import './ink.js'
import './measure.js'
import './context-menu.js'
