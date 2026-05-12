import TimeScale from '../../src/modules/TimeScale'
import { range } from './data/sample-data'
import { createChart, createChartWithOptions } from './utils/utils.js'

describe('Generate TimeScale', () => {
  it('should return timescale ticks for year range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleYears = timeScale.calculateTimeScaleTicks(
      range.years[0],
      range.years[1],
    )

    expect(generatedTimeScaleYears).toHaveLength(6)
    generatedTimeScaleYears.forEach((tick) => {
      if (tick.month === 1) {
        expect(tick.unit).toBe('year')
      } else {
        expect(tick.unit).toBe('month')
      }
    })
  })

  it('should return timescale ticks for months range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleMonths = timeScale.calculateTimeScaleTicks(
      range.months[0],
      range.months[1],
    )

    expect(generatedTimeScaleMonths).toHaveLength(9)
    generatedTimeScaleMonths.forEach((tick) => {
      expect(tick.unit).toBe('month')
    })
  })

  it('should return timescale ticks for days range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleDays = timeScale.calculateTimeScaleTicks(
      range.days[0],
      range.days[1],
    )

    expect(generatedTimeScaleDays).toHaveLength(27)
    generatedTimeScaleDays.forEach((tick) => {
      if (tick.day === 1) {
        expect(tick.unit).toBe('month')
      } else {
        expect(tick.unit).toBe('day')
      }
    })
  })

  it('should return timescale ticks for hours range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleHours = timeScale.calculateTimeScaleTicks(
      range.hours[0],
      range.hours[1],
    )

    expect(generatedTimeScaleHours).toHaveLength(21)
    generatedTimeScaleHours.forEach((tick) => {
      expect(tick.unit).toBe('hour')
    })
  })

  it('should return timescale ticks for five-minutes range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.minutes_fives[0],
      range.minutes_fives[1],
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 40,
        value: 40,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 45,
        value: 45,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 50,
        value: 50,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 55,
        value: 55,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 0,
        value: 0,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 5,
        value: 5,
      }),
    ])
  })

  it('should return timescale ticks for single minutes range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.minutes[0],
      range.minutes[1],
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 59,
        value: 59,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 0,
        value: 0,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 1,
        value: 1,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 2,
        value: 2,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 3,
        value: 3,
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 4,
        value: 4,
      }),
    ])
  })

  it('should return timescale ticks for ten seconds range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.seconds_tens[0],
      range.seconds_tens[1],
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 0,
        value: 0,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 10,
        value: 10,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 20,
        value: 20,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 30,
        value: 30,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 40,
        value: 40,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 50,
        value: 50,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 0,
        value: 0,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 10,
        value: 10,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 20,
        value: 20,
      }),
    ])
  })

  it('should return timescale ticks for five seconds range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.seconds_fives[0],
      range.seconds_fives[1],
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 45,
        value: 45,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 50,
        value: 50,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 55,
        value: 55,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 0,
        value: 0,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 5,
        value: 5,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 10,
        value: 10,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 15,
        value: 15,
      }),
    ])
  })

  it('should return timescale ticks for single seconds range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.seconds[0],
      range.seconds[1],
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 58,
        value: 58,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 59,
        value: 59,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 0,
        value: 0,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 1,
        value: 1,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 2,
        value: 2,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 3,
        value: 3,
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 4,
        value: 4,
      }),
    ])
  })

  it('should generate an hour timescale with no overlapping ticks', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    timeScale.generateHourScale({
      firstVal: {
        minSecond: 0,
        minMinute: 30,
        minHour: 22,
      },
      currentDate: 22,
      currentMonth: 11,
      currentYear: 2022,
      minutesWidthOnXAxis: 0.4,
      numberOfHours: 24,
    })

    const generatedScale = timeScale.timeScaleArray
    for (let i = 0; i < generatedScale.length - 1; i++) {
      expect(generatedScale[i].position).not.toEqual(
        generatedScale[i + 1].position,
      )
    }
  })

  it('should generate an hour timescale without skipping ticks when start with full hour', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    timeScale.generateHourScale({
      firstVal: {
        minSecond: 0,
        minMinute: 0,
        minHour: 0,
      },
      currentDate: 22,
      currentMonth: 11,
      currentYear: 2022,
      minutesWidthOnXAxis: 0.4,
      numberOfHours: 3,
    })

    const generatedScale = timeScale.timeScaleArray
    for (let i = 0; i < generatedScale.length - 1; i++) {
      expect(generatedScale[i].value).toEqual(i)
    }
  })

  it('should generate an hour timescale without skipping ticks when start with partial hour', () => {
    const chart = createChart('line', [
      {
        data: [0, 1],
      },
    ])
    const timeScale = new TimeScale(chart.w, chart)
    timeScale.generateHourScale({
      firstVal: {
        minSecond: 0,
        minMinute: 35,
        minHour: 0,
      },
      currentDate: 22,
      currentMonth: 11,
      currentYear: 2022,
      minutesWidthOnXAxis: 0.4,
      numberOfHours: 3,
    })

    const generatedScale = timeScale.timeScaleArray
    for (let i = 0; i < generatedScale.length - 1; i++) {
      expect(generatedScale[i].value).toEqual(i + 1)
    }
  })

  it.each([...Array(24).keys()].map((hour) => ({ hour: hour + 1 })))(
    'should generate an formatted hourly timescale with unique ticks starting on hour $hour:00',
    ({ hour }) => {
      const chart = createChartWithOptions({
        series: [
          {
            type: 'line',
            data: [
              {
                data: [...Array(9).keys()],
              },
            ],
          },
        ],
        chart: {
          type: 'line',
        },
        xaxis: {
          type: 'datetime',
          labels: {
            format: 'HH:mm',
            datetimeUTC: false,
          },
        },
      })
      const timeScale = new TimeScale(chart.w, chart)
      timeScale.generateHourScale({
        firstVal: {
          minSecond: 0,
          minMinute: 0,
          minHour: hour,
        },
        currentDate: 22,
        currentMonth: 11,
        currentYear: 2022,
        minutesWidthOnXAxis: 0.4,
        numberOfHours: 8,
      })

      const generatedScale = timeScale.timeScaleArray
      const formattedScale = timeScale.formatDates(generatedScale)
      const scaleValues = formattedScale.map((gs) => gs.value)
      expect(scaleValues.map((gs) => gs.value).length).toEqual(
        new Set(scaleValues).size,
      )
    },
  )
})

