'use strict';

var path = require('path');
var os = require('os');
var TextDecoder = require('util').TextDecoder;

var fs = require('graceful-fs');
var Readable = require('streamx').Readable;
var Transform = require('streamx').Transform;
var nal = require('now-and-later');
var File = require('vinyl');
var convert = require('convert-source-map');

var urlRegex = /^(https?|webpack(-[^:]+)?):\/\//;

var bufCR = Buffer.from('\r');
var bufCRLF = Buffer.from('\r\n');
var bufLF = Buffer.from('\n');
var bufEOL = Buffer.from(os.EOL);

var decoder = new TextDecoder('utf-8', { ignoreBOM: false });

function isRemoteSource(source) {
  return source.match(urlRegex);
}

function parse(data) {
  try {
    return JSON.parse(decoder.decode(data));
  } catch (err) {
    // TODO: should this log a debug?
  }
}

function loadSourceMap(file, state, callback) {
  // Try to read inline source map
  state.map = convert.fromSource(state.content);

  if (state.map) {
    state.map = state.map.toObject();
    // Sources in map are relative to the source file
    state.path = file.dirname;
    state.content = convert.removeComments(state.content);
    // Remove source map comment from source
    if (file.isStream()) {
      file.contents = Readable.from(state.content);
    } else {
      file.contents = Buffer.from(state.content, 'utf8');
    }
    return callback();
  }

  // Look for source map comment referencing a source map file
  var mapComment = convert.mapFileCommentRegex.exec(state.content);

  var mapFile;
  if (mapComment) {
    mapFile = path.resolve(file.dirname, mapComment[1] || mapComment[2]);
    state.content = convert.removeMapFileComments(state.content);
    // Remove source map comment from source
    if (file.isStream()) {
      file.contents = Readable.from(state.content);
    } else {
      file.contents = Buffer.from(state.content, 'utf8');
    }
  } else {
    // If no comment try map file with same name as source file
    mapFile = file.path + '.map';
  }

  // Sources in external map are relative to map file
  state.path = path.dirname(mapFile);

  fs.readFile(mapFile, onRead);

  function onRead(err, data) {
    if (err) {
      return callback();
    }
    state.map = parse(data);
    callback();
  }
}

// Fix source paths and sourceContent for imported source map
function fixImportedSourceMap(file, state, callback) {
  if (!state.map) {
    return callback();
  }

  state.map.sourcesContent = state.map.sourcesContent || [];

  nal.map(state.map.sources, normalizeSourcesAndContent, callback);

  function assignSourcesContent(sourceContent, idx) {
    state.map.sourcesContent[idx] = sourceContent;
  }

  function normalizeSourcesAndContent(sourcePath, idx, cb) {
    var sourceRoot = state.map.sourceRoot || '';
    var sourceContent = state.map.sourcesContent[idx] || null;

    if (isRemoteSource(sourcePath)) {
      assignSourcesContent(sourceContent, idx);
      return cb();
    }

    if (state.map.sourcesContent[idx]) {
      return cb();
    }

    if (sourceRoot && isRemoteSource(sourceRoot)) {
      assignSourcesContent(sourceContent, idx);
      return cb();
    }

    var basePath = path.resolve(file.base, sourceRoot);
    var absPath = path.resolve(state.path, sourceRoot, sourcePath);
    var relPath = path.relative(basePath, absPath);
    var unixRelPath = normalizeRelpath(relPath);

    state.map.sources[idx] = unixRelPath;

    if (absPath !== file.path) {
      // Load content from file async
      return fs.readFile(absPath, onRead);
    }

    // If current file: use content
    assignSourcesContent(state.content, idx);
    cb();

    function onRead(err, data) {
      if (err) {
        assignSourcesContent(null, idx);
        return cb();
      }
      assignSourcesContent(decoder.decode(data), idx);
      cb();
    }
  }
}

function mapsLoaded(file, state, callback) {
  if (!state.map) {
    state.map = {
      version: 3,
      names: [],
      mappings: '',
      sources: [normalizeRelpath(file.relative)],
      sourcesContent: [state.content],
    };
  }

  state.map.file = normalizeRelpath(file.relative);
  file.sourceMap = state.map;

  callback();
}

