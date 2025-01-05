import { chartVisualTest } from '../utils'

chartVisualTest('bubble', 'simple-bubble', 'simple-bubble', async (page) => {
  const paths = await page.$('.apexcharts-bubble-series')

  const attrCX = await paths.$$eval('circle', (nodes) =>
    nodes.map((n) => n.getAttribute('cx'))
  )

  attrCX.forEach((cx) => {
    expect(cx).toEqual(expect.not.stringContaining('NaN'))
  })

  const attrCY = await paths.$$eval('circle', (nodes) =>
    nodes.map((n) => n.getAttribute('cy'))
  )

  attrCY.forEach((cy) => {
    expect(cy).toEqual(expect.not.stringContaining('NaN'))
  })
})
