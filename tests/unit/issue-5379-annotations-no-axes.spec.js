import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const configs = {
  radialBar: { chart: { type: 'radialBar' }, series: [62], labels: ['Score'] },
  pie: { chart: { type: 'pie' }, series: [3, 5, 2], labels: ['a', 'b', 'c'] },
}

describe('runtime annotations on charts without axes (#5379)', () => {
  for (const [type, opts] of Object.entries(configs)) {
    it(`warns and skips the add*Annotation calls on a ${type} chart`, () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const chart = createChartWithOptions(opts)

      expect(() => {
        chart.addYaxisAnnotation({ y: 30, label: { text: 'y' } })
        chart.addXaxisAnnotation({ x: 'b', label: { text: 'x' } })
        chart.addPointAnnotation({ x: 'b', y: 30, marker: { size: 6 } })
      }).not.toThrow()

      expect(warn).toHaveBeenCalledTimes(3)
      expect(chart.w.globals.memory.methodsToExec).toHaveLength(0)
      warn.mockRestore()
    })
  }
})
