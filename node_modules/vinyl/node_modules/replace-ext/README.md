<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# replace-ext

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Replaces a file extension with another one.

## Usage

```js
var replaceExt = require('replace-ext');

var path = '/some/dir/file.js';
var newPath = replaceExt(path, '.coffee');

console.log(newPath); // /some/dir/file.coffee
```

## API

### `replaceExt(path, extension)`

Replaces the extension from `path` with `extension` and returns the updated path string.

Does not replace the extension if `path` is not a string or is empty.

## `replace-ext` for enterprise

Available as part of the Tidelift Subscription.

The maintainers of `replace-ext` and thousands of other packages are working with Tidelift to deliver commercial support and maintenance for the open source dependencies you use to build your applications. Save time, reduce risk, and improve code health, while paying the maintainers of the exact dependencies you use. [Learn more.][tidelift-url]

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/replace-ext.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/replace-ext
[npm-image]: https://img.shields.io/npm/v/replace-ext.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/replace-ext/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/replace-ext/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/replace-ext
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/replace-ext/master.svg?style=flat-square

[tidelift-url]: https://tidelift.com/subscription/pkg/npm-replace-ext?utm_source=npm-replace-ext&utm_medium=referral&utm_campaign=enterprise&utm_term=repo
<!-- prettier-ignore-end -->
