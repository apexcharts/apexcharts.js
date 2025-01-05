<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# mute-stdout

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Mute and unmute stdout.

## Usage

```js
var stdout = require('mute-stdout');

stdout.mute();

console.log('will not print');

stdout.unmute();

console.log('will print');
```

## API

### mute()

Mutes the `process.stdout` stream by replacing the `write` method with a no-op function.

### unmute()

Unmutes the `process.stdout` stream by restoring the original `write` method.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: http://img.shields.io/npm/dm/mute-stdout.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/mute-stdout
[npm-image]: http://img.shields.io/npm/v/mute-stdout.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/mute-stdout/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/mute-stdout/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/mute-stdout
[coveralls-image]: http://img.shields.io/coveralls/gulpjs/mute-stdout/master.svg
<!-- prettier-ignore-end -->
