import { test, expect } from '../fixtures/base.js'

const umdPath = 'dist/apexcharts.js'

async function mount(page, interactive, followCursor = false) {
  await page.setContent('<div id="chart" style="width: 640px"></div>')
  await page.addScriptTag({ path: umdPath })
  await page.evaluate(([isInteractive, shouldFollowCursor]) => {
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
        followCursor: shouldFollowCursor,
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
  }, [interactive, followCursor])
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
}

async function mountGrouped(page) {
  await page.setContent(
    '<div id="left" style="display:inline-block;width:320px"></div><div id="right" style="display:inline-block;width:320px"></div>',
  )
  await page.addScriptTag({ path: umdPath })
  await page.evaluate(() => {
    const options = {
      chart: {
        group: 'interactive-tooltip-group',
        type: 'line',
        height: 240,
        animations: { enabled: false },
      },
      series: [{ name: 'Values', data: [10, 20, 15] }],
      tooltip: { interactive: true },
    }
    window.groupedCharts = ['left', 'right'].map((id) =>
      new window.ApexCharts(document.querySelector(`#${id}`), options),
    )
    return Promise.all(window.groupedCharts.map((chart) => chart.render()))
  })
  await page.waitForFunction(
    () => window.groupedCharts.every((chart) => chart.w.globals.animationEnded),
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

  test('ignores followCursor so custom tooltip controls remain reachable', async ({ page }) => {
    await mount(page, true, true)

    await page.locator('.apexcharts-rangebar-area').hover()
    const tooltip = page.locator('.apexcharts-tooltip')
    const link = page.locator('#tooltip-link')

    await expect(tooltip).toHaveClass(/apexcharts-active/)
    await link.hover()
    await expect(tooltip).toHaveClass(/apexcharts-active/)
    await link.click()
    await expect.poll(() => page.evaluate(() => window.linkClicks)).toBe(1)
  })

  test('hides synchronized grouped tooltips after mouseout', async ({ page }) => {
    await mountGrouped(page)

    await page.locator('#left .apexcharts-series path').first().hover()
    await expect(page.locator('#left .apexcharts-tooltip')).toHaveClass(/apexcharts-active/)
    await expect(page.locator('#right .apexcharts-tooltip')).toHaveClass(/apexcharts-active/)

    await page.mouse.move(700, 300)
    await page.waitForTimeout(500)

    await expect(page.locator('#left .apexcharts-tooltip')).not.toHaveClass(/apexcharts-active/)
    await expect(page.locator('#right .apexcharts-tooltip')).not.toHaveClass(/apexcharts-active/)
  })
})
