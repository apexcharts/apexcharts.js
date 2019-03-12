import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/heatmap/basic.html'
const screenshotPath = root + '/tests/e2e/snapshots/basic-heatmap.png'

describe('Rendering Heatmap Charts', () => {
  it('should render basic heatmap chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    const paths = await page.$('.apexcharts-heatmap-series')

    const attrX = await paths.$$eval('rect', (nodes) =>
      nodes.map((n) => n.getAttribute('x'))
    )

    attrX.forEach((x) => {
      expect(x).toEqual(expect.not.stringContaining('NaN'))
    })

    const attrY = await paths.$$eval('rect', (nodes) =>
      nodes.map((n) => n.getAttribute('y'))
    )

    attrY.forEach((y) => {
      expect(y).toEqual(expect.not.stringContaining('NaN'))
    })

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
