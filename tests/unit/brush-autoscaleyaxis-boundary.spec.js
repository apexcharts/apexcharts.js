import { createChartWithOptions } from './utils/utils.js'

const DAY = 24 * 60 * 60 * 1000

describe('Brush autoScaleYaxis boundary inclusion (#5251)', () => {
  beforeEach(() => {
    window.Apex = {}
  })
  afterEach(() => {
    document.getElementsByTagName('html')[0].innerHTML = ''
  })

  it('includes a boundary point within one rendered pixel of the brush max', async () => {
    const start = Date.UTC(2026, 5, 15)

    // 12 data points — the last one has the highest Y value (540)
    const data = [
      [start + 0 * DAY, 483],
      [start + 1 * DAY, 438],
      [start + 2 * DAY, 438],
      [start + 3 * DAY, 438],
      [start + 4 * DAY, 438],
      [start + 5 * DAY, 390],
      [start + 6 * DAY, 388],
      [start + 7 * DAY, 437],
      [start + 8 * DAY, 448],
      [start + 9 * DAY, 448],
      [start + 10 * DAY, 450],
      [start + 11 * DAY, 540],
    ]

    const lastX = data[data.length - 1][0]
    const lastY = data[data.length - 1][1]

    // The brush selection max is slightly before the last data point,
    // simulating a subpixel rounding error in the DOM pixel→timestamp conversion.
    const subpixelTimestampError = 1 // 1 ms before the last point
    const brushMax = lastX - subpixelTimestampError

    const chart = createChartWithOptions({
      chart: {
        id: 'main-chart',
        type: 'area',
        height: 240,
        width: '800px',
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
        },
        toolbar: {
          autoSelected: 'pan',
        },
      },
      series: [
        {
          name: 'Price',
          data,
        },
      ],
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      markers: {
        size: 4,
      },
      xaxis: {
        type: 'datetime',
        min: data[0][0],
        max: lastX,
      },
    })

    // Simulate a brush selection that ends slightly before the last data point
    chart.zoomX(data[0][0], brushMax)

    // The Y-axis max should include the last point (540) even though
    // brushMax is slightly before lastX, because the difference is
    // less than one rendered pixel in the X domain.
    expect(chart.w.globals.yAxisScale[0].niceMax).toBeGreaterThanOrEqual(lastY)
  })

  it('excludes a point far outside the brush range (no false positive)', async () => {
    const start = Date.UTC(2026, 5, 15)

    const data = [
      [start + 0 * DAY, 100],
      [start + 1 * DAY, 200],
      [start + 2 * DAY, 300],
      [start + 3 * DAY, 400],
      [start + 4 * DAY, 500],
    ]

    const chart = createChartWithOptions({
      chart: {
        id: 'main-chart',
        type: 'area',
        height: 240,
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
        },
        toolbar: {
          autoSelected: 'pan',
        },
      },
      series: [
        {
          name: 'Price',
          data,
        },
      ],
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      markers: {
        size: 4,
      },
      xaxis: {
        type: 'datetime',
        min: data[0][0],
        max: data[data.length - 1][0],
      },
    })

    // Zoom to first 2 points only — the last point (500) is far outside
    chart.zoomX(data[0][0], data[1][0])

    // The Y-axis max should be based on the max of the first 2 points (200),
    // not the last point (500) which is far outside the range.
    expect(chart.w.globals.yAxisScale[0].niceMax).toBeLessThan(500)
  })
})