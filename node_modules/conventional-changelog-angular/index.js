'use strict'

const { createParserOpts } = require('./parserOpts')
const { createWriterOpts } = require('./writerOpts')
const { createConventionalChangelogOpts } = require('./conventionalChangelog')
const { createConventionalRecommendedBumpOpts } = require('./conventionalRecommendedBump')

async function createPreset () {
  const parserOpts = createParserOpts()
  const writerOpts = await createWriterOpts()
  const recommendedBumpOpts = createConventionalRecommendedBumpOpts(parserOpts)
  const conventionalChangelog = createConventionalChangelogOpts(parserOpts, writerOpts)

  return {
    parserOpts,
    writerOpts,
    recommendedBumpOpts,
    conventionalChangelog
  }
}

module.exports = createPreset
