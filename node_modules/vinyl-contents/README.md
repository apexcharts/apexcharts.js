<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# vinyl-contents

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Utility to read the contents of a vinyl file.

## Usage

```js
/*
  WARNING: This is a very naive plugin implementation
  It is only meant for demonstation purposes.
  For a more complete implementation, see: https://github.com/gulp-community/gulp-pug
*/
var { Transform } = require('streamx');
var pug = require('pug');
var vinylContents = require('vinyl-contents');

function gulpPug(options) {
  return new Transform({
    transform: function (file, cb) {
      vinylContents(file, function (err, contents) {
        if (err) {
          return cb(err);
        }

        if (!contents) {
          return cb();
        }

        file.contents = pug.compile(contents.toString(), options)();
        cb(null, file);
      });
    },
  });
}
```

## API

### `vinylContents(file, callback)`

**Warning:** Only use this if interacting with a library that can **only** receive strings or buffers. This loads all streaming contents into memory which can cause unexpected results for your end-users.

Takes a Vinyl file and an error-first callback. Calls the callback with an error if one occur (or if the first argument is not a Vinyl file), or the file contents if no error occurs.

If the Vinyl contents are:

- A Buffer, will be returned directly.
- A Stream, will be buffered into a BufferList and returned.
- Empty, will be undefined.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/vinyl-contents.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/vinyl-contents
[npm-image]: https://img.shields.io/npm/v/vinyl-contents.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/vinyl-contents/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/vinyl-contents/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/vinyl-contents
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/vinyl-contents/master.svg?style=flat-square
<!-- prettier-ignore-end -->
