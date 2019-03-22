import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/line/multi-stepline.html'
const screenshotPath = root + '/tests/e2e/snapshots/multiple-stepline.png'

describe('Rendering Stepline Area Charts', () => {
  it('should render line chart with smooth line and area stepline', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    const paths = await page.$(
      '.apexcharts-bar-series, .apexcharts-line-series'
    )

    const attrD = await paths.$$eval('path', (nodes) =>
      nodes.map((n) => n.getAttribute('d'))
    )

    attrD.forEach((d) => {
      expect(d).toEqual(expect.not.stringContaining('NaN'))
    })

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
