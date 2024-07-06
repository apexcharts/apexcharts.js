const chalk = require('chalk')
const { spawnSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const pixelmatch = require('pixelmatch')
const { PNG } = require('pngjs')
const { Cluster } = require('puppeteer-cluster')
const os = require('os')

const { builds, executeBuildEntry } = require('../../build/config')
const { extractSampleInfo } = require('../../samples/source')

const rootDir = path.join(path.resolve(__dirname), '..', '..')

const e2eDir = `${rootDir}/tests/e2e`
const e2eSamplesDir = `${rootDir}/samples/e2e`

let browser

class TestError extends Error {
  constructor(message) {
    super(message)
    this.hideStack = true
  }
}

async function processSample(page, sample, command) {
  const relPath = `${sample.dirName}/${sample.fileName}`
  const vanillaJsHtml = `${rootDir}/samples/vanilla-js/${relPath}.html`
  let htmlPath

  if (command === 'test') {
    // Create sample html file with a library instumented with istanbul
    let html = await fs.promises.readFile(vanillaJsHtml, 'utf8')
    html = html.replace('../../../dist/apexcharts.js', '../apexcharts.e2e.js')
    htmlPath = `${e2eSamplesDir}/${relPath}.html`
    await fs.ensureDir(path.dirname(htmlPath))
    await fs.promises.writeFile(htmlPath, html)
  } else if (command === 'update') {
    htmlPath = vanillaJsHtml
  }

  const consoleErrors = []
  page.on('pageerror', (error) => consoleErrors.push(error.message))

  await page.evaluateOnNewDocument(() => {
    window.isATest = true

    //Keep track of running timers and intervals in the page
    window.activeTimerCount = 0
    window.activeIntervalCount = 0

    var originalSetTimeout = window.setTimeout
    var originalClearTimeout = window.clearTimeout
    var originalSetInterval = window.setInterval
    var originalClearInterval = window.clearInterval

    window.setTimeout = function () {
      window.activeTimerCount++
      var timeoutArguments = arguments
      var originalFunction = timeoutArguments[0]

      //Decrement activeTimerCount once timer has executed
      timeoutArguments[0] = function () {
        originalFunction()
        window.activeTimerCount--
      }

      //Call the original window.setTimeout function with the provided arguments and modified function
      return originalSetTimeout.apply(null, timeoutArguments)
    }

    window.clearTimeout = function (id) {
      //Prevent calls to clearTimeout with an undefined timerID decremeneting window.activeTimerCount
      if (id) {
        originalClearTimeout(id)
        window.activeTimerCount--
      }
    }

    window.setInterval = function () {
      window.activeIntervalCount++
      return originalSetInterval.apply(null, arguments)
    }

    window.clearInterval = function (id) {
      //Prevent calls to clearInterval with an undefined intervalID decrementing window.activeIntervalCount
      if (id) {
        window.activeIntervalCount--
        originalClearInterval(id)
      }
    }
  })

  await page.goto(`file://${htmlPath}`)

  let wait;
  do {
    //Wait for all intervals in the page to have been cleared
    await page.waitForFunction(() => window.activeIntervalCount === 0)

    //Wait for all timers in the page to have all executed
    await page.waitForFunction(() => window.activeTimerCount === 0)

    //Wait for the chart animation to end
    await page.waitForFunction(() => chart.w.globals.animationEnded)

    //Wait for all network requests to finish
    await page.waitForNetworkIdle()

    //After the network requests, timers, and intervals finish, if another request, timer, or interval is created then we need
    //to wait for that to finish before continuing on.
    wait = await page.evaluate(() => {
      return !(window.activeIntervalCount === 0 && window.activeTimerCount === 0 && chart.w.globals.animationEnded)
    })
  } while (wait)

  // Check that there are no console errors
  if (consoleErrors.length > 0) {
    throw new TestError(`Console errors:\n${consoleErrors.join('\n')}`)
  }

  // BUG: run custom code from xml if provided. sample can contain several e2e tests. Allow to name them (for display)?
  // BUG: run standard checks

  if (command === 'test') {
    const coverage = await page.evaluate(() => window.__coverage__)
    await fs.writeJson(
      `${rootDir}/.nyc_output/${sample.dirName}-${sample.fileName}.json`,
      coverage
    )
  }

  // Make a screenshot of root div element or page (if root div has empty height, e.g. column/dynamic-loaded-chart)
  const chartDiv = await page.$('div')
  let testImgBuffer
  try {
    testImgBuffer = await chartDiv.screenshot()
  } catch (e) {
    testImgBuffer = await page.screenshot()
  }
  const originalImgPath = `${e2eDir}/snapshots/${relPath}.png`

  if (command === 'test') {
    // Compare screenshot to the original and throw error on differences
    const testImg = PNG.sync.read(testImgBuffer)
    // BUG: copy if original image doesn't exist and report in test results?
    const originalImg = PNG.sync.read(fs.readFileSync(originalImgPath))
    const { width, height } = testImg
    const diffImg = new PNG({ width, height })

    let numDiffs = null
    let err

    try {
      numDiffs = pixelmatch(
        originalImg.data,
        testImg.data,
        diffImg.data,
        width,
        height,
        { threshold: 0.01 }
      )
    } catch (e) {
      err = e
    }

    // Save screenshot even if pixelmatch failed (due to image size mismatch)
    if (numDiffs !== 0) {
      await fs.ensureDir(`${e2eDir}/diffs/${sample.dirName}`)
      fs.writeFileSync(`${e2eDir}/diffs/${relPath}.png`, testImgBuffer)
    }

    if (numDiffs > 0) {
      fs.writeFileSync(
        `${e2eDir}/diffs/${relPath}.diff.png`,
        PNG.sync.write(diffImg)
      )

      const mismatchPercent = ((100 * numDiffs) / width / height).toFixed(2)

      if (mismatchPercent > 5) {
        throw new TestError(`Screenshot changed by ${mismatchPercent}%`)
      }
    } else if (err) {
      throw err
    }
  } else if (command === 'update') {
    await fs.ensureDir(path.dirname(originalImgPath))
    fs.writeFileSync(originalImgPath, testImgBuffer)
  }
}

function dirLastModified(dir) {
  let time = 0
  fs.readdirSync(dir).forEach((f) => {
    const itemPath = path.join(dir, f)
    const stat = fs.statSync(itemPath)
    const timeModified = stat.isDirectory()
      ? dirLastModified(itemPath)
      : stat.mtime
    time = Math.max(time, timeModified)
  })
  return time
}

async function updateBundle(config) {
  const timeModified = fs.existsSync(config.dest)
    ? fs.statSync(config.dest).mtime.valueOf()
    : 0

  let codeModifiedTime = Math.max(
    dirLastModified(`${rootDir}/build`),
    dirLastModified(`${rootDir}/src`)
  )

  if (timeModified < codeModifiedTime) {
    await executeBuildEntry(config)
  }
}

async function processSamples(command, paths) {
  const startTime = Date.now()

  await updateBundle(builds['web-umd-dev'])

  if (command === 'test') {
    await fs.ensureDir(e2eSamplesDir)
    await fs.emptyDir(`${rootDir}/.nyc_output`)
    await fs.emptyDir(`${e2eDir}/diffs`)

    // Build the version of apexcharts instrumented with istanbul to record test coverage
    await updateBundle({
      entry: `${rootDir}/src/apexcharts.js`,
      dest: `${e2eSamplesDir}/apexcharts.e2e.js`,
      format: 'umd',
      env: 'development',
      istanbul: true,
    })
  }

  let numCompleted = 0
  const failedTests = [] // {path, error}

  // Build a list of samples to process
  let samples = extractSampleInfo()
  if (paths.length === 0) {
    paths = ['all']
  }
  if (paths.includes('all')) {
    if (command === 'update') {
      fs.emptyDir(`${e2eDir}/snapshots`)
    }
  } else {
    samples = samples.filter((sample) =>
      paths.includes(`${sample.dirName}/${sample.fileName}`)
    )
  }

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_BROWSER,
    maxConcurrency: os.availableParallelism(),
  })

  await cluster.task(async ({ page, data: sample }) => {
    if (process.stdout.isTTY) {
      process.stdout.clearLine()
      process.stdout.cursorTo(0)
      const percentComplete = Math.round((100 * numCompleted) / samples.length)
      process.stdout.write(`Processing samples: ${percentComplete}%`)
    }

    // BUG: some chart are animated - need special processing. Some just need to be skipped.

    // Make tests independent on machine timezone
    await page.emulateTimezone('Europe/London')

    try {
      await processSample(page, sample, command)
    } catch (e) {
      failedTests.push({
        path: `${sample.dirName}/${sample.fileName}`,
        error: e,
      })
    }
    numCompleted++
    if (!process.stdout.isTTY) {
      console.log(`Processed samples: ${numCompleted}/${samples.length}`)
    }
  })

  for (const sample of samples) {
    cluster.queue(sample)
  }

  await cluster.idle()
  await cluster.close()

  if (process.stdout.isTTY) {
    process.stdout.clearLine()
  } else {
    console.log('All samples have now been processed')
  }

  console.log('')

  if (command === 'test') {
    const duration = Math.round((Date.now() - startTime) / 1000)
    console.log(
      chalk.green.bold(`${samples.length} tests completed in ${duration} sec.`)
    )

    if (failedTests.length > 0) {
      console.log(chalk.red.bold(`${failedTests.length} tests failed`))
    }
  }

  for (const failedTest of failedTests) {
    console.log('')
    console.log(
      chalk.red.bold(`${failedTest.path}: ${failedTest.error.message}`)
    )

    if (!failedTest.error.hideStack) {
      console.log(failedTest.error.stack.split('\n').slice(1).join('\n'))
    }
  }

  if (command === 'test') {
    const { status } = spawnSync(
      `${rootDir}/node_modules/.bin/nyc`,
      ['report', '--reporter=html'],
      { cwd: rootDir, shell: process.platform === 'win32' }
    )

    if (status === 0) {
      console.log('')
      console.log(`Code coverage report was generated at coverage/index.html`)
    } else {
      throw new Error('Code coverage report failed to generate')
    }
  }
}

