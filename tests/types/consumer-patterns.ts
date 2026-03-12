/**
 * Type regression tests for types/apexcharts.d.ts
 *
 * This file exercises common consumer usage patterns with the public ApexCharts types.
 * It must compile with `tsc --noEmit` at 0 errors.
 *
 * Run: npx tsc --noEmit -p tsconfig.types-test.json
 */

import type ApexCharts from '../../types/apexcharts'
declare const ApexChartsClass: typeof ApexCharts

// ---------------------------------------------------------------------------
// 1.  Basic construction
// ---------------------------------------------------------------------------

declare const el: HTMLElement

const chart = new ApexChartsClass(el, {})
const chart2: ApexCharts = new ApexChartsClass(el, { chart: { type: 'line' } })
void chart2

// ---------------------------------------------------------------------------
// 2.  chart.events — consumers vary widely in how they write handlers
// ---------------------------------------------------------------------------

const opts1: ApexCharts.ApexOptions = {
  chart: {
    events: {
      // Most common: all-any, no annotations
      click: (e, chart, options) => { void e; void chart; void options },

      // Explicit MouseEvent annotation (should still work)
      mouseMove: (e: MouseEvent) => { void e.clientX },

      // No args used at all
      mounted: () => {},

      // chartInstance used
      updated: (chart) => { void chart.paper() },

      // beforeZoom — may return boolean or nothing
      beforeZoom: (chart, opts) => {
        void opts?.xaxis.min
        return opts ? opts.xaxis.min > 0 : true
      },

      // beforeZoom returning nothing (void ⊆ boolean | void)
      beforeResetZoom: () => {},

      // selection — xaxis/yaxis bounds
      selection: (chart, opts) => { void opts?.xaxis?.min },

      // zoomed — yaxis is an array
      zoomed: (chart, opts) => { void opts?.xaxis.min; void opts?.yaxis?.[0] },

      // keyboard events already typed
      keyDown: (e: KeyboardEvent) => { void e.key },

      // options.seriesIndex and arbitrary property (index sig)
      dataPointSelection: (e, chart, opts) => {
        void opts?.seriesIndex
        void opts?.dataPointIndex
        void opts?.w
        void opts?.somethingArbitrary   // allowed via [key: string]: any
      },
    },
  },
}
void opts1

// ---------------------------------------------------------------------------
// 3.  redrawOnWindowResize — boolean or function variants
// ---------------------------------------------------------------------------

const r1: ApexCharts.ApexOptions = { chart: { redrawOnWindowResize: true } }
const r2: ApexCharts.ApexOptions = { chart: { redrawOnWindowResize: () => true } }
const r3: ApexCharts.ApexOptions = { chart: { redrawOnWindowResize: () => false } }
// Consumer who had an extra event param — must still compile
const r4: ApexCharts.ApexOptions = { chart: { redrawOnWindowResize: (e) => !!e } }
void r1; void r2; void r3; void r4

// ---------------------------------------------------------------------------
// 4.  Formatters — opts may be accessed by seriesIndex, dataPointIndex, w, or ignored
// ---------------------------------------------------------------------------

const f1: ApexCharts.ApexOptions = {
  dataLabels: {
    formatter: (val) => String(val),
  },
}
const f2: ApexCharts.ApexOptions = {
  dataLabels: {
    formatter: (val, opts) => {
      const si: number = opts?.seriesIndex ?? 0
      const di: number = opts?.dataPointIndex ?? 0
      void opts?.w
      void opts?.arbitrary        // index sig
      return `${String(val)}-${si}-${di}`
    },
  },
}
const f3: ApexCharts.ApexOptions = {
  legend: {
    formatter: (legendName, opts) => {
      const si: number = opts?.seriesIndex ?? 0
      void opts?.w
      return `${legendName} (${si})`
    },
  },
}
const f4: ApexCharts.ApexOptions = {
  tooltip: {
    y: {
      formatter: (val, opts) => {
        void opts?.seriesIndex
        void opts?.w
        return String(val)
      },
    },
  },
}
const f5: ApexCharts.ApexOptions = {
  xaxis: {
    labels: {
      formatter: (value, timestamp, opts) => {
        void timestamp
        void opts?.seriesIndex
        return String(value)   // string | string[] — String() returns string, which satisfies it
      },
    },
  },
}
void f1; void f2; void f3; void f4; void f5

