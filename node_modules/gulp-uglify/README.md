# gulp-uglify [![][travis-shield-img]][travis-shield][![][appveyor-shield-img]][appveyor-shield][![][npm-dl-shield-img]][npm-shield][![][npm-v-shield-img]][npm-shield][![][coveralls-shield-img]][coveralls-shield]

> Minify JavaScript with UglifyJS3.

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-uglify`

## Usage

```javascript
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pipeline = require('readable-stream').pipeline;

gulp.task('compress', function () {
  return pipeline(
        gulp.src('lib/*.js'),
        uglify(),
        gulp.dest('dist')
  );
});
```

To help properly handle error conditions with Node streams, this project
recommends the use of
[`pipeline`](https://nodejs.org/docs/latest/api/stream.html#stream_stream_pipeline_streams_callback),
from [`readable-stream`](https://github.com/nodejs/readable-stream).

## Options

Most of the [minify options](https://github.com/mishoo/UglifyJS2#minify-options) from
the UglifyJS API are supported. There are a few exceptions:

1. The `sourceMap` option must not be set, as it will be automatically configured
   based on your Gulp configuration. See the documentation for [Gulp sourcemaps][gulp-sm].

[gulp-sm]: https://github.com/gulp-sourcemaps/gulp-sourcemaps#usage

## Errors

`gulp-uglify` emits an 'error' event if it is unable to minify a specific file.
The GulpUglifyError constructor is exported by this plugin for `instanceof` checks.
It contains the following properties:

- `fileName`: The full file path for the file being minified.
- `cause`: The original UglifyJS error, if available.

Most UglifyJS error messages have the following properties:

- `message` (or `msg`)
- `filename`
- `line`

To see useful error messages, see [Why Use Pipeline?](docs/why-use-pipeline/README.md#why-use-pipeline).

## Using a Different UglifyJS

By default, `gulp-uglify` uses the version of UglifyJS installed as a dependency.
It's possible to configure the use of a different version using the "composer" entry point.

```javascript
var uglifyjs = require('uglify-js'); // can be a git checkout
                                     // or another module (such as `uglify-es` for ES6 support)
var composer = require('gulp-uglify/composer');
var pump = require('pump');

var minify = composer(uglifyjs, console);

gulp.task('compress', function (cb) {
  // the same options as described above
  var options = {};

  pump([
      gulp.src('lib/*.js'),
      minify(options),
      gulp.dest('dist')
    ],
    cb
  );
});
```

[travis-shield-img]: https://img.shields.io/travis/terinjokes/gulp-uglify/master.svg?label=Travis%20CI&style=flat-square
[travis-shield]: https://travis-ci.org/terinjokes/gulp-uglify
[appveyor-shield-img]: https://img.shields.io/appveyor/ci/terinjokes/gulp-uglify/master.svg?label=AppVeyor&style=flat-square
[appveyor-shield]: https://ci.appveyor.com/project/terinjokes/gulp-uglify
[npm-dl-shield-img]: https://img.shields.io/npm/dm/gulp-uglify.svg?style=flat-square
[npm-shield]: https://yarnpkg.com/en/package/gulp-uglify
[npm-v-shield-img]: https://img.shields.io/npm/v/gulp-uglify.svg?style=flat-square
[coveralls-shield-img]: https://img.shields.io/coveralls/terinjokes/gulp-uglify/master.svg?style=flat-square
[coveralls-shield]: https://coveralls.io/github/terinjokes/gulp-uglify
