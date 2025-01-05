<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# glogg

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Global logging utility.

## Usage

```js
var getLogger = require('glogg');

var logger = getLogger('my-namespace');

// logs strings
logger.debug('The MOST verbose!');
logger.info('Some important info');
logger.warn('All the warnings to you');
logger.error('OH NO! SOMETHING HAPPENED!');

// supports util.format!
logger.info('%s style!', 'printf');

// log anything
logger.debug({ my: 'obj' });
logger.info([1, 2, 3]);

// somewhere else
logger.on('info', function (msg) {
  // do something with msg
});

// must be handled to avoid crashing process
logger.on('error', function (msg) {
  // now it won't crash
});
```

## API

**Note: This module makes no assumptions about the log levels and they will always
be emitted. If you are looking to filter some out, your listeners will need to have
extra logic.**

### getLogger([namespace])

Create a new logger at the given namespace (or the default if no namespace is provided).
Returns an augmented [`sparkles`](https://github.com/phated/sparkles) EventEmitter object
with 4 methods: `debug()`, `info()`, `warn()` and `error()`. When called, these methods emit
an event with the same name. If the first argument is a string, the arguments
are passed through node's `util.format()` before being emitted. Other parts
of a node program can get the logger by namespace and listen for the events to
be emitted.

#### logger.debug(msg, ...args)

Emits a `debug` event with the given `msg`.

If the first argument is a string, all arguments are passed to node's
`util.format()` before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

#### logger.info(msg, ...args)

Emits a `info` event with the given `msg`.

If the first argument is a string, all arguments are passed to node's
`util.format()` before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

#### logger.warn(msg, ...args)

Emits a `warn` event with the given `msg`.

If the first argument is a string, all arguments are passed to node's
`util.format()` before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

#### logger.error(msg, ...args)

Emits a `error` event with the given `msg`.

If the first argument is a string, all arguments are passed to node's
`util.format()` before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

**Note: You must handle this event in some way or the node process will crash
when an `error` event is emitted.**

#### logger.on(event, fn)

Standard API from node's `EventEmitter`. Use this to listen for events from
the logger methods.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/glogg.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/glogg
[npm-image]: https://img.shields.io/npm/v/glogg.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/glogg/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/actions/workflow/status/gulpjs/glogg/dev.yml?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/glogg
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/glogg/master.svg?style=flat-square
<!-- prettier-ignore-end -->
