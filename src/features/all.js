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
