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

    await page.screenshot({ path: screenshotPath })
    await browser.close()
  })
}, 10000)
