#!/usr/bin/env node
'use strict'
const meow = require('meow')
const gitRawCommits = require('./')

const cli = meow(`
  Usage
    git-raw-commits [<git-log(1)-options>]

  Example
    git-raw-commits --from HEAD~2 --to HEAD^`
)

gitRawCommits(cli.flags)
  .on('error', function (err) {
    process.stderr.write(err)
    process.exit(1)
  })
  .pipe(process.stdout)
