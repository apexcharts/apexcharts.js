import { createChartWithOptions } from './utils/utils.js'

// ---------------------------------------------------------------------------
// Helper: create a chart with legend-relevant options
// ---------------------------------------------------------------------------
function chartWithLegend(opts = {}) {
  return createChartWithOptions({
    chart: { type: opts.type || 'line', ...opts.chart },
    series: opts.series || [
      { name: 'Series A', data: [10, 20, 30] },
      { name: 'Series B', data: [15, 25, 35] },
    ],
    legend: {
      show: true,
      ...opts.legend,
    },
    xaxis: opts.xaxis || {},
    yaxis: opts.yaxis || [{}],
    colors: opts.colors || undefined,
    ...opts.extra,
  })
}

// ---------------------------------------------------------------------------
// Helper: get all legend series elements from the chart DOM
// ---------------------------------------------------------------------------
function getLegendItems(chart) {
  return chart.el.querySelectorAll('.apexcharts-legend-series')
}

function getLegendTexts(chart) {
  return chart.el.querySelectorAll('.apexcharts-legend-text')
}

function getLegendMarkers(chart) {
  // Use direct child selector to avoid matching SVG marker elements nested inside
  return chart.el.querySelectorAll(
    '.apexcharts-legend-series > .apexcharts-legend-marker'
  )
}

// ===========================================================================
// TESTS
// ===========================================================================

