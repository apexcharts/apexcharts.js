'use strict'

const { Transform } = require('stream')
const parser = require('./lib/parser')
const regex = require('./lib/regex')

function assignOpts (options) {
  options = {
    headerPattern: /^(\w*)(?:\(([\w$.\-*/ ]*)\))?: (.*)$/,
    headerCorrespondence: ['type', 'scope', 'subject'],
    referenceActions: [
      'close',
      'closes',
      'closed',
      'fix',
      'fixes',
      'fixed',
      'resolve',
      'resolves',
      'resolved'
    ],
    issuePrefixes: ['#'],
    noteKeywords: ['BREAKING CHANGE', 'BREAKING-CHANGE'],
    fieldPattern: /^-(.*?)-$/,
    revertPattern: /^Revert\s"([\s\S]*)"\s*This reverts commit (\w*)\./,
    revertCorrespondence: ['header', 'hash'],
    warn: function () {},
    mergePattern: null,
    mergeCorrespondence: null,
    ...options
  }

  if (typeof options.headerPattern === 'string') {
    options.headerPattern = new RegExp(options.headerPattern)
  }

  if (typeof options.headerCorrespondence === 'string') {
    options.headerCorrespondence = options.headerCorrespondence.split(',')
  }

  if (typeof options.referenceActions === 'string') {
    options.referenceActions = options.referenceActions.split(',')
  }

  if (typeof options.issuePrefixes === 'string') {
    options.issuePrefixes = options.issuePrefixes.split(',')
  }

  if (typeof options.noteKeywords === 'string') {
    options.noteKeywords = options.noteKeywords.split(',')
  }

  if (typeof options.fieldPattern === 'string') {
    options.fieldPattern = new RegExp(options.fieldPattern)
  }

  if (typeof options.revertPattern === 'string') {
    options.revertPattern = new RegExp(options.revertPattern)
  }

  if (typeof options.revertCorrespondence === 'string') {
    options.revertCorrespondence = options.revertCorrespondence.split(',')
  }

  if (typeof options.mergePattern === 'string') {
    options.mergePattern = new RegExp(options.mergePattern)
  }

  return options
}

function conventionalCommitsParser (options) {
  options = assignOpts(options)
  const reg = regex(options)

  return new Transform({
    objectMode: true,
    highWaterMark: 16,
    transform (data, enc, cb) {
      let commit

      try {
        commit = parser(data.toString(), options, reg)
        cb(null, commit)
      } catch (err) {
        if (options.warn === true) {
          cb(err)
        } else {
          options.warn(err.toString())
          cb(null, '')
        }
      }
    }
  })
}

function sync (commit, options) {
  options = assignOpts(options)
  const reg = regex(options)

  return parser(commit, options, reg)
}

module.exports = conventionalCommitsParser
module.exports.sync = sync
