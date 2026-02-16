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

import ApexCharts from '../apexcharts.js'
import { SSRRenderer } from './SSRRenderer.js'
import { Hydration } from './Hydration.js'

// Extend ApexCharts with SSR static methods
ApexCharts.renderToString = SSRRenderer.renderToString.bind(SSRRenderer)
ApexCharts.renderToHTML = SSRRenderer.renderToHTML.bind(SSRRenderer)

// Extend ApexCharts with hydration static methods
ApexCharts.hydrate = Hydration.hydrate.bind(Hydration)
ApexCharts.hydrateAll = Hydration.hydrateAll.bind(Hydration)
ApexCharts.isHydrated = Hydration.isHydrated.bind(Hydration)

// Export the extended ApexCharts class as default
export default ApexCharts

// Also export individual SSR components for advanced use cases
export { SSRRenderer, Hydration }
