# write-json-file [![Build Status](https://travis-ci.org/sindresorhus/write-json-file.svg?branch=master)](https://travis-ci.org/sindresorhus/write-json-file)

> Stringify and write JSON to a file [atomically](https://github.com/npm/write-file-atomic)

Creates directories for you as needed.


## Install

```
$ npm install write-json-file
```


## Usage

```js
const writeJsonFile = require('write-json-file');

(async () => {
	await writeJsonFile('foo.json', {foo: true});
})();
```


## API

### writeJsonFile(filePath, data, [options])

Returns a `Promise`.

### writeJsonFile.sync(filePath, data, [options])

#### options

Type: `Object`

##### indent

Type: `string` `number`<br>
Default: `'\t'`

Indentation as a string or number of spaces.<br>
Pass in `null` for no formatting.

##### detectIndent

Type: `boolean`<br>
Default: `false`

Detect indentation automatically if the file exists.

##### sortKeys

Type: `boolean` `Function`<br>
Default: `false`

Sort the keys recursively.<br>
Optionally pass in a [`compare`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) function.

##### replacer

Type: `Function`

Passed into [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter).

##### mode

Type: `number`<br>
Default: `0o666`

[Mode](https://en.wikipedia.org/wiki/File_system_permissions#Numeric_notation) used when writing the file.


## Related

- [load-json-file](https://github.com/sindresorhus/load-json-file) - Read and parse a JSON file
- [make-dir](https://github.com/sindresorhus/make-dir) - Make a directory and its parents if needed


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
