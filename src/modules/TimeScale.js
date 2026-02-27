import DateTime from '../utils/DateTime'
import Dimensions from './dimensions/Dimensions'
import Graphics from './Graphics'
import Utils from '../utils/Utils'

const MINUTES_IN_DAY = 24 * 60
const SECONDS_IN_DAY = MINUTES_IN_DAY * 60
const MIN_ZOOM_DAYS = 10 / SECONDS_IN_DAY

/**
 * ApexCharts TimeScale Class for generating time ticks for x-axis.
 *
 * @module TimeScale
 **/

class TimeScale {
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: new Dimensions(this.ctx)
    this.timeScaleArray = []
    this.utc = this.w.config.xaxis.labels.datetimeUTC
  }

  calculateTimeScaleTicks(minX, maxX) {
    const w = this.w

    // null check when no series to show
    if (w.globals.allSeriesCollapsed) {
      w.labelData.labels = []
      w.labelData.timescaleLabels = []
      return []
    }

    const dt = new DateTime(this.w)

    const daysDiff = (maxX - minX) / (1000 * SECONDS_IN_DAY)
    this.determineInterval(daysDiff)

    w.interact.disableZoomIn = false
    w.interact.disableZoomOut = false

    if (daysDiff < MIN_ZOOM_DAYS) {
      w.interact.disableZoomIn = true
    } else if (daysDiff > 50000) {
      w.interact.disableZoomOut = true
    }

    const timeIntervals = dt.getTimeUnitsfromTimestamp(minX, maxX, this.utc)

    const daysWidthOnXAxis = w.layout.gridWidth / daysDiff
    const hoursWidthOnXAxis = daysWidthOnXAxis / 24
    const minutesWidthOnXAxis = hoursWidthOnXAxis / 60
    const secondsWidthOnXAxis = minutesWidthOnXAxis / 60

    const numberOfHours = Math.floor(daysDiff * 24)
    const numberOfMinutes = Math.floor(daysDiff * MINUTES_IN_DAY)
    const numberOfSeconds = Math.floor(daysDiff * SECONDS_IN_DAY)
    const numberOfDays = Math.floor(daysDiff)
    const numberOfMonths = Math.floor(daysDiff / 30)
    const numberOfYears = Math.floor(daysDiff / 365)

    const firstVal = {
      minMillisecond: timeIntervals.minMillisecond,
      minSecond: timeIntervals.minSecond,
      minMinute: timeIntervals.minMinute,
      minHour: timeIntervals.minHour,
      minDate: timeIntervals.minDate,
      minMonth: timeIntervals.minMonth,
      minYear: timeIntervals.minYear,
    }

    const currentMillisecond = firstVal.minMillisecond
    const currentSecond = firstVal.minSecond
    const currentMinute = firstVal.minMinute
    const currentHour = firstVal.minHour
    const currentMonthDate = firstVal.minDate
    const currentDate = firstVal.minDate
    const currentMonth = firstVal.minMonth
    const currentYear = firstVal.minYear

    const params = {
      firstVal,
      currentMillisecond,
      currentSecond,
      currentMinute,
      currentHour,
      currentMonthDate,
      currentDate,
      currentMonth,
      currentYear,
      daysWidthOnXAxis,
      hoursWidthOnXAxis,
      minutesWidthOnXAxis,
      secondsWidthOnXAxis,
      numberOfSeconds,
      numberOfMinutes,
      numberOfHours,
      numberOfDays,
      numberOfMonths,
      numberOfYears,
    }

    switch (this.tickInterval) {
      case 'years': {
        this.generateYearScale(params)
        break
      }
      case 'months':
      case 'half_year': {
        this.generateMonthScale(params)
        break
      }
      case 'months_days':
      case 'months_fortnight':
      case 'days':
      case 'week_days': {
        this.generateDayScale(params)
        break
      }
      case 'hours': {
        this.generateHourScale(params)
        break
      }
      case 'minutes_fives':
      case 'minutes':
        this.generateMinuteScale(params)
        break
      case 'seconds_tens':
      case 'seconds_fives':
      case 'seconds':
        this.generateSecondScale(params)
        break
    }

    // first, we will adjust the month values index
    // as in the upper function, it is starting from 0
    // we will start them from 1
    const adjustedMonthInTimeScaleArray = this.timeScaleArray.map((ts) => {
      const defaultReturn = {
        position: ts.position,
        unit: ts.unit,
        year: ts.year,
        day: ts.day ? ts.day : 1,
        hour: ts.hour ? ts.hour : 0,
        month: ts.month + 1,
      }
      if (ts.unit === 'month') {
        return {
          ...defaultReturn,
          day: 1,
          value: ts.value + 1,
        }
      } else if (ts.unit === 'day' || ts.unit === 'hour') {
        return {
          ...defaultReturn,
          value: ts.value,
        }
      } else if (ts.unit === 'minute') {
        return {
          ...defaultReturn,
          value: ts.value,
          minute: ts.value,
        }
      } else if (ts.unit === 'second') {
        return {
          ...defaultReturn,
          value: ts.value,
          minute: ts.minute,
          second: ts.second,
        }
      }

      return ts
    })

    const filteredTimeScale = adjustedMonthInTimeScaleArray.filter((ts) => {
      let modulo = 1
      let ticks = Math.ceil(w.layout.gridWidth / 120)
      const value = ts.value
      if (w.config.xaxis.tickAmount !== undefined) {
        ticks = w.config.xaxis.tickAmount
      }
      if (adjustedMonthInTimeScaleArray.length > ticks) {
        modulo = Math.floor(adjustedMonthInTimeScaleArray.length / ticks)
      }

      let shouldNotSkipUnit = false // there is a big change in unit i.e days to months
      let shouldNotPrint = false // should skip these values

      switch (this.tickInterval) {
        case 'years':
          // make years label denser
          if (ts.unit === 'year') {
            shouldNotSkipUnit = true
          }
          break
        case 'half_year':
          modulo = 7
          if (ts.unit === 'year') {
            shouldNotSkipUnit = true
          }
          break
        case 'months':
          modulo = 1
          if (ts.unit === 'year') {
            shouldNotSkipUnit = true
          }
          break
        case 'months_fortnight':
          modulo = 15
          if (ts.unit === 'year' || ts.unit === 'month') {
            shouldNotSkipUnit = true
          }
          if (value === 30) {
            shouldNotPrint = true
          }
          break
        case 'months_days':
          modulo = 10
          if (ts.unit === 'month') {
            shouldNotSkipUnit = true
          }
          if (value === 30) {
            shouldNotPrint = true
          }
          break
        case 'week_days':
          modulo = 8
          if (ts.unit === 'month') {
            shouldNotSkipUnit = true
          }
          break
        case 'days':
          modulo = 1
          if (ts.unit === 'month') {
            shouldNotSkipUnit = true
          }
          break
        case 'hours':
          if (ts.unit === 'day') {
            shouldNotSkipUnit = true
          }
          break
        case 'minutes_fives':
          if (value % 5 !== 0) {
            shouldNotPrint = true
          }
          break
        case 'seconds_tens':
          if (value % 10 !== 0) {
            shouldNotPrint = true
          }
          break
        case 'seconds_fives':
          if (value % 5 !== 0) {
            shouldNotPrint = true
          }
          break
      }

      if (
        this.tickInterval === 'hours' ||
        this.tickInterval === 'minutes_fives' ||
        this.tickInterval === 'seconds_tens' ||
        this.tickInterval === 'seconds_fives'
      ) {
        if (!shouldNotPrint) {
          return true
        }
      } else {
        if ((value % modulo === 0 || shouldNotSkipUnit) && !shouldNotPrint) {
          return true
        }
      }
    })

    return filteredTimeScale
  }

  recalcDimensionsBasedOnFormat(filteredTimeScale) {
    const w = this.w
    const reformattedTimescaleArray = this.formatDates(filteredTimeScale)

    const removedOverlappingTS = this.removeOverlappingTS(
      reformattedTimescaleArray
    )

    w.labelData.timescaleLabels = removedOverlappingTS.slice()

    // at this stage, we need to re-calculate coords of the grid as timeline labels may have altered the xaxis labels coords
    // The reason we can't do this prior to this stage is because timeline labels depends on gridWidth, and as the ticks are calculated based on available gridWidth, there can be unknown number of ticks generated for different minX and maxX
    // Dependency on Dimensions(), need to refactor correctly
    // TODO - find an alternate way to avoid calling this Heavy method twice
    const dimensions = new Dimensions(this.w, this.ctx)
    // Phase 1: return value captured; writer stub is a no-op.
    const layoutState = dimensions.plotCoords()
    this.ctx._writeLayoutCoords(layoutState.layout)
  }

  determineInterval(daysDiff) {
    const yearsDiff = daysDiff / 365
    const hoursDiff = daysDiff * 24
    const minutesDiff = hoursDiff * 60
    const secondsDiff = minutesDiff * 60
    switch (true) {
      case yearsDiff > 5:
        this.tickInterval = 'years'
        break
      case daysDiff > 800:
        this.tickInterval = 'half_year'
        break
      case daysDiff > 180:
        this.tickInterval = 'months'
        break
      case daysDiff > 90:
        this.tickInterval = 'months_fortnight'
        break
      case daysDiff > 60:
        this.tickInterval = 'months_days'
        break
      case daysDiff > 30:
        this.tickInterval = 'week_days'
        break
      case daysDiff > 2:
        this.tickInterval = 'days'
        break
      case hoursDiff > 2.4:
        this.tickInterval = 'hours'
        break
      case minutesDiff > 15:
        this.tickInterval = 'minutes_fives'
        break
      case minutesDiff > 5:
        this.tickInterval = 'minutes'
        break
      case minutesDiff > 1:
        this.tickInterval = 'seconds_tens'
        break
      case secondsDiff > 20:
        this.tickInterval = 'seconds_fives'
        break
      default:
        this.tickInterval = 'seconds'
        break
    }
  }

  generateYearScale({
    firstVal,
    currentMonth,
    currentYear,
    daysWidthOnXAxis,
    numberOfYears,
  }) {
    let firstTickValue = firstVal.minYear
    let firstTickPosition = 0
    const dt = new DateTime(this.w)

    const unit = 'year'

    if (firstVal.minDate > 1 || firstVal.minMonth > 0) {
      const remainingDays = dt.determineRemainingDaysOfYear(
        firstVal.minYear,
        firstVal.minMonth,
        firstVal.minDate
      )

      // remainingDaysofFirstMonth is used to reacht the 2nd tick position
      const remainingDaysOfFirstYear =
        dt.determineDaysOfYear(firstVal.minYear) - remainingDays + 1

      // calculate the first tick position
      firstTickPosition = remainingDaysOfFirstYear * daysWidthOnXAxis
      firstTickValue = firstVal.minYear + 1
      // push the first tick in the array
      this.timeScaleArray.push({
        position: firstTickPosition,
        value: firstTickValue,
        unit,
        year: firstTickValue,
        month: Utils.monthMod(currentMonth + 1),
      })
    } else if (firstVal.minDate === 1 && firstVal.minMonth === 0) {
      // push the first tick in the array
      this.timeScaleArray.push({
        position: firstTickPosition,
        value: firstTickValue,
        unit,
        year: currentYear,
        month: Utils.monthMod(currentMonth + 1),
      })
    }

    let year = firstTickValue
    let pos = firstTickPosition

    // keep drawing rest of the ticks
    for (let i = 0; i < numberOfYears; i++) {
      year++
      pos = dt.determineDaysOfYear(year - 1) * daysWidthOnXAxis + pos
      this.timeScaleArray.push({
        position: pos,
        value: year,
        unit,
        year,
        month: 1,
      })
    }
  }

  generateMonthScale({
    firstVal,
    currentMonthDate,
    currentMonth,
    currentYear,
    daysWidthOnXAxis,
    numberOfMonths,
  }) {
    let firstTickValue = currentMonth
    let firstTickPosition = 0
    const dt = new DateTime(this.w)
    let unit = 'month'
    let yrCounter = 0

    if (firstVal.minDate > 1) {
      // remainingDaysofFirstMonth is used to reacht the 2nd tick position
      const remainingDaysOfFirstMonth =
        dt.determineDaysOfMonths(currentMonth + 1, firstVal.minYear) -
        currentMonthDate +
        1

      // calculate the first tick position
      firstTickPosition = remainingDaysOfFirstMonth * daysWidthOnXAxis
      firstTickValue = Utils.monthMod(currentMonth + 1)

      let year = currentYear + yrCounter
      let month = Utils.monthMod(firstTickValue)
      let value = firstTickValue
      // it's Jan, so update the year
      if (firstTickValue === 0) {
        unit = 'year'
        value = year
        month = 1
        yrCounter += 1
        year = year + yrCounter
      }

      // push the first tick in the array
      this.timeScaleArray.push({
        position: firstTickPosition,
        value,
        unit,
        year,
        month,
      })
    } else {
      // push the first tick in the array
      this.timeScaleArray.push({
        position: firstTickPosition,
        value: firstTickValue,
        unit,
        year: currentYear,
        month: Utils.monthMod(currentMonth),
      })
    }

    let month = firstTickValue + 1
    let pos = firstTickPosition

    // keep drawing rest of the ticks
    for (let i = 0, j = 1; i < numberOfMonths; i++, j++) {
      month = Utils.monthMod(month)

      if (month === 0) {
        unit = 'year'
        yrCounter += 1
      } else {
        unit = 'month'
      }
      const year = this._getYear(currentYear, month, yrCounter)

      pos = dt.determineDaysOfMonths(month, year) * daysWidthOnXAxis + pos
      const monthVal = month === 0 ? year : month
      this.timeScaleArray.push({
        position: pos,
        value: monthVal,
        unit,
        year,
        month: month === 0 ? 1 : month,
      })
      month++
    }
  }

  generateDayScale({
    firstVal,
    currentMonth,
    currentYear,
    hoursWidthOnXAxis,
    numberOfDays,
  }) {
    const dt = new DateTime(this.w)
    let unit = 'day'
    let firstTickValue = firstVal.minDate + 1
    let date = firstTickValue

    const changeMonth = (dateVal, month, year) => {
      const monthdays = dt.determineDaysOfMonths(month + 1, year)

      if (dateVal > monthdays) {
        month = month + 1
        date = 1
        unit = 'month'
        val = month
        return month
      }

      return month
    }

    const remainingHours = 24 - firstVal.minHour
    const yrCounter = 0

    // calculate the first tick position
    let firstTickPosition = remainingHours * hoursWidthOnXAxis

    let val = firstTickValue
    let month = changeMonth(date, currentMonth, currentYear)

    if (firstVal.minHour === 0 && firstVal.minDate === 1) {
      // the first value is the first day of month
      firstTickPosition = 0
      val = Utils.monthMod(firstVal.minMonth)
      unit = 'month'
      date = firstVal.minDate
      // numberOfDays++
      // removed the above line to fix https://github.com/apexcharts/apexcharts.js/issues/305#issuecomment-1019520513
    } else if (
      firstVal.minDate !== 1 &&
      firstVal.minHour === 0 &&
      firstVal.minMinute === 0
    ) {
      // fixes apexcharts/apexcharts.js/issues/1730
      firstTickPosition = 0
      firstTickValue = firstVal.minDate
      date = firstTickValue
      val = firstTickValue
      // in case it's the last date of month, we need to check it
      month = changeMonth(date, currentMonth, currentYear)

      if (val !== 1) {
        unit = 'day'
      }
    }

    // push the first tick in the array
    this.timeScaleArray.push({
      position: firstTickPosition,
      value: val,
      unit,
      year: this._getYear(currentYear, month, yrCounter),
      month: Utils.monthMod(month),
      day: date,
    })

    let pos = firstTickPosition
    // keep drawing rest of the ticks
    for (let i = 0; i < numberOfDays; i++) {
      date += 1
      unit = 'day'
      month = changeMonth(
        date,
        month,
        this._getYear(currentYear, month, yrCounter)
      )

      const year = this._getYear(currentYear, month, yrCounter)

      pos = 24 * hoursWidthOnXAxis + pos
      const value = date === 1 ? Utils.monthMod(month) : date
      this.timeScaleArray.push({
        position: pos,
        value,
        unit,
        year,
        month: Utils.monthMod(month),
        day: value,
      })
    }
  }

  generateHourScale({
    firstVal,
    currentDate,
    currentMonth,
    currentYear,
    minutesWidthOnXAxis,
    numberOfHours,
  }) {
    const dt = new DateTime(this.w)

    const yrCounter = 0
    let unit = 'hour'

    const changeDate = (dateVal, month) => {
      const monthdays = dt.determineDaysOfMonths(month + 1, currentYear)
      if (dateVal > monthdays) {
        date = 1
        month = month + 1
      }
      return { month, date }
    }

    const changeMonth = (dateVal, month) => {
      const monthdays = dt.determineDaysOfMonths(month + 1, currentYear)
      if (dateVal > monthdays) {
        month = month + 1
        return month
      }

      return month
    }

    // factor in minSeconds as well
    const remainingMins = 60 - (firstVal.minMinute + firstVal.minSecond / 60.0)

    let firstTickPosition = remainingMins * minutesWidthOnXAxis
    let firstTickValue = firstVal.minHour + 1
    let hour = firstTickValue

    if (remainingMins === 60) {
      firstTickPosition = 0
      firstTickValue = firstVal.minHour
      hour = firstTickValue
    }

    let date = currentDate

    // we need to apply date switching logic here as well, to avoid duplicated labels
    if (hour >= 24) {
      hour = 0
      date += 1
      unit = 'day'
      // Unit changed to day , Value should align unit
      firstTickValue = date
    }

    const checkNextMonth = changeDate(date, currentMonth)

    let month = checkNextMonth.month
    month = changeMonth(date, month)

    // Check if date is greater than 31 and change month if it is
    if (firstTickValue > 31) {
      date = 1
      firstTickValue = date
    }

    // push the first tick in the array
    this.timeScaleArray.push({
      position: firstTickPosition,
      value: firstTickValue,
      unit,
      day: date,
      hour,
      year: currentYear,
      month: Utils.monthMod(month),
    })

    hour++

    let pos = firstTickPosition
    // keep drawing rest of the ticks
    for (let i = 0; i < numberOfHours; i++) {
      unit = 'hour'

      if (hour >= 24) {
        hour = 0
        date += 1
        unit = 'day'

        const checkNextMonth = changeDate(date, month)

        month = checkNextMonth.month
        month = changeMonth(date, month)
      }

      const year = this._getYear(currentYear, month, yrCounter)
      pos = 60 * minutesWidthOnXAxis + pos
      const val = hour === 0 ? date : hour
      this.timeScaleArray.push({
        position: pos,
        value: val,
        unit,
        hour,
        day: date,
        year,
        month: Utils.monthMod(month),
      })

      hour++
    }
  }

  generateMinuteScale({
    currentMillisecond,
    currentSecond,
    currentMinute,
    currentHour,
    currentDate,
    currentMonth,
    currentYear,
    minutesWidthOnXAxis,
    secondsWidthOnXAxis,
    numberOfMinutes,
  }) {
    const yrCounter = 0
    const unit = 'minute'

    const remainingSecs = 60 - currentSecond
    const firstTickPosition =
      (remainingSecs - currentMillisecond / 1000) * secondsWidthOnXAxis
    let minute = currentMinute + 1

    const date = currentDate
    const month = currentMonth
    const year = currentYear
    let hour = currentHour

    let pos = firstTickPosition
    for (let i = 0; i < numberOfMinutes; i++) {
      if (minute >= 60) {
        minute = 0
        hour += 1
        if (hour === 24) {
          hour = 0
        }
      }

      this.timeScaleArray.push({
        position: pos,
        value: minute,
        unit,
        hour,
        minute,
        day: date,
        year: this._getYear(year, month, yrCounter),
        month: Utils.monthMod(month),
      })

      pos += minutesWidthOnXAxis
      minute++
    }
  }

  generateSecondScale({
    currentMillisecond,
    currentSecond,
    currentMinute,
    currentHour,
    currentDate,
    currentMonth,
    currentYear,
    secondsWidthOnXAxis,
    numberOfSeconds,
  }) {
    const yrCounter = 0
    const unit = 'second'

    const remainingMillisecs = 1000 - currentMillisecond
    const firstTickPosition = (remainingMillisecs / 1000) * secondsWidthOnXAxis

    let second = currentSecond + 1
    let minute = currentMinute
    const date = currentDate
    const month = currentMonth
    const year = currentYear
    let hour = currentHour

    let pos = firstTickPosition
    for (let i = 0; i < numberOfSeconds; i++) {
      if (second >= 60) {
        minute++
        second = 0
        if (minute >= 60) {
          hour++
          minute = 0
          if (hour === 24) {
            hour = 0
          }
        }
      }

      this.timeScaleArray.push({
        position: pos,
        value: second,
        unit,
        hour,
        minute,
        second,
        day: date,
        year: this._getYear(year, month, yrCounter),
        month: Utils.monthMod(month),
      })

      pos += secondsWidthOnXAxis
      second++
    }
  }

  createRawDateString(ts, value) {
    let raw = ts.year

    if (ts.month === 0) {
      // invalid month, correct it
      ts.month = 1
    }
    raw += '-' + ('0' + ts.month.toString()).slice(-2)

    // unit is day
    if (ts.unit === 'day') {
      raw += ts.unit === 'day' ? '-' + ('0' + value).slice(-2) : '-01'
    } else {
      raw += '-' + ('0' + (ts.day ? ts.day : '1')).slice(-2)
    }

    // unit is hour
    if (ts.unit === 'hour') {
      raw += ts.unit === 'hour' ? 'T' + ('0' + value).slice(-2) : 'T00'
    } else {
      raw += 'T' + ('0' + (ts.hour ? ts.hour : '0')).slice(-2)
    }

    if (ts.unit === 'minute') {
      raw += ':' + ('0' + value).slice(-2)
    } else {
      raw += ':' + (ts.minute ? ('0' + ts.minute).slice(-2) : '00')
    }

    if (ts.unit === 'second') {
      raw += ':' + ('0' + value).slice(-2)
    } else {
      raw += ':00'
    }

    if (this.utc) {
      raw += '.000Z'
    }
    return raw
  }

  formatDates(filteredTimeScale) {
    const w = this.w

    const reformattedTimescaleArray = filteredTimeScale.map((ts) => {
      let value = ts.value.toString()

      const dt = new DateTime(this.w)

      const raw = this.createRawDateString(ts, value)

      let dateToFormat = dt.getDate(dt.parseDate(raw))
      if (!this.utc) {
        // Fixes #1726, #1544, #1485, #1255
        dateToFormat = dt.getDate(dt.parseDateWithTimezone(raw))
      }

      if (w.config.xaxis.labels.format === undefined) {
        let customFormat = 'dd MMM'
        const dtFormatter = w.config.xaxis.labels.datetimeFormatter
        if (ts.unit === 'year') customFormat = dtFormatter.year
        if (ts.unit === 'month') customFormat = dtFormatter.month
        if (ts.unit === 'day') customFormat = dtFormatter.day
        if (ts.unit === 'hour') customFormat = dtFormatter.hour
        if (ts.unit === 'minute') customFormat = dtFormatter.minute
        if (ts.unit === 'second') customFormat = dtFormatter.second

        value = dt.formatDate(dateToFormat, customFormat)
      } else {
        value = dt.formatDate(dateToFormat, w.config.xaxis.labels.format)
      }

      return {
        dateString: raw,
        position: ts.position,
        value,
        unit: ts.unit,
        year: ts.year,
        month: ts.month,
      }
    })

    return reformattedTimescaleArray
  }

  removeOverlappingTS(arr) {
    const graphics = new Graphics(this.w)

    let equalLabelLengthFlag = false // These labels got same length?
    let constantLabelWidth // If true, what is the constant length to use
    if (
      arr.length > 0 && // check arr length
      arr[0].value && // check arr[0] contains value
      arr.every((lb) => lb.value.length === arr[0].value.length) // check every arr label value is the same as the first one
    ) {
      equalLabelLengthFlag = true // These labels got same length
      constantLabelWidth = graphics.getTextRects(arr[0].value).width // The constant label width to use
    }

    let lastDrawnIndex = 0

    let filteredArray = arr.map((item, index) => {
      if (index > 0 && this.w.config.xaxis.labels.hideOverlappingLabels) {
        const prevLabelWidth = !equalLabelLengthFlag // if vary in label length
          ? graphics.getTextRects(arr[lastDrawnIndex].value).width // get individual length
          : constantLabelWidth // else: use constant length
        const prevPos = arr[lastDrawnIndex].position
        const pos = item.position

        if (pos > prevPos + prevLabelWidth + 10) {
          lastDrawnIndex = index
          return item
        } else {
          return null
        }
      } else {
        return item
      }
    })

    filteredArray = filteredArray.filter((f) => f !== null)

    return filteredArray
  }

  _getYear(currentYear, month, yrCounter) {
    return currentYear + Math.floor(month / 12) + yrCounter
  }
}

export default TimeScale
