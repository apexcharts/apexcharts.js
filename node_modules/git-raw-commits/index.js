'use strict'

const dargs = require('dargs')
const execFile = require('child_process').execFile
const split = require('split2')
const { Readable, Transform } = require('stream')

const DELIMITER = '------------------------ >8 ------------------------'

function normalizeExecOpts (execOpts) {
  execOpts = execOpts || {}
  execOpts.cwd = execOpts.cwd || process.cwd()
  return execOpts
}

function normalizeGitOpts (gitOpts) {
  gitOpts = gitOpts || {}
  gitOpts.format = gitOpts.format || '%B'
  gitOpts.from = gitOpts.from || ''
  gitOpts.to = gitOpts.to || 'HEAD'
  return gitOpts
}

function getGitArgs (gitOpts) {
  const gitFormat = `--format=${gitOpts.format || ''}%n${DELIMITER}`
  const gitFromTo = [gitOpts.from, gitOpts.to].filter(Boolean).join('..')

  const gitArgs = ['log', gitFormat, gitFromTo]
    .concat(dargs(gitOpts, {
      excludes: ['debug', 'from', 'to', 'format', 'path']
    }))

  // allow commits to focus on a single directory
  // this is useful for monorepos.
  if (gitOpts.path) {
    gitArgs.push('--', gitOpts.path)
  }

  return gitArgs
}

function gitRawCommits (rawGitOpts, rawExecOpts) {
  const readable = new Readable()
  readable._read = function () {}

  const gitOpts = normalizeGitOpts(rawGitOpts)
  const execOpts = normalizeExecOpts(rawExecOpts)
  const args = getGitArgs(gitOpts)

  if (gitOpts.debug) {
    gitOpts.debug('Your git-log command is:\ngit ' + args.join(' '))
  }

  let isError = false

  const child = execFile('git', args, {
    cwd: execOpts.cwd,
    maxBuffer: Infinity
  })

  child.stdout
    .pipe(split(DELIMITER + '\n'))
    .pipe(
      new Transform({
        transform (chunk, enc, cb) {
          readable.push(chunk)
          isError = false

          cb()
        },
        flush (cb) {
          setImmediate(function () {
            if (!isError) {
              readable.push(null)
              readable.emit('close')
            }

            cb()
          })
        }
      })
    )

  child.stderr
    .pipe(
      new Transform({
        objectMode: true,
        highWaterMark: 16,
        transform (chunk) {
          isError = true
          readable.emit('error', new Error(chunk))
          readable.emit('close')
        }
      })
    )

  return readable
}

module.exports = gitRawCommits
