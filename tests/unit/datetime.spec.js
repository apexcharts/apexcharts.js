import DateTime from '../../src/utils/DateTime'
import ApexCharts from '../../src/apexcharts'

describe('DateTime', () => {
  let ctx
  let datetime

  beforeEach(() => {
    const el = document.createElement('div')
    el.style.width = '500px'
    el.style.height = '300px'
    document.body.appendChild(el)

    ctx = new ApexCharts(el, {
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
    })
    ctx.render()
    datetime = new DateTime(ctx)
  })

  afterEach(() => {
    if (ctx && ctx.w && ctx.w.globals && ctx.w.globals.dom && ctx.w.globals.dom.baseEl) {
      const el = ctx.w.globals.dom.baseEl.parentElement
      if (el && el.parentElement) {
        el.parentElement.removeChild(el)
      }
    }
    ctx = null
  })

  describe('isValidDate', () => {
    it('should return false for numbers (timestamps)', () => {
      expect(datetime.isValidDate(1234567890)).toBe(false)
    })

    it('should return true for valid date strings', () => {
      expect(datetime.isValidDate('2023-01-01')).toBe(true)
      expect(datetime.isValidDate('January 1, 2023')).toBe(true)
    })

    it('should return false for invalid date strings', () => {
      expect(datetime.isValidDate('not a date')).toBe(false)
      expect(datetime.isValidDate('invalid')).toBe(false)
    })
  })

  describe('parseDate', () => {
    it('should parse standard date strings', () => {
      const result = datetime.parseDate('2023-01-01')
      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })

    it('should handle dates with dashes', () => {
      const result = datetime.parseDate('2023-06-15')
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('parseDateWithTimezone', () => {
    it('should parse date with timezone info', () => {
      const result = datetime.parseDateWithTimezone('2023-01-01T00:00:00Z')
      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })
  })

  describe('getTimeStamp', () => {
    it('should convert date string to timestamp', () => {
      const result = datetime.getTimeStamp('2023-01-01')
      expect(result).toBeGreaterThan(0)
    })

    it('should return value if not parseable', () => {
      const result = datetime.getTimeStamp(null)
      expect(result).toBe(null)
    })
  })

  describe('getDate', () => {
    it('should convert timestamp to Date object', () => {
      const timestamp = new Date('2023-01-01').getTime()
      const result = datetime.getDate(timestamp)
      expect(result).toBeInstanceOf(Date)
    })
  })

  describe('isLeapYear', () => {
    it('should return true for leap years', () => {
      expect(datetime.isLeapYear(2020)).toBe(true)
      expect(datetime.isLeapYear(2000)).toBe(true)
      expect(datetime.isLeapYear(2400)).toBe(true)
    })

    it('should return false for non-leap years', () => {
      expect(datetime.isLeapYear(2021)).toBe(false)
      expect(datetime.isLeapYear(2022)).toBe(false)
      expect(datetime.isLeapYear(1900)).toBe(false)
    })

    it('should handle century years correctly', () => {
      expect(datetime.isLeapYear(2000)).toBe(true)
      expect(datetime.isLeapYear(1900)).toBe(false)
    })
  })

  describe('determineDaysOfMonths', () => {
    it('should return correct days for 31-day months', () => {
      expect(datetime.determineDaysOfMonths(1, 2023)).toBe(31)
      expect(datetime.determineDaysOfMonths(3, 2023)).toBe(31)
      expect(datetime.determineDaysOfMonths(5, 2023)).toBe(31)
    })

    it('should return correct days for 30-day months', () => {
      expect(datetime.determineDaysOfMonths(4, 2023)).toBe(30)
      expect(datetime.determineDaysOfMonths(6, 2023)).toBe(30)
    })

    it('should return 28 days for February in non-leap years', () => {
      expect(datetime.determineDaysOfMonths(2, 2023)).toBe(28)
    })

    it('should return 29 days for February in leap years', () => {
      expect(datetime.determineDaysOfMonths(2, 2020)).toBe(29)
    })
  })

  describe('determineDaysOfYear', () => {
    it('should return 365 for non-leap years', () => {
      expect(datetime.determineDaysOfYear(2021)).toBe(365)
      expect(datetime.determineDaysOfYear(2022)).toBe(365)
    })

    it('should return 366 for leap years', () => {
      expect(datetime.determineDaysOfYear(2020)).toBe(366)
      expect(datetime.determineDaysOfYear(2024)).toBe(366)
    })
  })

  describe('calculcateLastDaysOfMonth', () => {
    it('should calculate remaining days of month', () => {
      expect(datetime.calculcateLastDaysOfMonth(1, 2023, 15)).toBe(16)
      expect(datetime.calculcateLastDaysOfMonth(2, 2023, 20)).toBe(8)
    })

    it('should work with leap year February', () => {
      expect(datetime.calculcateLastDaysOfMonth(2, 2020, 20)).toBe(9)
    })
  })
})
