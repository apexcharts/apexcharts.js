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
