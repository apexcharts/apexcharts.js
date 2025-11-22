import { createChartWithOptions } from './utils/utils.js'

describe('Print Event Handlers', () => {
  let chart

  beforeEach(() => {
    // Create a chart instance
    chart = createChartWithOptions({
      chart: {
        type: 'line',
        height: 350,
        redrawOnWindowResize: true,
        redrawOnParentResize: true
      },
      series: [{
        name: 'Test Series',
        data: [10, 20, 30, 40, 50]
      }],
      xaxis: {
        categories: ['A', 'B', 'C', 'D', 'E']
      }
    })
  })

  afterEach(() => {
    if (chart) {
      chart.destroy()
    }
  })

  it('should have print event handlers bound', () => {
    expect(chart.beforePrintHandler).toBeDefined()
    expect(chart.afterPrintHandler).toBeDefined()
    expect(typeof chart.beforePrintHandler).toBe('function')
    expect(typeof chart.afterPrintHandler).toBe('function')
  })

  it('should set resized flag on beforeprint event', () => {
    // Initially, resized should be false
    chart.w.globals.resized = false
    
    // Trigger beforeprint handler
    chart.beforePrintHandler()
    
    // Check that resized flag is set
    expect(chart.w.globals.resized).toBe(true)
  })

  it('should set resized flag on afterprint event', () => {
    // Initially, resized should be false
    chart.w.globals.resized = false
    
    // Trigger afterprint handler
    chart.afterPrintHandler()
    
    // Check that resized flag is set
    expect(chart.w.globals.resized).toBe(true)
  })

  it('should handle beforeprint and afterprint event lifecycle', () => {
    // Reset flags
    chart.w.globals.resized = false
    chart.w.globals.dataChanged = false
    
    // Simulate beforeprint
    chart.beforePrintHandler()
    expect(chart.w.globals.resized).toBe(true)
    expect(chart.w.globals.dataChanged).toBe(false)
    
    // Reset for afterprint
    chart.w.globals.resized = false
    
    // Simulate afterprint
    chart.afterPrintHandler()
    expect(chart.w.globals.resized).toBe(true)
    expect(chart.w.globals.dataChanged).toBe(false)
  })
})
