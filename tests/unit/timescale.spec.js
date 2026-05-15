import TimeScale from '../../src/modules/TimeScale'
import { range } from './data/sample-data'
import { createChart, createChartWithOptions } from './utils/utils.js'

// ─────────────────────────────────────────────────────────────────────────────
// v6 TimeScale tests — single-interval ticks, multi-resolution formatter.
// The v5 generator-direct tests (generateYearScale, generateMonthScale, etc.)
// and the v5 string `tickInterval` cascade tests are intentionally gone — those
// modules don't exist in v6. Coverage is now at the contract level:
//   - pickInterval: chooses one ladder entry by span
//   - calculateTimeScaleTicks: produces calendar-aligned ticks
//   - formatDates: multi-resolution formatter (year only at year crossings)
//   - removeOverlappingTS: unchanged from v5
//   - boundary scenarios: locked-in behavior at leap year, DST, year crossing
//   - golden snapshots: byte-for-byte output contract per ladder entry
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// pickInterval — span → {unit, step} ladder
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale.calculateTimeScaleTicks: interval picker', () => {
  function intervalFor(spanMs) {
    const ts = makeTS()
    const minX = Date.UTC(2024, 0, 1, 0, 0, 0)
    ts.calculateTimeScaleTicks(minX, minX + spanMs)
    return ts.tickInterval
  }

  // The picker is closest-match-in-log-space (D3-style). For each span,
  // expect the interval whose `approxMs` is closest to span/targetCount.
  // With default targetCount=10, target_per_tick = span/10.

  it('picks second-step ticks for tiny spans', () => {
    expect(intervalFor(5_000).unit).toBe('second')
    expect(intervalFor(20_000).unit).toBe('second')
    expect(intervalFor(60_000).unit).toBe('second')
  })

  it('picks second/15 for 2-minute span (12s target → 15s closest)', () => {
    const i = intervalFor(2 * 60_000)
    expect(i.unit).toBe('second')
    expect(i.step).toBe(15)
  })

  it('picks minute ticks for ~10-minute span (60s target → minute/1)', () => {
    const i = intervalFor(8 * 60_000)
    expect(i.unit).toBe('minute')
    expect(i.step).toBe(1)
  })

  it('picks minute/5 for 30-minute span', () => {
    const i = intervalFor(30 * 60_000)
    expect(i.unit).toBe('minute')
    expect(i.step).toBe(5)
  })

  it('picks minute/30 for ~5-hour span (30min target — exact match)', () => {
    const i = intervalFor(5 * 60 * 60_000)
    expect(i.unit).toBe('minute')
    expect(i.step).toBe(30)
  })

  it('picks hour/3 for ~20-hour span', () => {
    const i = intervalFor(20 * 60 * 60_000)
    expect(i.unit).toBe('hour')
    expect(i.step).toBe(3)
  })

  it('picks hour/12 for ~5-day span (12h target — exact)', () => {
    const i = intervalFor(5 * 24 * 60 * 60_000)
    expect(i.unit).toBe('hour')
    expect(i.step).toBe(12)
  })

  it('picks day/2 for ~20-day span (2d target — exact)', () => {
    const i = intervalFor(20 * 24 * 60 * 60_000)
    expect(i.unit).toBe('day')
    expect(i.step).toBe(2)
  })

  it('picks week/1 for ~60-day span', () => {
    const i = intervalFor(60 * 24 * 60 * 60_000)
    expect(i.unit).toBe('week')
    expect(i.step).toBe(1)
  })

  it('picks week/2 for ~180-day span (closest to 18d target)', () => {
    const i = intervalFor(180 * 24 * 60 * 60_000)
    expect(i.unit).toBe('week')
    expect(i.step).toBe(2)
  })

  it('picks month/3 for multi-year spans (e.g. 3 years)', () => {
    const i = intervalFor(3 * 365 * 24 * 60 * 60_000)
    expect(i.unit).toBe('month')
    expect(i.step).toBe(3)
  })

  it('picks year ticks for very long spans', () => {
    expect(intervalFor(20 * 365 * 24 * 60 * 60_000).unit).toBe('year')
  })

  it('respects xaxis.tickAmount as the target count', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 1] }],
      xaxis: {
        type: 'datetime',
        tickAmount: 5,
        labels: { datetimeUTC: true },
      },
    })
    const ts = new TimeScale(chart.w, chart)
    const minX = Date.UTC(2024, 0, 1)
    const maxX = Date.UTC(2024, 0, 11)
    ts.calculateTimeScaleTicks(minX, maxX)
    // Lower target → coarser interval
    expect(['day', 'week']).toContain(ts.tickInterval.unit)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// calculateTimeScaleTicks edge cases (zoom flags, allSeriesCollapsed)
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
    chart.w.interact.disableZoomIn = true
    chart.w.interact.disableZoomOut = true
    const ts = new TimeScale(chart.w, chart)
    ts.calculateTimeScaleTicks(range.days[0], range.days[1])
    expect(chart.w.interact.disableZoomIn).toBe(false)
    expect(chart.w.interact.disableZoomOut).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// formatDates — multi-resolution formatter contract
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale.formatDates', () => {
  it('returns objects with dateString, position, value, unit, year, month', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(range.months[0], range.months[1])
    const formatted = ts.formatDates(ticks)
    expect(formatted.length).toBeGreaterThan(0)
    formatted.forEach((item) => {
      expect(item).toHaveProperty('dateString')
      expect(item).toHaveProperty('position')
      expect(item).toHaveProperty('value')
      expect(item).toHaveProperty('unit')
      expect(item).toHaveProperty('year')
      expect(item).toHaveProperty('month')
    })
  })

  it('folds year context into every label when the range crosses years (day scale)', () => {
    const ts = makeTS()
    // 8-day span crossing Dec 31 2023 → Jan 1 2024. Single-resolution model:
    // every label is day-scale and the format expands to "dd MMM yyyy" so
    // year context is visible on each tick, not just at the boundary.
    const minX = Date.UTC(2023, 11, 28)
    const maxX = Date.UTC(2024, 0, 5)
    const ticks = ts.calculateTimeScaleTicks(minX, maxX)
    const formatted = ts.formatDates(ticks)
    expect(ts.tickInterval.unit).toBe('day')
    formatted.forEach((t) => {
      expect(t.unit).toBe('day')
      expect(t.value).toMatch(/202[34]/)
    })
  })

  it('uses xaxis.labels.format when explicitly set, overriding multi-resolution', () => {
    const ts = makeTS({ format: 'yyyy-MM-dd' })
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2018, 0, 1),
      Date.UTC(2024, 0, 1),
    )
    const formatted = ts.formatDates(ticks)
    formatted.forEach((t) => {
      expect(t.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
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

  it('builds dateString as ISO with Z suffix in UTC mode', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(range.days[0], range.days[1])
    const formatted = ts.formatDates(ticks)
    formatted.forEach((t) => {
      expect(t.dateString).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.000Z$/,
      )
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// removeOverlappingTS — unchanged from v5
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale.removeOverlappingTS', () => {
  function makeOverlapTS() {
    return makeTS({ hideOverlappingLabels: true })
  }

  it('keeps all ticks when positions are well spread apart', () => {
    const ts = makeOverlapTS()
    const ticks = [
      { position: 0, value: 'Jan' },
      { position: 200, value: 'Feb' },
      { position: 400, value: 'Mar' },
    ]
    const result = ts.removeOverlappingTS(ticks)
    expect(result.length).toBe(3)
  })

  it('removes ticks that overlap with the previous label', () => {
    const ts = makeOverlapTS()
    const ticks = [
      { position: 0, value: 'Jan 17' },
      { position: 5, value: 'Feb 17' }, // too close — should be removed
      { position: 400, value: 'Mar 17' },
    ]
    const result = ts.removeOverlappingTS(ticks)
    expect(result.length).toBe(2)
    expect(result[0].value).toBe('Jan 17')
    expect(result[1].value).toBe('Mar 17')
  })

  it('returns empty array for empty input', () => {
    const ts = makeOverlapTS()
    expect(ts.removeOverlappingTS([])).toEqual([])
  })

  it('always keeps the first tick regardless of spacing', () => {
    const ts = makeOverlapTS()
    const ticks = [{ position: 0, value: 'Only' }]
    const result = ts.removeOverlappingTS(ticks)
    expect(result.length).toBe(1)
    expect(result[0].value).toBe('Only')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Boundary scenarios — locked-in behavior at the bug-prone zones (leap year,
// year/month crossings, DST). Each goes through the public
// calculateTimeScaleTicks entry and asserts strictly-increasing monotonic
// ticks and no duplicate timestamps via a shared invariant helper.
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale boundary scenarios', () => {
  function assertInvariants(ticks, ctx = '') {
    const ms = ticks
      .map((t) => {
        if (t.unit === 'year') return Date.UTC(t.year, 0, 1)
        if (t.unit === 'month') return Date.UTC(t.year, t.month - 1, 1)
        if (t.unit === 'day') {
          return Date.UTC(t.year, t.month - 1, t.day)
        }
        if (t.unit === 'hour') {
          return Date.UTC(t.year, t.month - 1, t.day, t.hour)
        }
        if (t.unit === 'minute') {
          return Date.UTC(
            t.year,
            t.month - 1,
            t.day,
            t.hour,
            t.minute,
          )
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
      expect(
        ms[i],
        `${ctx}: ticks must be strictly increasing`,
      ).toBeGreaterThan(ms[i - 1])
    }
    expect(new Set(ms).size, `${ctx}: no duplicate timestamps`).toBe(ms.length)
  }

  it('leap year: 3-day range crossing Feb 28 → 29 → Mar 1 2024', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2024, 1, 28),
      Date.UTC(2024, 2, 1),
    )
    // Day-scale interval; Feb 29 must appear (leap day)
    expect(ts.tickInterval.unit).toBe('hour')
    const feb29 = ticks.find(
      (t) => t.year === 2024 && t.month === 2 && t.day === 29,
    )
    expect(feb29).toBeDefined()
    // Mar 1 boundary — must be present
    const mar1 = ticks.find(
      (t) => t.year === 2024 && t.month === 3 && t.day === 1,
    )
    expect(mar1).toBeDefined()
    assertInvariants(ticks, 'leap Feb 28→Mar 1')
  })

  it('non-leap year: 4-day range Feb 27 → Mar 2 2023 (no Feb 29)', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2023, 1, 27),
      Date.UTC(2023, 2, 2, 23, 59, 0),
    )
    expect(['day', 'hour']).toContain(ts.tickInterval.unit)
    expect(
      ticks.find((t) => t.year === 2023 && t.month === 2 && t.day === 29),
    ).toBeUndefined()
    expect(
      ticks.find((t) => t.year === 2023 && t.month === 2 && t.day === 28),
    ).toBeDefined()
    expect(
      ticks.find((t) => t.year === 2023 && t.month === 3 && t.day === 1),
    ).toBeDefined()
    assertInvariants(ticks, 'non-leap Feb 27→Mar 2')
  })

  it('year boundary: Dec 31 23:55 → Jan 1 00:05 (minute scale)', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2023, 11, 31, 23, 55),
      Date.UTC(2024, 0, 1, 0, 5),
    )
    expect(ts.tickInterval.unit).toBe('minute')
    // The 00:00 boundary must be present (every label is minute-scale —
    // no promotion in single-resolution model)
    const newYear = ticks.find(
      (t) => t.year === 2024 && t.month === 1 && t.day === 1 && t.hour === 0,
    )
    expect(newYear).toBeDefined()
    assertInvariants(ticks, 'year boundary minute')
  })

  it('year boundary: Dec 28 2023 → Jan 5 2024 (day scale)', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2023, 11, 28),
      Date.UTC(2024, 0, 5),
    )
    expect(ts.tickInterval.unit).toBe('day')
    const jan1 = ticks.find(
      (t) => t.year === 2024 && t.month === 1 && t.day === 1,
    )
    expect(jan1).toBeDefined()
    assertInvariants(ticks, 'year boundary day')
  })

  it('month-length transition: Jan 28 → Feb 5 2024 (day scale)', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2024, 0, 28),
      Date.UTC(2024, 1, 5),
    )
    expect(ts.tickInterval.unit).toBe('day')
    expect(
      ticks.find((t) => t.year === 2024 && t.month === 1 && t.day === 31),
    ).toBeDefined()
    const feb1 = ticks.find(
      (t) => t.year === 2024 && t.month === 2 && t.day === 1,
    )
    expect(feb1).toBeDefined()
    assertInvariants(ticks, 'Jan→Feb 2024')
  })

  it('short-month transition: Apr 28 → May 3 2024 (5-day span, hour/12)', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2024, 3, 28),
      Date.UTC(2024, 4, 3),
    )
    // 5 days / 10 ticks → 12h target → hour/12 closest
    expect(ts.tickInterval.unit).toBe('hour')
    expect(ts.tickInterval.step).toBe(12)
    // April has 30 days — must end at Apr 30, not Apr 31
    expect(
      ticks.find((t) => t.year === 2024 && t.month === 4 && t.day === 31),
    ).toBeUndefined()
    expect(
      ticks.find((t) => t.year === 2024 && t.month === 4 && t.day === 30),
    ).toBeDefined()
    const may1 = ticks.find(
      (t) => t.year === 2024 && t.month === 5 && t.day === 1,
    )
    expect(may1).toBeDefined()
    assertInvariants(ticks, 'Apr→May 2024')
  })

  it('midnight crossing: 23:00 → 02:00 next day (3h span, minute/15)', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2024, 5, 15, 23),
      Date.UTC(2024, 5, 16, 2),
    )
    // 3h / 10 ticks → 18min target → minute/15 closest
    expect(ts.tickInterval.unit).toBe('minute')
    expect(ts.tickInterval.step).toBe(15)
    const midnight = ticks.find(
      (t) =>
        t.year === 2024 &&
        t.month === 6 &&
        t.day === 16 &&
        t.hour === 0 &&
        t.minute === 0,
    )
    expect(midnight).toBeDefined()
    assertInvariants(ticks, 'midnight minute/15')
  })

  it('DST spring-forward: Mar 9 2025 01:00 → 04:00 (datetimeUTC:false)', () => {
    const ts = makeTS({ datetimeUTC: false })
    const ticks = ts.calculateTimeScaleTicks(
      new Date(2025, 2, 9, 1, 0, 0).getTime(),
      new Date(2025, 2, 9, 4, 0, 0).getTime(),
    )
    // 3h span → minute/15 picker
    expect(ts.tickInterval.unit).toBe('minute')
    expect(ticks.length).toBeGreaterThan(0)
    assertInvariants(ticks, 'DST spring-forward')
  })

  it('DST fall-back: Nov 2 2025 00:00 → 03:00 (datetimeUTC:false)', () => {
    const ts = makeTS({ datetimeUTC: false })
    const ticks = ts.calculateTimeScaleTicks(
      new Date(2025, 10, 2, 0, 0, 0).getTime(),
      new Date(2025, 10, 2, 3, 0, 0).getTime(),
    )
    expect(ts.tickInterval.unit).toBe('minute')
    expect(ticks.length).toBeGreaterThan(0)
    assertInvariants(ticks, 'DST fall-back')
  })

  it('sub-second range: 500ms span (seconds interval, disableZoomIn flag)', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 0, 1)
    const ticks = ts.calculateTimeScaleTicks(minX, minX + 500)
    expect(ts.tickInterval.unit).toBe('second')
    expect(Array.isArray(ticks)).toBe(true)
  })

  it('single-second range: exactly 1 second', () => {
    const ts = makeTS()
    const minX = Date.UTC(2024, 0, 1, 12, 0, 0)
    const ticks = ts.calculateTimeScaleTicks(minX, minX + 1000)
    expect(ts.tickInterval.unit).toBe('second')
    expect(ticks.length).toBeGreaterThanOrEqual(1)
    assertInvariants(ticks, 'single-second')
  })

  it('20-year span: every tick is unit=year, format "yyyy"', () => {
    const ts = makeTS()
    const ticks = ts.calculateTimeScaleTicks(
      Date.UTC(2000, 0, 1),
      Date.UTC(2020, 0, 1),
    )
    expect(ts.tickInterval.unit).toBe('year')
    ticks.forEach((t) => expect(t.unit).toBe('year'))
    const formatted = ts.formatDates(ticks)
    formatted.forEach((t) => expect(t.value).toMatch(/^\d{4}$/))
    assertInvariants(ticks, '20-year span')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Golden output — captures the full calculateTimeScaleTicks + formatDates
// pipeline for one representative input per ladder entry. Snapshots strip
// position (NaN in jsdom — gridWidth=0). Update via `vitest -u` only when a
// behavior change is intentional.
// ─────────────────────────────────────────────────────────────────────────────

describe('TimeScale golden output', () => {
  function cleanTick(t) {
    const { position: _p, ...rest } = t
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

  it('seconds: 5-second range', () => {
    const minX = Date.UTC(2024, 0, 1, 12)
    expect(runFixture(minX, minX + 5_000)).toMatchSnapshot()
  })

  it('seconds: 30-second range', () => {
    const minX = Date.UTC(2024, 0, 1, 12)
    expect(runFixture(minX, minX + 30_000)).toMatchSnapshot()
  })

  it('seconds: 2-minute range', () => {
    const minX = Date.UTC(2024, 0, 1, 12)
    expect(runFixture(minX, minX + 120_000)).toMatchSnapshot()
  })

  it('minutes: 8-minute range', () => {
    const minX = Date.UTC(2024, 0, 1, 12)
    expect(runFixture(minX, minX + 8 * 60_000)).toMatchSnapshot()
  })

  it('minutes: 30-minute range', () => {
    const minX = Date.UTC(2024, 0, 1, 12)
    expect(runFixture(minX, minX + 30 * 60_000)).toMatchSnapshot()
  })

  it('hours: 5-hour range', () => {
    const minX = Date.UTC(2024, 0, 1, 12)
    expect(runFixture(minX, minX + 5 * 60 * 60_000)).toMatchSnapshot()
  })

  it('days: 10-day range', () => {
    const minX = Date.UTC(2024, 0, 1)
    expect(runFixture(minX, minX + 10 * 24 * 60 * 60_000)).toMatchSnapshot()
  })

  it('weeks/days: 40-day range', () => {
    const minX = Date.UTC(2024, 0, 1)
    expect(runFixture(minX, minX + 40 * 24 * 60 * 60_000)).toMatchSnapshot()
  })

  it('weeks: 70-day range', () => {
    const minX = Date.UTC(2024, 0, 1)
    expect(runFixture(minX, minX + 70 * 24 * 60 * 60_000)).toMatchSnapshot()
  })

  it('months: 100-day range', () => {
    const minX = Date.UTC(2024, 0, 1)
    expect(runFixture(minX, minX + 100 * 24 * 60 * 60_000)).toMatchSnapshot()
  })

  it('months: 200-day range', () => {
    const minX = Date.UTC(2024, 0, 1)
    expect(runFixture(minX, minX + 200 * 24 * 60 * 60_000)).toMatchSnapshot()
  })

  it('months: 900-day range', () => {
    const minX = Date.UTC(2022, 0, 1)
    expect(runFixture(minX, minX + 900 * 24 * 60 * 60_000)).toMatchSnapshot()
  })

  it('years: 6-year range', () => {
    expect(
      runFixture(Date.UTC(2018, 0, 1), Date.UTC(2024, 0, 1)),
    ).toMatchSnapshot()
  })

  it('boundary: leap-year Feb 28→Mar 1 2024 (hour scale)', () => {
    expect(
      runFixture(Date.UTC(2024, 1, 28), Date.UTC(2024, 2, 1)),
    ).toMatchSnapshot()
  })

  it('boundary: year crossing Dec 28 2023 → Jan 5 2024 (day scale)', () => {
    expect(
      runFixture(Date.UTC(2023, 11, 28), Date.UTC(2024, 0, 5)),
    ).toMatchSnapshot()
  })
})
