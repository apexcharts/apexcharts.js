import { test, expect } from '@playwright/test'
import { mountChart } from '../helpers/frames.js'

for (const factor of [1, 3]) {
  test(`draws a series added to a shared logarithmic axis starting at ${factor}`, async ({
    page,
  }) => {
    const errors = await mountChart(page, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      stroke: { curve: 'straight' },
      series: [{ name: 'A', data: [1, 100, 10000].map((v) => v * factor) }],
      yaxis: { logarithmic: true, min: factor, max: 100000 * factor },
    })

    await page.evaluate(
      (factor) =>
        window.chart.updateSeries(
          [
            { name: 'A', data: [1, 100, 10000].map((v) => v * factor) },
            { name: 'B', data: [10, 1000, 100000].map((v) => v * factor) },
          ],
          false,
        ),
      factor,
    )

    const { ys, height } = await page.evaluate(() => {
      const group = [...document.querySelectorAll('.apexcharts-series')].find(
        (el) => el.getAttribute('data:realIndex') === '1',
      )
      const path = group.querySelector('.apexcharts-line').getAttribute('d')
      return {
        ys: [...path.matchAll(/[ML]\s*[-\d.]+[\s,]+([-\d.]+)/g)].map((match) =>
          Number(match[1]),
        ),
        height: window.chart.w.layout.gridHeight,
      }
    })

    expect(ys).toHaveLength(3)
    const fractions = [1 / 5, 3 / 5, 1]
    fractions.forEach((fraction, i) =>
      expect(ys[i]).toBeCloseTo(height * (1 - fraction), 1),
    )
    expect(errors).toEqual([])
  })
}
