// @ts-check
import Utils from './Utils'

/**
 * DateTime Class to manipulate datetime values.
 *
 * @module DateTime
 **/

class DateTime {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w

    this.months31 = [1, 3, 5, 7, 8, 10, 12]
    this.months30 = [2, 4, 6, 9, 11]

    this.daysCntOfYear = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  }

  /**
   * @param {any} date
   */
  isValidDate(date) {
    if (typeof date === 'number') {
      return false // don't test for timestamps
    }
    return !isNaN(this.parseDate(date))
  }

  /**
   * @param {any} dateStr
   */
  getTimeStamp(dateStr) {
    if (!Date.parse(dateStr)) {
      return dateStr
    }
    const utc = this.w.config.xaxis.labels.datetimeUTC
    return !utc
      ? new Date(dateStr).getTime()
      : new Date(new Date(dateStr).toISOString().substr(0, 25)).getTime()
  }

  /**
   * @param {any} timestamp
   */
  getDate(timestamp) {
    const utc = this.w.config.xaxis.labels.datetimeUTC

    return utc
      ? new Date(new Date(timestamp).toUTCString())
      : new Date(timestamp)
  }

  /**
   * @param {string} dateStr
   */
  parseDate(dateStr) {
    const parsed = Date.parse(dateStr)
    if (!isNaN(parsed)) {
      return this.getTimeStamp(dateStr)
    }

    let output = Date.parse(dateStr.replace(/-/g, '/').replace(/[a-z]+/gi, ' '))
    output = this.getTimeStamp(output)
    return output
  }

  // This fixes the difference of x-axis labels between chrome/safari
  // Fixes #1726, #1544, #1485, #1255
  /**
   * @param {string} dateStr
   */
  parseDateWithTimezone(dateStr) {
    return Date.parse(dateStr.replace(/-/g, '/').replace(/[a-z]+/gi, ' '))
  }

  // http://stackoverflow.com/questions/14638018/current-time-formatting-with-javascript#answer-14638191
  /**
   * @param {Date} date
   * @param {string} format
   */
  formatDate(date, format) {
    const locale = this.w.globals.locale

    const utc = this.w.config.xaxis.labels.datetimeUTC

    const MMMM = ['\x00', ...locale.months]
    const MMM = ['\x01', ...locale.shortMonths]
    const dddd = ['\x02', ...locale.days]
    const ddd = ['\x03', ...locale.shortDays]

    /**
     * @param {number} i
     * @param {number} len
     */
    function ii(i, len = 2) {
      let s = i + ''
      while (s.length < len) s = '0' + s
      return s
    }

    const y = utc ? date.getUTCFullYear() : date.getFullYear()
    format = format.replace(/(^|[^\\])yyyy+/g, '$1' + y)
    format = format.replace(/(^|[^\\])yy/g, '$1' + y.toString().substr(2, 2))
    format = format.replace(/(^|[^\\])y/g, '$1' + y)

    const M = (utc ? date.getUTCMonth() : date.getMonth()) + 1
    format = format.replace(/(^|[^\\])MMMM+/g, '$1' + MMMM[0])
    format = format.replace(/(^|[^\\])MMM/g, '$1' + MMM[0])
    format = format.replace(/(^|[^\\])MM/g, '$1' + ii(M))
    format = format.replace(/(^|[^\\])M/g, '$1' + M)

    const d = utc ? date.getUTCDate() : date.getDate()
    format = format.replace(/(^|[^\\])dddd+/g, '$1' + dddd[0])
    format = format.replace(/(^|[^\\])ddd/g, '$1' + ddd[0])
    format = format.replace(/(^|[^\\])dd/g, '$1' + ii(d))
    format = format.replace(/(^|[^\\])d/g, '$1' + d)

    const H = utc ? date.getUTCHours() : date.getHours()
    format = format.replace(/(^|[^\\])HH+/g, '$1' + ii(H))
    format = format.replace(/(^|[^\\])H/g, '$1' + H)

    const h = H > 12 ? H - 12 : H === 0 ? 12 : H
    format = format.replace(/(^|[^\\])hh+/g, '$1' + ii(h))
    format = format.replace(/(^|[^\\])h/g, '$1' + h)

    const m = utc ? date.getUTCMinutes() : date.getMinutes()
    format = format.replace(/(^|[^\\])mm+/g, '$1' + ii(m))
    format = format.replace(/(^|[^\\])m/g, '$1' + m)

    const s = utc ? date.getUTCSeconds() : date.getSeconds()
    format = format.replace(/(^|[^\\])ss+/g, '$1' + ii(s))
    format = format.replace(/(^|[^\\])s/g, '$1' + s)

    let f = utc ? date.getUTCMilliseconds() : date.getMilliseconds()
    format = format.replace(/(^|[^\\])fff+/g, '$1' + ii(f, 3))
    f = Math.round(f / 10)
    format = format.replace(/(^|[^\\])ff/g, '$1' + ii(f))
    f = Math.round(f / 10)
    format = format.replace(/(^|[^\\])f/g, '$1' + f)

    const T = H < 12 ? 'AM' : 'PM'
    format = format.replace(/(^|[^\\])TT+/g, '$1' + T)
    format = format.replace(/(^|[^\\])T/g, '$1' + T.charAt(0))

    const t = T.toLowerCase()
    format = format.replace(/(^|[^\\])tt+/g, '$1' + t)
    format = format.replace(/(^|[^\\])t/g, '$1' + t.charAt(0))

    let tz = -date.getTimezoneOffset()
    let K = utc || !tz ? 'Z' : tz > 0 ? '+' : '-'

    if (!utc) {
      tz = Math.abs(tz)
      const tzHrs = Math.floor(tz / 60)
      const tzMin = tz % 60
      K += ii(tzHrs) + ':' + ii(tzMin)
    }

    format = format.replace(/(^|[^\\])K/g, '$1' + K)

    const day = (utc ? date.getUTCDay() : date.getDay()) + 1
    format = format.replace(new RegExp(dddd[0], 'g'), dddd[day])
    format = format.replace(new RegExp(ddd[0], 'g'), ddd[day])

    format = format.replace(new RegExp(MMMM[0], 'g'), MMMM[M])
    format = format.replace(new RegExp(MMM[0], 'g'), MMM[M])

    format = format.replace(/\\(.)/g, '$1')

    return format
  }

  /**
   * @param {number} minX
   * @param {number} maxX
   */
  getTimeUnitsfromTimestamp(minX, maxX) {
    const w = this.w

    if (w.config.xaxis.min !== undefined) {
      minX = w.config.xaxis.min
    }
    if (w.config.xaxis.max !== undefined) {
      maxX = w.config.xaxis.max
    }

    const tsMin = this.getDate(minX)
    const tsMax = this.getDate(maxX)

    const minD = this.formatDate(tsMin, 'yyyy MM dd HH mm ss fff').split(' ')
    const maxD = this.formatDate(tsMax, 'yyyy MM dd HH mm ss fff').split(' ')

    return {
      minMillisecond: parseInt(minD[6], 10),
      maxMillisecond: parseInt(maxD[6], 10),
      minSecond: parseInt(minD[5], 10),
      maxSecond: parseInt(maxD[5], 10),
      minMinute: parseInt(minD[4], 10),
      maxMinute: parseInt(maxD[4], 10),
      minHour: parseInt(minD[3], 10),
      maxHour: parseInt(maxD[3], 10),
      minDate: parseInt(minD[2], 10),
      maxDate: parseInt(maxD[2], 10),
      minMonth: parseInt(minD[1], 10) - 1,
      maxMonth: parseInt(maxD[1], 10) - 1,
      minYear: parseInt(minD[0], 10),
      maxYear: parseInt(maxD[0], 10),
    }
  }

  /**
   * @param {number} year
   */
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  /**
   * @param {number} month
   * @param {number} year
   * @param {number} subtract
   */
  calculcateLastDaysOfMonth(month, year, subtract) {
    const days = this.determineDaysOfMonths(month, year)

    // whatever days we get, subtract the number of days asked
    return days - subtract
  }

  /**
   * @param {number} year
   */
  determineDaysOfYear(year) {
    let days = 365

    if (this.isLeapYear(year)) {
      days = 366
    }

    return days
  }

  /**
   * @param {number} year
   * @param {number} month
   * @param {number} date
   */
  determineRemainingDaysOfYear(year, month, date) {
    let dayOfYear = this.daysCntOfYear[month] + date
    if (month > 1 && this.isLeapYear(year)) dayOfYear++
    return dayOfYear
  }

  /**
   * @param {number} month
   * @param {number} year
   */
  determineDaysOfMonths(month, year) {
    let days = 30

    month = Utils.monthMod(month)

    switch (true) {
      case this.months30.indexOf(month) > -1:
        if (month === 2) {
          if (this.isLeapYear(year)) {
            days = 29
          } else {
            days = 28
          }
        }

        break

      case this.months31.indexOf(month) > -1:
        days = 31
        break

      default:
        days = 31
        break
    }

    return days
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Pure date helpers used by the v6 single-interval TimeScale.
  // Native Date setters/getters do all rollover work (leap years, month
  // length, year crossings), eliminating the manual rollover code that was
  // the source of the historical TimeScale boundary bugs.
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Extract calendar fields from a timestamp. Month is 0-indexed (matches
   * Date.getMonth / getUTCMonth).
   *
   * @param {number} timestamp
   * @param {boolean} isUTC
   * @returns {{ year: number, month: number, date: number, hour: number, minute: number, second: number, ms: number, weekday: number }}
   */
  getDateFields(timestamp, isUTC) {
    const d = new Date(timestamp)
    return isUTC
      ? {
          year: d.getUTCFullYear(),
          month: d.getUTCMonth(),
          date: d.getUTCDate(),
          hour: d.getUTCHours(),
          minute: d.getUTCMinutes(),
          second: d.getUTCSeconds(),
          ms: d.getUTCMilliseconds(),
          weekday: d.getUTCDay(),
        }
      : {
          year: d.getFullYear(),
          month: d.getMonth(),
          date: d.getDate(),
          hour: d.getHours(),
          minute: d.getMinutes(),
          second: d.getSeconds(),
          ms: d.getMilliseconds(),
          weekday: d.getDay(),
        }
  }

  /**
   * Advance a timestamp by `count` units. Native setters handle cross-month,
   * cross-year, leap-year, and DST rollover correctly.
   *
   * @param {number} timestamp
   * @param {'year'|'month'|'week'|'day'|'hour'|'minute'|'second'} unit
   * @param {number} count  may be negative
   * @param {boolean} isUTC
   * @returns {number}
   */
  addInterval(timestamp, unit, count, isUTC) {
    const d = new Date(timestamp)
    if (isUTC) {
      switch (unit) {
        case 'year':
          d.setUTCFullYear(d.getUTCFullYear() + count)
          break
        case 'month':
          d.setUTCMonth(d.getUTCMonth() + count)
          break
        case 'week':
          d.setUTCDate(d.getUTCDate() + count * 7)
          break
        case 'day':
          d.setUTCDate(d.getUTCDate() + count)
          break
        case 'hour':
          d.setUTCHours(d.getUTCHours() + count)
          break
        case 'minute':
          d.setUTCMinutes(d.getUTCMinutes() + count)
          break
        case 'second':
          d.setUTCSeconds(d.getUTCSeconds() + count)
          break
      }
    } else {
      switch (unit) {
        case 'year':
          d.setFullYear(d.getFullYear() + count)
          break
        case 'month':
          d.setMonth(d.getMonth() + count)
          break
        case 'week':
          d.setDate(d.getDate() + count * 7)
          break
        case 'day':
          d.setDate(d.getDate() + count)
          break
        case 'hour':
          d.setHours(d.getHours() + count)
          break
        case 'minute':
          d.setMinutes(d.getMinutes() + count)
          break
        case 'second':
          d.setSeconds(d.getSeconds() + count)
          break
      }
    }
    return d.getTime()
  }

  /**
   * Snap a timestamp UP to the next boundary aligned with `step` units of
   * `unit`. Returns the input unchanged if already on a boundary. Alignment
   * rules per unit:
   *   - second: 0/step/2*step/... seconds within a minute (step must divide 60)
   *   - minute: 0/step/2*step/... minutes within an hour (step must divide 60)
   *   - hour:   0/step/... hours within a day (step must divide 24)
   *   - day:    every day (step always 1)
   *   - week:   next Monday on a `step`-week stride from a fixed epoch Monday
   *   - month:  Jan/Apr/Jul/Oct for step=3, Jan/Jul for step=6 (step must divide 12)
   *   - year:   year % step === 0
   *
   * @param {number} timestamp
   * @param {'year'|'month'|'week'|'day'|'hour'|'minute'|'second'} unit
   * @param {number} step
   * @param {boolean} isUTC
   * @returns {number}
   */
  ceilToBoundary(timestamp, unit, step, isUTC) {
    const d = new Date(timestamp)
    if (isUTC) {
      switch (unit) {
        case 'second': {
          const s = d.getUTCSeconds()
          const aligned = Math.ceil(s / step) * step
          if (
            aligned === s &&
            d.getUTCMilliseconds() === 0
          )
            return timestamp
          d.setUTCMilliseconds(0)
          d.setUTCSeconds(aligned)
          return d.getTime()
        }
        case 'minute': {
          const m = d.getUTCMinutes()
          const aligned = Math.ceil(m / step) * step
          if (
            aligned === m &&
            d.getUTCSeconds() === 0 &&
            d.getUTCMilliseconds() === 0
          )
            return timestamp
          d.setUTCMilliseconds(0)
          d.setUTCSeconds(0)
          d.setUTCMinutes(aligned)
          return d.getTime()
        }
        case 'hour': {
          const h = d.getUTCHours()
          const aligned = Math.ceil(h / step) * step
          if (
            aligned === h &&
            d.getUTCMinutes() === 0 &&
            d.getUTCSeconds() === 0 &&
            d.getUTCMilliseconds() === 0
          )
            return timestamp
          d.setUTCMilliseconds(0)
          d.setUTCSeconds(0)
          d.setUTCMinutes(0)
          d.setUTCHours(aligned)
          return d.getTime()
        }
        case 'day': {
          if (
            d.getUTCHours() === 0 &&
            d.getUTCMinutes() === 0 &&
            d.getUTCSeconds() === 0 &&
            d.getUTCMilliseconds() === 0
          )
            return timestamp
          d.setUTCMilliseconds(0)
          d.setUTCSeconds(0)
          d.setUTCMinutes(0)
          d.setUTCHours(0)
          d.setUTCDate(d.getUTCDate() + 1)
          return d.getTime()
        }
        case 'week': {
          // Snap to next Monday on a `step`-week stride.
          // Reference: 1970-01-05 was a Monday.
          const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
          const REF_MONDAY_UTC = Date.UTC(1970, 0, 5)
          d.setUTCMilliseconds(0)
          d.setUTCSeconds(0)
          d.setUTCMinutes(0)
          d.setUTCHours(0)
          // Snap to start of current day, then walk to next aligned Monday
          const startOfDay = d.getTime()
          const weeksSinceRef = Math.ceil(
            (startOfDay - REF_MONDAY_UTC) / MS_PER_WEEK,
          )
          const alignedWeeks = Math.ceil(weeksSinceRef / step) * step
          const aligned = REF_MONDAY_UTC + alignedWeeks * MS_PER_WEEK
          if (aligned >= timestamp) return aligned
          return aligned + step * MS_PER_WEEK
        }
        case 'month': {
          const m = d.getUTCMonth()
          const aligned = Math.ceil(m / step) * step
          if (
            aligned === m &&
            d.getUTCDate() === 1 &&
            d.getUTCHours() === 0 &&
            d.getUTCMinutes() === 0 &&
            d.getUTCSeconds() === 0 &&
            d.getUTCMilliseconds() === 0
          )
            return timestamp
          d.setUTCMilliseconds(0)
          d.setUTCSeconds(0)
          d.setUTCMinutes(0)
          d.setUTCHours(0)
          d.setUTCDate(1)
          d.setUTCMonth(aligned)
          return d.getTime()
        }
        case 'year': {
          const y = d.getUTCFullYear()
          const aligned = Math.ceil(y / step) * step
          if (
            aligned === y &&
            d.getUTCMonth() === 0 &&
            d.getUTCDate() === 1 &&
            d.getUTCHours() === 0 &&
            d.getUTCMinutes() === 0 &&
            d.getUTCSeconds() === 0 &&
            d.getUTCMilliseconds() === 0
          )
            return timestamp
          // Build first instant of `aligned`-year (UTC). Date.UTC handles edge.
          return Date.UTC(aligned, 0, 1)
        }
      }
    } else {
      // Local-time variants — same pattern, local getters/setters.
      switch (unit) {
        case 'second': {
          const s = d.getSeconds()
          const aligned = Math.ceil(s / step) * step
          if (aligned === s && d.getMilliseconds() === 0) return timestamp
          d.setMilliseconds(0)
          d.setSeconds(aligned)
          return d.getTime()
        }
        case 'minute': {
          const m = d.getMinutes()
          const aligned = Math.ceil(m / step) * step
          if (
            aligned === m &&
            d.getSeconds() === 0 &&
            d.getMilliseconds() === 0
          )
            return timestamp
          d.setMilliseconds(0)
          d.setSeconds(0)
          d.setMinutes(aligned)
          return d.getTime()
        }
        case 'hour': {
          const h = d.getHours()
          const aligned = Math.ceil(h / step) * step
          if (
            aligned === h &&
            d.getMinutes() === 0 &&
            d.getSeconds() === 0 &&
            d.getMilliseconds() === 0
          )
            return timestamp
          d.setMilliseconds(0)
          d.setSeconds(0)
          d.setMinutes(0)
          d.setHours(aligned)
          return d.getTime()
        }
        case 'day': {
          if (
            d.getHours() === 0 &&
            d.getMinutes() === 0 &&
            d.getSeconds() === 0 &&
            d.getMilliseconds() === 0
          )
            return timestamp
          d.setMilliseconds(0)
          d.setSeconds(0)
          d.setMinutes(0)
          d.setHours(0)
          d.setDate(d.getDate() + 1)
          return d.getTime()
        }
        case 'week': {
          const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
          const REF_MONDAY_LOCAL = new Date(1970, 0, 5).getTime()
          d.setMilliseconds(0)
          d.setSeconds(0)
          d.setMinutes(0)
          d.setHours(0)
          const startOfDay = d.getTime()
          const weeksSinceRef = Math.ceil(
            (startOfDay - REF_MONDAY_LOCAL) / MS_PER_WEEK,
          )
          const alignedWeeks = Math.ceil(weeksSinceRef / step) * step
          const aligned = REF_MONDAY_LOCAL + alignedWeeks * MS_PER_WEEK
          if (aligned >= timestamp) return aligned
          return aligned + step * MS_PER_WEEK
        }
        case 'month': {
          const m = d.getMonth()
          const aligned = Math.ceil(m / step) * step
          if (
            aligned === m &&
            d.getDate() === 1 &&
            d.getHours() === 0 &&
            d.getMinutes() === 0 &&
            d.getSeconds() === 0 &&
            d.getMilliseconds() === 0
          )
            return timestamp
          d.setMilliseconds(0)
          d.setSeconds(0)
          d.setMinutes(0)
          d.setHours(0)
          d.setDate(1)
          d.setMonth(aligned)
          return d.getTime()
        }
        case 'year': {
          const y = d.getFullYear()
          const aligned = Math.ceil(y / step) * step
          if (
            aligned === y &&
            d.getMonth() === 0 &&
            d.getDate() === 1 &&
            d.getHours() === 0 &&
            d.getMinutes() === 0 &&
            d.getSeconds() === 0 &&
            d.getMilliseconds() === 0
          )
            return timestamp
          return new Date(aligned, 0, 1).getTime()
        }
      }
    }
    return timestamp
  }

  /**
   * Test whether a timestamp falls exactly on a unit boundary (start of year,
   * start of month, start of day, etc.). Used by the multi-resolution
   * formatter to upgrade a tick's display unit to a coarser scale.
   *
   * @param {number} timestamp
   * @param {'year'|'month'|'day'|'hour'|'minute'|'second'} unit
   * @param {boolean} isUTC
   * @returns {boolean}
   */
  isAtBoundary(timestamp, unit, isUTC) {
    const f = this.getDateFields(timestamp, isUTC)
    switch (unit) {
      case 'year':
        return (
          f.month === 0 &&
          f.date === 1 &&
          f.hour === 0 &&
          f.minute === 0 &&
          f.second === 0 &&
          f.ms === 0
        )
      case 'month':
        return (
          f.date === 1 &&
          f.hour === 0 &&
          f.minute === 0 &&
          f.second === 0 &&
          f.ms === 0
        )
      case 'day':
        return (
          f.hour === 0 && f.minute === 0 && f.second === 0 && f.ms === 0
        )
      case 'hour':
        return f.minute === 0 && f.second === 0 && f.ms === 0
      case 'minute':
        return f.second === 0 && f.ms === 0
      case 'second':
        return f.ms === 0
    }
    return false
  }
}

export default DateTime
