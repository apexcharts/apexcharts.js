<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# bach

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Compose your async functions with elegance.

## Usage

With `bach`, it is very easy to compose async functions to run in series or parallel.

```js
var bach = require('bach');

function fn1(cb) {
  cb(null, 1);
}

function fn2(cb) {
  cb(null, 2);
}

function fn3(cb) {
  cb(null, 3);
}

var seriesFn = bach.series(fn1, fn2, fn3);
// fn1, fn2, and fn3 will be run in series
seriesFn(function (err, res) {
  if (err) {
    // in this example, err is undefined
    // handle error
  }
  // handle results
  // in this example, res is [1, 2, 3]
});

var parallelFn = bach.parallel(fn1, fn2, fn3);
// fn1, fn2, and fn3 will be run in parallel
parallelFn(function (err, res) {
  if (err) {
    // in this example, err is undefined
    // handle error
  }
  // handle results
  // in this example, res is [1, 2, 3]
});
```

Since the composer functions return a function, you can combine them.

```js
var combinedFn = bach.series(fn1, bach.parallel(fn2, fn3));
// fn1 will be executed before fn2 and fn3 are run in parallel
combinedFn(function (err, res) {
  if (err) {
    // in this example, err is undefined
    // handle error
  }
  // handle results
  // in this example, res is [1, [2, 3]]
});
```

Functions are called with [async-done], so you can return a stream, promise, observable or child process. See [`async-done` completion and error resolution][completions] for more detail.

```js
// streams
var fs = require('fs');

function streamFn1() {
  return fs
    .createReadStream('./example')
    .pipe(fs.createWriteStream('./example'));
}

function streamFn2() {
  return fs
    .createReadStream('./example')
    .pipe(fs.createWriteStream('./example'));
}

var parallelStreams = bach.parallel(streamFn1, streamFn2);
parallelStreams(function (err) {
  if (err) {
    // in this example, err is undefined
    // handle error
  }
  // all streams have emitted an 'end' or 'close' event
});
```

```js
// promises
function promiseFn1() {
  return Promise.resolve(1);
}

function promiseFn2() {
  return Promise.resolve(2);
}

var parallelPromises = bach.parallel(promiseFn1, promiseFn2);
parallelPromises(function (err, res) {
  if (err) {
    // in this example, err is undefined
    // handle error
  }
  // handle results
  // in this example, res is [1, 2]
});
```

All errors are caught in a [domain] and passed to the final callback as the first argument.

```js
function success(cb) {
  setTimeout(function () {
    cb(null, 1);
  }, 500);
}

function error() {
  throw new Error('Thrown Error');
}

var errorThrownFn = bach.parallel(error, success);
errorThrownFn(function (err, res) {
  if (err) {
    // handle error
    // in this example, err is an error caught by the domain
  }
  // handle results
  // in this example, res is [undefined]
});
```

When an error happens in a parallel composition, the callback will be called as soon as the error happens.
If you want to continue on error and wait until all functions have finished before calling the callback, use `settleSeries` or `settleParallel`.

```js
function success(cb) {
  setTimeout(function () {
    cb(null, 1);
  }, 500);
}

function error(cb) {
  cb(new Error('Async Error'));
}

var parallelSettlingFn = bach.settleParallel(success, error);
parallelSettlingFn(function (err, res) {
  // all functions have finished executing
  if (err) {
    // handle error
    // in this example, err is an error passed to the callback
  }
  // handle results
  // in this example, res is [1]
});
```

## API

### `series(fns..., [options])`

Takes a variable amount of functions (`fns`) to be called in series when the returned function is
called. Optionally, takes an [options](#options) object as the last argument.

Returns an `invoker(cb)` function to be called to start the serial execution. The invoker function takes a callback (`cb`) with the `function(error, results)` signature.

If all functions complete successfully, the callback function will be called with all `results` as the second argument.

If an error occurs, execution will stop and the error will be passed to the callback function as the first parameter. The error parameter will always be a single error.

### `parallel(fns..., [options])`

Takes a variable amount of functions (`fns`) to be called in parallel when the returned function is
called. Optionally, takes an [options](#options) object as the last argument.

Returns an `invoker(cb)` function to be called to start the parallel execution. The invoker function takes a callback (`cb`) with the `function(error, results)` signature.

If all functions complete successfully, the callback function will be called with all `results` as the second argument.

If an error occurs, the callback function will be called with the error as the first parameter. Any async functions that have not completed, will still complete, but their results will **not** be available. The error parameter will always be a single error.

### `settleSeries(fns..., [options])`

Takes a variable amount of functions (`fns`) to be called in series when the returned function is
called. Optionally, takes an [options](#options) object as the last argument.

Returns an `invoker(cb)` function to be called to start the serial execution. The invoker function takes a callback (`cb`) with the `function(error, results)` signature.

All functions will always be called and the callback will receive all settled errors and results. If any errors occur, the error parameter will be an array of errors.

### `settleParallel(fns..., [options])`

Takes a variable amount of functions (`fns`) to be called in parallel when the returned function is
called. Optionally, takes an [options](#options) object as the last argument.

Returns an `invoker(cb)` function to be called to start the parallel execution. The invoker function takes a callback (`cb`) with the `function(error, results)` signature.

All functions will always be called and the callback will receive all settled errors and results. If any errors occur, the error parameter will be an array of errors.

### `options`

The `options` object is primarily used for specifying functions that give insight into the lifecycle of each function call. The possible extension points are `create`, `before`, `after` and `error`. If an extension point is not specified, it defaults to a no-op function.

The `options` object for `parallel` and `settleParallel` also allows specifying `concurrency` in which to run your functions. By default, your functions will run at maximum concurrency.

##### `options.concurrency`

Limits the amount of functions allowed to run at a given time.

##### `options.create(fn, index)`

Called at the very beginning of each function call with the function (`fn`) being executed and the `index` from the array/arguments. If `create` returns a value (`storage`), it is passed to the `before`, `after` and `error` extension points.

If a value is not returned, an empty object is used as `storage` for each other extension point.

This is useful for tracking information across an iteration.

##### `options.before(storage)`

Called immediately before each function call with the `storage` value returned from the `create` extension point.

##### `options.after(result, storage)`

Called immediately after each function call with the `result` of the function and the `storage` value returned from the `create` extension point.

##### `options.error(error, storage)`

Called immediately after a failed function call with the `error` of the function and the `storage` value returned from the `create` extension point.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/bach.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/bach
[npm-image]: https://img.shields.io/npm/v/bach.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/bach/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/bach/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/bach
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/bach.svg?style=flat-square
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
[domain]: https://nodejs.org/api/domain.html
[async-done]: https://github.com/gulpjs/async-done
[completions]: https://github.com/gulpjs/async-done#completion-and-error-resolution
<!-- prettier-ignore-end -->
