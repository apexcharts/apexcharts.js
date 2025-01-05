<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# sparkles

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Namespaced global event emitter

## Usage

Sparkles exports a function that returns a singleton `EventEmitter`.
This EE can be shared across your application, whether or not node loads
multiple copies.

Note: If you put an event handler in a file in your application, that file must be loaded in via an import somewhere in your application, even if it's not directly being used. Otherwise, it will not be loaded into memory.

```js
var sparkles = require('sparkles')(); // make sure to call the function

sparkles.on('my-event', function (evt) {
  console.log('my-event handled', evt);
});

sparkles.emit('my-event', { my: 'event' });
```

## API

### sparkles(namespace)

Returns an EventEmitter that is shared amongst the provided namespace. If no namespace
is provided, returns a default EventEmitter.

### sparkles.exists(namespace);

Checks whether a namespace exists and returns true or false.

## Why the name?

This is a "global emitter"; shortened: "glitter" but it was already taken; so we got sparkles instead :smile:

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/sparkles.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/sparkles
[npm-image]: https://img.shields.io/npm/v/sparkles.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/sparkles/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/actions/workflow/status/gulpjs/sparkles/dev.yml?branch=master&style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/sparkles
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/sparkles/master.svg?style=flat-square
<!-- prettier-ignore-end -->
