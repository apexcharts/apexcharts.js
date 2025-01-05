<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# replace-homedir

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Replace user home in a string with another string. Useful for tildifying a path.

## Usage

```js
var replaceHomedir = require('replace-homedir');

var shortPath = replaceHomedir('/Users/phated/myProject', '~');
// shortPath === '~/myProject'
```

## API

### `replaceHomedir(path, replacement)`

Takes a string `path` as the first argument and a string or function `replacement` as the second argument. If the `path` is absolute and begins with the User's homedir, the homedir portion of the path is replaced with `replacement` using String#replace.

If `path` is not a string, the function will throw.

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/replace-homedir.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/replace-homedir
[npm-image]: https://img.shields.io/npm/v/replace-homedir.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/replace-homedir/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/replace-homedir/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/replace-homedir
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/replace-homedir/master.svgstyle=flat-square
<!-- prettier-ignore-end -->
