// @ts-check
/**
 * Facet (#13): OS-aware theming feature.
 *
 * Registers the `OSThemeWatcher` so `theme.follow: 'os'` reacts to the OS
 * `prefers-color-scheme` / `prefers-contrast` settings. The design-token layer
 * (`--apx-*`) lives in core `Theme` and needs no feature; this feature only
 * adds the reactive OS watcher (which touches `matchMedia`, so it is kept
 * optional / tree-shakeable and SSR-inert).
 *
 * @module features/facet
 */
import ApexCharts from '../apexcharts'
import OSThemeWatcher from '../modules/theme/OSThemeWatcher'

ApexCharts.registerFeatures({ osThemeWatcher: OSThemeWatcher })

export default ApexCharts
