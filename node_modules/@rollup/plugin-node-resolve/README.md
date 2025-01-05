[npm]: https://img.shields.io/npm/v/@rollup/plugin-node-resolve
[npm-url]: https://www.npmjs.com/package/@rollup/plugin-node-resolve
[size]: https://packagephobia.now.sh/badge?p=@rollup/plugin-node-resolve
[size-url]: https://packagephobia.now.sh/result?p=@rollup/plugin-node-resolve

[![npm][npm]][npm-url]
[![size][size]][size-url]
[![libera manifesto](https://img.shields.io/badge/libera-manifesto-lightgrey.svg)](https://liberamanifesto.com)

# @rollup/plugin-node-resolve

🍣 A Rollup plugin which locates modules using the [Node resolution algorithm](https://nodejs.org/api/modules.html#modules_all_together), for using third party modules in `node_modules`

## Requirements

This plugin requires an [LTS](https://github.com/nodejs/Release) Node version (v8.0.0+) and Rollup v1.20.0+.

## Install

Using npm:

```console
npm install @rollup/plugin-node-resolve --save-dev
```

## Usage

Create a `rollup.config.js` [configuration file](https://www.rollupjs.org/guide/en/#configuration-files) and import the plugin:

```js
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    dir: 'output',
    format: 'cjs'
  },
  plugins: [resolve()]
};
```

Then call `rollup` either via the [CLI](https://www.rollupjs.org/guide/en/#command-line-reference) or the [API](https://www.rollupjs.org/guide/en/#javascript-api).

## Options

### `mainFields`

Type: `Array[String]`<br>
Default: `['module', 'main']`

The fields to scan in a package.json to determine the entry point if this list contains "browser", overrides specified in "pkg.browser" will be used

### `module`

Type: `Boolean`<br>
Default: `true`

DEPRECATED: use "mainFields" instead
Use "module" field for ES6 module if possible

### `jsnext`

Type: `Boolean`<br>
Default: `false`

DEPRECATED: use "mainFields" instead
Use "jsnext:main" if possible, legacy field pointing to ES6 module in third-party libraries, deprecated in favor of "pkg.module", see: https://github.com/rollup/rollup/wiki/pkg.module

### `main`

Type: `Boolean`<br>
Default: `true`

DEPRECATED: use "mainFields" instead
Use "main" field or index.js, even if it's not an ES6 module (needs to be converted from CommonJS to ES6) – see https://github.com/rollup/rollup-plugin-commonjs

### `browser`

Type: `Boolean`<br>
Default: `false`

Some package.json files have a "browser" field which specifies alternative files to load for people bundling for the browser. If that's you, either use this option or add "browser" to the "mainFields" option, otherwise pkg.browser will be ignored

### `extensions`

Type: `Array[String]`<br>
Default: `['.mjs', '.js', '.json', '.node']`

Resolve extensions other than .js in the order specified.

### `preferBuiltins`

Type: `Boolean`<br>
Default: `true`

Whether to prefer built-in modules (e.g. `fs`, `path`) or local ones with the same names

### `jail`

Type: `String`<br>
Default: `'/'`

Lock the module search in this path (like a chroot). Modules defined outside this path will be marked as external.

### `only`

Type: `Array[String|RegExp]`<br>
Default: `null`

Example: `only: ['some_module', /^@some_scope\/.*$/]`

### `modulesOnly`

Type: `Boolean`<br>
Default: `false`

If true, inspect resolved files to check that they are ES2015 modules.

### `dedupe`

Type: `Array[String]`<br>
Default: `[]`

Force resolving for these modules to root's node_modules that helps to prevent bundling the same package multiple times if package is imported from dependencies.

```
dedupe: [ 'react', 'react-dom' ]
```

### `customResolveOptions`

Type: `Boolean`<br>
Default: `null`

Any additional options that should be passed through to node-resolve.

```
customResolveOptions: {
  moduleDirectory: 'js_modules'
}
```

## Using with rollup-plugin-commonjs

Since most packages in your node_modules folder are probably legacy CommonJS rather than JavaScript modules, you may need to use [rollup-plugin-commonjs](https://github.com/rollup/rollup-plugin-commonjs):

```js
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'main.js',
  output: {
    file: 'bundle.js',
    format: 'iife',
    name: 'MyModule'
  },
  plugins: [resolve(), commonjs()]
};
```

## Resolving Built-Ins (like `fs`)

This plugin won't resolve any builtins (e.g. `fs`). If you need to resolve builtins you can install local modules and set `preferBuiltins` to `false`, or install a plugin like [rollup-plugin-node-builtins](https://github.com/calvinmetcalf/rollup-plugin-node-builtins) which provides stubbed versions of these methods.

If you want to silence warnings about builtins, you can add the list of builtins to the `externals` option; like so:

```js
import resolve from '@rollup/plugin-node-resolve';
import builtins from 'builtin-modules'
export default ({
  input: ...,
  plugins: [resolve()],
  external: builtins,
  output: ...
})
```

## Meta

[CONTRIBUTING](/.github/CONTRIBUTING.md)

[LICENSE (MIT)](/LICENSE)
