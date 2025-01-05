<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# last-run

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Capture and retrieve the last time a function was run.

## Usage

```js
var lastRun = require('last-run');

function myFunc() {}

myFunc();
// capture the run after (or before) calling the function
lastRun.capture(myFunc);

// retrieve the last run time
lastRun(myFunc);
//-> outputs the Date.now() when capture was called
```

## API

### lastRun(fn, [timeResolution]) => [Timestamp]

Takes a function (`fn`) and returns a timestamp of the last time the function was captured.

Returns undefined if the function has not been captured.

The timestamp is always given in millisecond but the time resolution can be reduced (rounded down).
The use case is to be able to compare a build time to a file time attribute.
On some file systems, `fs.stat` time attributes like `mtime` might have one second precision.

### lastRun.capture(fn, [timestamp])

Takes a function (`fn`) and captures the current timestamp with `Date.now()`.
If passed the optional timestamp, captures that time instead of `Date.now()`.
The captured timestamp can then be retrieved using the `lastRun` function.

### lastRun.release(fn)

Takes a function (`fn`) and removes the last run timestamp for it.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/last-run.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/last-run
[npm-image]: https://img.shields.io/npm/v/last-run.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/last-run/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/last-run/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/last-run
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/last-run/master.svg?style=flat-square
<!-- prettier-ignore-end -->
