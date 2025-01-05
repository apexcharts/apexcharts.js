<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# lead

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Sink your streams.

## Usage

```js
var { Readable, Transform } = require('streamx');
var sink = require('lead');

// Might be used as a Transform or Writeable
var maybeThrough = new Transform({
  transform(chunk, cb) {
    // processing
    cb(null, chunk);
  },
});

Readable.from(['hello', 'world'])
  // Sink it to behave like a Writeable
  .pipe(sink(maybeThrough));
```

## API

### `sink(stream)`

Takes a `stream` to sink and returns the same stream. Sets up event listeners to infer if the stream is being used as a `Transform` or `Writeable` stream and sinks it on `nextTick` if necessary. If the stream is being used as a `Transform` stream but becomes unpiped, it will be sunk. Respects `pipe`, `on('data')` and `on('readable')` handlers.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/lead.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/lead
[npm-image]: https://img.shields.io/npm/v/lead.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/lead/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/lead/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/lead
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/lead/master.svg?style=flat-square
<!-- prettier-ignore-end -->
