import DateTime from '../../src/utils/DateTime.js'

// Local-time tick boundaries in zones whose offset today differs from 1970's.
// process.env.TZ is read per call in Node, so each case pins its zone and
// restores the previous one afterwards.

const prevTZ = process.env.TZ
afterEach(() => {
  if (prevTZ === undefined) delete process.env.TZ
  else process.env.TZ = prevTZ
})

const locale = { months: [], shortMonths: [], days: [], shortDays: [] }
const dt = (utc = false) =>
  new DateTime({
    config: { xaxis: { labels: { datetimeUTC: utc } } },
    globals: { locale },
  })

describe('local week ticks land on Monday midnight', () => {
  it.each([
    // EDT now, EST on 1970-01-05: the fixed-ms stride put ticks at 01:00
    ['America/New_York', [2024, 6, 10, 12], [2024, 6, 15]],
    // GMT now, BST all of 1970: ticks fell on Sunday 23:00
    ['Europe/London', [2024, 0, 10, 12], [2024, 0, 15]],
    ['UTC', [2024, 0, 10, 12], [2024, 0, 15]],
  ])('%s', (tz, from, monday) => {
    process.env.TZ = tz
    const ts = new Date(...from).getTime()
    const t = new Date(dt().ceilToBoundary(ts, 'week', 1, false))
    expect([t.getDay(), t.getHours(), t.getMinutes()]).toEqual([1, 0, 0])
    expect(t.getTime()).toBe(new Date(...monday).getTime())
  })

  it('keeps the step stride and returns a Monday midnight unchanged', () => {
    process.env.TZ = 'America/New_York'
    const monday = new Date(2024, 6, 15).getTime()
    expect(dt().ceilToBoundary(monday, 'week', 1, false)).toBe(monday)
    const t = new Date(dt().ceilToBoundary(monday + 1, 'week', 2, false))
    expect([t.getDay(), t.getHours()]).toEqual([1, 0])
    expect(t.getTime()).toBeGreaterThan(monday)
    expect(t.getTime() - monday).toBeLessThanOrEqual(15 * 864e5)
  })
})

describe('getDate keeps milliseconds', () => {
  it.each([true, false])('datetimeUTC %s', (utc) => {
    const ts = Date.UTC(2024, 0, 2, 3, 4, 5, 678)
    const d = dt(utc).getDate(ts)
    expect(d.getTime()).toBe(ts)
    if (utc) expect(dt(utc).formatDate(d, 'HH:mm:ss.fff')).toBe('03:04:05.678')
  })
})

describe('local sub-day boundaries in the repeated DST hour', () => {
  // New York fell back at 2025-11-02 02:00 EDT, so 01:00-02:00 ran twice.
  // 06:00Z is 01:00 EST, the second time round.
  const H = Date.UTC(2025, 10, 2, 6)
  it.each([
    ['hour', H + 30 * 6e4, H],
    ['minute', H + 30 * 6e4 + 15e3, H + 30 * 6e4],
    ['second', H + 30 * 6e4 + 15e3 + 500, H + 30 * 6e4 + 15e3],
  ])('%s stays in the second pass, not an hour back', (unit, ts, want) => {
    process.env.TZ = 'America/New_York'
    expect(dt().ceilToBoundary(ts, unit, 1, false)).toBe(want)
  })

  it('leaves the first pass and the spring gap alone', () => {
    process.env.TZ = 'America/New_York'
    // 01:30 EDT, the first pass: floors to 01:00 EDT as before
    expect(dt().ceilToBoundary(H - 30 * 6e4, 'hour', 1, false)).toBe(H - 36e5)
    // 2025-03-09 01:30 EST with a 2h step: 02:00 does not exist, 03:00 EDT
    const t = Date.UTC(2025, 2, 9, 6, 30)
    expect(dt().ceilToBoundary(t, 'hour', 2, false)).toBe(
      Date.UTC(2025, 2, 9, 7),
    )
  })
})
