const fs = require('fs-extra')
const JSZip = require('jszip')
const needle = require('needle')
const path = require('path')

async function extractSamples() {
  const response = await needle(
    'get',
    'https://codeload.github.com/apexcharts/apexcharts.js/zip/master'
  )
  const zip = await JSZip.loadAsync(response.body)

  function extractXmlSection(content, name) {
    if (!content.includes(`<${name}>`)) return ''
    return content
      .slice(
        content.indexOf(`<${name}>`) + name.length + 2,
        content.indexOf(`</${name}>`)
      )
      .trim()
  }

  function indent(str, indent) {
    return str
      .split('\n')
      .map((line, index) => (index > 0 ? ' '.repeat(indent) + line : line))
      .join('\n')
  }

  const samples = {} // {[groupName]: [{name, title}]}
  const promises = []
  zip.folder('apexcharts.js-master/samples/source').forEach((relPath, file) => {
    if (relPath.endsWith('.xml') && relPath.includes('/')) {
      promises.push(
        file.async('text').then((content) => {
          // Skip samples using non-trivial features (single chart, no custom html or scripts)
          const skip = [
            '<html>',
            '<vanilla-js-script>',
            '<react-script>',
            '<vue-script>'
          ].some((chunk) => content.includes(chunk))
          if (skip || content.split('<chart>').length >= 3) return

          // BUG: later support charts with custom <scripts>
          if (content.includes('<scripts>')) return

          const [groupName, sampleName] = relPath.split('/')
          samples[groupName] = samples[groupName] || []
          samples[groupName].push({
            name: sampleName.slice(0, -4),
            title: extractXmlSection(content, 'title'),
            options:
              `{\n` +
              `  series: ${indent(
                extractXmlSection(content, 'series'),
                2
              )},\n` +
              `  ${indent(extractXmlSection(content, 'options'), 2)}\n` +
              `}`
          })
        })
      )
    }
  })
  await Promise.all(promises)

  // Retrieve a list of npm library versions
  const npmPackageName = 'apexcharts'
  const res = await needle(
    'get',
    `https://registry.npmjs.org/${npmPackageName}`
  )
  const versions = Object.keys(res.body.versions).reverse()

  fs.writeJsonSync(
    path.join(__dirname, 'app', 'apexcharts-playground', 'data.json'),
    { samples, versions },
    { spaces: 2 }
  )
}

extractSamples().catch(console.log)
