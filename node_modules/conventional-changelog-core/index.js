'use strict'

const addStream = require('add-stream')
const gitRawCommits = require('git-raw-commits')
const conventionalCommitsParser = require('conventional-commits-parser')
const conventionalChangelogWriter = require('conventional-changelog-writer')
const { Readable, Transform } = require('stream')
const { execFileSync } = require('child_process')

const mergeConfig = require('./lib/merge-config')
function conventionalChangelog (options, context, gitRawCommitsOpts, parserOpts, writerOpts, gitRawExecOpts) {
  writerOpts = writerOpts || {}

  const readable = new Readable({
    objectMode: writerOpts.includeDetails
  })
  readable._read = function () { }

  let commitsErrorThrown = false

  let commitsStream = new Readable({
    objectMode: true
  })
  commitsStream._read = function () { }

  function commitsRange (from, to) {
    return gitRawCommits({
      ...gitRawCommitsOpts,
      from: from,
      to: to
    })
      .on('error', function (err) {
        if (!commitsErrorThrown) {
          setImmediate(commitsStream.emit.bind(commitsStream), 'error', err)
          commitsErrorThrown = true
        }
      })
  }

  mergeConfig(options, context, gitRawCommitsOpts, parserOpts, writerOpts, gitRawExecOpts)
    .then(function (data) {
      options = data.options
      context = data.context
      gitRawCommitsOpts = data.gitRawCommitsOpts
      parserOpts = data.parserOpts
      writerOpts = data.writerOpts
      gitRawExecOpts = data.gitRawExecOpts

      try {
        execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
          stdio: 'ignore'
        })
        let reverseTags = context.gitSemverTags.slice(0).reverse()
        reverseTags.push('HEAD')

        if (gitRawCommitsOpts.from) {
          if (reverseTags.indexOf(gitRawCommitsOpts.from) !== -1) {
            reverseTags = reverseTags.slice(reverseTags.indexOf(gitRawCommitsOpts.from))
          } else {
            reverseTags = [gitRawCommitsOpts.from, 'HEAD']
          }
        }

        let streams = reverseTags.map((to, i) => {
          const from = i > 0
            ? reverseTags[i - 1]
            : ''
          return commitsRange(from, to)
        })

        if (gitRawCommitsOpts.from) {
          streams = streams.splice(1)
        }

        if (gitRawCommitsOpts.reverse) {
          streams.reverse()
        }

        streams.reduce((prev, next) => next.pipe(addStream(prev)))
          .on('data', function (data) {
            setImmediate(commitsStream.emit.bind(commitsStream), 'data', data)
          })
          .on('end', function () {
            setImmediate(commitsStream.emit.bind(commitsStream), 'end')
          })
      } catch (_e) {
        commitsStream = gitRawCommits(gitRawCommitsOpts, gitRawExecOpts)
      }

      commitsStream
        .on('error', function (err) {
          err.message = 'Error in git-raw-commits: ' + err.message
          setImmediate(readable.emit.bind(readable), 'error', err)
        })
        .pipe(conventionalCommitsParser(parserOpts))
        .on('error', function (err) {
          err.message = 'Error in conventional-commits-parser: ' + err.message
          setImmediate(readable.emit.bind(readable), 'error', err)
        })
        // it would be better if `gitRawCommits` could spit out better formatted data
        // so we don't need to transform here
        .pipe(
          new Transform({
            objectMode: true,
            highWaterMark: 16,
            transform (chunk, enc, cb) {
              try {
                options.transform.call(this, chunk, cb)
              } catch (err) {
                cb(err)
              }
            }
          })
        )
        .on('error', function (err) {
          err.message = 'Error in options.transform: ' + err.message
          setImmediate(readable.emit.bind(readable), 'error', err)
        })
        .pipe(conventionalChangelogWriter(context, writerOpts))
        .on('error', function (err) {
          err.message = 'Error in conventional-changelog-writer: ' + err.message
          setImmediate(readable.emit.bind(readable), 'error', err)
        })
        .pipe(
          new Transform({
            objectMode: writerOpts.includeDetails,
            transform (chunk, enc, cb) {
              try {
                readable.push(chunk)
              } catch (err) {
                setImmediate(function () {
                  throw err
                })
              }

              cb()
            },
            flush (cb) {
              readable.push(null)

              cb()
            }
          })
        )
    })
    .catch(function (err) {
      setImmediate(readable.emit.bind(readable), 'error', err)
    })

  return readable
}

module.exports = conventionalChangelog
