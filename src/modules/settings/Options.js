// @ts-check
/**
 * ApexCharts Options for setting the initial configuration of ApexCharts
 **/
import en from './../../locales/en.json'

export default class Options {
  constructor() {
    this.yAxis = {
      show: true,
      showAlways: false,
      showForNullSeries: true,
      seriesName: undefined,
      opposite: false,
      reversed: false,
      logarithmic: false,
      logBase: 10,
      tickAmount: undefined,
      stepSize: undefined,
      forceNiceScale: false,
      alignZero: false,
      max: undefined,
      min: undefined,
      floating: false,
      decimalsInFloat: undefined,
      labels: {
        show: true,
        showDuplicates: false,
        minWidth: 0,
        maxWidth: 160,
        offsetX: 0,
        offsetY: 0,
        align: undefined,
        rotate: 0,
        padding: 20,
        style: {
          colors: [],
          fontSize: '11px',
          fontWeight: 400,
          fontFamily: undefined,
          cssClass: '',
        },
        formatter: undefined,
      },
      axisBorder: {
        show: false,
        color: '#e0e0e0',
        width: 1,
        offsetX: 0,
        offsetY: 0,
      },
      axisTicks: {
        show: false,
        color: '#e0e0e0',
        width: 6,
        offsetX: 0,
        offsetY: 0,
      },
      title: {
        text: undefined,
        rotate: -90,
        offsetY: 0,
        offsetX: 0,
        style: {
          color: undefined,
          fontSize: '11px',
          fontWeight: 900,
          fontFamily: undefined,
          cssClass: '',
        },
      },
      tooltip: {
        enabled: false,
        offsetX: 0,
      },
      crosshairs: {
        show: true,
        position: 'front',
        stroke: {
          color: '#b6b6b6',
          width: 1,
          dashArray: 0,
        },
      },
    }

    this.pointAnnotation = {
      id: undefined,
      x: 0,
      y: null,
      yAxisIndex: 0,
      seriesIndex: undefined,
      mouseEnter: undefined,
      mouseLeave: undefined,
      click: undefined,
      marker: {
        size: 4,
        fillColor: '#fff',
        strokeWidth: 2,
        strokeColor: '#333',
        shape: 'circle',
        offsetX: 0,
        offsetY: 0,
        // radius: 2, // DEPRECATED
        cssClass: '',
      },
      label: {
        borderColor: '#c2c2c2',
        borderWidth: 1,
        borderRadius: 2,
        text: undefined,
        textAnchor: 'middle',
        offsetX: 0,
        offsetY: 0,
        mouseEnter: undefined,
        mouseLeave: undefined,
        click: undefined,
        style: {
          background: '#fff',
          color: undefined,
          fontSize: '11px',
          fontFamily: undefined,
          fontWeight: 400,
          cssClass: '',
          padding: {
            left: 5,
            right: 5,
            top: 2,
            bottom: 2,
          },
        },
      },
      customSVG: {
        // this will be deprecated in the next major version as it is going to be replaced with a better alternative below (image)
        SVG: undefined,
        cssClass: undefined,
        offsetX: 0,
        offsetY: 0,
      },
      image: {
        path: undefined,
        width: 20,
        height: 20,
        offsetX: 0,
        offsetY: 0,
      },
      tooltip: {
        // Show a hover tooltip over the annotation marker, like a regular
        // data point. Lets you surface richer detail than fits in the label.
        enabled: false,
        // Static tooltip content (HTML allowed; array joined with <br/>).
        // Falls back to label.text when omitted.
        text: undefined,
        // formatter({ annotation, seriesIndex, id, w }) => string (HTML).
        // Takes precedence over `text` when provided.
        formatter: undefined,
        // 'light' | 'dark'. Falls back to the global tooltip.theme.
        theme: undefined,
        offsetX: 0,
        offsetY: 0,
      },
    }

    this.yAxisAnnotation = {
      id: undefined,
      y: 0,
      y2: null,
      strokeDashArray: 1,
      fillColor: '#c2c2c2',
      borderColor: '#c2c2c2',
      borderWidth: 1,
      opacity: 0.3,
      offsetX: 0,
      offsetY: 0,
      width: '100%',
      yAxisIndex: 0,
      label: {
        borderColor: '#c2c2c2',
        borderWidth: 1,
        borderRadius: 2,
        text: undefined,
        textAnchor: 'end',
        position: 'right',
        offsetX: 0,
        offsetY: -3,
        mouseEnter: undefined,
        mouseLeave: undefined,
        click: undefined,
        style: {
          background: '#fff',
          color: undefined,
          fontSize: '11px',
          fontFamily: undefined,
          fontWeight: 400,
          cssClass: '',
          padding: {
            left: 5,
            right: 5,
            top: 2,
            bottom: 2,
          },
        },
      },
    }

    this.xAxisAnnotation = {
      id: undefined,
      x: 0,
      x2: null,
      strokeDashArray: 1,
      fillColor: '#c2c2c2',
      borderColor: '#c2c2c2',
      borderWidth: 1,
      opacity: 0.3,
      offsetX: 0,
      offsetY: 0,
      label: {
        borderColor: '#c2c2c2',
        borderWidth: 1,
        borderRadius: 2,
        text: undefined,
        textAnchor: 'middle',
        orientation: 'vertical',
        position: 'top',
        offsetX: 0,
        offsetY: 0,
        mouseEnter: undefined,
        mouseLeave: undefined,
        click: undefined,
        style: {
          background: '#fff',
          color: undefined,
          fontSize: '11px',
          fontFamily: undefined,
          fontWeight: 400,
          cssClass: '',
          padding: {
            left: 5,
            right: 5,
            top: 2,
            bottom: 2,
          },
        },
      },
    }

    this.text = {
      x: 0,
      y: 0,
      text: '',
      textAnchor: 'start',
      foreColor: undefined,
      fontSize: '13px',
      fontFamily: undefined,
      fontWeight: 400,
      appendTo: '.apexcharts-annotations',
      backgroundColor: 'transparent',
      borderColor: '#c2c2c2',
      borderRadius: 0,
      borderWidth: 0,
      paddingLeft: 4,
      paddingRight: 4,
      paddingTop: 2,
      paddingBottom: 2,
    }
  }
  init() {
    return {
      annotations: {
        yaxis: [this.yAxisAnnotation],
        xaxis: [this.xAxisAnnotation],
        points: [this.pointAnnotation],
        texts: [],
        images: [],
        shapes: [],
      },
      // Weave (#1): public plugin platform. Per-chart activation list:
      // { name, options?, order? }. Requires the Weave host to be bundled
      // (`import 'apexcharts/features/weave'`, included in the full bundle) and
      // the plugin registered via ApexCharts.registerPlugin().
      plugins: [],
      // Trellis (#22): small multiples / faceting. Requires the trellis
      // feature (`import 'apexcharts/features/trellis'`, included in the full
      // bundle). Setting `by` makes this chart a trellis HOST: the series
      // array is split into one panel per facet-key value, each panel is a
      // real chart of this chart.type, and the trellis owns everything shared
      // (scale domains, pixel-aligned plot rects, color-by-series-name, one
      // legend/title/toolbar, headers, responsive columns).
      trellis: {
        // Facet accessor: a series-object key name, or (series, i) => key.
        // Series WITHOUT the key repeat in every panel (reference series).
        by: undefined,
        // Tidy-row input (alternative to `series`): a row table pivoted by
        // the `by`/`x`/`y`/`seriesBy` COLUMN NAMES. Rows win over `series`
        // when both are given. Duplicate (panel, series, x) rows keep the
        // last and warn; aggregate the rows first for sums/means.
        data: undefined, // [{ date, region, revenue }, ...]
        x: undefined, // x-value column name (tidy form only)
        y: undefined, // y-value column name (tidy form only)
        seriesBy: undefined, // optional series-name column (tidy form only)
        // Layout
        columns: 'auto', // 'auto' (fit minPanelWidth) | number
        minPanelWidth: 220, // px; drives 'auto' and the responsive collapse
        gap: 12, // px between cells
        aspectRatio: 1.6, // panel w:h when no explicit height governs
        panelHeight: undefined, // px; wins over aspectRatio/chart.height
        order: 'first-seen', // | 'asc' | 'desc' | string[] | comparator
        limit: undefined, // render only the first N panels (warns)
        // Virtualization: 'auto' mounts only the panels intersecting the
        // viewport (plus one row) once the grid exceeds 64 panels; true
        // always virtualizes; false always renders eagerly. Unmounted cells
        // keep their header and a fixed-height skeleton (page height and
        // scroll position never shift); a panel that scrolls out is
        // destroyed with its view state stashed, and a remount restores its
        // zoom window. getPanel(key) returns null for unmounted panels.
        virtualize: 'auto', // 'auto' | true | false
        // Scale resolution per channel: 'shared' | 'independent'.
        // Independent y still renders pixel-aligned panels (the gutter pass
        // equalizes axis widths); independent scales force their own axis
        // labels on every panel.
        scales: {
          x: 'shared',
          y: 'shared',
          color: 'shared',
          size: 'shared',
        },
        // Per-cell facet headers.
        header: {
          show: true,
          formatter: undefined, // (key, { dimension, index, count }) => string
          style: {
            fontSize: undefined,
            fontWeight: undefined,
            color: undefined,
          },
        },
        // Axis-label policy: 'edges' shows y labels on the first column and x
        // labels on each column's bottom panel (label SPACE is always
        // reserved everywhere, so panels stay aligned); 'all' | 'none'.
        axes: {
          labels: 'edges',
        },
        legend: 'shared', // 'shared' | 'none' (per-panel legends are hidden)
        toolbar: 'shared', // 'shared' | 'none' (zoom / pan / reset)
        // 'panel': tooltip card only in the hovered panel, crosshair sweeps
        // all panels. 'sync': every panel shows its own card at the hovered x.
        // 'grid': ONE card near the cursor with one row per panel at the
        // hovered x (composed from the panels' own tooltips, so every
        // formatter is honored; unmounted virtualized panels have no row).
        tooltip: 'panel',
        zoom: 'sync', // 'sync' (drag/wheel zoom moves every panel) | 'none'
        // Panel promotion: clicking a cell's header expands that panel to
        // the grid's full width, with an "All panels" breadcrumb back
        // (also chart.promotePanel(key) / chart.restorePanels()).
        promote: true,
        targetTicks: 4, // tick density for the shared nice y scale
        // Per-panel option override, applied last:
        // (key, { index, seriesNames }) => partial options
        panel: undefined,
      },
      chart: {
        animations: {
          // Master switch — set false to render charts without any animation.
          // Each chart type gets a tailored initial-mount animation by default:
          //   line/area/rangeArea/radar: pen-stroke draw + radial fill bloom
          //   bar/stacked/range/funnel:  grow from baseline (+ stagger)
          //   scatter/bubble:            scale-up pop with overshoot
          //   heatmap:                   diagonal-wave cell reveal
          //   treemap:                   largest-tile-first cascade
          //   pie/donut/polar/gauge:     arc sweep + needle settle
          // Speed is controlled by `speed`; per-element stagger by
          // `animateGradually.enabled` / `animateGradually.delay`.
          enabled: true,
          speed: 800,
          // Cadence (#6): easing for the generic tweens (data-update value
          // transitions, path morphs, marker animate). A registered name, a
          // cubic-bezier [x1,y1,x2,y2] array, or a function (t in [0,1]).
          // 'easeInOutSine' is the historical curve, so the default is
          // behavior-neutral. The tuned initial-draw pen/pop easings are fixed.
          easing: 'easeInOutSine',
          animateGradually: {
            // Drives per-element stagger across all chart types. When enabled,
            // bars/heatmap-cells/scatter-points/treemap-tiles reveal in
            // sequence; line/area markers fade in progressively along the
            // draw. `delay` is the requested step in ms (auto-capped per
            // chart so total stagger ≤ ~half the animation duration).
            delay: 150,
            enabled: true,
          },
          dynamicAnimation: {
            // Data-change (updateSeries) animation. Independent from the
            // initial-mount animations above.
            enabled: true,
            speed: 350,
            // Easing for data-change morphs only (same accepted forms as
            // `animations.easing`). Unset -> inherit the chart-wide easing,
            // except detected streaming scrolls (rolling window / append
            // under xaxis.range) which default to 'linear' so the window
            // slides at constant velocity instead of pulsing each tick.
            easing: undefined,
          },
          chartTypeMorph: {
            // Cross-type morph (updateOptions changing chart.type). Bridges
            // the destroy+recreate flicker by sampling source + target paths
            // into N evenly-spaced perimeter points and tweening point-by-point
            // with rotation-search alignment, so the transition is always smooth
            // and non-self-intersecting even between very different shapes (bar
            // rect ↔ pie wedge / radial arc). Supported pairs include bar ↔
            // pie / donut / radialBar / polarArea / funnel / pyramid (plus the
            // trivial pie ↔ donut ↔ polarArea cases). Falls back to instant
            // snap when types or data shape are incompatible.
            enabled: true,
            speed: 600,
          },
          // Honor the OS-level prefers-reduced-motion setting. When true (default)
          // and the user has the accessibility preference enabled, all initial-mount
          // animations are skipped and the chart renders instantly.
          respectReducedMotion: true,
          // Above this many data points, per-element morph + stagger (which
          // spins up one JS-driven animation timeline per path — three chained
          // tweens each in morphSVG) is replaced by a single GPU-composited
          // opacity fade of the whole series. Thousands of candlesticks/bars
          // otherwise jank the main thread on initial render and on every zoom.
          // The fade reuses the existing delayedElements reveal so the result
          // still animates in, just at O(1) cost instead of O(n). Set to 0 to
          // always animate per-element regardless of dataset size.
          largeDatasetThreshold: 1000,
        },
        background: '',
        locales: [en],
        defaultLocale: 'en',
        // Perspectives (#10): serializable/shareable view state. Passive:
        // requires `import 'apexcharts/features/perspectives'`. serializeOptions
        // is the whitelist of function-free option paths stored in a token.
        perspectives: {
          serializeOptions: ['theme', 'xaxis', 'yaxis', 'title', 'subtitle'],
        },
        // Rewind (#3): undo/redo history. Opt-in (bundle + behavior): requires
        // `import 'apexcharts/features/history'` AND chart.history.enabled.
        history: {
          enabled: false,
          maxDepth: 100,
          coalesceMs: 250,
          keyboard: true,
        },
        // Strata (#2): hybrid SVG+canvas series renderer. 'svg' (default) |
        // 'canvas' | 'auto'. 'auto'/'canvas' need the canvas renderer feature
        // (`import 'apexcharts/features/renderer-canvas'`); without it, or with
        // a canvas-unsupported feature (pattern/image fill, color-matrix state
        // filters), selection falls back to 'svg'. Only the series layer is
        // canvas-capable in v1; chrome stays SVG.
        renderer: 'svg',
        rendererThreshold: 8000,
        layers: {
          series: 'auto',
          grid: 'svg',
          annotations: 'svg',
          dataLabels: 'svg',
        },
        dropShadow: {
          enabled: false,
          enabledOnSeries: undefined,
          top: 2,
          left: 2,
          blur: 4,
          color: '#000',
          opacity: 0.7,
        },
        events: {
          animationEnd: undefined,
          beforeMount: undefined,
          mounted: undefined,
          updated: undefined,
          click: undefined,
          mouseMove: undefined,
          mouseLeave: undefined,
          xAxisLabelClick: undefined,
          legendClick: undefined,
          markerClick: undefined,
          selection: undefined,
          dataPointSelection: undefined,
          dataPointMouseEnter: undefined,
          dataPointMouseLeave: undefined,
          beforeZoom: undefined,
          beforeResetZoom: undefined,
          zoomed: undefined,
          scrolled: undefined,
          brushScrolled: undefined,
          crossFilter: undefined,
          filterChange: undefined,
          annotationDragged: undefined,
          annotationEdited: undefined,
          annotationCreated: undefined,
          annotationStyled: undefined,
          annotationDeleted: undefined,
          measured: undefined,
          keyDown: undefined,
          keyUp: undefined,
        },
        foreColor: '#373d3f',
        fontFamily: 'Helvetica, Arial, sans-serif',
        height: 'auto',
        parentHeightOffset: 15,
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        id: undefined,
        group: undefined,
        nonce: undefined,
        // Per-chart license key override for the gated premium features
        // (storyboard, link/crossfilter, ink, measure, contextMenu,
        // perspectives, history). Most specific wins: chart.license ->
        // ApexCharts.setLicense() -> window.Apex.license -> unlicensed (trial
        // watermark). Shared across the ApexCharts family. See setLicense().
        license: undefined,
        offsetX: 0,
        offsetY: 0,
        injectStyleSheet: true,
        selection: {
          enabled: false,
          type: 'x',
          // selectedPoints: undefined, // default datapoints that should be selected automatically
          fill: {
            color: '#24292e',
            opacity: 0.1,
          },
          stroke: {
            width: 1,
            color: '#24292e',
            opacity: 0.4,
            dashArray: 3,
          },
          xaxis: {
            min: undefined,
            max: undefined,
          },
          yaxis: {
            min: undefined,
            max: undefined,
          },
        },
        sparkline: {
          enabled: false,
        },
        brush: {
          enabled: false,
          autoScaleYaxis: true,
          target: undefined,
          targets: undefined,
        },
        // Linked Views (#4): crossfilter / linked highlighting. Requires the
        // `link` feature. Two modes:
        //   HIGHLIGHT (P1): `enabled` with no `dimension`. Charts sharing a
        //   `chart.group` form a set; brushing a range (needs
        //   `chart.selection.enabled`) dims out-of-range marks in place.
        //   FILTER (P2): set `dimension` (its presence selects this path). Each
        //   chart declares a dimension + reduction over a shared record set
        //   registered with ApexCharts.crossfilter({ id, records }); clicking a
        //   bucket re-aggregates the other charts. See docs/spec.
        link: {
          enabled: false,
          mode: 'highlight',
          dimOpacity: 0.2,
          // FILTER-mode config (all optional except dimension):
          id: undefined, // crossfilter coordinator id (defaults to chart.group)
          dimension: undefined, // (row) => key; presence selects filter mode
          reduce: undefined, // 'count' | { sum|avg|min|max: field } | (rows)=>n
          type: undefined, // 'category' | 'range' (else inferred from bins)
          bins: undefined, // range dims: { width } | { count } | { thresholds }
          order: undefined, // category order: 'first-seen' | 'asc' | 'desc' | fn
          seriesName: undefined, // axis-chart series name (default 'Count')
        },
        // Ink Layer (#7): direct-manipulation annotations. When enabled, every
        // point annotation is draggable (unless it sets draggable:false); or opt
        // in per annotation with annotations.points[].draggable. Clicking an
        // ink-managed annotation opens a floating editor card: rename inline,
        // recolor, toggle bold, step the font size, size/reshape the marker, or
        // delete the note. Axis-line annotations get separate Label and Line
        // color rows, so restyling the label chip never touches the stroke.
        // Requires the `ink` feature. Fires annotationDragged,
        // annotationEdited, annotationStyled and annotationDeleted.
        ink: {
          enabled: false,
          // Show a minimal "add note" tool palette; clicking it arms create
          // mode (the next plot click drops an editable, draggable annotation).
          palette: false,
          // Snap a dragged point / axis-line annotation to the nearest gridline
          // (numeric x + linear y). Undo/redo of ink edits is automatic when the
          // history (Rewind) feature is enabled.
          snap: false,
          // Accent swatches offered by the floating note editor; defaults to a
          // built-in 6-color palette when undefined.
          noteColors: undefined,
        },
        // Measure ruler (#18): a measure/delta ruler. Requires the `measure`
        // feature. Hold `key` (default 'm') and drag A->B on the plot, or call
        // chart.startMeasure()/chart.stopMeasure() to arm it. The live ruler
        // reads dx, dy, %change and slope; on release it pins as a data-anchored
        // overlay that re-projects on zoom/resize. Fires `measured`.
        measure: {
          enabled: false,
          // 'span' (default): finance-style vertical band between two x-points
          // with a "change (%) + range" readout, endpoints snapped to the first
          // series. 'free': a diagonal ruler between two arbitrary points.
          mode: 'span',
          key: 'm',
          pinOnRelease: true,
          // Styling tokens. Every element also carries a stable CSS class
          // (apexcharts-measure-band / -vline / -line / -label-bg / -label,
          // group gets apexcharts-measure-up|down|flat). Colors are left
          // undefined so they resolve config -> `--apx-measure-*` CSS custom
          // property -> built-in default; set them here to force a color from JS.
          colors: {
            up: undefined,
            down: undefined,
            neutral: undefined,
            guide: undefined,
          },
          band: true, // span mode: shaded band between the two x-positions
          guides: true, // span mode: vertical dashed reference lines
          markers: true, // endpoint dots on the series line
          // Content: value formatters and a full readout override. `label`
          // receives { from, to, dx, dy, percentChange, slope, mode } and
          // returns a string or string[] (lines).
          format: { x: undefined, y: undefined, percent: undefined },
          label: undefined,
        },
        // Radial Actions (#chrome): right-click / long-press context menu.
        // Requires the `contextMenu` feature. Each action receives the clicked
        // data coordinates, so verbs act at the point (not chart-wide like a
        // toolbar button). `items` is an ordered list of built-in ids
        // ('annotate' | 'xline' | 'yline' | 'measure') and/or custom
        // { id, label, icon, onClick(ctx, { x, y, seriesIndex, dataPointIndex,
        // clientX, clientY }) }. 'measure' is shown only when the measure tool
        // is enabled. `labels` overrides built-in text; `noteText` is the label
        // dropped by 'annotate'.
        contextMenu: {
          enabled: false,
          items: ['annotate', 'xline', 'yline', 'measure'],
          labels: {
            annotate: undefined,
            xline: undefined,
            yline: undefined,
            measure: undefined,
          },
          noteText: 'Note',
          // 'xline' ("Annotate here") drops a dashed vertical LINE at the
          // clicked x; 'yline' ("Mark this level") a dashed horizontal line at
          // the clicked y. Lines only, never a range rectangle. Like the note,
          // a line is ink-managed when the ink feature is bundled: it opens
          // the floating editor (rename; separate Label and Line color rows,
          // so restyling the chip cannot blank the stroke; delete), drags
          // along its axis, and undoes via Rewind. `line` styles both items.
          line: {
            text: '', // label drawn on the line; empty for no label
            strokeDashArray: 4,
            color: undefined, // undefined keeps the annotation default color
          },
        },
        stacked: false,
        stackOnlyBar: true, // mixed chart with stacked bars and line series - incorrect line draw #907
        stackType: 'normal',
        // Real-time streaming mode. When enabled, appendData() bounds memory
        // automatically: each series is trimmed to `maxPoints` (when set) or
        // to the visible `xaxis.range` window plus a two-point off-screen
        // runway (so exiting segments slide off the left edge instead of
        // popping). The scroll animation itself needs no opt-in; updates
        // that continue the previous window (appendData, or updateSeries with
        // a shifted fixed-length window) always translate at constant
        // velocity; see modules/animations/StreamScroll.
        streaming: {
          enabled: false,
          maxPoints: undefined,
        },
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            // Shown only when the measure ruler is active (chart.measure.enabled
            // and the `measure` feature bundled). Toggles the measure tool; set
            // false to keep the ruler key-driven only. See chart.measure.
            measure: true,
            customIcons: [],
          },
          export: {
            csv: {
              filename: undefined,
              columnDelimiter: ',',
              headerCategory: 'category',
              headerValue: 'value',
              categoryFormatter: undefined,
              valueFormatter: undefined,
            },
            png: {
              filename: undefined,
            },
            svg: {
              filename: undefined,
            },
            scale: undefined,
            width: undefined,
            // An exported SVG is a standalone document: it cannot reach the
            // page's @font-face rules, so a custom font falls back to a
            // generic one in the PNG/SVG. When true, matching @font-face
            // rules are inlined as base64 data URIs. See #3617.
            embedFonts: true,
          },
          autoSelected: 'zoom', // accepts -> zoom, pan, selection, measure
        },
        type: 'line',
        width: '100%',
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: false,
          // Wheel and pinch zoom can both be triggered without meaning to (a
          // page scroll or a two-finger swipe over the chart), so 'auto' offers
          // them only when the viewer has a way back: the toolbar's reset
          // button. With the toolbar hidden they stay off, since a zoom nobody
          // asked for and nobody can undo is a trap. Set either to true to
          // force the gesture on regardless (for a page that supplies its own
          // reset control), or false to turn it off outright.
          allowMouseWheelZoom: 'auto',
          // Momentum: two-finger pinch-zoom on touch devices. Zooms the x-axis
          // around the pinch centroid (matching the x-only wheel/toolbar zoom),
          // frame-by-frame rather than the 400ms wheel throttle.
          pinch: 'auto',
          zoomedArea: {
            fill: {
              color: '#90CAF9',
              opacity: 0.4,
            },
            stroke: {
              color: '#0D47A1',
              opacity: 0.4,
              width: 1,
            },
          },
        },
        // Momentum: kinetic panning on touch. When a one-finger pan is released
        // with velocity, the chart keeps gliding and decelerates by `friction`
        // each frame, clamping (no elastic overshoot) at the data edges.
        pan: {
          inertia: true,
          friction: 0.92,
        },
        accessibility: {
          enabled: true,
          description: undefined,
          announcements: {
            enabled: true,
          },
          keyboard: {
            enabled: true,
            navigation: {
              enabled: true,
              wrapAround: false,
            },
          },
        },
        dataReducer: {
          enabled: false,
          algorithm: 'lttb',
          targetPoints: 250,
          threshold: 500,
        },
      },
      parsing: {
        x: undefined,
        y: undefined,
      },
      plotOptions: {
        line: {
          isSlopeChart: false,
          colors: {
            threshold: 0,
            colorAboveThreshold: undefined,
            colorBelowThreshold: undefined,
          },
        },
        area: {
          fillTo: 'origin',
        },
        bar: {
          horizontal: false,
          columnWidth: '70%', // should be in percent 0 - 100
          barHeight: '70%', // should be in percent 0 - 100
          distributed: false,
          borderRadius: 0,
          borderRadiusApplication: 'around', // [around, end]
          rangeBarOverlap: true,
          rangeBarGroupRows: false,
          hideZeroBarsWhenGrouped: false,
          isDumbbell: false,
          dumbbellColors: undefined,
          isFunnel: false,
          isFunnel3d: true,
          colors: {
            ranges: [],
            backgroundBarColors: [],
            backgroundBarOpacity: 1,
            backgroundBarRadius: 0,
          },
          dataLabels: {
            position: 'top', // top, center, bottom
            maxItems: 100,
            hideOverflowingLabels: true,
            orientation: 'horizontal',
            total: {
              enabled: false,
              formatter: undefined,
              offsetX: 0,
              offsetY: 0,
              style: {
                color: '#373d3f',
                fontSize: '12px',
                fontFamily: undefined,
                fontWeight: 600,
              },
            },
          },
        },
        bubble: {
          zScaling: true,
          minBubbleRadius: undefined,
          maxBubbleRadius: undefined,
        },
        scatter: {
          // Spread overlapping points apart ("jitter"). Two uses, one engine:
          //  - Strip plot: supply data as { x: 'Category', y: [v1, v2, ...] }.
          //    Each category becomes a band and the values are scattered
          //    horizontally within it. Marker styling comes from the standard
          //    `markers` / `colors` config.
          //  - Overplotting: ordinary { x, y } points get a small random offset
          //    so dense clusters fan out. The underlying data (and tooltip
          //    values) stay exact — only the drawn position moves.
          // Offsets are in axis units (x: 1 = one category step) and are
          // deterministic (stable across re-renders, SSR-safe).
          jitter: {
            enabled: false,
            x: 0, // max ± horizontal offset, in x-axis units
            y: 0, // max ± vertical offset, in y-axis units
            distributed: false, // single series: colour each band differently
            maxPoints: 5000, // per band; excess values are stride-thinned
          },
        },
        candlestick: {
          colors: {
            upward: '#00B746',
            downward: '#EF403C',
          },
          wick: {
            useFillColor: true,
          },
        },
        boxPlot: {
          colors: {
            upper: '#00E396',
            lower: '#008FFB',
          },
          // Where the whiskers reach when the summary is DERIVED from raw
          // observations (a datum supplying `points` instead of a 5-number y,
          // which needs `apexcharts/features/stats`). Ignored for precomputed
          // summaries, which are drawn exactly as given.
          //   'minmax' → the extremes, so nothing is hidden
          //   'tukey'  → the last observation inside 1.5 * IQR of each
          //              quartile. Points beyond the fence fall outside the
          //              whisker, so pair it with `points.show` or they become
          //              invisible.
          whiskers: 'minmax',
          // Optional individual observations ("jitter") overlaid on each box.
          // Inert unless a data point supplies a `points: number[]` array; off
          // by default so existing boxPlot charts are unchanged.
          points: {
            show: false,
            shape: 'circle', // 'circle' | 'square'
            size: 2.5, // radius (px)
            jitter: 0.5, // 0..1 fraction of the box half-width to scatter within
            maxPoints: 3000, // cap per box; excess is stride-thinned
            opacity: 0.9,
            // 'series-dark' (default) → a darker shade of the series colour,
            // 'series' → the series colour, or any literal colour string.
            fillColor: 'series-dark',
            strokeColor: '#fff',
            strokeWidth: 1,
            // Optional `colorScale` (undeclared so a user object merges cleanly)
            // colours each dot by its value: { colors, min, max, steps }
          },
        },
        violin: {
          // Multiply the density-derived half-width. 1 = density's own maxWeight
          // maps to half the category slot.
          bandwidthScale: 1,
          // Kernel density estimation, used only when the density is DERIVED
          // from raw observations (a datum supplying `points`, or a flat number
          // array as `y`, which needs `apexcharts/features/stats`). A
          // precomputed density profile is drawn exactly as given.
          //   bandwidth  → kernel width in value units. Unset uses Silverman's
          //                rule of thumb, which takes the smaller of the
          //                standard deviation and a scaled IQR so one distant
          //                outlier cannot smear the curve flat. Note this is a
          //                statistical parameter, unlike `bandwidthScale`
          //                above, which only scales the drawn width.
          //   resolution → density samples per violin (default 64).
          kde: {
            bandwidth: undefined,
            resolution: 64,
          },
          // 'individual' → every violin uses the full slot width (scaled to its
          // own peak). 'group' → all violins share one scale (the densest in the
          // series), so widths stay proportional to density across categories.
          normalize: 'individual',
          // Individual observations ("jitter") overlaid on the violin shape.
          points: {
            show: true,
            shape: 'circle', // 'circle' | 'square'
            size: 2.5, // radius (px)
            jitter: 0.5, // 0..1 fraction of the half-width to scatter within
            constrainToViolin: true, // clamp jitter to the density width at each value
            maxPoints: 3000, // cap per violin; excess is stride-thinned
            opacity: 0.9,
            // Default: a darker shade of each violin's own colour, with a white
            // outline. fillColor accepts 'series-dark' (default), 'series' (the
            // violin's colour as-is), or any literal colour string.
            fillColor: 'series-dark',
            strokeColor: '#fff',
            strokeWidth: 1,
            // Optional `colorScale` (left undeclared so a user object merges
            // cleanly) colours each dot by its value along a ramp:
            //   { colors: ['#0d0887', … '#f0f921'], min, max, steps }
          },
        },
        histogram: {
          // How the bin width is chosen from the raw observations. A rule name
          // ('auto' | 'fd' | 'sturges' | 'scott' | 'rice' | 'sqrt') or a fixed
          // bin count. 'auto' takes the narrower of Freedman-Diaconis and
          // Sturges, falling back to Sturges when the IQR is 0 (which happens
          // as soon as most values are identical).
          bins: 'auto',
          // Explicit bin width in value units. Wins over `bins` when set: use
          // it when the bin boundaries carry meaning (decades, 5-minute
          // buckets) rather than being a statistical choice.
          binWidth: undefined,
          // [min, max] to bin over, instead of the data's own extent. Lets
          // several histograms share one scale.
          range: undefined,
          // y units: 'count' (observations per bin), 'relative' (percent of
          // the series total), or 'density' (count / (n * binWidth), so the
          // total area is 1 and bins of different widths stay comparable).
          normalize: 'count',
          // Running total across bins, i.e. a cumulative distribution.
          cumulative: false,
          // With more than one series, draw every distribution across the FULL
          // bin so they overlay, instead of dividing the bin between them. All
          // series already share one set of edges, and comparing two shapes is
          // the reason to put them on one axis; splitting the bin makes the
          // columns stop touching, which reads as a clustered bar chart rather
          // than a distribution. Set false for side-by-side bars.
          //
          // An overlay is unreadable opaque, so it also softens the fill and
          // drops the bin separator stroke. Both remain overridable.
          overlap: true,
        },
        heatmap: {
          radius: 2,
          enableShades: true,
          shadeIntensity: 0.5,
          reverseNegativeShade: false,
          distributed: false,
          useFillColorAsStroke: false,
          colorScale: {
            inverse: false,
            ranges: [],
            min: undefined,
            max: undefined,
            // Replaces the default categorical legend with a continuous
            // gradient stripe + a hover indicator arrow. Honors
            // `chart.legend.position` (top / right / bottom / left).
            gradientLegend: {
              enabled: false,
              // Strip length along the legend's long axis. Accepts a number
              // (pixels) or a percentage string. For top/bottom placement the
              // percentage is resolved against the chart's SVG width; for
              // left/right placement, against the SVG height.
              width: '70%',
              height: '70%',
              thickness: 12,
              // Alignment of the strip within the legend area:
              //  - top/bottom: 'start' = left, 'center', 'end' = right
              //  - left/right: 'start' = top,  'center', 'end' = bottom
              align: 'center',
              // Number of gradient stops sampled from the shade function when
              // no explicit `ranges` are provided.
              stops: 16,
              // Show min/max labels at the ends of the strip.
              showLabels: true,
              // Show a value tooltip next to the arrow when hovering a cell.
              showHoverValue: true,
              labelStyle: {
                fontSize: '11px',
                fontFamily: undefined,
                colors: undefined,
              },
              arrow: {
                size: 8,
                color: undefined, // falls back to chart.foreColor
              },
              formatter: undefined, // (val) => string, for min/max + hover value
            },
          },
        },
        funnel: {
          // 'rectangle' preserves the existing centered-rectangle funnel
          // geometry. 'trapezoid' produces continuous sloped sides between
          // consecutive stages (each stage's bottom width matches the next
          // stage's top width).
          shape: 'rectangle',
          // For shape: 'trapezoid' only — what to do with the last stage's
          // bottom edge: 'flat' (parallel sides) or 'taper' (taper to a point).
          lastShape: 'flat',
        },
        treemap: {
          enableShades: true,
          shadeIntensity: 0.5,
          distributed: false,
          reverseNegativeShade: false,
          useFillColorAsStroke: false,
          borderRadius: 4,
          dataLabels: {
            format: 'scale', // scale | truncate
            // Skip a tile's label when it would render below this size.
            //
            // With `format: 'scale'` the font size follows the tile's area, so
            // on a dense treemap most tiles ask for text a few pixels tall,
            // which nobody can read. Drawing it is not free: each label has to
            // be built and measured against the DOM, and on a 10k-tile chart
            // that was the entire render cost (~7.5s, versus ~0.1s once the
            // unreadable ones are skipped).
            //
            // The default sits below the smallest label any bundled sample
            // draws, so it only ever removes text that was already illegible.
            // Set 0 to draw a label on every tile regardless of size.
            minFontSize: 4,
          },
          colorScale: {
            inverse: false,
            ranges: [],
            min: undefined,
            max: undefined,
            // Colour a tile by a SECOND metric, independent of the value that
            // sizes it (area = how big, colour = how it did). Reads
            // `datum.colorValue` unless this names another key or supplies an
            // accessor `(datum, {seriesIndex, dataPointIndex, w}) => number`.
            colorValue: undefined,
            // Continuous interpolation between colour stops. Active as soon as
            // any datum carries a colour metric; `enabled: false` opts out and
            // `true` forces it on. `ranges` is unaffected and still applies
            // wherever it is set.
            gradient: {
              enabled: undefined,
              // Domain. Defaults to the extent of the colour metric.
              min: undefined,
              max: undefined,
              // The value the middle colour is pinned to. Defaults to 0 when
              // the domain straddles zero (a diverging metric), else none.
              midpoint: undefined,
              // With a midpoint, balance the domain around it so equal moves
              // in either direction read as equally saturated.
              symmetric: true,
              // Low -> mid -> high. Two colours make a sequential ramp.
              colors: undefined,
              // Explicit `[{ value, color }]` stops; overrides colors/midpoint.
              stops: undefined,
            },
            // Continuous colour legend: a gradient strip with end labels and a
            // hover indicator, in place of the categorical legend. Same options
            // as the heatmap's.
            gradientLegend: {
              enabled: false,
              width: '70%',
              height: '70%',
              thickness: 12,
              align: 'center',
              stops: 16,
              showLabels: true,
              showHoverValue: true,
              labelStyle: {
                fontSize: '11px',
                fontFamily: undefined,
                colors: undefined,
              },
              arrow: {
                size: 8,
                color: undefined,
              },
              formatter: undefined,
            },
          },
          // Arbitrary-depth treemap: a datum may carry `children`.
          nested: {
            // Parent containers appear on their own as soon as the data is
            // nested; `false` forces the flat two-level layout.
            enabled: undefined,
            // Read `drilldown: '<id>'` ids as extra levels instead of as a
            // click target for the drilldown feature. Off by default, because
            // on a treemap that id has always meant "descend on click".
            drilldownAsLevels: false,
          },
          // How a parent is drawn once the data is nested. Per-level overrides
          // go in `levels` below.
          parents: {
            // 'auto' (default): on when the data carries `children`.
            show: 'auto',
            // Inset between a parent's edge and the children inside it.
            padding: 4,
            fill: undefined,
            fillOpacity: 1,
            borderColor: undefined,
            borderWidth: 1,
            borderRadius: undefined,
            hover: {
              show: true,
              color: undefined,
              width: 2,
            },
            header: {
              show: true,
              height: 22,
              // Skip the strip on tiles too narrow to show a name.
              minWidth: 40,
              align: 'left',
              offsetX: 0,
              offsetY: 0,
              showValue: false,
              // (name, { value, depth, seriesIndex, node, w }) => string
              formatter: undefined,
              style: {
                fontSize: '12px',
                fontFamily: undefined,
                fontWeight: 600,
                color: undefined,
                background: undefined,
                cssClass: '',
              },
            },
            tooltip: {
              // ({ name, value, depth, leafCount, percentOfParent,
              //    percentOfTotal, node, w }) => html
              formatter: undefined,
            },
          },
          // Per-depth overrides of `parents`, indexed from the outermost group
          // actually drawn (0 = the series, or the first authored level when a
          // single series is unwrapped).
          levels: [],
          // Click a group to fill the canvas with it; a breadcrumb goes back.
          // Ignored when the drilldown feature is active on the same chart:
          // both navigate the hierarchy, and drilldown owns the click there.
          zoom: {
            enabled: false,
            // Overrides `drilldown.breadcrumb` for this chart only. Same shape
            // (show / position / separator / rootLabel / offsetX / offsetY /
            // formatter), so a zoomed treemap and a drilled-in chart present
            // the same affordance without importing the drilldown feature.
            breadcrumb: undefined,
          },
          seriesTitle: {
            show: true,
            offsetY: 1,
            offsetX: 1,
            borderColor: '#000',
            borderWidth: 1,
            borderRadius: 2,
            style: {
              background: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              fontSize: '12px',
              fontFamily: undefined,
              fontWeight: 400,
              cssClass: '',
              padding: {
                left: 6,
                right: 6,
                top: 2,
                bottom: 2,
              },
            },
          },
        },
        unit: {
          // 'grouped' (each category is its own cluster, laid out in a row) |
          // 'packed' (one blob; categories coloured + sorted, minority centred) |
          // 'columns' (each category is a vertical bar built from stacked dots) |
          // 'grid' (one lattice of cells filled in category order - a waffle /
          // part-to-whole square "pie"; `chart.type:'waffle'` presets this) |
          // 'scatter' (units on real value axes: a beeswarm, or a 2D
          // value-value scatter - see the `scatter` block below) |
          // 'arc' (a semicircular fan) |
          // 'custom' (positions come from `positions` below).
          layout: 'grouped',
          // `layout: 'custom'` only. The layout provider: either a function
          // `(objects, rect) => [{id, x, y, r?}]` returning plot pixels, or the
          // name of one registered with `ApexCharts.registerUnitLayout`.
          //
          // This is the whole extension point. A layout is objects in,
          // positions out; it knows nothing about animation, because the engine
          // already tweens position, radius and colour and already keeps each
          // mark's identity across a relayout. So an arrangement this file
          // cannot know about - a country silhouette, a hex grid, a timeline, a
          // projection handed over by ApexMaps - is a plugin, not a core edit.
          //
          // `objects` carries one entry per mark: {id, index, seriesIndex,
          // dataPointIndex, label, value, datum, r}. `id` is the datum's own
          // id/name when the per-unit object form supplies one, so a provider
          // can address a specific unit rather than a positional slot.
          //
          // A mark whose id the provider omits animates out; ids matching no
          // mark are ignored.
          positions: undefined,
          // Update transition, controlling which previous dot each new dot
          // tweens from. 'group' (default): keyed per category, so dots stay in
          // their group and category-level enters/exits fade. 'flow': keyed by
          // global order, so the anonymous crowd migrates across a regroup (the
          // circles-to-bars effect). 'identity': keyed by each datum's id/name,
          // so a SPECIFIC unit migrates across any regroup/relayout keeping its
          // colour and size (needs the object form with unique ids/names).
          transition: 'group',
          // 'circle' | 'square' | 'image' (isotype pictogram).
          shape: 'circle',
          // Icon used when shape:'image'. Each unit renders this icon at the
          // given size. Set `tint:true` to recolour a monochrome icon to the
          // category colour (or a per-unit fillColor) so the pictogram matches
          // the legend; leave it off for multi-colour icons that should keep
          // their own colours.
          image: {
            src: undefined,
            width: 20,
            height: 20,
            tint: false,
          },
          // dot radius in px, or 'auto' to size dots so the largest cluster
          // fits its allotted box.
          size: 'auto',
          // The 'columns' layout can size its dots independently of `size`
          // (which the circle layouts / storyboard beats often pin to a
          // constant so dots do not resize while migrating). 'inherit' uses
          // `size`; 'auto' sizes the dots to fill the plot height; a number
          // pins a columns-only size. Circle / square only (image icons keep
          // their intrinsic size).
          columns: {
            size: 'inherit',
          },
          // The 'grid' (waffle) layout: one lattice of cells filled in category
          // order. `columns` = cells per row. `total` (optional) fixes the cell
          // budget - e.g. 100 for a percentage waffle - and largest-remainder
          // allocates the cells to categories; leave it undefined for one cell
          // per unit (respects unitValue / maxUnits). `fillFrom` picks the first
          // row: 'bottom' (default) or 'top'.
          //
          // `split:true` switches to SMALL MULTIPLES: one mini-waffle per
          // category, arranged in a near-square trellis (or `tileColumns` per
          // row). Each tile then has `total` cells (default 100) and fills a
          // fraction equal to the category's value over `max` (default = the
          // largest count, so the leader fills its tile; set `max:100` with
          // percentage data for true "of 100" tiles). The unfilled cells show as
          // a faint `trackColor` backdrop, and each tile gets its own label.
          grid: {
            columns: 10,
            total: undefined,
            fillFrom: 'bottom',
            // small-multiple (one waffle per category) mode + its knobs:
            split: false,
            // tiles per row; undefined = auto (near-square).
            tileColumns: undefined,
            // value -> filled-cell denominator; undefined = the largest count.
            max: undefined,
            // colour of the empty "track" cells; undefined = a neutral grey.
            trackColor: undefined,
          },
          // The 'scatter' layout places each unit on real value axes (needs the
          // object-form data). Two modes via `y`:
          //  - `y:'lanes'` (default): a BEESWARM. X is the per-unit value axis,
          //    Y is a category lane. `spread:'swarm'` packs dots off the centre
          //    line so equal values do not overlap; 'jitter' scatters randomly.
          //  - `y:'value'`: a 2D value-value scatter. X = each datum's `x`, Y =
          //    each datum's `y`, on two numeric axes; category = colour.
          // `sizeRange:[min,max]` turns dots into BUBBLES scaled (by area) from
          // each datum's `sizeField` (default 'z') - a bubble scatter / bubble
          // beeswarm. `tickAmount`/`xMin`/`xMax`/`xTitle`/`xFormatter` control the
          // X axis; the `y*` twins the Y axis (2D only); `laneLabelWidth` the
          // lane-label gutter (lanes mode); `gridlines` the grid.
          scatter: {
            y: 'lanes',
            spread: 'swarm',
            // Beeswarm orientation (1D lanes mode only): 'horizontal' lays the
            // value on the X axis with category lanes stacked on Y (default);
            // 'vertical' lays the value on the Y axis with category lanes as
            // columns across X. Ignored for the 2D value-value scatter (y:'value').
            orientation: 'horizontal',
            tickAmount: 5,
            xMin: undefined,
            xMax: undefined,
            xTitle: undefined,
            // (value) => string
            xFormatter: undefined,
            yTickAmount: 5,
            yMin: undefined,
            yMax: undefined,
            yTitle: undefined,
            // (value) => string
            yFormatter: undefined,
            // bubble sizing: datum key for the size value + [minR, maxR] in px.
            sizeField: 'z',
            sizeRange: undefined,
            laneLabelWidth: undefined,
            gridlines: true,
          },
          // Opt-in bubble sizing: scale each dot's radius by its per-unit value
          // (needs the object-form data). Circle shape only; the lattice is
          // spaced for the largest bubble so dots never overlap.
          sizeByValue: {
            enabled: false,
            // radius (px) for the largest value, or 'auto' to fit the largest
            // bubble to the plot like uniform auto-sizing.
            maxRadius: 'auto',
            // radius (px) for the smallest value; defaults to ~35% of maxRadius.
            minRadius: undefined,
            // 'area' (bubble AREA proportional to value) | 'linear'.
            scale: 'area',
          },
          // packing gap factor between spiral shells (1 = dots touch).
          spacing: 1.05,
          // corner radius for shape:'square'.
          borderRadius: 0,
          // How marks move between layouts on an update, and where entering
          // marks come from.
          //
          // `motion`: 'spring' settles each mark on a damped spring, so a
          // gather interrupted by the next update carries the marks' velocity
          // into it instead of restarting them from a standstill - which is
          // what a dragged slider or a scrubbed storyboard does on almost every
          // frame. 'tween' runs the fixed-duration ease below instead. 'auto'
          // (the default) is spring, unless `easing` was set to something other
          // than the default, so an explicit curve keeps working without having
          // to set `motion` as well.
          //
          // `spring`: 'crisp' (default) | 'gentle' (softer, for large reflows)
          // | 'snappy' (faster, a hint of settle). Scaled by
          // `chart.animations.speed`, which stretches the spring in time
          // without making it bouncier.
          //
          // `easing` (tween only): 'outCubic' (default: decelerate to a stop) |
          // 'inOutCubic' (accelerate gently out of rest, weighted travel) |
          // 'outBack' (overshoot each mark past its slot and spring back - a
          // per-mark settle), with `overshoot` tuning the spring strength.
          //
          // `enter`: where a fresh / appearing mark animates FROM - 'burst'
          // (default: fly out from the cluster centre) | 'fade' (materialise in
          // place) | 'rise' (fade in while drifting gently up into the slot).
          //
          // Colour, radius and opacity always stay on the out-cubic, under
          // either motion (a back ease overshoots past 1, which would push RGB
          // channels / radii out of range; and the spring's rest thresholds are
          // absolute, so they are far too coarse for a 0..1 quantity).
          gather: {
            motion: 'auto',
            spring: 'crisp',
            easing: 'outCubic',
            overshoot: 1.70158,
            enter: 'burst',
          },
          // The 'arc' layout arranges marks as a PARLIAMENT / hemicycle: seats in
          // concentric arced rows across an annulus, filled in category order so
          // each category is a contiguous wedge (the classic seating chart). Angles
          // use the radialBar convention (0 = top, clockwise); the default sweep is
          // a top semicircle (a full circle = startAngle 0, endAngle 360).
          // `innerRadiusRatio` is the donut hole (inner radius / outer); `rows`
          // fixes the number of seat rows, or 'auto' to size the dots as large as
          // fit. Like 'packed' the legend carries the category names (no per-wedge
          // labels).
          arc: {
            startAngle: -90,
            endAngle: 90,
            innerRadiusRatio: 0.4,
            rows: 'auto',
          },
          // 1 dot represents this many units of value (waffle scaling).
          unitValue: 1,
          // safety cap on total dots; counts scale down proportionally above it.
          maxUnits: 5000,
          // packed layout: order categories smallest-first so the minority
          // group nests in the centre of the blob.
          sortByGroup: true,
          clusterLabels: {
            show: true,
            // Label placement relative to the cluster/bar: 'top' (default) or
            // 'bottom'. A 'bottom' label is always straight; the curved arc
            // (below) rides the top crown only.
            position: 'top',
            curved: true,
            fontSize: '13px',
            fontFamily: undefined,
            fontWeight: 600,
            // defaults to the cluster's own colour when undefined.
            color: undefined,
            offsetY: 0,
            // (name, { seriesIndex, value, percent, w }) => string.
            // Return "\n"-separated text to split an outer label over lines.
            formatter: undefined,
            // Outer (name) labels, as pie/donut draw them: the label sits in the
            // margin beside the shape and a leader line joins it to the colour
            // band it names, so the crowd needs no legend to be read.
            //
            // `layout: 'custom'` only, and best on a silhouette whose categories
            // stack vertically (the default row ordering): those alternate down
            // the left and right gutters. A column-ordered shape sends each
            // label to the side its own band sits on.
            //
            // The margin is taken off BOTH sides so the shape stays centred,
            // which means turning this on makes the silhouette a little smaller.
            external: {
              show: false,
              connector: {
                show: true,
                width: 1.5,
                // defaults to the band's own colour when undefined.
                color: undefined,
                // air between the band's outermost dot and the line's bend.
                gap: 8,
                // length of the run out to the label.
                length: 22,
              },
              offsetX: 0,
              offsetY: 0,
            },
          },
          tooltip: {
            // Per-unit tooltip body. Each dot carries its category (seriesIndex)
            // and its index within that category (dataPointIndex), so the
            // formatter can look up per-unit data and return a string/HTML.
            // ({ seriesName, seriesIndex, dataPointIndex, count, unitValue,
            //    color, w }) => string
            // Default: "#<dataPointIndex+1> of <count>".
            formatter: undefined,
          },
        },
        radialBar: {
          inverseOrder: false,
          startAngle: 0,
          endAngle: 360,
          offsetX: 0,
          offsetY: 0,
          // Gauge sub-shape. 'arc' (default) renders the existing filled
          // value-arc gauge; 'needle' replaces the value-arc with a rotating
          // pointer/needle. Bands and ticks are independent and work for both
          // shapes.
          shape: 'arc',
          // Value-to-angle mapping. Defaults to the existing 0..100 range
          // used by radialBar. Override for gauges that need a custom domain
          // (e.g. min: 0, max: 240 for a speedometer).
          min: 0,
          max: 100,
          // Threshold bands rendered as colored arc segments along the gauge
          // arc (e.g. [{from:0,to:30,color:'#FF4560'}, ...]). Bands draw
          // behind the value-arc and tick marks. Set to [] (default) to
          // disable.
          bands: [],
          bandsStyle: {
            // % of arc radius. Slightly less than the value-arc stroke so
            // the value-arc reads on top by default.
            strokeWidth: '40%',
            // px gap between consecutive bands.
            gap: 0,
            // Hide the track when bands cover the full range; the bands
            // themselves act as the visual backdrop.
            hideTrackWhenPresent: true,
          },
          // Tick marks rendered along (outside) the gauge arc.
          ticks: {
            show: false,
            major: {
              count: 11,
              length: 10,
              width: 2,
              color: '#666',
              // 'inside' draws ticks from `radius - length` to `radius`;
              // 'outside' draws from `radius` to `radius + length`.
              placement: 'outside',
            },
            minor: {
              count: 4, // minor ticks BETWEEN each pair of major ticks
              length: 5,
              width: 1,
              color: '#999',
              placement: 'outside',
            },
            labels: {
              show: false,
              offset: 6,
              fontSize: '11px',
              fontFamily: undefined,
              fontWeight: 400,
              color: '#666',
              /** @param {number} v */
              formatter(v) {
                return String(v)
              },
            },
          },
          // Needle/dial configuration. Only applies when `shape: 'needle'`.
          needle: {
            color: '#333',
            // Needle length as a % of the gauge radius (string like '85%')
            // or as an absolute px number.
            length: '85%',
            // px width of the needle line at the base.
            baseWidth: 4,
            // px width of the needle tip (tapered if smaller than baseWidth).
            tipWidth: 1,
            // px offset from the geometric arc center on Y. Positive values
            // push the needle base down (toward the chord midpoint of a
            // ∩-shape gauge); negative pushes up. The needle rotates around
            // this shifted point.
            offsetY: 0,
            // When true, also render the filled value-arc alongside the
            // needle. Default false preserves the previous needle-only
            // behavior. Useful for gauges that want a progress ring plus a
            // pointer indicator.
            showValueArc: false,
            animation: {
              enabled: true,
              duration: 800,
              easing: 'ease-out',
            },
          },
          hollow: {
            margin: 5,
            size: '50%',
            background: 'transparent',
            image: undefined,
            imageWidth: 150,
            imageHeight: 150,
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageClipped: true,
            position: 'front',
            // Optional stroke around the hollow ring. Combined with
            // `strokeDasharray` this produces a dashed indicator circle
            // around the value text — useful for gauge designs where the
            // value sits inside its own boundary.
            stroke: undefined,
            strokeWidth: 1,
            strokeDasharray: undefined,
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              color: '#000',
              opacity: 0.5,
            },
          },
          track: {
            show: true,
            startAngle: undefined,
            endAngle: undefined,
            background: '#f2f2f2',
            strokeWidth: '97%',
            opacity: 1,
            margin: 5, // margin is in pixels
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              color: '#000',
              opacity: 0.5,
            },
          },
          dataLabels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontFamily: undefined,
              fontWeight: 600,
              color: undefined,
              offsetY: 0,
              /**
               * @param {any} val
               */
              formatter(val) {
                return val
              },
            },
            value: {
              show: true,
              fontSize: '14px',
              fontFamily: undefined,
              fontWeight: 400,
              color: undefined,
              offsetY: 16,
              /**
               * @param {any} val
               */
              formatter(val) {
                return val + '%'
              },
            },
            total: {
              show: false,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: undefined,
              color: undefined,
              /**
               * @param {import('../../types/internal').ChartStateW} w
               */
              formatter(w) {
                return (
                  /**
                   * @param {number} a
                   * @param {number} b
                   */
                  w.globals.seriesTotals.reduce((a, b) => a + b, 0) /
                    w.seriesData.series.length +
                  '%'
                )
              },
            },
          },
          barLabels: {
            enabled: false,
            offsetX: 0,
            offsetY: 0,
            useSeriesColors: true,
            fontFamily: undefined,
            fontWeight: 600,
            fontSize: '16px',
            /**
             * @param {any} val
             */
            formatter(val) {
              return val
            },
            onClick: undefined,
          },
        },
        pie: {
          customScale: 1,
          offsetX: 0,
          offsetY: 0,
          startAngle: 0,
          endAngle: 360,
          expandOnClick: true,
          // How far a clicked slice slides out of the pie (px), measured along
          // its own mid-angle. The slice is translated, not redrawn at a bigger
          // radius, so its shape and the quantity it encodes are unchanged and
          // a gap opens between it and the rest of the pie. The inner
          // percentage label (and the outer name label, when enabled) ride
          // along with it. Ignored for polarArea, where the radius is the
          // value, and in a drilldown pie/donut, where a click navigates (the
          // slice would slide out only to be discarded by the drill, and
          // states.active takes the click feedback back over). Set 0 to keep
          // the slice in place.
          expandOffset: 10,
          // Hover outline: a translucent band traced just outside the rim of
          // the hovered slice, so the slice keeps its own colour instead of
          // being lightened. Takes the place of the states.hover filter for
          // pie / donut / polarArea, and is skipped entirely when
          // states.hover.filter.type is 'none' (that stays the way to turn all
          // hover feedback off). Applies to pie, donut and polarArea.
          hoverOutline: {
            show: true,
            size: 8, // band thickness (px)
            // Extra clearance between the slice rim and the band (px), ON TOP
            // of the slice stroke: the band always starts at the outer edge of
            // the stroke, never under it. Default 0, because a stroke is
            // normally present (stroke.width defaults to 2) and already reads
            // as the separation. Any gap beyond that and the band stops
            // belonging to its slice and starts reading as a ring of its own.
            gap: 0,
            opacity: 0.3, // band opacity, over the slice colour
            color: undefined, // defaults to the hovered slice's colour
          },
          // Rounds the corners of each slice (in px). Applies to pie, donut and
          // polarArea (all rendered by the Pie module). 0 = sharp corners
          // (default, unchanged behavior). The value is clamped per slice so
          // opposing corner fillets never cross on thin/narrow slices.
          borderRadius: 0,
          // Gap between adjacent slices (in px). Applies to pie, donut and
          // polarArea. 0 = slices touch (default). Each slice is inset
          // symmetrically, so its mid-angle (data label + hit region) is kept.
          spacing: 0,
          dataLabels: {
            // These are the percentage values which are displayed on slice
            offset: 0, // offset by which labels will move outside
            minAngleToShowLabel: 10,
            // External (outer) labels: render the category/series name outside
            // the slice, joined to it by a leader (connector) line, so users
            // don't have to map legend colors back to slices. The percentage
            // keeps rendering inside the slice (governed by dataLabels.enabled).
            // Pie + donut only; ignored for polarArea (radial length already
            // encodes the value there).
            external: {
              show: false, // master switch for the external (outer) labels
              offsetX: 0,
              offsetY: 0,
              fontSize: undefined, // falls back to dataLabels.style.fontSize
              fontFamily: undefined, // falls back to dataLabels.style.fontFamily
              fontWeight: undefined, // falls back to dataLabels.style.fontWeight
              color: undefined, // defaults to chart.foreColor (readable text)
              /**
               * Return a string (single line) or an array of strings (stacked
               * lines, e.g. [name, percent + '%']).
               * @param {string} name
               * @param {{ seriesIndex: number, percent: number, value: number, w: any }} opts
               * @returns {string | string[]}
               */
              formatter: undefined,
              connector: {
                show: true,
                width: 1,
                color: undefined, // defaults to the slice color
                length: 16, // horizontal run after the radial elbow (px)
                gap: 6, // radial gap from slice edge to the elbow point (px)
              },
            },
          },
          donut: {
            size: '65%',
            background: 'transparent',
            labels: {
              // These are the inner labels appearing inside donut
              show: false,
              name: {
                show: true,
                fontSize: '16px',
                fontFamily: undefined,
                fontWeight: 600,
                color: undefined,
                offsetY: -10,
                /**
                 * @param {any} val
                 */
                formatter(val) {
                  return val
                },
              },
              value: {
                show: true,
                fontSize: '20px',
                fontFamily: undefined,
                fontWeight: 400,
                color: undefined,
                offsetY: 10,
                /**
                 * @param {any} val
                 */
                formatter(val) {
                  return val
                },
              },
              total: {
                show: false,
                showAlways: false,
                label: 'Total',
                fontSize: '16px',
                fontWeight: 400,
                fontFamily: undefined,
                color: undefined,
                /**
                 * @param {import('../../types/internal').ChartStateW} w
                 */
                formatter(w) {
                  /**
                   * @param {number} a
                   * @param {number} b
                   */
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                },
              },
            },
          },
        },
        polarArea: {
          rings: {
            strokeWidth: 1,
            strokeColor: '#e8e8e8',
          },
          spokes: {
            strokeWidth: 1,
            connectorColors: '#e8e8e8',
          },
        },
        sunburst: {
          // Sunburst / nested pie-donut (hierarchical radial). Rings go from the
          // centre hole outward, one per hierarchy level; each child arc is
          // nested inside its parent's angular wedge.
          offsetX: 0,
          offsetY: 0,
          startAngle: 0,
          endAngle: 360,
          // Centre hole radius, as a % of the max radius (like donut size).
          innerSize: '15%',
          // Corner rounding + inter-arc gap (px), same semantics as the pie
          // family (see plotOptions.pie.borderRadius / .spacing).
          borderRadius: 0,
          spacing: 1,
          // How a branch that bottoms out before the deepest level is drawn:
          // 'extend' stretches the leaf arc out to the rim (default, matches
          // d3); 'stop' leaves the outer rings empty behind it.
          leaf: 'extend',
          // Angular partition of a parent's wedge among its children:
          // 'normalize' splits by each child's share of its siblings (safe for
          // any data); 'strict' expects children to sum to the parent's value.
          partition: 'normalize',
          // Each depth level is tinted this much lighter than its parent colour
          // (0 = keep parent colour, 1 = white). A per-node `color` overrides.
          tint: 0.14,
          // Click a wedge to zoom into that branch (its subtree fills the
          // chart; a breadcrumb walks back). Click the focused inner ring to
          // zoom out. Set false to disable.
          zoomOnClick: true,
          dataLabels: {
            show: true,
            // Hide the label on any arc narrower than this (degrees), so tiny
            // wedges do not overflow with text.
            minAngleToShow: 8,
            style: {
              fontSize: '12px',
              fontFamily: undefined,
              fontWeight: 400,
              colors: undefined,
            },
          },
        },
        radar: {
          size: undefined,
          offsetX: 0,
          offsetY: 0,
          polygons: {
            // strokeColor: '#e8e8e8', // should be deprecated in the minor version i.e 3.2
            strokeWidth: 1,
            strokeColors: '#e8e8e8',
            connectorColors: '#e8e8e8',
            fill: {
              colors: undefined,
            },
          },
        },
      },
      colors: undefined,
      dataLabels: {
        enabled: true,
        enabledOnSeries: undefined,
        /**
         * @param {any} val
         */
        formatter(val) {
          return val !== null ? val : ''
        },
        textAnchor: 'middle',
        distributed: false,
        offsetX: 0,
        offsetY: 0,
        style: {
          fontSize: '12px',
          fontFamily: undefined,
          fontWeight: 600,
          colors: undefined,
        },
        background: {
          enabled: true,
          foreColor: '#fff',
          backgroundColor: undefined,
          borderRadius: 2,
          padding: 4,
          opacity: 0.9,
          borderWidth: 1,
          borderColor: '#fff',
          dropShadow: {
            enabled: false,
            top: 1,
            left: 1,
            blur: 1,
            color: '#000',
            opacity: 0.8,
          },
        },
        dropShadow: {
          enabled: false,
          top: 1,
          left: 1,
          blur: 1,
          color: '#000',
          opacity: 0.8,
        },
        // Ride data labels to their new position on a data-change update
        // instead of snapping. ON by default: the bars, the markers and the
        // axis ticks all already reflow on one clock, so a label that jumps to
        // its final slot on the first frame is the odd one out, it arrives
        // several hundred ms before the bar it belongs to. Speed/easing follow
        // chart.animations.dynamicAnimation, and a label that has not moved is
        // a per-label no-op. Bar/column only.
        animate: {
          enabled: true,
        },
        // Count the numeric value up/down from its previous value on update,
        // like countUp.js. Off by default. The dataLabels.formatter runs each
        // frame, so number formatting (decimals, separators, prefixes) is
        // preserved. Bar/column only.
        countUp: {
          enabled: false,
        },
      },
      fill: {
        type: 'solid',
        colors: undefined, // array of colors
        opacity: 0.85,
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 100],
          colorStops: [],
        },
        image: {
          src: [],
          width: undefined, // optional
          height: undefined, // optional
        },
        pattern: {
          style: 'squares', // String | Array of Strings
          width: 6,
          height: 6,
          strokeWidth: 2,
        },
      },
      forecastDataPoints: {
        count: 0,
        fillOpacity: 0.5,
        strokeWidth: undefined,
        dashArray: 4,
      },
      grid: {
        show: true,
        borderColor: '#e0e0e0',
        strokeDashArray: 0,
        position: 'back',
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        row: {
          colors: undefined, // takes as array which will be repeated on rows
          opacity: 0.5,
        },
        column: {
          colors: undefined, // takes an array which will be repeated on columns
          opacity: 0.5,
        },
        padding: {
          top: 0,
          right: 10,
          bottom: 0,
          left: 12,
        },
      },
      labels: [],
      drilldown: {
        // Opt-in. When false, the Drilldown feature module stays inert even if
        // it was imported. Requires `import 'apexcharts/features/drilldown'`.
        enabled: false,
        // Child levels referenced by a data point's `drilldown: '<id>'` field.
        // Each: { id, name?, data, chart?, xaxis?, yaxis?, colors?, plotOptions? }
        series: [],
        breadcrumb: {
          show: true,
          position: 'top-left', // 'top-left' | 'top-right'
          separator: ' / ',
          rootLabel: 'All',
          offsetX: 0,
          offsetY: 0,
          // formatter: (label, { index, depth }) => label,
        },
        // Animation is delegated to the chart's update pipeline; `enabled`
        // gates whether the drill transition animates at all.
        animation: {
          enabled: true,
          // Anchor the drill transition at the clicked point: the child unfolds
          // outward from it (and settles back on drill-up) instead of the chart
          // simply re-rendering. A gentle scale layered on the SVG; opt-in.
          zoomFromPoint: false,
          // Base duration (ms) of the transition, used only when zoomFromPoint
          // is true. The fade-out phase runs a little shorter than this.
          speed: 260,
        },
        // Optional async resolver, called when a drillable point has no inline
        // match in `series`. Receives ({ id, point, seriesIndex, dataPointIndex })
        // and returns a level (or a promise of one). A throw, a rejection, or a
        // resolved value without a `data` array leaves the chart exactly where
        // it was and fires `drillDownError` - a failed fetch is ordinary, not
        // a reason to strand the view.
        // onDrillDown: undefined,
        // Overlay shown while an async level resolves. `text` is optional: with
        // none, the spinner shows alone (and carries 'Loading' as its
        // accessible name), which keeps the default free of any language.
        loading: {
          show: true,
          // text: 'Loading…',
        },
        // Cache levels resolved by `onDrillDown`, keyed by id, so drilling back
        // down a branch does not re-fetch it. Call `chart.drillDown` module's
        // clearCache() when the data behind an already-drilled chart changes.
        cache: true,
        // The dot that marks a drillable point on a line/area chart drawn
        // without markers. A bar, slice, tile or cell is already a visible,
        // clickable mark; a line point is not, so without this the chart would
        // give no sign that anything can be opened. Only drillable points get
        // one, which is what makes them read as openable. Set `show: false` to
        // supply your own affordance (turning `markers.size` on, for instance).
        // Omitted colours inherit the series marker defaults.
        marker: {
          show: true,
          size: 6,
          // shape: undefined,      // 'circle' | 'square' | 'rect'
          // fillColor: undefined,  // defaults to the series colour
          strokeColor: '#fff',
        },
      },
      legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        floating: false,
        position: 'bottom', // whether to position legends in 1 of 4
        // direction - top, bottom, left, right
        horizontalAlign: 'center', // when position top/bottom, you can specify whether to align legends left, right or center
        inverseOrder: false,
        fontSize: '12px',
        fontFamily: undefined,
        fontWeight: 400,
        width: undefined,
        height: undefined,
        formatter: undefined,
        tooltipHoverFormatter: undefined,
        offsetX: -20,
        offsetY: 4,
        customLegendItems: [],
        clusterGroupedSeries: true,
        clusterGroupedSeriesOrientation: 'vertical',
        labels: {
          colors: undefined,
          useSeriesColors: false,
        },
        markers: {
          size: 7,
          fillColors: undefined,
          strokeWidth: 1,
          shape: undefined,
          offsetX: 0,
          offsetY: 0,
          customHTML: undefined,
          onClick: undefined,
        },
        itemMargin: {
          horizontal: 5,
          vertical: 4,
        },
        onItemClick: {
          toggleDataSeries: true,
        },
        onItemHover: {
          highlightDataSeries: true,
        },
      },
      markers: {
        discrete: [],
        size: 0,
        colors: undefined,
        strokeColors: '#fff',
        strokeWidth: 2,
        strokeOpacity: 0.9,
        strokeDashArray: 0,
        fillOpacity: 1,
        shape: 'circle',
        offsetX: 0,
        offsetY: 0,
        showNullDataPoints: true,
        onClick: undefined,
        onDblClick: undefined,
        hover: {
          size: undefined,
          sizeOffset: 3,
        },
      },
      noData: {
        text: undefined,
        align: 'center',
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: '14px',
          fontFamily: undefined,
        },
      },
      responsive: [], // breakpoints should follow ascending order 400, then 700, then 1000
      series: undefined,
      states: {
        hover: {
          filter: {
            type: 'lighten',
            value: 0.15,
          },
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'darken',
            value: 0.35,
          },
        },
      },
      title: {
        text: undefined,
        align: 'left',
        margin: 5,
        offsetX: 0,
        offsetY: 0,
        floating: false,
        style: {
          fontSize: '14px',
          fontWeight: 900,
          fontFamily: undefined,
          color: undefined,
        },
      },
      subtitle: {
        text: undefined,
        align: 'left',
        margin: 5,
        offsetX: 0,
        offsetY: 30,
        floating: false,
        style: {
          fontSize: '12px',
          fontWeight: 400,
          fontFamily: undefined,
          color: undefined,
        },
      },
      stroke: {
        show: true,
        curve: 'smooth', // "smooth" / "straight" / "monotoneCubic" / "stepline" / "linestep"
        lineCap: 'butt', // round, butt , square
        width: 2,
        colors: undefined, // array of colors
        dashArray: 0, // single value or array of values
        fill: {
          type: 'solid',
          colors: undefined, // array of colors
          opacity: 0.85,
          gradient: {
            shade: 'dark',
            type: 'horizontal',
            shadeIntensity: 0.5,
            gradientToColors: undefined,
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 100],
            colorStops: [],
          },
        },
      },
      tooltip: {
        enabled: true,
        enabledOnSeries: undefined,
        shared: true,
        hideEmptySeries: false,
        followCursor: false, // when disabled, the tooltip will show on top of the series instead of mouse position
        intersect: false, // when enabled, tooltip will only show when user directly hovers over point
        inverseOrder: false,
        arrow: true,
        custom: undefined,
        fillSeriesColor: false,
        theme: 'light',
        cssClass: '',
        style: {
          fontSize: '12px',
          fontFamily: undefined,
          background: undefined,
        },
        onDatasetHover: {
          highlightDataSeries: false,
        },
        x: {
          // x value
          show: true,
          format: 'dd MMM', // dd/MM, dd MMM yy, dd MMM yyyy
          formatter: undefined, // a custom user supplied formatter function
        },
        y: {
          formatter: undefined,
          title: {
            /**
             * @param {string} seriesName
             */
            formatter(seriesName) {
              return seriesName ? seriesName + ': ' : ''
            },
          },
        },
        z: {
          formatter: undefined,
          title: 'Size: ',
        },
        marker: {
          show: true,
          fillColors: undefined,
        },
        items: {
          display: 'flex',
        },
        fixed: {
          enabled: false,
          position: 'topRight', // topRight, topLeft, bottomRight, bottomLeft
          offsetX: 0,
          offsetY: 0,
        },
      },
      xaxis: {
        type: 'category',
        categories: [],
        convertedCatToNumeric: false, // internal property which should not be altered outside
        offsetX: 0,
        offsetY: 0,
        overwriteCategories: undefined,
        labels: {
          show: true,
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          showDuplicates: true,
          style: {
            colors: [],
            fontSize: '12px',
            fontWeight: 400,
            fontFamily: undefined,
            cssClass: '',
          },
          offsetX: 0,
          offsetY: 0,
          format: undefined,
          formatter: undefined, // custom formatter function which will override format
          datetimeUTC: true,
          datetimeFormatter: {
            // Base format per interval unit. TimeScale.formatDates folds in
            // coarser context automatically when the data range spans it
            // (e.g. month-scale across years → 'MMM yyyy', hour-scale across
            // days → 'dd MMM HH:mm'). Customizing a base format that already
            // includes the higher-unit token disables the auto-expansion for
            // that level.
            year: 'yyyy',
            month: 'MMM',
            day: 'dd MMM',
            hour: 'HH:mm',
            minute: 'HH:mm',
            second: 'HH:mm:ss',
          },
        },
        group: {
          groups: [],
          style: {
            colors: [],
            fontSize: '12px',
            fontWeight: 400,
            fontFamily: undefined,
            cssClass: '',
          },
        },
        axisBorder: {
          show: true,
          color: '#e0e0e0',
          width: '100%',
          height: 1,
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: true,
          color: '#e0e0e0',
          height: 6,
          offsetX: 0,
          offsetY: 0,
        },
        stepSize: undefined,
        tickAmount: undefined,
        tickPlacement: 'on',
        min: undefined,
        max: undefined,
        range: undefined,
        floating: false,
        decimalsInFloat: undefined,
        position: 'bottom',
        title: {
          text: undefined,
          offsetX: 0,
          offsetY: 0,
          style: {
            color: undefined,
            fontSize: '12px',
            fontWeight: 900,
            fontFamily: undefined,
            cssClass: '',
          },
        },
        crosshairs: {
          show: true,
          width: 1, // tickWidth/barWidth or an integer
          position: 'back',
          opacity: 0.9,
          stroke: {
            color: '#b6b6b6',
            width: 1,
            dashArray: 3,
          },
          fill: {
            type: 'solid', // solid, gradient
            color: '#B1B9C4',
            gradient: {
              colorFrom: '#D8E3F0',
              colorTo: '#BED1E6',
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5,
            },
          },
          dropShadow: {
            enabled: false,
            left: 0,
            top: 0,
            blur: 1,
            opacity: 0.8,
          },
        },
        tooltip: {
          enabled: false,
          offsetY: 0,
          formatter: undefined,
          style: {
            fontSize: '12px',
            fontFamily: undefined,
          },
        },
      },
      yaxis: this.yAxis,
      theme: {
        mode: '',
        palette: 'palette1', // If defined, it will overwrite globals.colors variable
        // Facet (#13): read `--apx-*` CSS design tokens from the cascade
        // (accent/fore/grid/surface + series-1..N). true (default) reads any
        // present (absence is a no-op); false disables. Tokens top the
        // resolution chain below explicit config. Tokens are re-read on every
        // render; call chart.refreshTokens() to pick up a runtime CSS change
        // that does not itself trigger a render.
        tokens: true,
        // Facet (#13): 'os' follows prefers-color-scheme + prefers-contrast
        // reactively (SSR-safe, cleaned up on destroy). false disables.
        follow: false, // 'os' | false
        // Facet (#13): a theme registered via ApexCharts.registerTheme(name, def)
        name: '', // '' | registered theme name
        monochrome: {
          // monochrome allows you to select just 1 color and fill out the rest with light/dark shade (intensity can be selected)
          enabled: false,
          color: '#008FFB',
          shadeTo: 'light',
          shadeIntensity: 0.65,
        },
        accessibility: {
          colorBlindMode: '', // '' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'highContrast'
        },
      },
    }
  }
}