function addSourceMaps(file, state, callback) {
  var tasks = [loadSourceMap, fixImportedSourceMap, mapsLoaded];

  function apply(fn, key, cb) {
    fn(file, state, cb);
  }

  nal.mapSeries(tasks, apply, done);

  function done() {
    callback(null, file);
  }
}

/* Write Helpers */
function createSourceMapFile(opts) {
  return new File({
    cwd: opts.cwd,
    base: opts.base,
    path: opts.path,
    contents: Buffer.from(JSON.stringify(opts.content)),
    stat: {
      isFile: function () {
        return true;
      },
      isDirectory: function () {
        return false;
      },
      isBlockDevice: function () {
        return false;
      },
      isCharacterDevice: function () {
        return false;
      },
      isSymbolicLink: function () {
        return false;
      },
      isFIFO: function () {
        return false;
      },
      isSocket: function () {
        return false;
      },
    },
  });
}

var needsMultiline = ['.css'];

function getCommentOptions(extname) {
  var opts = {
    multiline: needsMultiline.indexOf(extname) !== -1,
  };

  return opts;
}

function writeSourceMaps(file, destPath, callback) {
  var sourceMapFile;
  var commentOpts = getCommentOptions(file.extname);

  var comment;
  if (destPath == null) {
    // Encode source map into comment
    comment = convert.fromObject(file.sourceMap).toComment(commentOpts);
  } else {
    var mapFile = path.join(destPath, file.relative) + '.map';
    var sourceMapPath = path.join(file.base, mapFile);

    // Create new sourcemap File
    sourceMapFile = createSourceMapFile({
      cwd: file.cwd,
      base: file.base,
      path: sourceMapPath,
      content: file.sourceMap,
    });

    var sourcemapLocation = path.relative(file.dirname, sourceMapPath);

    sourcemapLocation = normalizeRelpath(sourcemapLocation);

    comment = convert.generateMapFileComment(sourcemapLocation, commentOpts);
  }

  // Append source map comment
  file = append(file, Buffer.from(comment));

  callback(null, file, sourceMapFile);
}

function append(file, comment) {
  if (file.isBuffer()) {
    file.contents = appendBuffer(file.contents, comment);
  }

  if (file.isStream()) {
    file.contents = file.contents.pipe(appendStream(comment));
  }

  return file;
}

function appendBuffer(buf1, buf2) {
  var eol;
  if (buf1.slice(-2).equals(bufCRLF)) {
    eol = bufCRLF;
  } else if (buf1.slice(-1).equals(bufLF)) {
    eol = bufLF;
  } else if (buf1.slice(-1).equals(bufCR)) {
    eol = bufCR;
  } else {
    eol = bufEOL;
  }
  return Buffer.concat([buf1, buf2, eol]);
}

// Implementation heavily inspired by https://github.com/maxogden/eol-stream
function appendStream(comment) {
  var crAtEnd = false;
  var eol = bufEOL;

  return new Transform({
    transform: detect,
    flush: flush,
  });

  function detect(chunk, callback) {
    var isString = typeof chunk === 'string';

    var cr = isString ? bufCR.toString() : bufCR[0];
    var lf = isString ? bufLF.toString() : bufLF[0];

    if (crAtEnd) {
      if (chunk[0] === lf) {
        eol = bufCRLF;
      } else {
        eol = bufCR;
      }
      // Reset the flag because we search for the _last_ line ending
      crAtEnd = false;
      return callback(null, chunk);
    }

    var i = 0;
    while (i < chunk.length) {
      if (chunk[i] === cr) {
        if (i === chunk.length - 1) {
          // Need to read the next chunk to see if it is a CRLF
          crAtEnd = true;
          i += 1;
        } else if (chunk[i + 1] === lf) {
          eol = bufCRLF;
          // We skip two because we saw the CRLF
          i += 2;
        } else {
          eol = bufCR;
          i += 1;
        }
        continue;
      }

      if (chunk[i] === lf) {
        eol = bufLF;
      }

      i += 1;
    }

    callback(null, chunk);
  }

  function flush(cb) {
    this.push(comment);
    this.push(eol);

    cb();
  }
}

function normalizeRelpath(fp) {
  // Since we only ever operate on relative paths,
  // this utility shouldn't need to handle path roots
  return path.posix.normalize(fp.replace(/\\/g, '/'));
}

module.exports = {
  addSourceMaps: addSourceMaps,
  writeSourceMaps: writeSourceMaps,
};
