const fs = require('fs-extra')
const nunjucks = require('nunjucks')
const path = require('path')

const samplesDir = path.join(__dirname, '..')

function extractXMLSections(data, sectionNames, xmlPath) {
  const info = {}
  for (const name of sectionNames) {
    const start = data.indexOf(`<${name}>`)
    const varName = name.replace(/-/g, '_')

    if (start > -1) {
      const end = data.indexOf(`</${name}>`)
      if (end > -1) {
        info[varName] = data.slice(start + name.length + 2, end).trim()
      } else {
        throw new Error(`<${name}> section in ${xmlPath} is not closed`)
      }
    } else {
      info[varName] = ''
    }
  }
  return info
}

function parseSampleXML(xmlPath) {
  const data = fs.readFileSync(xmlPath, 'utf8')

  const globalSections = [
    'title',
    'style',
    'scripts',
    'html',
    'vanilla-js-script',
    'react-state',
    'react-script',
    'vue-data',
    'vue-script'
  ]
  const info = extractXMLSections(data, globalSections, xmlPath)
  info.charts = []

  info.style =
    info.style ||
    `#chart {
  max-width: 650px;
  margin: 35px auto;
}`

  let i = 0
  while (i < data.length) {
    const start = data.indexOf(`<chart>`, i)
    if (start >= 0) {
      const end = data.indexOf(`</chart>`, start)

      if (end > -1) {
        const chartInfo = extractXMLSections(
          data.slice(start + 7, end).trim(),
          ['id', 'options', 'series'],
          xmlPath
        )

        chartInfo.elemId = chartInfo.id
          ? `chart-${chartInfo.id}`
          : chartInfo.length > 0
          ? `chart-${info.charts.length}`
          : 'chart'
        chartInfo.varName =
          chartInfo.id && info.charts.length > 0
            ? chartInfo.id[0].toUpperCase() + chartInfo.id.slice(1)
            : info.charts.length || ''

        // Detect 'chart' option and extract type, height and width from it
        let chartOptionsStart = chartInfo.options.indexOf('chart:')
        chartOptionsStart =
          chartInfo.options.indexOf('{', chartOptionsStart) + 1
        let index = chartOptionsStart
        let openedBrackets = 1
        while (openedBrackets > 0) {
          const char = chartInfo.options[index]
          if (char === '{') {
            openedBrackets++
          } else if (char === '}') {
            openedBrackets--
          }
          index++
        }

        const chartOptions = chartInfo.options.slice(chartOptionsStart, index)
        const heightMatch = chartOptions.match(/height:\s*(\d+)/)
        chartInfo.height = heightMatch ? parseInt(heightMatch[1], 10) : ''

        const widthMatch = chartOptions.match(/width:\s*(\d+)/)
        chartInfo.width = widthMatch ? parseInt(widthMatch[1], 10) : ''

        const typeMatch = chartOptions.match(/type:\s*["']([^"']+)["']/)
        chartInfo.type = typeMatch ? typeMatch[1] : ''

        info.charts.push(chartInfo)
        i = end + 8
      } else {
        throw new Error(`<chart> section in ${xmlPath} is not closed`)
      }
    } else {
      break
    }
  }

  return info
}

function extractSampleInfo() {
  const samples = []
  const sourceDir = path.join(samplesDir, 'source')
  const dirNames = fs.readdirSync(sourceDir)
  for (const dirName of dirNames) {
    // Only iterate over directories
    if (!dirName.includes('.')) {
      const dirPath = path.join(sourceDir, dirName)
      const fileNames = fs.readdirSync(dirPath)
      for (const fileName of fileNames) {
        if (fileName.endsWith('.xml')) {
          const info = parseSampleXML(path.join(dirPath, fileName))
          samples.push({
            dirName,
            fileName: fileName.slice(0, -4),
            info
          })
        }
      }
    }
  }
  return samples
}

// BUG: reuse extractSampleInfo()?
async function generateSampleHtml() {
  const formats = ['vanilla-js', 'react', 'vue']
  for (const format of formats) {
    await fs.remove(path.join(path.join(samplesDir, format)))
  }

  const sourceDir = path.join(samplesDir, 'source')
  const env = nunjucks.configure(sourceDir, {
    autoescape: false,
    noCache: true
  })
  env.addFilter('indent', (str, indent) => {
    return str
      .split('\n')
      .map((line, index) => {
        return index > 0 ? ' '.repeat(indent) + line : line
      })
      .join('\n')
  })

  const dirNames = await fs.promises.readdir(sourceDir)
  for (const dirName of dirNames) {
    if (dirName.includes('.')) {
      continue
    }

    const dirPath = path.join(sourceDir, dirName)
    const fileNames = await fs.promises.readdir(dirPath)
    for (const fileName of fileNames) {
      if (fileName.endsWith('.xml')) {
        const info = parseSampleXML(path.join(dirPath, fileName))

        for (const format of formats) {
          // If any format-specific script section is present only generate html for these formats
          if (
            formats.some((fmt) => info[`${fmt.replace('-', '_')}_script`]) &&
            !info[`${format.replace('-', '_')}_script`]
          ) {
            continue
          }

          const ctx = { format }
          Object.assign(ctx, info)

          const template = ctx.html || '{{ charts[0] }}'

          const charts = {}
          for (let i = 0; i < info.charts.length; i++) {
            const chart = info.charts[i]
            let chartHtml

            const brackets = format === 'react' ? ['{', '}'] : ['"', '"']

            let attrs = ''
            if (chart.height) {
              attrs += `height=${brackets[0]}${chart.height}${brackets[1]} `
            }
            if (chart.width) {
              attrs += `width=${brackets[0]}${chart.width}${brackets[1]} `
            }

            if (format === 'vanilla-js') {
              chartHtml = `<div id="${chart.elemId}"></div>`
            } else if (format === 'react') {
              chartHtml =
                `<div id="${chart.elemId}">\n` +
                `  <ReactApexChart options={this.state.options${chart.varName}} series={this.state.series${chart.varName}} type="${chart.type}" ${attrs}/>\n` +
                `</div>`
            } else if (format === 'vue') {
              if (info.vue_script.includes('.$refs')) {
                attrs += `ref="chart${chart.varName}" `
              }

              chartHtml =
                `<div id="${chart.elemId}">\n` +
                `  <apexchart type="${chart.type}" ${attrs}:options="chartOptions${chart.varName}" :series="series${chart.varName}"></apexchart>\n` +
                `</div>`
            }

            charts[i] = chartHtml
            if (chart.id) {
              charts[chart.id] = chartHtml
            }
          }

          ctx.html = env.renderString(template, { format, charts })

          const html = env.render('template.html', ctx)
          const outputDir = path.join(samplesDir, format, dirName)
          await fs.ensureDir(outputDir)
          await fs.promises.writeFile(
            path.join(outputDir, fileName.slice(0, -3) + 'html'),
            html
          )
        }
      } else {
        // Copy non-xml files without any processing
        await fs.copy(
          path.join(dirPath, fileName),
          path.join(samplesDir, 'vanilla-js', dirName, fileName)
        )
      }
    }
  }
}

if (process.argv.includes('generate')) {
  generateSampleHtml().catch((e) => console.log(e))
}

module.exports = { extractSampleInfo, generateSampleHtml }