describe('Legend', () => {
  // =========================================================================
  // Rendering basics
  // =========================================================================
  describe('rendering', () => {
    it('should render one legend item per series for multi-series chart', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10, 20] },
          { name: 'B', data: [30, 40] },
          { name: 'C', data: [50, 60] },
        ],
      })

      const items = getLegendItems(chart)
      expect(items.length).toBe(3)
    })

    it('should render legend text matching series names', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'Revenue', data: [10, 20] },
          { name: 'Expenses', data: [30, 40] },
        ],
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents).toContain('Revenue')
      expect(textContents).toContain('Expenses')
    })

    it('should render a marker element for each legend item', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [1] },
          { name: 'B', data: [2] },
        ],
      })

      const markers = getLegendMarkers(chart)
      expect(markers.length).toBe(2)
    })

    it('should not render legend items when legend.show is false', () => {
      const chart = chartWithLegend({
        legend: { show: false },
      })

      const items = getLegendItems(chart)
      expect(items.length).toBe(0)
    })

    it('should not render legend for single series without showForSingleSeries', () => {
      const chart = chartWithLegend({
        series: [{ name: 'Only', data: [10, 20, 30] }],
        legend: { showForSingleSeries: false },
      })

      const items = getLegendItems(chart)
      expect(items.length).toBe(0)
    })

    it('should render legend for single series when showForSingleSeries is true', () => {
      const chart = chartWithLegend({
        series: [{ name: 'Only', data: [10, 20, 30] }],
        legend: { showForSingleSeries: true },
      })

      const items = getLegendItems(chart)
      expect(items.length).toBe(1)
    })
  })

  // =========================================================================
  // Position and alignment classes
  // =========================================================================
  describe('position and alignment', () => {
    it.each(['top', 'bottom', 'left', 'right'])(
      'should apply position class for position=%s',
      (position) => {
        const chart = chartWithLegend({
          legend: { position },
        })

        const legendWrap = chart.el.querySelector('.apexcharts-legend')
        expect(
          legendWrap.classList.contains(`apx-legend-position-${position}`)
        ).toBe(true)
      }
    )

    it.each(['left', 'center', 'right'])(
      'should apply horizontal alignment class for horizontalAlign=%s',
      (align) => {
        const chart = chartWithLegend({
          legend: { horizontalAlign: align },
        })

        const legendWrap = chart.el.querySelector('.apexcharts-legend')
        expect(
          legendWrap.classList.contains(`apexcharts-align-${align}`)
        ).toBe(true)
      }
    )
  })

  // =========================================================================
  // Custom legend items
  // =========================================================================
  describe('customLegendItems', () => {
    it('should use customLegendItems instead of series names', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          customLegendItems: ['Custom One', 'Custom Two'],
        },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents).toContain('Custom One')
      expect(textContents).toContain('Custom Two')
      expect(textContents).not.toContain('A')
      expect(textContents).not.toContain('B')
    })
  })

  // =========================================================================
  // Inverse order
  // =========================================================================
  describe('inverseOrder', () => {
    it('should render legend items in reverse order when inverseOrder is true', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'First', data: [10] },
          { name: 'Second', data: [20] },
          { name: 'Third', data: [30] },
        ],
        legend: { inverseOrder: true },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents[0]).toBe('Third')
      expect(textContents[1]).toBe('Second')
      expect(textContents[2]).toBe('First')
    })

    it('should render legend items in normal order when inverseOrder is false', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'First', data: [10] },
          { name: 'Second', data: [20] },
          { name: 'Third', data: [30] },
        ],
        legend: { inverseOrder: false },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents[0]).toBe('First')
      expect(textContents[1]).toBe('Second')
      expect(textContents[2]).toBe('Third')
    })
  })

  // =========================================================================
  // Legend text styling
  // =========================================================================
  describe('text styling', () => {
    it('should apply custom fontSize and fontWeight to legend text', () => {
      const chart = chartWithLegend({
        legend: {
          fontSize: '18px',
          fontWeight: 700,
        },
      })

      const texts = getLegendTexts(chart)
      const firstText = texts[0]

      expect(firstText.style.fontSize).toBe('18px')
      expect(firstText.style.fontWeight).toBe('700')
    })

    it('should apply custom fontFamily to legend text', () => {
      const chart = chartWithLegend({
        legend: {
          fontFamily: 'Courier New',
        },
      })

      const texts = getLegendTexts(chart)
      expect(texts[0].style.fontFamily).toMatch(/Courier New/)
    })

    it('should use series colors for label text when useSeriesColors is true', () => {
      const chart = chartWithLegend({
        colors: ['#ff0000', '#00ff00'],
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          labels: { useSeriesColors: true },
        },
      })

      const texts = getLegendTexts(chart)

      // jsdom converts hex to rgb
      expect(texts[0].style.color).toBe('rgb(255, 0, 0)')
      expect(texts[1].style.color).toBe('rgb(0, 255, 0)')
    })

    it('should apply per-series label colors from labels.colors array', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          labels: {
            colors: ['#aabbcc', '#ddeeff'],
          },
        },
      })

      const texts = getLegendTexts(chart)
      // jsdom converts hex to rgb
      expect(texts[0].style.color).toBe('rgb(170, 187, 204)')
      expect(texts[1].style.color).toBe('rgb(221, 238, 255)')
    })
  })

  // =========================================================================
  // Attributes on legend elements
  // =========================================================================
  describe('element attributes', () => {
    it('should set rel attribute on legend series elements starting from 1', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
      })

      const items = getLegendItems(chart)
      expect(items[0].getAttribute('rel')).toBe('1')
      expect(items[1].getAttribute('rel')).toBe('2')
    })

    it('should set seriesName attribute matching escaped series name', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'My Series', data: [10] },
          { name: 'Other', data: [20] },
        ],
      })

      const items = getLegendItems(chart)
      expect(items[0].getAttribute('seriesName')).toBeDefined()
      expect(items[1].getAttribute('seriesName')).toBeDefined()
    })

    it('should set data:collapsed=false on non-collapsed series', () => {
      const chart = chartWithLegend()

      const items = getLegendItems(chart)
      Array.from(items).forEach((item) => {
        expect(item.getAttribute('data:collapsed')).toBe('false')
      })
    })
  })

  // =========================================================================
  // No-click class
  // =========================================================================
  describe('onItemClick.toggleDataSeries', () => {
    it('should add apexcharts-no-click class when toggleDataSeries is false', () => {
      const chart = chartWithLegend({
        legend: {
          onItemClick: { toggleDataSeries: false },
        },
      })

      const items = getLegendItems(chart)
      Array.from(items).forEach((item) => {
        expect(item.classList.contains('apexcharts-no-click')).toBe(true)
      })
    })

    it('should not add apexcharts-no-click class when toggleDataSeries is true', () => {
      const chart = chartWithLegend({
        legend: {
          onItemClick: { toggleDataSeries: true },
        },
      })

      const items = getLegendItems(chart)
      Array.from(items).forEach((item) => {
        expect(item.classList.contains('apexcharts-no-click')).toBe(false)
      })
    })
  })

  // =========================================================================
  // Legend formatter
  // =========================================================================
  describe('legend formatter', () => {
    it('should apply custom formatter to legend text', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          formatter(seriesName) {
            return seriesName + ' (custom)'
          },
        },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents[0]).toBe('A (custom)')
      expect(textContents[1]).toBe('B (custom)')
    })

    it('should pass seriesIndex and w to the formatter', () => {
      const receivedArgs = []

      chartWithLegend({
        series: [
          { name: 'X', data: [10] },
          { name: 'Y', data: [20] },
        ],
        legend: {
          formatter(seriesName, opts) {
            receivedArgs.push({
              seriesName,
              seriesIndex: opts.seriesIndex,
              hasW: !!opts.w,
            })
            return seriesName
          },
        },
      })

      expect(receivedArgs.length).toBe(2)
      expect(receivedArgs[0]).toEqual({
        seriesName: 'X',
        seriesIndex: 0,
        hasW: true,
      })
      expect(receivedArgs[1]).toEqual({
        seriesName: 'Y',
        seriesIndex: 1,
        hasW: true,
      })
    })
  })

  // =========================================================================
  // Heatmap legend
  // =========================================================================
  describe('heatmap legend', () => {
    it('should derive legend names from colorScale ranges', () => {
      const chart = chartWithLegend({
        type: 'heatmap',
        series: [
          {
            name: 'Row1',
            data: [
              { x: 'A', y: 10 },
              { x: 'B', y: 50 },
            ],
          },
        ],
        legend: { showForSingleSeries: true },
        extra: {
          plotOptions: {
            heatmap: {
              colorScale: {
                ranges: [
                  { from: 0, to: 25, color: '#00A100', name: 'Low' },
                  { from: 26, to: 100, color: '#FF0000', name: 'High' },
                ],
              },
            },
          },
        },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents).toContain('Low')
      expect(textContents).toContain('High')
    })

    it('should use "from - to" format when colorScale range has no name', () => {
      const chart = chartWithLegend({
        type: 'heatmap',
        series: [
          {
            name: 'Row1',
            data: [
              { x: 'A', y: 10 },
              { x: 'B', y: 50 },
            ],
          },
        ],
        legend: { showForSingleSeries: true },
        extra: {
          plotOptions: {
            heatmap: {
              colorScale: {
                ranges: [
                  { from: 0, to: 25, color: '#00A100' },
                  { from: 26, to: 100, color: '#FF0000' },
                ],
              },
            },
          },
        },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents).toContain('0 - 25')
      expect(textContents).toContain('26 - 100')
    })
  })

  // =========================================================================
  // Distributed bar legend
  // =========================================================================
  describe('distributed bar legend', () => {
    it('should use category labels as legend names for distributed bars', () => {
      const chart = chartWithLegend({
        type: 'bar',
        series: [{ data: [10, 20, 30] }],
        legend: { show: true },
        xaxis: {
          categories: ['Apple', 'Banana', 'Cherry'],
        },
        extra: {
          plotOptions: {
            bar: { distributed: true },
          },
        },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents).toContain('Apple')
      expect(textContents).toContain('Banana')
      expect(textContents).toContain('Cherry')
    })
  })

  // =========================================================================
  // showForZeroSeries and showForNullSeries
  // =========================================================================
  describe('showForZeroSeries', () => {
    it('should hide legend item for all-zero series when showForZeroSeries is false', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'Has Data', data: [10, 20, 30] },
          { name: 'All Zero', data: [0, 0, 0] },
        ],
        legend: { showForZeroSeries: false },
      })

      const items = getLegendItems(chart)
      const hiddenItems = Array.from(items).filter((item) =>
        item.classList.contains('apexcharts-hidden-zero-series')
      )

      expect(hiddenItems.length).toBe(1)
    })
  })

  describe('showForNullSeries', () => {
    it('should hide legend item for all-null series when showForNullSeries is false', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'Has Data', data: [10, 20, 30] },
          { name: 'All Null', data: [null, null, null] },
        ],
        legend: { showForNullSeries: false },
      })

      const items = getLegendItems(chart)
      const hiddenItems = Array.from(items).filter((item) =>
        item.classList.contains('apexcharts-hidden-null-series')
      )

      expect(hiddenItems.length).toBe(1)
    })
  })

  // =========================================================================
  // Legend width and height
  // =========================================================================
  describe('custom width and height', () => {
    it('should apply custom width to legend wrapper', () => {
      const chart = chartWithLegend({
        legend: { width: 200 },
      })

      const legendWrap = chart.el.querySelector('.apexcharts-legend')
      expect(legendWrap.style.width).toBe('200px')
    })

    it('should apply custom height to legend wrapper', () => {
      const chart = chartWithLegend({
        legend: { height: 100 },
      })

      const legendWrap = chart.el.querySelector('.apexcharts-legend')
      expect(legendWrap.style.height).toBe('100px')
    })
  })

  // =========================================================================
  // Item margin
  // =========================================================================
  describe('itemMargin', () => {
    it('should apply vertical and horizontal margin to legend items', () => {
      const chart = chartWithLegend({
        legend: {
          itemMargin: { horizontal: 10, vertical: 5 },
        },
      })

      const items = getLegendItems(chart)
      expect(items[0].style.margin).toBe('5px 10px')
    })
  })

  // =========================================================================
  // Marker sizing
  // =========================================================================
  describe('marker sizing', () => {
    it('should apply uniform marker size', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          markers: {
            size: 8,
            strokeWidth: 0,
          },
        },
      })

      const markers = getLegendMarkers(chart)
      expect(markers[0].style.width).toBe('16px') // (8+0)*2
      expect(markers[0].style.height).toBe('16px')
    })

    it('should apply per-series marker sizes from array', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          markers: {
            size: [6, 10],
            strokeWidth: 0,
          },
        },
      })

      const markers = getLegendMarkers(chart)
      expect(markers[0].style.width).toBe('12px') // (6+0)*2
      expect(markers[1].style.width).toBe('20px') // (10+0)*2
    })
  })

  // =========================================================================
  // Marker offsets
  // =========================================================================
  describe('marker offsets', () => {
    it('should apply offsetX and offsetY to markers', () => {
      const chart = chartWithLegend({
        series: [{ name: 'A', data: [10] }, { name: 'B', data: [20] }],
        legend: {
          markers: {
            offsetX: 5,
            offsetY: 3,
          },
        },
      })

      const markers = getLegendMarkers(chart)
      expect(markers[0].style.left).toBe('5px')
      expect(markers[0].style.top).toBe('3px')
    })

    it('should apply per-series offsets from arrays', () => {
      const chart = chartWithLegend({
        series: [{ name: 'A', data: [10] }, { name: 'B', data: [20] }],
        legend: {
          markers: {
            offsetX: [2, 8],
            offsetY: [1, 4],
          },
        },
      })

      const markers = getLegendMarkers(chart)
      expect(markers[0].style.left).toBe('2px')
      expect(markers[0].style.top).toBe('1px')
      expect(markers[1].style.left).toBe('8px')
      expect(markers[1].style.top).toBe('4px')
    })
  })

  // =========================================================================
  // Custom marker HTML
  // =========================================================================
  describe('custom marker HTML', () => {
    it('should render custom HTML in marker when customHTML is a function', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          markers: {
            customHTML() {
              return '<span class="my-custom-marker">X</span>'
            },
          },
        },
      })

      const markers = getLegendMarkers(chart)
      const customEl = markers[0].querySelector('.my-custom-marker')
      expect(customEl).not.toBeNull()
      expect(customEl.textContent).toBe('X')
    })

    it('should render per-series custom HTML from array of functions', () => {
      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          markers: {
            customHTML: [
              () => '<span class="marker-a">A</span>',
              () => '<span class="marker-b">B</span>',
            ],
          },
        },
      })

      const markers = getLegendMarkers(chart)
      expect(markers[0].querySelector('.marker-a')).not.toBeNull()
      expect(markers[1].querySelector('.marker-b')).not.toBeNull()
    })

    it('should set marker background to transparent for custom HTML markers', () => {
      const chart = chartWithLegend({
        series: [{ name: 'A', data: [10] }, { name: 'B', data: [20] }],
        legend: {
          markers: {
            customHTML() {
              return '<span>X</span>'
            },
          },
        },
      })

      const markers = getLegendMarkers(chart)
      expect(markers[0].style.background).toBe('transparent')
    })
  })

  // =========================================================================
  // onLegendClick
  // =========================================================================
  describe('onLegendClick', () => {
    it('should not proceed when customLegendItems is set', () => {
      const legendClickSpy = vi.fn()

      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10] },
          { name: 'B', data: [20] },
        ],
        legend: {
          customLegendItems: ['Custom A', 'Custom B'],
        },
        chart: {
          events: {
            legendClick: legendClickSpy,
          },
        },
      })

      const legendText = chart.el.querySelector('.apexcharts-legend-text')
      legendText.click()

      expect(legendClickSpy).not.toHaveBeenCalled()
    })

    it('should fire legendClick event callback when legend item is clicked', () => {
      const legendClickSpy = vi.fn()

      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10, 20] },
          { name: 'B', data: [30, 40] },
        ],
        chart: {
          events: {
            legendClick: legendClickSpy,
          },
        },
      })

      const legendText = chart.el.querySelector('.apexcharts-legend-text')
      legendText.click()

      expect(legendClickSpy).toHaveBeenCalledTimes(1)
    })

    it('should fire markerClick callback when a legend marker is clicked', () => {
      const markerClickSpy = vi.fn()

      const chart = chartWithLegend({
        series: [
          { name: 'A', data: [10, 20] },
          { name: 'B', data: [30, 40] },
        ],
        legend: {
          markers: {
            onClick: markerClickSpy,
          },
        },
      })

      const marker = chart.el.querySelector(
        '.apexcharts-legend-series > .apexcharts-legend-marker'
      )
      marker.click()

      expect(markerClickSpy).toHaveBeenCalledTimes(1)
    })

    it('should not toggle data series for heatmap chart type', () => {
      const chart = chartWithLegend({
        type: 'heatmap',
        series: [
          {
            name: 'Row1',
            data: [
              { x: 'A', y: 10 },
              { x: 'B', y: 50 },
            ],
          },
        ],
        legend: { showForSingleSeries: true },
        extra: {
          plotOptions: {
            heatmap: {
              colorScale: {
                ranges: [
                  { from: 0, to: 25, color: '#00A100', name: 'Low' },
                  { from: 26, to: 100, color: '#FF0000', name: 'High' },
                ],
              },
            },
          },
        },
      })

      const legendText = chart.el.querySelector('.apexcharts-legend-text')

      // Clicking legend on heatmap should not throw or collapse
      expect(() => legendText.click()).not.toThrow()

      // Series should not be collapsed
      expect(chart.w.globals.collapsedSeries.length).toBe(0)
    })
  })

  // =========================================================================
  // Pie/donut chart legends
  // =========================================================================
  describe('pie chart legend', () => {
    it('should render legend items matching the number of data points', () => {
      const chart = chartWithLegend({
        type: 'pie',
        series: [44, 55, 13, 43],
        extra: {
          labels: ['Apple', 'Mango', 'Orange', 'Banana'],
        },
      })

      const items = getLegendItems(chart)
      expect(items.length).toBe(4)
    })

    it('should display label names as legend text for pie charts', () => {
      const chart = chartWithLegend({
        type: 'pie',
        series: [44, 55],
        extra: {
          labels: ['Desktop', 'Mobile'],
        },
      })

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)

      expect(textContents).toContain('Desktop')
      expect(textContents).toContain('Mobile')
    })
  })

  // =========================================================================
  // Donut chart legend
  // =========================================================================
  describe('donut chart legend', () => {
    it('should render legend for donut chart', () => {
      const chart = chartWithLegend({
        type: 'donut',
        series: [30, 70],
        extra: {
          labels: ['Used', 'Free'],
        },
      })

      const items = getLegendItems(chart)
      expect(items.length).toBe(2)

      const texts = getLegendTexts(chart)
      const textContents = Array.from(texts).map((t) => t.textContent)
      expect(textContents).toContain('Used')
      expect(textContents).toContain('Free')
    })
  })
})
