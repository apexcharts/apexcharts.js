import TimeScale from '../../src/modules/TimeScale'
import { range } from './data/sample-data'
import { createChart } from './utils/utils.js'

describe('Generate TimeScale', () => {
  it('should return timescale ticks for year range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleYears = timeScale.calculateTimeScaleTicks(
      range.years[0],
      range.years[1]
    )

    expect(generatedTimeScaleYears).toHaveLength(6)
    generatedTimeScaleYears.forEach((tick) => {
      if (tick.month === 1) {
        expect(tick.unit).toBe('year')
      } else {
        expect(tick.unit).toBe('month')
      }
    })
  })

  it('should return timescale ticks for months range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleMonths = timeScale.calculateTimeScaleTicks(
      range.months[0],
      range.months[1]
    )

    expect(generatedTimeScaleMonths).toHaveLength(9)
    generatedTimeScaleMonths.forEach((tick) => {
      expect(tick.unit).toBe('month')
    })
  })

  it('should return timescale ticks for days range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleDays = timeScale.calculateTimeScaleTicks(
      range.days[0],
      range.days[1]
    )

    expect(generatedTimeScaleDays).toHaveLength(27)
    generatedTimeScaleDays.forEach((tick) => {
      if (tick.day === 1) {
        expect(tick.unit).toBe('month')
      } else {
        expect(tick.unit).toBe('day')
      }
    })
  })

  it('should return timescale ticks for hours range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleHours = timeScale.calculateTimeScaleTicks(
      range.hours[0],
      range.hours[1]
    )

    expect(generatedTimeScaleHours).toHaveLength(21)
    generatedTimeScaleHours.forEach((tick) => {
      expect(tick.unit).toBe('hour')
    })
  })

  it('should return timescale ticks for five-minutes range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.minutes_fives[0],
      range.minutes_fives[1]
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 40,
        value: 40
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 45,
        value: 45
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 50,
        value: 50
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 1,
        minute: 55,
        value: 55
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 0,
        value: 0
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 5,
        value: 5
      })
    ])
  })

  it('should return timescale ticks for single minutes range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.minutes[0],
      range.minutes[1]
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 0,
        value: 0
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 1,
        value: 1
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 2,
        value: 2
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 3,
        value: 3
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 4,
        value: 4
      }),
      expect.objectContaining({
        unit: 'minute',
        hour: 2,
        minute: 5,
        value: 5
      })
    ])
  })
})
