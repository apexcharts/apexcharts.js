# p-pipe [![Build Status](https://travis-ci.com/sindresorhus/p-pipe.svg?branch=master)](https://travis-ci.com/sindresorhus/p-pipe)

> Compose promise-returning & async functions into a reusable pipeline

## Install

```
$ npm install p-pipe
```

## Usage

```js
const pPipe = require('p-pipe');

const addUnicorn = async string => `${string} Unicorn`;
const addRainbow = async string => `${string} Rainbow`;

const pipeline = pPipe(addUnicorn, addRainbow);

(async () => {
	console.log(await pipeline('❤️'));
	//=> '❤️ Unicorn Rainbow'
})();
```

## API

### pPipe(input…)

The `input` functions are applied from left to right.

#### input

Type: `Function`

Expected to return a `Promise` or any value.

## Related

- [p-each-series](https://github.com/sindresorhus/p-each-series) - Iterate over promises serially
- [p-series](https://github.com/sindresorhus/p-series) - Run promise-returning & async functions in series
- [p-waterfall](https://github.com/sindresorhus/p-waterfall) - Run promise-returning & async functions in series, each passing its result to the next
- [More…](https://github.com/sindresorhus/promise-fun)

---

<div align="center">
	<b>
		<a href="https://tidelift.com/subscription/pkg/npm-p-pipe?utm_source=npm-p-pipe&utm_medium=referral&utm_campaign=readme">Get professional support for this package with a Tidelift subscription</a>
	</b>
	<br>
	<sub>
		Tidelift helps make open source sustainable for maintainers while giving companies<br>assurances about security, maintenance, and licensing for their dependencies.
	</sub>
</div>
