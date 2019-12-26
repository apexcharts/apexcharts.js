const fs = require('fs-extra')
const path = require('path')
const pixelmatch = require('pixelmatch')
const { PNG } = require('pngjs')
const puppeteer = require('puppeteer')

const samplesDir = path.join(__dirname, '..')

async function validate() {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  page.evaluateOnNewDocument(`
    var _seed = 42;
    Math.random =  function() {
      _seed = _seed * 16807 % 2147483647;
      return (_seed - 1) / 2147483646;
    };`)

  const formats = ['vanilla-js', 'react', 'vue']
  const sourceDir = path.join(samplesDir, 'source')
  const dirNames = await fs.promises.readdir(sourceDir)
  for (const dirName of dirNames) {
    if (dirName.includes('.')) {
      continue
    }

    const dirPath = path.join(sourceDir, dirName)
    const fileNames = await fs.promises.readdir(dirPath)
    for (const fileName of fileNames) {
      if (fileName.endsWith('.xml')) {
        if (fileName !== 'histogram.xml') continue

        console.log(dirName, fileName)
        const images = {}
        for (const format of formats) {
          for (const postfix of ['', '-temp']) {
            const type = format + postfix

            const htmlPath = path.join(
              samplesDir,
              type,
              dirName,
              fileName.slice(0, -4) + '.html'
            )

            if (fs.existsSync(htmlPath)) {
              await page.goto(`file://${htmlPath}`)
              await page.waitFor(3000)
              const image = await page.screenshot()
              images[type] = PNG.sync.read(image)
            }
          }
        }

        const identicalGroups = [['vanilla-js']]
        for (const type in images) {
          if (identicalGroups.some((group) => group.includes(type))) {
            continue
          }

          let identified = false
          for (const group of identicalGroups) {
            const { width, height } = images[group[0]]
            const diffImg = new PNG({ width, height })

            const numDiffs = pixelmatch(
              images[group[0]].data,
              images[type].data,
              diffImg.data,
              width,
              height,
              { threshold: 0.01 }
            )

            if (numDiffs > 0) {
              // fs.writeFileSync(
              //   `${samplesDir}/${fileName - type}.diff.png`,
              //   PNG.sync.write(diffImg)
              // )

              // console.log(
              //   `${dirName}/${fileName}: ${group[0]} and ${format +
              //     postfix} differ`
              // )
            } else {
              identified = true
              group.push(type)
              break
            }
          }

          if (!identified) {
            identicalGroups.push([type])
          }
        }

        if (identicalGroups.length > 1) {
          console.log(
            `${dirName}/${fileName} groups: ${JSON.stringify(identicalGroups)}`
          )
        }
      }
    }

    // BUG: temp
    // break
  }

  await browser.close()
}

validate().catch((e) => console.log(e))
