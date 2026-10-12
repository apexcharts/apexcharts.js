import DateTime from '../../src/utils/DateTime'
import ApexCharts from '../../src/entries/standard'

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
    // Don't render - DateTime only needs the config structure
    datetime = new DateTime(ctx.w)
  })

  afterEach(() => {
    if (
      ctx &&
      ctx.w &&
      ctx.w.globals &&
      ctx.w.globals.dom &&
      ctx.w.globals.dom.baseEl
    ) {
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
})
