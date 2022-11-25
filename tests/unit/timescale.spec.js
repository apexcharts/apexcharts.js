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

  it('should return timescale ticks for ten seconds range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.seconds_tens[0],
      range.seconds_tens[1]
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 10,
        value: 10
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 20,
        value: 20
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 30,
        value: 30
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 40,
        value: 40
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 50,
        value: 50
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 0,
        value: 0
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 10,
        value: 10
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 20,
        value: 20
      })
    ])
  })

  it('should return timescale ticks for five seconds range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.seconds_fives[0],
      range.seconds_fives[1]
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 45,
        value: 45
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 50,
        value: 50
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 55,
        value: 55
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 0,
        value: 0
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 5,
        value: 5
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 10,
        value: 10
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 15,
        value: 15
      })
    ])
  })

  it('should return timescale ticks for single seconds range in a datetime series', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleMinutes = timeScale.calculateTimeScaleTicks(
      range.seconds[0],
      range.seconds[1]
    )

    expect(generatedTimeScaleMinutes).toEqual([
      expect.objectContaining({
        unit: 'second',
        hour: 1,
        minute: 59,
        second: 59,
        value: 59
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 0,
        value: 0
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 1,
        value: 1
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 2,
        value: 2
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 3,
        value: 3
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 4,
        value: 4
      }),
      expect.objectContaining({
        unit: 'second',
        hour: 2,
        minute: 0,
        second: 5,
        value: 5
      })
    ])
  })

  it('should generate an hour timescale with no overlapping ticks', () => {
    const chart = createChart('line', [
      {
        data: [0, 1]
      }
    ])
    const timeScale = new TimeScale(chart)
    timeScale.generateHourScale({
      firstVal: {
        minSecond: 0,
        minMinute: 30,
        minHour: 22
      },
      currentDate: 22,
      currentMonth: 11,
      currentYear: 2022,
      minutesWidthOnXAxis: 0.4,
      numberOfHours: 24
    })

    const generatedScale = timeScale.timeScaleArray
    for (let i = 0; i < generatedScale.length - 1; i++) {
      expect(generatedScale[i].position).not.toEqual(
        generatedScale[i + 1].position
      )
    }
  })
})

describe('createRawDateString', () => {
  const chart = createChart('line', [
    {
      data: [0, 1]
    }
  ])
  const timeScale = new TimeScale(chart)

  it('should create month string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'month',
          year: 2020,
          month: 2,
          value: 2
        },
        '2'
      )
    ).toBe('2020-02-01T00:00:00.000Z')
  })

  it('should create day string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'day',
          year: 2020,
          month: 1,
          day: 2,
          value: 2
        },
        '2'
      )
    ).toBe('2020-01-02T00:00:00.000Z')
  })

  it('should create hour string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'hour',
          year: 2020,
          month: 1,
          day: 1,
          hour: 2,
          value: 2
        },
        '2'
      )
    ).toBe('2020-01-01T02:00:00.000Z')
  })

  it('should create minute string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'minute',
          year: 2020,
          month: 1,
          day: 1,
          hour: 1,
          minute: 59,
          value: 59
        },
        '59'
      )
    ).toBe('2020-01-01T01:59:00.000Z')
  })

  it('should create second string', () => {
    expect(
      timeScale.createRawDateString(
        {
          unit: 'second',
          year: 2020,
          month: 1,
          day: 1,
          hour: 1,
          minute: 1,
          second: 59,
          value: 59
        },
        '59'
      )
    ).toBe('2020-01-01T01:01:59.000Z')
  })
})