// Run as 'node samples.js <command> <path1> <path2> ...'
// Supports two commands:
// - 'test' for running e2e tests
// - 'update' for updating samples screenshots used for e2e tests comparison
// Path options have the format 'bar/basic-bar'. Paths are optional for 'test' command.
// For 'update' command 'all' path can be used to update all screenshots.
const command = process.argv[2]
if (['update', 'test'].includes(command)) {
  processSamples(command, process.argv.slice(3))
    .catch((e) => console.log(e))
    .then(() => {
      if (browser) {
        return browser.close()
      }
    })
}

// chartVisualTest('bubble', 'simple-bubble', true, async (page) => {
//   const paths = await page.$('.apexcharts-bubble-series')

//   const attrCX = await paths.$$eval('circle', (nodes) =>
//     nodes.map((n) => n.getAttribute('cx'))
//   )

//   attrCX.forEach((cx) => {
//     expect(cx).toEqual(expect.not.stringContaining('NaN'))
//   })

//   // BUG: not for every chart
//   const attrCY = await paths.$$eval('circle', (nodes) =>
//     nodes.map((n) => n.getAttribute('cy'))
//   )

//   attrCY.forEach((cy) => {
//     expect(cy).toEqual(expect.not.stringContaining('NaN'))
//   })
// })
