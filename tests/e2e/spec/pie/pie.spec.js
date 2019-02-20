import puppeteer from 'puppeteer'
import { root } from '../../../../config.js'

const APP = root + '/samples/vanilla-js/pie/simple-pie.html'
const screenshotPath = root + '/tests/e2e/snapshots/simple-pie.png'

describe('Rendering Pie Charts', () => {
  it('should render basic pie chart', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto('file://' + APP)

    await page.waitFor(2000)

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
