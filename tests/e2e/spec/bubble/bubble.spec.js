import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/bubble/simple-bubble.html'
const screenshotPath = root + '/tests/e2e/snapshots/simple-bubble.png'

describe('Rendering Bubble Charts', () => {
  it('should render basic bubble chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

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

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
