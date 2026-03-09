/**
 * globals.d.ts — Window / global augmentations and asset module declarations.
 *
 * ApexCharts attaches SVG.js and Apex config to window (browser) / global (Node.js)
 * at startup. These declarations tell TypeScript about those properties so that
 * `window.SVG`, `window.Apex`, `global.SVG`, and `global.Apex` are known types.
 *
 * Asset modules: SVG icons are imported as strings (inlined by the bundler).
 * CSS files are imported for side-effects only.
 */

interface Window {
  /** SVG.js library instance — attached by InitCtxVariables at startup */
  SVG: any
  /** Global Apex config override object — attached by InitCtxVariables at startup */
  Apex: Record<string, any>
}

declare namespace NodeJS {
  interface Global {
    SVG: any
    Apex: Record<string, any>
  }
}

/** Global Apex config/instance registry — standalone var in browser scope */
declare var Apex: Record<string, any>

// Aliases for types from types/apexcharts.d.ts that are used in JSDoc annotations
// inside apexcharts.js. Since types/apexcharts.d.ts uses `export =` (making it a
// module-style declaration), its top-level types are not globally visible in ES
// module source files. We redeclare the ones needed as standalone global types.
type ApexOptions = {
  [key: string]: any
}
type ApexAxisChartSeries = Array<{
  name?: string
  data: Array<any>
  [key: string]: any
}>
type ApexNonAxisChartSeries = number[] | ApexAxisChartSeries
type XAxisAnnotations = { [key: string]: any }
type YAxisAnnotations = { [key: string]: any }
type PointAnnotations = { [key: string]: any }

/** SVG asset imports — bundler inlines them as strings */
declare module '*.svg' {
  const content: string
  export default content
}

/** CSS asset imports — side-effects only */
declare module '*.css' {
  const content: string
  export default content
}
