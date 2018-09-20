import DateTime from '../utils/DateTime'
import Dimensions from './Dimensions'
import Graphics from './Graphics'

/**
 * ApexCharts TimeScale Class for generating time ticks for x-axis.
 *
 * @module TimeScale
 **/

class TimeScale {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.timeScaleArray = []
  }

  calculateTimeScaleTicks (minX, maxX) {
    let w = this.w

    // null check when no series to show
    if (w.globals.allSeriesCollapsed) {
      w.globals.labels = []
      w.globals.timelineLabels = []
      return []
    }

    let dt = new DateTime(this.ctx)

    const daysDiff = (maxX - minX) / (1000 * 60 * 60 * 24)
    this.determineInterval(daysDiff)

    const timeIntervals = dt.getTimeUnitsfromTimestamp(minX, maxX)

    const daysWidthOnXAxis = w.globals.gridWidth / daysDiff
    const hoursWidthOnXAxis = daysWidthOnXAxis / 24
    const minutesWidthOnXAxis = hoursWidthOnXAxis / 60

    let numberOfHours = Math.floor(daysDiff * 24)
    // let numberOfMinutes = Math.floor(daysDiff * 24 * 60)
    let numberOfDays = Math.floor(daysDiff)
    let numberOfMonths = Math.floor(daysDiff / 30)
    let numberOfYears = Math.floor(daysDiff / 365)

    const firstVal = {
      minMinute: timeIntervals.minMinute,
      minHour: timeIntervals.minHour,
      minDate: timeIntervals.minDate,
      minMonth: timeIntervals.minMonth,
      minYear: timeIntervals.minYear
    }

    // let currentHour = firstVal.minHour
    let currentMonthDate = firstVal.minDate
    let currentDate = firstVal.minDate
    let currentMonth = firstVal.minMonth
    let currentYear = firstVal.minYear

    const params = {
      firstVal,
      currentMonthDate,
      currentDate,
      currentMonth,
      currentYear,
      daysWidthOnXAxis,
      hoursWidthOnXAxis,
      minutesWidthOnXAxis,
      numberOfHours,
      numberOfDays,
      numberOfMonths,
      numberOfYears
    }

    switch (this.tickInterval) {
      case 'years': {
        this.generateYearScale(params)
        break
      }
      case 'months': case 'half_year': {
        this.generateMonthScale(params)
        break
      }
      case 'months_days': case 'months_fortnight': case 'days': case 'week_days': {
        this.generateDayScale(params)
        break
      }
      case 'hours': {
        this.generateHourScale(params)
        break
      }
      case 'minutes':
        // TODO
        break
    }

    // first, we will adjust the month values index
    // as in the upper function, it is starting from 0
    // we will start them from 1
    const adjustedMonthInTimeScaleArray = this.timeScaleArray.map(ts => {
      if (ts.unit === 'month') {
        return {
          position: ts.position,
          value: ts.value + 1,
          unit: ts.unit,
          year: ts.year,
          month: ts.month + 1,
          day: 1
        }
      } else if (ts.unit === 'day' || ts.unit === 'hour') {
        return {
          position: ts.position,
          value: ts.value,
          unit: ts.unit,
          year: ts.year,
          month: ts.month + 1,
          day: ts.day
        }
      }

      return ts
    })

    const filteredTimeScale = adjustedMonthInTimeScaleArray.filter((ts, index) => {
      let modulo = 1
      let ticks = Math.ceil(w.globals.gridWidth / 120)
      let value = ts.value
      if (w.config.xaxis.tickAmount !== undefined) {
        ticks = w.config.xaxis.tickAmount
      }
      if (adjustedMonthInTimeScaleArray.length > ticks) {
        modulo = Math.floor(adjustedMonthInTimeScaleArray.length / ticks)
      }

      let shouldNotSkipUnit = false // there is a big change in unit i.e days to months
      let shouldNotPrint = false // should skip these values

      switch (this.tickInterval) {
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
      }

      if ((value % modulo === 0 || shouldNotSkipUnit) && !shouldNotPrint) {
        return true
      }
    })

    return filteredTimeScale
  }

  recalcDimensionsBasedOnFormat (filteredTimeScale) {
    const w = this.w
    const reformattedTimescaleArray = this.formatDates(filteredTimeScale)

    const removedOverlappingTS = this.removeOverlappingTS(reformattedTimescaleArray)
    w.globals.timelineLabels = removedOverlappingTS.slice()

    // at this stage, we need to re-calculate coords of the grid as timeline labels may have altered the xaxis labels coords
    // The reason we can't do this prior to this stage is because timeline labels depends on gridWidth, and as the ticks are calculated based on available gridWidth, there can be unknown number of ticks generated for different minX and maxX
    // Dependency on Dimensions(), need to refactor correctly
    // TODO - find an alternate way to avoid calling this Heavy method twice
    var dimensions = new Dimensions(this.ctx)
    dimensions.plotCoords()
  }

  determineInterval (daysDiff) {
    switch (true) {
      case (daysDiff > 1825): // difference is more than 5 years
        this.tickInterval = 'years'
        break
      case (daysDiff > 800 && daysDiff <= 1825):
        this.tickInterval = 'half_year'
        break
      case (daysDiff > 180 && daysDiff <= 800):
        this.tickInterval = 'months'
        break
      case (daysDiff > 90 && daysDiff <= 180):
        this.tickInterval = 'months_fortnight'
        break
      case (daysDiff > 60 && daysDiff <= 90):
        this.tickInterval = 'months_days'
        break
      case (daysDiff > 30 && daysDiff <= 60):
        this.tickInterval = 'week_days'
        break
      case (daysDiff > 2 && daysDiff <= 30):
        this.tickInterval = 'days'
        break
      case (daysDiff <= 2): // less than  2 days
        this.tickInterval = 'hours'
        break
      default:
        this.tickInterval = 'days'
        break
    }
  }

  generateYearScale (params) {
    const { firstVal,
      currentMonth,
      currentYear,
      daysWidthOnXAxis,
      numberOfYears } = params

    let firstTickValue = firstVal.minYear
    let firstTickPosition = 0
    const dt = new DateTime(this.ctx)

    let unit = 'year'

    if (firstVal.minDate > 1 && firstVal.minMonth > 0) {
      let remainingDays = dt.determineRemainingDaysOfYear(firstVal.minYear, firstVal.minMonth, firstVal.minDate)

      // remainingDaysofFirstMonth is used to reacht the 2nd tick position
      let remainingDaysOfFirstYear = dt.determineDaysOfYear(firstVal.minYear) - remainingDays + 1

      // calculate the first tick position
      firstTickPosition = remainingDaysOfFirstYear * daysWidthOnXAxis
      firstTickValue = firstVal.minYear + 1
      // push the first tick in the array
      this.timeScaleArray.push({ position: firstTickPosition, value: firstTickValue, unit, year: firstTickValue, month: this.monthMod(currentMonth + 1) })
    } else if (firstVal.minDate === 1 && firstVal.minMonth === 0) {
      // push the first tick in the array
      this.timeScaleArray.push({ position: firstTickPosition, value: firstTickValue, unit, year: currentYear, month: this.monthMod(currentMonth + 1) })
    }

    let year = firstTickValue
    let pos = firstTickPosition

    // keep drawing rest of the ticks
    for (let i = 0; i < numberOfYears; i++) {
      year++
      pos = (dt.determineDaysOfYear(year - 1) * daysWidthOnXAxis) + pos
      this.timeScaleArray.push({ position: pos, value: year, unit, year, month: 1 })
    }
  }

  generateMonthScale (params) {
    const { firstVal,
      currentMonthDate,
      currentMonth,
      currentYear,
      daysWidthOnXAxis,
      numberOfMonths } = params

    let firstTickValue = currentMonth
    let firstTickPosition = 0
    const dt = new DateTime(this.ctx)
    let unit = 'month'
    let yrCounter = 0

    if (firstVal.minDate > 1) {
      // remainingDaysofFirstMonth is used to reacht the 2nd tick position
      let remainingDaysOfFirstMonth = dt.determineDaysOfMonths(currentMonth + 1, firstVal.minYear) - currentMonthDate + 1

      // calculate the first tick position
      firstTickPosition = remainingDaysOfFirstMonth * daysWidthOnXAxis
      firstTickValue = this.monthMod(currentMonth + 1)

      let year = currentYear + yrCounter
      let month = this.monthMod(firstTickValue)
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
      this.timeScaleArray.push({ position: firstTickPosition, value, unit, year, month })
    } else {
      // push the first tick in the array
      this.timeScaleArray.push({ position: firstTickPosition, value: firstTickValue, unit, year: currentYear, month: this.monthMod(currentMonth) })
    }

    let month = firstTickValue + 1
    let pos = firstTickPosition

    // keep drawing rest of the ticks
    for (let i = 0, j = 1; i < numberOfMonths; i++, j++) {
      month = this.monthMod(month)

      if (month === 0) {
        unit = 'year'
        yrCounter += 1
      } else {
        unit = 'month'
      }
      let year = currentYear + Math.floor(month / 12) + (yrCounter)

      pos = (dt.determineDaysOfMonths(month, year) * daysWidthOnXAxis) + pos
      let monthVal = month === 0 ? year : month
      this.timeScaleArray.push({ position: pos, value: monthVal, unit, year, month: month === 0 ? 1 : month })
      month++
    }
  }

  generateDayScale (params) {
    const { firstVal,
      currentMonth,
      currentYear,
      hoursWidthOnXAxis,
      numberOfDays } = params

    const dt = new DateTime(this.ctx)

    let unit = 'day'
    let yrCounter = 0

    const changeMonth = (dateVal, month, year) => {
      let monthdays = dt.determineDaysOfMonths(month + 1, year)

      if (dateVal > monthdays) {
        month = month + 1
        date = 1
        unit = 'month'
        return month
      }

      return month
    }

    let remainingHours = 24 - firstVal.minHour

    // calculate the first tick position
    let firstTickPosition = remainingHours * hoursWidthOnXAxis
    let firstTickValue = firstVal.minDate + 1

    let date = firstTickValue
    let month = changeMonth(date, currentMonth, currentYear)

    // push the first tick in the array
    this.timeScaleArray.push({ position: firstTickPosition, value: firstTickValue, unit, year: currentYear, month: this.monthMod(month), day: firstTickValue })

    let pos = firstTickPosition
    // keep drawing rest of the ticks
    for (let i = 0; i < numberOfDays; i++) {
      date += 1
      unit = 'day'
      month = changeMonth(date, month, currentYear + Math.floor(month / 12) + yrCounter)

      let year = currentYear + Math.floor(month / 12) + yrCounter

      pos = (24 * hoursWidthOnXAxis) + pos
      let val = (date === 1) ? this.monthMod(month) : date
      this.timeScaleArray.push({ position: pos, value: val, unit, year, month: this.monthMod(month), day: val })
    }
  }

  generateHourScale (params) {
    const { firstVal,
      currentDate,
      currentMonth,
      currentYear,
      minutesWidthOnXAxis,
      numberOfHours } = params

    const dt = new DateTime(this.ctx)

    let yrCounter = 0
    let unit = 'hour'

    const changeDate = (dateVal, month) => {
      let monthdays = dt.determineDaysOfMonths(month + 1, currentYear)
      if (dateVal > monthdays) {
        date = 1
        month = month + 1
      }
      return {
        month,
        date
      }
    }

    const changeMonth = (dateVal, month) => {
      let monthdays = dt.determineDaysOfMonths(month + 1, currentYear)
      if (dateVal > monthdays) {
        month = month + 1
        return month
      }

      return month
    }

    let remainingMins = 60 - firstVal.minMinute

    let firstTickPosition = remainingMins * minutesWidthOnXAxis
    let firstTickValue = firstVal.minHour + 1
    let hour = firstTickValue + 1

    let date = currentDate

    let month = changeMonth(date, currentMonth)

    // push the first tick in the array
    this.timeScaleArray.push({ position: firstTickPosition, value: firstTickValue, unit, day: date, hour, year: currentYear, month: this.monthMod(month) })

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

      let year = currentYear + Math.floor(month / 12) + (yrCounter)
      pos = (hour === 0 && i === 0) ? (remainingMins * minutesWidthOnXAxis) : (60 * minutesWidthOnXAxis) + pos
      let val = (hour === 0) ? date : hour
      this.timeScaleArray.push({ position: pos, value: val, unit, hour, day: date, year, month: this.monthMod(month) })

      hour++
    }
  }

  formatDates (filteredTimeScale) {
    const w = this.w

    const reformattedTimescaleArray = filteredTimeScale.map(ts => {
      let value = ts.value.toString()

      let dt = new DateTime(this.ctx)

      let raw = ts.year
      raw += '-' + ('0' + ts.month.toString()).slice(-2)
      raw += ts.unit === 'day' ? '-' + ('0' + value).slice(-2) : '-01'
      raw += ts.unit === 'hour' ? 'T' + ('0' + value).slice(-2) + ':00:00' : 'T00:00:00.000Z'
      const dateString = new Date(Date.parse(raw))

      if (w.config.xaxis.labels.format === undefined) {
        let customFormat = 'dd MMM'
        const dtFormatter = w.config.xaxis.labels.datetimeFormatter
        if (ts.unit === 'year') customFormat = dtFormatter.year
        if (ts.unit === 'month') customFormat = dtFormatter.month
        if (ts.unit === 'day') customFormat = dtFormatter.day
        if (ts.unit === 'hour') customFormat = dtFormatter.hour

        value = dt.formatDate(dateString, customFormat)
      } else {
        value = dt.formatDate(dateString, w.config.xaxis.labels.format)
      }

      return {
        dateString: raw,
        position: ts.position,
        value: value,
        unit: ts.unit,
        year: ts.year,
        month: ts.month
      }
    })

    return reformattedTimescaleArray
  }

  removeOverlappingTS (arr) {
    const graphics = new Graphics(this.ctx)
    let lastDrawnIndex = 0

    let filteredArray = arr.map((item, index) => {
      if (index > 0) {
        const prevLabelWidth = graphics.getTextRects(arr[lastDrawnIndex].value).width
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

    filteredArray = filteredArray.filter(f => {
      return f !== null
    })

    return filteredArray
  }

  // If month counter exceeds 12, it starts again from 1
  monthMod (month) {
    return month % 12
  }
}

export default TimeScale