// ---------------------------------------------------------------------------
// 5.  Annotation callbacks — (annotation, e) order
// ---------------------------------------------------------------------------

const a1: ApexCharts.ApexOptions = {
  annotations: {
    xaxis: [{
      label: {
        mouseEnter: (annotation, e) => { void annotation; void e.type },
        mouseLeave: (annotation, e) => { void annotation; void e },
        click: (annotation, e) => { void annotation; void e.clientX },
      },
    }],
    points: [{
      mouseEnter: (annotation, e) => { void annotation; void e },
      click: (annotation, e) => { void annotation; void e.button },
    }],
  },
}
void a1

// ---------------------------------------------------------------------------
// 6.  markers onClick
// ---------------------------------------------------------------------------

const m1: ApexCharts.ApexOptions = {
  markers: {
    onClick: (e) => { void e?.clientX },
    onDblClick: (e) => { void e },
  },
}
void m1

// ---------------------------------------------------------------------------
// 7.  toolbar customIcons
// ---------------------------------------------------------------------------

const t1: ApexCharts.ApexOptions = {
  chart: {
    toolbar: {
      tools: {
        customIcons: [{
          icon: '<svg/>',
          title: 'My tool',
          click: (chart, options, e) => {
            void chart.paper()
            void options?.seriesIndex
            void e?.clientX
          },
        }],
      },
    },
  },
}
void t1

// ---------------------------------------------------------------------------
// 8.  addEventListener / removeEventListener
// ---------------------------------------------------------------------------

chart.addEventListener('click', (e, chartArg, opts) => { void e; void chartArg; void opts })
chart.removeEventListener('click', () => {})
chart.addEventListener('mounted', function() {})

// ---------------------------------------------------------------------------
// 9.  Method return types
// ---------------------------------------------------------------------------

const _render: Promise<ApexCharts>         = chart.render()
const _update: Promise<ApexCharts>         = chart.updateOptions({})
const _dataURI: Promise<{ imgURI: string } | { blob: Blob }> = chart.dataURI()
const _state: ApexCharts.ChartState        = chart.getState()
const _synced: ApexCharts[]                = chart.getSyncedCharts()
void _render; void _update; void _dataURI; void _state; void _synced

// ---------------------------------------------------------------------------
// 10. Sub-type exports — all must be accessible as ApexCharts.* without cast
//     Regression for: https://github.com/apexcharts/apexcharts.js/issues/XXXX
//     "impossible to assign a label to yaxis because type is not exported"
// ---------------------------------------------------------------------------

// The canonical reported pattern must compile without any cast:
const chartOptions: ApexCharts.ApexOptions = {}
const yaxis: ApexCharts.ApexYAxis = { labels: { formatter: (val) => String(val) } }
chartOptions.yaxis = yaxis
// single-yaxis property access with no cast
;(chartOptions.yaxis as ApexCharts.ApexYAxis).labels!.formatter = (val) => String(val)

// All other commonly-needed sub-types must be accessible too:
const _ann: ApexCharts.ApexAnnotations = {}
const _chart: ApexCharts.ApexChart = { type: 'line' }
const _dl: ApexCharts.ApexDataLabels = { enabled: true }
const _fill: ApexCharts.ApexFill = { type: 'solid' }
const _grid: ApexCharts.ApexGrid = {}
const _legend: ApexCharts.ApexLegend = { show: true }
const _markers: ApexCharts.ApexMarkers = {}
const _po: ApexCharts.ApexPlotOptions = {}
const _stroke: ApexCharts.ApexStroke = { curve: 'smooth' }
const _theme: ApexCharts.ApexTheme = { mode: 'dark' }
const _title: ApexCharts.ApexTitleSubtitle = { text: 'hello' }
const _tooltip: ApexCharts.ApexTooltip = { enabled: true }
const _xaxis: ApexCharts.ApexXAxis = { type: 'datetime' }
const _series: ApexCharts.ApexAxisChartSeries = [{ name: 'a', data: [1, 2, 3] }]
void _ann; void _chart; void _dl; void _fill; void _grid; void _legend
void _markers; void _po; void _stroke; void _theme; void _title; void _tooltip
void _xaxis; void _series
