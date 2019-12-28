import fs from 'fs'
import path from 'path'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import puppeteer from 'puppeteer'

export function chartVisualTest(type, filename, imageFilename, validate) {
  const rootDir = path.join(path.resolve(__dirname), '..', '..', '..')

  describe(`Rendering ${type} charts`, () => {
    it(
      `should render basic ${type} chart` +
        (imageFilename ? '' : ' with missing values'),
      async () => {
        // BUG: set screen size?
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.goto(
          `file://${rootDir}/samples/vanilla-js/${type}/${filename}.html`
        )
        await page.waitFor(2000)

        await validate(page)

        if (imageFilename) {
          const e2eDir = `${rootDir}/tests/e2e`
          const testImgPath = `${e2eDir}/snapshots/${imageFilename}.png`
          await page.screenshot({ path: testImgPath })

          // BUG: read files with async functions
          const originalImgPath = `${e2eDir}/snapshots-standard/${imageFilename}.png`
          const originalImg = PNG.sync.read(fs.readFileSync(originalImgPath))
          const testImg = PNG.sync.read(fs.readFileSync(testImgPath))
          const { width, height } = originalImg
          const diffImg = new PNG({ width, height })

          // BUG: fix threshold
          const numDiffs = pixelmatch(
            originalImg.data,
            testImg.data,
            diffImg.data,
            width,
            height,
            { threshold: 0.1 }
          )

          if (numDiffs > 0) {
            // BUG: print a message with percentage of discrepancy and path to image
            // BUG: fix it,
            fs.writeFileSync(
              `${e2eDir}/snapshots/${imageFilename}.diff.png`,
              PNG.sync.write(diffImg)
            )

            // expect(false).toBe(true)
          }
        }

        await browser.close()
      }
    )
  }, 20000)
}
