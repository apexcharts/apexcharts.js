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
      // Weave (#1) — public plugin platform. Per-chart activation list:
      // { name, options?, order? }. Requires the Weave host to be bundled
      // (`import 'apexcharts/features/weave'`, included in the full bundle) and
      // the plugin registered via ApexCharts.registerPlugin().
      plugins: [],
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
        // Perspectives (#10) — serializable/shareable view state. Passive:
        // requires `import 'apexcharts/features/perspectives'`. serializeOptions
        // is the whitelist of function-free option paths stored in a token.
        perspectives: {
          serializeOptions: ['theme', 'xaxis', 'yaxis', 'title', 'subtitle'],
        },
        // Rewind (#3) — undo/redo history. Opt-in (bundle + behavior): requires
        // `import 'apexcharts/features/history'` AND chart.history.enabled.
        history: {
          enabled: false,
          maxDepth: 100,
          coalesceMs: 250,
          keyboard: true,
        },
        // Strata (#2) — hybrid SVG+canvas series renderer. 'svg' (default) |
        // 'canvas' | 'auto'. 'auto'/'canvas' need the canvas renderer feature
        // (`import 'apexcharts/features/renderer-canvas'`); without it — or with
        // a canvas-unsupported feature (pattern/image fill, color-matrix state
        // filters) — selection falls back to 'svg'. Only the series layer is
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
        // Linked Views (#4): crossfilter / linked highlighting. Charts sharing a
        // `chart.group` and opting in here form a crossfilter set. Brushing a
        // range (needs `chart.selection.enabled`) on any member dims every
        // member's data marks whose x is outside the range, in place (no
        // re-render). Requires the `link` feature. mode 'highlight' only for now.
        link: {
          enabled: false,
          mode: 'highlight',
          dimOpacity: 0.2,
        },
        stacked: false,
        stackOnlyBar: true, // mixed chart with stacked bars and line series - incorrect line draw #907
        stackType: 'normal',
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
          },
          autoSelected: 'zoom', // accepts -> zoom, pan, selection
        },
        type: 'line',
        width: '100%',
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: false,
          allowMouseWheelZoom: true,
          // Momentum: two-finger pinch-zoom on touch devices. Zooms the x-axis
          // around the pinch centroid (matching the x-only wheel/toolbar zoom),
          // frame-by-frame rather than the 400ms wheel throttle.
          pinch: true,
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
          borderRadiusWhenStacked: 'last', // [all, last]
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
          },
          colorScale: {
            inverse: false,
            ranges: [],
            min: undefined,
            max: undefined,
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
        // match in `series`: ({ point, seriesIndex, dataPointIndex }) => childSeries
        // onDrillDown: undefined,
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
          },
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: 'darken',
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
        // (accent/fore/grid/surface + series-1..N). 'auto' (default) reads any
        // present; false disables. Tokens top the resolution chain below config.
        tokens: 'auto', // 'auto' | true | false
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
