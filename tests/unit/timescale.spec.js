import TimeScale from '../../src/modules/TimeScale'
import { range } from './data/sample-data'
import { createChart } from './utils/utils.js'

describe("Generate TimeScale", () => {

  it("should return timescale ticks for year range in a datetime series", () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleYears = timeScale.calculateTimeScaleTicks(range.years[0], range.years[1])
    
    expect(generatedTimeScaleYears).toHaveLength(6)
  })

  it("should return timescale ticks for months range in a datetime series", () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleMonths = timeScale.calculateTimeScaleTicks(range.months[0], range.months[1])
    
    expect(generatedTimeScaleMonths).toHaveLength(9)
  })

  it("should return timescale ticks for days range in a datetime series", () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleDays = timeScale.calculateTimeScaleTicks(range.days[0], range.days[1])
    
    expect(generatedTimeScaleDays).toHaveLength(27)
  })

  it("should return timescale ticks for hours range in a datetime series", () => {
    const chart = createChart('line', [{ data: [0, 1] }])
    const timeScale = new TimeScale(chart)
    const generatedTimeScaleHours = timeScale.calculateTimeScaleTicks(range.hours[0], range.hours[1])
    
    expect(generatedTimeScaleHours).toHaveLength(9)
  })
});