import puppeteer from "puppeteer";
import { root } from '../../../../config.js';

const APP = root + '/samples/vanilla-js/scatter/scatter-basic.html';
const screenshotPath = root + '/tests/e2e/snapshots/scatter-basic.png'

describe("Rendering Scatter Charts", () => {
  it('should render basic scatter chart', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file://' + APP);

    await page.waitFor(2000);
  
    await page.screenshot({ path: screenshotPath });
    await browser.close();
  })
  
}, 10000);
