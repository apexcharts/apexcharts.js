import TimeScale from '../modules/TimeScale'

/**
 * DateTime Class to manipulate datetime values.
 *
 * @module DateTime
 **/

class DateTime {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.months31 = [1, 3, 5, 7, 8, 10, 12]
    this.months30 = [2, 4, 6, 9, 11]

    this.daysCntOfYear = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

    this.MMMM = ['\x00', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  }

  isValidDate (date) {
    return !isNaN(Date.parse(date))
  }

  // https://stackoverflow.com/a/11252167/6495043
  treatAsUtc (dateStr) {
    let result = new Date(dateStr)
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset())
    return result
  }

  // http://stackoverflow.com/questions/14638018/current-time-formatting-with-javascript#answer-14638191
  formatDate (date, format, utc = true) {
    let MMMM = ['\x00', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    let MMM = ['\x01', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let dddd = ['\x02', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let ddd = ['\x03', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    function ii (i, len) {
      let s = i + ''
      len = len || 2
      while (s.length < len) s = '0' + s
      return s
    }

    date = this.treatAsUtc(date)

    let y = utc ? date.getUTCFullYear() : date.getFullYear()
    format = format.replace(/(^|[^\\])yyyy+/g, '$1' + y)
    format = format.replace(/(^|[^\\])yy/g, '$1' + y.toString().substr(2, 2))
    format = format.replace(/(^|[^\\])y/g, '$1' + y)

    let M = (utc ? date.getUTCMonth() : date.getMonth()) + 1
    format = format.replace(/(^|[^\\])MMMM+/g, '$1' + MMMM[0])
    format = format.replace(/(^|[^\\])MMM/g, '$1' + MMM[0])
    format = format.replace(/(^|[^\\])MM/g, '$1' + ii(M))
    format = format.replace(/(^|[^\\])M/g, '$1' + M)

    let d = utc ? date.getUTCDate() : date.getDate()
    format = format.replace(/(^|[^\\])dddd+/g, '$1' + dddd[0])
    format = format.replace(/(^|[^\\])ddd/g, '$1' + ddd[0])
    format = format.replace(/(^|[^\\])dd/g, '$1' + ii(d))
    format = format.replace(/(^|[^\\])d/g, '$1' + d)

    let H = utc ? date.getUTCHours() : date.getHours()
    format = format.replace(/(^|[^\\])HH+/g, '$1' + ii(H))
    format = format.replace(/(^|[^\\])H/g, '$1' + H)

    let h = H > 12 ? H - 12 : H === 0 ? 12 : H
    format = format.replace(/(^|[^\\])hh+/g, '$1' + ii(h))
    format = format.replace(/(^|[^\\])h/g, '$1' + h)

    let m = utc ? date.getUTCMinutes() : date.getMinutes()
    format = format.replace(/(^|[^\\])mm+/g, '$1' + ii(m))
    format = format.replace(/(^|[^\\])m/g, '$1' + m)

    let s = utc ? date.getUTCSeconds() : date.getSeconds()
    format = format.replace(/(^|[^\\])ss+/g, '$1' + ii(s))
    format = format.replace(/(^|[^\\])s/g, '$1' + s)

    let f = utc ? date.getUTCMilliseconds() : date.getMilliseconds()
    format = format.replace(/(^|[^\\])fff+/g, '$1' + ii(f, 3))
    f = Math.round(f / 10)
    format = format.replace(/(^|[^\\])ff/g, '$1' + ii(f))
    f = Math.round(f / 10)
    format = format.replace(/(^|[^\\])f/g, '$1' + f)

    let T = H < 12 ? 'AM' : 'PM'
    format = format.replace(/(^|[^\\])TT+/g, '$1' + T)
    format = format.replace(/(^|[^\\])T/g, '$1' + T.charAt(0))

    let t = T.toLowerCase()
    format = format.replace(/(^|[^\\])tt+/g, '$1' + t)
    format = format.replace(/(^|[^\\])t/g, '$1' + t.charAt(0))

    let tz = -date.getTimezoneOffset()
    let K = utc || !tz ? 'Z' : tz > 0 ? '+' : '-'
    if (!utc) {
      tz = Math.abs(tz)
      let tzHrs = Math.floor(tz / 60)
      let tzMin = tz % 60
      K += ii(tzHrs) + ':' + ii(tzMin)
    }
    format = format.replace(/(^|[^\\])K/g, '$1' + K)

    let day = (utc ? date.getUTCDay() : date.getDay()) + 1
    format = format.replace(new RegExp(dddd[0], 'g'), dddd[day])
    format = format.replace(new RegExp(ddd[0], 'g'), ddd[day])

    format = format.replace(new RegExp(MMMM[0], 'g'), MMMM[M])
    format = format.replace(new RegExp(MMM[0], 'g'), MMM[M])

    format = format.replace(/\\(.)/g, '$1')

    return format
  }

  getTimeUnitsfromTimestamp (minX, maxX) {
    let w = this.w

    if (w.config.xaxis.min !== undefined) {
      minX = w.config.xaxis.min
    }
    if (w.config.xaxis.max !== undefined) {
      maxX = w.config.xaxis.max
    }

    let minYear = new Date(minX).getFullYear()
    let maxYear = new Date(maxX).getFullYear()

    let minMonth = new Date(minX).getMonth()
    let maxMonth = new Date(maxX).getMonth()

    let minDate = new Date(minX).getDate()
    let maxDate = new Date(maxX).getDate()

    let minHour = new Date(minX).getHours()
    let maxHour = new Date(maxX).getHours()

    let minMinute = new Date(minX).getMinutes()
    let maxMinute = new Date(maxX).getMinutes()

    return {
      minMinute, maxMinute, minHour, maxHour, minDate, maxDate, minMonth, maxMonth, minYear, maxYear
    }
  }

  isLeapYear (year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)
  }

  calculcateLastDaysOfMonth (month, year, subtract) {
    const days = this.determineDaysOfMonths(month, year)

    // whatever days we get, subtract the number of days asked
    return days - subtract
  }

  determineDaysOfYear (year) {
    let days = 365

    if (this.isLeapYear(year)) {
      days = 366
    }

    return days
  }

  determineRemainingDaysOfYear (year, month, date) {
    let dayOfYear = this.daysCntOfYear[month] + date
    if (month > 1 && this.isLeapYear()) dayOfYear++
    return dayOfYear
  }

  determineDaysOfMonths (month, year) {
    let days = 30

    let ts = new TimeScale(this.ctx)
    month = ts.monthMod(month)

    switch (true) {
      case this.months30.includes(month):
        if (month === 2) {
          if (this.isLeapYear(year)) {
            days = 29
          } else {
            days = 28
          }
        }

        break

      case this.months31.includes(month):
        days = 31
        break

      default:
        days = 31
        break
    }

    return days
  }
}

export default DateTime
