import { chartVisualTest } from '../utils'

chartVisualTest(
  'area',
  'area-github-style',
  'area-github-style',
  async (page) => {
    const firstXLabel = await page.$(
      '#chart-months .apexcharts-xaxis-label:first-child'
    )
    const lastXLabel = await page.$(
      '#chart-months .apexcharts-xaxis-label:last-child'
    )

    const expectLabelEmpty = async (label) => {
      const text = await label.$eval('tspan', (node) => {
        return node.innerHTML
      })
      expect(text).toBeFalsy()
    }

    expectLabelEmpty(firstXLabel)
    expectLabelEmpty(lastXLabel)

    // const textFirst =
    // const textLast = await lastXLabel.$eval('tspan', (node) => {
    //   return node.innerHTML
    // })

    // expect(text).toBeFalsy()
    // expect(text).toBeFalsy()
  }
)
