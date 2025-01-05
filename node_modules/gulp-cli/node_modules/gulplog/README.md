<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# gulplog

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Logger for gulp and gulp plugins

## Usage

```js
var logger = require('gulplog');

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
```

## API

Logging (and level of logging) is controlled by [`gulp-cli`][gulp-cli-url]

#### logger.debug(msg, ...args)

Highest log level. Typically used for debugging purposes.

If the first argument is a string, all arguments are passed to node's
[`util.format()`][util-format-url] before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

#### logger.info(msg, ...args)

Standard log level. Typically used for user information.

If the first argument is a string, all arguments are passed to node's
[`util.format()`][util-format-url] before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

#### logger.warn(msg, ...args)

Warning log level. Typically used for warnings.

If the first argument is a string, all arguments are passed to node's
[`util.format()`][util-format-url] before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

#### logger.error(msg, ...args)

Error log level. Typically used when things went horribly wrong.

If the first argument is a string, all arguments are passed to node's
[`util.format()`][util-format-url] before being emitted.

If the first argument is not a string, all arguments will be emitted directly.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/gulplog.svg?style=flat-square
[npm-url]: https://npmjs.org/package/gulplog
[npm-image]: https://img.shields.io/npm/v/gulplog.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/gulplog/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/actions/workflow/status/gulpjs/gulplog/dev.yml?branch=master&style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/gulplog
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/gulplog/master.svg?style=flat-square
<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->
[gulp-cli-url]: https://github.com/gulpjs/gulp-cli
[util-format-url]: https://nodejs.org/docs/latest/api/util.html#util_util_format_format
<!-- prettier-ignore-end -->
