const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const chokidar = require('chokidar');
const glob = require('glob');
const globParent = require('glob-parent');
const { name } = require('./package.json');

require('colors');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const deleteAsync = promisify(fs.unlink);

const createDirIfNotExist = to => {
  const dirs = [];
  let dir = path.dirname(to);

  while (dir !== path.dirname(dir)) {
    dirs.unshift(dir);
    dir = path.dirname(dir);
  }

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  });
};

const findDestination = (from, entry) => path.join(entry.dest, path.relative(globParent(entry.files), from));

module.exports = (paths, { watch = false, verbose = false } = {}) => {
  const copy = async (from, entry) => {
    const to = findDestination(from, entry);

    createDirIfNotExist(to);

    if (!fs.statSync(from).isDirectory()) {
      try {
        await writeFileAsync(to, await readFileAsync(from));

        if (verbose) {
          console.log('[COPY]'.yellow, from, 'to'.yellow, to);
        }
      } catch (e) {
        console.log('[COPY][ERROR]'.red, from);
        console.error(e);
      }
    }
  };

  const remove = async (from, entry) => {
    const to = findDestination(from, entry);
    try {
      await deleteAsync(to);
      if (verbose) {
        console.log('[DELETE]'.yellow, to);
      }
    } catch (e) {
      console.log('[DELETE][ERROR]'.red, to);
      console.error(e);
    }
  };

  let once = true;
  return {
    name,
    buildStart() {
      if (once) {
        once = false;

        if (watch) {
          for (const entry of paths) {
            chokidar.watch(entry.files)
              .on('add', from => copy(from, entry))
              .on('change', from => copy(from, entry))
              .on('unlink', from => remove(from, entry))
              .on('error', e => console.error(e));
          }
        } else {
          for (const entry of paths) {
            glob.sync(entry.files).forEach(file => copy(file, entry));
          }
        }
      }
    }
  };
};
