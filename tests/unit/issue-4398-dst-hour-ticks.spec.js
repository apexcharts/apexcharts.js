import TimeScale from '../../src/modules/TimeScale'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #4398: local-time ticks on the day a fall-back repeats an hour. Stepping by
 * the wall clock, 02:00 CEST + 1h read 03:00 and landed on 03:00 CET, two real
 * hours on, so the repeated 02:00 lost its tick. Sub-hour ticks skipped the
 * whole second pass, or, starting inside it, stepped back into the first.
 *
 * process.env.TZ is read per call in Node, so each case pins its zone and
 * restores the previous one afterwards.
 */

const prevTZ = process.env.TZ
afterEach(() => {
  if (prevTZ === undefined) delete process.env.TZ
  else process.env.TZ = prevTZ
})

const HOUR = 36e5
const MIN = 6e4

function localTicks(tz, minX, maxX) {
  process.env.TZ = tz
  const chart = createChartWithOptions({
    chart: { type: 'line' },
    series: [{ data: [0, 1] }],
    xaxis: { type: 'datetime', labels: { datetimeUTC: false } },
  })
  const ts = new TimeScale(chart.w, chart)
  const ticks = ts.calculateTimeScaleTicks(minX, maxX)
  return { interval: ts.tickInterval, ticks }
}

const gaps = (ticks) =>
  ticks.slice(1).map((t, i) => t.timestamp - ticks[i].timestamp)

describe('Issue 4398: local hour ticks on a DST change day', () => {
  it('gives the repeated hour its own tick (Amsterdam, 27 Oct 2024)', () => {
    // 22:00Z is 00:00 CEST; clocks went from 03:00 CEST back to 02:00 CET
    const minX = Date.UTC(2024, 9, 26, 22)
    const { interval, ticks } = localTicks(
      'Europe/Amsterdam',
      minX,
      minX + 10 * HOUR,
    )
    expect(interval).toMatchObject({ unit: 'hour', step: 1 })
    expect(ticks.map((t) => t.hour)).toEqual([0, 1, 2, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(gaps(ticks).every((g) => g === HOUR)).toBe(true)
  })

  it('still skips the hour that does not exist (Amsterdam, 31 Mar 2024)', () => {
    // 23:00Z is 00:00 CET; clocks went from 02:00 CET to 03:00 CEST
    const minX = Date.UTC(2024, 2, 30, 23)
    const { interval, ticks } = localTicks(
      'Europe/Amsterdam',
      minX,
      minX + 10 * HOUR,
    )
    expect(interval).toMatchObject({ unit: 'hour', step: 1 })
    expect(ticks.map((t) => t.hour)).toEqual([
      0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ])
    expect(gaps(ticks).every((g) => g === HOUR)).toBe(true)
  })

  it('runs 15-minute ticks through both passes of 01:00 (New York)', () => {
    // 2025-11-02: 01:00-02:00 ran twice, EDT (05:00Z) then EST (06:00Z)
    const { interval, ticks } = localTicks(
      'America/New_York',
      Date.UTC(2025, 10, 2, 4, 50),
      Date.UTC(2025, 10, 2, 7, 10),
    )
    expect(interval).toMatchObject({ unit: 'minute', step: 15 })
    expect(ticks[0].timestamp).toBe(Date.UTC(2025, 10, 2, 5))
    const pass = ['1:0', '1:15', '1:30', '1:45']
    expect(ticks.map((t) => `${t.hour}:${t.minute}`)).toEqual([
      ...pass,
      ...pass,
      '2:0',
    ])
    expect(gaps(ticks).every((g) => g === 15 * MIN)).toBe(true)
  })

  it('moves forward from a start inside the second pass (New York)', () => {
    // 06:10Z is 01:10 EST, the second time round
    const { ticks } = localTicks(
      'America/New_York',
      Date.UTC(2025, 10, 2, 6, 10),
      Date.UTC(2025, 10, 2, 8, 30),
    )
    expect(ticks[0].timestamp).toBe(Date.UTC(2025, 10, 2, 6, 15))
    expect(gaps(ticks).every((g) => g === 15 * MIN)).toBe(true)
  })

  it.each([
    ['fall-back', Date.UTC(2024, 9, 26, 22)],
    ['spring-forward', Date.UTC(2024, 2, 30, 23)],
  ])('keeps 3-hour ticks on multiples of 3 (%s)', (_, minX) => {
    const { interval, ticks } = localTicks(
      'Europe/Amsterdam',
      minX,
      minX + 24 * HOUR,
    )
    expect(interval).toMatchObject({ unit: 'hour', step: 3 })
    expect(ticks.every((t) => t.hour % 3 === 0 && t.minute === 0)).toBe(true)
    expect(gaps(ticks).every((g) => g > 0)).toBe(true)
  })
})
