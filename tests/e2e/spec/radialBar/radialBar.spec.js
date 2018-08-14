import puppeteer from "puppeteer";
import { root } from '../../../../config.js';

const APP = root + '/samples/radialBar/circle-chart.html';
const screenshotPath = root + '/tests/e2e/snapshots/circle-chart.png'

describe("Rendering radialBar Charts", () => {
  it('should render basic radialBar chart', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file://' + APP);

    await page.waitFor(2000);
  
    await page.screenshot({ path: screenshotPath });
    await browser.close();
  })
  
}, 10000);
