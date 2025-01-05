#!/usr/bin/env node
'use strict'
const conventionalChangelogWriter = require('./')
const fs = require('fs')
const meow = require('meow')
const path = require('path')
const split = require('split')

const cli = meow(`
    Usage
      conventional-changelog-writer <path> [<path> ...]
      cat <path> | conventional-changelog-writer
    ,
    Example
      conventional-changelog-writer commits.ldjson
      cat commits.ldjson | conventional-changelog-writer
    ,
    Options
      -c, --context    A filepath of a json that is used to define template variables
      -o, --options    A filepath of a javascript object that is used to define options
`, {
  flags: {
    context: {
      alias: 'c',
      type: 'string'
    },
    options: {
      alias: 'o',
      type: 'string'
    }
  }
})

const flags = cli.flags
const filePaths = cli.input
const length = filePaths.length

let templateContext
const contextPath = flags.context
if (contextPath) {
  try {
    templateContext = require(path.resolve(process.cwd(), contextPath))
  } catch (err) {
    console.error('Failed to get context from file ' + contextPath + '\n' + err)
    process.exit(1)
  }
}

let options
const optionsPath = flags.options
if (optionsPath) {
  try {
    options = require(path.resolve(process.cwd(), optionsPath))
  } catch (err) {
    console.error('Failed to get options from file ' + optionsPath + '\n' + err)
    process.exit(1)
  }
}

let stream
try {
  stream = conventionalChangelogWriter(templateContext, options)
} catch (err) {
  console.error(err.toString())
  process.exit(1)
}

function processFile (fileIndex) {
  const filePath = filePaths[fileIndex]
  fs.createReadStream(filePath)
    .on('error', function (err) {
      console.warn('Failed to read file ' + filePath + '\n' + err)
      if (++fileIndex < length) {
        processFile(fileIndex)
      }
    })
    .pipe(split(JSON.parse))
    .on('error', function (err) {
      console.warn('Failed to split commits in file ' + filePath + '\n' + err)
    })
    .pipe(stream)
    .on('error', function (err) {
      console.warn('Failed to process file ' + filePath + '\n' + err)
      if (++fileIndex < length) {
        processFile(fileIndex)
      }
    })
    .on('end', function () {
      if (++fileIndex < length) {
        processFile(fileIndex)
      }
    })
    .pipe(process.stdout)
}

if (!process.stdin.isTTY) {
  process.stdin
    .pipe(split(JSON.parse))
    .on('error', function (err) {
      console.error('Failed to split commits\n' + err)
      process.exit(1)
    })
    .pipe(stream)
    .on('error', function (err) {
      console.error('Failed to process file\n' + err)
      process.exit(1)
    })
    .pipe(process.stdout)
} else if (length === 0) {
  console.error('You must specify at least one line delimited json file')
  process.exit(1)
} else {
  processFile(0)
}
