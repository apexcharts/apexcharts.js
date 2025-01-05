'use strict'

const proc = require('process')
const exec = require('child_process').exec
const semverValid = require('semver').valid
const regex = /tag:\s*(.+?)[,)]/gi
const cmd = 'git log --decorate --no-color'
const unstableTagTest = /.+-\w+\.\d+$/

function lernaTag (tag, pkg) {
  if (pkg && !(new RegExp('^' + pkg + '@')).test(tag)) {
    return false
  } else {
    return /^.+@[0-9]+\.[0-9]+\.[0-9]+(-.+)?$/.test(tag)
  }
}

module.exports = function gitSemverTags (opts, callback) {
  if (typeof opts === 'function') {
    callback = opts
    opts = {}
  }
  const options = Object.assign({ maxBuffer: Infinity, cwd: proc.cwd() }, opts)

  if (options.package && !options.lernaTags) {
    callback(new Error('opts.package should only be used when running in lerna mode'))
    return
  }

  exec(cmd, options, function (err, data) {
    if (err) {
      callback(err)
      return
    }

    const tags = []
    let tagPrefixRegexp
    if (options.tagPrefix) {
      tagPrefixRegexp = new RegExp('^' + options.tagPrefix + '(.*)')
    }
    data.split('\n').forEach(function (decorations) {
      let match
      while ((match = regex.exec(decorations))) {
        const tag = match[1]

        if (options.skipUnstable && unstableTagTest.test(tag)) {
          // skip unstable tag
          continue
        }

        if (options.lernaTags) {
          if (lernaTag(tag, options.package)) {
            tags.push(tag)
          }
        } else if (options.tagPrefix) {
          const matches = tag.match(tagPrefixRegexp)
          if (matches && semverValid(matches[1])) {
            tags.push(tag)
          }
        } else if (semverValid(tag)) {
          tags.push(tag)
        }
      }
    })

    callback(null, tags)
  })
}
