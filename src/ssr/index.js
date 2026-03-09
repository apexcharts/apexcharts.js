// @ts-check
/**
 * ApexCharts SSR Entry Point
 *
 * This module extends the main ApexCharts class with SSR-specific static methods
 * for server-side rendering and client-side hydration.
 *
 * Usage in Node.js / SSR environments:
 *   import ApexCharts from 'apexcharts/ssr';
 *   const svgString = await ApexCharts.renderToString(options);
 *
 * Usage in browser for hydration:
 *   import ApexCharts from 'apexcharts';  // or 'apexcharts/client'
 *   const chart = ApexCharts.hydrate(element);
 */

import ApexCharts from '../entries/full.js'
import { SSRRenderer } from './SSRRenderer.js'
import { Hydration } from './Hydration.js'

// Extend ApexCharts with SSR static methods
// @ts-ignore — SSR methods are monkey-patched onto the class at runtime
ApexCharts.renderToString = SSRRenderer.renderToString.bind(SSRRenderer)
// @ts-ignore
ApexCharts.renderToHTML = SSRRenderer.renderToHTML.bind(SSRRenderer)

// Extend ApexCharts with hydration static methods
// @ts-ignore
ApexCharts.hydrate = Hydration.hydrate.bind(Hydration)
// @ts-ignore
ApexCharts.hydrateAll = Hydration.hydrateAll.bind(Hydration)
// @ts-ignore
ApexCharts.isHydrated = Hydration.isHydrated.bind(Hydration)

// Export the extended ApexCharts class as default
export default ApexCharts

// Also export individual SSR components for advanced use cases
export { SSRRenderer, Hydration }
