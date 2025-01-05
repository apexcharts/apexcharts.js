# write-pkg [![Build Status](https://travis-ci.org/sindresorhus/write-pkg.svg?branch=master)](https://travis-ci.org/sindresorhus/write-pkg)

> Write a `package.json` file

Writes atomically and creates directories for you as needed. Sorts dependencies when writing. Preserves the indentation if the file already exists.


## Install

```
$ npm install write-pkg
```


## Usage

```js
const path = require('path');
const writePackage = require('write-pkg');

(async () => {
	await writePackage({foo: true});
	console.log('done');

	await writePackage(__dirname, {foo: true});
	console.log('done');

	await writePackage(path.join('unicorn', 'package.json'), {foo: true});
	console.log('done');
})();
```


## API

### writePackage([path], data, [options])

Returns a `Promise`.

### writePackage.sync([path], data, [options])

#### path

Type: `string`<br>
Default: `process.cwd()`

Path to where the `package.json` file should be written or its directory.

#### options

Type: `object`

##### normalize

Type: `boolean`<br>
Default: `true`

Remove empty `dependencies`, `devDependencies`, `optionalDependencies` and `peerDependencies` objects.


## Related

- [read-pkg](https://github.com/sindresorhus/read-pkg) - Read a `package.json` file
- [write-json-file](https://github.com/sindresorhus/write-json-file) - Stringify and write JSON to a file atomically


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
