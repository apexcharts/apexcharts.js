import { test, expect } from '../fixtures/base.js'
import { BUNDLE } from '../helpers/frames.js'

test('horizontal timeline moves the x crosshair and axis tooltip across the hovered bar', async ({
  page,
}) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('http://rangebar.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<div id="chart" style="width:800px"></div>',
    }),
  )
  await page.goto('http://rangebar.test/')
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate(async () => {
    const Chart = window.ApexModule?.default ?? window.ApexCharts
    const chart = new Chart(document.querySelector('#chart'), {
      chart: { type: 'rangeBar', height: 350, animations: { enabled: false } },
      plotOptions: { bar: { horizontal: true } },
      series: [
        {
          data: [
            { x: 'Code', y: [Date.UTC(2026, 10, 1), Date.UTC(2026, 10, 6)] },
            { x: 'Test', y: [Date.UTC(2026, 10, 3), Date.UTC(2026, 10, 8)] },
          ],
        },
      ],
      xaxis: {
        type: 'datetime',
        crosshairs: { show: true, stroke: { width: 3 } },
        tooltip: { enabled: true },
      },
    })
    await chart.render()
  })

  const bar = await page
    .locator('.apexcharts-rangebar-area')
    .first()
    .boundingBox()
  const positions = []
  for (const ratio of [0.3, 0.7]) {
    const x = bar.x + bar.width * ratio
    await page.mouse.move(x, bar.y + bar.height / 2)
    positions.push(
      await page.evaluate(() => {
        const crosshair = document.querySelector('.apexcharts-xcrosshairs')
        const axisTip = document.querySelector('.apexcharts-xaxistooltip')
        return {
          crosshairActive: crosshair.classList.contains('apexcharts-active'),
          crosshairX: parseFloat(
            crosshair.getAttribute('x1') ?? crosshair.getAttribute('x'),
          ),
          tooltipActive: axisTip.classList.contains('apexcharts-active'),
          tooltipX: parseFloat(axisTip.style.left),
        }
      }),
    )
  }
  for (let i = 0; i < positions.length; i++) {
    const p = positions[i]
    expect(p.crosshairActive).toBe(true)
    expect(p.crosshairX).toBeGreaterThan(0)
    expect(p.tooltipActive).toBe(true)
    expect(Number.isFinite(p.tooltipX)).toBe(true)
  }
  expect(positions[1].crosshairX).toBeGreaterThan(positions[0].crosshairX + 5)
  expect(positions[1].tooltipX).toBeGreaterThan(positions[0].tooltipX + 5)
  expect(errors).toEqual([])
})
