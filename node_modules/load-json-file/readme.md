# load-json-file [![Build Status](https://travis-ci.org/sindresorhus/load-json-file.svg?branch=master)](https://travis-ci.org/sindresorhus/load-json-file)

> Read and parse a JSON file

[Strips UTF-8 BOM](https://github.com/sindresorhus/strip-bom), uses [`graceful-fs`](https://github.com/isaacs/node-graceful-fs), and throws more [helpful JSON errors](https://github.com/sindresorhus/parse-json).


## Install

```
$ npm install load-json-file
```


## Usage

```js
const loadJsonFile = require('load-json-file');

(async () => {
	console.log(await loadJsonFile('foo.json'));
	//=> {foo: true}
})();
```


## API

### loadJsonFile(filePath, options?)

Returns a `Promise<unknown>` with the parsed JSON.

### loadJsonFile.sync(filepath, options?)

Returns the parsed JSON.

#### options

Type: `object`

##### beforeParse

Type: `Function`

Applies a function to the JSON string before parsing.

##### reviver

Type: `Function`

Prescribes how the value originally produced by parsing is transformed, before being returned. See the [`JSON.parse` docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#Using_the_reviver_parameter) for more.


## Related

- [write-json-file](https://github.com/sindresorhus/write-json-file) - Stringify and write JSON to a file atomically


---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-load-json-file?utm_source=npm-load-json-file&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
