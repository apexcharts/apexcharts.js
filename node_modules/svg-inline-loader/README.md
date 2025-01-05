[![npm][npm]][npm-url]
[![deps][deps]][deps-url]
[![test][test]][test-url]
[![coverage][cover]][cover-url]
[![chat][chat]][chat-url]

<div align="center">
  <!-- replace with accurate logo e.g from https://worldvectorlogo.com/ -->
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" vspace="" hspace="25"
      src="https://cdn.rawgit.com/webpack/media/e7485eb2/logo/icon.svg">
  </a>
  <h1>SVG Inline Loader for Webpack</h1>
  <p>This Webpack loader inlines SVG as module. If you use Adobe suite or Sketch to export SVGs, you will get auto-generated, unneeded crusts. This loader removes it for you, too.<p>
</div>

<h2 align="center">Install</h2>

```bash
npm install svg-inline-loader --save-dev
```

<h2 align="center">Configuration</h2>

Simply add configuration object to `module.loaders` like this.

```javascript
    {
        test: /\.svg$/,
        loader: 'svg-inline-loader'
    }
```

warning: You should configure this loader only once via `module.loaders` or `require('!...')`. See [#15](https://github.com/webpack-contrib/svg-inline-loader/issues/15) for detail.

<h2 align="center">Query Options</h2>

#### `removeTags: boolean`

Removes specified tags and its children. You can specify tags by setting `removingTags` query array.

default: `removeTags: false`

#### `removingTags: [...string]`

warning: this won't work unless you specify `removeTags: true`

default: `removingTags: ['title', 'desc', 'defs', 'style']`

#### `warnTags: [...string]`

warns about tags, ex: ['desc', 'defs', 'style']

default: `warnTags: []`

#### `removeSVGTagAttrs: boolean`

Removes `width` and `height` attributes from `<svg />`.

default: `removeSVGTagAttrs: true`

#### `removingTagAttrs: [...string]`

Removes attributes from inside the `<svg />`.

default: `removingTagAttrs: []`

#### `warnTagAttrs: [...string]`

Warns to console about attributes from inside the `<svg />`.

default: `warnTagAttrs: []`
#### `classPrefix: boolean || string`

Adds a prefix to class names to avoid collision across svg files.

default: `classPrefix: false`

#### `idPrefix: boolean || string`

Adds a prefix to ids to avoid collision across svg files.

default: `idPrefix: false`

<h2 align="center">Example Usage</h2>

```js
// Using default hashed prefix (__[hash:base64:7]__)
var logoTwo = require('svg-inline-loader?classPrefix!./logo_two.svg');

// Using custom string
var logoOne = require('svg-inline-loader?classPrefix=my-prefix-!./logo_one.svg');

// Using custom string and hash
var logoThree = require('svg-inline-loader?classPrefix=__prefix-[sha512:hash:hex:5]__!./logo_three.svg');
```
See [loader-utils](https://github.com/webpack/loader-utils#interpolatename) for hash options.

Preferred usage is via a `module.loaders`:
```js
    {
        test: /\.svg$/,
        loader: 'svg-inline-loader?classPrefix'
    }
```

<h2 align="center">Maintainers</h2>

<table>
  <tbody>
    <tr>
      <td align="center">
        <img width="150" height="150"
        src="https://avatars3.githubusercontent.com/u/166921?v=3&s=150">
        </br>
        <a href="https://github.com/bebraw">Juho Vepsäläinen</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://avatars2.githubusercontent.com/u/8420490?v=3&s=150">
        </br>
        <a href="https://github.com/d3viant0ne">Joshua Wiens</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://avatars3.githubusercontent.com/u/533616?v=3&s=150">
        </br>
        <a href="https://github.com/SpaceK33z">Kees Kluskens</a>
      </td>
      <td align="center">
        <img width="150" height="150"
        src="https://avatars3.githubusercontent.com/u/3408176?v=3&s=150">
        </br>
        <a href="https://github.com/TheLarkInn">Sean Larkin</a>
      </td>
    </tr>
  <tbody>
</table>

[npm]: https://img.shields.io/npm/v/svg-inline-loader.svg
[npm-url]: https://npmjs.com/package/svg-inline-loader

[deps]: https://david-dm.org/webpack-contrib/svg-inline-loader.svg
[deps-url]: https://david-dm.org/webpack-contrib/svg-inline-loader

[chat]: https://img.shields.io/badge/gitter-webpack%2Fwebpack-brightgreen.svg
[chat-url]: https://gitter.im/webpack/webpack

[test]: https://travis-ci.org/webpack-contrib/svg-inline-loader.svg?branch=master
[test-url]: https://travis-ci.org/webpack-contrib/svg-inline-loader

[cover]: https://codecov.io/gh/webpack-contrib/svg-inline-loader/branch/master/graph/badge.svg
[cover-url]: https://codecov.io/gh/webpack-contrib/svg-inline-loader
