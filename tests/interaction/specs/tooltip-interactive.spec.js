import { test, expect } from '../fixtures/base.js'

const umdPath = 'dist/apexcharts.js'

async function mount(page, interactive) {
  await page.setContent('<div id="chart" style="width: 640px"></div>')
  await page.addScriptTag({ path: umdPath })
  await page.evaluate((isInteractive) => {
    window.linkClicks = 0
    window.chart = new window.ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'rangeBar',
        height: 240,
        animations: { enabled: false },
      },
      series: [
        {
          name: 'Schedule',
          data: [{ x: 'Operations', y: [1, 5] }],
        },
      ],
      tooltip: {
        interactive: isInteractive,
        custom: () => '<a id="tooltip-link" href="#details">Details</a>',
      },
    })
    return window.chart.render().then(() => {
      document.addEventListener('click', (event) => {
        if (event.target.id === 'tooltip-link') {
          event.preventDefault()
          window.linkClicks += 1
        }
      })
    })
  }, interactive)
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
}

test.describe('tooltip.interactive', () => {
  test('custom tooltip content can be hovered and clicked', async ({ page }) => {
    await mount(page, true)

    await page.locator('.apexcharts-rangebar-area').hover()
    const tooltip = page.locator('.apexcharts-tooltip')
    const link = page.locator('#tooltip-link')

    await expect(tooltip).toHaveClass(/apexcharts-tooltip-interactive/)
    await expect(tooltip).toHaveClass(/apexcharts-active/)
    await expect(link).toHaveCSS('pointer-events', 'auto')

    const tooltipBox = await tooltip.boundingBox()
    expect(tooltipBox).not.toBeNull()
    await page.mouse.move(
      tooltipBox.x + tooltipBox.width / 2,
      tooltipBox.y + tooltipBox.height + 4,
    )
    await page.waitForTimeout(75)
    await expect(tooltip).toHaveClass(/apexcharts-active/)

    await link.hover()
    await expect(tooltip).toHaveClass(/apexcharts-active/)
    await link.click()
    await expect.poll(() => page.evaluate(() => window.linkClicks)).toBe(1)

    await page.mouse.move(630, 230)
    await expect(tooltip).not.toHaveClass(/apexcharts-active/)
  })

  test('remains non-interactive by default', async ({ page }) => {
    await mount(page, false)

    await page.locator('.apexcharts-rangebar-area').hover()
    const tooltip = page.locator('.apexcharts-tooltip')

    await expect(tooltip).not.toHaveClass(/apexcharts-tooltip-interactive/)
    await expect(tooltip).toHaveCSS('pointer-events', 'none')
  })
})
