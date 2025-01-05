#!/usr/bin/env node

'use strict';

const fs = require(`fs`);
const getPkgRepo = require(`../`);
const through = require(`through2`);
const util = require(`util`);

const yargs = require('yargs/yargs')(process.argv.slice(2))
  .usage(
    '\nPractice writing repository URL or validate the repository in a package.json file. If used without specifying a package.json file path, you will enter an interactive shell. Otherwise, the repository info in package.json is printed.'
  )
  .scriptName('get-pkg-repo')
  .command('$0')
  .command('<path> [<path> ...]')
  .example('get-pkg-repo')
  .example('get-pkg-repo package.json')
  .example('cat package.json | get-pkg-repo')
  .help().argv;

const input = yargs._;

if (process.stdin.isTTY) {
  if (input.length > 0) {
    input.forEach(path => {
      let repo;
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        try {
          repo = getPkgRepo(JSON.parse(data));
          console.log(repo);
        } catch (e) {
          console.error(`${path}: ${e.toString()}`);
        }
      });
    });
  } else {
    process.stdin
      .pipe(
        through.obj((chunk, enc, cb) => {
          let repo;
          const pkgData = {
            repository: chunk.toString(),
          };

          try {
            repo = getPkgRepo(pkgData);
            cb(null, util.format(repo) + '\n');
          } catch (e) {
            console.error(e.toString());
            cb();
          }
        })
      )
      .pipe(process.stdout);
  }
} else {
  process.stdin
    .pipe(
      through.obj((chunk, enc, cb) => {
        let repo;
        try {
          repo = getPkgRepo(JSON.parse(chunk.toString()));
        } catch (e) {
          console.error(e.toString());
          process.exit(1);
        }
        cb(null, util.format(repo) + '\n');
      })
    )
    .pipe(process.stdout);
}