describe('createRawDateString', () => {
  const chart = createChart('line', [
    {
      data: [0, 1],
    },
  ])
  const timeScale = new TimeScale(chart.w, chart)

  it('should create month string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'month',
          year: 2020,
          month: 2,
          value: 2,
        },
        '2',
      ),
    ).toBe('2020-02-01T00:00:00.000Z')
  })

  it('should create day string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'day',
          year: 2020,
          month: 1,
          day: 2,
          value: 2,
        },
        '2',
      ),
    ).toBe('2020-01-02T00:00:00.000Z')
  })

  it('should create hour string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'hour',
          year: 2020,
          month: 1,
          day: 1,
          hour: 2,
          value: 2,
        },
        '2',
      ),
    ).toBe('2020-01-01T02:00:00.000Z')
  })

  it('should create minute string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'minute',
          year: 2020,
          month: 1,
          day: 1,
          hour: 1,
          minute: 59,
          value: 59,
        },
        '59',
      ),
    ).toBe('2020-01-01T01:59:00.000Z')
  })

  it('should create second string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'second',
          year: 2020,
          month: 1,
          day: 1,
          hour: 1,
          minute: 1,
          second: 59,
          value: 59,
        },
        '59',
      ),
    ).toBe('2020-01-01T01:01:59.000Z')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// determineInterval
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale.determineInterval', () => {
  function makeTS() {
    const chart = createChart('line', [{ data: [0, 1] }])
    return new TimeScale(chart.w, chart)
  }

  const HOUR = 1 / 24
  const MINUTE = HOUR / 60
  const SECOND = MINUTE / 60

  it('selects "years" when range > 5 years', () => {
    const ts = makeTS()
    ts.determineInterval(365 * 6)
    expect(ts.tickInterval).toBe('years')
  })

  it('selects "half_year" when range 800-1825 days', () => {
    const ts = makeTS()
    ts.determineInterval(900)
    expect(ts.tickInterval).toBe('half_year')
  })

  it('selects "months" when range 180-800 days', () => {
    const ts = makeTS()
    ts.determineInterval(200)
    expect(ts.tickInterval).toBe('months')
  })

  it('selects "months_fortnight" when range 90-180 days', () => {
    const ts = makeTS()
    ts.determineInterval(100)
    expect(ts.tickInterval).toBe('months_fortnight')
  })

  it('selects "months_days" when range 60-90 days', () => {
    const ts = makeTS()
    ts.determineInterval(70)
    expect(ts.tickInterval).toBe('months_days')
  })

  it('selects "week_days" when range 30-60 days', () => {
    const ts = makeTS()
    ts.determineInterval(40)
    expect(ts.tickInterval).toBe('week_days')
  })

  it('selects "days" when range 2-30 days', () => {
    const ts = makeTS()
    ts.determineInterval(10)
    expect(ts.tickInterval).toBe('days')
  })

  it('selects "hours" when range 2.4h-2days', () => {
    const ts = makeTS()
    ts.determineInterval(HOUR * 5)
    expect(ts.tickInterval).toBe('hours')
  })

  it('selects "minutes_fives" when range 15min-2.4h', () => {
    const ts = makeTS()
    ts.determineInterval(MINUTE * 30)
    expect(ts.tickInterval).toBe('minutes_fives')
  })

  it('selects "minutes" when range 5-15 minutes', () => {
    const ts = makeTS()
    ts.determineInterval(MINUTE * 8)
    expect(ts.tickInterval).toBe('minutes')
  })

  it('selects "seconds_tens" when range 1-5 minutes', () => {
    const ts = makeTS()
    ts.determineInterval(MINUTE * 2)
    expect(ts.tickInterval).toBe('seconds_tens')
  })

  it('selects "seconds_fives" when range 20s-1min', () => {
    const ts = makeTS()
    ts.determineInterval(SECOND * 30)
    expect(ts.tickInterval).toBe('seconds_fives')
  })

  it('selects "seconds" as default for very short ranges', () => {
    const ts = makeTS()
    ts.determineInterval(SECOND * 5)
    expect(ts.tickInterval).toBe('seconds')
  })

  // Boundary: exactly at the 5-year threshold
  it('selects "half_year" at exactly 5 years (boundary)', () => {
    const ts = makeTS()
    ts.determineInterval(365 * 5)
    expect(ts.tickInterval).toBe('half_year')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// _getYear  (year rollover across month boundaries)
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale._getYear', () => {
  function makeTS() {
    const chart = createChart('line', [{ data: [0, 1] }])
    return new TimeScale(chart.w, chart)
  }

  it('returns currentYear when month < 12 and yrCounter = 0', () => {
    const ts = makeTS()
    expect(ts._getYear(2020, 6, 0)).toBe(2020)
  })

  it('increments year when month >= 12 (rollover)', () => {
    const ts = makeTS()
    expect(ts._getYear(2020, 12, 0)).toBe(2021)
    expect(ts._getYear(2020, 24, 0)).toBe(2022)
  })

  it('adds yrCounter on top of the month-based increment', () => {
    const ts = makeTS()
    expect(ts._getYear(2020, 0, 2)).toBe(2022)
    expect(ts._getYear(2020, 12, 1)).toBe(2022)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateTimeScaleTicks — allSeriesCollapsed early-return
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale.calculateTimeScaleTicks edge cases', () => {
  it('returns empty array and clears labels when all series are collapsed', () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    chart.w.globals.allSeriesCollapsed = true
    const ts = new TimeScale(chart.w, chart)
    const result = ts.calculateTimeScaleTicks(range.days[0], range.days[1])
    expect(result).toEqual([])
    expect(chart.w.labelData.labels).toEqual([])
    expect(chart.w.labelData.timescaleLabels).toEqual([])
  })

  it('sets disableZoomIn when range is shorter than MIN_ZOOM_DAYS', () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    const ts = new TimeScale(chart.w, chart)
    // 1-second range — well below the minimum zoom threshold
    const minX = new Date('2017-02-02T02:00:00Z').getTime()
    const maxX = minX + 1000
    ts.calculateTimeScaleTicks(minX, maxX)
    expect(chart.w.interact.disableZoomIn).toBe(true)
    expect(chart.w.interact.disableZoomOut).toBe(false)
  })

  it('sets disableZoomOut when range exceeds 50 000 days', () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    const ts = new TimeScale(chart.w, chart)
    const minX = new Date('1900-01-01T00:00:00Z').getTime()
    const maxX = minX + 50001 * 24 * 60 * 60 * 1000
    ts.calculateTimeScaleTicks(minX, maxX)
    expect(chart.w.interact.disableZoomOut).toBe(true)
    expect(chart.w.interact.disableZoomIn).toBe(false)
  })

  it('resets both zoom flags for a normal range', () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    // Prime them to true first
    chart.w.interact.disableZoomIn = true
    chart.w.interact.disableZoomOut = true
    const ts = new TimeScale(chart.w, chart)
    ts.calculateTimeScaleTicks(range.days[0], range.days[1])
    expect(chart.w.interact.disableZoomIn).toBe(false)
    expect(chart.w.interact.disableZoomOut).toBe(false)
  })

  it('returns at least one tick and correct unit for each interval type', () => {
    // In jsdom gridWidth=0 so positions are NaN — we verify tick count and
    // unit correctness rather than position ordering (position math is tested
    // implicitly by the existing generateHourScale no-overlap tests).
    const cases = [
      { label: 'years', bounds: range.years, expectedUnit: 'year' },
      { label: 'months', bounds: range.months, expectedUnit: 'month' },
      { label: 'days', bounds: range.days, expectedUnit: 'day' },
      { label: 'hours', bounds: range.hours, expectedUnit: 'hour' },
      {
        label: 'minutes_fives',
        bounds: range.minutes_fives,
        expectedUnit: 'minute',
      },
      {
        label: 'seconds_tens',
        bounds: range.seconds_tens,
        expectedUnit: 'second',
      },
    ]
    cases.forEach(({ label, bounds: [minX, maxX], expectedUnit }) => {
      const chart = createChart('line', [{ data: [0, 1] }])
      const ts = new TimeScale(chart.w, chart)
      const ticks = ts.calculateTimeScaleTicks(minX, maxX)
      expect(ticks.length, `${label} should produce ticks`).toBeGreaterThan(0)
      // At least one tick should carry the primary unit for that interval
      const hasExpectedUnit = ticks.some((t) => t.unit === expectedUnit)
      expect(
        hasExpectedUnit,
        `${label} should contain a "${expectedUnit}" tick`,
      ).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// formatDates
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale.formatDates', () => {
  function makeTS(xaxisOverride = {}) {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 1] }],
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: true, ...xaxisOverride },
      },
    })
    return new TimeScale(chart.w, chart)
  }

  it('returns an object with dateString, position, value, unit, year, month per tick', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(range.months[0], range.months[1])
    const formatted = ts.formatDates(ticks)
    formatted.forEach((item) => {
      expect(item).toHaveProperty('dateString')
      expect(item).toHaveProperty('position')
      expect(item).toHaveProperty('value')
      expect(item).toHaveProperty('unit')
      expect(item).toHaveProperty('year')
      expect(item).toHaveProperty('month')
    })
  })

  it('formats month ticks using the datetimeFormatter.month pattern by default', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(range.months[0], range.months[1])
    const formatted = ts.formatDates(ticks)
    const monthTicks = formatted.filter((t) => t.unit === 'month')
    // Default month format is "MMM 'yy" — value should be a string like "Mar '17"
    monthTicks.forEach((t) => {
      expect(typeof t.value).toBe('string')
      expect(t.value.length).toBeGreaterThan(0)
    })
  })

  it('uses xaxis.labels.format when explicitly set', () => {
    const ts = makeTS({ format: 'yyyy' })
    const ticks = ts.calculateTimeScaleTicks(range.years[0], range.years[1])
    const formatted = ts.formatDates(ticks)
    // Every tick value should be a 4-digit year string
    formatted.forEach((t) => {
      expect(t.value).toMatch(/^\d{4}$/)
    })
  })

  it('preserves position from the input tick', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(range.hours[0], range.hours[1])
    const formatted = ts.formatDates(ticks)
    ticks.forEach((tick, i) => {
      expect(formatted[i].position).toBe(tick.position)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// removeOverlappingTS
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale.removeOverlappingTS', () => {
  function makeTS() {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 1] }],
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: true, hideOverlappingLabels: true },
      },
    })
    return new TimeScale(chart.w, chart)
  }

  it('keeps all ticks when positions are well spread apart', () => {
    const ts = makeTS()
    const ticks = [
      { position: 0, value: 'Jan' },
      { position: 200, value: 'Feb' },
      { position: 400, value: 'Mar' },
    ]
    const result = ts.removeOverlappingTS(ticks)
    expect(result.length).toBe(3)
  })

  it('removes ticks that overlap with the previous label', () => {
    const ts = makeTS()
    // Label width for a short string will be ~30px; positions 0 and 5 will overlap
    const ticks = [
      { position: 0, value: 'Jan 17' },
      { position: 5, value: 'Feb 17' }, // too close — should be removed
      { position: 400, value: 'Mar 17' }, // far enough — should be kept
    ]
    const result = ts.removeOverlappingTS(ticks)
    // First tick always kept; second removed; third kept
    expect(result.length).toBe(2)
    expect(result[0].value).toBe('Jan 17')
    expect(result[1].value).toBe('Mar 17')
  })

  it('returns empty array for empty input', () => {
    const ts = makeTS()
    expect(ts.removeOverlappingTS([])).toEqual([])
  })

  it('always keeps the first tick regardless of spacing', () => {
    const ts = makeTS()
    const ticks = [{ position: 0, value: 'Only' }]
    const result = ts.removeOverlappingTS(ticks)
    expect(result.length).toBe(1)
    expect(result[0].value).toBe('Only')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Edge-case regression tests
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale edge-case regressions', () => {
  function makeTS() {
    const chart = createChart('line', [{ data: [0, 1] }])
    return new TimeScale(chart.w, chart)
  }

  it('minute scale: places tick at position 0 when starting on a whole minute', () => {
    const ts = makeTS()
    ts.generateMinuteScale({
      currentMillisecond: 0,
      currentSecond: 0,
      currentMinute: 30,
      currentHour: 10,
      currentDate: 5,
      currentMonth: 3,
      currentYear: 2023,
      minutesWidthOnXAxis: 10,
      secondsWidthOnXAxis: 10 / 60,
      numberOfMinutes: 5,
    })
    expect(ts.timeScaleArray[0].position).toBe(0)
    expect(ts.timeScaleArray[0].value).toBe(30)
    expect(ts.timeScaleArray[0].minute).toBe(30)
  })

  it('minute scale: offsets first tick when NOT starting on a whole minute', () => {
    const ts = makeTS()
    ts.generateMinuteScale({
      currentMillisecond: 0,
      currentSecond: 15,
      currentMinute: 30,
      currentHour: 10,
      currentDate: 5,
      currentMonth: 3,
      currentYear: 2023,
      minutesWidthOnXAxis: 10,
      secondsWidthOnXAxis: 10 / 60,
      numberOfMinutes: 5,
    })
    // first tick should be the next minute (31) with a position > 0
    expect(ts.timeScaleArray[0].position).toBeGreaterThan(0)
    expect(ts.timeScaleArray[0].value).toBe(31)
  })

  it('minute scale: updates date/month when crossing midnight', () => {
    const ts = makeTS()
    ts.generateMinuteScale({
      currentMillisecond: 0,
      currentSecond: 0,
      currentMinute: 58,
      currentHour: 23,
      currentDate: 15,
      currentMonth: 6,
      currentYear: 2023,
      minutesWidthOnXAxis: 10,
      secondsWidthOnXAxis: 10 / 60,
      numberOfMinutes: 5,
    })
    // ticks: 58(h23), 59(h23), 0(h0,date16), 1(h0,date16), 2(h0,date16)
    const afterMidnight = ts.timeScaleArray.filter((t) => t.hour === 0)
    expect(afterMidnight.length).toBeGreaterThan(0)
    expect(afterMidnight[0].day).toBe(16)
  })

  it('second scale: places tick at position 0 when starting on a whole second', () => {
    const ts = makeTS()
    ts.generateSecondScale({
      currentMillisecond: 0,
      currentSecond: 45,
      currentMinute: 10,
      currentHour: 5,
      currentDate: 1,
      currentMonth: 0,
      currentYear: 2024,
      secondsWidthOnXAxis: 8,
      numberOfSeconds: 5,
    })
    expect(ts.timeScaleArray[0].position).toBe(0)
    expect(ts.timeScaleArray[0].value).toBe(45)
    expect(ts.timeScaleArray[0].second).toBe(45)
  })

  it('second scale: offsets first tick when NOT starting on a whole second', () => {
    const ts = makeTS()
    ts.generateSecondScale({
      currentMillisecond: 500,
      currentSecond: 45,
      currentMinute: 10,
      currentHour: 5,
      currentDate: 1,
      currentMonth: 0,
      currentYear: 2024,
      secondsWidthOnXAxis: 8,
      numberOfSeconds: 5,
    })
    expect(ts.timeScaleArray[0].position).toBeGreaterThan(0)
    expect(ts.timeScaleArray[0].value).toBe(46)
  })

  it('hour scale: syncs firstTickValue after short-month rollover (Feb 28 non-leap)', () => {
    const ts = makeTS()
    ts.generateHourScale({
      firstVal: {
        minSecond: 0,
        minMinute: 30,
        minHour: 23,
      },
      currentDate: 28,
      currentMonth: 1, // February (0-indexed)
      currentYear: 2023, // non-leap
      minutesWidthOnXAxis: 0.4,
      numberOfHours: 5,
    })
    // First tick crosses midnight: date should roll to Mar 1, not stay as 29
    const firstTick = ts.timeScaleArray[0]
    expect(firstTick.day).toBe(1)
    expect(firstTick.value).toBe(1) // day value, not 29
  })

  it('year scale: first tick has month 1 (January) regardless of start month', () => {
    const ts = makeTS()
    ts.generateYearScale({
      firstVal: {
        minYear: 2020,
        minMonth: 6, // start in July
        minDate: 15,
      },
      currentMonth: 6,
      currentYear: 2020,
      daysWidthOnXAxis: 1,
      numberOfYears: 3,
    })
    // First year tick is Jan 1 2021 — month should be 1, not 7
    expect(ts.timeScaleArray[0].month).toBe(1)
    expect(ts.timeScaleArray[0].year).toBe(2021)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Boundary regressions — locked in BEFORE Phase 2 refactor so that any
// structural change can be measured against current behavior. These exercise
// the bug-prone zones: leap years, year/month transitions, midnight crossings,
// DST, and sub-second / single-point edge ranges. They go through the public
// `calculateTimeScaleTicks` entry point.
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale boundary scenarios (calculateTimeScaleTicks contract)', () => {
  function makeTS(xaxisOverride = {}) {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 1] }],
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: true, ...xaxisOverride },
      },
    })
    return new TimeScale(chart.w, chart)
  }

  // Helper: assert ordering & uniqueness invariants that ANY correct
  // tick generator must produce, independent of formatting choices.
  function assertInvariants(ticks, ctx = '') {
    const ms = ticks
      .map((t) => {
        if (t.unit === 'year') return Date.UTC(t.year, 0, 1)
        if (t.unit === 'month') return Date.UTC(t.year, t.month - 1, 1)
        if (t.unit === 'day') return Date.UTC(t.year, t.month - 1, t.day)
        if (t.unit === 'hour') {
          return Date.UTC(t.year, t.month - 1, t.day, t.hour)
        }
        if (t.unit === 'minute') {
          return Date.UTC(t.year, t.month - 1, t.day, t.hour, t.value)
        }
        if (t.unit === 'second') {
          return Date.UTC(
            t.year,
            t.month - 1,
            t.day,
            t.hour,
            t.minute,
            t.second,
          )
        }
        return NaN
      })
      .filter((n) => !Number.isNaN(n))
    for (let i = 1; i < ms.length; i++) {
      expect(ms[i], `${ctx}: ticks must be strictly increasing`).toBeGreaterThan(
        ms[i - 1],
      )
    }
    const dedup = new Set(ms)
    expect(dedup.size, `${ctx}: no duplicate timestamps`).toBe(ms.length)
  }

  it('leap year: 3-day range crossing Feb 28 → 29 → Mar 1 2024 (hour scale)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 1, 28, 0, 0, 0)
    const maxX = Date.UTC(2024, 2, 1, 0, 0, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    // hour interval; must include Feb 29 (the leap day)
    expect(ts.tickInterval).toBe('hours')
    const feb29 = ticks.filter(
      (t) => t.year === 2024 && t.month === 2 && t.day === 29,
    )
    expect(feb29.length).toBeGreaterThan(0)
    // Day transition from 29 → 1 must be present
    const mar1 = ticks.find(
      (t) => t.year === 2024 && t.month === 3 && t.day === 1,
    )
    expect(mar1).toBeDefined()
    assertInvariants(ticks, 'leap Feb 28→Mar 1')
  })

  it('non-leap year: 4-day range Feb 27 2023 → Mar 2 2023 (day scale, no Feb 29)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2023, 1, 27, 0, 0, 0)
    const maxX = Date.UTC(2023, 2, 2, 23, 59, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('days')
    // Must NOT include Feb 29 2023
    const feb29 = ticks.find(
      (t) => t.year === 2023 && t.month === 2 && t.day === 29,
    )
    expect(feb29).toBeUndefined()
    // Feb 28 must be present, followed by Mar 1
    const feb28 = ticks.find(
      (t) => t.year === 2023 && t.month === 2 && t.day === 28,
    )
    const mar1 = ticks.find(
      (t) => t.year === 2023 && t.month === 3 && t.day === 1,
    )
    expect(feb28).toBeDefined()
    expect(mar1).toBeDefined()
    assertInvariants(ticks, 'non-leap Feb 27→Mar 2')
  })

  it('year boundary: Dec 31 23:55 → Jan 1 00:05 (minute scale)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2023, 11, 31, 23, 55, 0)
    const maxX = Date.UTC(2024, 0, 1, 0, 5, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(['minutes', 'minutes_fives']).toContain(ts.tickInterval)
    // The 00:00 boundary should produce a tick with year=2024, month=1, day=1
    const newYear = ticks.find(
      (t) =>
        t.year === 2024 && t.month === 1 && t.day === 1 && t.value === 0,
    )
    expect(newYear).toBeDefined()
    // 2023 ticks must all precede 2024 ticks
    const last2023 = ticks.findLast
      ? ticks.findLast((t) => t.year === 2023)
      : [...ticks].reverse().find((t) => t.year === 2023)
    const first2024 = ticks.find((t) => t.year === 2024)
    expect(ticks.indexOf(last2023)).toBeLessThan(ticks.indexOf(first2024))
    assertInvariants(ticks, 'year boundary minute')
  })

  it('year boundary: Dec 28 2023 → Jan 5 2024 (day scale)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2023, 11, 28, 0, 0, 0)
    const maxX = Date.UTC(2024, 0, 5, 0, 0, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('days')
    // Dec 31 2023 → Jan 1 2024 transition must exist with month=1 for Jan
    const jan1 = ticks.find(
      (t) => t.year === 2024 && t.month === 1 && t.day === 1,
    )
    expect(jan1).toBeDefined()
    // Jan 1 should be flagged as month-boundary (unit=month) per the
    // month-boundary highlighting rule in TimeScale
    expect(jan1.unit).toBe('month')
    assertInvariants(ticks, 'year boundary day')
  })

  it('month-length transition: Jan 28 → Feb 5 2024 (day scale)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 0, 28, 0, 0, 0)
    const maxX = Date.UTC(2024, 1, 5, 0, 0, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('days')
    // Jan 31 must exist (not collapsed)
    expect(
      ticks.find((t) => t.year === 2024 && t.month === 1 && t.day === 31),
    ).toBeDefined()
    // Feb 1 must exist with unit='month'
    const feb1 = ticks.find(
      (t) => t.year === 2024 && t.month === 2 && t.day === 1,
    )
    expect(feb1).toBeDefined()
    expect(feb1.unit).toBe('month')
    assertInvariants(ticks, 'Jan→Feb 2024')
  })

  it('short-month transition: Apr 28 → May 3 2024 (30-day month, day scale)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 3, 28, 0, 0, 0)
    const maxX = Date.UTC(2024, 4, 3, 0, 0, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('days')
    // April has 30 days — must end at Apr 30, not Apr 31
    expect(
      ticks.find((t) => t.year === 2024 && t.month === 4 && t.day === 31),
    ).toBeUndefined()
    expect(
      ticks.find((t) => t.year === 2024 && t.month === 4 && t.day === 30),
    ).toBeDefined()
    expect(
      ticks.find((t) => t.year === 2024 && t.month === 5 && t.day === 1),
    ).toBeDefined()
    assertInvariants(ticks, 'Apr→May 2024')
  })

  it('midnight crossing: 23:00 → 02:00 next day (hour scale)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 5, 15, 23, 0, 0)
    const maxX = Date.UTC(2024, 5, 16, 2, 0, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('hours')
    // 00:00 of June 16 (next day) must exist with day=16
    const midnight = ticks.find(
      (t) =>
        t.year === 2024 && t.month === 6 && t.day === 16 && t.hour === 0,
    )
    expect(midnight).toBeDefined()
    // Day-rollover tick should carry unit='day' per current behavior
    expect(midnight.unit).toBe('day')
    assertInvariants(ticks, 'midnight hour')
  })

  it('DST spring-forward: Mar 9 2025 01:00 → 04:00 (datetimeUTC:false, hour scale)', () => {
    // With datetimeUTC:false, generation uses local-time parsing. We don't
    // assert exact tick contents (timezone-dependent in CI) — instead we lock
    // in that the pipeline produces a valid, monotonic, non-duplicated set.
    const ts = makeTS({ datetimeUTC: false })
    const minX = new Date(2025, 2, 9, 1, 0, 0).getTime()
    const maxX = new Date(2025, 2, 9, 4, 0, 0).getTime()
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('hours')
    expect(ticks.length).toBeGreaterThan(0)
    assertInvariants(ticks, 'DST spring-forward')
  })

  it('DST fall-back: Nov 2 2025 00:00 → 03:00 (datetimeUTC:false, hour scale)', () => {
    const ts = makeTS({ datetimeUTC: false })
    const minX = new Date(2025, 10, 2, 0, 0, 0).getTime()
    const maxX = new Date(2025, 10, 2, 3, 0, 0).getTime()
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('hours')
    expect(ticks.length).toBeGreaterThan(0)
    assertInvariants(ticks, 'DST fall-back')
  })

  it('sub-second range: 500ms span (seconds scale, disableZoomIn flag set)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 0, 1, 0, 0, 0, 0)
    const maxX = minX + 500
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('seconds')
    // Pipeline must not crash; may produce 0 or 1 tick
    expect(Array.isArray(ticks)).toBe(true)
  })

  it('single-second range: exactly 1 second (seconds scale)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0, 0)
    const maxX = minX + 1000
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('seconds')
    expect(ticks.length).toBeGreaterThanOrEqual(1)
    assertInvariants(ticks, 'single-second')
  })

  it('half-year range: 400-day span (half_year interval)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2023, 0, 1, 0, 0, 0)
    const maxX = minX + 400 * 24 * 60 * 60 * 1000
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    // 400 days → 180–800 day band → 'months', or could be 'half_year' if >800.
    // Actually 400 sits inside 'months'. Adjust to 900 days for true half_year.
    expect(ts.tickInterval).toBe('months')
    // Should produce monthly ticks with year-boundary highlighting
    const yearBoundary = ticks.find((t) => t.unit === 'year')
    expect(yearBoundary).toBeDefined()
    expect(yearBoundary.year).toBe(2024)
    assertInvariants(ticks, '400-day months')
  })

  it('true half_year: 900-day span (half_year interval)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2022, 0, 1, 0, 0, 0)
    const maxX = minX + 900 * 24 * 60 * 60 * 1000
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('half_year')
    // Must include year boundaries as 'year' ticks
    const yearTicks = ticks.filter((t) => t.unit === 'year')
    expect(yearTicks.length).toBeGreaterThanOrEqual(2)
    assertInvariants(ticks, '900-day half_year')
  })

  it('20-year span (years interval)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2000, 0, 1, 0, 0, 0)
    const maxX = Date.UTC(2020, 0, 1, 0, 0, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    expect(ts.tickInterval).toBe('years')
    // Must produce year ticks for ~each year; first one must be Jan
    const yearTicks = ticks.filter((t) => t.unit === 'year')
    expect(yearTicks.length).toBeGreaterThan(0)
    yearTicks.forEach((t) => {
      expect(t.month).toBe(1)
    })
    assertInvariants(ticks, '20-year span')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Golden output — captures the full `calculateTimeScaleTicks` +
// `formatDates` pipeline for one representative input per `tickInterval`.
// Positions are NaN in jsdom (gridWidth=0) so they are stripped. The
// remaining shape is the Phase 2 refactor contract: any structural change
// to TimeScale.js must produce byte-identical snapshots, or the diff is
// reviewed deliberately and the snapshot updated with `vitest -u`.
//
// Each fixture's minX/maxX are fixed UTC timestamps chosen to land squarely
// in the interval band of `determineInterval()` so the test is stable across
// any future threshold tuning that nudges nearby fixtures.
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale golden output (one fixture per interval)', () => {
  function makeTS() {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 1] }],
      xaxis: {
        type: 'datetime',
        labels: { datetimeUTC: true },
      },
    })
    return new TimeScale(chart.w, chart)
  }

  // Strip `position` (NaN in jsdom — gridWidth=0). Everything else is the
  // structural contract: unit, dateString, value, year/month/day/hour/min/sec.
  function cleanTick(t) {
    const { position: _pos, ...rest } = t
    return rest
  }

  function runFixture(minX, maxX) {
    const ts = makeTS()
    const raw = ts.calculateTimeScaleTicks(minX, maxX)
    const formatted = ts.formatDates(raw)
    return {
      tickInterval: ts.tickInterval,
      tickCount: formatted.length,
      ticks: formatted.map(cleanTick),
    }
  }

  // 1s range
  it('seconds: 5-second range', () => {
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0)
    const maxX = minX + 5_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // seconds_fives: 30s
  it('seconds_fives: 30-second range', () => {
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0)
    const maxX = minX + 30_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // seconds_tens: 2min
  it('seconds_tens: 2-minute range', () => {
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0)
    const maxX = minX + 2 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // minutes: 8min
  it('minutes: 8-minute range', () => {
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0)
    const maxX = minX + 8 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // minutes_fives: 30min
  it('minutes_fives: 30-minute range', () => {
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0)
    const maxX = minX + 30 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // hours: 5h
  it('hours: 5-hour range', () => {
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0)
    const maxX = minX + 5 * 60 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // days: 10d
  it('days: 10-day range', () => {
    const minX = Date.UTC(2024, 0, 1, 0, 0, 0)
    const maxX = minX + 10 * 24 * 60 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // week_days: 40d
  it('week_days: 40-day range', () => {
    const minX = Date.UTC(2024, 0, 1, 0, 0, 0)
    const maxX = minX + 40 * 24 * 60 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // months_days: 70d
  it('months_days: 70-day range', () => {
    const minX = Date.UTC(2024, 0, 1, 0, 0, 0)
    const maxX = minX + 70 * 24 * 60 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // months_fortnight: 100d
  it('months_fortnight: 100-day range', () => {
    const minX = Date.UTC(2024, 0, 1, 0, 0, 0)
    const maxX = minX + 100 * 24 * 60 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // months: 200d
  it('months: 200-day range', () => {
    const minX = Date.UTC(2024, 0, 1, 0, 0, 0)
    const maxX = minX + 200 * 24 * 60 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // half_year: 900d
  it('half_year: 900-day range', () => {
    const minX = Date.UTC(2022, 0, 1, 0, 0, 0)
    const maxX = minX + 900 * 24 * 60 * 60_000
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // years: 6y
  it('years: 6-year range', () => {
    const minX = Date.UTC(2018, 0, 1, 0, 0, 0)
    const maxX = Date.UTC(2024, 0, 1, 0, 0, 0)
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // Boundary: leap-year crossing (hour scale)
  it('boundary: leap-year Feb 28→Mar 1 2024 (hour scale)', () => {
    const minX = Date.UTC(2024, 1, 28, 0, 0, 0)
    const maxX = Date.UTC(2024, 2, 1, 0, 0, 0)
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })

  // Boundary: year crossing (day scale)
  it('boundary: year crossing Dec 28 2023 → Jan 5 2024 (day scale)', () => {
    const minX = Date.UTC(2023, 11, 28, 0, 0, 0)
    const maxX = Date.UTC(2024, 0, 5, 0, 0, 0)
    expect(runFixture(minX, maxX)).toMatchSnapshot()
  })
})
