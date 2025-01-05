<p align="center">
  <a href="http://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
</p>

# copy-props

[![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url] [![Build Status][ci-image]][ci-url] [![Coveralls Status][coveralls-image]][coveralls-url]

Copy properties between two objects deeply.

## Install

To install from npm:

```sh
$ npm i copy-props --save
```

## Usage

Copy _src_ to _dst_ simply (and return _dst_) :

```js
const copyProps = require('copy-props');

var src = { a: 1, b: { b1: 'bbb' }, c: 'ccc' };
var dst = { a: 2, b: { b1: 'xxx', b2: 'yyy' } };

copyProps(src, dst);
// => { a: 1, b: { b1: 'bbb', b2: 'yyy' }, c: 'ccc' }
```

Copy _src_ to _dst_ with property mapping (and return _dst_) :

```js
const copyProps = require('copy-props');

var src = { a: 1, b: { b1: 'bbb' }, c: 'ccc', d: 'ddd' };
var dst = { f: { a: 2, b1: 'xxx', b2: 'yyy' }, e: 'zzz' };

copyProps(src, dst, {
  a: 'f.a',
  'b.b1': 'f.b1',
  'b.b2': 'f.b2',
  c: 'f.c',
});
// => { f: { a: 1, b1: 'bbb', b2: 'yyy', c: 'ccc' }, e: 'zzz' }
```

Copy _src_ to _dst_ with convert function (and return _dst_) :

```js
const copyProps = require('copy-props');

var src = { a: 1, b: { b1: 'bbb' } };
var dst = { a: 0 };

copyProps(src, dst, function (srcInfo) {
  if (srcInfo.keyChain === 'a') {
    return srcInfo.value * 2;
  }
  if (srcInfo.keyChain === 'b.b1') {
    return srcInfo.value.toUpperCase();
  }
});
// => { a: 2, b: { b1: 'BBB' } }
```

Can use an array instead of a map as property mapping :

```js
const copyProps = require('copy-props');

var src = { a: 1, b: { c: 'CCC' }, d: { e: 'EEE' } };
var dst = { a: 9, b: { c: 'xxx' }, d: { e: 'yyy' } };
var fromto = ['b.c', 'd.e'];
copyProps(src, dst, fromto);
// => { a: 9, b: { c: 'CCC' }, d: { e: 'EEE' } }
```

Can copy reversively (from _dst_ to _src_) by reverse flag (and return _src_):

```js
const copyProps = require('copy-props');

var src = { a: 1, b: { b1: 'bbb' }, c: 'ccc' };
var dst = { a: 2, b: { b1: 'xxx', b2: 'yyy' } };

copyProps(src, dst, true);
// => { a: 2, b: { b1: 'xxx', b2: 'yyy' }, c: 'ccc' }
```

```js
const copyProps = require('copy-props');

var src = { a: 1, b: { b1: 'bbb' }, c: 'ccc', d: 'ddd' };
var dst = { f: { a: 2, b1: 'xxx', b2: 'yyy' }, e: 'zzz' };

copyProps(
  src,
  dst,
  {
    a: 'f.a',
    'b.b2': 'f.b2',
    c: 'f.c',
  },
  true
);
// => { a: 2, b: { b1: 'bbb', b2: 'yyy' }, c: 'ccc', d: 'ddd' }
```

If a value of source property is undefined (when not using converter), or a result of converter is undefined (when using converter), the value is not copied.

```js
const copyProps = require('copy-props');

var src = { a: 'A', b: undefined, c: null, d: 1 };
var dst = { a: 'a', b: 'b', c: 'c' };

copyProps(src, dst, function (srcInfo) {
  if (srcInfo.keyChain === 'd') {
    return undefined;
  } else {
    return srcInfo.value;
  }
});
// => { a: 'A', b: 'b', c: null }
```

You can operate the parent node object directly in converter.

```js
const copyProps = require('copy-props');

var src = { a: 1, b: 2 };
var dst = {};

copyProps(src, dst, function (srcInfo, dstInfo) {
  Object.defineProperty(dstInfo.parent, dstInfo.key, {
    writable: false,
    enumerable: true,
    configurable: false,
    value: srcInfo.value * 2,
  });
}); // => { a: 2, b: 4 }

dst; // => { a: 2, b: 4 }
dst.a = 9;
dst; // -> { a: 2, b: 4 }
```

## API

### <u>copyProps(src, dst [, fromto] [, converter] [, reverse]) => object</u>

Copy properties of _src_ to _dst_ deeply.
If _fromto_ is given, it is able to copy between different properties.
If _converter_ is given, it is able to convert the terminal values.

#### Parameters:

| Parameter   |        Type         | Description                                                                                                                                                         |
| :---------- | :-----------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| _src_       |       object        | A source object of copy.                                                                                                                                            |
| _dst_       |       object        | A destinate object of copy.                                                                                                                                         |
| _fromto_    | object &#124; array | An object mapping properties between _src_ and _dst_. (Optional)                                                                                                    |
| _converter_ |      function       | A function to convert terminal values in _src_. (Optional)                                                                                                          |
| _reverse_   |       boolean       | True, if copying reversively from dst to src and returns src object. `fromto` is also reversively used from value to key. This default value is `false`. (Optional) |

#### Returns:

_dst_ object after copying.

**Type:** object

- **Format of <i>fromto</i>**

  _fromto_ is a non-nested key-value object. And the *key*s are property key chains of _src_ and the *value*s are property key chains of _dst_.
  The key chain is a string which is concatenated property keys on each level with dots, like `'aaa.bbb.ccc'`.

  The following example copys the value of `src.aaa.bbb.ccc` to `dst.xxx.yyy`.

  ```js
  copyProps(src, dst, {
    'aaa.bbb.ccc': 'xxx.yyy',
  });
  ```

  _fromto_ can be an array. In that case, the array works as a map which has pairs of same key and value.

- **API of <i>converter</i>**

  **<u>converter(srcInfo, dstInfo) : Any</u>**

  _converter_ is a function to convert terminal values of propeerties of _src_.

  **Parameters:**

  | Parameter |  Type  | Description                                                       |
  | :-------- | :----: | :---------------------------------------------------------------- |
  | _srcInfo_ | object | An object which has informations about the current node of _src_. |
  | _dstInfo_ | object | An object which has informations about the current node of _dst_. |

  **Return:**

  The converted value to be set as a destination property value. If this value is undefined, the destination property is not set to the destination node object.

  **Type:** _Any_

  - **Properties of <i>srcInfo</i> and <i>dstInfo</i>**

    _srcInfo_ and _dstInfo_ has same properties, as follows:

    | Property   |  Type  | Description                                             |
    | :--------- | :----: | :------------------------------------------------------ |
    | _value_    | _Any_  | The value of the current node.                          |
    | _key_      | string | The key name of the current node.                       |
    | _keyChain_ | string | The full key of the current node concatenated with dot. |
    | _depth_    | number | The depth of the current node.                          |
    | _parent_   | object | The parent node of the current node.                    |

## License

MIT

<!-- prettier-ignore-start -->
[downloads-image]: https://img.shields.io/npm/dm/copy-props.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/copy-props
[npm-image]: https://img.shields.io/npm/v/copy-props.svg?style=flat-square

[ci-url]: https://github.com/gulpjs/copy-props/actions?query=workflow:dev
[ci-image]: https://img.shields.io/github/workflow/status/gulpjs/copy-props/dev?style=flat-square

[coveralls-url]: https://coveralls.io/r/gulpjs/copy-props
[coveralls-image]: https://img.shields.io/coveralls/gulpjs/copy-props/master.svg
<!-- prettier-ignore-end -->
