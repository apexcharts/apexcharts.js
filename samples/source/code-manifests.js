const prettier = require('prettier')

/**
 * Builds the `<sample>.code.json` display manifest that accompanies each
 * generated sample html file. The manifest carries the code the website
 * shows to users (tabs: one entry per file), which is intentionally NOT the
 * same artifact as the runnable iframe page: display code is idiomatic
 * (npm imports for react/vue, no e2e seed shim, no license or iframe glue)
 * and split into the files a user would actually create in their project.
 */

const PRETTIER_OPTIONS = {
  semi: false,
  singleQuote: true,
  arrowParens: 'always',
  printWidth: 80,
}

const APEXCHARTS_CDN = 'https://cdn.jsdelivr.net/npm/apexcharts'

async function fmt(code, parser, label) {
  try {
    const formatted = await prettier.format(code, {
      ...PRETTIER_OPTIONS,
      parser,
    })
    return formatted.replace(/\n+$/, '\n')
  } catch (e) {
    console.warn(`prettier (${parser}) failed for ${label}: ${e.message}`)
    return code.trim() + '\n'
  }
}

function dedent(text) {
  const lines = text.replace(/^\n+|\n+$/g, '').split('\n')
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => (l.match(/^[ \t]*/) || [''])[0].length)
  const min = indents.length ? Math.min(...indents) : 0
  return lines.map((l) => l.slice(min)).join('\n')
}

/**
 * The <scripts> xml section is raw head html: external <script src>/<link>
 * tags plus inline helper scripts (data generators, registerSeriesType, ...).
 * Externals stay tags (vanilla index.html head, comments elsewhere); inline
 * code moves to the top of the displayed js file.
 */
/**
 * Sample-local assets (../../assets/foo.js) are served publicly under
 * https://apexcharts.com/samples/assets/, so displayed code points there
 * and works when copied out of the site.
 */
function rewriteAssetUrl(url) {
  const m = url.match(/^(?:\.\.\/)+assets\/(.+)$/)
  return m ? `https://apexcharts.com/samples/assets/${m[1]}` : url
}

function rewriteTagUrls(tag) {
  return tag.replace(
    /\b(src|href)\s*=\s*"([^"]+)"/g,
    (_, attr, url) => `${attr}="${rewriteAssetUrl(url)}"`
  )
}

function parseScriptsSection(raw) {
  const externals = []
  const inline = []
  if (raw) {
    const linkMatches = raw.match(/<link\b[^>]*>/g) || []
    externals.push(...linkMatches.map(rewriteTagUrls))

    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g
    let m
    while ((m = re.exec(raw)) !== null) {
      if (/\bsrc\s*=/.test(m[1])) {
        externals.push(rewriteTagUrls(`<script${m[1]}></script>`))
      } else if (m[2].trim()) {
        inline.push(dedent(m[2]))
      }
    }
  }
  return { externals, inlineCode: inline.join('\n\n') }
}

/**
 * Inside displayed js/jsx/vue code, external deps become plain-url comments.
 * Never embed the raw tag here: a literal closing script tag inside an SFC
 * or jsx string breaks html-aware parsers and copied code alike.
 */
function externalsAsComments(externals) {
  if (!externals.length) return ''
  return externals
    .map((tag) => {
      const url = (tag.match(/\b(?:src|href)\s*=\s*"([^"]+)"/) || [])[1] || ''
      return `// This demo also loads: ${url}`
    })
    .join('\n')
}

function vanillaChartInit(chart) {
  return [
    `var options${chart.varName} = {`,
    `series: ${chart.series},`,
    `${chart.options}`,
    `};`,
    ``,
    `var chart${chart.varName} = new ApexCharts(document.querySelector('#${chart.elemId}'), options${chart.varName});`,
    `chart${chart.varName}.render();`,
  ].join('\n')
}

