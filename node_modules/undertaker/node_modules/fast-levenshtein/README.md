# fast-levenshtein - Levenshtein algorithm in Javascript

[![Build Status](https://secure.travis-ci.org/hiddentao/fast-levenshtein.png)](http://travis-ci.org/hiddentao/fast-levenshtein)
[![NPM module](https://badge.fury.io/js/fast-levenshtein.png)](https://badge.fury.io/js/fast-levenshtein)
[![NPM downloads](https://img.shields.io/npm/dm/fast-levenshtein.svg?maxAge=2592000)](https://www.npmjs.com/package/fast-levenshtein)
[![Follow on Twitter](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Follow&maxAge=2592000)](https://twitter.com/hiddentao)

A Javascript implementation of the [Levenshtein algorithm](http://en.wikipedia.org/wiki/Levenshtein_distance) with locale-specific collator support. This uses [fastest-levenshtein](https://github.com/ka-weihe/fastest-levenshtein) under the hood.

## Features

* Works in node.js and in the browser.
* Locale-sensitive string comparisons if needed.
* Comprehensive test suite.

## Installation

```bash
$ npm install fast-levenshtein
```
**CDN**

The latest version is now also always available at https://npm-cdn.com/pkg/fast-levenshtein/ 

## Examples

**Default usage**

```javascript
var levenshtein = require('fast-levenshtein');

var distance = levenshtein.get('back', 'book');   // 2
var distance = levenshtein.get('我愛你', '我叫你');   // 1
```

**Locale-sensitive string comparisons**

It supports using [Intl.Collator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Collator) for locale-sensitive  string comparisons:

```javascript
var levenshtein = require('fast-levenshtein');

levenshtein.get('mikailovitch', 'Mikhaïlovitch', { useCollator: true});
// 1
```

## Building and Testing

To build the code and run the tests:

```bash
$ npm install -g grunt-cli
$ npm install
$ npm run build
```

## Performance

This uses [fastest-levenshtein](https://github.com/ka-weihe/fastest-levenshtein) under the hood.

## Contributing

If you wish to submit a pull request please update and/or create new tests for any changes you make and ensure the grunt build passes.

See [CONTRIBUTING.md](https://github.com/hiddentao/fast-levenshtein/blob/master/CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE.md](https://github.com/hiddentao/fast-levenshtein/blob/master/LICENSE.md)