async function buildVanillaFiles(info, renderedHtml, label) {
  const { externals, inlineCode } = parseScriptsSection(info.scripts)

  const js = [
    inlineCode,
    ...info.charts.map(vanillaChartInit),
    info.vanilla_js_script,
  ]
    .filter(Boolean)
    .join('\n\n')

  const indexHtml = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    `<title>${info.title}</title>`,
    '<link href="styles.css" rel="stylesheet" />',
    ...externals,
    `<script src="${APEXCHARTS_CDN}"></script>`,
    '</head>',
    '<body>',
    renderedHtml,
    '',
    '<script src="chart.js"></script>',
    '</body>',
    '</html>',
  ].join('\n')

  return [
    {
      name: 'chart.js',
      language: 'javascript',
      code: await fmt(js, 'babel', `${label} chart.js`),
    },
    {
      name: 'index.html',
      language: 'xml',
      code: await fmt(indexHtml, 'html', `${label} index.html`),
    },
    {
      name: 'styles.css',
      language: 'css',
      code: await fmt(info.style, 'css', `${label} styles.css`),
    },
  ]
}

function reactStateEntries(info) {
  const entries = []
  for (const chart of info.charts) {
    entries.push(`series${chart.varName}: ${chart.series},`)
    entries.push(`options${chart.varName}: {\n${chart.options}\n},`)
  }
  if (info.react_state) entries.push(info.react_state)
  return entries.join('\n')
}

async function buildReactFiles(info, renderedHtml, label) {
  const { externals, inlineCode } = parseScriptsSection(info.scripts)
  const needsApexImport = /\bApexCharts\b/.test(
    inlineCode + (info.react_script || '')
  )

  const jsx = renderedHtml.replace(/\bclass="/g, 'className="')

  const app = [
    `import React from 'react'`,
    `import ReactApexChart from 'react-apexcharts'`,
    ...(needsApexImport ? [`import ApexCharts from 'apexcharts'`] : []),
    `import './styles.css'`,
    '',
    ...(externals.length ? [externalsAsComments(externals), ''] : []),
    ...(inlineCode ? [inlineCode, ''] : []),
    `const ApexChart = () => {`,
    `const [state, setState] = React.useState({`,
    reactStateEntries(info),
    `})`,
    '',
    ...(info.react_script ? [info.react_script, ''] : []),
    `return (`,
    `<div>`,
    jsx,
    `</div>`,
    `)`,
    `}`,
    '',
    `export default ApexChart`,
  ].join('\n')

  return [
    {
      name: 'App.jsx',
      language: 'javascript',
      code: await fmt(app, 'babel', `${label} App.jsx`),
    },
    {
      name: 'styles.css',
      language: 'css',
      code: await fmt(info.style, 'css', `${label} styles.css`),
    },
  ]
}

function vueDataEntries(info) {
  const entries = []
  for (const chart of info.charts) {
    entries.push(`series${chart.varName}: ${chart.series},`)
    entries.push(`chartOptions${chart.varName}: {\n${chart.options}\n},`)
  }
  if (info.vue_data) entries.push(info.vue_data)
  return entries.join('\n')
}

async function buildVueFiles(info, renderedHtml, label) {
  const { externals, inlineCode } = parseScriptsSection(info.scripts)
  const needsApexImport = /\bApexCharts\b/.test(
    inlineCode + (info.vue_script || '')
  )

  const app = [
    `<template>`,
    `<div>`,
    renderedHtml,
    `</div>`,
    `</template>`,
    '',
    `<script>`,
    `import VueApexCharts from 'vue-apexcharts'`,
    ...(needsApexImport ? [`import ApexCharts from 'apexcharts'`] : []),
    '',
    ...(externals.length ? [externalsAsComments(externals), ''] : []),
    ...(inlineCode ? [inlineCode, ''] : []),
    `export default {`,
    `components: {`,
    `apexchart: VueApexCharts,`,
    `},`,
    `data: function () {`,
    `return {`,
    vueDataEntries(info),
    `}`,
    `},`,
    info.vue_script ? `${info.vue_script},` : '',
    `}`,
    `</script>`,
    '',
    `<style>`,
    info.style,
    `</style>`,
  ].join('\n')

  return [
    {
      name: 'App.vue',
      language: 'xml',
      code: await fmt(app, 'vue', `${label} App.vue`),
    },
  ]
}

async function buildCodeManifest(format, info, renderedHtml, label) {
  let files
  if (format === 'vanilla-js') {
    files = await buildVanillaFiles(info, renderedHtml, label)
  } else if (format === 'react') {
    files = await buildReactFiles(info, renderedHtml, label)
  } else if (format === 'vue') {
    files = await buildVueFiles(info, renderedHtml, label)
  } else {
    return null
  }

  return {
    title: info.title,
    files,
  }
}

module.exports = { buildCodeManifest }
